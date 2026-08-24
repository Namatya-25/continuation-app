/* ============================================================
   レーダースコープの描画
   このアプリの主役。災害はレーダーのエコーとして表示する。
   ============================================================ */

import { S } from '../lib/state.js';
import { tierOf, bandOf } from '../lib/domain.js';

const CX = 200, CY = 168;   // スコープの中心

/** 現在の状態からスコープのSVG文字列を作る */
export function scopeSVG() {
  const lv    = Math.max(1, S.disaster.level);
  const band  = bandOf(lv).c;
  const weak  = S.disaster.condition === 'weakened';
  const scale = 0.42 + Math.min(lv, 30) * 0.021;
  const rm    = matchMedia('(prefers-reduced-motion:reduce)').matches;

  return `<svg viewBox="0 0 400 336" xmlns="http://www.w3.org/2000/svg" role="img"
      aria-label="階級${lv} ${tierOf(lv).name}のレーダー表示">
    <defs>
      <radialGradient id="glow">
        <stop offset="0" stop-color="${band}" stop-opacity=".26"/>
        <stop offset="1" stop-color="${band}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="sw" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="${band}" stop-opacity=".34"/>
        <stop offset="1" stop-color="${band}" stop-opacity="0"/>
      </linearGradient>
    </defs>

    ${grid()}
    <circle cx="${CX}" cy="${CY}" r="148" fill="url(#glow)"/>
    ${rm ? '' : `<g id="sweep"><path d="M${CX} ${CY} L348 ${CY} A148 148 0 0 0 305 63 Z" fill="url(#sw)"/></g>`}
    ${rm ? '' : debris(lv, band)}

    <g id="funnel" opacity="${weak ? .5 : 1}">
      <g transform="translate(${CX},${CY}) scale(${scale}) translate(${-CX},${-CY})">
        ${funnel(lv, band)}
        ${face(lv, weak)}
      </g>
    </g>

    <text x="${CX}" y="322" text-anchor="middle" fill="#5B7691"
      font-family="'IBM Plex Mono',monospace" font-size="10" letter-spacing="1.6">
      ${weak ? 'WEAKENED' : 'ACTIVE'} / ECHO ${String(lv).padStart(2, '0')}
    </text>
  </svg>`;
}

/* ---------- 部品 ---------- */

function grid() {
  return `<g stroke="#1E3550" fill="none" stroke-width="1">
    <circle cx="${CX}" cy="${CY}" r="148"/><circle cx="${CX}" cy="${CY}" r="108"/>
    <circle cx="${CX}" cy="${CY}" r="68"/><circle cx="${CX}" cy="${CY}" r="28"/>
    <line x1="52" y1="${CY}" x2="348" y2="${CY}"/>
    <line x1="${CX}" y1="20" x2="${CX}" y2="316"/>
  </g>`;
}

/** 渦。レベルが上がるほど層が増え、振れ幅が大きくなる */
function funnel(lv, color) {
  const bands = 5 + Math.floor(lv / 4);
  let out = '';
  for (let i = 0; i < bands; i++) {
    const p   = i / (bands - 1);
    const y   = 40 + p * 130;
    const rx  = 78 - p * 62;
    const ry  = 12 - p * 7;
    const off = Math.sin(p * 6.0) * (9 + lv * 0.28);
    out += `<ellipse cx="${CX + off}" cy="${y}" rx="${rx}" ry="${ry}"
      fill="none" stroke="${color}" stroke-width="${3.2 - p * 1.3}" opacity="${0.35 + p * 0.5}"/>`;
  }
  return out;
}

/** 表情。Lv10で口が開き、Lv15で吊り眉になる */
function face(lv, weak) {
  const eyeY  = 62;
  const eyeDx = 17 + lv * 0.16;
  const angry = lv >= 15;

  const brows = angry ? `
    <path d="M${CX - eyeDx - 11} ${eyeY - 12} L${CX - eyeDx + 7} ${eyeY - 6}"
      stroke="#F2F7FB" stroke-width="3" stroke-linecap="round"/>
    <path d="M${CX + eyeDx + 11} ${eyeY - 12} L${CX + eyeDx - 7} ${eyeY - 6}"
      stroke="#F2F7FB" stroke-width="3" stroke-linecap="round"/>` : '';

  const mouth = weak
    ? `<path d="M188 ${eyeY + 19} Q${CX} ${eyeY + 13} 212 ${eyeY + 19}"
        stroke="#F2F7FB" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
    : lv >= 10
      ? `<path d="M186 ${eyeY + 15} Q${CX} ${eyeY + 30} 214 ${eyeY + 15} Z" fill="#F2F7FB"/>`
      : `<path d="M191 ${eyeY + 17} Q${CX} ${eyeY + 24} 209 ${eyeY + 17}"
          stroke="#F2F7FB" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;

  return `<g id="face">
    <circle cx="${CX - eyeDx}" cy="${eyeY}" r="${7.5 + lv * 0.06}" fill="#F2F7FB"/>
    <circle cx="${CX + eyeDx}" cy="${eyeY}" r="${7.5 + lv * 0.06}" fill="#F2F7FB"/>
    <circle cx="${CX - eyeDx}" cy="${eyeY + (weak ? 2 : 0)}" r="3.4" fill="#0A1420"/>
    <circle cx="${CX + eyeDx}" cy="${eyeY + (weak ? 2 : 0)}" r="3.4" fill="#0A1420"/>
    ${brows}${mouth}
  </g>`;
}

/** 飛散物。Lv6から出る */
function debris(lv, color) {
  if (lv < 6) return '';
  const n = Math.min(9, 2 + Math.floor(lv / 3));
  let out = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = 92 + (i % 3) * 17;
    const x = CX + Math.cos(a) * r;
    const y = CY + Math.sin(a) * r * 0.5;
    out += `<rect x="${x}" y="${y}" width="${5 + i % 4}" height="${4 + i % 3}"
      fill="${color}" opacity=".72" transform="rotate(${i * 37} ${x} ${y})"/>`;
  }
  return `<g class="debris">${out}</g>`;
}
