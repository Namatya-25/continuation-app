/* ============================================================
   被害区域の描画
   壊す気持ちよさがこのアプリの中核なので、演出はここで作り込む。
   ============================================================ */

import { S } from '../lib/state.js';
import { OBJECTS, CITY_LAYOUT } from '../data/levels.js';
import { powerText, bandOf } from '../lib/domain.js';
import { BANDS } from '../data/levels.js';

const G     = 200;          // 地面のY座標
const INK   = '#2A3B4F';
const FILL  = '#FFFFFF';
const SHADE = '#D3DEE8';

/** 街全体のSVG */
export function citySVG() {
  const lv  = Math.max(1, S.disaster.level);
  const dmg = S.city.damageState;

  const objs = CITY_LAYOUT.map(o => {
    const def    = OBJECTS.find(x => x.id === o.id);
    const locked = lv < def.lv;
    const broken = (S.city.destroyed[o.id] || 0) > 0;
    const label  = locked ? `（階級${def.lv}で解放）` : broken ? '（破壊済み）' : 'を破壊する';

    return `<g class="obj" data-id="${o.id}" data-locked="${locked ? 1 : 0}"
        tabindex="0" role="button" aria-label="${def.label}${label}"
        opacity="${locked ? .32 : 1}">
      <rect class="hit" x="${o.x - 6}" y="88" width="${o.w + 12}" height="118" rx="2"/>
      ${drawObject(o.id, o.x, o.w, broken)}
      ${locked ? `<text x="${o.x + o.w / 2}" y="120" text-anchor="middle" fill="#5D7186"
        font-family="'IBM Plex Mono',monospace" font-size="11">Lv${def.lv}</text>` : ''}
    </g>`;
  }).join('');

  // サボりで入る地割れ
  let cracks = '';
  for (let i = 0; i < dmg; i++) {
    cracks += `<path d="M${90 + i * 180} ${G} l14 12 l-8 10 l16 8"
      fill="none" stroke="#8A98A8" stroke-width="2"/>`;
  }

  return `<svg viewBox="0 0 640 224" xmlns="http://www.w3.org/2000/svg">
    <line x1="0" y1="${G}" x2="640" y2="${G}" stroke="${INK}" stroke-width="2.5"/>
    ${cracks}${objs}
  </svg>`;
}

/** 壊せる対象の説明文 */
export function cityLede() {
  return S.streak.currentDays === 0
    ? '災害がまだ発生していません。1歩を踏み出すと壊せるものが現れます。'
    : powerText(Math.max(1, S.disaster.level)) + '。壊したい対象をタップしてください。';
}

