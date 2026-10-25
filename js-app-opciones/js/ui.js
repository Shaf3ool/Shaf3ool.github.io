/* =========================================================================
   ui.js — small DOM helpers: element builder, icons, toast, bottom sheet,
   and the shared "media" block (real render photo or material swatch)
   ========================================================================= */
import { finishURL } from './textures.js';
import { PROJECTS } from './data.js';
import { L } from './i18n.js';

/**
 * What: escape text for safe insertion into HTML.
 * In:  s (any)
 * Out: string
 */
export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/**
 * What: build one element from an HTML string.
 * In:  html (string with a single root element)
 * Out: Element
 */
export function h(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

// --- icon paths (24 × 24, stroke) --------------------------------------------
const P = {
  heart: '<path d="M12 20.3s-7.6-4.6-9.2-9.4C1.7 7.6 3.9 4.4 7.2 4.4c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.3 0 5.5 3.2 4.4 6.5-1.6 4.8-9.2 9.4-9.2 9.4z"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  send: '<path d="M4 12l16-8-6 16-2.6-6.4L4 12z"/><path d="M11.4 13.6L20 4"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.2"/>',
  trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 12.5h8L17 7"/>',
  chevron: '<path d="M9 5l7 7-7 7"/>',
};

/**
 * What: inline SVG icon markup.
 * In:  name (key of P), size (px), cls (extra class)
 * Out: string
 */
export function icon(name, size = 22, cls = '') {
  return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;
}

/**
 * What: the visual of an item — a lazy <img> of Jorge's render, or a
 *       code-drawn material swatch with a soft light sheen.
 * In:  it (item), big (bool: detail-sheet size)
 * Out: HTML string
 */
export function media(it, big = false) {
  if (it.kind === 'photo') {
    // small webp for cards; full size joins the srcset for the detail sheet
    const sm = `img/${it.src}-sm.webp`, lg = `img/${it.src}.webp`;
    const srcset = big ? ` srcset="${sm} 900w, ${lg} 1440w" sizes="(max-width: 500px) 100vw, 390px"` : '';
    const alt = esc(L(it.name) + ' · ' + (PROJECTS[it.seen] || ''));
    return `<img class="media-img" src="${sm}"${srcset} alt="${alt}" loading="${big ? 'eager' : 'lazy'}" decoding="async" style="object-position:${it.pos || '50% 50%'}">`;
  }
  // swatch: texture data URL drawn once per finish and cached
  const url = finishURL(it.src, 512);
  return `<div class="media-swatch" role="img" aria-label="${esc(L(it.name))}" style="background-image:url(${url})"></div>`;
}

// --- toast ----------------------------------------------------------------------
let toastTimer = 0;

/**
 * What: show a short self-dismissing message.
 * In:  text (string), iconName (string)
 * Out: —
 */
export function toast(text, iconName = 'check') {
  const host = document.getElementById('toast');
  host.innerHTML = `${icon(iconName, 17)}<span>${esc(text)}</span>`;
  host.classList.add('show');
  // restart the hide timer on every call
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => host.classList.remove('show'), 1900);
}

/**
 * What: open a modal bottom sheet with scrim tap + drag-down to dismiss.
 * In:  contentEl (Element), opts { cls: extra class, onClose: fn, label: aria-label }
 * Out: { el, close() }
 */
export function sheet(contentEl, opts = {}) {
  const layer = document.getElementById('layers');
  const wrap = h(`<div class="sheet-wrap"><div class="sheet-scrim"></div><div class="sheet ${opts.cls || ''}" role="dialog" aria-modal="true" aria-label="${esc(opts.label || '')}"><div class="grabber" aria-hidden="true"></div></div></div>`);
  const panel = wrap.querySelector('.sheet');
  panel.appendChild(contentEl);
  layer.appendChild(wrap);
  // two frames later the CSS transition can run
  requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('open')));
  let closed = false;

  /**
   * What: animate the sheet away, then remove it from the DOM.
   * In:  —
   * Out: —
   */
  function close() {
    if (closed) return; closed = true;
    wrap.classList.remove('open');
    panel.style.transform = '';
    setTimeout(() => { wrap.remove(); if (opts.onClose) opts.onClose(); }, 420);
  }
  wrap.querySelector('.sheet-scrim').addEventListener('click', close);
  // Escape closes on desktop
  const onKey = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);
  // drag down from the top area (grabber + media) to dismiss
  let y0 = null, dy = 0;
  panel.addEventListener('pointerdown', (e) => {
    if (panel.scrollTop > 0 || !e.target.closest('.grabber, .drag-zone')) return;
    y0 = e.clientY; dy = 0; panel.style.transition = 'none';
  });
  panel.addEventListener('pointermove', (e) => {
    if (y0 === null) return;
    dy = Math.max(0, e.clientY - y0); panel.style.transform = `translateY(${dy}px)`;
  });
  // release: close past a threshold, otherwise spring back
  const end = () => {
    if (y0 === null) return;
    panel.style.transition = ''; y0 = null;
    if (dy > 110) close(); else panel.style.transform = '';
  };
  panel.addEventListener('pointerup', end);
  panel.addEventListener('pointercancel', end);
  return { el: panel, close };
}
