/* ═══════════════════════════════════════════════════════════
   AL QURAN 
   Author: SIFAT
   ═══════════════════════════════════════════════════════════ */

const API = '/api';
let surahList = [];
let currentSurahNum = 1;
let currentAudio = null;
let activeRecitationBtn = null;
let currentRandomData = null;
let arabicFontSize = parseFloat(localStorage.getItem('aq_font') || '1.85');
let langPref = localStorage.getItem('aq_lang') || 'both';

// ═══════════════════════════════════════════════
// CANVAS STARFIELD
// ═══════════════════════════════════════════════
(function initCanvas() {
  const canvas = document.getElementById('bgCanvas');
  const ctx = canvas.getContext('2d');
  let stars = [];
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function makeStars(n) {
    return Array.from({ length: n }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.2 + 0.2,
      a: Math.random(),
      speed: Math.random() * 0.004 + 0.001,
      phase: Math.random() * Math.PI * 2
    }));
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    stars.forEach(s => {
      s.a = 0.15 + 0.55 * Math.abs(Math.sin(t * s.speed + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212,175,55,${s.a})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  resize();
  stars = makeStars(160);
  window.addEventListener('resize', () => { resize(); stars = makeStars(160); });
  requestAnimationFrame(draw);
})();

// ═══════════════════════════════════════════════
// LANGUAGE TOGGLE
// ═══════════════════════════════════════════════
function setLang(lang) {
  langPref = lang;
  localStorage.setItem('aq_lang', lang);
  document.body.classList.remove('lang-en', 'lang-bn', 'lang-both');
  document.body.classList.add('lang-' + lang);
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });
  
  const bnEl = document.getElementById('dailyBn');
  if (bnEl) bnEl.style.display = '';
}

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => setLang(btn.dataset.lang));
});

// ═══════════════════════════════════════════════
// SCROLL EFFECTS
// ═══════════════════════════════════════════════
const scrollProgress = document.getElementById('scrollProgress');
const backToTop = document.getElementById('backToTop');
const mainHeader = document.getElementById('mainHeader');

window.addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
  scrollProgress.style.width = pct + '%';
  backToTop.classList.toggle('visible', window.scrollY > 300);
  mainHeader.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ═══════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════
function switchView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn, .mobile-nav-btn').forEach(b => b.classList.remove('active'));
  const view = document.getElementById(`view-${name}`);
  if (view) view.classList.add('active');
  document.querySelectorAll(`[data-view="${name}"]`).forEach(b => b.classList.add('active'));
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (name === 'browse')    loadSurahList();
  if (name === 'api')       loadApiDocs();
  if (name === 'bookmarks') renderBookmarks();
}

document.querySelectorAll('.nav-btn, .mobile-nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

// ═══════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════
function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icon = type === 'success' ? '✓' : 'ℹ';
  t.innerHTML = `<span class="toast-icon">${icon}</span><span>${msg}</span>`;
  document.getElementById('toastContainer').appendChild(t);
  setTimeout(() => t.remove(), 2900);
}

// ═══════════════════════════════════════════════
// FETCH HELPER
// ═══════════════════════════════════════════════
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ═══════════════════════════════════════════════
// HOME — VERSE OF THE DAY (seeded by date)
// ═══════════════════════════════════════════════
async function loadDailyVerse() {
  try {
    const today = new Date();
    const seed  = today.getFullYear() * 10000 + (today.getMonth()+1) * 100 + today.getDate();
    const surahNum = (seed % 114) + 1;
    const { data: surah } = await fetchJSON(`${API}/surah/${surahNum}`);
    const verseIdx = seed % surah.verses.length;
    const v = surah.verses[verseIdx];

    document.getElementById('dailyArabic').textContent = v.text;
    document.getElementById('dailyEn').textContent     = `"${v.translation_en}"`;
    const bnEl = document.getElementById('dailyBn');
    if (v.translation_bn) { bnEl.textContent = v.translation_bn; bnEl.style.display = ''; }
    document.getElementById('dailyRef').textContent    = `Surah ${surah.name} (${surahNum}:${v.number})`;
    const btn = document.getElementById('dailyReadBtn');
    btn.style.display = 'inline';
    btn.onclick = () => openSurah(surahNum);
  } catch (e) {
    document.getElementById('dailyEn').textContent = 'Failed to load verse.';
  }
}

