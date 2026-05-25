# ☪️ AL QURAN — GoatBot v2 Commands

**Author:** SIFAT | **Version:** 3.0 | **GitHub:** MYB-SIFU/AL-QURAN

A complete, advanced Quran command pack for GoatBot v2, powered by the AL QURAN REST API.
Supports Arabic, English & Bengali — with audio, search, daily verse, pagination, and more.

---

## 📦 File Structure

```
goatbot-v2-commands/
├── scripts/
│   ├── cmds/
│   │   ├── alquran.js       ← Main Quran command (all features)
│   │   ├── quranmp3.js      ← Audio MP3 recitation
│   │   ├── quransearch.js   ← Advanced verse search
│   │   └── dailyayat.js     ← Daily verse subscription
│   └── events/
│       └── autoayat.js      ← Auto daily verse scheduler
└── README.md
```

---

## ⚡ Installation

### Step 1 — Set your API URL

In each `.js` file, replace the placeholder at the top:

```js
const API_BASE = 'https://YOUR-APP-URL.onrender.com/api';
```

> 💡 Local testing: `http://localhost:5000/api`

### Step 2 — Copy files into GoatBot

```bash
cp goatbot-v2-commands/scripts/cmds/*.js      scripts/cmds/
cp goatbot-v2-commands/scripts/events/*.js    scripts/events/
```

### Step 3 — Install dependencies

```bash
npm install axios
```

### Step 4 — Restart bot

```bash
node index.js
```

---

## 📖 `alquran` — Main Command (v3.0)

| Command | Description |
|---|---|
| `alquran` | Random verse (Arabic + EN + BN) |
| `alquran 2:255` | Surah 2, Verse 255 (Ayatul Kursi) |
| `alquran 2:1-7` | **Verse range** — Surah 2, Verses 1–7 (max 20) |
| `alquran read 36` | **Read Surah Ya-Sin** — page 1 (5 verses/page) |
| `alquran read 36 3` | Read page 3 of Surah Ya-Sin |
| `alquran surah 36` | Surah info (name, meaning, verses, revelation) |
| `alquran search mercy` | Search verses by keyword |
| `alquran search mercy 10` | Search — show 10 results |
| `alquran list` | All 114 surahs with verse count |
| `alquran help` | Full command guide |

**Aliases:** `quran`, `ayat`, `quranbd`, `আয়াত`, `কোরআন`

### New in v3.0:
- **Verse range**: `alquran 2:1-7` reads multiple verses in one message
- **Paginated reading**: `alquran read [surah] [page]` — 5 verses per page
- **Smart chunking**: Long outputs automatically split into multiple messages
- **Better list**: Shows total verse count across all 114 surahs

---

## 🎵 `quranmp3` — Audio Recitation (v2.0)

| Command | Description |
|---|---|
| `quranmp3 1` | Full Surah Al-Fatiha MP3 (default reciter) |
| `quranmp3 36 2` | Surah Ya-Sin recited by As-Sudais |
| `quranmp3 2:255` | Ayatul Kursi single ayah MP3 |
| `quranmp3 2:255 3` | Ayatul Kursi — Al-Ghamdi |
| `quranmp3 reciters` | List all 5 available reciters |
| `quranmp3 help` | Show command guide |

**Aliases:** `quranaudio`, `tilawat`, `ayatmp3`, `recite`, `তিলাওয়াত`

### Available Reciters (ID 1–5):

| ID | Name |
|---|---|
| 1 ✅ | Mishari Rashid al-Afasy *(default)* |
| 2 | Abdur-Rahman as-Sudais |
| 3 | Saad al-Ghamdi |
| 4 | Muhammad al-Minshawi |
| 5 | Mahmoud Khalil al-Husary |

### New in v2.0:
- **Single ayah includes translation** — Arabic + English + Bengali shown with the MP3
- **Parallel data fetching** — audio URL and verse text fetched simultaneously (faster)
- **Smart error messages** — suggests alternatives when a file fails (different reciter, single ayah)
- **Size warning** for long surahs (>50 verses)
- **Input validation** with clear error guidance

