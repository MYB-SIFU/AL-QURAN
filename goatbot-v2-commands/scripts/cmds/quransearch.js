'use strict';

const axios = require('axios');

const API_BASE      = 'https://YOUR-APP-URL.onrender.com/api';
const DEFAULT_LIMIT = 5;
const MAX_LIMIT     = 20;

module.exports = {
  config: {
    name: 'quransearch',
    aliases: ['qsearch', 'ayatsearch', 'findverse', 'searchquran'],
    version: '2.0',
    author: 'SIFAT (MYB-SIFU)',
    countDown: 5,
    role: 0,
    shortDescription: { en: 'Search Quran by keyword across 6,236 verses' },
    longDescription: { en: 'Full-text verse search with result limit, surah filter, and detailed single-verse view.' },
    category: 'islamic',
    guide: {
      en: 'quransearch [keyword]              → 5 results\n'
        + 'quransearch [keyword] [limit]      → up to 20 results\n'
        + 'quransearch [keyword] --surah [n]  → search within one surah\n'
        + 'quransearch detail [surah]:[ayah]  → full verse detail\n'
        + '\nExamples:\n'
        + '  quransearch paradise\n'
        + '  quransearch mercy 10\n'
        + '  quransearch light --surah 24\n'
        + '  quransearch detail 2:255',
    },
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID } = event;

    if (!args[0])
      return message.reply(
        '🔍 QURAN SEARCH\n' + '─'.repeat(28) + '\n'
        + 'quransearch paradise           → search\n'
        + 'quransearch mercy 10           → 10 results\n'
        + 'quransearch light --surah 24   → in one surah\n'
        + 'quransearch detail 2:255       → verse detail',
      );

    if (args[0].toLowerCase() === 'detail') {
      const ref = args[1] || '';
      if (!/^\d+:\d+$/.test(ref)) return message.reply('❌ Format: quransearch detail [surah]:[ayah]\nExample: quransearch detail 2:255');
      const [sNum, aNum] = ref.split(':').map(Number);
      try {
        const { data: res } = await axios.get(`${API_BASE}/surah/${sNum}/verse/${aNum}`);
        const v   = res.data;
        const sep = '─'.repeat(32);
        return api.sendMessage(
          `📖 ${v.surah || `Surah ${sNum}`} (${sNum}:${aNum})\n${sep}\n\n`
          + `🕌 ${v.text}\n\n${sep}\n`
          + `🇬🇧 ${v.translation_en || '—'}\n\n`
          + `🇧🇩 ${v.translation_bn || '—'}\n\n${sep}\n`
          + `🎵 quranmp3 ${sNum}:${aNum}  |  📗 alquran read ${sNum}`,
          threadID,
        );
      } catch { return message.reply(`❌ Verse not found: ${ref}`); }
    }

    let words  = [...args];
    let limit  = DEFAULT_LIMIT;
    let surahF = null;

    const sIdx = words.findIndex(a => a === '--surah' || a === '-s');
    if (sIdx !== -1) {
      surahF = parseInt(words[sIdx + 1]);
      words.splice(sIdx, 2);
    }

    const last = words[words.length - 1];
    if (/^\d+$/.test(last) && words.length > 1) {
      limit  = Math.min(parseInt(last), MAX_LIMIT);
      words  = words.slice(0, -1);
    }

    const query = words.join(' ').trim();
    if (query.length < 2) return message.reply('❌ Enter at least 2 characters to search.');

    try {
      const { data: res } = await axios.get(`${API_BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      let { total, results } = res.data;

      if (surahF >= 1 && surahF <= 114) {
        results = results.filter(r => r.surah_number === surahF);
        total   = results.length;
      }

      if (!results.length)
        return message.reply(`🔍 "${query}"${surahF ? ` in Surah ${surahF}` : ''}\n\nNo results.\n💡 Try a different keyword.`);

      const lines = [
        `🔍 "${query}"${surahF ? ` — Surah ${surahF}` : ''} — ${total} result${total > 1 ? 's' : ''}`,
        '─'.repeat(30),
      ];
      for (const [i, r] of results.entries()) {
        lines.push(
          `\n[${i + 1}] ${r.surah_name}  ${r.surah_number}:${r.ayah}\n${r.text}`
          + (r.translation_en ? `\n🇬🇧 ${r.translation_en}` : '')
          + (r.translation_bn ? `\n🇧🇩 ${r.translation_bn}` : '')
          + `\n   ↳ quransearch detail ${r.surah_number}:${r.ayah}`,
        );
      }
      if (!surahF && total === limit && limit < MAX_LIMIT)
        lines.push(`\n${'─'.repeat(30)}\nMore: quransearch ${query} ${Math.min(limit + 5, MAX_LIMIT)}`);

      return sendChunked(api, threadID, lines.join('\n'));
    } catch (err) {
      return message.reply(`❌ Search failed: ${err?.response?.data?.error || err.message}`);
    }
  },
};

async function sendChunked(api, threadID, text) {
  const lines = text.split('\n');
  let chunk   = '';
  for (const line of lines) {
    if ((chunk + '\n' + line).length > 3800) { await api.sendMessage(chunk.trim(), threadID); chunk = line; }
    else chunk += (chunk ? '\n' : '') + line;
  }
  if (chunk.trim()) await api.sendMessage(chunk.trim(), threadID);
}
