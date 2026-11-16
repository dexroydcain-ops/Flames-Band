// Flames Band service worker: keeps the app itself on the phone so it opens
// with no internet. Change VERSION whenever you upload a new copy of the app.
const VERSION = 'fb-1.0.0';
const SHELL = [
  './', 'index.html', 'app.css', 'config.js', 'manifest.webmanifest',
  'js/app.js', 'js/api.js', 'js/search.js', 'js/store.js', 'js/util.js',
  'vendor/supabase.js',
  'fonts/inter-latin-wght-normal.woff2', 'fonts/inter-latin-ext-wght-normal.woff2', 'fonts/space-grotesk-latin-wght-normal.woff2',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];
const ART = 'fb-art-1';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== ART).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    // The app's own files: open instantly from the saved copy, and quietly
    // fetch a fresh copy for next time (so a new upload reaches every phone).
    e.respondWith((async () => {
      const cache = await caches.open(VERSION);
      const key = req.mode === 'navigate' ? 'index.html' : url.pathname;
      const hit = await cache.match(key, { ignoreSearch: true });
      const fresh = fetch(req.mode === 'navigate' ? 'index.html' : req, { cache: 'no-cache' })
        .then((res) => { if (res.ok) cache.put(key, res.clone()).catch(() => {}); return res; });
      if (hit) { e.waitUntil(fresh.catch(() => {})); return hit; }
      return fresh;
    })());
    return;
  }

  // Song cover pictures: keep a copy so they still show offline. Only pictures
  // the phone is allowed to read are stored; others just load normally.
  if (req.destination === 'image') {
    e.respondWith((async () => {
      const cache = await caches.open(ART);
      const hit = await cache.match(req.url);
      if (hit) return hit;
      try {
        const res = await fetch(req.url, { mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer' });
        if (res.ok) { cache.put(req.url, res.clone()).catch(() => {}); return res; }
      } catch (err) { /* not shareable: fall through */ }
      return fetch(req);
    })());
  }
  // Everything else (the database, lyrics search) goes straight to the network.
});