> ⚠️ For best results, use single ayah (`quranmp3 2:255`) or short surahs (Al-Fatiha, Al-Ikhlas, etc.)

---

## 🔍 `quransearch` — Advanced Verse Search (v2.0)

| Command | Description |
|---|---|
| `quransearch paradise` | Search keyword (5 results) |
| `quransearch mercy 10` | Search — 10 results (max 20) |
| `quransearch light --surah 24` | **Search within one surah** |
| `quransearch detail 2:255` | **Full detail** of a specific verse |

**Aliases:** `qsearch`, `ayatsearch`, `findverse`, `searchquran`

### New in v2.0:
- **`detail` subcommand**: Full breakdown of any verse — Arabic, EN, BN, plus shortcuts to audio and reading
- **`--surah` filter**: Limit search to a specific surah (e.g. `--surah 24`)
- **Inline shortcuts**: Every result shows `quransearch detail X:Y` for quick deep-dive
- **Better chunking**: Results longer than 4,000 chars split cleanly across messages

---

## 📅 `dailyayat` — Daily Verse Subscription (v2.0)

| Command | Description |
|---|---|
| `dailyayat on` | Subscribe this group to daily verses |
| `dailyayat off` | Unsubscribe |
| `dailyayat now` | Send a verse immediately |
| `dailyayat status` | **Subscription info** (language, since date, next time) |
| `dailyayat lang en` | **Set language** — English only |
| `dailyayat lang bn` | Bengali only |
| `dailyayat lang both` | Arabic + English + Bengali *(default)* |
| `dailyayat next` | Time until next scheduled verse |
| `dailyayat list` | Total number of subscribed groups |

**Aliases:** `dailyverse`, `dailyquran`, `দৈনিকআয়াত`, `subayat`

### New in v2.0:
- **Per-group language**: Each group can independently choose `en`, `bn`, or `both`
- **Status command**: Shows language, subscription date, and countdown to next verse
- **Next time**: Shows exactly how many hours/minutes until next delivery
- **autoayat.js fixed**: Import path corrected, now properly uses per-group language
- **Retry-safe**: Each group is sent with a 2-second delay to avoid rate limiting

> ⏰ Default send time: **7:30 AM BDT** (01:30 UTC) — configurable in `autoayat.js`

---

## ⚙️ Configuration

Each file has a config block at the top:

```js
const API_BASE      = 'https://YOUR-APP-URL.onrender.com/api';
const DEFAULT_LANG  = 'both';    // 'en' | 'bn' | 'both'
const DEFAULT_RECITER = 1;       // 1–5 (quranmp3 only)
```

Change send time in `autoayat.js`:

```js
const SEND_HOUR_UTC = 1;   // 01 UTC = 07 BDT
const SEND_MIN_UTC  = 30;  // :30
```

---

## 📝 Sample Output

```
📖 Al-Baqarah (2:255)
────────────────────────────────

🕌 اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ...

────────────────────────────────
🇬🇧 Allah - there is no deity except Him...

🇧🇩 আল্লাহ ছাড়া অন্য কোন উপাস্য নেই...
```

---

## 🌐 API Endpoints Used

| Endpoint | Used by |
|---|---|
| `GET /api/random` | alquran, dailyayat |
| `GET /api/surah/:n/verse/:a` | alquran, quransearch |
| `GET /api/surah/:n/info` | alquran |
| `GET /api/surahs` | alquran list |
| `GET /api/search?q=...` | alquran search, quransearch |
| `GET /api/surah/:n/recitations` | quranmp3 (full surah) |
| `GET /api/surah/:n/verse/:a/audio` | quranmp3 (single ayah) |

Full interactive docs: open your deployed app → **API** tab

---

- **GitHub:** [MYB-SIFU/AL-QURAN](https://github.com/MYB-SIFU/AL-QURAN)
- **Author:** SIFAT
- **API Version:** 1.0 — 10 endpoints, 6,236 verses, 5 reciters

> All commands require the AL QURAN API to be running — deployed online or at `localhost:5000`.
