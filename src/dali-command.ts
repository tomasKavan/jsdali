export const enum DALICommandCode {
  // Direct arc power drive
  DAPC = -1,
  
  // Indirect power drive
  Off = 0,
  Up = 1,
  Down = 2,
  StepUp = 3,
  StepDown = 4,
  RecallMaxLevel = 5,
  RecallMinLevel = 6,
  StepDownAndOff = 7,
  OnAndStepUp = 8,
  EnableDAPCsequence = 9,
  GoToLastActiveLevel = 10,
  GoToScene = 11,  // param scene number (0-15)
  
  // Konfiguration commands
  Reset = 32,
  StoreToDTR = 33,
  StoreDTRasMaxLevel = 42,
  StoreDTRasMinLevel = 43,
  StoreDTRasSystemFailureLevel = 44,
  StoreDTRasPowerOnLevel = 45,
  StoreDTRasFadeTime = 46,
  StoreDTRasFadeRate = 47,
  StoreDTRasScene = 64,  // param scene number (0-15)
  
  // Set system params
  RemoveScene = 80,  // param scene number (0-15)
  AddToGroup = 96,  // param group number (0-15)
  RemoveFromGroup = 112,  // param group number (0-15)
  StoreDTRasShortAddress = 128,
  
  // Query status
  QueryStatus = 144,  // response is number (0-255)
  QueryGearPresent = 145,  // response is yes/no
  QueryLampFailure = 146,  // response is yes/no
  QueryLampPowerOn = 147,  // response is yes/no
  QueryLimitError = 148,  // response is yes/no
  QueryResetState = 149,  // response is yes/no
  QueryMissingShortAddress = 150,  // response is yes/no
  QueryVersionNumber = 151,  // response is number (0-255)
  QueryContentDTR = 152,  // response is number (0-255)
  QueryDeviceType = 153,  // response is number (0-255)
  QueryPhysicalMinLevel = 154,  // response is number (0-255)
  QueryPowerFailure = 155,  // response is yes/no
  
  // Query power set
  QueryActualLevel = 160,  // response is number (0-255)
  QueryMaxLevel = 161,  // response is number (0-255)
  QueryMinLevel = 162,  // response is number (0-255)
  QueryPowerOnLevel = 163,  // response is number (0-255)
  QuerySystemFailureLevel = 164,  // response is number (0-255)
  QueryFadeTimeAndRate = 165,  // response is number (0-255), TTTTRRRR
  
  // Query system params
  QuerySceneLevel = 176,  // param scene number (0-15); response is number (0-255)
  QueryGroups0_7 = 192,  // response is number (0-255), bitmap
  QueryGroups8_15 = 193,  // response is number (0-255), bitmap
  QueryRandomAddressH = 194,  // response is number (0-255), 8bit
  QueryRandomAddressM = 195,  // response is number (0-255), 8bit
  QueryRandomAddressL = 196,  // response is number (0-255), 8bit
  ReadMemoryLocation = 197,  // response is number (0-255)
  
  // LED drivers extension
  ReferenceSystemPower = 224,
  EnableCurrentProtector = 225,
  DisableCurrentProtector = 226,
  SetDimmingCurve = 227,
  StoreDTRasFastFadeTime = 228,
  QueryGearType = 237,  // response is number (0-255)
  QueryDimmingCurve = 238,  // response is number (0-255)
  QueryPossibleOperatingModes = 239,  // response is number (0-255)
  QueryFeatures = 240,  // response is number (0-255)
  QueryFailStatus = 241,  // response is number (0-255)
  QueryShortCircuit = 242,  // response is yes/no
  QueryOpenCircuit = 243,  // response is yes/no
  QueryLoadDecrease = 244,  // response is yes/no
  QueryLoadIncrease = 245,  // response is yes/no
  QueryCurrentProtectActive = 246,  // response is yes/no
  QueryThermalShutdown = 247,  // response is yes/no
  QueryThermalOverload = 248,  // response is yes/no
  QueryReferenceRunning = 249,  // response is yes/no
  QueryReferenceMeasurementFailed = 250,  // response is yes/no
  QueryCurrentProtectorEnable = 251,  // response is yes/no
  QueryOperatingMode = 252,  // response is number (0-255)
  QueryFastFadeTime = 253,  // response is number (0-255)
  QueryMinFastFadeTime = 254,  // response is number (0-255)
  QueryExtendedVersionNumber = 255,  // response is no or number (0-255)

  // Special commands (opcode = (val-255)*256)
  Terminate = 256,
  DataTransferRegister = 258,  // param number (0-255) 
  Initialize = 260,  // param number (0-255)
  Randomize = 262, 
  Compare = 264,  // response is yes/no
  Withdraw = 266,
  Ping = 270,
  SearchAddressH = 272,  // param number (0-255), 8bit
  SearchAddressM = 274,  // param number (0-255), 8bit
  SearchAddressL = 276,  // param number (0-255), 8bit
  ProgramShortAddress = 278,  // param short address (0-63)
  VerifyShortAddress = 280,  // param short address (0-63); response is yes/no
  QueryShortAddress = 282, // response is number (0-63)
  PhysicalSelection = 284,
  EnableDeviceOfType = 288,  // param number (0-255) 
  SetDTR1 = 290,  // param number (0-255) 
  SetDTR2 = 292,  // param number (0-255) 
  WriteMemoryLocation = 294  // param number (0-255); response is no/number (0-255)
}

export const enum DALIAddressType {
  Short,
  Group,
  Broadcast
}

export const enum DALIValueType {
  DataByte,
  Group,
  Scene,
  Short,
  Random,
  Null
}

export type DALIAddress = {
  type: DALIAddressType,
  value: number
}

export class DALICommand {

  public static Short(val: number): DALIAddress {
    return {
      type: DALIAddressType.Short,
      value: val
    }
  }

  public static Group(val: number) {
    return {
      type: DALIAddressType.Short,
      value: val
    }
  }

  public static Broadcast() {
    return {
      type: DALIAddressType.Broadcast,
      value: 0
    }
  }

  public static DAPC(address: DALIAddress, brightness: number) {
    // TODO: compute brightness as % = 100/1000 * 253sqrt(1000)^(step - 1) see https://cs.wikipedia.org/wiki/DALI_(rozhraní)#Práce_s_logaritmickým_jasem
    const val = Math.max(0, Math.min(254, Math.floor(brightness * 254)))
    return new DALICommand(DALICommandCode.DAPC, address, val)
  }

  public static Off(address: Address) {
    return new DALICommand(DALICommandCode.Off, address)
  }


  private _code: DALICommandCode
  private _address: DALIAddress
  private _value?: number
  private _valueType: DALIValueType = DALIValueType.Null


  public get code(): DALICommandCode {
    return this._code
  }

  public get address(): DALIAddress {
    return this._address
  }

  public get value() {
    return this._value
  }

  public get valueType() {
    return this._valueType
  }

  constructor(code: DALICommandCode, address: DALIAddress, value?: number) {
    this._code = code
    this._address = address
    this._value = value

    if (!this.isValid()) {
      throw new Error('Wrong format of DALI command')
    }
  }

  isValid(): boolean {
    return false
  }

  bytecode(): number {
    return 0
  }

}


export class DALIResponse {
  private _value: number | boolean

  public get value() {
    return this._value
  }

  constructor(bytecode: number) {
    this._value = bytecode
  }
}