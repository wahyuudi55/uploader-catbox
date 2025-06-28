const express = require('express');
const fs = require('fs');
const fetch = require('node-fetch');
const FormData = require('form-data');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); 

async function CatboxUpload(filePath) {
  const form = new FormData();
  form.append("fileToUpload", fs.createReadStream(filePath));
  form.append("reqtype", "fileupload");

  const res = await fetch("https://catbox.moe/user/api.php", {
    method: "POST",
    body: form,
    headers: form.getHeaders(),
  });

  return await res.text();
}

app.post("/", async (req, res) => {
  const { base64 } = req.body;

  if (!base64 || !base64.includes('base64,')) {
    return res.status(400).json({ status: 400, error: "base64 data is required" });
  }

  try {
    const matches = base64.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) throw new Error("Invalid base64 format");

    const mime = matches[1]; // contoh: image/png, video/mp4
    const ext = mime.split("/")[1]; // contoh: png, mp4
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `${uuidv4()}.${ext}`;
    const filepath = `uploads/${filename}`;

    if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
    fs.writeFileSync(filepath, buffer);

    const link = await CatboxUpload(filepath);
    fs.unlinkSync(filepath); 

    res.json({
      status: 200,
      owner: "whyuxD",
      link
    });

  } catch (e) {
    res.status(500).json({ status: 500, error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});