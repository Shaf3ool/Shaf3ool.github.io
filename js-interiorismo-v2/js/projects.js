/* ==========================================================
   projects.js — filterable project index + sticky large viewer
   + full-screen lightbox. Data: data.js (his 16 real projects).
   ========================================================== */
import { PROJECTS } from './data.js';
import { t, lang, onLang } from './i18n.js';

const FILTERS = ['all', 'banos', 'cocinas', 'recamaras', 'comercial', 'exterior'];
let filter = 'all';
let active = 0;           // index into PROJECTS of the project in the viewer
let lbProject = 0, lbImage = 0; // lightbox position
let lastFocus = null;

/* What: two-digit counter text. In: number. Out: "01" style string */
const nn = (n) => String(n).padStart(2, '0');

/* What: the visible list of projects for the current filter.
   In: nothing. Out: array of PROJECTS indices */
function visibleIdx() {
  return PROJECTS.map((p, i) => i).filter((i) => filter === 'all' || PROJECTS[i].filter === filter);
}

/* What: render the filter chips with counts.
   In: root element. Out: nothing */
function renderFilters(root) {
  root.innerHTML = '';
  FILTERS.forEach((f) => {
    const count = f === 'all' ? PROJECTS.length : PROJECTS.filter((p) => p.filter === f).length;
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', String(f === filter));
    b.dataset.f = f;
    b.innerHTML = `${t('f.' + f)}<sup>${count}</sup>`;
    b.addEventListener('click', () => setFilter(f));
    root.appendChild(b);
  });
}

/* What: render the index rows (title, category, year, thumbnail on mobile).
   In: list element. Out: nothing */
function renderIndex(list) {
  const L = lang();
  list.innerHTML = '';
  PROJECTS.forEach((p, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'irow';
    b.dataset.i = i;
    b.dataset.cursor = 'ver';
    b.innerHTML = `
      <img class="irow__thumb" src="${p.images[0].sm}" width="900" height="${Math.round(900 * p.images[0].h / p.images[0].w)}" loading="lazy" alt="">
      <span class="irow__n">${nn(i + 1)}</span>
      <span><span class="irow__t">${p.title[L]}</span><span class="irow__c">${p.category[L]}</span></span>
      <span class="irow__y">${p.year}</span>`;
    // desktop: hover previews in the viewer; click (all devices) opens the lightbox
    b.addEventListener('mouseenter', () => show(i));
    b.addEventListener('focus', () => show(i));
    b.addEventListener('click', () => openLb(i, 0));
    li.appendChild(b);
    list.appendChild(li);
  });
  applyFilterToRows(list);
}

/* What: hide rows outside the active filter. In: list element. Out: nothing */
function applyFilterToRows(list) {
  list.querySelectorAll('.irow').forEach((r) => {
    const p = PROJECTS[+r.dataset.i];
    r.parentElement.hidden = !(filter === 'all' || p.filter === filter);
    r.classList.toggle('is-active', +r.dataset.i === active);
  });
}

