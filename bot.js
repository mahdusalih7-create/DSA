const { Client, GatewayIntentBits, AttachmentBuilder } = require("discord.js");
const axios = require("axios");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

/*
ضع هنا المعالجة التي تريدها
يمكنك تعديل النص أو فلترته أو تحليله
*/
function processText(text) {
  const lines = text.split("\n");

  let functions = [];
  let values = [];
  let tables = [];

  for (let line of lines) {
    const clean = line.trim();

    if (!clean) continue;

    if (clean.includes("function")) {
      functions.push(clean);
    }
    else if (clean.includes("table")) {
      tables.push(clean);
    }
    else {
      values.push(clean);
    }
  }

  return [
    "=== FUNCTIONS ===",
    ...functions,
    "",
    "=== VALUES ===",
    ...values,
    "",
    "=== TABLES ===",
    ...tables
  ].join("\n");
}

async function getContentFromMessage(msg) {
  // ملف مرفوع
  if (msg.attachments.size > 0) {
    const fileURL = msg.attachments.first().url;
    const res = await axios.get(fileURL);
    return res.data;
  }

  // رابط داخل الرسالة
  const urlMatch = msg.content.match(/https?:\/\/\S+/);
  if (urlMatch) {
    const res = await axios.get(urlMatch[0]);
    return res.data;
  }

  return null;
}

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  try {
    const content = await getContentFromMessage(msg);
    if (!content) return;

    const result = processText(content);

    const buffer = Buffer.from(result, "utf-8");
    const file = new AttachmentBuilder(buffer, { name: "dump.txt" });

    msg.reply({ files: [file] });

  } catch (err) {
    console.error(err);
    msg.reply("❌ حدث خطأ أثناء المعالجة");
  }
});

client.login(process.env.TOKEN);