// ═══════════════════════════════════════════════
// CONTINUE READING
// ═══════════════════════════════════════════════
function saveLastRead(surahNum) {
  localStorage.setItem('aq_lastread', surahNum);
}
function continueReading() {
  const last = localStorage.getItem('aq_lastread');
  if (last) openSurah(parseInt(last));
}
function checkContinueReading() {
  const last = localStorage.getItem('aq_lastread');
  const btn = document.getElementById('continueReadingBtn');
  if (last && btn) {
    btn.style.display = 'inline-flex';
    btn.title = `Continue from Surah ${last}`;
  }
}

// ═══════════════════════════════════════════════
// BOOKMARKS
// ═══════════════════════════════════════════════
function getBookmarks() {
  try { return JSON.parse(localStorage.getItem('aq_bookmarks') || '[]'); }
  catch { return []; }
}
function saveBookmarks(bm) {
  localStorage.setItem('aq_bookmarks', JSON.stringify(bm));
  updateBookmarkBadge();
}
function toggleBookmark(surahNum, surahName, verse) {
  let bm = getBookmarks();
  const key = `${surahNum}:${verse.number}`;
  const idx = bm.findIndex(b => b.key === key);
  if (idx >= 0) {
    bm.splice(idx, 1);
    saveBookmarks(bm);
    showToast('Bookmark removed');
    return false;
  } else {
    bm.push({ key, surahNum, surahName, verse });
    saveBookmarks(bm);
    showToast('Verse bookmarked!');
    return true;
  }
}
function isBookmarked(surahNum, verseNum) {
  return getBookmarks().some(b => b.key === `${surahNum}:${verseNum}`);
}
function updateBookmarkBadge() {
  const bm = getBookmarks();
  const badge = document.getElementById('bookmarkBadge');
  const statNum = document.getElementById('bookmarkStatNum');
  if (badge) { badge.textContent = bm.length; badge.style.display = bm.length ? 'inline' : 'none'; }
  if (statNum) statNum.textContent = bm.length;
}
function renderBookmarks() {
  const bm = getBookmarks();
  const container = document.getElementById('bookmarksContent');
  if (!bm.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔖</div>
        <h3>No bookmarks yet</h3>
        <p>While reading a surah, tap the bookmark icon on any verse to save it here.</p>
        <button class="btn-primary" onclick="switchView('browse')" style="margin-top:20px">Browse Surahs</button>
      </div>`;
    return;
  }
  const grouped = {};
  bm.forEach(b => {
    const k = `${b.surahNum}:${b.surahName}`;
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(b);
  });
  container.innerHTML = Object.entries(grouped).map(([k, verses]) => {
    const [sNum, sName] = k.split(':');
    return `
      <div class="bookmark-surah-group">
        <div class="bookmark-surah-label">
          Surah ${sNum} — ${sName}
        </div>
        ${verses.map(b => `
          <div class="bookmark-card" onclick="openSurahAtVerse(${b.surahNum}, ${b.verse.number})">
            <div class="bookmark-num">${b.verse.number}</div>
            <div class="bookmark-content">
              <div class="bookmark-arabic">${b.verse.text}</div>
              <div class="bookmark-en verse-en">${b.verse.translation_en}</div>
              ${b.verse.translation_bn ? `<div class="bookmark-bn verse-bn">${b.verse.translation_bn}</div>` : ''}
              <div class="bookmark-ref">Surah ${b.surahName} · Ayah ${b.verse.number}</div>
            </div>
            <button class="bookmark-remove" onclick="event.stopPropagation();removeBookmark('${b.surahNum}:${b.verse.number}')" title="Remove">✕</button>
          </div>
        `).join('')}
      </div>`;
  }).join('');
}
function removeBookmark(key) {
  let bm = getBookmarks();
  bm = bm.filter(b => b.key !== key);
  saveBookmarks(bm);
  renderBookmarks();
  showToast('Bookmark removed');
}
async function openSurahAtVerse(surahNum, verseNum) {
  await openSurah(surahNum);
  setTimeout(() => {
    const el = document.getElementById(`v${verseNum}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 600);
}

