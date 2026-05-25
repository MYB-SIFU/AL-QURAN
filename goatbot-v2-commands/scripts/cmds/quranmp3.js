'use strict';

const axios = require('axios');

const API_BASE        = 'https://quran-json--cdibot58.replit.app';
const DEFAULT_RECITER = 1;
const MAX_SAFE_AYAHS  = 50;
const TIMEOUT_SURAH   = 120_000;
const TIMEOUT_AYAH    = 30_000;

const RECITERS = {
  1: 'Mishari Rashid al-Afasy',
  2: 'Abdur-Rahman as-Sudais',
  3: 'Saad al-Ghamdi',
  4: 'Muhammad al-Minshawi',
  5: 'Mahmoud Khalil al-Husary',
};

const HELP = `🎵 QURAN MP3 — Audio Recitation\n${'─'.repeat(32)}
quranmp3 1           → Surah Al-Fatiha (default reciter)
quranmp3 36 2        → Surah Ya-Sin (As-Sudais)
quranmp3 2:255       → Ayatul Kursi MP3
quranmp3 2:255 3     → Ayatul Kursi (Al-Ghamdi)
quranmp3 reciters    → List all 5 reciters
${'─'.repeat(32)}
Default reciter: ${RECITERS[DEFAULT_RECITER]}`;

module.exports = {
  config: {
    name: 'quranmp3',
    aliases: ['quranaudio', 'tilawat', 'ayatmp3', 'recite', 'তিলাওয়াত'],
    version: '2.0',
    author: 'SIFAT (MYB-SIFU)',
    countDown: 10,
    role: 0,
    shortDescription: { en: 'Play Quran audio recitation in chat' },
    longDescription: { en: 'Send Quran MP3 in chat — full surah or single ayah. 5 world-renowned reciters. Sources: quranicaudio.com & everyayah.com.' },
    category: 'islamic',
    guide: { en: HELP },
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID } = event;
    const sub = (args[0] || '').toLowerCase().trim();

    if (!sub || sub === 'help')                                  return message.reply(HELP);
    if (['reciters', 'list', 'r'].includes(sub))                return message.reply(buildReciterList());
    if (/^\d+:\d+$/.test(sub))                                  return sendAyahAudio(api, threadID, message, ...sub.split(':').map(Number), clamp(parseInt(args[1])));
    if (/^\d+$/.test(sub)) {
      const sNum = parseInt(sub);
      if (sNum < 1 || sNum > 114) return message.reply('❌ Surah number must be 1–114.');
      return sendSurahAudio(api, threadID, message, sNum, clamp(parseInt(args[1])));
    }
    return message.reply('❓ Unknown command.\nType: quranmp3 help');
  },
};

async function sendSurahAudio(api, threadID, message, sNum, rid) {
  try {
    const { data: res } = await axios.get(`${API_BASE}/surah/${sNum}/recitations`);
    const reciter = res.data.reciters.find(r => r.id === rid);
    if (!reciter) return message.reply('❌ Reciter not found.\nType: quranmp3 reciters');
    const name   = RECITERS[rid] || reciter.name;
    const sName  = res.data.surah;
    const total  = res.data.total_ayahs;
    await message.reply(`⏳ ${total > MAX_SAFE_AYAHS ? `⚠️ Large file (${total} verses) — ` : ''}Loading ${sName} — ${name}...`);
    const stream = (await axios.get(reciter.audio_url, { responseType: 'stream', timeout: TIMEOUT_SURAH, headers: { 'User-Agent': 'Mozilla/5.0' } })).data;
    return api.sendMessage({ body: `🕌 ${sName} (${sNum}) — ${total} verses\n🎙️ ${name}\n\nalquran read ${sNum}  |  quranmp3 ${sNum}:1`, attachment: stream }, threadID);
  } catch (err) {
    return message.reply(errMsg(err, sNum, null));
  }
}

async function sendAyahAudio(api, threadID, message, sNum, aNum, rid) {
  try {
    const [audioRes, verseRes] = await Promise.allSettled([
      axios.get(`${API_BASE}/surah/${sNum}/verse/${aNum}/audio`),
      axios.get(`${API_BASE}/surah/${sNum}/verse/${aNum}`),
    ]);
    if (audioRes.status === 'rejected') throw audioRes.reason;
    const reciter = audioRes.value.data.reciters.find(r => r.id === rid);
    if (!reciter) return message.reply('❌ Reciter not found.\nType: quranmp3 reciters');
    const name  = RECITERS[rid] || reciter.name;
    const sName = audioRes.value.data.surah;
    const v     = verseRes.status === 'fulfilled' ? verseRes.value.data : null;
    await message.reply(`⏳ Loading ${sName} ${sNum}:${aNum} — ${name}...`);
    const stream = (await axios.get(reciter.audio_url, { responseType: 'stream', timeout: TIMEOUT_AYAH, headers: { 'User-Agent': 'Mozilla/5.0' } })).data;
    let body = `🕌 ${sName} (${sNum}:${aNum})\n🎙️ ${name}`;
    if (v?.text)           body += `\n\n${v.text}`;
    if (v?.translation_en) body += `\n\n🇬🇧 ${v.translation_en}`;
    if (v?.translation_bn) body += `\n🇧🇩 ${v.translation_bn}`;
    return api.sendMessage({ body, attachment: stream }, threadID);
  } catch (err) {
    return message.reply(errMsg(err, sNum, aNum));
  }
}

function buildReciterList() {
  return `🎙️ Available Reciters\n${'─'.repeat(32)}\n`
    + Object.entries(RECITERS).map(([id, name]) => `${id}️⃣  ${name}${+id === DEFAULT_RECITER ? '  ✅ default' : ''}`).join('\n')
    + `\n${'─'.repeat(32)}\nUsage: quranmp3 [surah] [id]  or  quranmp3 [surah]:[ayah] [id]`;
}

function clamp(n) {
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : DEFAULT_RECITER;
}

function errMsg(err, sNum, aNum) {
  const detail  = err?.response?.data?.error || err?.response?.data?.message || err.message || 'Unknown error';
  const target  = aNum ? `${sNum}:${aNum}` : `Surah ${sNum}`;
  const suggest = aNum
    ? `💡 Try a different reciter:\n  quranmp3 ${sNum}:${aNum} 2`
    : `💡 Try a single ayah:\n  quranmp3 ${sNum}:1\n  Or different reciter:\n  quranmp3 ${sNum} 2`;
  return `❌ Failed to load ${target}\n${detail}\n\n${suggest}`;
}
