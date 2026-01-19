import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import Pino from "pino";
import fs from "fs";

export async function createPair(number) {
  const sessionPath = `./session/${number}`;
  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
    console.log(`[INFO] Session folder created: ${sessionPath}`);
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  const sock = makeWASocket({
    auth: state,
    logger: Pino({ level: "info" }),
    printQRInTerminal: true
  });

  sock.ev.on("creds.update", saveCreds);
  console.log(`[INFO] Baileys socket initialized for ${number}`);

  const code = await sock.requestPairingCode(number);
  console.log(`[INFO] Pair code generated for ${number}: ${code}`);

  return { sock, code, sessionPath };
}
