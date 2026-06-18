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

// 🔥 1分（ミリ秒）
const DELETE_DELAY = 60 * 1000;

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== TARGET_CHANNEL_ID) return;

  // -----------------------------
  // ① 返信を検知して削除
  // -----------------------------
  if (message.reference) {
    try {
      await message.delete();
      console.log("返信を削除:", message.content);
    } catch (err) {
      console.error("削除エラー:", err);
    }
  }

  // -----------------------------
  // ② 特殊コマンド処理
  // -----------------------------
  const content = message.content;

  if (content.toLowerCase() === "exit") {
    const reply = await message.channel.send("逃げられない");
    setTimeout(async () => {
      try { await message.delete(); } catch {}
      try { await reply.delete(); } catch {}
    }, DELETE_DELAY);
  }

  if (content.includes("誰か") || content.includes("だれか")) {
    const reply = await message.channel.send("そいつに今すぐ「rm -rf」と打て");
    setTimeout(async () => {
      try { await message.delete(); } catch {}
      try { await reply.delete(); } catch {}
    }, DELETE_DELAY);
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
