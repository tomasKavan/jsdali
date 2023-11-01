import { FoxtronDaliAscii, BootMethod as FoxtronBoothMethod } from './foxtron-dali-ascii.ts'

// Init Unipi Patron EVOK API & Foxtron DALI 232 Master
const evok = new Evok('ws://127.0.0.1:8080/ws')
const daliMaster = new FoxtronDaliAscii({path: '/path/to/SerialPort', bootMethod: FoxtronBoothMethod.SetDTR})

// Init Persistent state
PState.init('/path/to/file')

// Lights init
const LS_121_01 = new LightDALI({ busMaster: daliMaster, address: 1})
const LS_121_02 = new LightRelay({ evokAPI: evok, relay: EvokGPIO.R2_1})
const LS_122_01 = new LightDALI({ busMaster: daliMaster, address: 2})
const LS_123_01 = new LightDALI({ busMaster: daliMaster, address: 3})
const LS_123_02 = new LightDALI({ busMaster: daliMaster, address: 4})
const LS_124_01 = new LightDALI({ busMaster: daliMaster, address: 5})
const LS_124_02 = new LightRelay({ evokAPI: evok, relay: EvokGPIO.R2_1})
const LS_125_01 = new LightRelay({ evokAPI: evok, relay: EvokGPIO.R2_1})
const LS_126_01 = new LightDALI({ busMaster: daliMaster, address: 6})
const LS_126_02 = new LightRelay({ evokAPI: evok, relay: EvokGPIO.R2_1})
const LS_126_03 = new LightCCTStripDALI({ busMaster: daliMaster, address: [7, 8]})
const LS_127_01 = new LightDALI({ busMaster: daliMaster, address: 6})
const LS_127_02 = new LightCCTStripDALI({ busMaster: daliMaster, address: [7, 8]})

// Buttons init
const PB_121_01 = new PushButton({ evokAPI: evok, din: EvokGPIO.DI1_1})

// 

Controller.dimm({ controller: [PB_121_01], ballast: [LS_121_01] })
Controller.onoff({ controller: [PB_124_02], ballast: [LS_124_02] })



