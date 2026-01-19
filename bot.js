import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import Pino from "pino";
import fs from "fs";

export async function createPair(number) {
  const sessionPath = `./session/${number}`;

  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  const sock = makeWASocket({
    auth: state,
    logger: Pino({ level: "silent" }),
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  const code = await sock.requestPairingCode(number);

  return { sock, code, sessionPath };
}
