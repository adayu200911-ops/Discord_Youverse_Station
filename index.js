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

import express from "express";
import fetch from "node-fetch";

// ===============================
// GitHub /sounds/ から MP3 を自動取得（HTML解析）
// ===============================
const OWNER = "adayu200911-ops";
const REPO = "Discord_Youverse_Station";

async function fetchAudioFiles() {
  const url = `https://github.com/${OWNER}/${REPO}/tree/main/sounds`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "DiscordBot",
        "Accept": "text/html"
      }
    });

    const html = await res.text();

    // MP3 ファイル名を抽出
    const regex = /href="\/${OWNER}\/${REPO}\/blob\/main\/sounds\/([^"]+\.mp3)"/g;
    let match;
    const files = [];

    while ((match = regex.exec(html)) !== null) {
      const filename = match[1];
      const rawUrl = `https://raw.githubusercontent.com/${OWNER}/${REPO}/main/sounds/${filename}`;
      files.push(rawUrl);
    }

    console.log("取得した音声ファイル:", files);
    return files;
  } catch (err) {
    console.error("GitHub HTML 取得エラー:", err);
    return [];
  }
}

// ===============================
// Discord Bot 設定
// ===============================
const TOKEN = process.env.DISCORD_TOKEN