// ═══════════════════════════════════════════════
// BROWSE
// ═══════════════════════════════════════════════
async function loadSurahList() {
  if (surahList.length) { renderSurahGrid(surahList); return; }
  try {
    const { data } = await fetchJSON(`${API}/surahs`);
    surahList = data;
    renderSurahGrid(surahList);
  } catch (e) {
    document.getElementById('surahGrid').innerHTML = '<p style="color:var(--text-mute);padding:40px">Failed to load surahs.</p>';
  }
}

function renderSurahGrid(list) {
  const grid = document.getElementById('surahGrid');
  if (!list.length) {
    grid.innerHTML = '<p style="color:var(--text-mute);padding:40px;grid-column:1/-1">No surahs found.</p>';
    return;
  }
  grid.innerHTML = list.map(s => {
    const typeClass = s.type === 'Makkiyah' ? 'type-makkiyah' : 'type-madaniyah';
    return `
      <div class="surah-card" onclick="openSurah(${s.number_of_surah})">
        <div class="surah-number">${s.number_of_surah}</div>
        <div class="surah-info">
          <div class="surah-name-row">
            <div class="surah-name-en">${s.name}</div>
            <div class="surah-name-ar">${s.name_translations.ar}</div>
          </div>
          <div class="surah-meta">
            <span>${s.name_translations.en}</span>
            <span>·</span>
            <span>${s.number_of_ayah} verses</span>
          </div>
        </div>
        <div class="surah-type ${typeClass}">${s.type || ''}</div>
      </div>`;
  }).join('');
}

// Browse filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyBrowseFilters();
  });
});

// Browse text search
document.getElementById('browseFilter').addEventListener('input', applyBrowseFilters);

function applyBrowseFilters() {
  const typeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
  const textFilter = document.getElementById('browseFilter').value.trim().toLowerCase();
  let filtered = typeFilter === 'all' ? surahList : surahList.filter(s => s.type === typeFilter);
  if (textFilter) {
    filtered = filtered.filter(s =>
      s.name.toLowerCase().includes(textFilter) ||
      (s.name_translations.en || '').toLowerCase().includes(textFilter) ||
      (s.name_translations.ar || '').includes(textFilter) ||
      String(s.number_of_surah) === textFilter
    );
  }
  renderSurahGrid(filtered);
}

// ═══════════════════════════════════════════════
// READER
// ═══════════════════════════════════════════════
async function openSurah(num) {
  currentSurahNum = num;
  switchView('reader');
  saveLastRead(num);
  checkContinueReading();
  document.getElementById('versesContainer').innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
  document.getElementById('surahInfoBar').innerHTML = '';
  document.getElementById('recitationBar').innerHTML = '';
  document.getElementById('readerTitle').textContent = '';
  try {
    const { data } = await fetchJSON(`${API}/surah/${num}`);
    renderReader(data);
  } catch (e) {
    document.getElementById('versesContainer').innerHTML = '<p style="color:var(--text-mute);padding:40px">Failed to load surah.</p>';
  }
}

