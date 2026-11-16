// Flames Band: screens and actions.

import { esc, uid, debounce, fmtDate, todayIso, timeAgo, cleanLyrics, norm } from './util.js';
import * as store from './store.js';
import * as api from './api.js';
import * as find from './search.js';

const APP_VERSION = '1.0.0';
const S = store.state;
const $app = document.getElementById('app');
const $modal = document.getElementById('modal');
const $toast = document.getElementById('toast');

const INSTRUMENTS = [['bass', 'Bass'], ['drums', 'Drummer'], ['guitar', 'Guitarist'], ['keys_main', 'Main keys'], ['keys_b1', 'Backup keys 1'], ['keys_b2', 'Backup keys 2']];
const INST = Object.fromEntries(INSTRUMENTS);
const STARTS = [...INSTRUMENTS, ['voice', 'Voice only'], ['all', 'Everyone together']];
const STARTS_L = Object.fromEntries(STARTS);
const KEYS = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B', 'Cm', 'C#m', 'Dm', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'Bbm', 'Bm'];
const PALETTE = [['#F5B83D', '#1A1300'], ['#2F6FD0', '#FFFFFF'], ['#A04E93', '#FFFFFF'], ['#0F766E', '#FFFFFF'], ['#B4532A', '#FFFFFF'], ['#475569', '#FFFFFF'], ['#2E7D32', '#FFFFFF'], ['#C2377A', '#FFFFFF']];
const ART_TINTS = [['#CFE3F5', '#1D4F7A'], ['#D6EBD9', '#1F5C33'], ['#F6DFC8', '#8A3A1C'], ['#E6DAF2', '#55307A'], ['#F3D3D3', '#7A2323'], ['#F4E7B8', '#6B5200']];
const TEXT_SIZES = ['Small', 'Medium', 'Large', 'Extra large'];

const svg = (d, w = 22, sw = 2) => `<svg aria-hidden="true" width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const I = {
  back: svg('<path d="M15 5l-7 7 7 7"/>', 24),
  next: svg('<path d="M9 5l7 7-7 7"/>'),
  chev: svg('<path d="M9 5l7 7-7 7"/>', 18, 2.2),
  gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>', 22, 1.8),
  sync: svg('<path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5"/>', 18, 2.4),
  plus: svg('<path d="M12 5v14M5 12h14"/>', 20, 2.4),
  pen: svg('<path d="M4 20l4-1 11-11-3-3L5 16l-1 4z"/>', 20),
  check: svg('<path d="M5 12l5 5 9-10"/>', 20, 2.6),
  up: svg('<path d="M6 15l6-6 6 6"/>', 20, 2.4),
  down: svg('<path d="M6 9l6 6 6-6"/>', 20, 2.4),
  x: svg('<path d="M6 6l12 12M18 6L6 18"/>', 20, 2.4),
  share: svg('<path d="M12 15V4M7 9l5-5 5 5M5 15v4h14v-4"/>', 20, 2.2),
  search: svg('<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>', 18, 2.2),
  mark: svg('<path d="M9 14l-3 3 2 2 3-3M9 14l7-9 4 3-8 9M4 21h8"/>'),
  note: svg('<path d="M4 5h16v11H9l-5 4V5z"/>'),
  size: svg('<path d="M3 19l5-13 5 13M5 14h6M15 19l3-8 3 8M16 16h4"/>'),
  dots: svg('<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>'),
};
const FLAME = (w, cls = '') => `<svg class="${cls}" width="${w}" height="${Math.round(w * 1.25)}" viewBox="0 0 120 150" role="img" aria-label="Flames Band logo"><path d="M60 6 C66 34 100 52 100 92 C100 122 82 144 60 144 C38 144 20 122 20 92 C20 72 30 60 38 48 C40 62 46 68 52 68 C50 46 52 26 60 6 Z" fill="#D8401F"/><path class="inner" d="M60 78 C64 92 78 98 78 114 C78 128 70 136 60 136 C50 136 42 128 42 114 C42 102 54 94 60 78 Z" fill="#F5B83D"/></svg>`;

// ---------------------------------------------------------------- helpers

const playlist = (id) => S.playlists.find((p) => p.id === id);
const songIn = (p, sid) => p?.songs.find((s) => s.id === sid);
const member = (id) => S.members.find((m) => m.userId === id);
const isAdmin = () => !!S.me?.isAdmin;
const online = () => navigator.onLine !== false;
const standalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const roleLabel = (m) => (m.kind === 'singer' ? 'Singer' : INST[m.instrument] || 'Musician');
const bandName = () => S.band?.name || 'Flames Band';
const hasUpdate = () => !!S.band && S.remoteRev > S.band.rev;

function colorOf(id) {
  const i = Math.max(0, S.members.findIndex((m) => m.userId === id));
  return PALETTE[i % PALETTE.length];
}
function tint(hex) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c) => Math.round(255 - (255 - c) * 0.18);
  return `rgb(${mix(n >> 16)},${mix((n >> 8) & 255)},${mix(n & 255)})`;
}
const whoName = (id) => (id === 'all' ? 'All' : member(id)?.name || 'Former member');
function chip(id, label) {
  if (id === 'all') return `<span class="chip all">${esc(label || 'All')}</span>`;
  const [bg, fg] = colorOf(id);
  return `<span class="chip" style="background:${bg};color:${fg}">${esc(label || whoName(id))}</span>`;
}
function art(song, lg) {
  const title = (song.title || '?').trim();
  const h = [...title].reduce((a, c) => a + c.charCodeAt(0), 0);
  const [bg, fg] = ART_TINTS[h % ART_TINTS.length];
  const img = /^https:\/\//.test(song.art || '') ? `<img src="${esc(song.art)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : '';
  return `<span class="art${lg ? ' lg' : ''}" style="background:${bg};color:${fg}" aria-hidden="true">${esc(title.charAt(0).toUpperCase() || '?')}${img}</span>`;
}
function logo(size, ring) {
  const custom = S.band?.logo && /^data:image\//.test(S.band.logo);
  if (custom) return `<span class="logo ring" style="width:${size}px;height:${size}px"><img src="${esc(S.band.logo)}" alt="${esc(bandName())} logo"></span>`;
  if (ring) return `<span class="logo ring" style="width:${size}px;height:${size}px">${FLAME(Math.round(size * 0.45))}</span>`;
  return `<span class="logo">${FLAME(Math.round(size * 0.8))}</span>`;
}
const artistLine = (s) => [s.artist, s.year].filter(Boolean).join(' · ');
const noteOf = (sid) => S.notes[sid] || (S.notes[sid] = { text: '', hl: {}, ln: {} });
const peekNote = (sid) => S.notes[sid] || { text: '', hl: {}, ln: {} };

function fixSong(s) {
  return {
    id: s.id || uid(), title: s.title || '', artist: s.artist || '', album: s.album || '', year: s.year || '', art: s.art || '',
    key: s.key || '', singers: Array.isArray(s.singers) ? s.singers : [], starts: s.starts || '',
    lyrics: s.lyrics || '', lyricsSource: s.lyricsSource || '',
    assign: s.assign && typeof s.assign === 'object' ? s.assign : {}, cues: s.cues && typeof s.cues === 'object' ? s.cues : {},
  };
}
const mapMember = (m) => ({ userId: m.user_id, name: m.name, kind: m.kind, instrument: m.instrument, isAdmin: m.is_admin });
const mapPlaylist = (p) => ({
  id: p.id, name: p.name, gigDate: p.gig_date || '', position: p.position || 0, version: p.version,
  songs: (p.data?.songs || []).map(fixSong), dirty: false, isNew: false, conflict: false,
});

function sortedPlaylists() {
  const today = todayIso();
  const rank = (p) => (p.gigDate && p.gigDate >= today ? 0 : p.gigDate ? 2 : 1);
  return [...S.playlists].sort((a, b) => {
    const ra = rank(a), rb = rank(b);
    if (ra !== rb) return ra - rb;
    if (ra === 0) return a.gigDate.localeCompare(b.gigDate);
    if (ra === 2) return b.gigDate.localeCompare(a.gigDate);
    return a.name.localeCompare(b.name);
  });
}

// ---------------------------------------------------------------- toast + modal

let toastTimer = null;
function toast(msg, kind = '') {
  clearTimeout(toastTimer);
  $toast.innerHTML = `<div class="${kind}" role="status">${esc(msg)}</div>`;
  toastTimer = setTimeout(() => { $toast.innerHTML = ''; }, kind === 'bad' ? 5000 : 2600);
}

