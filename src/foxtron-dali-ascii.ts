import { 
  DALICommand, 
  DALIResponse, 
  DALICommandCode } from "./dali-command"
import type { DALICommandObj } from './dali-command'
import { 
  FoxtronDALIASCIIRequestType, 
  FoxtronDALIASCIIResponseType, 
  FoxtronDALIASCIISpecMessage, 
  FoxtronDALIASCIIResponseEvent,
  BootMethod, 
  FoxtronDALIASCIITransportEvent} from './foxtron-dali-ascii-types'
import type { FoxtronDALIASCIIRequest, FoxtronDALIASCIIResponse, FoxtronDALIASCIIConfig, FoxtronDALIASCIITransport } from './foxtron-dali-ascii-types'
import { EventEmitter } from 'events'

const BOOT_WAITING_TIME_MS = 5000

type RequesInProcess = {
  request: FoxtronDALIASCIIRequest,
  promise: Promise<FoxtronDALIASCIIResponse>,
  resolve?: (value: FoxtronDALIASCIIResponse | PromiseLike<FoxtronDALIASCIIResponse>) => void
  reject?: (reason?: any) => void,
  counter: number
}

export const SOH = String.fromCharCode(0x01)
export const ETB = String.fromCharCode(0x17)

export class FoxtronDaliAscii extends EventEmitter {

  public static SpecialDALIRequest(code: DALICommandCode, value?: number ): FoxtronDALIASCIIRequest {
    let doubleSend = false
    if (code === DALICommandCode.Initialize || code === DALICommandCode.Randomize) {
      doubleSend = true
    }
    if (!value) {
      value = 0
    }
    return {
      type: FoxtronDALIASCIIRequestType.DistinctSend,
      daliCommand: new DALICommand(code, undefined, value)
    }
  }

  private static _MessageTypeStr(type: FoxtronDALIASCIIRequestType): string {
    let out = ''
    if (type < 0x10) {
      out = '0'
    }
    return out + type.toString(16).toUpperCase()
  }

  private static _PriorityStr(req: FoxtronDALIASCIIRequest): string {
    if (!req.priority || (req.priority as number) > 5) {
      return '00'
    }
    return '0' + (req.priority as number).toString(16).toUpperCase()
  }

  private static _DistinctParam(req: FoxtronDALIASCIIRequest): string {
    let val = 0
    if (req.doubleSend) {
      val += 1
    }
    if (req.sequence) {
      val += 2
    }
    return '0' + val.toString(16).toUpperCase()
  }

  private static _ItemIndexStr(req: FoxtronDALIASCIIRequest): string {
    let val = 0
    if (req.itemIndex) {
      val = req.itemIndex as number
    }
    let ret = ''
    if (val < 0x10) {
      ret = '0'
    }
    return ret + val.toString(16).toUpperCase()
  }

  private static _ItemDataStr(req: FoxtronDALIASCIIRequest): string {
    let val = 0
    if (req.itemIndex) {
      val = req.itemIndex as number
    }
    let ret = ''
    if (val % 2 == 1) {
      ret = '0'
    }
    return ret + val.toString(16).toUpperCase()
  }

  private static _ResponseFromStr(str: string): FoxtronDALIASCIIResponse {
    const resp: FoxtronDALIASCIIResponse = {
      type: parseInt(str.substring(1, 3), 16)
    }
    if (resp.type === FoxtronDALIASCIIResponseType.Response || resp.type === FoxtronDALIASCIIResponseType.DistinctResponse 
      ||resp.type === FoxtronDALIASCIIResponseType.NoResponse || resp.type === FoxtronDALIASCIIResponseType.DistinctNoResponse) {
      const dataLength = parseInt(str.substring(3,5), 16)
      if (dataLength === 0) {
        resp.framingError = true
      } else {
        if (dataLength !== 16) {
          throw new Error(`DALI Message must be 16 bits long. It's ${dataLength} bits long`)
        }
        resp.daliCommand = DALICommand.CommandWithBytecode(parseInt(str.substring(5,9), 16))

        if (resp.type === FoxtronDALIASCIIResponseType.Response || resp.type === FoxtronDALIASCIIResponseType.DistinctResponse) {
          const responseLength = parseInt(str.substring(9,11), 16)
          if (responseLength === 0) {
            resp.framingError = true
          } else {
            if (responseLength !== 8) {
              throw new Error(`DALI Response must be 8 bits long. It's ${dataLength} bits long`)
            }
            resp.daliResponse = new DALIResponse(parseInt(str.substring(11,13), 16), resp.daliCommand.code)
          }
        }
      }
    } else if (resp.type === FoxtronDALIASCIIResponseType.ConfResponse || resp.type === FoxtronDALIASCIIResponseType.ConfChangeAck) {
      resp.itemIndex = parseInt(str.substring(3,5), 16)
      resp.itemData = parseInt(str.substring(5,9), 16)
      if (resp.type === FoxtronDALIASCIIResponseType.ConfChangeAck) {
        resp.setConfigAckFlag = parseInt(str.substring(9,11), 16)
      }
    } else if (resp.type === FoxtronDALIASCIIResponseType.SpecReceived) {
      resp.specialMessage = parseInt(str.substring(3,5))
    }
    return resp
  }

