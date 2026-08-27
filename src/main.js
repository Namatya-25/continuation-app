/* ============================================================
   エントリポイント
   状態を書き換えたら persist() → render() を呼ぶ、が全体のルール。
   ============================================================ */

import { S, setS, blank } from './lib/state.js';
import { Storage } from './lib/storage.js';
import { logicalToday, now, shiftDate } from './lib/date.js';
import {
  levelOf, tierOf, bandOf, powerText, nextInfo,
  todayStep, applyDecay, achieveToday, destroyObject, unlockedObjects,
} from './lib/domain.js';
import { OBJECTS, CITY_LAYOUT, BANDS } from './data/levels.js';
import { STEPS, VOICE } from './data/copy.js';
import { scopeSVG } from './ui/scope.js';
import { citySVG, cityLede, tallyHTML } from './ui/city.js';
import { calendarHTML, collectionHTML, logListHTML } from './ui/records.js';
import { playDestroySound } from './ui/sound.js';

const $ = s => document.querySelector(s);

/* ============================================================
   保存
   ============================================================ */
function persist() { Storage.save(S, toast); }

/* ============================================================
   画面更新
   ============================================================ */
function render() {
  renderHome();
  renderCity();
  renderRecords();
  renderSettings();
}

function renderHome() {
  const days  = S.streak.currentDays;
  const lv    = Math.max(1, S.disaster.level);
  const tier  = tierOf(lv);
  const band  = bandOf(lv);
  const bandNo = BANDS.indexOf(band) + 1;
  const nx    = nextInfo(days);
  const done  = S.streak.lastAchievedOn === logicalToday();

  document.documentElement.style.setProperty('--band', band.c);

  // 災害レベルスケール
  $('#scale').innerHTML = BANDS_HTML(lv, band, days);
  $('#scaleNow').textContent = days > 0 ? band.label : '未観測';

  // スコープ
  $('#scopeHost').innerHTML = scopeSVG();
  $('#scopeMode').textContent = S.disaster.condition === 'weakened' ? 'WEAK' : 'OBS';
  $('#scopeDate').textContent = logicalToday().replace(/-/g, '.');
  $('#mastMeta').textContent = S.settings.targetQualification
    ? '目標 ' + S.settings.targetQualification : '観測所 —';

  // 読み取り値
  $('#lvNum').textContent   = "";
  $('#lvName').textContent  = days > 0 ? tier.name : '未発生';
  $('#stNum').textContent   = days;
  $('#stSub').textContent   = S.disaster.condition === 'weakened' ? '災害が弱まっています'
    : days > 0 ? '更新中！' : '災害を育てましょう';
  $('#nextTxt').textContent = nx.max ? 'MAX（これ以上は育ちません）'
    : days === 0 ? '最初の1歩で災害レベル1になります' : `あと ${nx.need} 日`;
  $('#nextBar').style.width = (nx.pct * 100) + '%';
  $('#powerTxt').textContent = powerText(days > 0 ? lv : 0);

  // CTA
  const finalReady = S.flags.finalDisasterUnlocked
    || (S.settings.examDate && logicalToday() >= S.settings.examDate && days >= 5);
  const cta = $('#cta');
  if (done) {
    $('#ctaLab').textContent = '災害を起こす';
    $('#ctaSub').textContent = powerText(lv);
    cta.dataset.act = 'city';
  } else if (finalReady) {
    $('#ctaLab').textContent = '試験会場を破壊する！';
    $('#ctaSub').textContent = '最終災害を解放';
    cta.dataset.act = 'final';
  } else {
    $('#ctaLab').textContent = '今日の1歩を踏み出す';
    $('#ctaSub').textContent = todayStep();
    cta.dataset.act = 'achieve';
  }

  // ひとこと
  $('#note').innerHTML = S.settings.remindEnabled ? voiceNow(done) : VOICE.today;
  document.title = done ? 'MY DISASTER — 観測記録' : '🌀 今日の1歩がまだです';
}

/** 気象庁カラースケール風の災害レベルバー */
function BANDS_HTML(lv, band, days) {
  return BANDS.map(b => `<i style="background:${b.c}"
    class="${lv >= b.min ? 'on' : ''} ${b.c === band.c && days > 0 ? 'cur' : ''}"></i>`).join('');
}

function voiceNow(done) {
  if (done) return VOICE.done;
  const last = S.streak.lastAchievedOn;
  if (!last) return VOICE.today;
  const gap = Math.round((new Date(logicalToday()) - new Date(last)) / 86400000);
  if (gap <= 1) return VOICE.today;
  if (gap <= 3) return VOICE.d2;
  return VOICE.d4;
}

function renderCity() {
  $('#cityHost').innerHTML = citySVG();
  $('#cityLede').textContent = cityLede();
  $('#tally').innerHTML = tallyHTML();
}

function renderRecords() {
  $('#rSt').textContent  = S.streak.currentDays;
  $('#rMax').textContent = S.streak.longestDays;
  $('#rTot').textContent = S.logs.length;
  $('#recLede').textContent = S.logs.length
    ? '観測を続けた日には災害が成長しています。'
    : 'まだ記録がありません。最初の1歩から始まります。';

  const cal = calendarHTML();
  $('#calTitle').textContent = cal.title;
  $('#cal').innerHTML = cal.html;
  $('#coll').innerHTML = collectionHTML();
  $('#logList').innerHTML = logListHTML();
}