function renderReader(surah) {
  document.getElementById('readerTitle').textContent = `${surah.number_of_surah}. ${surah.name} — ${surah.name_translations.ar}`;

  document.getElementById('surahInfoBar').innerHTML = `
    <div class="info-item"><span class="info-label">NO</span><span class="info-value">${surah.number_of_surah} / 114</span></div>
    <div class="info-item"><span class="info-label">NAME</span><span class="info-value">${surah.name}</span></div>
    <div class="info-item"><span class="info-label">ARABIC</span><span class="info-value-ar">${surah.name_translations.ar}</span></div>
    <div class="info-item"><span class="info-label">MEANING</span><span class="info-value">${surah.name_translations.en}</span></div>
    <div class="info-item"><span class="info-label">VERSES</span><span class="info-value">${surah.number_of_ayah}</span></div>
    <div class="info-item"><span class="info-label">ORIGIN</span><span class="info-value">${surah.place || '—'}</span></div>
    <div class="info-item"><span class="info-label">TYPE</span><span class="info-value">${surah.type || '—'}</span></div>
  `;

  const recBar = document.getElementById('recitationBar');
  if (surah.recitations?.length) {
    recBar.innerHTML = surah.recitations.map(r => `
      <button class="recitation-btn" onclick="playRecitation(this,'${r.audio_url}','${r.name}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        ${r.name}
      </button>`).join('');
  }

  applyFontSize();

  const container = document.getElementById('versesContainer');
  const bismillah = surah.number_of_surah !== 9 && surah.number_of_surah !== 1
    ? `<div class="verse-card" style="text-align:center;padding:22px 30px"><div class="verse-bismillah">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div></div>` : '';

  container.innerHTML = bismillah + (surah.verses || []).map(v => {
    const bm = isBookmarked(surah.number_of_surah, v.number);
    const safeV = JSON.stringify(v).replace(/</g,'\\u003c').replace(/'/g,"\\'");
    return `
      <div class="verse-card${bm ? ' bookmarked' : ''}" id="v${v.number}">
        <div class="verse-header">
          <div class="verse-number">${v.number}</div>
          <div class="verse-actions">
            <button class="verse-action-btn${bm ? ' active' : ''}" onclick="handleBookmark(this,${surah.number_of_surah},'${escapeHtml(surah.name)}',${safeV})" title="Bookmark">🔖 ${bm ? 'Saved' : 'Bookmark'}</button>
            <button class="verse-action-btn" onclick="copyVerse(${JSON.stringify(v.text).replace(/</g,'\\u003c')},${JSON.stringify(v.translation_en).replace(/</g,'\\u003c')},${JSON.stringify(v.translation_bn||'').replace(/</g,'\\u003c')})" title="Copy">⎘ Copy</button>
          </div>
        </div>
        <div class="verse-arabic">${v.text}</div>
        <div class="verse-divider"></div>
        <div class="verse-translation-en verse-en">${v.translation_en || ''}</div>
        ${v.translation_bn ? `<div class="verse-translation-divider verse-bn"></div><div class="verse-translation-bn verse-bn">${v.translation_bn}</div>` : ''}
      </div>`;
  }).join('');

  document.getElementById('prevSurah').disabled = surah.number_of_surah <= 1;
  document.getElementById('nextSurah').disabled = surah.number_of_surah >= 114;
  document.getElementById('bookmarkSurahBtn').title = `Last read: Surah ${surah.number_of_surah}`;
}

function escapeHtml(s) { return s.replace(/'/g, "\\'"); }

function handleBookmark(btn, surahNum, surahName, verse) {
  const added = toggleBookmark(surahNum, surahName, verse);
  btn.classList.toggle('active', added);
  btn.textContent = `🔖 ${added ? 'Saved' : 'Bookmark'}`;
  const card = btn.closest('.verse-card');
  card.classList.toggle('bookmarked', added);
}

function copyVerse(arabic, english, bengali) {
  let text = arabic + '\n\n"' + english + '"';
  if (bengali && (langPref === 'bn' || langPref === 'both')) text += '\n\n' + bengali;
  navigator.clipboard.writeText(text).then(() => showToast('Verse copied!')).catch(() => showToast('Copy failed', 'info'));
}

// Font size
function applyFontSize() {
  document.documentElement.style.setProperty('--arabic-size', arabicFontSize + 'rem');
}
document.getElementById('fontDecBtn').addEventListener('click', () => {
  arabicFontSize = Math.max(1.2, arabicFontSize - 0.2);
  localStorage.setItem('aq_font', arabicFontSize);
  applyFontSize();
  showToast('Font size decreased');
});
document.getElementById('fontIncBtn').addEventListener('click', () => {
  arabicFontSize = Math.min(3.2, arabicFontSize + 0.2);
  localStorage.setItem('aq_font', arabicFontSize);
  applyFontSize();
  showToast('Font size increased');
});
document.getElementById('bookmarkSurahBtn').addEventListener('click', () => {
  saveLastRead(currentSurahNum);
  showToast(`Surah ${currentSurahNum} marked as last read`);
});

document.getElementById('backBtn').addEventListener('click', () => { stopAudio(); switchView('browse'); });
document.getElementById('prevSurah').addEventListener('click', () => { stopAudio(); if (currentSurahNum > 1) openSurah(currentSurahNum - 1); });
document.getElementById('nextSurah').addEventListener('click', () => { stopAudio(); if (currentSurahNum < 114) openSurah(currentSurahNum + 1); });

// ═══════════════════════════════════════════════
// AUDIO
// ═══════════════════════════════════════════════
function stopAudio() {
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }
  if (activeRecitationBtn) {
    activeRecitationBtn.classList.remove('playing');
    activeRecitationBtn.querySelector('svg').innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
    activeRecitationBtn = null;
  }
}
function playRecitation(btn, url) {
  if (activeRecitationBtn === btn) { stopAudio(); return; }
  stopAudio();
  currentAudio = new Audio(url);
  currentAudio.play().catch(() => showToast('Audio blocked by browser — click to enable', 'info'));
  currentAudio.addEventListener('ended', () => stopAudio());
  btn.classList.add('playing');
  btn.querySelector('svg').innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
  activeRecitationBtn = btn;
}

// ═══════════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════════
let searchTimeout;
const searchInput  = document.getElementById('searchInput');
const searchClear  = document.getElementById('searchClear');
const searchResults = document.getElementById('searchResults');

searchInput.addEventListener('input', () => {
  const val = searchInput.value.trim();
  searchClear.classList.toggle('visible', val.length > 0);
  clearTimeout(searchTimeout);
  if (val.length < 2) {
    searchResults.innerHTML = `<div class="search-placeholder"><div class="search-placeholder-icon">﷽</div><p>Type a word or phrase above to search across all verses</p></div>`;
    return;
  }
  searchResults.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
  searchTimeout = setTimeout(() => runSearch(val), 380);
});
searchClear.addEventListener('click', () => {
  searchInput.value = '';
  searchClear.classList.remove('visible');
  searchResults.innerHTML = `<div class="search-placeholder"><div class="search-placeholder-icon">﷽</div><p>Type a word or phrase above to search across all verses</p></div>`;
  searchInput.focus();
});
function fillSearch(word) {
  searchInput.value = word;
  searchInput.dispatchEvent(new Event('input'));
  switchView('search');
  setTimeout(() => searchInput.focus(), 80);
}
async function runSearch(query) {
  try {
    const { data } = await fetchJSON(`${API}/search?q=${encodeURIComponent(query)}&limit=40`);
    if (!data.results.length) {
      searchResults.innerHTML = '<div class="search-placeholder"><p>No results found. Try a different word.</p></div>';
      return;
    }
    const esc = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const highlight = t => t.replace(new RegExp(`(${esc})`, 'gi'), '<mark>$1</mark>');
    searchResults.innerHTML =
      `<div class="search-count">${data.total} result${data.total !== 1 ? 's' : ''} for "<strong style="color:var(--gold)">${query}</strong>"</div>` +
      data.results.map(r => `
        <div class="search-result-card" onclick="openSurah(${r.surah_number})">
          <div class="search-result-ref">Surah ${r.surah_name} · Ayah ${r.ayah}</div>
          <div class="search-result-arabic">${r.text}</div>
          <div class="search-result-en verse-en">${highlight(r.translation_en)}</div>
          ${r.translation_bn ? `<div class="search-result-bn verse-bn">${r.translation_bn}</div>` : ''}
        </div>`).join('');
  } catch (e) {
    searchResults.innerHTML = '<div class="search-placeholder"><p>Search failed. Please try again.</p></div>';
  }
}

// ═══════════════════════════════════════════════
// RANDOM VERSE MODAL
// ═══════════════════════════════════════════════
const modalOverlay = document.getElementById('modalOverlay');

async function loadRandomVerse() {
  document.getElementById('modalArabic').textContent = '...';
  document.getElementById('modalEn').textContent     = 'Loading...';
  document.getElementById('modalBn').textContent     = '';
  document.getElementById('modalRef').textContent    = '';
  try {
    // Random verse endpoint only gives EN — fetch full verse for BN
    const { data: r } = await fetchJSON(`${API}/random`);
    const { data: surah } = await fetchJSON(`${API}/surah/${r.surah_number}`);
    const v = surah.verses.find(x => x.number === r.ayah) || surah.verses[0];
    currentRandomData = r;
    document.getElementById('modalArabic').textContent = v.text;
    document.getElementById('modalEn').textContent     = `"${v.translation_en}"`;
    document.getElementById('modalBn').textContent     = v.translation_bn || '';
    document.getElementById('modalRef').textContent    = `— Surah ${r.surah_name} (${r.surah_number}:${r.ayah})`;
  } catch (e) {
    document.getElementById('modalEn').textContent = 'Failed to load.';
  }
}
document.getElementById('randomBtn').addEventListener('click', () => { modalOverlay.classList.add('open'); loadRandomVerse(); });
document.getElementById('modalClose').addEventListener('click', () => modalOverlay.classList.remove('open'));
document.getElementById('modalAnotherBtn').addEventListener('click', loadRandomVerse);
document.getElementById('modalReadBtn').addEventListener('click', () => {
  if (currentRandomData) { modalOverlay.classList.remove('open'); openSurah(currentRandomData.surah_number); }
});
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) modalOverlay.classList.remove('open'); });