let modalResolve = null;
function openModal(html, top) {
  $modal.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
  $modal.style.alignItems = top ? 'flex-start' : 'flex-end';
  $modal.firstElementChild.style.borderRadius = top ? '0 0 18px 18px' : '';
  $modal.firstElementChild.style.paddingTop = top ? 'calc(var(--sat) + 18px)' : '';
  $modal.classList.add('show');
  const f = $modal.querySelector('[data-mfocus]');
  if (f) setTimeout(() => { f.focus(); if (f.setSelectionRange && f.tagName === 'INPUT') f.setSelectionRange(f.value.length, f.value.length); }, 30);
  return new Promise((r) => { modalResolve = r; });
}
function closeModal(v = null) {
  if (!$modal.classList.contains('show')) return;
  $modal.classList.remove('show');
  $modal.innerHTML = '';
  const r = modalResolve;
  modalResolve = null;
  if (r) r(v);
}
function ask({ title, label = '', value = '', multiline = false, placeholder = '', ok = 'Save', hint = '', maxlength = 4000 }) {
  const field = multiline
    ? `<textarea class="inp" data-mfocus data-mval placeholder="${esc(placeholder)}" maxlength="${maxlength}">${esc(value)}</textarea>`
    : `<input class="inp" data-mfocus data-mval value="${esc(value)}" placeholder="${esc(placeholder)}" maxlength="${maxlength}" autocomplete="off">`;
  return openModal(`<h2>${esc(title)}</h2><form data-mform class="field" style="gap:10px">${label ? `<label class="lbl" style="margin:0">${esc(label)}</label>` : ''}${field}${hint ? `<p class="hint">${esc(hint)}</p>` : ''}
    <div class="acts"><button type="button" class="btn sec" data-m="cancel">Cancel</button><button type="submit" class="btn pri">${esc(ok)}</button></div></form>`, true);
}
function confirmBox({ title, text = '', ok = 'OK', danger = false }) {
  return openModal(`<h2>${esc(title)}</h2>${text ? `<p class="hint" style="font-size:15px">${esc(text)}</p>` : ''}
    <div class="acts"><button class="btn sec" data-m="cancel">Cancel</button><button class="btn ${danger ? 'dark' : 'pri'}" data-m="opt" data-v="yes">${esc(ok)}</button></div>`).then((v) => v === 'yes');
}
function choose({ title, text = '', options }) {
  return openModal(`<h2>${esc(title)}</h2>${text ? `<p class="hint" style="font-size:15px">${esc(text)}</p>` : ''}
    <div class="acts one">${options.map((o) => `<button class="btn ${o.cls || 'sec'}" data-m="opt" data-v="${esc(o.v)}">${esc(o.label)}</button>`).join('')}<button class="btn sec" data-m="cancel">Cancel</button></div>`);
}
function info({ title, html }) {
  return openModal(`<h2>${esc(title)}</h2>${html}<div class="acts one"><button class="btn pri" data-m="cancel">OK</button></div>`);
}

$modal.addEventListener('click', (e) => {
  if (e.target === $modal) return closeModal(null);
  const b = e.target.closest('[data-m]');
  if (!b) return;
  if (b.dataset.m === 'cancel') closeModal(null);
  else if (b.dataset.m === 'opt') closeModal(b.dataset.v);
});
$modal.addEventListener('submit', (e) => {
  e.preventDefault();
  const el = $modal.querySelector('[data-mval]');
  closeModal(el ? el.value : '');
});

// ---------------------------------------------------------------- sync

function applyState(st) {
  S.band = { id: st.band.id, name: st.band.name, logo: st.band.logo || '', inviteCode: st.band.invite_code, adminCode: st.band.admin_code || '', rev: st.band.rev };
  S.me = mapMember(st.me);
  S.members = (st.members || []).map(mapMember);
  const local = new Map(S.playlists.map((p) => [p.id, p]));
  const next = [];
  for (const sp of st.playlists || []) {
    const mine = local.get(sp.id);
    local.delete(sp.id);
    if (mine && mine.dirty && S.me.isAdmin) {
      mine.conflict = !mine.isNew && sp.version !== mine.version;
      mine.isNew = false;
      if (!mine.conflict) mine.version = sp.version;
      next.push(mine);
    } else {
      next.push(mapPlaylist(sp));
    }
  }
  for (const mine of local.values()) {
    // Not on the server: keep only an admin's unsent work.
    if (mine.dirty && S.me.isAdmin) { mine.isNew = true; mine.version = 0; mine.conflict = false; next.push(mine); }
  }
  S.playlists = next;
  if (!S.notesDirty && st.notes?.data && typeof st.notes.data === 'object') S.notes = st.notes.data;
  S.remoteRev = S.band.rev;
  S.lastSync = Date.now();
  store.save();
}

function wrote(r) {
  if (!S.band || r?.rev == null) return;
  if (r.rev === S.band.rev + 1) S.band.rev = r.rev;
  S.remoteRev = Math.max(S.remoteRev, r.rev);
  store.save();
}

async function pushNotes() {
  if (!S.band || !S.notesDirty) return;
  const sent = JSON.stringify(S.notes);
  await api.call('save_notes', { p_band: S.band.id, p_data: S.notes });
  if (JSON.stringify(S.notes) === sent) { S.notesDirty = false; store.save(); }
}
const queueNotes = debounce(() => { if (online()) pushNotes().catch(() => {}); }, 2500);
function notesChanged() {
  S.notesDirty = true;
  store.save();
  queueNotes();
}

