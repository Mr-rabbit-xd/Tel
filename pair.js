import makeWASocket, { 
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  DisconnectReason
} from "@whiskeysockets/baileys";
import Pino from "pino";
import fs from "fs";

export async function createPair(number) {
  const sessionPath = `./session/${number}`;
  
  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
    console.log(`[INFO] Session folder created: ${sessionPath}`);
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "silent" }))
    },
    logger: Pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 30000,
    retryRequestDelayMs: 2000,
    markOnlineOnConnect: false
  });

  sock.ev.on("creds.update", saveCreds);
  console.log(`[INFO] Baileys socket initialized for ${number}`);

  // Phone number clean koro
  const cleanNumber = number.replace(/[^0-9]/g, "");
  
  // Retry logic with 3 attempts
  let attempts = 0;
  let code = null;
  
  while (attempts < 3) {
    try {
      console.log(`[INFO] Pairing code request attempt ${attempts + 1}/3 for ${cleanNumber}`);
      code = await sock.requestPairingCode(cleanNumber);
      console.log(`[SUCCESS] Pair code generated for ${cleanNumber}: ${code}`);
      break;
    } catch (err) {
      attempts++;
      console.error(`[ERROR] Attempt ${attempts}/3 failed for ${cleanNumber}:`, err.message);
      
      if (attempts >= 3) {
        throw new Error(`Failed to generate pairing code after 3 attempts: ${err.message}`);
      }
      
      // Wait 3 seconds before retry
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  if (!code) {
    throw new Error("Pairing code generation failed");
  }

  return { sock, code, sessionPath };
}