// ═══════════════════════════════════════════════
// API DOCS — ADVANCED
// ═══════════════════════════════════════════════
function loadApiDocs() {
  const base = window.location.origin;
  document.getElementById('apiBaseUrl').textContent = base + '/api';
  document.getElementById('apiTryPrefix').textContent = base;

  const endpoints = [
    {
      path: '/api',
      displayPath: '/api',
      desc: 'API overview',
      fullDesc: 'Returns meta information about the API including version, author, available endpoints, and dataset statistics.',
      params: [],
      example: '/api'
    },
    {
      path: '/api/surahs',
      displayPath: '/api/surahs',
      desc: 'All 114 surahs',
      fullDesc: 'Returns the full index of all 114 surahs — names in Arabic/English, number of ayahs, revelation type, and more.',
      params: [],
      example: '/api/surahs'
    },
    {
      path: '/api/surah/:number',
      displayPath: '/api/surah/<span class="path-param">:number</span>',
      desc: 'Full surah + verses',
      fullDesc: 'Returns complete surah data including metadata and all verses with Arabic text, English and Bengali translations.',
      params: [
        { name: 'number', type: 'integer', required: true, desc: 'Surah number (1–114)' }
      ],
      example: '/api/surah/36'
    },
    {
      path: '/api/surah/:number/info',
      displayPath: '/api/surah/<span class="path-param">:number</span>/info',
      desc: 'Surah metadata',
      fullDesc: 'Returns only surah metadata (no verses) — name, arabic name, revelation type, number of ayahs, etc.',
      params: [
        { name: 'number', type: 'integer', required: true, desc: 'Surah number (1–114)' }
      ],
      example: '/api/surah/18/info'
    },
    {
      path: '/api/surah/:number/verses',
      displayPath: '/api/surah/<span class="path-param">:number</span>/verses',
      desc: 'All verses only',
      fullDesc: 'Returns all verses of a surah as a flat array. Each verse includes number, Arabic text, English and Bengali translations.',
      params: [
        { name: 'number', type: 'integer', required: true, desc: 'Surah number (1–114)' }
      ],
      example: '/api/surah/2/verses'
    },
    {
      path: '/api/surah/:number/verse/:ayah',
      displayPath: '/api/surah/<span class="path-param">:number</span>/verse/<span class="path-param">:ayah</span>',
      desc: 'Single verse',
      fullDesc: 'Returns a single specific verse with Arabic text, English and Bengali translations, plus surah reference info.',
      params: [
        { name: 'number', type: 'integer', required: true, desc: 'Surah number (1–114)' },
        { name: 'ayah',   type: 'integer', required: true, desc: 'Ayah number (1 to max for that surah)' }
      ],
      example: '/api/surah/2/verse/255'
    },
    {
      path: '/api/surah/:number/recitations',
      displayPath: '/api/surah/<span class="path-param">:number</span>/recitations',
      desc: 'Full surah MP3',
      fullDesc: 'Returns full surah MP3 URLs from 5 renowned reciters (Al-Afasy, As-Sudais, Al-Ghamdi, Al-Minshawi, Al-Husary). Each reciter has an id (1–5). Source: quranicaudio.com.',
      params: [
        { name: 'number', type: 'integer', required: true, desc: 'Surah number (1–114)' }
      ],
      example: '/api/surah/1/recitations'
    },
    {
      path: '/api/surah/:number/verse/:ayah/audio',
      displayPath: '/api/surah/<span class="path-param">:number</span>/verse/<span class="path-param">:ayah</span>/audio',
      desc: 'Single ayah MP3',
      fullDesc: 'Returns individual ayah MP3 URLs from 5 reciters (128kbps, source: everyayah.com). Ideal for short clips. Used by the GoatBot quranmp3 command.',
      params: [
        { name: 'number', type: 'integer', required: true, desc: 'Surah number (1–114)' },
        { name: 'ayah',   type: 'integer', required: true, desc: 'Ayah number within the surah' }
      ],
      example: '/api/surah/2/verse/255/audio'
    },
    {
      path: '/api/search',
      displayPath: '/api/search',
      desc: 'Search verses',
      fullDesc: 'Full-text search across all English translations. Returns matched verses with surah reference, Arabic text, and both translations.',
      params: [
        { name: 'q',     type: 'string',  required: true,  desc: 'Search query (min 2 characters)' },
        { name: 'limit', type: 'integer', required: false, desc: 'Max results to return (default: 20, max: 50)' }
      ],
      example: '/api/search?q=mercy&limit=5'
    },
    {
      path: '/api/random',
      displayPath: '/api/random',
      desc: 'Random verse',
      fullDesc: 'Returns a randomly selected verse from the entire Quran with Arabic text, English and Bengali translations.',
      params: [],
      example: '/api/random'
    },
  ];

  document.getElementById('endpointList').innerHTML = endpoints.map((ep, i) => {
    const paramsHtml = ep.params.length ? `
      <div class="params-label">PARAMETERS</div>
      <table class="params-table">
        <thead><tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
        <tbody>${ep.params.map(p => `
          <tr>
            <td><span class="param-name">${p.name}</span></td>
            <td><span class="param-type">${p.type}</span></td>
            <td>${p.required ? '<span class="param-required">required</span>' : '<span class="param-optional">optional</span>'}</td>
            <td class="param-desc">${p.desc}</td>
          </tr>`).join('')}
        </tbody>
      </table>` : '';

    return `
    <div class="endpoint-card" id="epc-${i}">
      <div class="endpoint-header" onclick="toggleEndpoint(${i})">
        <span class="method-badge">GET</span>
        <span class="endpoint-path">${ep.displayPath}</span>
        <span class="endpoint-desc">${ep.desc}</span>
        <span class="endpoint-chevron">›</span>
      </div>
      <div class="endpoint-body" id="ep-${i}">
        <div class="endpoint-inner">
          <div class="endpoint-full-desc">${ep.fullDesc}</div>
          ${paramsHtml}
          <div class="params-label">EXAMPLE REQUEST</div>
          <div class="endpoint-example-row">
            <span class="endpoint-example-url"><a href="${ep.example}" target="_blank">${base}${ep.example}</a></span>
            <button class="endpoint-try-btn" onclick="fillPlayground('${ep.example}')">▶ Try</button>
            <button class="copy-btn-sm" onclick="navigator.clipboard.writeText('${base}${ep.example}').then(()=>showToast('URL copied!'))">⎘</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function toggleEndpoint(i) {
  const body = document.getElementById(`ep-${i}`);
  const card = document.getElementById(`epc-${i}`);
  const wasOpen = card.classList.contains('open');
  document.querySelectorAll('.endpoint-card.open').forEach(c => {
    c.classList.remove('open');
    c.querySelector('.endpoint-body').classList.remove('open');
  });
  if (!wasOpen) { body.classList.add('open'); card.classList.add('open'); }
}

function fillPlayground(path) {
  document.getElementById('apiTryInput').value = path;
  document.getElementById('apiTryInput').focus();
  tryApiCall();
  document.querySelector('.api-playground-col').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function syntaxHighlight(json) {
  const str = typeof json === 'string' ? json : JSON.stringify(json, null, 2);
  return str.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, match => {
    if (/^"/.test(match)) {
      if (/:$/.test(match)) return `<span class="json-key">${match}</span>`;
      return `<span class="json-str">${match}</span>`;
    }
    if (/true|false/.test(match)) return `<span class="json-bool">${match}</span>`;
    if (/null/.test(match))       return `<span class="json-null">${match}</span>`;
    return `<span class="json-num">${match}</span>`;
  });
}

async function tryApiCall() {
  const input  = document.getElementById('apiTryInput').value.trim() || '/api/random';
  const result = document.getElementById('apiTryResult');
  const status = document.getElementById('apiTryStatus');
  const timeEl = document.getElementById('apiTryTime');
  const pre    = document.getElementById('apiTryPre');

  result.style.display = 'block';
  status.textContent = '● Loading…';
  status.style.color = 'var(--text-mute)';
  pre.innerHTML = '';
  timeEl.textContent = '';

  const t0 = performance.now();
  try {
    const path = input.startsWith('/') ? input : '/' + input;
    const res  = await fetch(path);
    const ms   = Math.round(performance.now() - t0);
    const json = await res.json();
    const raw  = JSON.stringify(json, null, 2);
    const truncated = raw.length > 6000 ? raw.slice(0, 6000) + '\n\n// … truncated' : raw;

    status.textContent = `● HTTP ${res.status} ${res.ok ? '✓' : '✗'}`;
    status.style.color = res.ok ? 'var(--teal)' : '#e05555';
    timeEl.textContent = `${ms} ms`;
    pre.innerHTML = syntaxHighlight(truncated);
  } catch (e) {
    status.textContent = '● Error';
    status.style.color = '#e05555';
    pre.textContent = String(e);
    timeEl.textContent = '';
  }
}

function copyApiBase() {
  const url = document.getElementById('apiBaseUrl').textContent;
  navigator.clipboard.writeText(url).then(() => showToast('Base URL copied!'));
}
function copyApiResult() {
  navigator.clipboard.writeText(document.getElementById('apiTryPre').textContent).then(() => showToast('Response copied!'));
}

// ═══════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ═══════════════════════════════════════════════
document.addEventListener('keydown', e => {
  const tag = document.activeElement.tagName;
  if (['INPUT','TEXTAREA'].includes(tag)) return;
  if (e.key === 'Escape') modalOverlay.classList.remove('open');
  if (e.key === 'f' || e.key === 'F') { switchView('search'); setTimeout(() => searchInput.focus(), 100); }
  if (e.key === 'b' || e.key === 'B') switchView('browse');
  if (e.key === 'r' || e.key === 'R') { modalOverlay.classList.add('open'); loadRandomVerse(); }
  if (e.key === 'h' || e.key === 'H') switchView('home');
  if (e.key === 'ArrowRight' && document.getElementById('view-reader').classList.contains('active')) {
    if (currentSurahNum < 114) { stopAudio(); openSurah(currentSurahNum + 1); }
  }
  if (e.key === 'ArrowLeft' && document.getElementById('view-reader').classList.contains('active')) {
    if (currentSurahNum > 1) { stopAudio(); openSurah(currentSurahNum - 1); }
  }
});

// API try: Enter key
document.getElementById('apiTryInput').addEventListener('keydown', e => { if (e.key === 'Enter') tryApiCall(); });

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
applyFontSize();
setLang(langPref);
updateBookmarkBadge();
checkContinueReading();
loadDailyVerse();
loadSurahList();
