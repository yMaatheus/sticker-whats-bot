const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const moment = require('moment-timezone');
const fs = require('fs');

const client = new Client({
  restartOnAuthFail: true,
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  },
  ffmpeg: './ffmpeg.exe',
  authStrategy: new LocalAuth({ clientId: "client" })
});
const config = require('./config/config.json');

client.on('qr', (qr) => {
  console.log(`[${moment().tz(config.timezone).format('HH:mm:ss')}] Scan the QR below : `);
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.clear();
  const consoleText = './config/console.txt';
  fs.readFile(consoleText, 'utf-8', (err, data) => {
    if (err) {
      console.log(`[${moment().tz(config.timezone).format('HH:mm:ss')}] Console Text not found!`.yellow);
      console.log(`[${moment().tz(config.timezone).format('HH:mm:ss')}] ${config.name} is Already!`.green);
    } else {
      console.log(data.green);
      console.log(`[${moment().tz(config.timezone).format('HH:mm:ss')}] ${config.name} is Already!`.green);
    }
  });
});

client.on('message', async (message) => {
  if (message.broadcast) return;

  if (!config.groups) {
    const chat = await message.getChat();
    if (chat.isGroup) return;
  }

  // console.log(message);

  if (!message.hasMedia) return;
  if (!message.body.toLowerCase().includes('/bot')) return;

  const stickerTypes = ['image', 'video', 'gif'];
  if (stickerTypes.includes(message.type)) {
    await uploadSticker(client, message);
  }

  if (message.type == "sticker") {
    await uploadMedia(client, message);
  }

  // client.getChatById(message.id.remote).then(async (chat) => {
  //   await chat.sendSeen();
  // });
});

async function uploadSticker(client, message) {
  client.sendMessage(message.from, "*[⏳]* Loading..");
  try {
    const media = await message.downloadMedia();
    client.sendMessage(message.from, media, {
      sendMediaAsSticker: true,
      stickerName: config.name, // Sticker Name = Edit in 'config/config.json'
      stickerAuthor: config.author // Sticker Author = Edit in 'config/config.json'
    }).then(() => {
      client.sendMessage(message.from, "*[✅]* Successfully!");
    });
  } catch {
    client.sendMessage(message.from, "*[❎]* Failed!");
  }
}

async function uploadMedia(client, message) {
  client.sendMessage(message.from, "*[⏳]* Loading..");
  try {
    const media = await message.downloadMedia();
    client.sendMessage(message.from, media).then(() => {
      client.sendMessage(message.from, "*[✅]* Successfully!");
    });
  } catch {
    client.sendMessage(message.from, "*[❎]* Failed!");
  }
}

client.initialize();
