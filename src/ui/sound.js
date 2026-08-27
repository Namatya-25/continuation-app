/* ============================================================
   サウンド管理
   ============================================================ */

const SIGNBOARD_BREAK_URL = new URL(
  '../../assets/se/kanbanbukkoware (mp3cut.net) (1).wav',
  import.meta.url,
).href;
const BICYCLE_BREAK_URL = new URL(
  '../../assets/se/jitensyabukkoware (mp3cut.net) (2).wav',
  import.meta.url,
).href;
const CAR_BREAK_URL = new URL(
  '../../assets/se/kurumabukkoware (mp3cut.net) (1).wav',
  import.meta.url,
).href;
const HOUSE_BREAK_URL = new URL(
  '../../assets/se/outibukkoware.wav',
  import.meta.url,
).href;
const SHOP_BREAK_URL = new URL(
  '../../assets/se/syoutenbukkoware.wav',
  import.meta.url,
).href;
const ARCADE_BREAK_URL = new URL(
  '../../assets/se/syoutengaibukkowasare.wav',
  import.meta.url,
).href;

const SOUND_URLS = {
  signboard: SIGNBOARD_BREAK_URL,
  bicycle: BICYCLE_BREAK_URL,
  car: CAR_BREAK_URL,
  house: HOUSE_BREAK_URL,
  shop: SHOP_BREAK_URL,
  arcade: ARCADE_BREAK_URL,
};

// あらかじめ音声オブジェクトを保持するキャッシュ
const audioCache = {};

/** 音声を事前に読み込んでおく */
export function preloadSounds() {
  Object.entries(SOUND_URLS).forEach(([id, url]) => {
    const audio = new Audio(url);
    audio.load();
    audioCache[id] = audio;
  });
}

/** 最初のユーザー操作時にブラウザの音声ブロックを解除する */
export function unlockAudio() {
  Object.values(audioCache).forEach(audio => {
    audio.play().then(() => {
      audio.pause();
      audio.currentTime = 0;
    }).catch(() => {});
  });
}

/** 破壊音を再生する */
export function playDestroySound(id) {
  const soundUrl = SOUND_URLS[id];
  if (!soundUrl) return;

  // キャッシュから再生を試みる（無ければ新規作成）
  let audio = audioCache[id];
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } else {
    audio = new Audio(soundUrl);
    if (id === 'bicycle' || id === 'car') audio.volume = 0.65;
    if (id === 'house') audio.volume = 0.9;
    audio.play().catch(() => {});
  }
}