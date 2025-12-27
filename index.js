require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const { Client, GatewayIntentBits, ChannelType } = require("discord.js");

const telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true,
});

const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const USER_CHANNEL_MAP = new Map();

discordClient.once("ready", () => {
  console.log("Discord bot ready");
});

telegramBot.on("message", async (msg) => {
  if (!msg.text && !msg.photo) return;

  const chatId = msg.chat.id;
  const username = msg.from.username || msg.from.first_name || "user";

  let channel = USER_CHANNEL_MAP.get(chatId);

  if (!channel) {
    const guild = discordClient.guilds.cache.first();
    channel = await guild.channels.create({
      name: `ticket-${username}-${chatId}`,
      type: ChannelType.GuildText,
    });
    USER_CHANNEL_MAP.set(chatId, channel);
  }

  if (msg.text) {
    channel.send(
      `📩 **New Message**\n👤 ${username}\n💬 ${msg.text}`
    );
  } else if (msg.photo) {
    channel.send(
      `📷 **Photo received from ${username}**`
    );
  }
});

discordClient.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const channel = message.channel;
  if (!channel.name.startsWith("ticket-")) return;

  const chatId = channel.name.split("-").pop();
  telegramBot.sendMessage(chatId, message.content);
});

discordClient.login(process.env.DISCORD_BOT_TOKEN);
