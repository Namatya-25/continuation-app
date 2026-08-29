/* ============================================================
   レベル・階級・破壊対象のマスタデータ
   「日数 ＝ レベル」とし、マックス30日（Lv30）で調整
   ============================================================ */

// 災害の見た目の段階（min ＝ 適用される日数・レベル）
export const TIERS = [
  { min: 1,  name: '小さなつむじ風', obj: null },
  { min: 2,  name: 'つむじ風',       obj: 'signboard' },
  { min: 4,  name: '小さな竜巻',     obj: 'bicycle' },
  { min: 6,  name: '竜巻',           obj: 'car' },
  { min: 10, name: '中型竜巻',       obj: 'house' },
  { min: 15, name: '大型竜巻',       obj: 'shop' },
  { min: 20, name: '超大型竜巻',     obj: 'arcade' },
  { min: 25, name: '巨大竜巻',       obj: 'tower' },
  { min: 30, name: '巨大竜巻',       obj: 'tower', max: true },
];

// 壊せる対象。lv ＝ 解放される日数（レベル）
export const OBJECTS = [
  { id: 'signboard', label: '看板',   lv: 2 },
  { id: 'bicycle',   label: '自転車', lv: 4 },
  { id: 'car',       label: '車',     lv: 6 },
  { id: 'house',     label: '民家',   lv: 10 },
  { id: 'shop',      label: '商店',   lv: 15 },
  { id: 'arcade',    label: '商店街', lv: 20 },
  { id: 'tower',     label: 'ビル',   lv: 25 },
];

// 気象庁の降水強度カラースケールを階級表示に流用（30日基準）
export const BANDS = [
  { min: 1,  c: '#A0D2FF', label: '階級1' },
  { min: 3,  c: '#218CFF', label: '階級2' },
  { min: 6,  c: '#0041FF', label: '階級3' },
  { min: 10, c: '#FAF500', label: '階級4' },
  { min: 15, c: '#FF9900', label: '階級5' },
  { min: 21, c: '#FF2800', label: '階級6' },
  { min: 28, c: '#B40068', label: '階級7' },
];

// 街のオブジェクト配置（x = 左端, w = 幅。SVGは viewBox 640x224）
export const CITY_LAYOUT = [
  { id: 'signboard', x: 24,  w: 44 },
  { id: 'bicycle',   x: 88,  w: 44 },
  { id: 'car',       x: 152, w: 66 },
  { id: 'house',     x: 238, w: 78 },
  { id: 'shop',      x: 336, w: 78 },
  { id: 'arcade',    x: 434, w: 96 },
  { id: 'tower',     x: 550, w: 70 },
];