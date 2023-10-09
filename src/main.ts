import { SerialPort } from 'serialport'

const stdin = process.stdin;
//stdin.setRawMode(true);
stdin.resume();
stdin.setEncoding('utf8');

const path = '/dev/tty.usbserial-A50285BI'
console.log(`Opening serial port ${path}`)
let port: SerialPort = new SerialPort({ path: path, baudRate: 19200, parity: 'even', stopBits: 1})

stdin.on('data', (input) => {
  if (!port.isOpen) {
    return
  }

  const inputStr = input.toString()
  const inputVal = parseInt(inputStr)
  if (inputVal >= 0 && inputVal <= 255) {
    send(inputVal)
  }
  
})

async function send(val: number) {
  const addr = 0xFE;
  let addrStr = addr.toString(16)
  if (addr < 0x10) {
    addrStr = '0' + addrStr
  }
  let valStr = val.toString(16)
  if (val < 0x10) {
    valStr = '0' + valStr
  }
  const cs = (0xFF - ((0x01 + 0x00 + 0x10 + addr + val) % 0x100))
  let csStr = cs.toString(16)
  if (cs < 0x10) {
    csStr = '0' + csStr
  }

  const data = String.fromCharCode(0x01) + '010010' + addrStr + valStr + csStr + String.fromCharCode(0x17)
  console.log(`Sending message ${data.split('')}`)

  console.log(port)
  await port.write(data)
}

port.on('open', async () => {
  console.log('Port is Open')
  console.log('Setting DTR output')
  await port.set({dtr: true})
  console.log('Waiting for DALI Master to startup')
  
  //setTimeout(sendMessage(port), 3000)
})

port.on('data', (data) => {
  console.log(data.toString())
})

async function clean() {
  await port.close()
  console.log('Port is closed')
}

// function checksum(data: number): number {
//   let sum = 0
//   let val = data
//   while (val > 0) {
//     sum += val % 0x100
//     val = Math.floor(val / 0x100)
//     console.log(`Sum: ${sum}, Val: ${val}`)
//   }
//   return sum % 0x100
// }

// function toASCII(data: number): string {
//   return data.toString(16)
// }

// function foxtronMesage(data: number): string {
//   const cs = checksum(data)
//   const ascii = toASCII(data)
//   return String.fromCharCode(0x01) + ascii + cs + String.fromCharCode(0x17)
// }

// function sendMessage(port: SerialPort) {
//   return async() => {
//     console.log('Sending message')
//     const data = 0x010010FF00
//     const message = foxtronMesage(data)

//     const messageScene = String.fromCharCode(0x01) + '010010FF10DF' + String.fromCharCode(0x17)
//     const messageOff = String.fromCharCode(0x01) + '010010FF00EF' + String.fromCharCode(0x17)
//     const messageOn = String.fromCharCode(0x01) + '010010FF05EA' + String.fromCharCode(0x17)
//     const messageHalf = String.fromCharCode(0x01) + '010010FE8070' + String.fromCharCode(0x17)
//     console.log(`The message is ${messageOn.split('')}, length: ${messageOn.length}`)

//     await port.write(messageOn)
//     //setTimeout(clean(port), 30000)
//   }
// }