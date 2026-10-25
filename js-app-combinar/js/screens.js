/* =========================================================================
   screens.js — the two list/detail screens:
   • Home: the projects (3 Demos + imported), import entry, how it works
   • Project: the three orthographic views + "Combinar vistas"
   ========================================================================= */
import { t, getLang, setLang } from './i18n.js';
import { listProjects, getProject, deleteImported } from './store.js';
import { cardSVG, buildIso, axoSVG, fmt } from './render.js';
import { ICON, esc, toast } from './ui.js';

let current = null;          // project shown on the Project screen
let hooks = {};              // callbacks from main.js (open merge / edit / import)

/**
 * What: register navigation callbacks.
 * In:   h — { onMerge(project), onEdit(project), onImport() }
 * Out:  —
 */
export function setHooks(h) {
  hooks = h;
}

/**
 * What: project display name in the current language.
 * In:   p — project
 * Out:  string
 */
export function pname(p) {
  if (!p.name) return t('i.untitled');
  return typeof p.name === 'string' ? p.name : (p.name[getLang()] || p.name.es);
}

/**
 * What: room size line, e.g. "4.20 × 3.80 × 2.70 m".
 * In:   room
 * Out:  string
 */
function dims(room) {
  return `${(room.w / 100).toFixed(2)} × ${(room.l / 100).toFixed(2)} × ${(room.h / 100).toFixed(2)} m`;
}

/**
 * What: status pill for a project (Demo / Editado / Importado).
 * In:   p — project
 * Out:  HTML string
 */
function pill(p) {
  if (p.imported) return `<span class="pill ink">${t('pill.imported')}</span>`;
  return `<span class="pill">${t('pill.demo')}</span>${p.edited ? `<span class="pill olive">${t('pill.edited')}</span>` : ''}`;
}

/**
 * What: render the Home screen.
 * In:   —
 * Out:  —
 */
export function renderHome() {
  const el = document.getElementById('home');
  const all = listProjects();
  const demos = all.filter((p) => !p.imported), mine = all.filter((p) => p.imported);
  // one card per project with a live mini isometric
  const card = (p) => `<button class="pcard" data-open="${esc(p.id)}">
      <div class="thumb">${axoSVG(buildIso(p, 0), p, { W: 132, H: 112, pad: 7, labels: false })}${p.ref ? `<img class="ref" src="${p.ref}" alt="${t('card.ref')} · © Jorge Santana" title="${t('card.ref')} · © Jorge Santana" loading="lazy" decoding="async" width="28" height="28">` : ''}</div>
      <div><h3>${esc(pname(p))}</h3><p class="dims">${dims(p.room)}</p>
      <div class="meta">${pill(p)}<span class="pill ink">${p.items.length} ${t('card.pieces')}</span></div></div>
      ${p.imported ? `<span class="del" role="button" tabindex="0" data-del="${esc(p.id)}" aria-label="${t('del.confirm')}">${ICON.trash}</span>` : ''}
    </button>`;
  el.innerHTML = `<div class="home-in">
    <div class="topbar"><div class="who"><span class="mini-mark">Js<i>.</i></span><span class="kicker">${t('home.kicker')}</span></div>
      <div class="lang" role="group" aria-label="Idioma / Language"><button data-lang="es" aria-pressed="${getLang() === 'es'}">ES</button><button data-lang="en" aria-pressed="${getLang() === 'en'}">EN</button></div></div>
    <h1 class="hero-t">${t('home.title')}</h1>
    <p class="hero-s">${t('home.sub')}</p>
    <div class="sec-h"><h2>${t('home.projects')}</h2><span>${demos.length} · Demo</span></div>
    ${demos.map(card).join('')}
    ${mine.length ? `<div class="sec-h"><h2>${t('home.mine')}</h2><span>${mine.length}</span></div>${mine.map(card).join('')}` : ''}
    <button class="import-card" data-import><span class="ic-round">${ICON.file}</span><span><b>${t('home.import')}</b><span>${t('home.importSub')}</span></span></button>
    <section class="how"><h3>${t('home.how')}</h3><ol><li>${t('home.how1')}</li><li>${t('home.how2')}</li><li>${t('home.how3')}</li></ol></section>
    <p class="foot">${t('foot.concept')} · ${t('foot.renders')}<br>${t('foot.pwa')}</p>
  </div>`;
  // wiring: open project, delete import, language, import
  el.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', (e) => {
    const del = e.target.closest('[data-del]');
    if (del) { e.stopPropagation(); deleteImported(del.dataset.del); toast(t('del.done')); renderHome(); return; }
    openProject(b.dataset.open);
  }));
  el.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => { setLang(b.dataset.lang); refreshAll(); }));
  el.querySelector('[data-import]').addEventListener('click', () => hooks.onImport && hooks.onImport());
}

/**
 * What: open the Project screen for a project id.
 * In:   id
 * Out:  —
 */
export function openProject(id) {
  current = getProject(id);
  if (!current) return;
  renderProject();
  const scr = document.getElementById('project');
  scr.scrollTop = 0;
  scr.classList.add('open');
  scr.setAttribute('aria-hidden', 'false');
  document.getElementById('home').classList.add('behind');
}

/**
 * What: close the Project screen (back to Home).
 * In:   —
 * Out:  —
 */
export function closeProject() {
  const scr = document.getElementById('project');
  scr.classList.remove('open');
  scr.setAttribute('aria-hidden', 'true');
  document.getElementById('home').classList.remove('behind');
  renderHome();
}

/**
 * What: render the Project screen: three view cards + merge CTA.
 * In:   —
 * Out:  —
 */
export function renderProject() {
  const p = current, el = document.getElementById('project');
  if (!p) return;
  const vcard = (view, n, sub) => `<article class="vcard"><header><span class="vt"><b>${n}</b>${t('v.' + view)}</span><span class="vs">${sub}</span></header>${cardSVG(p, view)}</article>`;
  el.innerHTML = `<div class="navbar"><button class="icon-btn" data-back aria-label="${t('back')}">${ICON.back}</button><div class="nt">${esc(pname(p))}</div><button class="text-btn" data-edit>${t('p.edit')}</button></div>
    <div class="p-in">
      <div class="p-head"><span class="kicker">${t('p.views')}</span><span>${pill(p)}</span></div>
      ${vcard('plan', 1, dims(p.room))}
      <div class="vrow">${vcard('front', 2, fmt(p.room.w))}${vcard('side', 3, fmt(p.room.l))}</div>
      <p class="foot">${t('foot.concept')} · ${t('foot.renders')}</p>
    </div>
    <div class="cta-dock"><button class="cta" data-merge><span class="ci">${ICON.merge}</span><span><b>${t('p.merge')}</b><span>${t('p.mergeSub')}</span></span><span class="arr">${ICON.arrow}</span></button></div>`;
  el.querySelector('[data-back]').addEventListener('click', closeProject);
  el.querySelector('[data-edit]').addEventListener('click', () => hooks.onEdit && hooks.onEdit(current));
  el.querySelector('[data-merge]').addEventListener('click', () => hooks.onMerge && hooks.onMerge(current));
}

/**
 * What: replace the current project (after an edit) and redraw.
 * In:   p — project
 * Out:  —
 */
export function setCurrent(p) {
  current = p;
  renderProject();
}

/**
 * What: re-render everything visible (after a language change).
 * In:   —
 * Out:  —
 */
export function refreshAll() {
  renderHome();
  if (current && document.getElementById('project').classList.contains('open')) renderProject();
  if (hooks.onLang) hooks.onLang();
}
