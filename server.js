const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const quranIndex = JSON.parse(fs.readFileSync(path.join(__dirname, 'quran.json'), 'utf8'));

function loadSurah(number) {
  const filePath = path.join(__dirname, 'surah', `${number}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function apiResponse(res, data, message = 'Success') {
  res.json({ status: 'success', message, data });
}

function apiError(res, code, message) {
  res.status(code).json({ status: 'error', message });
}

// ─────────────────────────────────────────────
// ROOT — API Info
// ─────────────────────────────────────────────
app.get('/api', (req, res) => {
  apiResponse(res, {
    name: 'AL QURAN REST API',
    version: '1.0.0',
    author: 'SIFAT',
    github: 'https://github.com/MYB-SIFU/AL-QURAN',
    description: 'Complete Quran REST API with Arabic text and English translations',
    endpoints: {
      'GET /api/surahs': 'List all 114 surahs',
      'GET /api/surah/:number': 'Get full surah with verses',
      'GET /api/surah/:number/info': 'Get surah metadata only',
      'GET /api/surah/:number/verses': 'Get all verses of a surah',
      'GET /api/surah/:number/verse/:ayah': 'Get a specific verse',
      'GET /api/surah/:number/recitations': 'Get full surah MP3 from 5 reciters',
      'GET /api/surah/:number/verse/:ayah/audio': 'Get single ayah MP3 from 5 reciters',
      'GET /api/search?q=query': 'Search verses by English text',
      'GET /api/random': 'Get a random verse',
    }
  }, 'AL QURAN REST API v1.0.0');
});

// ─────────────────────────────────────────────
// GET /api/surahs — list all 114 surahs
// ─────────────────────────────────────────────
app.get('/api/surahs', (req, res) => {
  apiResponse(res, quranIndex, `All ${quranIndex.length} surahs`);
});

// ─────────────────────────────────────────────
// GET /api/surah/:number — full surah
// ─────────────────────────────────────────────
app.get('/api/surah/:number', (req, res) => {
  const num = parseInt(req.params.number);
  if (isNaN(num) || num < 1 || num > 114) return apiError(res, 400, 'Surah number must be between 1 and 114');
  const surah = loadSurah(num);
  if (!surah) return apiError(res, 404, `Surah ${num} not found`);
  apiResponse(res, surah, `Surah ${num}: ${surah.name}`);
});

// ─────────────────────────────────────────────
// GET /api/surah/:number/info — metadata only
// ─────────────────────────────────────────────
app.get('/api/surah/:number/info', (req, res) => {
  const num = parseInt(req.params.number);
  if (isNaN(num) || num < 1 || num > 114) return apiError(res, 400, 'Surah number must be between 1 and 114');
  const info = quranIndex.find(s => s.number_of_surah === num);
  if (!info) return apiError(res, 404, `Surah ${num} not found`);
  apiResponse(res, info, `Surah ${num} info`);
});

// ─────────────────────────────────────────────
// GET /api/surah/:number/verses — all verses
// ─────────────────────────────────────────────
app.get('/api/surah/:number/verses', (req, res) => {
  const num = parseInt(req.params.number);
  if (isNaN(num) || num < 1 || num > 114) return apiError(res, 400, 'Surah number must be between 1 and 114');
  const surah = loadSurah(num);
  if (!surah) return apiError(res, 404, `Surah ${num} not found`);
  apiResponse(res, {
    surah: surah.name,
    surah_number: num,
    total_verses: surah.number_of_ayah,
    verses: surah.verses
  }, `${surah.verses.length} verses from Surah ${surah.name}`);
});

// ─────────────────────────────────────────────
// GET /api/surah/:number/verse/:ayah — single verse
// ─────────────────────────────────────────────
app.get('/api/surah/:number/verse/:ayah', (req, res) => {
  const num = parseInt(req.params.number);
  const ayah = parseInt(req.params.ayah);
  if (isNaN(num) || num < 1 || num > 114) return apiError(res, 400, 'Surah number must be between 1 and 114');
  const surah = loadSurah(num);
  if (!surah) return apiError(res, 404, `Surah ${num} not found`);
  if (isNaN(ayah) || ayah < 1 || ayah > surah.number_of_ayah)
    return apiError(res, 400, `Ayah must be between 1 and ${surah.number_of_ayah}`);
  const verse = surah.verses.find(v => v.number === ayah);
  if (!verse) return apiError(res, 404, 'Verse not found');
  apiResponse(res, {
    surah: surah.name,
    surah_number: num,
    surah_arabic: surah.name_translations.ar,
    ...verse
  }, `Surah ${surah.name} — Ayah ${ayah}`);
});

// ─────────────────────────────────────────────
// Reciter catalog (used by multiple endpoints)
// ─────────────────────────────────────────────
function getReciters(surahNum, ayahNum = null) {
  const s = String(surahNum).padStart(3, '0');
  const catalog = [
    {
      id: 1,
      name: 'Mishari Rashid al-Afasy',
      arabic: 'مشاري راشد العفاسي',
      surah_url: `https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/${s}.mp3`,
      ayah_base: 'https://everyayah.com/data/Alafasy_128kbps/'
    },
    {
      id: 2,
      name: 'Abdur-Rahman as-Sudais',
      arabic: 'عبدالرحمن السديس',
      surah_url: `https://download.quranicaudio.com/quran/abdurrahmaan_as-sudays/${s}.mp3`,
      ayah_base: 'https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/'
    },
    {
      id: 3,
      name: 'Saad al-Ghamdi',
      arabic: 'سعد الغامدي',
      surah_url: `https://download.quranicaudio.com/quran/sa3d_al-ghaamidi/complete/${s}.mp3`,
      ayah_base: 'https://everyayah.com/data/Saad_Al-Ghamdi_128kbps/'
    },
    {
      id: 4,
      name: 'Muhammad al-Minshawi',
      arabic: 'محمد صديق المنشاوي',
      surah_url: `https://download.quranicaudio.com/quran/muhammad_siddeeq_al-minshaawee/${s}.mp3`,
      ayah_base: 'https://everyayah.com/data/Minshawy_Murattal_128kbps/'
    },
    {
      id: 5,
      name: 'Mahmoud Khalil al-Husary',
      arabic: 'محمود خليل الحصري',
      surah_url: `https://download.quranicaudio.com/quran/mahmood_khaleel_al-husaree/${s}.mp3`,
      ayah_base: 'https://everyayah.com/data/Husary_128kbps/'
    }
  ];
  if (ayahNum !== null) {
    const a = String(ayahNum).padStart(3, '0');
    return catalog.map(r => ({ id: r.id, name: r.name, arabic: r.arabic, audio_url: `${r.ayah_base}${s}${a}.mp3` }));
  }
  return catalog.map(r => ({ id: r.id, name: r.name, arabic: r.arabic, audio_url: r.surah_url }));
}

