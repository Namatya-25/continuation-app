const SIGNBOARD_BREAK_URL = new URL(
  '../../assets/se/kanbanbukkoware (mp3cut.net) (1).wav',
  import.meta.url,
).href;
const BICYCLE_BREAK_URL = new URL(
  '../../assets/se/jitensyabukkoware (mp3cut.net) (2).wav',
  import.meta.url,
).href;

export function playDestroySound(id) {
  const soundUrl = {
    signboard: SIGNBOARD_BREAK_URL,
    bicycle: BICYCLE_BREAK_URL,
  }[id];
  if (!soundUrl) return;

  const audio = new Audio(soundUrl);
  if (id === 'bicycle') audio.volume = 0.65;
  audio.play().catch(() => {});
}
