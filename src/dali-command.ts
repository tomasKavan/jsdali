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
  GoToScene = 16,  // param scene number (0-15)
  
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
  value?: number
}

export type DALICommandObj = {
  code: DALICommandCode,
  shortAddress?: number,
  groupAddress?: number,
  broadcast?: boolean,
  dataByte?: number,
  group?: number,
  scene?: number,
  random?: number,
}

export class DALICommand {

  public static AddressFromObj(obj: DALICommandObj): DALIAddress | undefined {
    if (obj.shortAddress != null) {
      return {
        type: DALIAddressType.Short,
        value: obj.shortAddress as number
      }
    }
    if (obj.groupAddress != null) {
      return {
        type: DALIAddressType.Short,
        value: obj.groupAddress as number
      }
    }

    return {
      type: DALIAddressType.Broadcast
    }
  }

  public static ValueTypeForCommand(cmd: DALICommandCode): DALIValueType {
    if (cmd === DALICommandCode.DAPC){
      return DALIValueType.DataByte
    }
    if (cmd === DALICommandCode.GoToScene || DALICommandCode.StoreDTRasScene || DALICommandCode.RemoveScene || DALICommandCode.QuerySceneLevel) {
      return DALIValueType.Scene
    }
    if (cmd === DALICommandCode.AddToGroup || DALICommandCode.RemoveFromGroup) {
      return DALIValueType.Group
    }
    if (cmd === DALICommandCode.ProgramShortAddress || DALICommandCode.VerifyShortAddress) {
      return DALIValueType.Short
    }
    if (cmd >= DALICommandCode.SearchAddressH && cmd <= DALICommandCode.SearchAddressL) {
      return DALIValueType.Random
    }
    if (cmd === DALICommandCode.DataTransferRegister || cmd === DALICommandCode.Initialize
      || (cmd >= DALICommandCode.EnableDeviceOfType && cmd <= DALICommandCode.WriteMemoryLocation)) {
      return DALIValueType.DataByte
    }
    return DALIValueType.Null
  }

  public static ValueFromObj(obj: DALICommandObj): number | undefined {
    const valueType = DALICommand.ValueTypeForCommand(obj.code)
    if (valueType === DALIValueType.DataByte) {
      return obj.dataByte
    }
    if (valueType === DALIValueType.Scene) {
      return obj.scene
    }
    if (valueType === DALIValueType.Group) {
      return obj.group
    }
    if (valueType === DALIValueType.Short) {
      return obj.short
    }
    if (valueType === DALIValueType.Random) {
      return obj.random
    }

    return undefined
  }

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

  public static Off(address: DALIAddress) {
    return new DALICommand(DALICommandCode.Off, address)
  }

  private _code: DALICommandCode
  private _address?: DALIAddress
  private _value?: number
  private _error?: Error

  public get code(): DALICommandCode {
    return this._code
  }

  public get address(): DALIAddress | undefined {
    return this._address
  }

  public get value(): number | undefined {
    return this._value
  }

  public get error(): Error | undefined {
    return this._error
  }

  public get valueType() {
    return DALICommand.ValueTypeForCommand(this._code)
  }

  constructor(code: DALICommandObj);
  constructor(code: DALICommandCode, address?: DALIAddress, value?: number);
  constructor(codeOrObj: DALICommandCode | DALICommandObj, address?: DALIAddress, value?: number) {
    const obj = codeOrObj as DALICommandObj
    let isObj = false
    if (obj.code) {
      isObj = true
    }

    if (isObj) {
      this._code = obj.code
      this._address = DALICommand.AddressFromObj(obj)
      this._value = DALICommand.ValueFromObj(obj)
    } else {
      this._code = codeOrObj as DALICommandCode
      this._address = address
      this._value = value
    }

    if (!this.isValid()) {
      throw new Error('Wrong format of DALI command')
    }
  }

