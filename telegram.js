import TelegramBot from "node-telegram-bot-api";
import { createPair } from "./pair.js";
import { sendVnote } from "./vnote.js";
import fs from "fs";

const bot = new TelegramBot("YOUR_TELEGRAM_BOT_TOKEN", { polling: true });

bot.onText(/\/vnote (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;

  if (!match[1]) {
    return bot.sendMessage(chatId, "❌ Format:\n/vnote 919xxxxxxxx https://link.mp3");
  }

  const args = match[1].split(" ");
  const number = args[0];
  const songUrl = args[1];

  if (!number || !songUrl) {
    return bot.sendMessage(chatId, "❌ Number or song link missing");
  }

  const { sock, code, sessionPath } = await createPair(number);

  await bot.sendMessage(
    chatId,
    `🔑 Pair Code:\n\n${code}\n\nWhatsApp → Link Device → Pair Code`
  );

  sock.ev.on("connection.update", async (u) => {
    if (u.connection === "open") {
      try {
        await sendVnote(sock, number, songUrl);

        await bot.sendMessage(chatId, "✅ Voice note sent successfully!");

        // 🔥 CLEANUP
        await sock.logout();
        sock.end();

        fs.rmSync(sessionPath, { recursive: true, force: true });

      } catch (e) {
        await bot.sendMessage(chatId, "❌ Failed to send voice note");
      }
    }
  });
});
