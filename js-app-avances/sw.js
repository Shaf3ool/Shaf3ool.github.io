/* =========================================================================
   sw.js — offline shell for the "Avances de obra" prototype (scope: this folder)
   - Precaches the app shell (HTML, CSS, JS, fonts, icons, feed thumbnails)
   - Images: cache-first at runtime (full-size renders load once, then offline)
   - Navigations: network-first with the cached shell as fallback
   All paths are relative so it works under /js-app-avances/.
   ========================================================================= */
const VERSION = 'jsavances-e7faffdf95';
const SHELL = [
  "./",
  "./css/app.css",
  "./css/fonts.css",
  "./fonts/DMSans-normal-300-latin-ext.woff2",
  "./fonts/DMSans-normal-300-latin.woff2",
  "./fonts/DMSans-normal-400-latin-ext.woff2",
  "./fonts/DMSans-normal-400-latin.woff2",
  "./fonts/DMSans-normal-500-latin-ext.woff2",
  "./fonts/DMSans-normal-500-latin.woff2",
  "./fonts/DMSans-normal-600-latin-ext.woff2",
  "./fonts/DMSans-normal-600-latin.woff2",
  "./fonts/Fraunces-italic-300-latin-ext.woff2",
  "./fonts/Fraunces-italic-300-latin.woff2",
  "./fonts/Fraunces-normal-300-latin-ext.woff2",
  "./fonts/Fraunces-normal-300-latin.woff2",
  "./fonts/Fraunces-normal-400-latin-ext.woff2",
  "./fonts/Fraunces-normal-400-latin.woff2",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./img/bano-chukum-1-sm.webp",
  "./img/bano-chukum-2-sm.webp",
  "./img/bano-sereno-1-sm.webp",
  "./img/bano-sereno-2-sm.webp",
  "./img/cocina-gilsa-1-sm.webp",
  "./img/cocina-gilsa-2-sm.webp",
  "./img/cocina-neutra-1-sm.webp",
  "./img/cocina-neutra-2-sm.webp",
  "./img/fachada-blanca-1-sm.webp",
  "./img/fachada-blanca-2-sm.webp",
  "./img/fachada-casa-pequena-1-sm.webp",
  "./img/fachada-contemporanea-1-sm.webp",
  "./img/loft-1-sm.webp",
  "./img/loft-2-sm.webp",
  "./img/patio-jacaranda-1-sm.webp",
  "./img/patio-jacaranda-2-sm.webp",
  "./img/recamara-1-sm.webp",
  "./img/recamara-2-sm.webp",
  "./img/vestidor-salvia-1-sm.webp",
  "./img/vestidor-salvia-2-sm.webp",
  "./js/app.js",
  "./js/data.js",
  "./js/detail.js",
  "./js/home.js",
  "./js/i18n.js",
  "./js/sheet.js",
  "./js/ui.js",
  "./manifest.webmanifest",
  "./index.html"
];

// --- install: precache the shell -------------------------------------------
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

// --- activate: drop old caches of this app ----------------------------------
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('jsavances-') && k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// --- fetch: network-first for pages, cache-first for everything else ----------
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // pages: try the network, fall back to the cached shell offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }
  // assets: cached copy first, else fetch and keep a copy
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
    return res;
  })));
});