function renderSettings() {
  $('#fQual').value     = S.settings.targetQualification || '';
  $('#fExam').value     = S.settings.examDate || '';
  $('#fTime').value     = S.settings.remindTime || '20:00';
  $('#fRemind').checked = !!S.settings.remindEnabled;
  $('#devDate').textContent = logicalToday() + (S.dev.offsetDays ? ` (+${S.dev.offsetDays}日)` : '');
}

/* ============================================================
   演出
   ============================================================ */
function reveal(o) {
  const tier = tierOf(o.levelAfter);
  $('#vEyebrow').textContent = o.final ? 'FINAL DISASTER' : o.leveledUp ? 'LEVEL UP' : 'OBSERVED';
  $('#vLv').textContent      = o.final ? '30' : o.levelAfter;
  $('#vName').textContent    = o.final ? '試験会場、消滅' : tier.name;
  $('#vPower').textContent   = o.final
    ? '育てた災害が架空の試験会場を飲み込みました。ここまで続けたのは、あなたです。'
    : o.leveledUp ? powerText(o.levelAfter)
    : `今日の観測を記録しました。連続 ${S.streak.currentDays} 日。`;
  $('#vUnlockWrap').innerHTML = [
    ...(o.unlocked || []).map(u => `<div class="veil-unlock">${u.label} を破壊できるようになりました</div>`),
    o.item ? '<div class="veil-unlock">サボり券を1枚手に入れました</div>' : '',
  ].join('');
  $('#veil').classList.add('on');
}

function toast(text) {
  const el = $('#toast');
  el.textContent = text;
  el.classList.add('on');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('on'), 2200);
}

/* ============================================================
   画面切り替え
   ============================================================ */
function go(name) {
  ['home', 'city', 'rec', 'set'].forEach(n => { $('#s-' + n).hidden = (n !== name); });
  document.querySelectorAll('.nav button').forEach(b =>
    b.setAttribute('aria-current', String(b.dataset.go === name)));
  scrollTo({ top: 0, behavior: 'smooth' });
}

/* ============================================================
   イベント
   ============================================================ */
$('#cta').addEventListener('click', e => {
  const act = e.currentTarget.dataset.act;

  if (act === 'city') { go('city'); return; }

  if (act === 'final') {
    S.flags.finalDisasterUnlocked = true;
    CITY_LAYOUT.forEach(o => destroyObject(o.id));
    persist(); render();
    reveal({ final: true, levelAfter: 30, leveledUp: false, unlocked: [] });
    return;
  }

  const r = achieveToday();
  if (r.already) { toast('今日はもう記録しました'); return; }
  persist(); render(); reveal(r);
});

$('#vClose').addEventListener('click', () => $('#veil').classList.remove('on'));
$('#veil').addEventListener('click', e => {
  if (e.target.id === 'veil') $('#veil').classList.remove('on');
});

$('#scopeHost').addEventListener('click', e => {

  const face = e.target.closest('.face-images');

  if (!face) return;

  const character = face.closest('.tornado-images');

  face.classList.add('is-tapped');
  character.classList.remove('is-bouncing');

  void character.offsetWidth;

  character.classList.add('is-bouncing');

  clearTimeout(face._tapTimer);

  face._tapTimer = setTimeout(() => {
    face.classList.remove('is-tapped');
  }, 800);

  character.addEventListener('animationend', () => {
    character.classList.remove('is-bouncing');
  }, { once:true });

});

document.querySelectorAll('.nav button').forEach(b =>
  b.addEventListener('click', () => go(b.dataset.go)));

/* ---------- 破壊 ---------- */
function destroy(g) {
  const id = g.dataset.id;
  if (g.dataset.locked === '1') {
    const def = OBJECTS.find(o => o.id === id);
    toast(`災害レベル ${def.lv} で ${def.label} を壊せるようになります`);
    return;
  }
  destroyObject(id);
  playDestroySound(id);
  g.classList.add('shake');
  persist();
  setTimeout(renderCity, 380);   // 演出が終わってから描き直す
}

$('#cityHost').addEventListener('click', e => {
  const g = e.target.closest('.obj');
  if (g) destroy(g);
});
$('#cityHost').addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    const g = e.target.closest('.obj');
    if (g) { e.preventDefault(); destroy(g); }
  }
});

/* ---------- 設定 ---------- */
$('#saveSet').addEventListener('click', () => {
  S.settings.targetQualification = $('#fQual').value.trim();
  S.settings.examDate  = $('#fExam').value;
  S.settings.remindTime = $('#fTime').value || '20:00';
  S.settings.remindEnabled = $('#fRemind').checked;
  S.flags.onboardingDone = true;
  persist(); render(); toast('設定を保存しました');
});

$('#doExport').addEventListener('click', () => {
  Storage.exportFile(S, logicalToday());
  toast('記録を書き出しました');
});

