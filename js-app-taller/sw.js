/* =========================================================================
   sw.js: offline cache for the Taller prototype (cache-first, versioned).
   ========================================================================= */
const CACHE = 'js-taller-v3';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css', 'css/fonts.css',
  'js/app.js', 'js/i18n.js', 'js/catalog.js', 'js/state.js', 'js/geometry.js', 'js/draw.js',
  'js/symbols.js', 'js/interact.js', 'js/export.js', 'js/ui.js',
  'fonts/DMSans-normal-400-latin.woff2', 'fonts/DMSans-normal-500-latin.woff2', 'fonts/DMSans-normal-600-latin.woff2',
  'fonts/Fraunces-normal-300-latin.woff2', 'fonts/Fraunces-normal-400-latin.woff2',
  'img/loft-1-sm.webp', 'icons/icon-192.png',
];

/**
 * What: pre-cache the app shell on install.
 * In:  install event
 * Out: —
 */
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

/**
 * What: drop old cache versions on activate.
 * In:  activate event
 * Out: —
 */
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

/**
 * What: network-first for navigations (fresh deploys), cache-first for assets.
 * In:  fetch event
 * Out: —
 */
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('index.html')));
    return;
  }
  // assets: cache first, then network (and store same-origin responses)
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
    return res;
  })));
});
