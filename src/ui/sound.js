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
const TOWER_BREAK_URL = new URL(
  '../../assets/se/birubukkowasare.wav',
  import.meta.url,
).href;

export const DESTROY_SOUND_IDS = [
  'signboard', 'bicycle', 'car', 'house', 'shop', 'arcade', 'tower',
];

const DEFAULT_VOLUMES = {
  signboard: 1, bicycle: 0.65, car: 0.65, house: 0.9,
  shop: 1, arcade: 1, tower: 0.9,
};

const SOUND_URLS = {
  signboard: SIGNBOARD_BREAK_URL, bicycle: BICYCLE_BREAK_URL,
  car: CAR_BREAK_URL, house: HOUSE_BREAK_URL, shop: SHOP_BREAK_URL,
  arcade: ARCADE_BREAK_URL, tower: TOWER_BREAK_URL,
};

export function playDestroySound(id, volumes = {}) {
  const soundUrl = SOUND_URLS[id];
  if (!soundUrl || volumes[id] === false) return;

  const audio = new Audio(soundUrl);
  audio.volume = DEFAULT_VOLUMES[id];
  audio.play().catch(() => {});
}

