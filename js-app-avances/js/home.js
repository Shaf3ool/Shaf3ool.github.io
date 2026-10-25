/* =========================================================================
   home.js — the single home screen: project header, progress ring, phase
   timeline and the "Avances" feed (newest first, filterable by phase).
   ========================================================================= */
import { PROJECT, PHASES, UPDATES } from './data.js';
import { t, L, fmtDate } from './i18n.js';
import { ICON, esc, DEMO_TODAY, daysBetween, tick } from './ui.js';

// --- module state ----------------------------------------------------------------
const root = document.getElementById('home');
let filter = 'all';          // 'all' or a phase id
let onOpen = () => {};       // set by app.js: open an update's detail
let onBell = () => {};       // set by app.js: open the notifications sheet
let onLang = () => {};       // set by app.js: toggle the language
let revealObserver = null;

/**
 * What: the feed sorted newest first (a copy; the data stays untouched).
 * In:  —
 * Out: array of update records
 */
export function sortedUpdates() {
  return [...UPDATES].sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * What: wire callbacks from app.js and draw the screen for the first time.
 * In:  handlers { open(id), bell(), lang() }
 * Out: —
 */
export function initHome(handlers) {
  ({ open: onOpen, bell: onBell, lang: onLang } = handlers);
  render();
  // one delegated click handler for the whole screen
  root.addEventListener('click', onClick);
}

/**
 * What: route clicks inside the home screen to their action.
 * In:  e (MouseEvent)
 * Out: —
 */
function onClick(e) {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const act = btn.dataset.act;
  // card → detail, chip → filter, header buttons → sheet / language
  if (act === 'open') onOpen(btn.dataset.id);
  else if (act === 'filter') setFilter(btn.dataset.phase);
  else if (act === 'bell') onBell();
  else if (act === 'lang') onLang();
}

/**
 * What: change the phase filter and redraw only the feed.
 * In:  phase ('all' | phase id)
 * Out: —
 */
function setFilter(phase) {
  if (phase === filter) return;
  filter = phase;
  tick();
  root.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.phase === filter)));
  root.querySelector('.feed').innerHTML = feedHTML();
  observeReveals(true);
}

/**
 * What: reflect the notifications state on the bell (little dot when on).
 * In:  on (boolean)
 * Out: —
 */
export function setBell(on) {
  root.querySelector('[data-act="bell"]')?.classList.toggle('on', on);
}

/**
 * What: draw the whole home screen (used at start and on language change).
 * In:  bellOn (boolean, optional)
 * Out: —
 */
export function render(bellOn = false) {
  const keepScroll = root.querySelector('.scroll')?.scrollTop || 0;
  root.innerHTML = `
    ${topbarHTML(bellOn)}
    <div class="scroll"><div class="home-inner">
      ${heroHTML()}
      ${progressHTML()}
      <div class="feed-head"><h2>${t('f.title')}</h2><span>${t('f.count', { n: UPDATES.length })}</span></div>
      ${chipsHTML()}
      <div class="feed">${feedHTML()}</div>
      ${footHTML()}
    </div></div>`;
  // restore scroll so a language switch does not jump to the top
  const sc = root.querySelector('.scroll');
  sc.scrollTop = keepScroll;
  sc.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  observeReveals(false);
  animateProgress();
}

/**
 * What: top bar with the brand, a compact title (shown once scrolled), EN/ES and the bell.
 * In:  bellOn (boolean)
 * Out: HTML string
 */
function topbarHTML(bellOn) {
  return `<header class="topbar">
      <span class="brand-mark" aria-label="Js Interiorismo">Js<i>.</i></span>
      <span class="mini-title">${esc(L(PROJECT.name))}</span>
      <div class="tb-right">
        <button class="pill-btn" data-act="lang" aria-label="${t('h.langAria')}">${t('h.lang')}</button>
        <button class="pill-btn round${bellOn ? ' on' : ''}" data-act="bell" aria-label="${t('h.bellAria')}">${ICON.bell}<i class="dot"></i></button>
      </div>
    </header>`;
}