  isValid(): boolean {
    if (this._code === DALICommandCode.DAPC) {
      if (this._value == null) {
        this._error = new Error(`Command code DAPC' can't have undefined value`)
        return false
      }
      return true
    }

    if ((this._code >= DALICommandCode.Off && this._code <= DALICommandCode.GoToLastActiveLevel) 
      || (this._code >= DALICommandCode.Reset && this._code <= DALICommandCode.StoreDTRasFadeRate)
      || this._code === DALICommandCode.StoreDTRasShortAddress
      || (this._code >= DALICommandCode.QueryStatus && this._code <= DALICommandCode.QueryPowerFailure)
      || (this._code >= DALICommandCode.QueryActualLevel && this._code <= DALICommandCode.QueryFadeTimeAndRate)
      || (this._code >= DALICommandCode.QueryGroups0_7 && this._code <= DALICommandCode.ReadMemoryLocation)
      || (this._code >= DALICommandCode.ReferenceSystemPower && this._code <= DALICommandCode.StoreDTRasFastFadeTime)
      || (this._code >= DALICommandCode.QueryGearType && this._code <= DALICommandCode.QueryExtendedVersionNumber)) {
      if (this._value != null) {
        this._error = new Error(`Command code HEX(${this._code.toString(16).toUpperCase()}) can't have defined value HEX(${this._value.toString(16).toUpperCase()})`)
        return false
      }
      return true
    }

    if (this._code === DALICommandCode.GoToScene || DALICommandCode.StoreDTRasScene || DALICommandCode.RemoveScene || DALICommandCode.QuerySceneLevel) {
      if (this._value != null && this._value < 0 && this._value > 15) {
        this._error = new Error(`Command codes 'GoToScene', 'StoreDTRasScene' and 'RemoveScene' must have value between 0 and 15, is HEX(${this._value.toString(16).toUpperCase()})`)
        return false
      }
      return true
    }

    if (this._code === DALICommandCode.AddToGroup || DALICommandCode.RemoveFromGroup) {
      if (this._value != null && this._value < 0 && this._value > 15) {
        this._error = new Error(`Command codes 'AddToGroup' and 'RemoveFromGroup' must have value between 0 and 15, is HEX(${this._value.toString(16).toUpperCase()})`)
        return false
      }
      return true
    }

    // Special commands

    if (this._code === DALICommandCode.Terminate
      || (this._code >= DALICommandCode.Randomize && this._code <= DALICommandCode.Ping)
      || this._code === DALICommandCode.QueryShortAddress || this._code === DALICommandCode.PhysicalSelection) {
      if (this._value != null) {
        this._error = new Error(`Command code 'HEX(${this._code.toString(16).toUpperCase()})' can't have defined value HEX(${this._value.toString(16).toUpperCase()})`)
        return false
      }
      return true
    }

    if ((this._code === DALICommandCode.DataTransferRegister || this._code === DALICommandCode.Initialize)
      || (this._code >= DALICommandCode.SearchAddressH && this._code <= DALICommandCode.SearchAddressL)
      || (this._code >= DALICommandCode.EnableDeviceOfType && this._code < DALICommandCode.WriteMemoryLocation)) {
      if (this._value != null && this._value < 0 && this._value > 255) {
        this._error = new Error(`Command codes 'AddToGroup', 'RemoveFromGroup' and 'RemoveScene' must have value between 0 and 255, is HEX(${this._value.toString(16).toUpperCase()})`)
        return false
      }
      return true
    }

    if (this._code >= DALICommandCode.SearchAddressH && this._code <= DALICommandCode.SearchAddressL) {
      if (this._value != null && this._value < 0 && this._value > 255) {
        this._error = new Error(`Command codes 'SearchAddressH/M/L' must have value between 0 and 255, is HEX(${this._value.toString(16).toUpperCase()})`)
        return false
      }
      return true
    }

    if (this._code === DALICommandCode.ProgramShortAddress || this._code === DALICommandCode.VerifyShortAddress) {
      if (this._value != null && this._value < 0 && this._value > 63) {
        this._error = new Error(`Command codes 'ProgramShortAddress' and 'VerifyShortAddress' must have value between 0 and 63, is HEX(${this._value.toString(16).toUpperCase()})`)
        return false
      }
      return true
    }
    

    return false
  }

  _addressBytecode(): number {
    if (this._address) {
      if (this._address.type === DALIAddressType.Broadcast) {
        return 0xFE // 11111110
      }
      if (this._address.type === DALIAddressType.Group) {
        return 0x80 + ((this._address.value as number) * 2) // 100gggg0
      }
      if (this._address.type === DALIAddressType.Short) {
        return (this._address.value as number) * 2 //0ssssss0
      }
    }
    return 0
  }