$('#doImport').addEventListener('click', () => $('#fileIn').click());

$('#fileIn').addEventListener('change', async e => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    setS(await Storage.importFile(f));
    persist(); render(); toast('記録を戻しました');
  } catch (err) {
    toast('読み込めませんでした。書き出したJSONを選んでください');
  }
  e.target.value = '';
});

/* ---------- 開発用（公開時は削除する） ---------- */
$('#devNext').addEventListener('click', () => {
  S.dev.offsetDays++; applyDecay(); persist(); render(); toast('1日進めました');
});
$('#devSkip').addEventListener('click', () => {
  S.dev.offsetDays += 3; applyDecay(); persist(); render(); toast('3日進めました');
});
$('#devMax').addEventListener('click', () => {
  setS(blank());
  const start = shiftDate(logicalToday(), -29);
  for (let i = 0; i < 30; i++) S.logs.push({ date: shiftDate(start, i), step: STEPS[i % STEPS.length] });
  S.streak.currentDays = 30;
  S.streak.longestDays = 30;
  S.streak.lastAchievedOn = logicalToday();
  S.disaster.level = Math.max(1, levelOf(30));
  S.disaster.exp = 30;
  S.rewards.unlockedObjects = unlockedObjects(S.disaster.level).map(o => o.id);
  S.rewards.items = [{ id: 'skip_a', acquiredAt: logicalToday(), usedAt: null }];
  S.flags.onboardingDone = true;
  if (S.disaster.level >= 30) S.flags.finalDisasterUnlocked = true;
  persist(); render(); go('home'); toast('30日分の記録を作りました');
});
$('#devReset').addEventListener('click', () => {
  if (!confirm('すべての記録を消します。元に戻せません。')) return;
  setS(blank()); persist(); render(); go('home'); toast('記録を消しました');
});

/* ============================================================
   起動
   ============================================================ */
(function boot() {
  const loaded = Storage.load();
  if (loaded) setS(loaded);
  applyDecay();
  persist();
  render();

  // ── 初回チュートリアルの制御 ──
  const tut = $('#tutorialVeil');
  if (!S.flags.onboardingDone) {
    tut.style.opacity = '1';
    tut.style.pointerEvents = 'auto';
  }

  $('#closeTutorial').addEventListener('click', () => {
    tut.style.opacity = '0';
    tut.style.pointerEvents = 'none';
    S.flags.onboardingDone = true;
    persist();
  });
  // -------------------------

  if (!S.flags.onboardingDone && S.logs.length === 0) {
    setTimeout(() => toast('設定から目標の資格を登録できます'), 900);
  }
})();



/* ============================================================
   スマホを振る（シェイク）検知による破壊機能
   ============================================================ */
let lastX = 0, lastY = 0, lastZ = 0;
let lastUpdate = 0;
const SHAKE_THRESHOLD = 3000; // 振る強さの閾値

function handleDeviceMotion(e) {
  const current = e.accelerationIncludingGravity;
  if (!current) return;

  const currentTime = Date.now();
  if ((currentTime - lastUpdate) > 100) {
    const diffTime = currentTime - lastUpdate;
    lastUpdate = currentTime;

    const speed = Math.abs(current.x + current.y + current.z - lastX - lastY - lastZ) / diffTime * 10000;

    if (speed > SHAKE_THRESHOLD) {
      triggerShakeDestroy();
    }

    lastX = current.x;
    lastY = current.y;
    lastZ = current.z;
  }
}

function triggerShakeDestroy() {
  const lv = Math.max(1, S.disaster.level);
  
  // 1. 解放されているオブジェクトを取得し、Lv順（低い順）に並べ替える
  const unlocked = unlockedObjects(lv).sort((a, b) => a.lv - b.lv);
  
  if (unlocked.length === 0) {
    toast('まだ壊せる対象がありません');
    return;
  }

  // 2. 「まだ壊されていない（破壊数が 0 の）」オブジェクトを上から順に探す
  const targetObj = unlocked.find(o => (S.city.destroyed[o.id] || 0) === 0) 
                    || unlocked[0]; // もし全部壊されていれば一番最初のオブジェクトにする
  
  destroyObject(targetObj.id);
  playDestroySound(targetObj.id);

  // スマホに振動をあたえる
  if (navigator.vibrate) {
    navigator.vibrate(120);
  }
  
  const el = document.querySelector(`.obj[data-id="${targetObj.id}"]`);
  if (el) el.classList.add('shake');

  persist();
  renderCity();
  toast(`スマホを振って「${targetObj.label}」を破壊した！`);
}

function requestMotionPermission() {
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission()
      .then(response => {
        if (response === 'granted') {
          window.addEventListener('devicemotion', handleDeviceMotion, false);
          toast('シェイク検知が有効になりました');
        }
      })
      .catch(console.error);
  } else {
    window.addEventListener('devicemotion', handleDeviceMotion, false);
  }
}

// 画面を最初にタップしたときにセンサーの権限を有効化（iOS対策）
window.addEventListener('click', () => {
  if (!window._motionInitialized) {
    requestMotionPermission();
    window._motionInitialized = true;
  }
}, { once: true });