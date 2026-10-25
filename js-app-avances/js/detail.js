/* =========================================================================
   detail.js — the pushed detail view of one update: swipeable photo gallery,
   status text, "Lo que sigue", and older/newer navigation.
   ========================================================================= */
import { t, L, fmtDate } from './i18n.js';
import { ICON, esc, tick } from './ui.js';
import { sortedUpdates } from './home.js';

// --- module state -------------------------------------------------------------
const root = document.getElementById('detail');
let current = null;          // the update shown
let onBack = () => {};       // set by app.js
let onGo = () => {};         // set by app.js: show another update (replace)

/**
 * What: wire callbacks from app.js and the delegated click handler.
 * In:  handlers { back(), go(id) }
 * Out: —
 */
export function initDetail(handlers) {
  ({ back: onBack, go: onGo } = handlers);
  root.addEventListener('click', onClick);
  enableEdgeSwipe();
}

/**
 * What: route clicks inside the detail view.
 * In:  e (MouseEvent)
 * Out: —
 */
function onClick(e) {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  // back button, a thumbnail, or the older/newer pager
  if (btn.dataset.act === 'back') onBack();
  else if (btn.dataset.act === 'thumb') goToSlide(Number(btn.dataset.i));
  else if (btn.dataset.act === 'go') onGo(btn.dataset.id);
}

/**
 * What: draw the detail view for one update.
 * In:  id (string) — update id
 * Out: boolean — false if the id is unknown
 */
export function showDetail(id) {
  const list = sortedUpdates();
  const i = list.findIndex((u) => u.id === id);
  if (i < 0) return false;
  current = list[i];
  const u = current;
  const newer = list[i - 1], older = list[i + 1];
  // gallery slides: full-size renders, first one eager
  const slides = u.photos.map((p, k) => `<div class="d-slide"><img src="${p.src}" alt="${esc(L(u.title))} · ${k + 1}" decoding="async" ${k ? 'loading="lazy"' : ''}></div>`).join('');
  const dots = u.photos.length > 1 ? `<div class="d-dots" aria-hidden="true">${u.photos.map((_, k) => `<i class="${k ? '' : 'on'}"></i>`).join('')}</div>` : '';
  const thumbs = u.photos.length > 1 ? `<div class="d-thumbs">${u.photos.map((p, k) => `<button data-act="thumb" data-i="${k}" aria-current="${k === 0}" aria-label="${t('d.of', { i: k + 1, n: u.photos.length })}"><img src="${p.sm}" alt="" loading="lazy" decoding="async"></button>`).join('')}</div>` : '';
  root.innerHTML = `<div class="scroll">
    <div class="d-gallery">
      <div class="d-track">${slides}</div>
      <div class="d-nav">
        <button class="glass" data-act="back" aria-label="${t('d.back')}">${ICON.back}<span>${t('d.back')}</span></button>
        <span class="glass count">${t('d.of', { i: 1, n: u.photos.length })}</span>
      </div>
      ${dots}
    </div>
    <div class="d-sheet">
      <div class="d-meta"><span class="tag ${u.phase}">${t('ph.' + u.phase)}</span><span>${fmtDate(u.date, { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
      <h2 class="d-title">${esc(L(u.title))}</h2>
      <p class="d-text">${esc(L(u.text))}</p>
      <p class="d-note">${ICON.info}<span>${t('d.photoNote')}</span></p>
      ${thumbs}
      <div class="d-next"><span class="ico">${ICON.next}</span><div><span>${t('d.next')}</span><b>${esc(L(u.next))}</b></div></div>
      <div class="d-by"><span class="brand-mark av">Js<i>.</i></span><div><b>${t('d.by')}</b><span>${t('d.byNote')}</span></div></div>
      <div class="d-pager">
        ${pagerBtn(older, 'd.prev', '')}
        ${pagerBtn(newer, 'd.newer', 'r')}
      </div>
    </div>
  </div>`;
  // track which slide is visible to update the counter, dots and thumbs
  root.querySelector('.d-track').addEventListener('scroll', onTrackScroll, { passive: true });
  root.setAttribute('aria-hidden', 'false');
  return true;
}

/**
 * What: one older/newer navigation button (disabled at the ends).
 * In:  u (update | undefined), key (i18n key), cls (string)
 * Out: HTML string
 */
function pagerBtn(u, key, cls) {
  if (!u) return `<button class="${cls}" disabled><span>${t(key)}</span><b>—</b></button>`;
  return `<button class="${cls}" data-act="go" data-id="${u.id}"><span>${t(key)}</span><b>${esc(L(u.title))}</b></button>`;
}

/**
 * What: re-draw the current update (after a language switch).
 * In:  —
 * Out: —
 */
export function refreshDetail() {
  if (current) showDetail(current.id);
}

/**
 * What: mark the detail view hidden for assistive tech.
 * In:  —
 * Out: —
 */
export function hideDetail() {
  root.setAttribute('aria-hidden', 'true');
}

/**
 * What: update counter, dots and thumbnails from the gallery's scroll position.
 * In:  —
 * Out: —
 */
function onTrackScroll() {
  const track = root.querySelector('.d-track');
  const i = Math.round(track.scrollLeft / track.clientWidth);
  const n = current.photos.length;
  root.querySelector('.count').textContent = t('d.of', { i: i + 1, n });
  // dots and thumbnails follow the visible slide
  root.querySelectorAll('.d-dots i').forEach((d, k) => d.classList.toggle('on', k === i));
  root.querySelectorAll('.d-thumbs button').forEach((b, k) => b.setAttribute('aria-current', String(k === i)));
}

/**
 * What: scroll the gallery to a given slide (from a thumbnail tap).
 * In:  i (number)
 * Out: —
 */
function goToSlide(i) {
  const track = root.querySelector('.d-track');
  tick();
  track.scrollTo({ left: i * track.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  // bring the gallery into view if the user scrolled down
  root.querySelector('.scroll').scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * What: iOS-style swipe from the left edge to go back.
 * In:  —
 * Out: —
 */
function enableEdgeSwipe() {
  let x0 = null, y0 = 0, dx = 0, locked = false;
  root.addEventListener('pointerdown', (e) => {
    // only touches that start at the very left edge
    const left = root.getBoundingClientRect().left;
    if (e.pointerType === 'mouse' || e.clientX - left > 28) return;
    x0 = e.clientX; y0 = e.clientY; dx = 0; locked = false;
  });
  root.addEventListener('pointermove', (e) => {
    if (x0 === null) return;
    dx = Math.max(0, e.clientX - x0);
    // decide once: horizontal swipe, or let the page scroll
    if (!locked && Math.abs(e.clientY - y0) > 12 && dx < 12) { x0 = null; return; }
    if (dx > 8) { locked = true; root.classList.add('dragging'); root.style.transform = `translateX(${dx}px)`; }
  });
  const end = () => {
    if (x0 === null) return;
    root.classList.remove('dragging');
    root.style.transform = '';
    // past a third of the width counts as "back"
    if (locked && dx > root.clientWidth / 3) onBack();
    x0 = null;
  };
  root.addEventListener('pointerup', end);
  root.addEventListener('pointercancel', end);
}
