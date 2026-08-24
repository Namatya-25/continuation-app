/* ============================================================
   観測記録の描画（カレンダー・統計・コレクション・履歴）
   ============================================================ */

import { S } from '../lib/state.js';
import { OBJECTS } from '../data/levels.js';
import { now, ymd, logicalToday } from '../lib/date.js';

/** 今月のカレンダー */
export function calendarHTML() {
  const t = now(), y = t.getFullYear(), m = t.getMonth();
  const first = new Date(y, m, 1);
  const last  = new Date(y, m + 1, 0);
  const pad   = (first.getDay() + 6) % 7;      // 月曜始まり
  const hits  = new Set(S.logs.map(l => l.date));
  const today = logicalToday();

  let html = '';
  for (let i = 0; i < pad; i++) html += '<div class="pad"></div>';
  for (let d = 1; d <= last.getDate(); d++) {
    const key = ymd(new Date(y, m, d));
    html += `<div class="${hits.has(key) ? 'hit-day' : ''} ${key === today ? 'today' : ''}">${d}</div>`;
  }
  return { html, title: `${y}年 ${m + 1}月` };
}

/** 解放したものの一覧 */
export function collectionHTML() {
  const items = S.rewards.items.filter(i => !i.usedAt).length;
  return OBJECTS
    .map(o => `<span class="chip ${S.rewards.unlockedObjects.includes(o.id) ? '' : 'locked'}">${o.label}</span>`)
    .join('')
    + `<span class="chip ${items ? '' : 'locked'}">サボり券 <b>${items}</b></span>`
    + `<span class="chip ${S.flags.finalDisasterUnlocked ? '' : 'locked'}">最終災害</span>`;
}

/** 直近の1歩の履歴 */
export function logListHTML() {
  const recent = S.logs.slice(-8).reverse();
  if (!recent.length) return '<p class="tiny">記録はまだありません。</p>';
  return recent.map(l => `<div style="display:flex;gap:12px;padding:6px 0;border-bottom:1px solid var(--line);font-size:13px">
    <span class="tiny" style="min-width:74px">${l.date.slice(5).replace('-', '/')}</span>
    <span>${l.step}</span>
  </div>`).join('');
}
