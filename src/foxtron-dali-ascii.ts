import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'
import { 
  DALICommand, 
  DALICommandObj, 
  DALIResponse, 
  DALICommandCode } from "./dali-command"

const BOOT_WAITING_TIME_MS = 5000

export const enum FoxtronDALIASCIIRequestType {
  Send = 1,
  DistinctSend = 11,
  ConfQuery = 6,
  ConfChange = 8,
  SequenceEnd = 10,
  ContiuousSend = 12,
  FirmwareReset = 254
}

export const enum FoxtronDALIASCIIResponseType {
  Response = 3,
  DistinctResponse = 13,
  NoResponse = 4,
  DistinctNoResponse = 14,
  ConfResponse = 7,
  ConfChangeAck = 9,
  SpecReceived = 5,
  FirmwareResetAck = 255
}

export const enum FoxtronDALIASCIIConfigResetAckFlag {
  Set = 0,
  ReadOnlyItem = 1,
  OutOfRange = 2
}

export const enum FoxtronDALIASCIISpecMessage {
  VoltageOK = 0,
  VoltageLoss = 1,
  GridVoltageDetected = 2,
  BadPowerSourceDetected = 3,
  BufferFull = 4,
  ChecksumError = 5,
  UnknownCommand = 6,
  ChannelToControllerNotOpen = 255
}

type FoxtronDALIASCIIRequest = {
  type: FoxtronDALIASCIIRequestType,
  daliCommand?: DALICommand | DALICommandObj,
  priority?: Number,
  doubleSend?: Boolean,
  sequence?: Boolean,
  itemIndex?: Number,
  itemData?: Number
}

type FoxtronDALIASCIIResponse = {
  type: FoxtronDALIASCIIResponseType,
  request?: FoxtronDALIASCIIRequest
  daliResponse?: DALIResponse,
  itemIndex?: Number,
  itemData?: Number,
  setConfigAckFlag?: FoxtronDALIASCIIConfigResetAckFlag,
  specialMessage?: FoxtronDALIASCIISpecMessage
}

export const enum BootMethod {
  Running,
  WaitForBoot,
  SetDTR
}

const SOH = String.fromCharCode(0x01)
const ETB = String.fromCharCode(0x17)

export class FoxtronDaliAscii {

  private static _MessageTypeStr(type: FoxtronDALIASCIIRequestType): string {
    let out = ''
    if (type < 10) {
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

  private _port: SerialPort
  private _parser: ReadlineParser
  private _bootMethod: BootMethod = BootMethod.Running
  private _waitForBoot: boolean = false
  private _requestInProcess?: {
    request: FoxtronDALIASCIIRequest,
    promise: Promise<FoxtronDALIASCIIResponse>,
    resolve?: (value: FoxtronDALIASCIIResponse | PromiseLike<FoxtronDALIASCIIResponse>) => void
    reject?: (reason?: any) => void
  }

  constructor(obj: {path: string, bootMethod?: BootMethod}) {
    if (obj.bootMethod) {
      this._bootMethod = obj.bootMethod
    }
    if (this._bootMethod !== BootMethod.Running) {
      this._waitForBoot = true
    }

    this._port = new SerialPort({ path: obj.path, baudRate: 19200, parity: 'even', stopBits: 1})
    this._port.on('open', this._portOpenHandler)

    this._parser = this._port.pipe(new ReadlineParser({ delimiter: ETB, includeDelimiter: true}))
    this._parser.on('data', this._readHandler)

  }

  public get port(): SerialPort {
    return this._port
  }

  public get isOpen(): boolean {
    return this._port.isOpen && this._waitForBoot
  }


  public sendCmd(cmd: DALICommand | DALICommandObj | FoxtronDALIASCIIRequest): Promise<FoxtronDALIASCIIResponse | null> {
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
        this._requestInProcess = {
          request: cmdFox,
          promise: new Promise<FoxtronDALIASCIIResponse>((resolve, reject) => {
            res = resolve
            rej = reject
          })
        }
        this._requestInProcess.resolve = res
        this._requestInProcess.reject = rej
    }

    let message = FoxtronDaliAscii._MessageTypeStr(cmdFox.type)
    if (cmdFox.type === FoxtronDALIASCIIRequestType.DistinctSend 
      || cmdFox.type === FoxtronDALIASCIIRequestType.Send 
      || cmdFox.type === FoxtronDALIASCIIRequestType.ContiuousSend) {
      message += FoxtronDaliAscii._PriorityStr(cmdFox)
      message += '10' // DALI request has always 16 bits
      message += (cmdFox.daliCommand as DALICommand).bytecode().toString(16)

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
    this._port.write(SOH + message + ETB)

    return Promise.resolve(null)
  }

  public reset() {
    this._requestInProcess = undefined
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
      setTimeout(this._waitingForBootFinished, BOOT_WAITING_TIME_MS)
    }
  }

  private _readHandler(data : string) {

  }

  private _waitingForBootFinished() {
    this._waitForBoot = false
  }


}