function prefetchArt() {
  if (!online()) return;
  const seen = new Set();
  for (const p of S.playlists) for (const s of p.songs) {
    if (/^https:\/\//.test(s.art) && !seen.has(s.art)) { seen.add(s.art); const im = new Image(); im.referrerPolicy = 'no-referrer'; im.src = s.art; }
  }
}

async function sync() {
  const st = await api.call('get_state', { p_band: S.band.id });
  applyState(st);
  if (S.notesDirty) await pushNotes().catch(() => {});
  prefetchArt();
}

async function checkRemote() {
  if (!S.band || !online() || document.visibilityState !== 'visible') return;
  try {
    const r = await api.call('check', { p_band: S.band.id });
    if (r.rev !== S.remoteRev) { S.remoteRev = r.rev; store.save(); softRender(); }
  } catch (e) {
    if (e.code === 'not_member') kicked();
  }
}

async function kicked() {
  const prefs = S.prefs;
  await store.reset();
  S.prefs = prefs;
  store.save();
  nav('welcome', {}, true);
  toast('This phone is no longer in the band. Join again with the invite code.', 'bad');
}

let busy = false;
async function run(fn) {
  if (busy) return;
  busy = true;
  try {
    return await fn();
  } catch (e) {
    if (e?.code === 'not_member' && S.band) await kicked();
    else toast(e?.message || 'Something went wrong. Please try again.', 'bad');
  } finally {
    busy = false;
  }
}

// ---------------------------------------------------------------- router

let route = { name: 'boot', p: {} };
let F = {};                                   // join / profile form
let Q = { term: '', status: 'idle', results: [] };          // add-song search
let LF = { songId: '', status: 'idle', results: [], open: 0, rejected: {} }; // lyrics search
let SEL = null;                               // parts selection { a, b }
let MODE = '';                                // song screen: '' | 'hl' | 'note'

function nav(name, p = {}, replace = false) {
  route = { name, p };
  const st = { name, p, d: replace ? history.state?.d || 0 : (history.state?.d || 0) + 1 };
  if (replace) history.replaceState(st, ''); else history.pushState(st, '');
  render(true);
}
function back() {
  if ((history.state?.d || 0) > 0) history.back();
  else nav(S.band ? 'playlists' : 'welcome', {}, true);
}
window.addEventListener('popstate', (e) => {
  closeModal(null);
  route = e.state?.name ? { name: e.state.name, p: e.state.p || {} } : { name: S.band ? 'playlists' : 'welcome', p: {} };
  render(true);
});

function render(reset) {
  const old = $app.querySelector('.scroll');
  const top = old ? old.scrollTop : 0;
  let html;
  try {
    html = view();
  } catch (e) {
    console.error(e);
    html = `<div class="pg center"><p>Something went wrong on this screen.</p><button class="btn pri" data-act="home">Back to playlists</button></div>`;
  }
  $app.innerHTML = html;
  const sc = $app.querySelector('.scroll');
  if (sc && !reset) sc.scrollTop = top;
  if (reset) { const f = $app.querySelector('[data-focus]'); if (f) setTimeout(() => f.focus(), 60); }
  updateWake();
}
// Re-draw after background work, but never while someone is typing.
function softRender() {
  const a = document.activeElement;
  if (a && $app.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
  if ($modal.classList.contains('show')) return;
  render(false);
}

function view() {
  if (!api.configured()) return vConfig();
  if (!S.band) return route.name === 'join' ? vJoin() : vWelcome();
  const p = route.p.pl ? playlist(route.p.pl) : null;
  const s = p && route.p.song ? songIn(p, route.p.song) : null;
  const adminOnly = ['addSong', 'songEdit', 'lyricsFind', 'parts'];
  if (adminOnly.includes(route.name) && !isAdmin()) return vPlaylists();
  switch (route.name) {
    case 'playlist': return p ? vPlaylist(p) : vPlaylists();
    case 'song': return s ? vSong(p, s) : p ? vPlaylist(p) : vPlaylists();
    case 'addSong': return p ? vAddSong(p) : vPlaylists();
    case 'songEdit': return s ? vSongEdit(p, s) : vPlaylists();
    case 'lyricsFind': return s ? vLyricsFind(p, s) : vPlaylists();
    case 'parts': return s ? vParts(p, s) : vPlaylists();
    case 'settings': return vSettings();
    case 'members': return vMembers();
    case 'join': return vJoin();
    default: return vPlaylists();
  }
}

function header({ title = '', sub = '', showBack = true, right = '' }) {
  return `<header class="hd${showBack ? '' : ' pad'}">${showBack ? `<button class="ib" data-act="back" aria-label="Back">${I.back}</button>` : ''}
    <div class="hd-t"><h1>${esc(title)}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}</div>${right}</header>`;
}
const offlinePill = () => (online() ? '' : '<span class="pill off">Offline</span>');

// ---------------------------------------------------------------- screens: getting in

function vConfig() {
  return `<div class="pg center">${FLAME(64)}<div class="word">Flames Band</div>
    <div class="stack"><p><b>One more setup step.</b></p>
    <p class="hint" style="font-size:15px">The app is not connected to its online database yet. Open the file <b>config.js</b> and paste in your Supabase URL and publishable key, then upload the app again. The setup guide walks through it.</p></div></div>`;
}

function installBox(code) {
  if (standalone()) return '';
  if (isIOS()) {
    return `<div class="box plain" style="text-align:left"><b>On iPhone, install the app first</b>
      <p class="hint">1. In Safari tap the Share button, then <b>Add to Home Screen</b>.<br>2. Open Flames Band from your home screen.<br>3. Tap <b>Join with an invite code</b>${code ? ` and enter <b>${esc(code)}</b>` : ''}.</p>
      <p class="hint">Joining here in Safari works too, but the home screen app keeps its own separate sign-in.</p></div>`;
  }
  if (deferredInstall) return `<button class="btn sec wide" data-act="installApp">Install the app on this phone</button>`;
  return '';
}

function vWelcome() {
  return `<div class="pg center">${FLAME(76)}<div class="word">Flames Band</div>
    <p class="hint" style="font-size:15px">Setlists and lyrics, ready for the gig.</p>
    <div class="stack">
      <button class="btn pri wide" data-act="goJoin">Join with an invite code</button>
      <button class="btn sec wide" data-act="goCreate">Start a new band (admin)</button>
      ${installBox('')}
    </div></div>`;
}

function vJoin() {
  const mode = F.mode || 'join';
  const titles = { join: 'Join the band', create: 'Start your band', me: 'My name and role' };
  const subs = { join: 'Enter the code your admin sent, then tell the band who you are.', create: 'You will be the first admin. You can make others admins later.', me: 'Change how you appear to the band.' };
  const btn = { join: 'Join', create: 'Create the band', me: 'Save' }[mode];
  const who = F.name?.trim() ? ` as ${F.name.trim()}` : '';
  const roleTxt = F.kind === 'singer' ? ' · Singer' : F.kind === 'musician' && F.instrument ? ` · ${INST[F.instrument]}` : '';
  return `<div class="pg">${header({ title: titles[mode], showBack: true })}
    <main class="scroll"><form data-form="join" style="display:flex;flex-direction:column;gap:16px">
      <p class="hint" style="font-size:15px">${subs[mode]}</p>
      ${mode === 'join' ? `<div class="field"><label class="lbl" for="f-code">Invite code</label><input id="f-code" class="inp" data-in="form" data-f="code" value="${esc(F.code || '')}" placeholder="6 letters and numbers" autocapitalize="characters" autocomplete="off" autocorrect="off" spellcheck="false" maxlength="12" style="font-family:var(--disp);font-size:22px;font-weight:700;letter-spacing:.14em;text-transform:uppercase"></div>` : ''}
      ${mode === 'create' ? `<div class="field"><label class="lbl" for="f-band">Band name</label><input id="f-band" class="inp" data-in="form" data-f="bandName" value="${esc(F.bandName ?? 'Flames Band')}" maxlength="60"></div>` : ''}
      <div class="field"><label class="lbl" for="f-name">Your name</label><input id="f-name" class="inp" data-in="form" data-f="name" value="${esc(F.name || '')}" placeholder="First name" autocomplete="given-name" maxlength="40"></div>
      <div class="field"><span class="lbl">I am a</span><div class="grid2">
        <button type="button" class="opt${F.kind === 'singer' ? ' on' : ''}" data-act="setKind" data-v="singer" aria-pressed="${F.kind === 'singer'}">Singer</button>
        <button type="button" class="opt${F.kind === 'musician' ? ' on' : ''}" data-act="setKind" data-v="musician" aria-pressed="${F.kind === 'musician'}">Musician</button></div></div>
      ${F.kind === 'musician' ? `<div class="field"><span class="lbl">What do you play?</span><div class="grid2">${INSTRUMENTS.map(([v, l]) => `<button type="button" class="opt${F.instrument === v ? ' on' : ''}" data-act="setInst" data-v="${v}" aria-pressed="${F.instrument === v}">${l}</button>`).join('')}</div></div>` : ''}
      ${F.err ? `<p class="err" role="alert">${esc(F.err)}</p>` : ''}
      ${mode === 'join' ? installBox(F.code || '') : ''}
    </form></main>
    <footer class="ft"><button class="btn pri wide" data-act="submitJoin"${F.busy ? ' disabled' : ''}>${F.busy ? 'Please wait…' : esc(btn + (mode === 'me' ? '' : who + roleTxt))}</button></footer></div>`;
}

// ---------------------------------------------------------------- screens: playlists

function updateBanner() {
  if (!hasUpdate()) return '';
  return `<div class="banner" role="status"><div><b>New update available</b><span>Tap Sync to get the latest from your admin.</span></div>
    <button class="btn pri sm" data-act="syncNow">${I.sync}Sync</button></div>`;
}

function vPlaylists() {
  const list = sortedPlaylists();
  const today = todayIso();
  let nextMarked = false;
  const cards = list.map((p) => {
    const isNext = !nextMarked && p.gigDate && p.gigDate >= today;
    if (isNext) nextMarked = true;
    const noLyrics = p.songs.filter((s) => !s.lyrics).length;
    let st = `<span class="st ok">Saved on this phone</span>`;
    if (p.dirty && isAdmin()) st = `<span class="st" style="color:var(--fire-ink)">${p.isNew ? 'Not shared with the band yet' : 'Changes not sent to the band yet'}</span>`;
    else if (noLyrics && isAdmin()) st = `<span class="st" style="color:var(--fire-ink)">${noLyrics} song${noLyrics > 1 ? 's' : ''} without lyrics</span>`;
    return `<button class="card${isNext ? ' next' : ''}" data-act="openPlaylist" data-id="${p.id}"><div><b>${esc(p.name)}</b>
      <span class="meta">${p.songs.length} song${p.songs.length === 1 ? '' : 's'}${p.gigDate ? ' · ' + esc(fmtDate(p.gigDate)) : ''}${isNext ? ' · next gig' : ''}</span>${st}</div>${I.chev}</button>`;
  }).join('');
  const empty = `<div class="empty"><p>${isAdmin() ? 'No playlists yet. Make the first one for your next gig.' : 'No playlists yet. Your admin has not shared one. Tap Sync to check again.'}</p></div>`;
  return `<div class="pg"><header class="hd pad">${logo(34)}<div class="hd-t"><h1>${esc(bandName())}</h1><div class="sub">${esc(S.me.name)} · ${esc(roleLabel(S.me))}${isAdmin() ? ' · Admin' : ''}</div></div>${offlinePill()}
      <button class="ib box" data-act="openSettings" aria-label="Settings">${I.gear}</button></header>
    <main class="scroll">
      ${updateBanner()}
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><div class="big" style="font-size:26px">Choose a playlist</div>
        <button class="btn sec sm" data-act="syncNow">${I.sync}Sync</button></div>
      <p class="hint">Last synced ${esc(timeAgo(S.lastSync))}. Everything below works without internet.</p>
      ${cards || empty}
    </main>
    ${isAdmin() ? `<footer class="ft"><button class="btn pri wide" data-act="newPlaylist">${I.plus}New playlist</button></footer>` : ''}</div>`;
}

function songRow(p, s, i, edit) {
  const me = S.me.userId;
  const [bg, fg] = colorOf(me);
  const everyone = s.singers.includes('all');
  const lead = s.singers.includes(me);
  const hasLines = Object.values(s.assign).includes(me);
  const startsMe = S.me.kind === 'musician' && s.starts && s.starts === S.me.instrument;
  const others = s.singers.filter((x) => x !== me && x !== 'all').map(whoName);
  const t3 = [];
  if (lead) t3.push(`<span class="chip" style="background:${bg};color:${fg}">YOU LEAD</span>`);
  else if (hasLines) t3.push(`<span class="chip" style="background:${bg};color:${fg}">YOU HAVE LINES</span>`);
  if (everyone) t3.push('<span>Everyone sings</span>');
  if (others.length) t3.push(`<span>${lead ? 'With' : 'Lead'}: ${esc(others.join(', '))}</span>`);
  if (s.starts) t3.push(startsMe ? '<span class="warn">YOU START</span>' : `<span>Starts: ${esc(STARTS_L[s.starts] || s.starts)}</span>`);
  if (isAdmin() && !s.lyrics) t3.push('<span class="warn">No lyrics yet</span>');
  if (isAdmin() && !s.singers.length) t3.push('<span class="warn">No singer set</span>');
  const note = peekNote(s.id).text;
  const mine = lead || hasLines || startsMe;
  const style = mine ? ` style="--mine:${bg};--mine-tint:${tint(bg)}"` : '';
  const main = `<button class="rowmain" data-act="${edit ? 'editSong' : 'openSong'}" data-id="${s.id}">${art(s)}
      <span class="tx"><span class="t1">${i + 1} · ${esc(s.title)}</span>${artistLine(s) ? `<span class="t2">${esc(artistLine(s))}</span>` : ''}
      ${t3.length ? `<span class="t3">${t3.join('')}</span>` : ''}${note && !edit ? `<span class="t4"><b>My note:</b> ${esc(note)}</span>` : ''}</span>
      ${edit ? '' : s.key ? `<span class="key">${esc(s.key)}</span>` : '<span class="key none">no key</span>'}</button>`;
  const tools = edit ? `<span class="edit-tools">
      <button class="ib" data-act="moveUp" data-id="${s.id}" aria-label="Move ${esc(s.title)} up"${i === 0 ? ' disabled' : ''}>${I.up}</button>
      <button class="ib" data-act="moveDown" data-id="${s.id}" aria-label="Move ${esc(s.title)} down"${i === p.songs.length - 1 ? ' disabled' : ''}>${I.down}</button>
      <button class="ib" data-act="removeSong" data-id="${s.id}" aria-label="Remove ${esc(s.title)}">${I.x}</button></span>` : '';
  return `<div class="row${mine && !edit ? ' mine' : ''}" data-q="${esc(norm(s.title + ' ' + s.artist))}"${style}>${main}${tools}</div>`;
}

function vPlaylist(p) {
  const edit = !!route.p.edit && isAdmin();
  const rows = p.songs.map((s, i) => songRow(p, s, i, edit)).join('');
  const sub = `${p.songs.length} song${p.songs.length === 1 ? '' : 's'}${p.gigDate ? ' · ' + esc(fmtDate(p.gigDate)) : ''}`;
  const right = `${offlinePill()}${isAdmin() ? `<button class="ib box${edit ? ' on' : ''}" data-act="toggleEdit" aria-label="${edit ? 'Finish editing' : 'Edit playlist'}" aria-pressed="${edit}">${edit ? I.check : I.pen}</button>` : ''}`;
  let body;
  if (edit) {
    body = `<div class="field"><label class="lbl" for="pl-name">Playlist name</label><input id="pl-name" class="inp" data-in="plName" value="${esc(p.name)}" maxlength="80"></div>
      <div class="field"><label class="lbl" for="pl-date">Gig date (optional)</label><input id="pl-date" type="date" class="inp" data-in="plDate" value="${esc(p.gigDate)}"></div>
      <button class="btn pri wide" data-act="addSong">${I.plus}Add a song</button>
      ${rows || '<p class="hint">No songs yet. Add the first one.</p>'}
      <p class="hint">Tap a song to set its singer, key, lyrics and parts. Use the arrows to change the order.</p>
      <button class="link bad" data-act="deletePlaylist">Delete this playlist</button>`;
  } else {
    body = `${updateBanner()}
      ${p.conflict && isAdmin() ? `<div class="banner"><div><b>Another admin also changed this</b><span>You will be asked which version to keep when you send.</span></div></div>` : ''}
      ${p.songs.length > 4 ? `<label class="field"><span class="lbl" style="position:absolute;left:-9999px">Search this playlist</span><input class="inp" type="search" data-in="filter" placeholder="Search song or artist" autocomplete="off"></label>` : ''}
      ${rows || `<div class="empty"><p>${isAdmin() ? 'This playlist has no songs yet.' : 'No songs in this playlist yet.'}</p>${isAdmin() ? `<button class="btn pri" data-act="toggleEdit">${I.plus}Add songs</button>` : ''}</div>`}
      <p class="hint" id="nomatch" hidden>No song matches that search.</p>
      ${p.songs.length ? `<p class="hint ok">All ${p.songs.length} song${p.songs.length === 1 ? '' : 's'} saved on this phone. Works without internet.</p>` : ''}`;
  }
  const foot = isAdmin() && p.dirty ? `<footer class="ft"><p class="hint" style="text-align:center">${p.isNew ? 'Only you can see this playlist so far.' : 'You changed this playlist. The band still has the old version.'}</p>
      <button class="btn pri wide" data-act="sendUpdate">${I.share}${p.isNew ? 'Share with the band' : 'Send update to the band'}</button></footer>` : '';
  return `<div class="pg">${header({ title: p.name, sub, right })}<main class="scroll">${body}</main>${foot}</div>`;
}

// ---------------------------------------------------------------- screens: lyrics

function lyricBlocks(s, opt = {}) {
  const me = S.me.userId;
  const iSing = S.me.kind === 'singer' || s.singers.includes(me) || Object.values(s.assign).includes(me);
  const anyAssigned = Object.keys(s.assign).length > 0;
  const my = peekNote(s.id);
  const lines = s.lyrics.split('\n');
  const blocks = [];
  let cur = null;
  lines.forEach((text, i) => {
    if (!text.trim()) { cur = null; return; }
    const who = s.assign[i] || '';
    if (!cur || cur.who !== who) { cur = { who, idx: [] }; blocks.push(cur); }
    cur.idx.push(i);
  });
  const selA = opt.sel ? Math.min(opt.sel.a, opt.sel.b) : -1;
  const selB = opt.sel ? Math.max(opt.sel.a, opt.sel.b) : -1;
  return blocks.map((b) => {
    const isMe = !opt.parts && (b.who === me || (b.who === 'all' && iSing));
    const dim = !opt.parts && anyAssigned && iSing && b.who && !isMe;
    const col = b.who && b.who !== 'all' ? colorOf(b.who)[0] : '#17181C';
    const cls = ['blk', b.who ? 'has' : '', isMe ? 'me' : '', dim ? 'dim' : ''].filter(Boolean).join(' ');
    const style = b.who ? ` style="--tint:${b.who === 'all' ? '#F4F4F2' : tint(col)};--who:${col}"` : '';
    const head = b.who ? `<div class="blk-h">${!opt.parts && b.who === me ? chip(me, 'YOU') : chip(b.who)}</div>` : '';
    const body = b.idx.map((i) => {
      const cue = s.cues[i] ? `<div class="cue">${esc(s.cues[i])}</div>` : '';
      const sel = i >= selA && i <= selB ? ' sel' : '';
      const hl = !opt.parts && my.hl?.[i] ? ' hl' : '';
      const ln = !opt.parts && my.ln?.[i] ? `<button class="mynote" data-act="lineNote" data-i="${i}">${I.pen}<span><b>My note:</b> ${esc(my.ln[i])}</span></button>` : '';
      return `${cue}<button class="ln${sel}${hl}" data-act="${opt.parts ? 'partLine' : 'line'}" data-i="${i}"><span>${esc(lines[i])}</span></button>${ln}`;
    }).join('');
    return `<div class="${cls}"${style}>${head}${body}</div>`;
  }).join('');
}

function vSong(p, s) {
  const i = p.songs.indexOf(s);
  const leads = s.singers.includes('all') ? 'Everyone' : s.singers.map(whoName).join(', ');
  const sub = [s.artist, leads ? 'Lead: ' + leads : '', `${i + 1} of ${p.songs.length}`].filter(Boolean).map(esc).join(' · ');
  const my = peekNote(s.id);
  const startsMe = S.me.kind === 'musician' && s.starts && s.starts === S.me.instrument;
  const right = `${isAdmin() ? `<button class="ib box" data-act="editSong" data-id="${s.id}" aria-label="Edit song">${I.pen}</button>` : ''}
    <div class="keybox"><small>KEY</small><b>${esc(s.key || '–')}</b></div>`;
  const modeBar = MODE === 'hl' ? '<div class="modebar">Highlight is on. Tap a line to mark or unmark it.</div>'
    : MODE === 'note' ? '<div class="modebar">Note is on. Tap a line to write a note on it.</div>' : '';
  const lyrics = s.lyrics
    ? `<div class="lyr ts${S.prefs.textSize}">${lyricBlocks(s)}</div>`
    : `<div class="empty"><p>No lyrics saved for this song yet.</p>${isAdmin() ? `<button class="btn pri" data-act="findLyrics" data-id="${s.id}">${I.search}Find lyrics</button>` : ''}</div>`;
  return `<div class="pg"><header class="hd"><button class="ib" data-act="back" aria-label="Back to playlist">${I.back}</button>${art(s)}
      <div class="hd-t"><h1>${esc(s.title)}</h1><div class="sub">${sub}</div></div>${right}</header>
    <main class="scroll" style="gap:8px">${modeBar}
      ${s.starts ? `<p class="hint" style="font-size:14px">${startsMe ? '<b class="warn" style="color:var(--fire-ink)">YOU START this song</b>' : `Starts: <b style="color:var(--ink)">${esc(STARTS_L[s.starts] || s.starts)}</b>`}</p>` : ''}
      <button class="mynote song" data-act="songNote">${I.pen}<span>${my.text ? `<b>My note:</b> ${esc(my.text)}` : 'Add my own note for this song'}</span></button>
      ${lyrics}</main>
    <nav class="tool" aria-label="Song tools">
      <button data-act="prevSong"${i === 0 ? ' disabled' : ''}>${I.back}Previous</button>
      <button data-act="mode" data-v="hl" class="${MODE === 'hl' ? 'on' : ''}" aria-pressed="${MODE === 'hl'}">${I.mark}Highlight</button>
      <button data-act="mode" data-v="note" class="${MODE === 'note' ? 'on' : ''}" aria-pressed="${MODE === 'note'}">${I.note}Note</button>
      <button data-act="textSize">${I.size}Text size</button>
      <button data-act="nextSong" class="go"${i === p.songs.length - 1 ? ' disabled' : ''}>${I.next}Next song</button></nav></div>`;
}

// ---------------------------------------------------------------- screens: admin editing

function vAddSong(p) {
  return `<div class="pg">${header({ title: 'Add a song', sub: esc(p.name) })}
    <main class="scroll">
      <div class="field"><label class="lbl" for="q">Search for a song</label><input id="q" class="inp" type="search" data-in="songSearch" data-focus value="${esc(Q.term)}" placeholder="Song title, or title and artist" autocomplete="off"></div>
      <div id="results" style="display:flex;flex-direction:column;gap:8px">${searchResultsHtml(p)}</div>
    </main></div>`;
}
function searchResultsHtml(p) {
  const term = Q.term.trim();
  if (term.length < 2) return '<p class="hint">Type a song name. The app searches the internet and shows who each version is by, so you can pick the right one.</p>';
  const manual = `<button class="btn sec wide" data-act="addManual">${I.plus}Add “${esc(term)}” without picking a result</button>`;
  if (Q.status === 'loading') return `<div class="empty"><div class="spin"></div><p>Searching the internet…</p></div>${manual}`;
  if (Q.status === 'error') return `<p class="err">Could not search right now. Check your internet, or add the song yourself.</p>${manual}`;
  if (!Q.results.length) return `<p class="hint">No songs found for that. Check the spelling, or add it yourself.</p>${manual}`;
  const rows = Q.results.map((r, i) => {
    const have = p.songs.some((s) => norm(s.title) === norm(r.title) && norm(s.artist) === norm(r.artist));
    return `<div class="row"><button class="rowmain" data-act="pickResult" data-i="${i}">${art(r)}
      <span class="tx"><span class="t1" style="white-space:normal">${esc(r.title)}</span><span class="t2">${esc([r.artist, r.year].filter(Boolean).join(' · '))}</span>${r.album ? `<span class="t2">${esc(r.album)}</span>` : ''}</span>
      <span class="btn ${have ? 'sec' : 'pri'} sm">${have ? 'Added' : 'Add'}</span></button></div>`;
  }).join('');
  return `<p class="hint"><b style="color:var(--ink)">${Q.results.length} found.</b> Pick the right one.</p>${rows}${manual}`;
}

function vSongEdit(p, s) {
  const lineCount = s.lyrics ? s.lyrics.split('\n').filter((l) => l.trim()).length : 0;
  const assigned = Object.keys(s.assign).length;
  const picks = S.members.map((m) => `<button class="pick${s.singers.includes(m.userId) ? ' on' : ''}" data-act="toggleSinger" data-v="${m.userId}" aria-pressed="${s.singers.includes(m.userId)}">${esc(m.name)}</button>`).join('')
    + `<button class="pick${s.singers.includes('all') ? ' on' : ''}" data-act="toggleSinger" data-v="all" aria-pressed="${s.singers.includes('all')}">Everyone</button>`;
  return `<div class="pg">${header({ title: 'Edit song', sub: esc(p.name) })}
    <main class="scroll">
      <div class="field"><label class="lbl" for="s-title">Song title</label><input id="s-title" class="inp" data-in="songField" data-f="title" value="${esc(s.title)}" maxlength="120"></div>
      <div class="field"><label class="lbl" for="s-artist">By (artist or writer)</label><input id="s-artist" class="inp" data-in="songField" data-f="artist" value="${esc(s.artist)}" maxlength="120"></div>
      <div class="grid2">
        <div class="field"><label class="lbl" for="s-key">Key</label><input id="s-key" class="inp" data-in="songField" data-f="key" value="${esc(s.key)}" list="keys" placeholder="e.g. G" maxlength="8" autocapitalize="characters" autocomplete="off"><datalist id="keys">${KEYS.map((k) => `<option value="${k}">`).join('')}</datalist></div>
        <div class="field"><label class="lbl" for="s-starts">Who starts</label><select id="s-starts" class="inp" data-in="songField" data-f="starts"><option value="">Not set</option>${STARTS.map(([v, l]) => `<option value="${v}"${s.starts === v ? ' selected' : ''}>${l}</option>`).join('')}</select></div>
      </div>
      <div class="field"><span class="lbl">Who sings lead</span><div class="picks">${picks}</div></div>
      <div class="sec-t">Lyrics</div>
      <p class="hint" style="font-size:14px">${s.lyrics ? `<span class="ok">${lineCount} lines saved</span>${s.lyricsSource ? ' · from ' + esc(s.lyricsSource) : ''}${assigned ? ` · ${assigned} lines given to singers` : ''}` : 'No lyrics yet.'}</p>
      <button class="btn ${s.lyrics ? 'sec' : 'pri'} wide" data-act="findLyrics" data-id="${s.id}">${I.search}${s.lyrics ? 'Search the internet again' : 'Search the internet for lyrics'}</button>
      <button class="btn sec wide" data-act="editLyrics">${I.pen}${s.lyrics ? 'Edit the lyrics' : 'Type or paste lyrics'}</button>
      ${s.lyrics ? `<button class="btn dark wide" data-act="openParts">Assign parts to singers</button>` : ''}
      <button class="link bad" data-act="removeSong" data-id="${s.id}" data-then="back">Remove this song from the playlist</button>
    </main></div>`;
}

function vLyricsFind(p, s) {
  let body;
  const paste = `<button class="btn sec wide" data-act="editLyrics">${I.pen}None are right. Type or paste lyrics.</button>
    <a class="link" href="${esc(find.webSearchUrl(s.title, s.artist))}" target="_blank" rel="noopener noreferrer">${I.search}Look on the web in your browser</a>`;
  if (LF.status === 'loading') body = `<div class="empty"><div class="spin"></div><p>Searching the internet for lyrics…</p></div>`;
  else if (LF.status === 'error') body = `<p class="err">Could not search right now. Check your internet and try again.</p><button class="btn pri wide" data-act="findLyrics" data-id="${s.id}">Try again</button>${paste}`;
  else {
    const shown = LF.results.map((r, i) => ({ r, i })).filter((x) => !LF.rejected[x.i]);
    if (!shown.length) {
      body = `<p class="hint" style="font-size:15px">${LF.results.length ? 'No more results.' : 'No lyrics found for this song.'} You can type or paste them instead.</p>${paste}`;
    } else {
      body = `<p class="hint ok">${I.search} Searched the internet · ${shown.length} result${shown.length === 1 ? '' : 's'}</p>` + shown.map(({ r, i }) => {
        const open = LF.open === i;
        const first = r.lyrics.split('\n').slice(0, 4).join('\n');
        return `<div class="res${open ? ' open' : ''}">
          <div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline"><b>From ${esc(r.source)}</b><span class="hint">${r.lines} lines</span></div>
          <p class="hint">${esc([r.by, r.album].filter(Boolean).join(' · ') || 'No artist listed')}</p>
          <pre>${esc(open ? r.lyrics : first + (r.lyrics.length > first.length ? '\n…' : ''))}</pre>
          ${open ? '' : `<button class="link" data-act="lfOpen" data-i="${i}">Read all ${r.lines} lines</button>`}
          <div class="grid2"><button class="btn sec" data-act="lfReject" data-i="${i}">Not this one</button><button class="btn pri" data-act="lfUse" data-i="${i}">Use these lyrics</button></div></div>`;
      }).join('') + paste;
    }
  }
  return `<div class="pg"><header class="hd"><button class="ib" data-act="back" aria-label="Back">${I.back}</button>${art(s, true)}
      <div class="hd-t"><h1>${esc(s.title)}</h1><div class="sub">${esc(artistLine(s) || 'Lyrics search')}</div></div></header>
    <main class="scroll">${body}</main>
    <footer class="ft"><p class="hint">Lyrics you choose are saved on every member's phone when they sync, so they work offline. Lyrics belong to their writers; use them for your band's own rehearsals and gigs.</p></footer></div>`;
}

function vParts(p, s) {
  const n = SEL ? Math.abs(SEL.a - SEL.b) + 1 : 0;
  const who = S.members.map((m) => { const [bg, fg] = colorOf(m.userId); return `<button data-act="assignSel" data-v="${m.userId}" style="background:${bg};color:${fg}">${esc(m.name)}</button>`; }).join('')
    + `<button data-act="assignSel" data-v="all" style="background:#fff;color:#17181C;border:1px solid #17181C">All</button>`
    + `<button data-act="assignSel" data-v="" style="background:#fff;color:#5C6370;border:1px solid #8A8F9A">Nobody</button>`;
  const foot = SEL
    ? `<footer class="ft" style="background:var(--surf)"><div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><b style="font-size:14px">Who sings the ${n} selected line${n === 1 ? '' : 's'}?</b>
        <span style="display:flex;gap:14px"><button class="link" data-act="cueSel">Cue note</button><button class="link" data-act="clearSel">Cancel</button></span></div><div class="who">${who}</div></footer>`
    : `<footer class="ft"><p class="hint">Tap the first line of a part, then the last line. Then choose who sings it. A cue note tells singers when to come in.</p></footer>`;
  return `<div class="pg"><header class="hd"><button class="ib" data-act="back" aria-label="Back">${I.back}</button>
      <div class="hd-t"><h1>Assign parts</h1><div class="sub">${esc(s.title)}</div></div><button class="btn pri sm" data-act="back">Done</button></header>
    <main class="scroll"><div class="lyr ts0">${lyricBlocks(s, { parts: true, sel: SEL })}</div></main>${foot}</div>`;
}

// ---------------------------------------------------------------- screens: settings

function vSettings() {
  const admin = isAdmin();
  const custom = !!S.band.logo;
  return `<div class="pg">${header({ title: 'Settings', right: `${offlinePill()}${admin ? '<span class="pill">You are an admin</span>' : ''}` })}
    <main class="scroll">
      <div class="bandcard">${logo(64, true)}<div style="flex:1;min-width:0"><div class="big" style="font-size:20px">${esc(bandName())}</div>
        ${admin ? `<div style="display:flex;flex-wrap:wrap;gap:0 16px"><button class="link" data-act="changeLogo">Change logo</button>${custom ? '<button class="link" data-act="removeLogo">Remove logo</button>' : ''}<button class="link" data-act="editBandName">Edit name</button></div>` : '<p class="hint">Only admins can change the band name and logo.</p>'}</div></div>
      <input type="file" id="logoFile" accept="image/*" hidden>
      <div class="sec-t">Band</div>
      <div class="list">
        <button class="li" data-act="openMembers"><span class="g">Members and invite link</span><span class="v">${S.members.length} member${S.members.length === 1 ? '' : 's'}</span>${I.chev}</button>
        ${admin ? `<button class="li" data-act="showAdminCode"><span class="g">Admin recovery code<small>Use it if an admin loses their phone</small></span>${I.chev}</button>`
          : `<button class="li" data-act="claimAdmin"><span class="g">I have an admin code</span>${I.chev}</button>`}
      </div>
      <div class="sec-t">Me</div>
      <div class="list">
        <button class="li" data-act="editMe"><span class="g">My name and role</span><span class="v">${esc(S.me.name)} · ${esc(roleLabel(S.me))}</span>${I.chev}</button>
        <button class="li" data-act="textSize"><span class="g">Lyrics text size</span><span class="v">${TEXT_SIZES[S.prefs.textSize]}</span>${I.chev}</button>
        <button class="li" data-act="toggleWake" aria-pressed="${!!S.prefs.wake}"><span class="g">Keep screen on while reading lyrics</span><span class="tog${S.prefs.wake ? ' on' : ''}"><i></i></span></button>
      </div>
      <div class="sec-t">This phone</div>
      <div class="list">
        <button class="li" data-act="syncNow"><span class="g">Sync now<small>Last synced ${esc(timeAgo(S.lastSync))}</small></span>${I.sync}</button>
        ${standalone() ? '' : `<button class="li" data-act="installApp"><span class="g">Install the app on this phone</span>${I.chev}</button>`}
        <div class="li"><span class="g">Saved for offline</span><span class="v ok">${S.playlists.length} playlist${S.playlists.length === 1 ? '' : 's'}</span></div>
        <div class="li"><span class="g">App version</span><span class="v">${APP_VERSION}</span></div>
      </div>
      <button class="link bad" data-act="leaveBand">Leave the band</button>
    </main></div>`;
}

function inviteLink() {
  return `${location.origin}${location.pathname}?join=${S.band.inviteCode}`;
}

function vMembers() {
  const admin = isAdmin();
  const rows = S.members.map((m) => {
    const me = m.userId === S.me.userId;
    return `<div class="li"><span class="g">${esc(m.name)}${me ? ' (you)' : ''}<small>${m.kind === 'singer' ? 'Singer' : 'Musician · ' + esc(INST[m.instrument] || '')}</small></span>
      ${m.isAdmin ? '<span class="pill">Admin</span>' : ''}${admin && !me ? `<button class="ib" data-act="memberMenu" data-id="${m.userId}" aria-label="Options for ${esc(m.name)}">${I.dots}</button>` : ''}</div>`;
  }).join('');
  return `<div class="pg">${header({ title: 'Members', right: offlinePill() })}
    <main class="scroll">
      <div class="box fire"><b>Invite the band</b>
        <p class="hint" style="color:#5C4A44">Send this link. Each person opens it, adds their name, and picks singer or musician. They can also type the code in the app.</p>
        <div class="code" aria-label="Invite code">${esc(S.band.inviteCode)}</div>
        <div class="mono">${esc(inviteLink())}</div>
        <div class="grid2"><button class="btn sec" data-act="copyLink">Copy link</button><button class="btn pri" data-act="shareLink">${I.share}Share link</button></div>
        ${admin ? '<button class="link" data-act="newCode">Make a new code (the old link stops working)</button>' : ''}</div>
      <div class="sec-t">${S.members.length} member${S.members.length === 1 ? '' : 's'}</div>
      <div class="list">${rows}</div>
      <p class="hint">${admin ? 'Tap the three dots to make someone an admin or remove them.' : 'Admins can add songs, lyrics and parts, and manage members.'}</p>
    </main></div>`;
}

// ---------------------------------------------------------------- actions

const pl = () => playlist(route.p.pl);
const song = () => songIn(pl(), route.p.song);
function touch(p) { p.dirty = true; store.save(); }

async function startLyricsSearch(s) {
  LF = { songId: s.id, status: 'loading', results: [], open: 0, rejected: {} };
  render(true);
  try {
    const results = await find.searchLyrics(s.title, s.artist);
    if (LF.songId !== s.id) return;
    LF.results = results; LF.status = 'done';
  } catch {
    if (LF.songId !== s.id) return;
    LF.status = 'error';
  }
  if (route.name === 'lyricsFind') render(false);
}

function setLyrics(p, s, text, source) {
  const clean = cleanLyrics(text);
  if (clean !== s.lyrics) { s.assign = {}; s.cues = {}; }
  s.lyrics = clean;
  s.lyricsSource = clean ? source : '';
  touch(p);
}

const runSongSearch = debounce(async () => {
  const term = Q.term.trim();
  const paint = () => { const box = document.getElementById('results'); if (box && route.name === 'addSong') box.innerHTML = searchResultsHtml(pl()); };
  if (term.length < 2) { Q.status = 'idle'; Q.results = []; return paint(); }
  Q.status = 'loading'; paint();
  try {
    const results = await find.searchSongs(term);
    if (Q.term.trim() !== term) return;
    Q.results = results; Q.status = 'done';
  } catch {
    if (Q.term.trim() !== term) return;
    Q.status = 'error';
  }
  paint();
}, 450);

function addSongToPlaylist(p, data) {
  const s = fixSong({ id: uid(), title: data.title, artist: data.artist, album: data.album, year: data.year, art: data.art });
  p.songs.push(s);
  touch(p);
  return s;
}

function readLogo(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = 256;
      const c = document.createElement('canvas');
      c.width = size; c.height = size;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale, h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.86));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file is not a picture the app can read.')); };
    img.src = url;
  });
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* fall back below */ }
  try {
    const t = document.createElement('textarea');
    t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    const ok = document.execCommand('copy');
    t.remove();
    return ok;
  } catch { return false; }
}

