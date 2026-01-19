
import TelegramBot from "node-telegram-bot-api";
import { createPair } from "./pair.js";
import { sendVnote } from "./vnote.js";
import fs from "fs";

const bot = new TelegramBot("8285550814:AAF8fiXtfhFHH5w1di0ElOUFUnUBBJezQ6M", { polling: true });

console.log("ℹ️ Telegram bot polling shuru hoyeche");

const activeSessions = new Map();

bot.onText(/\/vnote (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  console.log(`[Telegram] Command peyechi ${chatId} theke: ${match[1]}`);

  if (!match[1]) {
    return bot.sendMessage(chatId, "❌ Format: /vnote 919xxxxxxxx https://link.mp3");
  }

  const args = match[1].split(" ");
  const number = args[0];
  const songUrl = args[1];

  if (!number || !songUrl) {
    return bot.sendMessage(chatId, "❌ Number ba song link missing");
  }

  if (activeSessions.has(number)) {
    return bot.sendMessage(chatId, "⏳ Ei number already process hochhe. Ektu wait koro.");
  }

  activeSessions.set(number, true);

  try {
    console.log(`[INFO] Pair create korchi ${number} er jonno`);
    const { sock, code, sessionPath } = await createPair(number);

    await bot.sendMessage(
      chatId,
      `🔑 Pair Code:\n\n\`${code}\`\n\nWhatsApp → Link Device → Pair Code te paste koro`,
      { parse_mode: "Markdown" }
    );

    const pairTimeout = setTimeout(() => {
      console.log(`[TIMEOUT] Pairing timeout hoyeche ${number} er jonno`);
      cleanup();
      bot.sendMessage(chatId, "⏱️ Pairing timeout! Abar try koro.");
    }, 5 * 60 * 1000);

    const cleanup = () => {
      clearTimeout(pairTimeout);
      activeSessions.delete(number);
      try {
        sock.end();
        if (fs.existsSync(sessionPath)) {
          fs.rmSync(sessionPath, { recursive: true, force: true });
          console.log(`[CLEANUP] Session delete hoyeche ${number} er jonno`);
        }
      } catch (e) {
        console.error(`[CLEANUP ERROR]`, e);
      }
    };

    sock.ev.on("connection.update", async (u) => {
      console.log(`[Baileys] Connection update:`, u);

      if (u.connection === "open") {
        clearTimeout(pairTimeout);
        console.log(`[Baileys] Connection open, vnote pathacchi ${number} e`);
        
        try {
          await sendVnote(sock, number, songUrl);
          await bot.sendMessage(chatId, "✅ Voice note successfully pathano hoyeche!");
          console.log(`[SUCCESS] Vnote pathano hoyeche ${number} e`);
        } catch (e) {
          console.error(`[ERROR] Voice note pathanote problem:`, e);
          await bot.sendMessage(chatId, `❌ Voice note pathate parini: ${e.message}`);
        } finally {
          await sock.logout().catch(() => {});
          cleanup();
        }
      }

      if (u.connection === "close") {
        const shouldReconnect = u.lastDisconnect?.error?.output?.statusCode !== 401;
        console.log(`[Baileys] Connection close hoyeche. Reconnect korbo: ${shouldReconnect}`);
        
        if (!shouldReconnect) {
          await bot.sendMessage(chatId, "❌ Connection fail hoyeche. Abar try koro.");
          cleanup();
        }
      }
    });

    sock.ev.on("creds.update", () => {
      console.log(`[Baileys] Credentials update hoyeche ${number} er jonno`);
    });

    sock.ev.on("connection.error", (err) => {
      console.error(`[Baileys ERROR] Connection error:`, err);
    });

  } catch (err) {
    console.error(`[ERROR] Pair create korte parini:`, err);
    await bot.sendMessage(chatId, `❌ Pair create korte parini: ${err.message}`);
    activeSessions.delete(number);
  }
});

process.on("SIGINT", () => {
  console.log("Bot bondho korchi...");
  bot.stopPolling();
  process.exit(0);
});
```

Pura file ta replace kore dao. **Unexpected end of input** mane kono bracket ba curly brace missing ache. Ei code ta complete, shob kichu ache. Copy kore `telegram.js` file e paste kore dao.
