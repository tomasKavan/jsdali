import { SerialPort } from 'serialport'

// const stdin = process.stdin;
// //stdin.setRawMode(true);
// stdin.resume();
// stdin.setEncoding('utf8');

const path = '/dev/tty.usbserial-A50285BI'
console.log(`Opening serial port ${path}`)
let port: SerialPort = new SerialPort({ path: path, baudRate: 19200, parity: 'even', stopBits: 1})

// stdin.on('data', (input) => {
//   if (!port.isOpen) {
//     return
//   }

//   const inputStr = input.toString()
//   const inputVal = parseInt(inputStr)
//   if (inputVal >= 0 && inputVal <= 255) {
//     send(inputVal)
//   }
  
// })

// async function send(val: number) {
//   const addr = 0xFE;
//   let addrStr = addr.toString(16)
//   if (addr < 0x10) {
//     addrStr = '0' + addrStr
//   }
//   let valStr = val.toString(16)
//   if (val < 0x10) {
//     valStr = '0' + valStr
//   }
//   const cs = (0xFF - ((0x01 + 0x00 + 0x10 + addr + val) % 0x100))
//   let csStr = cs.toString(16)
//   if (cs < 0x10) {
//     csStr = '0' + csStr
//   }

//   const data = String.fromCharCode(0x01) + '010010' + addrStr + valStr + csStr + String.fromCharCode(0x17)
//   console.log(`Sending message ${data.split('')}`)

//   console.log(port)
//   await port.write(data)
// }

port.on('open', async () => {
  console.log('Port is Open')
  console.log('Setting DTR output')
  await port.set({dtr: true})
  console.log('Waiting for DALI Master to startup')
  
  setTimeout(sendMessage(port), 3000)
})

port.on('data', (data) => {
  console.log(data.toString())
})

async function clean() {
  await port.close()
  console.log('Port is closed')
}

function checksum(data: number): number {
  let sum = 0
  let val = data
  while (val > 0) {
    sum += val % 0x100
    val = Math.floor(val / 0x100)
    console.log(`Sum: ${sum}, Val: ${val}`)
  }
  return sum % 0x100
}

function strChecksum(str: String): String {
  if (str.length % 2 == 1) {
    str = '0' + str
  }

  let sum = 0
  for (let i = 0 ; i < str.length ; i += 2) {
    const number = parseInt(str[i] + str[i+1], 16)
    if (isNaN(number) || number < 0 || number > 255) {
      throw new Error(`Foxtron DALI ASCII checkum calc error. Wrong input - got '${str[i] + str[i+1]}' (must be between between 0 and F)`)
    }
    sum += number
  }
  const mod = sum % 0x100
  const negmod = 0xFF - mod
  return negmod.toString(16).toUpperCase()
}

function _strChecksumTest() {
  const csTests = [
    ['10010FF00', 'EF'],
    ['010010FF10', 'DF'],
    ['010010FF05', 'EA']
  ]

  for (const i in csTests) {
    const test = csTests[i]
    const cs = strChecksum(test[0])
    if (cs !== test[1]) {
      throw new Error(`Function strCheckum test failed. Message '${test[0]}' should be '${test[1]}', is '${cs}'.`)
    }
  }
}
_strChecksumTest()


function toASCII(data: number): string {
  return data.toString(16)
}

function foxtronMesage(data: number): string {
  const cs = checksum(data)
  const ascii = toASCII(data)
  return String.fromCharCode(0x01) + ascii + cs + String.fromCharCode(0x17)
}

function sendMessage(port: SerialPort) {
  return async() => {
    console.log('Sending message')
    const data = 0x010010FF00
    const message = foxtronMesage(data)

    const messageScene = String.fromCharCode(0x01) + '010010FF10DF' + String.fromCharCode(0x17)
    const messageOff = String.fromCharCode(0x01) + '010010FF00EF' + String.fromCharCode(0x17)
    const messageOn = String.fromCharCode(0x01) + '010010FF05EA' + String.fromCharCode(0x17)
    const messageHalf = String.fromCharCode(0x01) + '010010FE8070' + String.fromCharCode(0x17)
    console.log(`The message is ${messageOn.split('')}, length: ${messageOn.length}`)

    await port.write(messageOff)
    //setTimeout(clean(port), 30000)
  }
}