let deferredInstall = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; softRender(); });
window.addEventListener('appinstalled', () => { deferredInstall = null; softRender(); });

const A = {
  back,
  home: () => nav(S.band ? 'playlists' : 'welcome', {}, true),

  // --- joining
  goJoin: () => { F = { mode: 'join', code: '', name: '', kind: '', instrument: '' }; nav('join'); },
  goCreate: () => { F = { mode: 'create', bandName: 'Flames Band', name: '', kind: '', instrument: '' }; nav('join'); },
  setKind: (d) => { F.kind = d.v; F.err = ''; render(false); },
  setInst: (d) => { F.instrument = d.v; F.err = ''; render(false); },
  submitJoin: async () => {
    const mode = F.mode || 'join';
    const name = (F.name || '').trim();
    const fail = (m) => { F.err = m; F.busy = false; render(false); };
    if (mode === 'join' && (F.code || '').replace(/[^A-Za-z0-9]/g, '').length < 4) return fail('Enter the invite code from your admin.');
    if (mode === 'create' && !(F.bandName ?? '').trim()) return fail('Enter a band name.');
    if (!name) return fail('Enter your name.');
    if (!F.kind) return fail('Choose singer or musician.');
    if (F.kind === 'musician' && !F.instrument) return fail('Choose what you play.');
    if (F.busy) return;
    F.busy = true; F.err = ''; render(false);
    const inst = F.kind === 'musician' ? F.instrument : null;
    try {
      if (mode === 'me') {
        const r = await api.call('update_me', { p_band: S.band.id, p_name: name, p_kind: F.kind, p_instrument: inst });
        Object.assign(S.me, { name, kind: F.kind, instrument: inst });
        const m = member(S.me.userId); if (m) Object.assign(m, { name, kind: F.kind, instrument: inst });
        wrote(r); F = {}; toast('Saved.'); back();
        return;
      }
      const st = mode === 'create'
        ? await api.call('create_band', { p_band_name: F.bandName.trim(), p_name: name, p_kind: F.kind, p_instrument: inst })
        : await api.call('join_band', { p_code: F.code, p_name: name, p_kind: F.kind, p_instrument: inst });
      S.playlists = []; S.notes = {}; S.notesDirty = false;
      applyState(st);
      await store.flush();
      F = {};
      prefetchArt();
      nav('playlists', {}, true);
      toast(mode === 'create' ? 'Band created. You are the admin.' : `Welcome to ${bandName()}.`);
    } catch (e) {
      fail(e?.message || 'Something went wrong. Please try again.');
    }
  },
  installApp: async () => {
    if (deferredInstall) { deferredInstall.prompt(); try { await deferredInstall.userChoice; } catch { /* dismissed */ } deferredInstall = null; return softRender(); }
    info({ title: 'Install on this phone', html: isIOS()
      ? '<p class="hint" style="font-size:15px">In Safari, tap the <b>Share</b> button, then <b>Add to Home Screen</b>. Then open Flames Band from your home screen.</p>'
      : '<p class="hint" style="font-size:15px">Open your browser menu (the three dots) and tap <b>Install app</b> or <b>Add to Home screen</b>.</p>' });
  },

  // --- playlists
  openSettings: () => nav('settings'),
  openMembers: () => nav('members'),
  openPlaylist: (d) => nav('playlist', { pl: d.id }),
  syncNow: () => run(async () => {
    if (!online()) return toast('No internet. You still have everything from your last sync.', 'bad');
    await sync();
    render(false);
    toast('Synced. You have the latest.');
  }),
  newPlaylist: async () => {
    const name = await ask({ title: 'New playlist', label: 'Playlist name', placeholder: 'e.g. Saturday gig', ok: 'Create', maxlength: 80 });
    if (!name?.trim()) return;
    const p = { id: uid(), name: name.trim(), gigDate: '', position: S.playlists.reduce((a, x) => Math.max(a, x.position), 0) + 1, version: 0, songs: [], dirty: true, isNew: true, conflict: false };
    S.playlists.push(p);
    store.save();
    nav('playlist', { pl: p.id, edit: 1 });
  },
  toggleEdit: () => nav('playlist', { pl: route.p.pl, edit: route.p.edit ? 0 : 1 }, true),
  deletePlaylist: async () => {
    const p = pl();
    if (!(await confirmBox({ title: 'Delete this playlist?', text: `“${p.name}” will be removed for the whole band.`, ok: 'Delete', danger: true }))) return;
    run(async () => {
      if (!p.isNew) wrote(await api.call('delete_playlist', { p_band: S.band.id, p_id: p.id }));
      S.playlists = S.playlists.filter((x) => x.id !== p.id);
      store.save();
      nav('playlists', {}, true);
      toast('Playlist deleted.');
    });
  },
  sendUpdate: () => run(async () => {
    const p = pl();
    if (!p.name.trim()) return toast('Give the playlist a name first.', 'bad');
    const send = (force) => api.call('save_playlist', {
      p_band: S.band.id, p_id: p.id, p_name: p.name.trim(), p_gig_date: p.gigDate || null, p_position: p.position,
      p_data: { songs: p.songs }, p_base_version: p.isNew ? 0 : p.version, p_force: force,
    });
    let r;
    try {
      r = await send(false);
    } catch (e) {
      if (e.code !== 'conflict') throw e;
      const pick = await choose({ title: 'Another admin changed this playlist', text: 'Their version was sent after your last sync. Which one should the band get?', options: [{ v: 'mine', label: 'Send mine (replaces theirs)', cls: 'pri' }, { v: 'theirs', label: 'Keep theirs (discard my changes)' }] });
      if (pick === 'mine') r = await send(true);
      else if (pick === 'theirs') { p.dirty = false; await sync(); render(true); return toast('Loaded the other admin’s version.'); }
      else return;
    }
    Object.assign(p, { version: r.version, dirty: false, isNew: false, conflict: false });
    wrote(r);
    render(false);
    toast('Sent. The band gets it when they sync.');
  }),
  addSong: () => { Q = { term: '', status: 'idle', results: [] }; nav('addSong', { pl: route.p.pl }); },
  pickResult: (d) => {
    const r = Q.results[+d.i]; const p = pl();
    if (!r) return;
    if (p.songs.some((x) => norm(x.title) === norm(r.title) && norm(x.artist) === norm(r.artist))) return toast('That song is already in this playlist.');
    const s = addSongToPlaylist(p, r);
    nav('lyricsFind', { pl: p.id, song: s.id }, true);
    startLyricsSearch(s);
  },
  addManual: () => {
    const p = pl();
    const s = addSongToPlaylist(p, { title: Q.term.trim(), artist: '' });
    nav('songEdit', { pl: p.id, song: s.id }, true);
  },
  openSong: (d) => { MODE = ''; nav('song', { pl: route.p.pl, song: d.id }); },
  editSong: (d) => nav('songEdit', { pl: route.p.pl, song: d.id }),
  moveUp: (d) => moveSong(d.id, -1),
  moveDown: (d) => moveSong(d.id, 1),
  removeSong: async (d) => {
    const p = pl(); const s = songIn(p, d.id);
    if (!s || !(await confirmBox({ title: 'Remove this song?', text: `“${s.title}” will be taken out of this playlist.`, ok: 'Remove', danger: true }))) return;
    p.songs = p.songs.filter((x) => x.id !== s.id);
    touch(p);
    if (d.then === 'back') back(); else render(false);
  },

  // --- song (admin)
  toggleSinger: (d) => {
    const s = song();
    if (d.v === 'all') s.singers = s.singers.includes('all') ? [] : ['all'];
    else {
      s.singers = s.singers.filter((x) => x !== 'all');
      s.singers = s.singers.includes(d.v) ? s.singers.filter((x) => x !== d.v) : [...s.singers, d.v];
    }
    touch(pl()); render(false);
  },
  findLyrics: (d) => {
    const p = pl(); const s = songIn(p, d.id);
    if (route.name === 'lyricsFind') return startLyricsSearch(s);
    nav('lyricsFind', { pl: p.id, song: s.id });
    startLyricsSearch(s);
  },
  lfOpen: (d) => { LF.open = +d.i; render(false); },
  lfReject: (d) => { LF.rejected[+d.i] = true; const nxt = LF.results.findIndex((_, i) => !LF.rejected[i]); LF.open = nxt; render(false); },
  lfUse: async (d) => {
    const p = pl(); const s = song(); const r = LF.results[+d.i];
    if (!r) return;
    if (s.lyrics && Object.keys(s.assign).length && !(await confirmBox({ title: 'Replace the lyrics?', text: 'The parts you gave to singers for this song will be cleared.', ok: 'Replace' }))) return;
    setLyrics(p, s, r.lyrics, r.source);
    toast('Lyrics saved to the playlist.');
    back();
  },
  editLyrics: async () => {
    const p = pl(); const s = song();
    const text = await ask({ title: s.lyrics ? 'Edit lyrics' : 'Type or paste lyrics', value: s.lyrics, multiline: true, placeholder: 'One line per line. Leave an empty line between verses.', ok: 'Save lyrics', maxlength: 20000, hint: s.lyrics && Object.keys(s.assign).length ? 'Changing the words clears the parts given to singers for this song.' : '' });
    if (text == null) return;
    setLyrics(p, s, text, 'typed in');
    if (route.name === 'lyricsFind') { toast('Lyrics saved to the playlist.'); back(); } else render(false);
  },
  openParts: () => { SEL = null; nav('parts', { pl: route.p.pl, song: route.p.song }); },
  partLine: (d) => {
    const i = +d.i;
    if (!SEL || SEL.done) SEL = { a: i, b: i, done: false };
    else { SEL.b = i; SEL.done = true; }
    render(false);
  },
  clearSel: () => { SEL = null; render(false); },
  assignSel: (d) => {
    const s = song(); if (!SEL) return;
    const lines = s.lyrics.split('\n');
    for (let i = Math.min(SEL.a, SEL.b); i <= Math.max(SEL.a, SEL.b); i++) {
      if (!lines[i]?.trim()) continue;
      if (d.v) s.assign[i] = d.v; else delete s.assign[i];
    }
    SEL = null; touch(pl()); render(false);
  },
  cueSel: async () => {
    const s = song(); if (!SEL) return;
    const i = Math.min(SEL.a, SEL.b);
    const text = await ask({ title: 'Cue note', label: 'Shown to everyone above the first selected line', value: s.cues[i] || '', placeholder: 'e.g. Maria joins here', ok: 'Save', maxlength: 120 });
    if (text == null) return;
    if (text.trim()) s.cues[i] = text.trim(); else delete s.cues[i];
    touch(pl()); render(false);
  },

  // --- song (everyone)
  mode: (d) => { MODE = MODE === d.v ? '' : d.v; render(false); },
  line: async (d) => {
    const s = song(); const i = +d.i;
    if (MODE === 'hl') {
      const n = noteOf(s.id);
      if (n.hl[i]) delete n.hl[i]; else n.hl[i] = 1;
      notesChanged(); render(false);
    } else if (MODE === 'note') A.lineNote(d);
  },
  lineNote: async (d) => {
    const s = song(); const i = +d.i;
    const text = await ask({ title: 'My note on this line', label: 'Only you can see this', value: peekNote(s.id).ln?.[i] || '', placeholder: 'e.g. breathe before this line', ok: 'Save', maxlength: 200 });
    if (text == null) return;
    const n = noteOf(s.id);
    if (text.trim()) n.ln[i] = text.trim(); else delete n.ln[i];
    notesChanged(); render(false);
  },
  songNote: async () => {
    const s = song();
    const text = await ask({ title: 'My note for this song', label: 'Only you can see this. It also shows in the playlist.', value: peekNote(s.id).text || '', placeholder: 'e.g. I start on Gsus after the bass', ok: 'Save', maxlength: 300 });
    if (text == null) return;
    noteOf(s.id).text = text.trim();
    notesChanged(); render(false);
  },
  textSize: () => { S.prefs.textSize = (S.prefs.textSize + 1) % TEXT_SIZES.length; store.save(); render(false); if (route.name === 'song') toast('Text size: ' + TEXT_SIZES[S.prefs.textSize]); },
  prevSong: () => stepSong(-1),
  nextSong: () => stepSong(1),

  // --- settings
  toggleWake: () => { S.prefs.wake = !S.prefs.wake; store.save(); render(false); },
  editMe: () => { F = { mode: 'me', name: S.me.name, kind: S.me.kind, instrument: S.me.instrument || '' }; nav('join'); },
  editBandName: async () => {
    const name = await ask({ title: 'Band name', value: S.band.name, ok: 'Save', maxlength: 60 });
    if (!name?.trim()) return;
    run(async () => { wrote(await api.call('update_band', { p_band: S.band.id, p_name: name.trim(), p_logo: null, p_settings: null })); S.band.name = name.trim(); store.save(); render(false); toast('Band name changed.'); });
  },
  changeLogo: () => document.getElementById('logoFile')?.click(),
  removeLogo: () => run(async () => { wrote(await api.call('update_band', { p_band: S.band.id, p_name: null, p_logo: '', p_settings: null })); S.band.logo = ''; store.save(); render(false); toast('Logo removed.'); }),
  showAdminCode: () => info({ title: 'Admin recovery code', html: `<div class="code" style="font-size:24px">${esc(S.band.adminCode)}</div><p class="hint" style="font-size:15px">Write this down and keep it private. If an admin gets a new phone or loses the app, they join again with the invite link, then enter this code under Settings to become an admin again.</p>` }),
  claimAdmin: async () => {
    const code = await ask({ title: 'Admin code', label: 'Enter the admin recovery code', ok: 'Become admin', maxlength: 20 });
    if (!code?.trim()) return;
    run(async () => { await api.call('claim_admin', { p_band: S.band.id, p_code: code }); await sync(); render(false); toast('You are now an admin.'); });
  },
  leaveBand: async () => {
    if (!(await confirmBox({ title: 'Leave the band?', text: 'Your playlists and notes will be removed from this phone. You can join again with the invite code.', ok: 'Leave', danger: true }))) return;
    run(async () => {
      await api.call('remove_member', { p_band: S.band.id, p_user: S.me.userId });
      const prefs = S.prefs; await store.reset(); S.prefs = prefs; store.save();
      nav('welcome', {}, true);
    });
  },

  // --- members
  copyLink: async () => toast((await copyText(inviteLink())) ? 'Invite link copied.' : 'Could not copy. Press and hold the link to copy it.'),
  shareLink: async () => {
    const data = { title: bandName(), text: `Join ${bandName()} in the band app. Invite code: ${S.band.inviteCode}`, url: inviteLink() };
    if (navigator.share) { try { await navigator.share(data); } catch { /* closed */ } return; }
    A.copyLink();
  },
  newCode: async () => {
    if (!(await confirmBox({ title: 'Make a new invite code?', text: 'The old link and code will stop working. People already in the band stay in.', ok: 'New code' }))) return;
    run(async () => { const r = await api.call('new_invite_code', { p_band: S.band.id }); S.band.inviteCode = r.invite_code; wrote(r); render(false); toast('New invite code ready.'); });
  },
  memberMenu: async (d) => {
    const m = member(d.id); if (!m) return;
    const pick = await choose({ title: m.name, text: m.kind === 'singer' ? 'Singer' : 'Musician · ' + (INST[m.instrument] || ''), options: [
      m.isAdmin ? { v: 'unadmin', label: 'Remove as admin' } : { v: 'admin', label: 'Make admin', cls: 'pri' },
      { v: 'remove', label: 'Remove from the band' }] });
    if (!pick) return;
    if (pick === 'remove' && !(await confirmBox({ title: `Remove ${m.name}?`, text: 'They will lose access to the playlists.', ok: 'Remove', danger: true }))) return;
    run(async () => {
      if (pick === 'remove') { wrote(await api.call('remove_member', { p_band: S.band.id, p_user: m.userId })); S.members = S.members.filter((x) => x.userId !== m.userId); }
      else { wrote(await api.call('set_admin', { p_band: S.band.id, p_user: m.userId, p_admin: pick === 'admin' })); m.isAdmin = pick === 'admin'; }
      store.save(); render(false);
      toast(pick === 'remove' ? `${m.name} removed.` : pick === 'admin' ? `${m.name} is now an admin.` : `${m.name} is no longer an admin.`);
    });
  },
};

