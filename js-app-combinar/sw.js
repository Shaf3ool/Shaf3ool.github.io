/* =========================================================================
   sw.js — offline cache for the "Combinar vistas" prototype.
   Cache-first for the app shell; bump VERSION to refresh old caches.
   ========================================================================= */
const VERSION = 'jsc-v1';
const ASSETS = [
  "./",
  "css/app.css",
  "css/fonts.css",
  "fonts/DMSans-normal-300-latin-ext.woff2",
  "fonts/DMSans-normal-300-latin.woff2",
  "fonts/DMSans-normal-400-latin-ext.woff2",
  "fonts/DMSans-normal-400-latin.woff2",
  "fonts/DMSans-normal-500-latin-ext.woff2",
  "fonts/DMSans-normal-500-latin.woff2",
  "fonts/DMSans-normal-600-latin-ext.woff2",
  "fonts/DMSans-normal-600-latin.woff2",
  "fonts/Fraunces-italic-300-latin-ext.woff2",
  "fonts/Fraunces-italic-300-latin.woff2",
  "fonts/Fraunces-normal-300-latin-ext.woff2",
  "fonts/Fraunces-normal-300-latin.woff2",
  "fonts/Fraunces-normal-400-latin-ext.woff2",
  "fonts/Fraunces-normal-400-latin.woff2",
  "icons/apple-touch-icon.png",
  "icons/favicon-32.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "img/cocina-neutra-1-sm.webp",
  "img/loft-1-sm.webp",
  "img/recamara-1-sm.webp",
  "index.html",
  "js/data.js",
  "js/editor.js",
  "js/geometry.js",
  "js/i18n.js",
  "js/main.js",
  "js/merge.js",
  "js/render.js",
  "js/screens.js",
  "js/share.js",
  "js/store.js",
  "js/ui.js",
  "manifest.webmanifest"
];

// install: pre-cache the app shell
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

// activate: drop caches from older versions
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// fetch: cache first, then network (and remember same-origin GETs)
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((res) => {
    if (res.ok && new URL(e.request.url).origin === location.origin) {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(e.request, copy));
    }
    return res;
  })));
});
