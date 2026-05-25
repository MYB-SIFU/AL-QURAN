const fs = require('fs');
const path = require('path');

function cleanSurah(data) {
  const cleaned = { ...data };

  if (cleaned.name_translations) {
    const { ar, en } = cleaned.name_translations;
    cleaned.name_translations = { ar, en };
  }

  if (cleaned.verses) {
    cleaned.verses = cleaned.verses.map(v => {
      const { translation_id, ...rest } = v;
      return rest;
    });
  }

  if (cleaned.tafsir) {
    delete cleaned.tafsir;
  }

  return cleaned;
}

function cleanQuranIndex(data) {
  return data.map(surah => {
    const cleaned = { ...surah };
    if (cleaned.name_translations) {
      const { ar, en } = cleaned.name_translations;
      cleaned.name_translations = { ar, en };
    }
    return cleaned;
  });
}

const surahDir = path.join(__dirname, '../surah');
const files = fs.readdirSync(surahDir).filter(f => f.endsWith('.json'));

let count = 0;
files.forEach(file => {
  const filePath = path.join(surahDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const cleaned = cleanSurah(data);
  fs.writeFileSync(filePath, JSON.stringify(cleaned, null, 2), 'utf8');
  count++;
});

console.log(`Cleaned ${count} surah files`);

const quranPath = path.join(__dirname, '../quran.json');
const quranData = JSON.parse(fs.readFileSync(quranPath, 'utf8'));
const cleanedQuran = cleanQuranIndex(quranData);
fs.writeFileSync(quranPath, JSON.stringify(cleanedQuran, null, 2), 'utf8');
console.log('Cleaned quran.json');

console.log('Done! All Indonesian language data removed.');
