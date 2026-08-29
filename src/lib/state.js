/* ============================================================
   アプリ全体の状態
   S はESモジュールのライブバインディングで公開しているため、
   setS() で差し替えると読み込み側にもそのまま反映される。
   ============================================================ */

export function blank() {
  return {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),

    settings: {
      targetQualification: '',
      examDate: '',
      remindTime: '20:00',
      remindEnabled: true,
      destroySounds: {},
    },
    disaster:  { type: 'tornado', level: 1, exp: 0, condition: 'normal' },
    streak:    { currentDays: 0, longestDays: 0, lastAchievedOn: null },
    logs:      [],                       // { date, step }
    rewards:   { unlockedObjects: [], items: [] },
    city:      { destroyed: {}, damageState: 0 },
    flags:     { onboardingDone: false, finalDisasterUnlocked: false },
    dev:       { offsetDays: 0 },        // 開発用。公開時は削除する
  };
}

export let S = blank();

/** 状態を丸ごと差し替える（読み込み・インポート・リセット時のみ使う） */
export function setS(next) {
  S = Object.assign(blank(), next);
  S.dev = S.dev || { offsetDays: 0 };
  return S;
}
