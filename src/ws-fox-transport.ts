// import type { FoxtronDALIASCIITransport, FoxtronTransportProvider, ReadlineConfig } from "./foxtron-dali-ascii-types";
// import type { SetOptions, PortStatus, PortInfo, OpenOptions } from '@serialport/bindings-cpp'

// export class RemoteSerialPortProvider implements FoxtronTransportProvider {
//   private _url: string

//   constructor(url: string) {
//     this._url = url
//   }

//   async listPorts(): Promise<PortInfo[]> {
//     const res = await fetch(this._url + '/list')
//     const resJson = await res.json()
//     return resJson as PortInfo[]
//   }

//   foxTransport(portPath: string, config: OpenOptions, readlineConfig: ReadlineConfig): WsFoxTransport {
//     let url = this._url
//     if (this._url.substring(0,5) === 'https') {
//       url = url.replace('https', '')
//     }
//     if (this._url.substring(0,4) === 'http') {
//       url = url.replace('http', '')
//     }
//     return new WsFoxTransport(url + '/port' + portPath, config, readlineConfig)
//   }
// }

// export class WsFoxTransport implements FoxtronDALIASCIITransport {

//   private _portUrl: string
//   private _serialChannel: WebSocket
//   private _serialConfig: OpenOptions
//   private _readlineConfig: ReadlineConfig

//   private _buffer: string[] = []

//   private _receiveHandler?: (data: string) => void
//   private _openHandler?: () => void
//   private _closeHandler?: () => void

//   public get isOpen(): boolean {
//     return this._serialChannel.readyState === 1
//   }

//   constructor(portUrl: string, serialConfig: OpenOptions, readlineConfig: ReadlineConfig) {
//     this._portUrl = portUrl
//     this._serialConfig = serialConfig
//     this._readlineConfig = readlineConfig
    
//     const url = 'ws' + this._portUrl + '?baudRate=' + serialConfig.baudRate 
//     + '&parity=' + serialConfig.parity 
//     + '&stopBits=' + serialConfig.stopBits 
//     + '&dataBits=' + serialConfig.dataBits

//     this._serialChannel = new WebSocket(url)
//     console.log(this._serialChannel)
//     this._serialChannel.addEventListener('open', () => {
//       console.log('Ws Open')
//       if (this._openHandler) {
//         this._openHandler()
//       }
//     })
//     this._serialChannel.addEventListener('message', (data: MessageEvent) => {
//       console.log('Ws Message')
//       if (this._receiveHandler) {
//         this._receiveHandler(data.data)
//         return
//       }
//       this._buffer.push(data.data)
//     })
//     this._serialChannel.addEventListener('error', (e) => {
//       console.log('[WsFoxTransport] Received WS error: ', e)
//     })
//     this._serialChannel.addEventListener('close', () => {
//       console.log('Ws Close')
//       if (this._closeHandler) {
//         this._closeHandler()
//       }
//     })
//   }

//   send(data: string): void {
//     if (!this.isOpen) {
//       throw new Error('[WsFoxTransport] Transport Channel is not open')
//     }
//     this._serialChannel.send(data)
//   }

//   receive(handler: (data: string) => void): void {
//     this._receiveHandler = handler
//     while(this._buffer.length) {
//       this._receiveHandler(this._buffer.splice(0,1)[0])
//     }
//   }

//   async set(options: SetOptions): Promise<boolean> {
//     const resp = await fetch('http' + this._portUrl, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json'},
//       body: JSON.stringify(options)
//     })
//     const respJson = await resp.json()
//     return respJson?.resultOk ? true : false
//   }

//   async get(): Promise<PortStatus> {
//     const resp = await fetch('http' + this._portUrl)
//     const respJson = await resp.json()
//     return respJson as PortStatus
//   }
  
//   async asyncIsOpen(): Promise<boolean> {
//     const resp = await fetch('http' + this._portUrl + '?isOpen')
//     const respJson = await resp.json()
//     if (respJson && respJson.isOpen !== undefined) {
//       return !!respJson.isOpen
//     }
//     return false
//   }

//   onOpen(handler: () => void): void {
//     this._openHandler = handler
//     if (this.isOpen) {
//       handler()
//     }
//   }

//   onClose(handler: () => void): void {
//       this._closeHandler = handler
//   }

//   close(): void {
//       this._serialChannel.close()
//   }
// }