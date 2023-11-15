import { DALICommand, DALIResponse } from "./dali-command";
import type { DALICommandObj } from './dali-command'
import type { SetOptions, PortStatus, PortInfo, OpenOptions } from '@serialport/bindings-cpp'

export enum FoxtronDALIASCIIRequestType {
  Send = 1,
  DistinctSend = 11,
  ConfQuery = 6,
  ConfChange = 8,
  SequenceEnd = 10,
  ContiuousSend = 12,
  FirmwareReset = 254
}

export enum FoxtronDALIASCIIResponseType {
  Response = 3,
  DistinctResponse = 13,
  NoResponse = 4,
  DistinctNoResponse = 14,
  ConfResponse = 7,
  ConfChangeAck = 9,
  SpecReceived = 5,
  FirmwareResetAck = 255
}

export enum FoxtronDALIASCIIConfigResetAckFlag {
  Set = 0,
  ReadOnlyItem = 1,
  OutOfRange = 2
}

export enum FoxtronDALIASCIISpecMessage {
  VoltageOK = 0,
  VoltageLoss = 1,
  GridVoltageDetected = 2,
  BadPowerSourceDetected = 3,
  BufferFull = 4,
  ChecksumError = 5,
  UnknownCommand = 6,
  ChannelToControllerNotOpen = 255
}

export enum FoxtronDALIASCIIResponseEvent {
  Response = 'response',
  NoResponse = 'no-response',
  SpecReceived = 'spec-received',
  Any = 'any-response'
}

export enum FoxtronDALIASCIITransportEvent {
  Open = 'open',
  Error = 'error',
  Close ='close'
}

export type FoxtronDALIASCIIRequest = {
  type: FoxtronDALIASCIIRequestType,
  daliCommand?: DALICommand | DALICommandObj,
  priority?: Number,
  doubleSend?: Boolean,
  sequence?: Boolean,
  itemIndex?: Number,
  itemData?: Number
}

export type FoxtronDALIASCIIResponse = {
  type: FoxtronDALIASCIIResponseType,
  request?: FoxtronDALIASCIIRequest
  daliResponse?: DALIResponse,
  daliCommand?: DALICommand,
  itemIndex?: Number,
  itemData?: Number,
  setConfigAckFlag?: FoxtronDALIASCIIConfigResetAckFlag,
  specialMessage?: FoxtronDALIASCIISpecMessage,
  framingError?: boolean
}

export enum BootMethod {
  Running,
  WaitForBoot,
  SetDTR
}

export interface FoxtronDALIASCIITransport {
  send(data: string): void
  receive(handler: (data: string) => void): void
  set(options: SetOptions): void
  get: () => Promise<PortStatus | undefined>
  isOpen: boolean
  asyncIsOpen: () => Promise<boolean>
  onOpen(handler: () => void): void
  onClose(handler: (e?: Error) => void): void
  close(): void
}

export type ReadlineConfig = { 
  delimiter: string, 
  includeDelimiter?: boolean
}

export interface FoxtronTransportProvider {
  listPorts(): Promise<PortInfo[]>
  foxTransport(config: OpenOptions, readlineConfig: ReadlineConfig, debug?: boolean): FoxtronDALIASCIITransport
} 

export type FoxtronDALIASCIIConfig = {
  transport: FoxtronDALIASCIITransport,
  bootMethod?: BootMethod,
  debug?: boolean
}

