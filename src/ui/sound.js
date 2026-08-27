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

export function playDestroySound(id) {
  const soundUrl = {
    signboard: SIGNBOARD_BREAK_URL,
    bicycle: BICYCLE_BREAK_URL,
    car: CAR_BREAK_URL,
    house: HOUSE_BREAK_URL,
    shop: SHOP_BREAK_URL,
    arcade: ARCADE_BREAK_URL,
  }[id];
  if (!soundUrl) return;

  const audio = new Audio(soundUrl);
  if (id === 'bicycle' || id === 'car') audio.volume = 0.65;
  if (id === 'house') audio.volume = 0.9;
  audio.play().catch(() => {});
}