function moveSong(id, dir) {
  const p = pl(); const i = p.songs.findIndex((s) => s.id === id); const j = i + dir;
  if (i < 0 || j < 0 || j >= p.songs.length) return;
  [p.songs[i], p.songs[j]] = [p.songs[j], p.songs[i]];
  touch(p); render(false);
}
function stepSong(dir) {
  const p = pl(); const i = p.songs.indexOf(song()); const n = p.songs[i + dir];
  if (!n) return;
  MODE = '';
  nav('song', { pl: p.id, song: n.id }, true);
}

// ---------------------------------------------------------------- events

$app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = A[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el.dataset, el); }
});
$app.addEventListener('submit', (e) => { e.preventDefault(); if (e.target.dataset.form === 'join') A.submitJoin(); });

$app.addEventListener('input', (e) => {
  const el = e.target; const kind = el.dataset?.in;
  if (!kind) return;
  if (kind === 'form') {
    F[el.dataset.f] = el.value;
  } else if (kind === 'plName') {
    const p = pl(); p.name = el.value; touch(p);
  } else if (kind === 'plDate') {
    const p = pl(); p.gigDate = el.value || ''; touch(p);
  } else if (kind === 'songField') {
    const s = song(); s[el.dataset.f] = el.dataset.f === 'key' ? el.value.trim() : el.value; touch(pl());
  } else if (kind === 'songSearch') {
    Q.term = el.value; runSongSearch();
  } else if (kind === 'filter') {
    const q = norm(el.value); let shown = 0;
    $app.querySelectorAll('.row[data-q]').forEach((r) => { const hit = !q || r.dataset.q.includes(q); r.hidden = !hit; if (hit) shown++; });
    const nm = document.getElementById('nomatch'); if (nm) nm.hidden = shown > 0;
  }
});
$app.addEventListener('change', async (e) => {
  if (e.target.id !== 'logoFile') return;
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  run(async () => {
    const dataUrl = await readLogo(file);
    wrote(await api.call('update_band', { p_band: S.band.id, p_name: null, p_logo: dataUrl, p_settings: null }));
    S.band.logo = dataUrl; store.save(); render(false); toast('Logo changed for the whole band.');
  });
});
// A cover picture that fails to load just shows the coloured circle behind it.
document.addEventListener('error', (e) => { const t = e.target; if (t?.tagName === 'IMG' && t.closest?.('.art')) t.remove(); }, true);

