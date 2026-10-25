/* =========================================================================
   sw.js — offline shell for the Js Interiorismo concept app.
   Cache-first for same-origin assets; scope is this folder only.
   ========================================================================= */
const CACHE = 'js-app-v1-1';
const SHELL = ['./', 'index.html', 'css/app.css', 'css/fonts.css', 'js/app.js', 'js/i18n.js', 'js/data.js', 'js/materials.js', 'js/scene.js', 'js/ar.js',
  'vendor/three.module.min.js', 'img/bano-sereno-1.webp', 'img/js-profile-150.png', 'icons/icon-192.png', 'manifest.webmanifest'];

/* What: pre-cache the shell on install.  In: event  Out: nothing */
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

/* What: drop old caches on activate.  In: event  Out: nothing */
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

/* What: cache-first, then network (and remember it).  In: event  Out: nothing */
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
    // only keep good same-origin responses
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match('index.html'))));
});
