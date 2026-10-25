/* =========================================================================
   sw.js — offline shell for "Opciones" (scope: this folder only)
   - Precaches the app shell (HTML, CSS, JS, fonts, icons)
   - Jorge's renders: cache-first at runtime (load once, then offline)
   - Navigations: network-first with the cached shell as fallback
   Relative paths, so it works under /js-app-opciones/.
   ========================================================================= */
const VERSION = 'jsopc-685ced637c';
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
  "./index.html",
  "./js/app.js",
  "./js/data.js",
  "./js/i18n.js",
  "./js/screens/catalog.js",
  "./js/screens/detail.js",
  "./js/screens/favorites.js",
  "./js/store.js",
  "./js/textures.js",
  "./js/ui.js",
  "./manifest.webmanifest"
];

// install: precache the shell, activate at once
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

// activate: drop older caches of THIS app only (other apps share the origin)
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('jsopc-') && k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

/**
 * What: answer same-origin GETs inside this scope from cache or network.
 * In:  FetchEvent
 * Out: Response
 */
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  // navigations: fresh when online, cached shell when offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html').then((r) => r || caches.match('./'))));
    return;
  }
  // everything else: cache first, then network (and keep a copy)
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
    return res;
  })));
});
