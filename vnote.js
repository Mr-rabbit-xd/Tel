import axios from "axios";
import fs from "fs";

export async function sendVnote(sock, number, url) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  const file = `./${Date.now()}.mp3`;
  fs.writeFileSync(file, res.data);

  await sock.sendMessage(number + "@s.whatsapp.net", {
    audio: fs.readFileSync(file),
    mimetype: "audio/mpeg",
    ptt: true
  });

  fs.unlinkSync(file);
}
