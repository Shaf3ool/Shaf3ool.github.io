/* =========================================================================
   main.js — boot: layout (phone vs desktop frame), screens, shared links,
   service worker. Js Interiorismo · "Combinar vistas" — concept by Shaf3ool.
   ========================================================================= */
import { apply } from './i18n.js';
import { normalizeProject } from './data.js';
import { renderHome, openProject, setHooks, setCurrent } from './screens.js';
import { openMerge, refreshMerge } from './merge.js';
import { openEditor, openImport } from './editor.js';
import { decodeView } from './share.js';

// --- desktop frame vs full-screen phone ---------------------------------
const frameMQ = matchMedia('(min-width: 900px) and (min-height: 640px)');
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

/**
 * What: switch between framed (desktop) and full-screen (phone) layouts and
 *       scale the phone frame to fit the window.
 * In:   —
 * Out:  —
 */
function layout() {
  const framed = frameMQ.matches && !standalone;
  document.body.classList.toggle('framed', framed);
  if (framed) {
    const s = Math.min(1, (window.innerHeight - 48) / 884, (window.innerWidth * 0.5) / 430);
    document.documentElement.style.setProperty('--frame-scale', s.toFixed(3));
  }
}

/**
 * What: keep the fake status-bar clock current (desktop frame only).
 * In:   —
 * Out:  —
 */
function clock() {
  const d = new Date(), el = document.querySelector('.sb-time');
  if (el) el.textContent = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// --- navigation hooks between screens ------------------------------------
setHooks({
  onMerge: (p) => openMerge(p),
  onEdit: (p) => openEditor(p, (next) => setCurrent(next)),
  onImport: () => openImport((id) => { renderHome(); openProject(id); }),
  onLang: () => refreshMerge(),
});

/**
 * What: open a shared view link (#v=…) straight into the merged view.
 * In:   —
 * Out:  true when a shared view was opened
 */
function openShared() {
  const m = location.hash.match(/^#v=([A-Za-z0-9_-]+)/);
  if (!m) return false;
  const dec = decodeView(m[1]);
  if (!dec) return false;
  const res = normalizeProject(dec.raw);
  if (!res.ok) return false;
  openMerge({ ...res.project, id: 'shared' }, { shared: true, angle: dec.angle });
  return true;
}

// --- boot ------------------------------------------------------------------
layout();
clock();
setInterval(clock, 30000);
window.addEventListener('resize', () => { layout(); refreshMerge(); });
frameMQ.addEventListener('change', layout);
apply(document);
renderHome();
openShared();
window.addEventListener('hashchange', openShared);

// offline support (GitHub Pages is https; localhost for testing)
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {}); });
}
