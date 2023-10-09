import { SerialPort } from 'serialport'
import { DALICommand, DALIResponse, DALICommandCode } from "./dali-command"

const BOOT_WAITING_TIME_MS = 5000

type DALICommandObj = {
  code: DALICommandCode,
  shortAddress?: number,
  groupAddress?: number,
  broadcast?: boolean,
  dataByte?: number,
  group?: number,
  scene?: number,
  random?: number,
}

const enum BootMethod {
  Running,
  WaitForBoot,
  SetDTR
}

class FoxtronDaliAscii {

  private _port: SerialPort
  private _bootMethod: BootMethod = BootMethod.Running
  private _waitForBoot: boolean = false

  constructor(obj: {path: string, bootMethod?: BootMethod}) {
    if (obj.bootMethod) {
      this._bootMethod = obj.bootMethod
    }
    if (this._bootMethod !== BootMethod.Running) {
      this._waitForBoot = true
    }

    this._port = new SerialPort({ path: obj.path, baudRate: 19200, parity: 'even', stopBits: 1})
    this._port.on('open', this._portOpenHandler)

  }

  public get port(): SerialPort {
    return this._port
  }

  public get isOpen(): boolean {
    return this._port.isOpen && this._waitForBoot
  }

  public sendCmd(cmd: DALICommand | DALICommandObj): Promise<DALIResponse | null> {
    if (!this.isOpen) {
      throw new Error('DALI channel is not open. Can\'t send a command')
    }
    return Promise.resolve(null)
  }

  private _sumcheck(): number {
    return 0
  }

  private _toASCII(): string {
    return ""
  }

  private async _portOpenHandler() {
    if (this._waitForBoot) {
      if (this._bootMethod === BootMethod.SetDTR) {
        await this._port.set({dtr: true})
      }
      setTimeout(this._waitingForBootFinished, BOOT_WAITING_TIME_MS)
    }
  }

  private _waitingForBootFinished() {
    this._waitForBoot = false
  }


}