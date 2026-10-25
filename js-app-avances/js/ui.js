/* =========================================================================
   ui.js — small shared helpers: icons, HTML escaping, toast, demo "today"
   ========================================================================= */

// --- inline SVG icons (stroke = currentColor) --------------------------------
const P = 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';
export const ICON = {
  bell: `<svg width="19" height="19" viewBox="0 0 24 24" ${P} aria-hidden="true"><path d="M6 9.5a6 6 0 0 1 12 0c0 5 2 6.5 2 6.5H4s2-1.5 2-6.5"/><path d="M10 19.5a2.2 2.2 0 0 0 4 0"/></svg>`,
  bellLg: `<svg width="26" height="26" viewBox="0 0 24 24" ${P} aria-hidden="true"><path d="M6 9.5a6 6 0 0 1 12 0c0 5 2 6.5 2 6.5H4s2-1.5 2-6.5"/><path d="M10 19.5a2.2 2.2 0 0 0 4 0"/></svg>`,
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  back: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>`,
  photos: `<svg width="13" height="13" viewBox="0 0 24 24" ${P} aria-hidden="true"><rect x="3" y="5" width="15" height="13" rx="2.5"/><path d="M7 21h12a2 2 0 0 0 2-2V8"/><path d="M3 14l4-4 5 5 2-2 4 4"/></svg>`,
  arrow: `<svg width="18" height="18" viewBox="0 0 24 24" ${P} aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  next: `<svg width="20" height="20" viewBox="0 0 24 24" ${P} aria-hidden="true"><path d="M4 12h11"/><path d="M11 6l6 6-6 6"/><path d="M20 5v14"/></svg>`,
  info: `<svg width="14" height="14" viewBox="0 0 24 24" ${P} aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>`
};

// --- the demo "today" ----------------------------------------------------------
// Relative labels ("Ayer", "Hace 4 días") are measured from a fixed demo date,
// so the prototype reads the same whenever it is opened.
export const DEMO_TODAY = '2026-10-25';

/**
 * What: whole days between two ISO dates.
 * In:  a, b (strings 'YYYY-MM-DD')
 * Out: number of days from a to b
 */
export function daysBetween(a, b) {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 864e5);
}

/**
 * What: escape text before it goes into innerHTML.
 * In:  s (any)
 * Out: safe string
 */
export function esc(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

// --- toast ------------------------------------------------------------------------
let toastTimer = 0;
/**
 * What: show a short message at the bottom of the app.
 * In:  msg (string)
 * Out: —
 */
export function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  // hide again after a beat; a new toast restarts the timer
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

/**
 * What: light haptic tick where the device supports it (Android); silent elsewhere.
 * In:  ms (number)
 * Out: —
 */
export function tick(ms = 8) {
  try { if (navigator.vibrate && navigator.userActivation?.isActive) navigator.vibrate(ms); } catch { /* unsupported */ }
}
