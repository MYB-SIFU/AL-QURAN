const fs = require('fs');
const path = require('path');
const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching full Bengali translation from alquran.cloud...');
  const result = await get('https://api.alquran.cloud/v1/quran/bn.bengali');
  if (result.code !== 200) throw new Error('API error: ' + result.status);

  const surahs = result.data.surahs;
  console.log(`Received ${surahs.length} surahs`);

  let totalVerses = 0;
  for (const s of surahs) {
    const num = s.number;
    const filePath = path.join(__dirname, '../surah', `${num}.json`);
    if (!fs.existsSync(filePath)) { console.warn(`Missing: surah/${num}.json`); continue; }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const bnMap = {};
    for (const v of s.ayahs) {
      bnMap[v.numberInSurah] = v.text;
    }

    data.verses = data.verses.map(v => {
      const bn = bnMap[v.number];
      if (bn) v.translation_bn = bn;
      return v;
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    totalVerses += s.ayahs.length;
    process.stdout.write(`\r  Processed surah ${num}/114 (${totalVerses} verses)`);
  }

  console.log('\nDone! Bengali translations added to all surah files.');
}

main().catch(e => { console.error('\nFailed:', e.message); process.exit(1); });
