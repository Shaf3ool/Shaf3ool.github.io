/* =========================================================================
   ui.js — small UI toolkit: element helper, icon set, toast, bottom sheets
   ========================================================================= */

/**
 * What: create an element from an HTML string.
 * In:  html (string with ONE root element)
 * Out: Element
 */
export function h(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

/**
 * What: escape text for safe HTML interpolation (user-typed names / notes).
 * In:  s (string)
 * Out: escaped string
 */
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// --- Line icon set (24x24, stroke = currentColor) -------------------------
const P = {
  inspo: '<path d="M4 20V10.5a8 8 0 0 1 16 0V20"/><path d="M8.5 20v-6.5a3.5 3.5 0 0 1 7 0V20"/><path d="M3 20h18"/>',
  designs: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M3.5 12h8.5V3.5M12 12v8.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  agenda: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  studio: '<circle cx="12" cy="8.5" r="3.6"/><path d="M5 20c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6"/>',
  heart: '<path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  rotate: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
  place: '<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"/><rect x="8" y="9" width="8" height="6" rx="1.2"/><path d="M8 11.2h8"/>',
  send: '<path d="M20.5 3.5L10 14M20.5 3.5l-6.5 17-4-6.5-6.5-4z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  chev: '<path d="M9 5l7 7-7 7"/>',
  camera: '<path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H8l1.5-2h5L16 6h1.5A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z"/><circle cx="12" cy="12.5" r="3.5"/>',
  ig: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6" fill="currentColor"/>',
  be: '<path d="M3.5 6.5h5a2.8 2.8 0 0 1 0 5.6h-5zM3.5 12.1h5.6a3 3 0 0 1 0 6H3.5zM14 9h6M13.5 14.5h7a3.5 3.5 0 1 0-1 2.4"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  chat: '<path d="M4 18.5V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6.5a3 3 0 0 1-3 3H8.5z"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="M4 7l8 6 8-6"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.5 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.5-3.6-8.5s1.1-5.9 3.6-8.5z"/>',
  download: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
  refresh: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/>',
  video: '<rect x="3.5" y="6.5" width="12" height="11" rx="2.5"/><path d="M15.5 10.5l5-3v9l-5-3"/>',
  home: '<path d="M4 11l8-6.5 8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z"/><path d="M10 20.5v-6h4v6"/>',
  sparkle: '<path d="M12 3.5l1.8 5.2 5.2 1.8-5.2 1.8L12 17.5l-1.8-5.2-5.2-1.8 5.2-1.8z"/><path d="M18.5 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
  layers: '<path d="M12 4l8.5 4.5L12 13 3.5 8.5z"/><path d="M3.5 12.5L12 17l8.5-4.5M3.5 16.5L12 21l8.5-4.5"/>',
  ruler: '<path d="M3.5 15.5L15.5 3.5l5 5-12 12z"/><path d="M7 12l2 2M9.5 9.5l1.5 1.5M12 7l2 2M14.5 4.5l1.5 1.5"/>',
  sofa: '<path d="M5 11V8.5A2.5 2.5 0 0 1 7.5 6h9A2.5 2.5 0 0 1 19 8.5V11"/><path d="M3.5 12.5a1.8 1.8 0 0 1 3.5 0V14h10v-1.5a1.8 1.8 0 0 1 3.5 0V17a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 17zM6 18.5V20M18 18.5V20"/>',
};

/**
 * What: return an inline SVG icon.
 * In:  name (key of P), size (px, default 22), extra class
 * Out: SVG markup string
 */
export function icon(name, size = 22, cls = '') {
  return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;
}

// --- Toast ------------------------------------------------------------------
let toastTimer = 0;

/**
 * What: show a short, self-dismissing message above the tab bar.
 * In:  text (string), iconName (optional)
 * Out: —
 */
export function toast(text, iconName = 'check') {
  const host = document.getElementById('toast');
  host.innerHTML = `${icon(iconName, 18)}<span>${esc(text)}</span>`;
  host.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => host.classList.remove('show'), 2200);
}

// --- Bottom sheets --------------------------------------------------------

/**
 * What: open a modal bottom sheet with drag-to-dismiss.
 * In:  contentEl (Element), opts { tall: bool, onClose: fn }
 * Out: { el, close() }
 */
export function sheet(contentEl, opts = {}) {
  const layer = document.getElementById('layers');
  const wrap = h(`<div class="sheet-wrap"><div class="sheet-scrim"></div><div class="sheet ${opts.tall ? 'tall' : ''}" role="dialog" aria-modal="true"><div class="grabber"></div>${opts.tall ? `<button class="sheet-x" aria-label="Close">${icon('close', 20)}</button>` : ''}</div></div>`);
  const panel = wrap.querySelector('.sheet');
  panel.appendChild(contentEl);
  layer.appendChild(wrap);
  // next frame → animate in
  requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('open')));
  let closed = false;

  /**
   * What: animate the sheet out and remove it.
   * In:  —
   * Out: —
   */
  function close() {
    if (closed) return; closed = true;
    wrap.classList.remove('open');
    panel.style.transform = '';
    setTimeout(() => { wrap.remove(); if (opts.onClose) opts.onClose(); }, 380);
  }
  wrap.querySelector('.sheet-scrim').addEventListener('click', close);
  if (opts.tall) wrap.querySelector('.sheet-x').addEventListener('click', close);
  // drag the grabber area down to dismiss
  let y0 = null, dy = 0;
  const grab = panel.querySelector('.grabber');
  grab.addEventListener('pointerdown', (e) => { y0 = e.clientY; dy = 0; grab.setPointerCapture(e.pointerId); panel.style.transition = 'none'; });
  grab.addEventListener('pointermove', (e) => { if (y0 === null) return; dy = Math.max(0, e.clientY - y0); panel.style.transform = `translateY(${dy}px)`; });
  grab.addEventListener('pointerup', () => {
    if (y0 === null) return;
    panel.style.transition = ''; y0 = null;
    if (dy > 90) close(); else panel.style.transform = '';
  });
  return { el: panel, close };
}

/**
 * What: format a timestamp as a short relative/locale date.
 * In:  ts (ms), lang ('es'|'en')
 * Out: string
 */
export function fmtDate(ts, lang) {
  const d = new Date(ts);
  return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX', { day: 'numeric', month: 'short' });
}
