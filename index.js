import dotenv from "dotenv";
dotenv.config();

import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder
} from "discord.js";

import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus
} from "@discordjs/voice";

import fs from "fs";
import path from "path";
import express from "express";

// ===============================
//  sounds フォルダから音声ファイルを読み込む
// ===============================
const SOUND_DIR = "./sounds";

function getSoundFiles() {
  const files = fs.readdirSync(SOUND_DIR);
  return files
    .filter(f => f.endsWith(".mp3") || f.endsWith(".wav"))
    .map(f => path.join(SOUND_DIR, f));
}

// ===============================
//  Discord Bot 設定
// ===============================
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// ===============================
//  Slash Commands
// ===============================
const commands = [
  new SlashCommandBuilder().setName("play").setDescription("音声を再生します"),
  new SlashCommandBuilder().setName("stop").setDescription("音声を停止します"),
  new SlashCommandBuilder().setName("skip").setDescription("次の音声にスキップします"),
  new SlashCommandBuilder().setName("random").setDescription("ランダムに音声を再生します"),
  new SlashCommandBuilder().setName("repeat").setDescription("同じ音声を繰り返し再生します"),
  new SlashCommandBuilder().setName("info").setDescription("現在の音声情報を表示します")
].map(cmd => cmd.toJSON());

// ===============================
//  音声プレイヤー
// ===============================
let player = createAudioPlayer();
let currentIndex = 0;
let repeatMode = false;

async function startPlayback(connection) {
  const files = getSoundFiles();
  if (files.length === 0) {
    console.log("sounds フォルダに音声ファイルがありません");
    return;
  }

  const file = files[currentIndex];
  console.log("再生ファイル:", file);

  const resource = createAudioResource(file);
  player.play(resource);
  connection.subscribe(player);
}

player.on(AudioPlayerStatus.Idle, () => {
  if (!repeatMode) {
    const files = getSoundFiles();
    currentIndex = (currentIndex + 1) % files.length;
  }
});

// ===============================
//  Bot 起動
// ===============================
client.once("clientReady", () => {
  console.log(`Bot起動: ${client.user.tag}`);
});

// ===============================
//  Slash Command 登録
// ===============================
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log("スラッシュコマンド登録完了");
  } catch (err) {
    console.error("コマンド登録エラー:", err);
  }
})();

// ===============================
//  コマンド処理
// ===============================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  const channel = interaction.member.voice.channel;
  if (!channel) {
    return interaction.reply("VCに参加してからコマンドを使ってください。");
  }

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: interaction.guild.id,
    adapterCreator: interaction.guild.voiceAdapterCreator,
    selfDeaf: false,
    selfMute: false
  });

  if (commandName === "play") {
    await startPlayback(connection);
    interaction.reply("再生を開始しました！");
  }

  if (commandName === "stop") {
    player.stop();
    interaction.reply("停止しました！");
  }

  if (commandName === "skip") {
    const files = getSoundFiles();
    currentIndex = (currentIndex + 1) % files.length;
    await startPlayback(connection);
    interaction.reply("スキップしました！");
  }

  if (commandName === "random") {
    const files = getSoundFiles();
    currentIndex = Math.floor(Math.random() * files.length);
    await startPlayback(connection);
    interaction.reply("ランダム再生しました！");
  }

  if (commandName === "repeat") {
    repeatMode = !repeatMode;
    interaction.reply(`リピートモード: ${repeatMode ? "ON" : "OFF"}`);
  }

  if (commandName === "info") {
    const files = getSoundFiles();
    interaction.reply(`現在の音声: ${files[currentIndex]}`);
  }
});

// ===============================
//  Ping Server（MWS用）
// ===============================
const app = express();
app.get("/", (req, res) => res.send("Ping server running"));
app.listen(3000);

// ===============================
//  ログイン
// ===============================
client.login(TOKEN);
