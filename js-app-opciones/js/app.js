/* =========================================================================
   app.js — boot for "Opciones" (Js Interiorismo app concept · idea 2)
   - Desktop: the app sits in a phone frame (scaled to fit) + side panel
   - Phone: full screen, safe-area aware, installable PWA (offline shell)
   - One purpose: the client browses every option Jorge offers, saves
     favourites and "sends" them (Demo)
   ========================================================================= */
import { apply, setLang, lang } from './i18n.js';
import { mountCatalog } from './screens/catalog.js';

// --- device frame (desktop) ----------------------------------------------------
const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const frameMQ = window.matchMedia('(min-width: 760px) and (min-height: 620px)');

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
    // 868 = frame height; leave breathing room around it
    const s = Math.min(1, (window.innerHeight - 48) / 884, (window.innerWidth * 0.5) / 430);
    document.documentElement.style.setProperty('--frame-scale', s.toFixed(3));
  }
}
window.addEventListener('resize', layout);
layout();

/**
 * What: keep the decorative status-bar clock (framed mode) current.
 * In:  —
 * Out: —
 */
function clock() {
  const d = new Date();
  const el = document.querySelector('.sb-time');
  if (el) el.textContent = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}
clock(); setInterval(clock, 30000);

/**
 * What: paint the ES/EN toggles to match the current language.
 * In:  —
 * Out: —
 */
function paintLang() {
  document.querySelectorAll('.lang b').forEach((b) => b.classList.toggle('on', b.dataset.l === lang()));
}

// --- mount the one screen, then translate everything --------------------------
mountCatalog(document.getElementById('screens'));
apply();
paintLang();
document.addEventListener('click', (e) => {
  // any ES/EN pill flips the language
  if (!e.target.closest('.lang')) return;
  setLang(lang() === 'es' ? 'en' : 'es');
  paintLang();
});

// --- offline shell (only on http(s), never blocks the app) --------------------
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
