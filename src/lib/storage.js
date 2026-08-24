/* ============================================================
   読み書きの唯一の窓口（仕様書 §12「約束1」）
   他のモジュールから localStorage を直接触らないこと。
   サーバーへ移行するときは、この2つの中身だけを差し替える。
   ============================================================ */

const KEY = 'mydisaster:v1';

let mem = null;      // プライベートブラウジング等でストレージが使えない場合の受け皿
let warned = false;

export const Storage = {
  /** 保存済みの状態を返す。無ければ null */
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return mem;
    }
  },

  /** 状態をまるごと保存する（部分書き込みはしない） */
  save(state, onError) {
    mem = state;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      if (!warned && onError) { onError('この環境では記録を保存できません'); warned = true; }
      return false;
    }
  },

  /** バックアップ用にJSONファイルとして書き出す */
  exportFile(state, dateLabel) {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `my-disaster-${dateLabel}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  },

  /** 書き出したJSONを読み込む。形式が違えば例外を投げる */
  async importFile(file) {
    const parsed = JSON.parse(await file.text());
    if (!parsed.schemaVersion) throw new Error('形式が違います');
    return parsed;
  },
};
