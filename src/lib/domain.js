/* ============================================================
   ドメインロジック（マックス30日版）
   ============================================================ */

import { S } from './state.js';
import { TIERS, OBJECTS, BANDS } from '../data/levels.js';
import { STEPS } from '../data/copy.js';
import { logicalToday, daysBetween } from './date.js';

/** 日数そのものがレベルになる */
export function levelOf(days) {
  return days;
}

export function tierOf(lv) {
  let t = TIERS[0];
  for (const x of TIERS) if (lv >= x.min) t = x;
  return t;
}

export function bandOf(lv) {
  let b = BANDS[0];
  for (const x of BANDS) if (lv >= x.min) b = x;
  return b;
}

export function unlockedObjects(lv) {
  return OBJECTS.filter(o => lv >= o.lv);
}

export function powerText(lv) {
  if (lv < 1) return '観測を始めると災害が育ちます';
  const t = tierOf(lv);
  if (lv >= 30 || t.max) return 'ビルを3棟まで破壊できます！';
  const u = unlockedObjects(lv);
  if (!u.length) return 'まだ何も壊せません';
  return u[u.length - 1].label + 'まで破壊できます';
}

export function nextInfo(days) { // 旧レベルバー（現在は使用されていない）
  if (days >= 30) return { max: true, need: 0, pct: 1 };
  return { max: false, need: 1, pct: 0 };
}

export function examInfo() {
  const examDate = S.settings.examDate;
  const startDate = S.settings.examStartDate;

  // 試験日未設定
  if (!examDate) {
    return {
      set: false,
      daysLeft: null,
      pct: 0,
      finished: false,
    };
  }

  const today = logicalToday();

  const msPerDay = 24 * 60 * 60 * 1000;

  const todayTime = new Date(today + 'T00:00:00').getTime();
  const examTime = new Date(examDate + 'T00:00:00').getTime();

  const daysLeft = Math.ceil(
    (examTime - todayTime) / msPerDay
  );

  // 開始日がない場合はバーを安全に0%から始める
  const startTime = startDate
    ? new Date(startDate + 'T00:00:00').getTime()
    : todayTime;

  const totalDays = Math.max(
    1,
    Math.ceil((examTime - startTime) / msPerDay)
  );

  const passedDays = Math.max(
    0,
    Math.ceil((todayTime - startTime) / msPerDay)
  );

  const pct = Math.max(
    0,
    Math.min(1, passedDays / totalDays)
  );

  return {
    set: true,
    daysLeft,
    pct,
    finished: daysLeft <= 0,
  };
}

export function todayStep() {
  const d = logicalToday();
  let h = 0;
  for (let i = 0; i < d.length; i++) h = (h * 31 + d.charCodeAt(i)) >>> 0;
  return STEPS[h % STEPS.length];
}

export function applyDecay() {
  const last = S.streak.lastAchievedOn;
  if (!last) { S.disaster.condition = 'normal'; return 0; }

  const gap = daysBetween(last, logicalToday());
  if (gap <= 1) { S.disaster.condition = 'normal'; return gap; }

  S.disaster.condition = 'weakened';

  if (gap > 3) {
    const floor = Math.max(0, S.streak.currentDays - (gap - 3));
    S.streak.currentDays = Math.max(floor, S.streak.currentDays - (gap - 3));
  }

  S.city.damageState = Math.min(3, gap - 1);
  S.disaster.level = Math.max(0, S.streak.currentDays);
  return gap;
}

export function achieveToday() {
  const t = logicalToday();
  if (S.streak.lastAchievedOn === t) return { already: true };

  const levelBefore = Math.max(0, S.streak.currentDays);

  S.streak.currentDays += 1;
  S.streak.lastAchievedOn = t;
  S.streak.longestDays = Math.max(S.streak.longestDays, S.streak.currentDays);
  S.disaster.condition = 'normal';
  S.city.damageState = 0;
  S.logs.push({ date: t, step: todayStep() });

  const levelAfter = S.streak.currentDays;
  S.disaster.level = levelAfter;
  S.disaster.exp = levelAfter;

  const unlocked = unlockedObjects(levelAfter)
    .filter(o => !S.rewards.unlockedObjects.includes(o.id));
  unlocked.forEach(o => S.rewards.unlockedObjects.push(o.id));

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

export function destroyObject(id) {
  S.city.destroyed[id] = (S.city.destroyed[id] || 0) + 1;
}