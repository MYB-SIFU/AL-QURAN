# القرآن الكريم — AL QURAN

**Version:** 1.0.0 · **Author:** SIFAT · **GitHub:** [MYB-SIFU/AL-QURAN](https://github.com/MYB-SIFU/AL-QURAN)

> A complete Quran REST API and beautiful futuristic Islamic web experience — 114 Surahs with Arabic text, English translations, and audio recitations.

---

## Features

- 114 Surahs with complete **Arabic** text and **English** translations
- Full **REST API** — no authentication required, completely free
- **Audio Recitations** — Mishari Rashid al-Afasy, Abdur-Rahman as-Sudais, Saad al-Ghamdi
- **Verse Search** — search across all 6,236 verses
- **Random Verse** endpoint
- Futuristic **Islamic UI** — dark gold theme, Arabic typography
- Ready to deploy on **Render**, **Railway**, **Vercel**, and any Node.js host

---

## Quick Start

```bash
git clone https://github.com/MYB-SIFU/AL-QURAN.git
cd AL-QURAN
npm install
npm start
```

Open `http://localhost:5000` in your browser.

---

## REST API Reference

**Base URL:** `https://your-app.com/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api` | API info & endpoint list |
| GET | `/api/surahs` | List all 114 surahs |
| GET | `/api/surah/:number` | Full surah with all verses |
| GET | `/api/surah/:number/info` | Surah metadata only |
| GET | `/api/surah/:number/verses` | All verses of a surah |
| GET | `/api/surah/:number/verse/:ayah` | Single specific verse |
| GET | `/api/surah/:number/recitations` | Available audio recitations |
| GET | `/api/search?q=query` | Search by English text (add `&limit=N` for up to 50) |
| GET | `/api/random` | Random verse |

### Example Response — GET /api/surah/1

```json
{
  "status": "success",
  "message": "Surah 1: Al-Fatiha",
  "data": {
    "name": "Al-Fatiha",
    "name_translations": { "ar": "الفاتحة", "en": "The Opening" },
    "number_of_ayah": 7,
    "number_of_surah": 1,
    "place": "Mecca",
    "type": "Makkiyah",
    "recitations": [ { "name": "Mishari Rashid al-Afasy", "audio_url": "..." } ],
    "verses": [
      {
        "number": 1,
        "text": "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
        "translation_en": "In the name of Allah, the Entirely Merciful, the Especially Merciful."
      }
    ]
  }
}
```

### Example Response — GET /api/search?q=mercy&limit=3

```json
{
  "status": "success",
  "data": {
    "query": "mercy",
    "total": 3,
    "results": [
      {
        "surah_number": 1,
        "surah_name": "Al-Fatiha",
        "ayah": 1,
        "text": "بِسْمِ ٱللَّهِ ...",
        "translation_en": "In the name of Allah, the Entirely Merciful..."
      }
    ]
  }
}
```

---

## Project Structure

```
/
├── server.js             # Express REST API + static file server
├── public/               # Frontend website
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── surah/                # 114 individual Surah JSON files (1.json – 114.json)
├── quran.json            # Index of all 114 surahs
├── package.json
├── vercel.json           # Vercel deployment config
├── README.md
└── HOSTING_GUIDE.md      # Step-by-step hosting guide
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Port the server listens on |

---

## License

MIT — Free to use, modify, and distribute.

---

*بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم*
