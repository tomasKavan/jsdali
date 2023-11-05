import { FoxtronDaliAscii, BootMethod as FoxtronBootMethod, FoxtronDALIASCIIResponseEvent, FoxtronDALIASCIIRequestType } from './foxtron-dali-ascii'
import { DALICommand, DALICommandCode } from './dali-command'

const path = '/dev/tty.usbserial-A50285BI'
console.log(`Opening serial port ${path}`)
const master = new FoxtronDaliAscii({
  path: path,
  bootMethod: FoxtronBootMethod.SetDTR
})

master.on(FoxtronDALIASCIIResponseEvent.Any, (response) => {
  console.log('A communication received: ')
  console.log(response)
})

const waitTillOpen = new Promise<void>((resolve, reject) => {
  const interval = setInterval(() => {
    if (master.isOpen) {
      clearInterval(interval)
      resolve()
    }
  }, 500)
})

async function setRandom(master: FoxtronDaliAscii, random: number) {
  const setH = {
    type: FoxtronDALIASCIIRequestType.DistinctSend,
    daliCommand: new DALICommand(DALICommandCode.SearchAddressH, undefined, random),
  }
  const setM = {
    type: FoxtronDALIASCIIRequestType.DistinctSend,
    daliCommand: new DALICommand(DALICommandCode.SearchAddressM, undefined, random),
  }
  const setL = {
    type: FoxtronDALIASCIIRequestType.DistinctSend,
    daliCommand: new DALICommand(DALICommandCode.SearchAddressL, undefined, random),
  }
  await master.sendCmd(setH)
  await master.sendCmd(setM)
  await master.sendCmd(setL)
}

waitTillOpen.then(async () => {
  const initialize = {
    type: FoxtronDALIASCIIRequestType.DistinctSend,
    daliCommand: new DALICommand(DALICommandCode.Initialize),
    doubleSend: true
  }
  const randomize = {
    type: FoxtronDALIASCIIRequestType.DistinctSend,
    daliCommand: new DALICommand(DALICommandCode.Randomize),
    doubleSend: true
  }

  const respTer = await master.sendCmd(FoxtronDaliAscii.SpecialDALIRequest(DALICommandCode.Terminate))
  console.log(`Terminate: ${JSON.stringify(respTer)}`)
  
  await sleep(500)

  const resp = await master.sendCmd(initialize)
  console.log(`Initialize: ${JSON.stringify(resp)}`)

  await sleep(500)

  const resp2 = await master.sendCmd(randomize)
  console.log(`Randomize: ${JSON.stringify(resp2)}`)

  await sleep(1000)

  let searchMax = 0xFFFFFF
  let searchMin = 0x000000
  let search = Math.floor(searchMax/2)

  while(searchMin !== search) {
    console.log(`Search Max(${searchMax.toString(16)}) - Bin(${searchMin.toString(16)}) - Min(${search.toString(16)})`)
    await master.setSearchAddress(search)

    const compare = {
      type: FoxtronDALIASCIIRequestType.DistinctSend,
      daliCommand: new DALICommand(DALICommandCode.Compare),
    }
    const respCompare = await master.sendCmd(compare)
    console.log(`Compare: ${respCompare?.daliResponse?.value ? 'TRUE' : 'FALSE'} | ${JSON.stringify(respCompare)}`)

    if (respCompare?.daliResponse?.value) {
      searchMax = search
    } else {
      searchMin = search
    }
    search = searchMin + Math.floor((searchMax-searchMin)/2)

  }

  search++
  await master.setSearchAddress(search)
  console.log(`Ballast found on Random(${search.toString(16)})`)

  const ping = {
    type: FoxtronDALIASCIIRequestType.DistinctSend,
    daliCommand: new DALICommand(DALICommandCode.Ping)
  }
  const respPing = await master.sendCmd(ping)
  console.log(`Ping: ${JSON.stringify(respPing)}`)

  await sleep(3000)

  const setShort = {
    type: FoxtronDALIASCIIRequestType.DistinctSend,
    daliCommand: new DALICommand(DALICommandCode.ProgramShortAddress, undefined, 10),
  }
  const respSet = await master.sendCmd(setShort)
  console.log(`Short address set to: 10. Response: ${JSON.stringify(respSet)}`)

  await sleep(2000)

  const withdr = {
    type: FoxtronDALIASCIIRequestType.DistinctSend,
    daliCommand: new DALICommand(DALICommandCode.Withdraw),
  }
  const respwithdr = await master.sendCmd(withdr)
  console.log(`Ballst withdrawn: ${JSON.stringify(respwithdr)}`)

  await sleep(1000)

  const t2resp = await master.sendCmd(FoxtronDaliAscii.SpecialDALIRequest(DALICommandCode.Terminate))
  console.log(`Init Terminated: ${JSON.stringify(t2resp)}`)

  await sleep(1000)

  const setOn = {
    type: FoxtronDALIASCIIRequestType.DistinctSend,
    daliCommand: DALICommand.DAPC(DALICommand.Short(10), 0.5)
  }
  const setOnResp = await master.sendCmd(setOn)
  console.log(`Set on response: ${JSON.stringify(setOnResp)}`)

  // Found -> search + 1
      // Set Short address
      // Withdraw

  




  // If true - cut lower half
  


  // const commands : {cmd: DALICommand, mills: number}[] = [
  //   { cmd: DALICommand.DAPC(DALICommand.Broadcast(), 0.2), mills: 500},
  //   { cmd: DALICommand.DAPC(DALICommand.Broadcast(), 0.3), mills: 500},
  //   { cmd: DALICommand.DAPC(DALICommand.Broadcast(), 0.4), mills: 500},
  //   { cmd: DALICommand.DAPC(DALICommand.Broadcast(), 0.5), mills: 500},
  //   { cmd: DALICommand.DAPC(DALICommand.Broadcast(), 0.6), mills: 500},
  //   { cmd: DALICommand.DAPC(DALICommand.Broadcast(), 0.7), mills: 500},
  //   { cmd: DALICommand.DAPC(DALICommand.Broadcast(), 0.8), mills: 2000},
  //   { cmd: DALICommand.Off(DALICommand.Broadcast()), mills: 2000 },
  //   { cmd: DALICommand.DAPC(DALICommand.Broadcast(), 0.8), mills: 2000},
  //   { cmd: DALICommand.Off(DALICommand.Broadcast()), mills: 2000 },
  // ]
  // for (let i in commands) {
  //   const cmd = commands[i]
  //   const resp = await master.sendCmd({ type: FoxtronDALIASCIIRequestType.DistinctSend, daliCommand: cmd.cmd})
  //   console.log(resp)
  //   await sleep(cmd.mills)
  // }
})

async function sleep(milliseconds: number): Promise<null> {
  return new Promise<null>((resolve, reject) => {
    setTimeout(() => {
      resolve(null)
    }, milliseconds)
  })
}