// ─────────────────────────────────────────────
// GET /api/surah/:number/recitations — full surah audio
// ─────────────────────────────────────────────
app.get('/api/surah/:number/recitations', (req, res) => {
  const num = parseInt(req.params.number);
  if (isNaN(num) || num < 1 || num > 114) return apiError(res, 400, 'Surah number must be between 1 and 114');
  const surah = loadSurah(num);
  if (!surah) return apiError(res, 404, `Surah ${num} not found`);
  apiResponse(res, {
    surah: surah.name,
    surah_number: num,
    total_ayahs: surah.number_of_ayah,
    note: 'Full surah MP3. Use /verse/:ayah/audio for single ayah.',
    reciters: getReciters(num)
  }, `Recitations for Surah ${surah.name}`);
});

// ─────────────────────────────────────────────
// GET /api/surah/:number/verse/:ayah/audio — single ayah audio
// ─────────────────────────────────────────────
app.get('/api/surah/:number/verse/:ayah/audio', (req, res) => {
  const num  = parseInt(req.params.number);
  const ayah = parseInt(req.params.ayah);
  if (isNaN(num)  || num  < 1 || num  > 114) return apiError(res, 400, 'Surah number must be between 1 and 114');
  const surah = loadSurah(num);
  if (!surah) return apiError(res, 404, `Surah ${num} not found`);
  if (isNaN(ayah) || ayah < 1 || ayah > surah.number_of_ayah)
    return apiError(res, 400, `Ayah must be between 1 and ${surah.number_of_ayah}`);
  const verse = surah.verses.find(v => v.number === ayah);
  apiResponse(res, {
    surah: surah.name,
    surah_number: num,
    ayah,
    text: verse?.text || null,
    reciters: getReciters(num, ayah)
  }, `Audio for Surah ${surah.name} — Ayah ${ayah}`);
});

// ─────────────────────────────────────────────
// GET /api/search?q=query — search English text
// ─────────────────────────────────────────────
app.get('/api/search', (req, res) => {
  const query = (req.query.q || '').trim().toLowerCase();
  if (!query || query.length < 2) return apiError(res, 400, 'Query must be at least 2 characters (use ?q=your+search)');

  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const results = [];

  for (let i = 1; i <= 114 && results.length < limit; i++) {
    const surah = loadSurah(i);
    if (!surah) continue;
    for (const verse of surah.verses) {
      if (results.length >= limit) break;
      const haystack = (verse.translation_en || '').toLowerCase();
      if (haystack.includes(query)) {
        results.push({
          surah_number: surah.number_of_surah,
          surah_name: surah.name,
          surah_arabic: surah.name_translations.ar,
          ayah: verse.number,
          text: verse.text,
          translation_en: verse.translation_en,
          translation_bn: verse.translation_bn || null
        });
      }
    }
  }

  apiResponse(res, { query, total: results.length, results }, `Found ${results.length} results`);
});

// ─────────────────────────────────────────────
// GET /api/random — random verse
// ─────────────────────────────────────────────
app.get('/api/random', (req, res) => {
  const surahNum = Math.floor(Math.random() * 114) + 1;
  const surah = loadSurah(surahNum);
  if (!surah) return apiError(res, 500, 'Failed to load surah');
  const verse = surah.verses[Math.floor(Math.random() * surah.verses.length)];
  apiResponse(res, {
    surah_number: surah.number_of_surah,
    surah_name: surah.name,
    surah_arabic: surah.name_translations.ar,
    place: surah.place,
    ayah: verse.number,
    text: verse.text,
    translation_en: verse.translation_en
  }, 'Random verse');
});

// ─────────────────────────────────────────────
// Serve frontend for all non-API routes
// ─────────────────────────────────────────────
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم`);
  console.log(` AL QURAN API running on port ${PORT}`);
  console.log(` http://localhost:${PORT}/api\n`);
});
