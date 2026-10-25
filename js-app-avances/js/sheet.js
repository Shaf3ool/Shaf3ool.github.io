/* =========================================================================
   sheet.js — the optional "Notificaciones" bottom sheet (Demo).
   Nothing is ever sent: the toggles only save a preference on this device.
   ========================================================================= */
import { t } from './i18n.js';
import { ICON, toast, tick } from './ui.js';

// --- persisted preference -----------------------------------------------------------
const KEY = 'jsavances.notif';
const root = document.getElementById('sheet');
let prefs = readPrefs();
let onChange = () => {};     // set by app.js: refresh the bell dot

/**
 * What: read saved notification preferences.
 * In:  —
 * Out: { on: boolean, weekly: boolean }
 */
function readPrefs() {
  try { return { on: false, weekly: false, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { on: false, weekly: false }; }
}

/**
 * What: save preferences on this device.
 * In:  —
 * Out: —
 */
function savePrefs() {
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* private mode: ignore */ }
}

/**
 * What: whether update notifications are switched on.
 * In:  —
 * Out: boolean
 */
export function notifOn() { return prefs.on; }

/**
 * What: wire the sheet (closing via scrim, button, Escape).
 * In:  handlers { change(on) }
 * Out: —
 */
export function initSheet(handlers) {
  onChange = handlers.change;
  root.addEventListener('click', onClick);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && root.classList.contains('open')) closeSheet(); });
}

/**
 * What: route clicks inside the sheet.
 * In:  e (MouseEvent)
 * Out: —
 */
function onClick(e) {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  // close on scrim / button; flip a switch otherwise
  if (act === 'close') closeSheet();
  else if (act === 'on') { prefs.on = !prefs.on; if (!prefs.on) prefs.weekly = false; commit(prefs.on ? 'n.on' : 'n.off'); }
  else if (act === 'weekly' && prefs.on) { prefs.weekly = !prefs.weekly; commit(prefs.weekly ? 'n.weeklyOn' : 'n.weeklyOff'); }
}

/**
 * What: save, refresh the switches and confirm with a toast.
 * In:  msgKey (i18n key)
 * Out: —
 */
function commit(msgKey) {
  savePrefs();
  tick();
  root.querySelector('[data-act="on"]').setAttribute('aria-checked', String(prefs.on));
  const w = root.querySelector('[data-act="weekly"]');
  w.setAttribute('aria-checked', String(prefs.weekly));
  w.disabled = !prefs.on;
  onChange(prefs.on);
  toast(t(msgKey));
}

/**
 * What: build and slide up the sheet.
 * In:  —
 * Out: —
 */
export function openSheet() {
  root.innerHTML = `<div class="scrim" data-act="close"></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="n-title">
      <div class="grab"></div>
      <span class="sheet-ico">${ICON.bellLg}</span>
      <h3 id="n-title">${t('n.title')}</h3>
      <p>${t('n.text')}</p>
      <div class="rows">
        <label class="row"><span>${t('n.toggle')}</span><button class="switch" role="switch" data-act="on" aria-checked="${prefs.on}" aria-label="${t('n.toggle')}"></button></label>
        <label class="row"><span>${t('n.weekly')}</span><button class="switch" role="switch" data-act="weekly" aria-checked="${prefs.weekly}" aria-label="${t('n.weekly')}" ${prefs.on ? '' : 'disabled'}></button></label>
      </div>
      <p class="demo-line">${ICON.info}<span>${t('n.demo')}</span></p>
      <button class="btn" data-act="close">${t('n.done')}</button>
    </div>`;
  root.setAttribute('aria-hidden', 'false');
  // next frame so the slide-up transition runs
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('open')));
  setTimeout(() => root.querySelector('.switch')?.focus({ preventScroll: true }), 350);
}

/**
 * What: slide the sheet down.
 * In:  —
 * Out: —
 */
export function closeSheet() {
  root.classList.remove('open');
  root.setAttribute('aria-hidden', 'true');
  document.querySelector('[data-act="bell"]')?.focus({ preventScroll: true });
}