export function playDestroyAnimation(id, onImpact) {
  const host = document.querySelector('#cityHost');
  const target = host?.querySelector(`.obj[data-id="${id}"]`);
  const layout = CITY_LAYOUT.find(o => o.id === id);
  const def = OBJECTS.find(o => o.id === id);
  if (!host || !target || !layout || !def) return Promise.resolve();

  const center = layout.x + layout.w / 2;
  const currentLevel = Math.max(1, S.disaster.level);
  const scale = Math.min(0.82, 0.58 + currentLevel / 100);
  const tornadoLift = 200 - 200 * scale;
  const startX = center - 190 * scale;
  const endX = center + 190 * scale;
  const cropWidth = 220;
  const cropX = center - cropWidth / 2;
  const targetOffset = 0;
  const bandNo = BANDS.indexOf(bandOf(currentLevel)) + 1;
  const fragments = destroyFragments(def.lv, center);
  const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 1050;
  const fx = document.createElement('div');
  fx.className = 'destroy-fx';
  fx.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true">
    <rect class="destroy-backdrop" width="100" height="100"/>
    <rect class="destroy-frame" x="7" y="13" width="86" height="74"/>
    <text class="destroy-kicker" x="10" y="10">LEVEL ${def.lv} / ${def.label}</text>
    <svg class="destroy-stage" x="9" y="16" width="82" height="68"
      viewBox="${cropX} 40 ${cropWidth} 184" preserveAspectRatio="xMidYMid meet">
      <rect class="destroy-sky" x="${cropX}" y="40" width="${cropWidth}" height="160"/>
      <rect class="destroy-ground-fill" x="${cropX}" y="200" width="${cropWidth}" height="24"/>
      <line x1="${cropX}" y1="200" x2="${cropX + cropWidth}" y2="200" class="destroy-ground"/>
      <g class="destroy-target-copy" transform="translate(${targetOffset} 0)">${target.innerHTML}</g>
      <g class="destroy-tornado-lift" transform="translate(0 ${tornadoLift})">
        <g class="destroy-tornado">
          <image class="destroy-tornado-image tornado-frame-a" href="./assets/tornado/${bandNo}-1.png"
            x="-100" y="0" width="200" height="200" preserveAspectRatio="xMidYMid meet"/>
          <image class="destroy-tornado-image tornado-frame-b" href="./assets/tornado/${bandNo}-2.png"
            x="-100" y="0" width="200" height="200" preserveAspectRatio="xMidYMid meet"/>
          <image class="destroy-face" href="./assets/face/${bandNo}-m1.png"
            x="-43" y="44" width="86" height="86" preserveAspectRatio="xMidYMid meet"/>
        </g>
      </g>
      <g class="destroy-fragments">${fragments}</g>
    </svg>
  </svg>`;
  document.body.append(fx);

  const tornado = fx.querySelector('.destroy-tornado');
  const targetCopy = fx.querySelector('.destroy-target-copy');
  const fragmentNodes = [...fx.querySelectorAll('.destroy-fragment')];
  const impactTimer = setTimeout(() => {
    targetCopy.innerHTML = rubble(layout.x, layout.w);
    onImpact?.();
  }, duration * 0.52);
  const tornadoAnimation = tornado.animate([
    { transform: `translateX(${startX}px) scale(${scale})` },
    { transform: `translateX(${endX}px) scale(${scale})` },
  ], { duration, easing: 'linear', fill: 'forwards' });
  const targetAnimation = targetCopy.animate([
    { transform: `translateX(${targetOffset}px)` },
    { transform: `translateX(${targetOffset - 5}px)` },
    { transform: `translateX(${targetOffset + 6}px)` },
    { transform: `translateX(${targetOffset - 3}px)` },
    { transform: `translateX(${targetOffset}px)` },
  ], {
    duration: Math.max(1, duration * 0.44),
    delay: duration * 0.38,
    easing: 'ease-in-out',
    fill: 'forwards',
  });
  fragmentNodes.forEach((fragment, index) => {
    const direction = index % 2 ? 1 : -1;
    fragment.animate([
      { opacity: 0, transform: 'translate(0, 0) rotate(0deg)' },
      { opacity: 1, transform: `translate(${direction * (8 + index * 2)}px, ${-10 - index * 2}px) rotate(${direction * 55}deg)` },
      { opacity: 0, transform: `translate(${direction * (18 + index * 3)}px, ${8 + index}px) rotate(${direction * 120}deg)` },
    ], { duration: duration * 0.42, delay: duration * 0.47 + index * 12, easing: 'cubic-bezier(.12,.7,.28,1)', fill: 'forwards' });
  });

  return Promise.all([tornadoAnimation.finished, targetAnimation.finished])
    .finally(() => {
      clearTimeout(impactTimer);
      fx.remove();
    });
}

function destroyFragments(level, center) {
  const count = Math.min(16, 3 + Math.ceil(level * 0.45));
  return Array.from({ length: count }, (_, index) => {
    const x = center - 78 + (index * 37) % 157;
    const y = 72 + (index * 29) % 120;
    const size = 2 + (index % 3);
    const tilt = index % 2 ? 1 : -1;
    return `<rect class="destroy-fragment" x="${x}" y="${y}" width="${size + 2}" height="${size}"
      rx=".5" transform="rotate(${tilt * (15 + index * 8)} ${x} ${y})"/>`;
  }).join('');
}

/** 破壊数の一覧 */
export function tallyHTML() {
  const lv = Math.max(1, S.disaster.level);
  return OBJECTS.map(o => {
    const n = S.city.destroyed[o.id] || 0;
    const locked = lv < o.lv;
    return `<span class="chip ${locked ? 'locked' : ''}">${o.label} <b>${locked ? 'Lv' + o.lv : n}</b></span>`;
  }).join('');
}

/* ---------- 個々のオブジェクト ---------- */

function drawObject(id, x, w, broken) {
  if (broken) return rubble(x, w);
  const s = d => `<path d="${d}" fill="${FILL}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;

  switch (id) {
    case 'signboard':
      return `<g>${s(`M${x + w * 0.42} ${G} l0 -30`)}${s(`M${x + w * 0.1} ${G - 30} h${w * 0.68} v-22 h-${w * 0.68} Z`)}
        <line x1="${x + w * 0.2}" y1="${G - 44}" x2="${x + w * 0.62}" y2="${G - 44}" stroke="${INK}" stroke-width="2"/>
        <line x1="${x + w * 0.2}" y1="${G - 38}" x2="${x + w * 0.5}" y2="${G - 38}" stroke="${INK}" stroke-width="2"/></g>`;

    case 'bicycle':
      return `<g><circle cx="${x + w * 0.26}" cy="${G - 10}" r="10" fill="${FILL}" stroke="${INK}" stroke-width="2"/>
        <circle cx="${x + w * 0.74}" cy="${G - 10}" r="10" fill="${FILL}" stroke="${INK}" stroke-width="2"/>
        <path d="M${x + w * 0.26} ${G - 10} L${x + w * 0.46} ${G - 26} L${x + w * 0.68} ${G - 26} L${x + w * 0.74} ${G - 10}"
          fill="none" stroke="${INK}" stroke-width="2"/>
        <path d="M${x + w * 0.46} ${G - 26} l-4 -8 h10" fill="none" stroke="${INK}" stroke-width="2"/></g>`;

    case 'car':
      return `<g>${s(`M${x + 4} ${G - 12} l6 -18 h${w - 32} l10 18 Z`)}
        <rect x="${x + 14}" y="${G - 28}" width="${w * 0.28}" height="12" fill="${SHADE}" stroke="${INK}" stroke-width="1.6"/>
        <circle cx="${x + 16}" cy="${G - 8}" r="7" fill="${FILL}" stroke="${INK}" stroke-width="2"/>
        <circle cx="${x + w - 20}" cy="${G - 8}" r="7" fill="${FILL}" stroke="${INK}" stroke-width="2"/></g>`;

    case 'house':
      return `<g>${s(`M${x + 6} ${G} v-34 h${w - 14} v34 Z`)}${s(`M${x} ${G - 34} l${w / 2} -24 l${w / 2} 24 Z`)}
        <rect x="${x + w * 0.22}" y="${G - 26}" width="14" height="14" fill="${SHADE}" stroke="${INK}" stroke-width="1.6"/>
        <rect x="${x + w * 0.58}" y="${G - 20}" width="13" height="20" fill="${SHADE}" stroke="${INK}" stroke-width="1.6"/></g>`;

    case 'shop':
      return `<g>${s(`M${x + 4} ${G} v-52 h${w - 10} v52 Z`)}${s(`M${x} ${G - 52} h${w} l-8 -12 h-${w - 16} Z`)}
        <rect x="${x + 12}" y="${G - 38}" width="${w - 30}" height="16" fill="${SHADE}" stroke="${INK}" stroke-width="1.6"/>
        <rect x="${x + w * 0.3}" y="${G - 20}" width="16" height="20" fill="${SHADE}" stroke="${INK}" stroke-width="1.6"/></g>`;

    case 'arcade':
      return `<g>${s(`M${x} ${G} v-46 h${w * 0.44} v46 Z`)}${s(`M${x + w * 0.5} ${G} v-58 h${w * 0.46} v58 Z`)}
        ${s(`M${x - 4} ${G - 58} h${w + 8} v-10 h-${w + 8} Z`)}
        <rect x="${x + 8}" y="${G - 34}" width="${w * 0.28}" height="14" fill="${SHADE}" stroke="${INK}" stroke-width="1.6"/>
        <rect x="${x + w * 0.58}" y="${G - 44}" width="${w * 0.28}" height="14" fill="${SHADE}" stroke="${INK}" stroke-width="1.6"/></g>`;

    case 'tower': {
      let win = '';
      for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) {
        win += `<rect x="${x + 12 + c * 17}" y="${G - 96 + r * 15}" width="11" height="9"
          fill="${SHADE}" stroke="${INK}" stroke-width="1.2"/>`;
      }
      return `<g>${s(`M${x + 4} ${G} v-104 h${w - 12} v104 Z`)}${win}
        <line x1="${x + w / 2 - 4}" y1="${G - 104}" x2="${x + w / 2 - 4}" y2="${G - 118}" stroke="${INK}" stroke-width="2"/></g>`;
    }
  }
  return '';
}

function rubble(x, w) {
  return `<g opacity=".78">
    <path d="M${x} ${G} l${w * 0.2} -13 l${w * 0.18} 9 l${w * 0.22} -17 l${w * 0.2} 14 l${w * 0.2} -7 l0 14 Z"
      fill="${SHADE}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <line x1="${x + w * 0.3}" y1="${G - 4}" x2="${x + w * 0.42}" y2="${G - 10}" stroke="${INK}" stroke-width="1.6"/>
  </g>`;
}
