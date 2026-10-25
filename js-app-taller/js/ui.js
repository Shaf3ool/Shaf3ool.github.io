/* =========================================================================
   ui.js: tiny UI helpers: element builder, bottom sheets, toast.
   ========================================================================= */

/**
 * What: create an element from a tag, attributes and an HTML string.
 * In:  tag (string), attrs (object), html (string)
 * Out: HTMLElement
 */
export function h(tag, attrs = {}, html = '') {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  el.innerHTML = html;
  return el;
}

/**
 * What: open a bottom sheet (centred modal on wide screens).
 * In:  inner (HTML string for the sheet body), opts {onOpen(el)}
 * Out: {el, close()}
 */
export function sheet(inner, opts = {}) {
  const host = document.getElementById('sheets');
  const wrap = h('div', { class: 'sheet-wrap', role: 'dialog', 'aria-modal': 'true' },
    `<div class="sheet-scrim"></div><div class="sheet"><div class="grab"></div>${inner}</div>`);
  host.appendChild(wrap);
  // a pending toast would sit on top of the sheet: hide it
  document.getElementById('toast').classList.remove('show');
  // open on the next frame so the CSS transition runs
  requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('open')));
  const close = () => {
    wrap.classList.remove('open');
    setTimeout(() => wrap.remove(), 420);
  };
  // scrim tap and any [data-close] element close the sheet
  wrap.querySelector('.sheet-scrim').addEventListener('click', close);
  wrap.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
  if (opts.onOpen) opts.onOpen(wrap);
  return { el: wrap, close };
}

let toastTimer = 0;
/**
 * What: show a short toast message.
 * In:  msg (string), ms (duration, default 2200)
 * Out: —
 */
export function toast(msg, ms = 2200) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

// --- small inline icons ------------------------------------------------------
export const ICON = {
  x: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  rot: '<svg viewBox="0 0 24 24" width="17" height="17"><path d="M19 12a7 7 0 1 1-2.1-5M19 4v4h-4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  dup: '<svg viewBox="0 0 24 24" width="17" height="17"><rect x="8" y="8" width="11" height="11" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5 15V7a2 2 0 0 1 2-2h8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  del: '<svg viewBox="0 0 24 24" width="17" height="17"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  plus: '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 6v12M6 12h12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  chev: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  img: '<svg viewBox="0 0 24 24" width="19" height="19"><rect x="3.5" y="5" width="17" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m4 16 5-5 4 4 2.5-2.5L20 17" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  vec: '<svg viewBox="0 0 24 24" width="19" height="19"><path d="M5 19 12 5l7 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="5" r="2" fill="currentColor"/><circle cx="5" cy="19" r="2" fill="currentColor"/><circle cx="19" cy="19" r="2" fill="currentColor"/></svg>',
  views: '<svg viewBox="0 0 24 24" width="19" height="19"><rect x="3.5" y="3.5" width="8" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="13" y="3.5" width="7.5" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="3.5" y="13" width="8" height="7.5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  json: '<svg viewBox="0 0 24 24" width="19" height="19"><path d="M8 4c-2 0-2 1.5-2 3s-.5 3-2 5c1.5 2 2 3.5 2 5s0 3 2 3M16 4c2 0 2 1.5 2 3s.5 3 2 5c-1.5 2-2 3.5-2 5s0 3-2 3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="30" height="30"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  info: '<svg viewBox="0 0 24 24" width="18" height="18" style="flex:none"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 11v6M12 7.5v.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
};
