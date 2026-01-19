import TelegramBot from "node-telegram-bot-api";
import { createPair } from "./pair.js";
import { sendVnote } from "./vnote.js";
import fs from "fs";

const bot = new TelegramBot("YOUR_TELEGRAM_BOT_TOKEN", { polling: true });

console.log("ℹ️ Telegram bot polling started");

bot.onText(/\/vnote (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  console.log(`[Telegram] Command received from ${chatId}: ${match[1]}`);

  if (!match[1]) {
    return bot.sendMessage(chatId, "❌ Format: /vnote 919xxxxxxxx https://link.mp3");
  }

  const args = match[1].split(" ");
  const number = args[0];
  const songUrl = args[1];

  if (!number || !songUrl) {
    return bot.sendMessage(chatId, "❌ Number or song link missing");
  }

  try {
    console.log(`[INFO] Creating pair for ${number}`);
    const { sock, code, sessionPath } = await createPair(number);

    await bot.sendMessage(
      chatId,
      `🔑 Pair Code:\n\n${code}\n\nWhatsApp → Link Device → Pair Code`
    );

    sock.ev.on("connection.update", async (u) => {
      console.log(`[Baileys] Connection update:`, u);

      if (u.connection === "open") {
        console.log(`[Baileys] Connection open, sending vnote to ${number}`);
        try {
          await sendVnote(sock, number, songUrl);
          await bot.sendMessage(chatId, "✅ Voice note sent successfully!");
          console.log(`[SUCCESS] Vnote sent to ${number}`);

          // CLEANUP
          await sock.logout();
          sock.end();
          fs.rmSync(sessionPath, { recursive: true, force: true });
          console.log(`[CLEANUP] Session deleted for ${number}`);
        } catch (e) {
          console.error(`[ERROR] Failed to send voice note:`, e);
          await bot.sendMessage(chatId, "❌ Failed to send voice note");
        }
      }
    });

    sock.ev.on("connection.error", (err) => {
      console.error(`[Baileys ERROR] Connection error:`, err);
    });

  } catch (err) {
    console.error(`[ERROR] Could not create pair:`, err);
    await bot.sendMessage(chatId, "❌ Failed to create pair");
  }
});