window.addEventListener('online', () => { softRender(); if (S.band) { pushNotes().catch(() => {}); checkRemote(); } });
window.addEventListener('offline', () => softRender());
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') store.flush();
  else { checkRemote(); updateWake(); }
});
window.addEventListener('pagehide', () => store.flush());

// ---------------------------------------------------------------- screen wake

let wakeLock = null;
async function updateWake() {
  const want = !!S.prefs.wake && route.name === 'song' && document.visibilityState === 'visible';
  try {
    if (want && !wakeLock && navigator.wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if (!want && wakeLock) {
      const w = wakeLock; wakeLock = null; await w.release();
    }
  } catch { wakeLock = null; }
}

// ---------------------------------------------------------------- start

function splash() {
  if (sessionStorage.getItem('fb-splash')) return;
  try { sessionStorage.setItem('fb-splash', '1'); } catch { /* private mode */ }
  const el = document.createElement('div');
  el.className = 'splash';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<div class="fl"><div class="glow"></div>${FLAME(120, 'logo')}</div><div style="display:flex;flex-direction:column;align-items:center;gap:8px"><div class="word">Flames Band</div><div class="tag">Setlists and lyrics, ready for the gig</div></div>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

async function boot() {
  splash();
  await store.load();
  const params = new URLSearchParams(location.search);
  const joinCode = (params.get('join') || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 12);
  history.replaceState({ name: S.band ? 'playlists' : 'welcome', p: {}, d: 0 }, '', location.pathname);
  if (!S.band && joinCode && api.configured()) {
    route = { name: 'welcome', p: {} };
    F = { mode: 'join', code: joinCode, name: '', kind: '', instrument: '' };
    nav('join');
  } else {
    route = { name: S.band ? 'playlists' : 'welcome', p: {} };
    render(true);
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  if (S.band && online()) {
    try { await sync(); softRender(); } catch (e) { if (e.code === 'not_member') await kicked(); }
  }
  setInterval(checkRemote, 60000);
}

boot();
