/* ============================================================
   レーダースコープの描画
   このアプリの主役。災害はレーダーのエコーとして表示する。
   ============================================================ */

import { S } from '../lib/state.js';
import { tierOf, bandOf } from '../lib/domain.js';
import { BANDS } from '../data/levels.js';

const CX = 200, CY = 168;   // スコープの中心

/** tornado画像読み込み */
export function scopeSVG() {
  const lv = Math.max(1, S.disaster.level);
  const band = bandOf(lv);
  const bandNo = BANDS.indexOf(band) + 1;

  return `
    <div class="tornado-images">
      <img class="tornado-image" src="./assets/tornado/${bandNo}-1.png" alt="" >
      <img class="tornado-image" src="./assets/tornado/${bandNo}-2.png" alt="" >

      <div class="face-images">
      <img class="face-image face-m1" src="./assets/face/${bandNo}-m1.png" alt="" >
      <img class="face-image face-m2" src="./assets/face/${bandNo}-m2.png" alt="" >
      <img class="face-image face-m3" src="./assets/face/${bandNo}-m3.png" alt="" >
      </div>
    </div> 
  `;
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
