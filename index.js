import TelegramBot from 'node-telegram-bot-api'
import { startPair } from './bot.js'

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true })

bot.onText(/\/vnote (\d+) (https?:\/\/\S+)/, async (msg, match) => {

  const chatId = msg.chat.id
  const number = match[1]
  const link = match[2]

  await bot.sendMessage(chatId, '⏳ Pair code generate হচ্ছে...')

  startPair(number, link, (code) => {
    bot.sendMessage(
      chatId,
      `📲 *WhatsApp Pair Code*\n\n\`${code}\`\n\nWhatsApp → Link device → Pair code`,
      { parse_mode: 'Markdown' }
    )
  })
})
