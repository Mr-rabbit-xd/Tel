import axios from "axios";
import fs from "fs";

export async function sendVnote(sock, number, url) {
  console.log(`[INFO] Downloading song from: ${url}`);
  const res = await axios.get(url, { responseType: "arraybuffer" });
  const file = `./${Date.now()}.mp3`;
  fs.writeFileSync(file, res.data);
  console.log(`[INFO] Song downloaded: ${file}`);

  await sock.sendMessage(number + "@s.whatsapp.net", {
    audio: fs.readFileSync(file),
    mimetype: "audio/mpeg",
    ptt: true
  });

  console.log(`[INFO] Voice note sent to ${number}`);
  fs.unlinkSync(file);
}
