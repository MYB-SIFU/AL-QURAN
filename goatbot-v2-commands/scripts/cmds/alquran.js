'use strict';

const axios = require('axios');

const API_BASE     = 'https://quran-json--cdibot58.replit.app';
const DEFAULT_LANG = 'both';
const PAGE_SIZE    = 5;

const HELP = `☪️ AL QURAN — v3.0\n${'─'.repeat(32)}
alquran               → Random verse
alquran 2:255         → Surah 2, Verse 255
alquran 2:1-7         → Verse range (max 20)
alquran read 36       → Read Surah Ya-Sin (page 1)
alquran read 36 3     → Read page 3
alquran surah 36      → Surah info
alquran search mercy  → Search keyword
alquran search mercy 10 → Search (10 results)
alquran list          → All 114 surahs
${'─'.repeat(32)}
🎵 quranmp3 36        → Audio MP3
🔍 quransearch mercy  → Advanced search`;

module.exports = {
  config: {
    name: 'alquran',
    aliases: ['quran', 'ayat', 'quranbd', 'আয়াত', 'কোরআন'],
    version: '3.0',
    author: 'SIFAT (MYB-SIFU)',
    countDown: 5,
    role: 0,
    shortDescription: { en: 'Al-Quran — Arabic, English & Bengali' },
    longDescription: { en: 'Full-featured Quran command with verse range, paginated reading, surah info, keyword search, and list of all 114 surahs.' },
    category: 'islamic',
    guide: { en: HELP },
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID } = event;
    const sub  = (args[0] || '').toLowerCase().trim();
    const lang = global._quranLang?.[threadID] || DEFAULT_LANG;

    try {
      if (!sub || sub === 'help')                          return message.reply(HELP);
      if (/^\d+:\d+-\d+$/.test(sub))                      return handleRange(api, threadID, message, sub, lang);
      if (/^\d+:\d+$/.test(sub))                          return handleVerse(api, threadID, message, sub, lang);
      if (['read', 'পড়', 'পড়ো'].includes(sub))           return handleRead(api, threadID, message, args, lang);
      if (['surah', 's', 'info'].includes(sub))           return handleSurahInfo(api, threadID, message, args);
      if (['search', 'find', 'খোঁজ', 'খোজ'].includes(sub)) return handleSearch(api, threadID, message, args, lang);
      if (['list', 'তালিকা', 'all'].includes(sub))        return handleList(api, threadID);
      if (/^\d+$/.test(sub))                              return handleNumberShortcut(api, threadID, message, args, lang);
      return message.reply(HELP);
    } catch (err) {
      return message.reply(`❌ ${err?.response?.data?.error || err.message}\n\nAPI: ${API_BASE}`);
    }
  },
};

async function handleRange(api, threadID, message, sub, lang) {
  const [sNum, range] = sub.split(':');
  const [start, end]  = range.split('-').map(Number);
  const sn = parseInt(sNum);
  if (end < start || end - start > 19)
    return message.reply('❌ Range max 20 verses. Example: alquran 2:1-7');
  const lines = [`📖 Surah ${sn} — Verses ${start}–${end}\n${'─'.repeat(32)}`];
  for (let a = start; a <= end; a++) {
    try {
      const { data: res } = await axios.get(`${API_BASE}/surah/${sn}/verse/${a}`);
      const v = res.data;
      lines.push(`\n[${sn}:${a}]\n${v.text}${lang !== 'bn' ? `\n🇬🇧 ${v.translation_en}` : ''}${lang !== 'en' && v.translation_bn ? `\n🇧🇩 ${v.translation_bn}` : ''}`);
    } catch { lines.push(`\n[${sn}:${a}] ─ Not found`); }
  }
  return sendChunked(api, threadID, lines.join('\n'));
}

async function handleVerse(api, threadID, message, sub, lang) {
  const [sNum, aNum] = sub.split(':').map(Number);
  const { data: res } = await axios.get(`${API_BASE}/surah/${sNum}/verse/${aNum}`);
  const v = res.data;
  return api.sendMessage(fmtVerse(v.text, v.translation_en, v.translation_bn, `📖 ${v.surah} (${sNum}:${aNum})`, lang), threadID);
}

async function handleRead(api, threadID, message, args, lang) {
  const sNum = parseInt(args[1]);
  const page = parseInt(args[2]) || 1;
  if (!sNum || sNum < 1 || sNum > 114)
    return message.reply('❌ Surah 1–114 required. Example: alquran read 36');
  const { data: ir } = await axios.get(`${API_BASE}/surah/${sNum}/info`);
  const info   = ir.data;
  const pages  = Math.ceil(info.number_of_ayah / PAGE_SIZE);
  if (page < 1 || page > pages)
    return message.reply(`❌ Page ${page} not found. Surah has ${pages} pages.`);
  const startA = (page - 1) * PAGE_SIZE + 1;
  const endA   = Math.min(page * PAGE_SIZE, info.number_of_ayah);
  const lines  = [`📗 ${info.name} (${sNum}) — Page ${page}/${pages}`, `📍 Verses ${startA}–${endA} of ${info.number_of_ayah}`, '─'.repeat(32)];
  for (let a = startA; a <= endA; a++) {
    const { data: vr } = await axios.get(`${API_BASE}/surah/${sNum}/verse/${a}`);
    const v = vr.data;
    lines.push(`\n[${sNum}:${a}]\n${v.text}${lang !== 'bn' ? `\n🇬🇧 ${v.translation_en}` : ''}${lang !== 'en' && v.translation_bn ? `\n🇧🇩 ${v.translation_bn}` : ''}`);
  }
  lines.push(page < pages ? `\n─────\n⏭ Next: alquran read ${sNum} ${page + 1}` : `\n─────\n✅ End of Surah ${info.name}`);
  return sendChunked(api, threadID, lines.join('\n'));
}