/**
 * What: project name block.
 * In:  —
 * Out: HTML string
 */
function heroHTML() {
  return `<div class="kicker">${t('h.kicker')} <span class="demo-tag">${t('h.demo')}</span></div>
    <h1 class="proj-name">${esc(L(PROJECT.name))}</h1>
    <p class="proj-scope">${esc(L(PROJECT.scope))}</p>`;
}

/**
 * What: progress card — % ring, key facts and the 5-phase timeline.
 * In:  —
 * Out: HTML string
 */
function progressHTML() {
  const R = 56, C = 2 * Math.PI * R;
  // ring starts empty; animateProgress() fills it to PROJECT.pct
  const ring = `<div class="ring" role="img" aria-label="${PROJECT.pct}% ${t('p.done')}">
      <svg viewBox="0 0 128 128" aria-hidden="true"><circle class="track" cx="64" cy="64" r="${R}" fill="none" stroke-width="9"/>
      <circle class="bar" cx="64" cy="64" r="${R}" fill="none" stroke-width="9" stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${C.toFixed(2)}" data-c="${C}"/></svg>
      <div class="ring-c"><b><span class="num">0</span><sup>%</sup></b><span>${t('p.done')}</span></div></div>`;
  // the phase timeline: done → now → next
  const nodes = PHASES.map((p) => {
    const st = PROJECT.phaseState[p];
    const dot = st === 'done' ? ICON.check : st === 'now' ? '<i></i>' : '';
    const date = fmtDate(PROJECT.phaseDates[p], { day: 'numeric', month: 'short' });
    return `<div class="ph ${st}" aria-label="${t('ph.' + p)}: ${t('st.' + st)}"><span class="ph-dot">${dot}</span><span class="ph-name">${t('ph.' + p)}</span><span class="ph-date">${date}</span></div>`;
  }).join('');
  return `<section class="prog-card" aria-label="${t('p.phase')}">
      <div class="prog-top">${ring}
        <div class="prog-facts">
          <div class="fact"><span>${t('p.phase')}</span><b class="now">${t('ph.' + PROJECT.phase)}</b></div>
          <div class="fact"><span>${t('p.delivery')}</span><b>${fmtDate(PROJECT.delivery)}</b></div>
          <div class="fact"><span>${t('p.started')}</span><b>${fmtDate(PROJECT.start)}</b></div>
        </div>
      </div>
      <div class="phases"><span class="fill"></span>${nodes}</div>
    </section>`;
}

/**
 * What: phase filter chips, only for phases that have updates.
 * In:  —
 * Out: HTML string
 */
function chipsHTML() {
  const counts = {};
  UPDATES.forEach((u) => { counts[u.phase] = (counts[u.phase] || 0) + 1; });
  const chip = (id, label, n) => `<button class="chip" data-act="filter" data-phase="${id}" aria-pressed="${filter === id}">${label}<b>${n}</b></button>`;
  // "Todo" first, then phases in project order
  return `<div class="chips" role="toolbar">${chip('all', t('f.all'), UPDATES.length)}${PHASES.filter((p) => counts[p]).map((p) => chip(p, t('ph.' + p), counts[p])).join('')}</div>`;
}

/**
 * What: relative label for an update date, measured from the demo "today".
 * In:  iso (string)
 * Out: string, e.g. "Ayer" or "Hace 4 días"
 */
function relLabel(iso) {
  const d = daysBetween(iso, DEMO_TODAY);
  if (d <= 0) return t('f.today');
  if (d === 1) return t('f.yesterday');
  return t('f.daysAgo', { n: d });
}

/**
 * What: the list of update cards for the current filter.
 * In:  —
 * Out: HTML string
 */