/* What: switch filter and refresh rows + viewer. In: filter key. Out: nothing */
function setFilter(f) {
  filter = f;
  document.querySelectorAll('[data-filters] button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.f === f)));
  applyFilterToRows(document.querySelector('[data-index]'));
  const vis = visibleIdx();
  if (!vis.includes(active)) show(vis[0]);
  if (window.ScrollTrigger) window.ScrollTrigger.refresh();
}

/* What: show one project in the sticky viewer (crossfade).
   In: project index, force flag. Out: nothing */
function show(i, force = false) {
  if (i === active && !force) return;
  active = i;
  const p = PROJECTS[i], L = lang();
  const img = document.querySelector('[data-viewer-img]');
  document.querySelectorAll('.irow').forEach((r) => r.classList.toggle('is-active', +r.dataset.i === i));
  document.querySelector('[data-viewer-title]').textContent = p.title[L];
  document.querySelector('[data-viewer-meta]').textContent = `${p.category[L].split(' · ')[0]} · ${p.year}`;
  document.querySelector('[data-viewer-text]').textContent = p.text[L];
  const im = p.images[0];
  // preload, then crossfade so the frame never flashes empty
  const next = new Image();
  next.src = im.src;
  img.classList.add('is-swap');
  /* What: put the loaded image into the frame. In: nothing. Out: nothing */
  const swap = () => {
    if (active !== i) return;
    img.src = im.src;
    img.width = im.w; img.height = im.h;
    img.alt = `${p.title[L]} — render © Jorge Santana`;
    requestAnimationFrame(() => img.classList.remove('is-swap'));
  };
  if (next.complete) swap(); else { next.onload = swap; next.onerror = swap; }
}

/* ---------------- Lightbox ---------------- */
const lb = () => document.querySelector('[data-lb]');

/* What: paint the lightbox for the current project/image.
   In: nothing. Out: nothing */
function paintLb() {
  const p = PROJECTS[lbProject], L = lang(), im = p.images[lbImage];
  const img = document.querySelector('[data-lb-img]');
  img.classList.add('is-swap');
  const pre = new Image();
  pre.src = im.src;
  /* What: swap the lightbox image once loaded. In: nothing. Out: nothing */
  const swap = () => {
    img.src = im.src; img.width = im.w; img.height = im.h;
    img.alt = `${p.title[L]} — render © Jorge Santana`;
    requestAnimationFrame(() => img.classList.remove('is-swap'));
  };
  if (pre.complete) swap(); else { pre.onload = swap; pre.onerror = swap; }
  document.querySelector('[data-lb-count]').textContent = `${nn(lbImage + 1)} / ${nn(p.images.length)}`;
  document.querySelector('[data-lb-title]').textContent = p.title[L];
  document.querySelector('[data-lb-meta]').textContent = `${p.category[L]} · ${p.year}`;
  document.querySelector('[data-lb-text]').textContent = p.text[L];
  document.querySelector('[data-lb-src]').href = p.source;
  const single = p.images.length < 2;
  document.querySelector('[data-lb-prev]').hidden = single;
  document.querySelector('[data-lb-next]').hidden = single;
}

/* What: open the lightbox. In: project index, image index. Out: nothing */
function openLb(i, k) {
  lbProject = i; lbImage = k;
  lastFocus = document.activeElement;
  lb().hidden = false;
  const cur = document.querySelector('.cursor');
  if (cur) cur.classList.remove('is-on'); // the bubble never floats over the viewer
  document.documentElement.style.overflow = 'hidden';
  if (window.__lenis) window.__lenis.stop();
  paintLb();
  document.querySelector('[data-lb-close]').focus({ preventScroll: true });
}

/* What: close the lightbox and restore focus. In: nothing. Out: nothing */
function closeLb() {
  lb().hidden = true;
  document.documentElement.style.overflow = '';
  if (window.__lenis) window.__lenis.start();
  if (lastFocus) lastFocus.focus({ preventScroll: true });
}

/* What: step images inside the project (wraps). In: +1 / -1. Out: nothing */
function stepImg(d) {
  const n = PROJECTS[lbProject].images.length;
  lbImage = (lbImage + d + n) % n;
  paintLb();
}

/* What: jump to the next project in the current filter. In: nothing. Out: nothing */
function nextProject() {
  const vis = visibleIdx();
  const pos = vis.indexOf(lbProject);
  lbProject = vis[(pos + 1) % vis.length];
  lbImage = 0;
  paintLb();
}

/* What: wire the whole projects section. In: nothing. Out: nothing */
export function initProjects() {
  const filters = document.querySelector('[data-filters]');
  const list = document.querySelector('[data-index]');
  renderFilters(filters);
  renderIndex(list);
  show(0, true);
  // viewer click → lightbox
  document.querySelector('[data-viewer-open]').addEventListener('click', () => openLb(active, 0));
  // lightbox controls
  document.querySelector('[data-lb-close]').addEventListener('click', closeLb);
  document.querySelector('[data-lb-prev]').addEventListener('click', () => stepImg(-1));
  document.querySelector('[data-lb-next]').addEventListener('click', () => stepImg(1));
  document.querySelector('[data-lb-nextp]').addEventListener('click', nextProject);
  document.addEventListener('keydown', (e) => {
    if (lb().hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowRight') stepImg(1);
    if (e.key === 'ArrowLeft') stepImg(-1);
  });
  // swipe between images on touch
  let sx = 0, sy = 0;
  const stage = document.querySelector('[data-lb-stage]');
  stage.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) stepImg(dx < 0 ? 1 : -1);
  }, { passive: true });
  // re-render on language change
  onLang(() => {
    renderFilters(filters);
    renderIndex(list);
    show(active, true);
    if (!lb().hidden) paintLb();
  });
}
