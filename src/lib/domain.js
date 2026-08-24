/* ============================================================
   ドメインロジック
   画面に依存しない計算はすべてここに置く。
   ここを3人で共有するので、変更するときは必ず声をかけること。
   ============================================================ */

import { S } from './state.js';
import { THRESH, TIERS, OBJECTS, BANDS } from '../data/levels.js';
import { STEPS } from '../data/copy.js';
import { logicalToday, daysBetween } from './date.js';

/* ---------- レベル算出 ---------- */

/** 累計達成日数からレベルを求める（0 = まだ発生していない） */
export function levelOf(days) {
  let lv = 0;
  for (let i = 0; i < THRESH.length; i++) if (days >= THRESH[i]) lv = i + 1;
  return lv;
}

/** レベルに対応する見た目の段階 */
export function tierOf(lv) {
  let t = TIERS[0];
  for (const x of TIERS) if (lv >= x.min) t = x;
  return t;
}

/** レベルに対応する階級カラー */
export function bandOf(lv) {
  let b = BANDS[0];
  for (const x of BANDS) if (lv >= x.min) b = x;
  return b;
}

/** そのレベルで壊せる対象の一覧 */
export function unlockedObjects(lv) {
  return OBJECTS.filter(o => lv >= o.lv);
}

/** 被害想定のテキスト */
export function powerText(lv) {
  if (lv < 1) return '観測を始めると災害が育ちます';
  const t = tierOf(lv);
  if (t.max) return 'ビルを3棟まで破壊できます！';
  const u = unlockedObjects(lv);
  if (!u.length) return 'まだ何も壊せません';
  return u[u.length - 1].label + 'まで破壊できます';
}

/** 次のレベルまでの残り日数と進捗率 */
export function nextInfo(days) {
  const lv = levelOf(days);
  if (lv >= 30) return { max: true, need: 0, pct: 1 };
  const cur = lv > 0 ? THRESH[lv - 1] : 0;
  const nxt = THRESH[lv];
  return { max: false, need: nxt - days, pct: Math.max(0, Math.min(1, (days - cur) / (nxt - cur))) };
}

/* ---------- 今日の1歩 ---------- */

/** 日付をシードにして、その日のうちは同じ「1歩」を出す */
export function todayStep() {
  const d = logicalToday();
  let h = 0;
  for (let i = 0; i < d.length; i++) h = (h * 31 + d.charCodeAt(i)) >>> 0;
  return STEPS[h % STEPS.length];
}

/* ---------- 減衰（起動時に計算する） ---------- */

/**
 * サボった日数に応じて災害を弱らせる。
 * 1日：猶予 / 2〜3日：弱るが連続日数は保持 / 4日〜：1日ずつ減算
 * 連続日数はゼロにせず、1階級下の日数を下限とする。
 * @returns {number} 最終達成日からの経過日数
 */
export function applyDecay() {
  const last = S.streak.lastAchievedOn;
  if (!last) { S.disaster.condition = 'normal'; return 0; }

  const gap = daysBetween(last, logicalToday());
  if (gap <= 1) { S.disaster.condition = 'normal'; return gap; }

  S.disaster.condition = 'weakened';

  if (gap > 3) {
    const lvBefore = levelOf(S.streak.currentDays);
    const floor = lvBefore >= 2 ? THRESH[lvBefore - 2] : 1;
    S.streak.currentDays = Math.max(floor, S.streak.currentDays - (gap - 3));
  }

  S.city.damageState = Math.min(3, gap - 1);
  S.disaster.level = Math.max(1, levelOf(S.streak.currentDays));
  return gap;
}

/* ---------- 達成処理 ---------- */

/**
 * 今日の継続達成を記録し、成長と報酬を確定する。
 * @returns 演出に渡す結果オブジェクト
 */
export function achieveToday() {
  const t = logicalToday();
  if (S.streak.lastAchievedOn === t) return { already: true };

  const levelBefore = Math.max(1, levelOf(S.streak.currentDays));

  // 減衰は起動時に済んでいるので、ここでは常に +1 でよい
  S.streak.currentDays += 1;
  S.streak.lastAchievedOn = t;
  S.streak.longestDays = Math.max(S.streak.longestDays, S.streak.currentDays);
  S.disaster.condition = 'normal';
  S.city.damageState = 0;
  S.logs.push({ date: t, step: todayStep() });

  const levelAfter = Math.max(1, levelOf(S.streak.currentDays));
  S.disaster.level = levelAfter;
  S.disaster.exp = S.streak.currentDays;

  // 新しく壊せるようになった対象
  const unlocked = unlockedObjects(levelAfter)
    .filter(o => !S.rewards.unlockedObjects.includes(o.id));
  unlocked.forEach(o => S.rewards.unlockedObjects.push(o.id));

  // 7日ごとにサボり券
  let item = null;
  if (S.streak.currentDays % 7 === 0) {
    item = { id: 'skip_' + t, acquiredAt: t, usedAt: null };
    S.rewards.items.push(item);
  }

  if (levelAfter >= 30) S.flags.finalDisasterUnlocked = true;

  return {
    already: false,
    levelBefore, levelAfter,
    leveledUp: levelAfter > levelBefore,
    unlocked, item,
  };
}

/** 街の対象を1つ壊す */
export function destroyObject(id) {
  S.city.destroyed[id] = (S.city.destroyed[id] || 0) + 1;
}
