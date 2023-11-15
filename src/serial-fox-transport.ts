import type { FoxtronDALIASCIITransport, FoxtronTransportProvider, ReadlineConfig } from "./foxtron-dali-ascii-types";
import type { SetOptions, PortStatus, PortInfo, OpenOptions } from '@serialport/bindings-cpp'
import { autoDetect } from '@serialport/bindings-cpp'
import { ReadlineParser, SerialPort, SerialPortOpenOptions } from 'serialport'

export class SerialTransportProvider implements FoxtronTransportProvider {
  async listPorts(): Promise<PortInfo[]> {
    return SerialPort.list()
  }

  foxTransport(config: OpenOptions, readlineConfig: ReadlineConfig, debug?: boolean): SerialFoxTransport {
    return new SerialFoxTransport(config, readlineConfig, debug)
  }
}

const SerialAutodetectType = autoDetect()

export class SerialFoxTransport implements  FoxtronDALIASCIITransport {

  private _serialChannel: SerialPort
  private _serialConfig: OpenOptions
  private _readlineConfig: ReadlineConfig
  private _parser: ReadlineParser

  private _buffer: string[] = []
  private _destroyed: boolean = false
  private _openErrorStore: Error | undefined

  private _debug: boolean = false

  private _receiveHandler?: (data: string) => void
  private _openHandler?: () => void
  private _closeHandler?: (e?: Error) => void

  constructor(config: OpenOptions, readlineConfig: ReadlineConfig, debug?: boolean){
    this._debug = !!debug

    this._serialConfig = config
    this._readlineConfig = readlineConfig
    this._serialChannel = new SerialPort(this._serialConfig as SerialPortOpenOptions<typeof SerialAutodetectType>, (e) => {
      // Port is opened withou error
      if (!e) {
        return
      }
      this._debug && console.log('[SerialFoxTransport] Port open error: ', e)
      this._destroyed = true
      this._openErrorStore = e
      if (this._closeHandler) {
        this._closeHandler(e)
      }
    })
    this._serialChannel.on('open', () => {
      this._debug && console.log('[SerialFoxTransport] Port opened')
      if (this._openHandler) {
        this._openHandler()
      }
    })
    this._serialChannel.on('error', (e) => {
      this._debug && console.log('[SerialFoxTransport] Received error: ', e)
    })
    this._serialChannel.on('close', () => {
      this._debug && console.log('[SerialFoxTransport]: Port closed')
      if (this._closeHandler) {
        this._closeHandler()
      }
    })

    this._parser = new ReadlineParser(this._readlineConfig)
    this._parser.on('data', this._onReceivedLine.bind(this))
    this._serialChannel.pipe(this._parser)
  }

  public get isOpen(): boolean {
    return this._serialChannel.isOpen
  }

  public send(data: string): void {
    this._debug && console.log('[SerialFoxTransport] Write data', data)
    if (!this.isOpen) {
      throw new Error('[SerialFoxTransport] Transport Channel is not open')
    }
    this._serialChannel.write(data)
  }

  public receive(handler: (data: string) => void): void {
    this._receiveHandler = handler
    while(this._buffer.length) {
      this._receiveHandler(this._buffer.splice(0,1)[0])
    }
  }

  public set(options: SetOptions): void {
    this._serialChannel.set(options)
  }

  public get(): Promise<PortStatus | undefined> {
    return new Promise((resolve, reject) => {
      this._serialChannel.get((e, status) => {
        resolve(status)
      })
    })
  }

  public asyncIsOpen(): Promise<boolean> {
    return Promise.resolve(this.isOpen)
  }

  public onOpen(handler: () => void): void {
    this._openHandler = handler
    if (this.isOpen) {
      handler()
    }
  }

  public onClose(handler: (e?: Error) => void): void {
    this._closeHandler = handler
    if (!this.isOpen && this._destroyed) {
      handler(this._openErrorStore)
    }
  }

  public close(): void {
    this._debug && console.log('[SerialFoxTransport] Closing port ...')
    this._serialChannel.close()
    this._destroyed = true
  }

  private _onReceivedLine(data: string) {
    this._debug && console.log('[SerialFoxTransport] Message received ', data)
    if (this._receiveHandler) {
      this._receiveHandler(data)
      return
    }
    this._buffer.push(data)
  }
}