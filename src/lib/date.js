/* ============================================================
   日付の扱い
   深夜の勉強を前日扱いにするため、1日の区切りは 04:00 とする
   ============================================================ */

import { S } from './state.js';

/** 開発用オフセットを加味した「いま」 */
export function now() {
  const d = new Date();
  d.setDate(d.getDate() + (S.dev?.offsetDays || 0));
  return d;
}

/** アプリ上の「今日」（04:00区切り） */
export function logicalToday() {
  const d = now();
  d.setHours(d.getHours() - 4);
  return ymd(d);
}

/** Date → 'YYYY-MM-DD' */
export function ymd(d) {
  return d.getFullYear()
    + '-' + String(d.getMonth() + 1).padStart(2, '0')
    + '-' + String(d.getDate()).padStart(2, '0');
}

/** 'YYYY-MM-DD' 同士の日数差（b - a） */
export function daysBetween(a, b) {
  return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
}

/** 'YYYY-MM-DD' を n 日ずらす */
export function shiftDate(s, n) {
  const d = new Date(s + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return ymd(d);
}
