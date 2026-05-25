'use strict';

const { sendDailyVerse, getSubs } = require('../cmds/dailyayat');

const SEND_HOUR_UTC  = 1;
const SEND_MIN_UTC   = 30;
const DELAY_BETWEEN  = 2000;

module.exports = {
  config: {
    name: 'autoayat',
    version: '2.0',
    author: 'SIFAT (MYB-SIFU)',
    description: 'Sends daily Quran verse to all subscribed groups at scheduled time',
    category: 'islamic',
    type: ['log:subscribe'],
  },

  onLoad: function ({ api }) {
    scheduleNext(api);
  },
};

function scheduleNext(api) {
  const now  = new Date();
  const next = new Date();
  next.setUTCHours(SEND_HOUR_UTC, SEND_MIN_UTC, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  const delay = next - now;
  console.log(`[autoayat] Next dispatch: ${next.toUTCString()} (in ${Math.round(delay / 60_000)} min)`);
  setTimeout(async () => {
    await dispatch(api);
    scheduleNext(api);
  }, delay);
}

async function dispatch(api) {
  const entries = Object.entries(getSubs());
  if (!entries.length) { console.log('[autoayat] No subscribers — skipped.'); return; }
  console.log(`[autoayat] Dispatching to ${entries.length} group(s)...`);
  let ok = 0, fail = 0;
  for (const [tid, info] of entries) {
    try {
      await sendDailyVerse(api, tid, null, info?.lang || 'both');
      ok++;
    } catch (e) {
      fail++;
      console.error(`[autoayat] ✗ ${tid}: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, DELAY_BETWEEN));
  }
  console.log(`[autoayat] Done — sent: ${ok}, failed: ${fail}`);
}