  private _port: FoxtronDALIASCIITransport
  private _bootMethod: BootMethod = BootMethod.Running
  private _waitForBoot: boolean = false
  private _requestInProcess?: RequesInProcess
  private _debug: boolean = false
  private _destroyed: boolean = false

  constructor(obj: FoxtronDALIASCIIConfig) {
    super()

    if (obj.bootMethod) {
      this._bootMethod = obj.bootMethod
    }

    if (this._bootMethod !== BootMethod.Running) {
      this._waitForBoot = true
    }

    if (obj.debug) {
      this._debug = true
    }

    this._port = obj.transport
    this._port.onOpen(this._portOpenHandler.bind(this))
    this._port.onClose(this._portCloseHanlder.bind(this))
    this._port.receive(this._portReadlineHandler.bind(this))

  }

  public get isOpen(): boolean {
    return !this._destroyed && this._port.isOpen && !this._waitForBoot
  }

  public get destroyed(): boolean {
    return this._destroyed
  }

  public sendCmd(cmd: DALICommand | DALICommandObj | FoxtronDALIASCIIRequest): Promise<FoxtronDALIASCIIResponse | null> {
    let promise : Promise<FoxtronDALIASCIIResponse | null> = Promise.resolve(null)

    if (!this.isOpen) {
      return Promise.resolve({
        type: FoxtronDALIASCIIResponseType.SpecReceived, 
        specialMessage: FoxtronDALIASCIISpecMessage.ChannelToControllerNotOpen
      })
    }

    let cmdFox = cmd as FoxtronDALIASCIIRequest
    let cmdDALI = cmd as DALICommand
    if (!(cmdDALI instanceof DALICommand) && (cmd as DALICommandObj).code) {
      cmdDALI = new DALICommand(cmd as DALICommandObj)
    }
    if (cmdDALI instanceof DALICommand) {
      cmdFox = {
        type: FoxtronDALIASCIIRequestType.DistinctSend,
        daliCommand: cmdDALI,
        priority: 0,
        doubleSend: false,
        sequence: false
      }
    }

    if (cmdFox.type === FoxtronDALIASCIIRequestType.DistinctSend 
      || cmdFox.type === FoxtronDALIASCIIRequestType.ConfQuery
      || cmdFox.type === FoxtronDALIASCIIRequestType.ConfChange
      || cmdFox.type === FoxtronDALIASCIIRequestType.SequenceEnd
      || cmdFox.type === FoxtronDALIASCIIRequestType.ContiuousSend
      || cmdFox.type === FoxtronDALIASCIIRequestType.FirmwareReset) {
        if (this._requestInProcess) {
          throw new Error('Another message already in processing. Queue not implemented yet.')
        }

        let res: ((value: FoxtronDALIASCIIResponse | PromiseLike<FoxtronDALIASCIIResponse>) => void) | undefined
        let rej: ((reason?: any) => void) | undefined
        let surePromise = new Promise<FoxtronDALIASCIIResponse>((resolve, reject) => {
          res = resolve
          rej = reject
        })
        this._requestInProcess = {
          request: cmdFox,
          promise: surePromise,
          counter: cmdFox.doubleSend ? 2 : 1
        }
        this._requestInProcess.resolve = res
        this._requestInProcess.reject = rej
        promise = surePromise
    }

    let message = FoxtronDaliAscii._MessageTypeStr(cmdFox.type)
    if (cmdFox.type === FoxtronDALIASCIIRequestType.DistinctSend 
      || cmdFox.type === FoxtronDALIASCIIRequestType.Send 
      || cmdFox.type === FoxtronDALIASCIIRequestType.ContiuousSend) {
      message += FoxtronDaliAscii._PriorityStr(cmdFox)
      message += '10' // DALI request has always 16 bits

      const bytecode = (cmdFox.daliCommand as DALICommand).bytecode()
      if (bytecode < 0x1000) {
        message +='0'
      }
      message += bytecode.toString(16).toUpperCase()

      if (cmdFox.type === FoxtronDALIASCIIRequestType.DistinctSend) {
        message += FoxtronDaliAscii._DistinctParam(cmdFox)
      }
    } else if (cmdFox.type === FoxtronDALIASCIIRequestType.ConfQuery) {
      message += FoxtronDaliAscii._ItemIndexStr(cmdFox)
    } else if (cmdFox.type === FoxtronDALIASCIIRequestType.ConfChange) {
      message += FoxtronDaliAscii._ItemIndexStr(cmdFox)
      message += FoxtronDaliAscii._ItemDataStr(cmdFox)
    } else if (cmdFox.type === FoxtronDALIASCIIRequestType.SequenceEnd) {
      message += '00' // 0xOO
    } else if (cmdFox.type === FoxtronDALIASCIIRequestType.FirmwareReset) {
      throw new Error(`Don't use Firmware Reset directly. Use DALIconfig app from Foxtron to update firmware.`)
    }

    message += this._sumcheck(message)
    console.log(this._port.send, 'aaa')
    this._debug && console.log(`[FoxtronDaliAscii] Sending Message: SOH|${message}|ETB`)
    
    this._port.send(SOH + message + ETB)

    return promise
  }

