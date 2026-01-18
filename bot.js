import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys'
import fs from 'fs'
import axios from 'axios'
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import os from 'os'

export async function startPair(number, songUrl, onPair) {

  const sessionPath = './sessions/' + number
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath)

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  })

  sock.ev.on('creds.update', saveCreds)

  // Pair Code
  if (!state.creds.registered) {
    const code = await sock.requestPairingCode(number)
    onPair(code)
  }

  // When linked → send voice note
  sock.ev.on('creds.update', async () => {
    if (sock.authState.creds.registered) {
      await sendVoiceNote(sock, number, songUrl)
    }
  })
}

async function sendVoiceNote(sock, number, url) {

  const input = path.join(os.tmpdir(), `song-${Date.now()}.mp3`)
  const output = input + '.ogg'

  const res = await axios.get(url, { responseType: 'arraybuffer' })
  fs.writeFileSync(input, res.data)

  await new Promise((resolve, reject) => {
    ffmpeg(input)
      .noVideo()
      .audioCodec('libopus')
      .audioBitrate('48k')
      .format('ogg')
      .on('end', resolve)
      .on('error', reject)
      .save(output)
  })

  await sock.sendMessage(number + '@s.whatsapp.net', {
    audio: fs.readFileSync(output),
    mimetype: 'audio/ogg; codecs=opus',
    ptt: true
  })

  fs.unlinkSync(input)
  fs.unlinkSync(output)
}
