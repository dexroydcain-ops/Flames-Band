// Looks things up on the internet for the admin:
//  - songs (title, artist, album, year, cover picture) from the iTunes Search API
//  - lyrics from LRCLIB and lyrics.ovh (free public lyrics services)
// Nothing here is needed on gig night: chosen lyrics are saved on the phone.

import { cleanLyrics, norm } from './util.js';

const ITUNES = 'https://itunes.apple.com/search';
const LRCLIB = 'https://lrclib.net/api/search';
const OVH = 'https://api.lyrics.ovh/v1';

function timeout(ms) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return { signal: c.signal, done: () => clearTimeout(t) };
}

async function getJson(url, ms = 9000) {
  const t = timeout(ms);
  try {
    const res = await fetch(url, { signal: t.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } finally {
    t.done();
  }
}

// iTunes answers through a <script> callback, which works from any website.
let jsonpCount = 0;
function jsonp(url, ms = 8000) {
  return new Promise((resolve, reject) => {
    const name = '__fbJsonp' + Date.now() + '_' + jsonpCount++;
    const script = document.createElement('script');
    const finish = (fn, v) => {
      clearTimeout(timer);
      delete window[name];
      script.remove();
      fn(v);
    };
    const timer = setTimeout(() => finish(reject, new Error('timeout')), ms);
    window[name] = (data) => finish(resolve, data);
    script.onerror = () => finish(reject, new Error('network'));
    script.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + name;
    document.head.appendChild(script);
  });
}

function dedupe(list, keyFn) {
  const seen = new Set();
  return list.filter((x) => {
    const k = keyFn(x);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function lrclibRaw(params) {
  const q = new URLSearchParams(params).toString();
  const data = await getJson(`${LRCLIB}?${q}`);
  return Array.isArray(data) ? data : [];
}

// Find songs by what the admin typed. Returns [{ title, artist, album, year, art }].
export async function searchSongs(term) {
  const q = term.trim();
  if (q.length < 2) return [];
  try {
    const data = await jsonp(`${ITUNES}?${new URLSearchParams({ term: q, entity: 'song', media: 'music', limit: '15' })}`);
    const out = (data?.results || []).filter((r) => r.trackName && r.artistName).map((r) => ({
      title: r.trackName,
      artist: r.artistName,
      album: r.collectionName || '',
      year: r.releaseDate ? String(r.releaseDate).slice(0, 4) : '',
      art: r.artworkUrl100 || r.artworkUrl60 || '',
    }));
    if (out.length) return dedupe(out, (s) => norm(s.title) + '|' + norm(s.artist)).slice(0, 12);
  } catch { /* fall through to the second source */ }
  const rows = await lrclibRaw({ q });
  return dedupe(rows.filter((r) => r.trackName && r.artistName).map((r) => ({
    title: r.trackName, artist: r.artistName, album: r.albumName || '', year: '', art: '',
  })), (s) => norm(s.title) + '|' + norm(s.artist)).slice(0, 12);
}

// Find lyrics for one song. Returns [{ source, by, album, lyrics, lines }], best match first.
export async function searchLyrics(title, artist) {
  const jobs = [];
  if (artist) jobs.push(lrclibRaw({ track_name: title, artist_name: artist }).catch(() => []));
  jobs.push(lrclibRaw({ track_name: title }).catch(() => []));
  jobs.push(lrclibRaw({ q: `${title} ${artist || ''}`.trim() }).catch(() => []));
  if (artist) {
    jobs.push(getJson(`${OVH}/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`, 7000)
      .then((d) => (d?.lyrics ? [{ __ovh: true, plainLyrics: d.lyrics, trackName: title, artistName: artist }] : []))
      .catch(() => []));
  }
  const settled = await Promise.all(jobs);
  if (!navigator.onLine) throw new Error('offline');
  const nt = norm(title);
  const na = norm(artist);
  const all = [];
  settled.forEach((rows, jobIndex) => {
    for (const r of rows) {
      const text = cleanLyrics(r.plainLyrics);
      if (!text || r.instrumental) continue;
      const rt = norm(r.trackName);
      const ra = norm(r.artistName);
      // Only keep results that are really this song.
      if (!rt || !(rt === nt || rt.startsWith(nt) || nt.startsWith(rt))) continue;
      let score = 0;
      if (rt === nt) score += 4;
      if (na && ra === na) score += 4;
      else if (na && (ra.includes(na) || na.includes(ra))) score += 2;
      score -= jobIndex * 0.1;
      all.push({
        source: r.__ovh ? 'lyrics.ovh' : 'LRCLIB',
        by: r.artistName || '',
        album: r.albumName || '',
        lyrics: text,
        lines: text.split('\n').filter((l) => l.trim()).length,
        score,
      });
    }
  });
  all.sort((a, b) => b.score - a.score);
  // Different uploads of the same words count once.
  return dedupe(all, (r) => norm(r.lyrics).slice(0, 600)).slice(0, 6);
}

export function webSearchUrl(title, artist) {
  return 'https://www.google.com/search?q=' + encodeURIComponent(`${title} ${artist || ''} lyrics`.trim());
}
