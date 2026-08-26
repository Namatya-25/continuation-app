const SIGNBOARD_BREAK_URL = new URL(
  '../../assets/se/kanbanbukkoware (mp3cut.net) (1).wav',
  import.meta.url,
).href;

export function playDestroySound(id) {
  if (id !== 'signboard') return;

  const audio = new Audio(SIGNBOARD_BREAK_URL);
  audio.play().catch(() => {});
}