  bytecode(): number {
    let addr = this._addressBytecode()
    let val = this._value as number
    if (val == null) {
      val = 0
    }

    // special commands
    if (this._code >= DALICommandCode.Terminate) {
      const code = (this._code - 256) * 2 + 0xA1 << 8

      if ((this._code === DALICommandCode.DataTransferRegister || this._code === DALICommandCode.Initialize)
      || (this._code >= DALICommandCode.EnableDeviceOfType && this._code < DALICommandCode.WriteMemoryLocation)) {
        return code + val || 0 // 101ccccc dddddddd || 110ccccc dddddddd
      }

      if (this._code === DALICommandCode.ProgramShortAddress || this._code === DALICommandCode.VerifyShortAddress) {
        return code + (val << 1) + 1 // 101ccccc 0aaaaaa1 || 110ccccc 0aaaaaa1
      }

      if (this._code >= DALICommandCode.SearchAddressH && this._code <= DALICommandCode.SearchAddressL) {
        let randVal = 0
        if (this._code === DALICommandCode.SearchAddressH) {
          randVal = (val & 0xFF0000) >> 16
        }
        if (this._code === DALICommandCode.SearchAddressM) {
          randVal = (val & 0x00FF00) >> 8
        }
        if (this._code === DALICommandCode.SearchAddressL) {
          randVal = (val & 0x0000FF)
        }
        return code + randVal || 0 // 101ccccc dddddddd
      }

      return code // 101ccccc 00000000 || 110ccccc 00000000
    }

    // DAPC
    if (this._code === DALICommandCode.DAPC) {
      return (addr << 8) + val // aaaaaa0 dddddddd
    }

    // Commands with scene
    if (this._code === DALICommandCode.GoToScene || DALICommandCode.StoreDTRasScene || DALICommandCode.RemoveScene) {
      return ((addr + 1) << 8) + this._code + val // aaaaaaa1 ccccssss
    }

    // Commands with group
    if (this._code === DALICommandCode.AddToGroup || DALICommandCode.RemoveFromGroup) {
      return ((addr + 1) << 8) + this._code + val // aaaaaaa1 ccccgggg
    }

    // commands without value (everything else)
    return ((addr + 1) << 8) + this._code // aaaaaaa1 cccccccc
  }
}


export class DALIResponse {
  private _value: number | boolean

  public get value() {
    return this._value
  }

  constructor(bytecode: number, code: DALICommandCode) {
    if (code === DALICommandCode.QueryStatus 
      || (code >= DALICommandCode.QueryVersionNumber && code <= DALICommandCode.QueryPhysicalMinLevel)
      || (code >= DALICommandCode.QueryActualLevel && code <= DALICommandCode.QueryFadeTimeAndRate)
      || (code >= DALICommandCode.QuerySceneLevel && code <= DALICommandCode.ReadMemoryLocation)
      || (code >= DALICommandCode.QueryGearType && code <= DALICommandCode.QueryFailStatus)
      || (code >= DALICommandCode.QueryOperatingMode && code <= DALICommandCode.QueryMinFastFadeTime)
      || code === DALICommandCode.QueryShortAddress) {
      this._value = bytecode as number
    }
    
    if ((code >= DALICommandCode.QueryGearPresent && code <= DALICommandCode.QueryMissingShortAddress)
      || code === DALICommandCode.QueryPowerFailure
      || (code >= DALICommandCode.QueryShortCircuit && code <= DALICommandCode.QueryCurrentProtectorEnable)
      || code === DALICommandCode.Compare
      || code === DALICommandCode.VerifyShortAddress) {
      this._value = bytecode as number
    }

    if (code === DALICommandCode.QueryExtendedVersionNumber || code === DALICommandCode.WriteMemoryLocation) {
      if (bytecode == 0) {
        this._value = false as boolean
      } else {
        this._value = bytecode as number
      }
    }

    throw new Error(`DALI Command HEX(${code}) has no defined response. You can't create one.`)
  }
}