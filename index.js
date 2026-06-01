const { Client, GatewayIntentBits, Partials } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Reaction, Partials.Channel]
});

// 🔧 監視したいチャンネルIDを入れる
const TARGET_CHANNEL_ID = "1506624499506876507";

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== TARGET_CHANNEL_ID) return;

  if (message.reference) {
    try {
      await message.delete();
      console.log("返信を削除:", message.content);
    } catch (err) {
      console.error("削除エラー:", err);
    }
  }
});

client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;

  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (err) {
      console.error("リアクション取得エラー:", err);
      return;
    }
  }

  if (reaction.message.channel.id === TARGET_CHANNEL_ID) {
    try {
      await reaction.remove();
      console.log("リアクション削除");
    } catch (err) {
      console.error("リアクション削除エラー:", err);
    }
  }
});

client.login(process.env.BOT_TOKEN);
