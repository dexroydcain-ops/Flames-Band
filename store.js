// Everything the app knows is kept in one object and saved on the phone
// (IndexedDB), so the app opens and works with no internet.

const DB_NAME = 'flames-band';
const STORE = 'kv';
const KEY = 'state';

export const blank = () => ({
  v: 1,
  me: null,          // { userId, name, kind, instrument, isAdmin }
  band: null,        // { id, name, logo, inviteCode, adminCode, rev }
  members: [],       // [{ userId, name, kind, instrument, isAdmin }]
  playlists: [],     // [{ id, name, gigDate, position, version, songs, dirty, isNew, conflict }]
  notes: {},         // private: { [songId]: { text, hl: {line:1}, ln: {line:'note'} } }
  notesDirty: false,
  remoteRev: 0,
  lastSync: 0,
  prefs: { textSize: 1, wake: true },
});

export const state = blank();

let dbPromise = null;
function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

async function idbGet() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const r = db.transaction(STORE).objectStore(STORE).get(KEY);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

async function idbSet(value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function load() {
  let saved = null;
  try {
    saved = await idbGet();
  } catch (e) {
    // IndexedDB can be unavailable (some private modes). Fall back to localStorage.
    try { saved = JSON.parse(localStorage.getItem('fb-state') || 'null'); } catch { saved = null; }
  }
  if (saved && typeof saved === 'object') {
    const base = blank();
    Object.assign(state, base, saved, { prefs: { ...base.prefs, ...(saved.prefs || {}) } });
  }
  // Ask the phone not to clear our saved lyrics when storage is tight.
  try { navigator.storage?.persist?.(); } catch { /* optional */ }
}

let timer = null;
let writing = Promise.resolve();

export function flush() {
  clearTimeout(timer);
  timer = null;
  const snapshot = JSON.parse(JSON.stringify(state));
  writing = writing.then(() => idbSet(snapshot)).catch(() => {
    try { localStorage.setItem('fb-state', JSON.stringify(snapshot)); } catch { /* storage full */ }
  });
  return writing;
}

// Save soon. Called after every change.
export function save() {
  if (timer) return;
  timer = setTimeout(flush, 250);
}

export async function reset() {
  Object.assign(state, blank());
  await flush();
}
