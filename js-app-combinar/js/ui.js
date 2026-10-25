/* =========================================================================
   ui.js — shared UI helpers: icons, toast, bottom sheets, html escaping.
   ========================================================================= */
import { t } from './i18n.js';

// --- inline icons (stroke = currentColor) ---------------------------------
const P = 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';
export const ICON = {
  back: `<svg width="22" height="22" viewBox="0 0 24 24" ${P}><path d="M15 5l-7 7 7 7"/></svg>`,
  close: `<svg width="20" height="20" viewBox="0 0 24 24" ${P}><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  arrow: `<svg width="20" height="20" viewBox="0 0 24 24" ${P}><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  merge: `<svg width="22" height="22" viewBox="0 0 24 24" ${P}><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/></svg>`,
  rotL: `<svg width="22" height="22" viewBox="0 0 24 24" ${P}><path d="M4 9a8 8 0 1 1-.5 6"/><path d="M4 4v5h5"/></svg>`,
  rotR: `<svg width="22" height="22" viewBox="0 0 24 24" ${P}><path d="M20 9a8 8 0 1 0 .5 6"/><path d="M20 4v5h-5"/></svg>`,
  replay: `<svg width="20" height="20" viewBox="0 0 24 24" ${P}><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M10 9l5 3-5 3z"/></svg>`,
  export: `<svg width="20" height="20" viewBox="0 0 24 24" ${P}><path d="M12 4v11M7 10l5 5 5-5"/><path d="M5 19h14"/></svg>`,
  share: `<svg width="20" height="20" viewBox="0 0 24 24" ${P}><path d="M12 15V4M8 8l4-4 4 4"/><path d="M6 12v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6"/></svg>`,
  plus: `<svg width="22" height="22" viewBox="0 0 24 24" ${P}><path d="M12 5v14M5 12h14"/></svg>`,
  file: `<svg width="22" height="22" viewBox="0 0 24 24" ${P}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>`,
  trash: `<svg width="16" height="16" viewBox="0 0 24 24" ${P}><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/></svg>`,
  info: `<svg width="18" height="18" viewBox="0 0 24 24" ${P}><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>`,
};

/**
 * What: escape text for safe insertion into HTML.
 * In:   s — any value
 * Out:  escaped string
 */
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

let toastTimer = 0;
/**
 * What: show a short message at the top of the app.
 * In:   msg — text
 * Out:  —
 */
export function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

/**
 * What: open a bottom sheet with a title and body markup.
 * In:   title — heading text, body — HTML string, onMount(el, close) — wiring
 * Out:  close() function
 */
export function openSheet(title, body, onMount) {
  const layer = document.getElementById('sheet-layer');
  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  const el = document.createElement('div');
  el.className = 'sheet';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.innerHTML = `<div class="grab"></div><div class="sh-h"><h2>${title}</h2><button class="icon-btn" data-close aria-label="${t('close')}">${ICON.close}</button></div><div class="sh-b">${body}</div>`;
  layer.append(scrim, el);
  // animate in on the next frame
  requestAnimationFrame(() => { scrim.classList.add('open'); el.classList.add('open'); });
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    scrim.classList.remove('open'); el.classList.remove('open');
    setTimeout(() => { scrim.remove(); el.remove(); }, 420);
  };
  scrim.addEventListener('click', close);
  el.querySelector('[data-close]').addEventListener('click', close);
  if (onMount) onMount(el, close);
  return close;
}

/**
 * What: download a Blob as a file.
 * In:   blob, name — file name
 * Out:  —
 */
export function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
