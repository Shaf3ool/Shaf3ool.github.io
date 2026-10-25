/* =========================================================================
   app.js — entry point: layout (phone frame on desktop), hash routing between
   the home feed and an update's detail, language toggle, service worker.
   ========================================================================= */
import { apply, getLang, setLang } from './i18n.js';
import { initHome, render as renderHome, setBell } from './home.js';
import { initDetail, showDetail, hideDetail, refreshDetail } from './detail.js';
import { initSheet, openSheet, notifOn } from './sheet.js';

// --- elements --------------------------------------------------------------------
const app = document.getElementById('app');
const frameMQ = matchMedia('(min-width: 900px) and (min-height: 640px)');
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

/**
 * What: switch between framed (desktop) and full-screen (phone) layouts and
 *       scale the phone frame to fit the window.
 * In:  —
 * Out: —
 */
function layout() {
  const framed = frameMQ.matches && !standalone;
  document.body.classList.toggle('framed', framed);
  if (framed) {
    const s = Math.min(1, (window.innerHeight - 48) / 884, (window.innerWidth * 0.5) / 430);
    document.documentElement.style.setProperty('--frame-scale', s.toFixed(3));
  }
}
window.addEventListener('resize', layout);
layout();

/**
 * What: keep the decorative status bar clock current (framed mode only).
 * In:  —
 * Out: —
 */
function clock() {
  const d = new Date();
  document.querySelector('.sb-time').textContent = `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}`;
}
clock();
setInterval(clock, 30000);

// --- routing: "#/avance/<id>" opens a detail, anything else is home -----------
/**
 * What: read the update id from the URL hash.
 * In:  —
 * Out: string | null
 */
function routeId() {
  const m = location.hash.match(/^#\/avance\/([\w-]+)$/);
  return m ? m[1] : null;
}

/**
 * What: show the screen that matches the hash (push or pop the detail).
 * In:  —
 * Out: —
 */
function route() {
  const id = routeId();
  if (id && showDetail(id)) {
    // new detail starts at the top of its own scroll
    document.querySelector('#detail .scroll').scrollTop = 0;
    app.classList.add('pushed');
    app.classList.add('dark-top');
  } else {
    app.classList.remove('pushed', 'dark-top');
    hideDetail();
  }
}
window.addEventListener('hashchange', route);

/**
 * What: open an update (pushes a history entry so Back works).
 * In:  id (string)
 * Out: —
 */
function open(id) {
  location.hash = `#/avance/${id}`;
}

/**
 * What: leave the detail; uses history when we pushed it, else resets the hash.
 * In:  —
 * Out: —
 */
function back() {
  if (history.state?.fromHome) { history.back(); return; }
  // deep link: no home entry behind us, so swap the URL and redraw
  history.replaceState(null, '', location.pathname + location.search);
  route();
}

/**
 * What: jump to another update from the detail pager without stacking history.
 * In:  id (string)
 * Out: —
 */
function go(id) {
  history.replaceState({ fromHome: true }, '', `#/avance/${id}`);
  route();
}

// mark history entries pushed from home so back() can pop them
window.addEventListener('hashchange', () => { if (routeId() && !history.state) history.replaceState({ fromHome: true }, ''); });

/**
 * What: toggle ES ⇄ EN and redraw everything with the new strings.
 * In:  —
 * Out: —
 */
function toggleLang() {
  setLang(getLang() === 'es' ? 'en' : 'es');
  renderHome(notifOn());
  refreshDetail();
}

// --- boot --------------------------------------------------------------------------
apply();
initHome({ open, bell: openSheet, lang: toggleLang });
initDetail({ back, go });
initSheet({ change: setBell });
setBell(notifOn());
// a deep link straight to a detail has no home entry behind it
if (routeId()) history.replaceState(null, '', location.href);
route();

// --- offline support (only on https or localhost) -----------------------------
if ('serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {}); });
}