  public async setSearchAddress(search: number): Promise<(FoxtronDALIASCIIResponse | null)[] | null> {
    const setH = FoxtronDaliAscii.SpecialDALIRequest(DALICommandCode.SearchAddressH, search) 
    const setM = FoxtronDaliAscii.SpecialDALIRequest(DALICommandCode.SearchAddressM, search) 
    const setL = FoxtronDaliAscii.SpecialDALIRequest(DALICommandCode.SearchAddressL, search) 
    const resp: (FoxtronDALIASCIIResponse | null)[] = []
    resp.push(await this.sendCmd(setH))
    resp.push(await this.sendCmd(setM))
    resp.push(await this.sendCmd(setL))
    return Promise.resolve(resp)
  }

  public reset() {
    if (this._requestInProcess) {
      if (this._requestInProcess.reject) {
        this._requestInProcess.reject(new Error('Canceled'))
      }
    }
    this._requestInProcess = undefined
  }

  public close() {
    this._port.close()
  }

  private _sumcheck(str: string): string {
    if (str.length % 2 == 1) {
      str = '0' + str
    }
  
    let sum = 0
    for (let i = 0 ; i < str.length ; i += 2) {
      const number = parseInt(str[i] + str[i+1], 16)
      if (isNaN(number) || number < 0 || number > 255) {
        throw new Error(`Foxtron DALI ASCII checkum calc error. Wrong input - got '${str[i] + str[i+1]}' (must be between between 0 and F)`)
      }
      sum += number
    }
    const mod = sum % 0x100
    const negmod = 0xFF - mod
    let csStr = ''
    if (negmod < 0x10) {
      csStr = '0'
    }
    csStr += negmod.toString(16).toUpperCase()
    return csStr
  }

  private async _portOpenHandler() {
    if (this._waitForBoot) {
      if (this._bootMethod === BootMethod.SetDTR) {
        await this._port.set({dtr: true})
      }
      setTimeout(this._waitingForBootFinished.bind(this), BOOT_WAITING_TIME_MS)
      return
    }
    this._waitingForBootFinished()
  }

  private _portCloseHanlder(e?: Error) {
    this._destroyed = true
    this._debug && console.log('[FoxtronDaliAscii] Transport closed')
    this.emit(FoxtronDALIASCIITransportEvent.Close, e)
  }

  private _portReadlineHandler(data : string) {
    const idx = data.indexOf(SOH)
    data = data.substring(idx)
    const msg = data.split('').map((item) => {
      if (item === SOH) {
        return 'SOH|'
      } 
      if (item === ETB) {
        return '|ETB'
      } 
      return item
    }).join('')
    this._debug && console.log(`[FoxtronDaliAscii] Received message: ${msg}`)
    const response = FoxtronDaliAscii._ResponseFromStr(data)
    if (response.type === FoxtronDALIASCIIResponseType.DistinctNoResponse || response.type === FoxtronDALIASCIIResponseType.DistinctResponse) {
      if (this._requestInProcess) {
        if (this._requestInProcess.counter > 1) {
          this._debug && console.log(`[FoxtronDaliAscii] Holding response, counter is: ${this._requestInProcess.counter--}`)
          this._requestInProcess.counter--
          return
        }
        if (this._requestInProcess.resolve) {
          const ripres = this._requestInProcess.resolve
          this._requestInProcess = undefined
          ripres(response)

        }
      }
      return
    }

    if (response.type === FoxtronDALIASCIIResponseType.Response) {
      this.emit(FoxtronDALIASCIIResponseEvent.Response, response)
    }
    if (response.type === FoxtronDALIASCIIResponseType.NoResponse) {
      this.emit(FoxtronDALIASCIIResponseEvent.NoResponse, response)
    }
    if (response.type === FoxtronDALIASCIIResponseType.SpecReceived) {
      this.emit(FoxtronDALIASCIIResponseEvent.SpecReceived, response)
    }
    this.emit(FoxtronDALIASCIIResponseEvent.Any, response)
  }

  private _waitingForBootFinished() {
    this._waitForBoot = false
    this._debug && console.log('[FoxtronDaliAscii] Transport opened')
    this.emit(FoxtronDALIASCIITransportEvent.Open)
  }

}