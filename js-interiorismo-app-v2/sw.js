/* =========================================================================
   sw.js — offline shell for the Js Interiorismo app prototype (scope: this folder)
   - Precaches the app shell (HTML, CSS, JS, fonts, icons)
   - Images: cache-first at runtime (Jorge's renders load once, then offline)
   - Navigations: network-first with the cached shell as fallback
   All paths are relative so it works under /js-interiorismo-app-v2/.
   ========================================================================= */
const VERSION = 'jsapp2-2d-8ef829c22c';
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
  "./js/ar.js",
  "./js/data.js",
  "./js/furniture2d.js",
  "./js/i18n.js",
  "./js/plan2d.js",
  "./js/screens/agenda.js",
  "./js/screens/designs.js",
  "./js/screens/inspiration.js",
  "./js/screens/onboarding.js",
  "./js/screens/planner.js",
  "./js/screens/progress.js",
  "./js/screens/send.js",
  "./js/screens/studio.js",
  "./js/screens/thumb.js",
  "./js/store.js",
  "./js/textures.js",
  "./js/ui.js",
  "./manifest.webmanifest"
];

// install: precache the shell, activate immediately
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

// activate: drop older caches of this app only
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('jsapp2-') && k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

/**
 * What: answer same-origin GETs from cache / network depending on type.
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
  // everything else: cache first, then network (and remember it)
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
    return res;
  })));
});