async function handleSurahInfo(api, threadID, message, args) {
  const num = parseInt(args[1]);
  if (!num || num < 1 || num > 114)
    return message.reply('❌ Surah 1–114 required. Example: alquran surah 36');
  const { data: res } = await axios.get(`${API_BASE}/surah/${num}/info`);
  const s   = res.data;
  const rev = s.revelation_type === 'Meccan' ? 'Makki (Mecca)' : 'Madani (Medina)';
  return api.sendMessage(
    `☪️ Surah Info\n${'─'.repeat(32)}\n`
    + `📛 Name:     ${s.name}\n`
    + `🔤 Arabic:   ${s.name_translations?.ar || ''}\n`
    + `🌍 Meaning:  ${s.name_translations?.en || s.meaning || '—'}\n`
    + `🔢 Number:   ${s.number_of_surah}\n`
    + `📜 Verses:   ${s.number_of_ayah}\n`
    + `🕌 Revealed: ${rev}\n`
    + `${'─'.repeat(32)}\n`
    + `▶ alquran read ${num}  |  🎵 quranmp3 ${num}`,
    threadID,
  );
}

async function handleSearch(api, threadID, message, args, lang) {
  let words = args.slice(1);
  let limit = 5;
  const last = words[words.length - 1];
  if (/^\d+$/.test(last) && words.length > 1) { limit = Math.min(parseInt(last), 15); words = words.slice(0, -1); }
  const query = words.join(' ').trim();
  if (query.length < 2) return message.reply('❌ Enter at least 2 characters. Example: alquran search paradise');
  const { data: res } = await axios.get(`${API_BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  const { total, results } = res.data;
  if (!total) return message.reply(`🔍 "${query}" — No results.\n\n💡 Try a different keyword.`);
  const lines = [`🔍 "${query}" — ${total} result${total > 1 ? 's' : ''}\n${'─'.repeat(30)}`];
  for (const [i, r] of results.entries()) {
    lines.push(`\n[${i + 1}] ${r.surah_name} ${r.surah_number}:${r.ayah}\n${r.text}${lang !== 'bn' ? `\n🇬🇧 ${r.translation_en}` : ''}${lang !== 'en' && r.translation_bn ? `\n🇧🇩 ${r.translation_bn}` : ''}`);
  }
  if (total > limit) lines.push(`\n${'─'.repeat(30)}\n+${total - limit} more → alquran search ${query} ${Math.min(limit + 5, 15)}`);
  return sendChunked(api, threadID, lines.join('\n'));
}

async function handleList(api, threadID) {
  const { data: res } = await axios.get(`${API_BASE}/surahs`);
  const surahs = res.data;
  const total  = surahs.reduce((n, s) => n + s.number_of_ayah, 0);
  let   chunk  = `📚 All 114 Surahs — ${total} verses total\n${'─'.repeat(32)}\n`;
  const chunks = [];
  for (const s of surahs) {
    const line = `${String(s.number_of_surah).padStart(3)} │ ${s.name.padEnd(22)} ${s.number_of_ayah}v\n`;
    if ((chunk + line).length > 2000) { chunks.push(chunk); chunk = ''; }
    chunk += line;
  }
  if (chunk) chunks.push(chunk);
  for (const c of chunks) await api.sendMessage(c, threadID);
}

async function handleNumberShortcut(api, threadID, message, args, lang) {
  const sNum = parseInt(args[0]);
  if (sNum < 1 || sNum > 114) return message.reply('❌ Surah must be 1–114.');
  const ayah = parseInt(args[1]) || 1;
  const { data: res } = await axios.get(`${API_BASE}/surah/${sNum}/verse/${ayah}`);
  const v = res.data;
  return api.sendMessage(fmtVerse(v.text, v.translation_en, v.translation_bn, `📖 ${v.surah} (${sNum}:${ayah})`, lang), threadID);
}

function fmtVerse(arabic, en, bn, title, lang = DEFAULT_LANG) {
  const sep = '─'.repeat(32);
  return `${title}\n${sep}\n\n🕌 ${arabic}\n\n${sep}\n`
    + (lang !== 'bn' ? `🇬🇧 ${en || ''}\n` : '')
    + (lang !== 'en' && bn ? (lang === 'both' ? '\n' : '') + `🇧🇩 ${bn}\n` : '');
}

async function sendChunked(api, threadID, text) {
  const lines = text.split('\n');
  let chunk   = '';
  for (const line of lines) {
    if ((chunk + '\n' + line).length > 3800) { await api.sendMessage(chunk.trim(), threadID); chunk = line; }
    else chunk += (chunk ? '\n' : '') + line;
  }
  if (chunk.trim()) await api.sendMessage(chunk.trim(), threadID);
}

module.exports.fmtVerse = fmtVerse;