function feedHTML() {
  const list = sortedUpdates().filter((u) => filter === 'all' || u.phase === filter);
  if (!list.length) return `<p class="empty">${t('f.empty')}</p>`;
  return list.map((u, i) => {
    const day = fmtDate(u.date, { day: 'numeric' });
    const mon = fmtDate(u.date, { month: 'short' });
    const n = u.photos.length;
    // first card's image loads eagerly; the rest are lazy
    const lazy = i === 0 ? 'fetchpriority="high"' : 'loading="lazy"';
    return `<article class="upd reveal">
      <div class="upd-date" aria-hidden="true"><b>${day}</b><span>${mon}</span></div>
      <button class="upd-card" data-act="open" data-id="${u.id}" aria-label="${esc(L(u.title))} · ${fmtDate(u.date)}">
        <div class="upd-photo">
          <img src="${u.photos[0].sm}" alt="" width="900" height="${Math.round(900 / u.photos[0].ratio)}" decoding="async" ${lazy}>
          <span class="ov tl ${u.phase}"><i class="ph-tag-dot"></i>${t('ph.' + u.phase)}</span>
          ${u.isNew ? `<span class="ov tr">${t('f.new')}</span>` : ''}
          <span class="ov bl">${t('h.demo')}</span>
          <span class="ov br">${ICON.photos}${n === 1 ? t('f.photo') : t('f.photos', { n })}</span>
        </div>
        <div class="upd-body">
          <div class="upd-rel">${relLabel(u.date)} · ${fmtDate(u.date)}</div>
          <h3 class="upd-title">${esc(L(u.title))}</h3>
          <p class="upd-text">${esc(L(u.text))}</p>
        </div>
      </button>
    </article>`;
  }).join('');
}

/**
 * What: footer credits + honesty line.
 * In:  —
 * Out: HTML string
 */
function footHTML() {
  return `<footer class="foot"><b>${t('f.footer1')}</b><p>${t('f.footer2')}</p><p>${t('f.footer3')}</p></footer>`;
}

/**
 * What: make the top bar solid (with compact title) once the big title scrolls away.
 * In:  —
 * Out: —
 */
function onScroll() {
  const sc = root.querySelector('.scroll');
  root.querySelector('.topbar').classList.toggle('solid', sc.scrollTop > 70);
}

/**
 * What: fade cards in as they enter the viewport.
 * In:  immediate (boolean) — true after a filter change (show at once, staggered)
 * Out: —
 */
function observeReveals(immediate) {
  const cards = root.querySelectorAll('.reveal');
  if (immediate || !('IntersectionObserver' in window)) {
    cards.forEach((c, i) => setTimeout(() => c.classList.add('in'), 40 * i));
    return;
  }
  // observe within the scrolling container
  revealObserver?.disconnect();
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); revealObserver.unobserve(en.target); } });
  }, { root: root.querySelector('.scroll'), threshold: 0.12 });
  cards.forEach((c) => revealObserver.observe(c));
}

/**
 * What: fill the ring, count up the % and grow the timeline line.
 * In:  —
 * Out: —
 */
function animateProgress() {
  const bar = root.querySelector('.ring .bar');
  const num = root.querySelector('.ring .num');
  const fill = root.querySelector('.phases .fill');
  const C = Number(bar.dataset.c);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // timeline line reaches the centre of the current phase node
  const idx = PHASES.indexOf(PROJECT.phase);
  const target = (80 * idx) / (PHASES.length - 1);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    bar.style.strokeDashoffset = String(C * (1 - PROJECT.pct / 100));
    fill.style.width = `${target}%`;
  }));
  // count up the number in step with the ring
  if (reduce) { num.textContent = String(PROJECT.pct); return; }
  const t0 = performance.now(), dur = 1300;
  const step = (now) => {
    const k = Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(1 - k, 3);
    num.textContent = String(Math.round(PROJECT.pct * e));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
