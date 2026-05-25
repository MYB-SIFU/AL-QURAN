'use strict';

const axios = require('axios');

const API_BASE      = 'https://YOUR-APP-URL.onrender.com/api';
const DEFAULT_LANG  = 'both';
const SEND_HOUR_UTC = 1;
const SEND_MIN_UTC  = 30;
const STORAGE_KEY   = 'aq_daily_subs';

module.exports = {
  config: {
    name: 'dailyayat',
    aliases: ['dailyverse', 'dailyquran', 'দৈনিকআয়াত', 'subayat'],
    version: '2.0',
    author: 'SIFAT (MYB-SIFU)',
    countDown: 5,
    role: 0,
    shortDescription: { en: 'Subscribe to a daily Quran verse in this group' },
    longDescription: { en: 'Receive one Quran verse every day at 7:30 AM BDT. Per-group language setting supported (en / bn / both).' },
    category: 'islamic',
    guide: {
      en: 'dailyayat on             → Subscribe this group\n'
        + 'dailyayat off            → Unsubscribe\n'
        + 'dailyayat now            → Send a verse right now\n'
        + 'dailyayat status         → Subscription info\n'
        + 'dailyayat lang [en/bn/both] → Set language\n'
        + 'dailyayat next           → Time until next verse\n'
        + 'dailyayat list           → Total subscribed groups',
    },
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID } = event;
    const sub  = (args[0] || '').toLowerCase().trim();
    const subs = getSubs();

    if (!sub || sub === 'on' || sub === 'subscribe' || sub === 'চালু') {
      if (subs[threadID])
        return message.reply(
          `✅ Daily verse is already ON.\n\nLanguage: ${subs[threadID].lang}\n`
          + 'To change: dailyayat lang en\nTo stop: dailyayat off',
        );
      subs[threadID] = { lang: DEFAULT_LANG, since: Date.now() };
      saveSubs(subs);
      return message.reply(
        '✅ Daily verse ENABLED!\n\n'
        + `⏰ Delivery: 7:30 AM BDT (daily)\n`
        + `🌐 Language: ${DEFAULT_LANG} (Arabic + English + Bengali)\n\n`
        + 'dailyayat now       → Get one now\n'
        + 'dailyayat lang en   → English only\n'
        + 'dailyayat off       → Unsubscribe',
      );
    }

    if (sub === 'off' || sub === 'unsubscribe' || sub === 'বন্ধ') {
      if (!subs[threadID]) return message.reply('ℹ️ Not subscribed.\n\nType: dailyayat on');
      delete subs[threadID];
      saveSubs(subs);
      return message.reply('❌ Daily verse DISABLED.\n\nType: dailyayat on  to re-enable.');
    }

    if (sub === 'now' || sub === 'এখন') {
      return sendDailyVerse(api, threadID, message, subs[threadID]?.lang || DEFAULT_LANG);
    }

    if (sub === 'status' || sub === 'info') {
      if (!subs[threadID]) return message.reply('📋 Not subscribed.\n\nType: dailyayat on');
      const info  = subs[threadID];
      const since = info.since ? new Date(info.since).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unknown';
      return message.reply(
        `📋 Daily Verse Status\n${'─'.repeat(28)}\n`
        + `✅ Subscribed:  Yes\n`
        + `🌐 Language:    ${info.lang}\n`
        + `📅 Since:       ${since}\n`
        + `⏰ Next verse:  ${nextTimeStr()}\n\n`
        + 'dailyayat now  |  dailyayat lang bn  |  dailyayat off',
      );
    }

    if (sub === 'lang' || sub === 'language' || sub === 'ভাষা') {
      const val = (args[1] || '').toLowerCase().trim();
      if (!['en', 'bn', 'both'].includes(val))
        return message.reply('❌ Options:\n  dailyayat lang en\n  dailyayat lang bn\n  dailyayat lang both');
      if (!subs[threadID]) subs[threadID] = { since: Date.now() };
      subs[threadID].lang = val;
      saveSubs(subs);
      const label = { en: 'English only', bn: 'Bengali only', both: 'Arabic + English + Bengali' }[val];
      return message.reply(`✅ Language set to: ${label}\n\nTry now: dailyayat now`);
    }

    if (sub === 'next' || sub === 'time') {
      return message.reply(`⏰ Next daily verse: ${nextTimeStr()}\n\nGet one now: dailyayat now`);
    }

    if (sub === 'list' || sub === 'count') {
      return message.reply(`📊 Subscribed groups: ${Object.keys(getSubs()).length}`);
    }

    return message.reply(
      '☪️ Daily Verse Commands:\n'
      + '  dailyayat on/off     → Subscribe / Unsubscribe\n'
      + '  dailyayat now        → Get verse immediately\n'
      + '  dailyayat status     → Subscription info\n'
      + '  dailyayat lang [code]→ en / bn / both\n'
      + '  dailyayat next       → Countdown to next verse',
    );
  },
};

async function sendDailyVerse(api, threadID, message, lang) {
  try {
    lang = lang || DEFAULT_LANG;
    const { data: res } = await axios.get(`${API_BASE}/random`);
    const v   = res.data;
    const sep = '─'.repeat(30);
    let text  = `☪️ Daily Verse\n${sep}\n📖 ${v.surah_name} (${v.surah_number}:${v.ayah})\n\n🕌 ${v.text}\n\n${sep}\n`;
    if (lang !== 'bn') text += `🇬🇧 ${v.translation_en}\n`;
    if (lang !== 'en' && v.translation_bn) text += (lang === 'both' ? '\n' : '') + `🇧🇩 ${v.translation_bn}\n`;
    text += `\n💡 alquran read ${v.surah_number}`;
    if (message) return message.reply(text);
    return api.sendMessage(text, threadID);
  } catch (err) {
    const msg = err?.response?.data?.error || err.message;
    if (message) return message.reply(`❌ Error: ${msg}`);
    console.error(`[dailyayat] ${threadID}: ${msg}`);
  }
}

function getSubs() {
  try { return JSON.parse(global.GoatBot?.onEvent?.[STORAGE_KEY] || '{}'); }
  catch { return {}; }
}

function saveSubs(obj) {
  if (!global.GoatBot)         global.GoatBot = {};
  if (!global.GoatBot.onEvent) global.GoatBot.onEvent = {};
  global.GoatBot.onEvent[STORAGE_KEY] = JSON.stringify(obj);
}

function nextTimeStr() {
  const now  = new Date();
  const next = new Date();
  next.setUTCHours(SEND_HOUR_UTC, SEND_MIN_UTC, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  const diff = next - now;
  const h    = Math.floor(diff / 3_600_000);
  const m    = Math.floor((diff % 3_600_000) / 60_000);
  return `in ${h}h ${m}m  (7:30 AM BDT)`;
}

module.exports.sendDailyVerse = sendDailyVerse;
module.exports.getSubs        = getSubs;
