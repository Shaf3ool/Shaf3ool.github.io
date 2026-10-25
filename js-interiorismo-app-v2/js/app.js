/* =========================================================================
   app.js — boot + navigation for the Js Interiorismo app prototype (v2)
   - Desktop: the app runs inside a phone frame (scaled to fit), side panel
   - Phone: full screen, safe-area aware, installable (PWA)
   - Tabs: Inspiración · Mis diseños · (+ Diseñar) · Agenda · Estudio
   - Planner opens as a pushed screen; AR opens as a layer over it
   ========================================================================= */
import { t, apply, onLang } from './i18n.js';
import { h, icon, sheet } from './ui.js';
import { FINISHES } from './data.js';
import { get, update, designFromTemplate, saveDesign } from './store.js';
import { mountInspiration } from './screens/inspiration.js';
import { mountDesigns } from './screens/designs.js';
import { mountAgenda } from './screens/agenda.js';
import { mountStudio } from './screens/studio.js';
import { showOnboarding } from './screens/onboarding.js';
import { planThumb } from './screens/thumb.js';

const app = document.getElementById('app');
const screensHost = document.getElementById('screens');
const pushHost = document.getElementById('push');
const tabbar = document.getElementById('tabbar');

// --- finish colour tokens for small dots (CSS vars) ------------------------
FINISHES.forEach((f) => document.documentElement.style.setProperty('--f-' + f.key, f.tone));

// --- device frame (desktop) ----------------------------------------------
const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const frameMQ = window.matchMedia('(min-width: 760px) and (min-height: 620px)');

/**
 * What: switch between framed (desktop) and full-screen (phone) layouts and
 *       scale the phone frame to fit the window height.
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

// --- status bar clock (framed mode only, purely decorative) --------------
/**
 * What: update the fake iOS status bar time.
 * In:  —
 * Out: —
 */
function clock() {
  const d = new Date();
  const el = document.querySelector('.sb-time');
  if (el) el.textContent = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}
clock(); setInterval(clock, 30000);

// --- tabs ----------------------------------------------------------------
const ctx = {
  startNew, newDesign, openDesign,
  goDesigns: () => showTab('designs'),
  install, isStandalone: () => standalone,
};
const screens = {
  inspo: mountInspiration(screensHost, ctx),
  designs: mountDesigns(screensHost, ctx),
  agenda: mountAgenda(screensHost),
  studio: mountStudio(screensHost, ctx),
};
let current = null;
screens.studio.el.querySelector('.scroll').addEventListener('scroll', (e) => {
  app.classList.toggle('dark-top', current === 'studio' && e.target.scrollTop < 300);
}, { passive: true });

/**
 * What: show one tab screen with a soft cross-fade.
 * In:  name ('inspo' | 'designs' | 'agenda' | 'studio')
 * Out: —
 */
function showTab(name) {
  if (current === name) { screens[name].el.querySelector('.scroll').scrollTo({ top: 0, behavior: 'smooth' }); return; }
  Object.entries(screens).forEach(([k, s]) => s.el.classList.toggle('active', k === name));
  tabbar.querySelectorAll('[data-tab]').forEach((b) => {
    const on = b.dataset.tab === name;
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  current = name;
  // light status bar text over the studio's photo header (framed mode)
  app.classList.toggle('dark-top', name === 'studio' && screens.studio.el.querySelector('.scroll').scrollTop < 300);
}
tabbar.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.tab) showTab(b.dataset.tab);
  if (b.dataset.act === 'new') startNew();
});

// --- new design flow ---------------------------------------------------
/**
 * What: open the "Nuevo diseño" sheet with the four templates.
 * In:  —
 * Out: —
 */
function startNew() {
  const tpls = ['sala', 'recamara', 'cocina', 'blanco'];
  const c = h(`
    <div class="newd">
      <h3>${t('nd.title')}</h3>
      <p class="muted">${t('nd.sub')}</p>
      <div class="tpl-grid">${tpls.map((k) => `
        <button class="tpl" data-tpl="${k}">
          <span class="tpl-art">${planThumb(designFromTemplate(k, ''))}</span>
          <b>${t('tpl.' + k)}</b><span>${t('tpl.' + k + '.p')}</span>
        </button>`).join('')}</div>
    </div>`);
  const s = sheet(c);
  c.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tpl]'); if (!b) return;
    s.close();
    setTimeout(() => newDesign(b.dataset.tpl), 240);
  });
}

/**
 * What: create a design from a template (optionally with a palette) and open it.
 * In:  tpl (template key), palette ([floor, wall] | undefined), from (project title)
 * Out: —
 */
function newDesign(tpl, palette, from) {
  const name = from ? `${t('tpl.' + tpl)} · ${from}` : `${t('tpl.' + tpl)} ${get().designs.length + 1}`;
  const d = designFromTemplate(tpl, name);
  if (palette) { d.floor = palette[0]; d.wall = palette[1]; }
  saveDesign(d);
  openPlanner(d);
}

/**
 * What: open a saved design in the planner (works on a copy).
 * In:  id (design id)
 * Out: —
 */
function openDesign(id) {
  const d = get().designs.find((x) => x.id === id);
  if (d) openPlanner(JSON.parse(JSON.stringify(d)));
}

// --- pushed planner screen ---------------------------------------------
let planner = null;

/**
 * What: lazy-load the planner module and slide it in over the tabs.
 * In:  design (object)
 * Out: Promise<void>
 */
async function openPlanner(design) {
  const { mountPlanner } = await import('./screens/planner.js');
  if (planner) planner.destroy();
  pushHost.classList.add('show');
  app.classList.add('pushed');
  planner = mountPlanner(pushHost, design, {
    close: closePlanner,
    goDesigns: () => showTab('designs'),
    openAR: async (type) => {
      const { openAR } = await import('./ar.js');
      planner && planner.pause(true);
      openAR(type, { onClose: () => planner && planner.pause(false) });
    },
  });
  apply(planner.el);
  requestAnimationFrame(() => requestAnimationFrame(() => planner && planner.el.classList.add('in')));
}

/**
 * What: slide the planner out and free it.
 * In:  —
 * Out: —
 */
function closePlanner() {
  if (!planner) return;
  const p = planner; planner = null;
  p.el.classList.remove('in');
  app.classList.remove('pushed');
  setTimeout(() => { p.destroy(); pushHost.classList.remove('show'); }, 420);
}

// --- install (PWA) -----------------------------------------------------
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => { deferredPrompt = e; });

/**
 * What: trigger the browser install prompt when the browser offers one.
 * In:  —
 * Out: Promise<boolean> (true if a prompt was shown)
 */
async function install() {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice.catch(() => null);
  deferredPrompt = null;
  return true;
}

// --- service worker (offline shell; scope = this folder) -----------------
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {}); });
}

// --- static strings + first launch -------------------------------------
apply(document);
onLang(() => clock());
showTab('inspo');
document.body.classList.add('ready');
if (!get().onboarded && !new URLSearchParams(location.search).has('skip')) {
  showOnboarding(() => update((s) => { s.onboarded = true; }));
}
// deep links used for QA / demos: ?screen=planner|designs|agenda|studio|ar
const q = new URLSearchParams(location.search).get('screen');
if (q === 'planner' || q === 'ar') {
  const d = get().designs[0];
  if (d) openDesign(d.id);
  if (q === 'ar') setTimeout(() => planner && planner.el.querySelector('[data-act=ar]').click(), 900);
} else if (q && screens[q]) showTab(q);
