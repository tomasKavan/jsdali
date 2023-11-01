import { FoxtronDaliAscii, BootMethod as FoxtronBootMethod, FoxtronDALIASCIIResponseEvent, FoxtronDALIASCIIRequestType } from './foxtron-dali-ascii'
import { DALICommand } from './dali-command'

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

waitTillOpen.then(async () => {
  const commands : {cmd: DALICommand, mills: number}[] = [
    { cmd: DALICommand.DAPC(DALICommand.Broadcast(), 0.2), mills: 500},
    { cmd: DALICommand.DAPC(DALICommand.Broadcast(), 0.3), mills: 500},
    { cmd: DALICommand.DAPC(DALICommand.Broadcast(), 0.4), mills: 500},
    { cmd: DALICommand.DAPC(DALICommand.Broadcast(), 0.5), mills: 500},
    { cmd: DALICommand.DAPC(DALICommand.Broadcast(), 0.6), mills: 500},
    { cmd: DALICommand.DAPC(DALICommand.Broadcast(), 0.7), mills: 500},
    { cmd: DALICommand.DAPC(DALICommand.Broadcast(), 0.8), mills: 2000},
    { cmd: DALICommand.Off(DALICommand.Broadcast()), mills: 2000 },
    { cmd: DALICommand.DAPC(DALICommand.Broadcast(), 0.8), mills: 2000},
    { cmd: DALICommand.Off(DALICommand.Broadcast()), mills: 2000 },
  ]
  for (let i in commands) {
    const cmd = commands[i]
    const resp = await master.sendCmd({ type: FoxtronDALIASCIIRequestType.DistinctSend, daliCommand: cmd.cmd})
    console.log(resp)
    await sleep(cmd.mills)
  }
})

async function sleep(milliseconds: number): Promise<null> {
  return new Promise<null>((resolve, reject) => {
    setTimeout(() => {
      resolve(null)
    }, milliseconds)
  })
}
