/* =========================================================================
   screens/progress.js — "Avance": project progress tracker (all DEMO)
   A project card with a progress ring, the five stages
   (Diseño → Aprobación → Compras → Obra → Entrega), finish approvals with
   Aprobar / Pedir cambio, the client's designs under review, and recent
   updates illustrated with Jorge Santana's real renders (credited).
   Approvals live in the device store; nothing is sent anywhere.
   ========================================================================= */
import { t, getLang } from '../i18n.js';
import { h, icon, esc, sheet, toast } from '../ui.js';
import { PROJECT } from '../data.js';
import { get, update } from '../store.js';
import { finishURL } from '../textures.js';
import { planThumb } from './thumb.js';

const RING_R = 30;                          // ring radius (px, in a 72 box)
const RING_C = 2 * Math.PI * RING_R;        // ring circumference
let shownPct = null;                        // last % drawn (ring animates from it)

/**
 * What: current percentage: base + a step per approved finish.
 * In:  approvals map { id: 'approved' | 'changes' }
 * Out: number (0–100)
 */
export function progressPct(approvals = {}) {
  const ok = PROJECT.approvals.filter((a) => approvals[a.id] === 'approved').length;
  return Math.min(100, PROJECT.base + ok * PROJECT.perApproval);
}

/**
 * What: markup for the whole progress pane.
 * In:  —
 * Out: HTML string
 */
export function progressHTML() {
  const s = get(), L = getLang();
  const ap = s.approvals || {};
  const pct = progressPct(ap);
  const from = shownPct == null ? 0 : shownPct;
  const now = PROJECT.phases.find((p) => p.st === 'now');
  const pending = PROJECT.approvals.filter((a) => !ap[a.id]).length;
  const review = s.designs.filter((d) => d.status === 'review');
  // stage stepper: done ✓, current (pulsing), next (hollow)
  const steps = PROJECT.phases.map((p) => `
    <li class="pst ${p.st}"><i>${p.st === 'done' ? icon('check', 13) : ''}</i>
      <b>${t('ph.' + p.k)}</b><span>${p.date[L]}</span></li>`).join('');
  // approval cards with their state
  const approvals = PROJECT.approvals.map((a) => {
    const stt = ap[a.id];
    const actions = !stt
      ? `<div class="ap-btns"><button class="pill-btn primary sm" data-ap="ok" data-id="${a.id}">${icon('check', 15)}<span>${t('pj.approve')}</span></button>
         <button class="pill-btn ghost sm" data-ap="change" data-id="${a.id}">${t('pj.change')}</button></div>`
      : `<div class="ap-state ${stt}">${stt === 'approved' ? icon('check', 15) : icon('chat', 15)}<span>${stt === 'approved' ? t('pj.approved') : t('pj.changed')}</span>
         <button data-ap="undo" data-id="${a.id}">${t('pj.undo')}</button></div>`;
    return `<article class="ap-card ${stt || ''}">
      <span class="ap-sw" style="background-image:url(${finishURL(a.finish, 128)})"></span>
      <div class="ap-info"><h4>${t(a.id + '.t')}</h4><p class="muted">${t(a.id + '.p')}</p>${actions}</div></article>`;
  }).join('');
  // designs the client sent to Jorge appear inside the project
  const sent = review.length ? review.map((d) => `
    <button class="rv-row" data-design="${d.id}"><span class="rv-th">${planThumb(d)}</span>
      <span class="rv-txt"><b>${esc(d.name)}</b><span class="muted">${t('pj.review.p')}</span></span>${icon('chev', 18)}</button>`).join('')
    : `<p class="empty">${t('pj.review.empty')}</p>`;
  const ups = PROJECT.updates.map((u) => `
    <article class="up-card"><img src="${u.img}" width="720" height="450" loading="lazy" alt="">
      <div class="up-txt"><span class="up-when">${t('pj.ago').replace('{n}', u.ago)}</span><h4>${t(u.k + '.t')}</h4><p class="muted">${t(u.k + '.p')}</p></div></article>`).join('');
  return `
    <article class="pj-card">
      <img class="pj-img" src="${PROJECT.hero}" width="720" height="720" alt="">
      <div class="pj-shade"></div>
      <em class="demo-tag light">${t('common.demo')}</em>
      <div class="pj-body">
        <div class="ring" style="--from:${RING_C * (1 - from / 100)};--to:${RING_C * (1 - pct / 100)}" data-pct="${pct}">
          <svg viewBox="0 0 72 72" width="72" height="72" aria-hidden="true"><circle cx="36" cy="36" r="${RING_R}" class="rg-bg"/><circle cx="36" cy="36" r="${RING_R}" class="rg-fg" stroke-dasharray="${RING_C}" stroke-dashoffset="${RING_C * (1 - from / 100)}"/></svg>
          <span><b>${pct}%</b><small>${t('pj.pct')}</small></span>
        </div>
        <div class="pj-now"><span class="eyebrow light">${t('pj.phase')}</span><h3>${t('ph.' + now.k + '.long')}</h3>
          <p>${t('pj.next')}: ${t('pj.nextName')}</p></div>
      </div>
    </article>
    <div class="sec-head"><h2>${t('pj.phases')}</h2></div>
    <ol class="psteps">${steps}</ol>
    <div class="sec-head"><h2>${t('pj.approvals')}</h2><span class="count-pill ${pending ? '' : 'zero'}">${pending}</span></div>
    <div class="ap-list">${approvals}</div>
    <div class="sec-head"><h2>${t('pj.review')}</h2></div>
    <div class="rv-list">${sent}</div>
    <div class="sec-head"><h2>${t('pj.updates')}</h2></div>
    <div class="up-list">${ups}</div>
    <p class="credit-line">${t('pj.credit')}<br>${t('pj.note')}</p>`;
}

/**
 * What: after a render, animate the ring from the last value to the new one.
 * In:  root (Element containing the pane)
 * Out: —
 */
export function animateRing(root) {
  const ring = root.querySelector('.ring'); if (!ring) return;
  const fg = ring.querySelector('.rg-fg');
  const to = ring.style.getPropertyValue('--to');
  shownPct = +ring.dataset.pct;
  // two frames so the start offset is painted before the transition runs
  requestAnimationFrame(() => requestAnimationFrame(() => { fg.style.strokeDashoffset = to; }));
}

/**
 * What: set (or clear) one approval's state in the store.
 * In:  id (approval id), value ('approved' | 'changes' | null), note (string)
 * Out: —
 */
function setApproval(id, value, note = '') {
  update((s) => {
    s.approvals = s.approvals || {};
    s.approvalNotes = s.approvalNotes || {};
    if (value) s.approvals[id] = value; else delete s.approvals[id];
    if (note) s.approvalNotes[id] = note;
  });
}

/**
 * What: the "Pedir cambio" sheet with a short note for Jorge (demo).
 * In:  id (approval id)
 * Out: —
 */
function openChangeSheet(id) {
  const a = PROJECT.approvals.find((x) => x.id === id);
  const c = h(`
    <div class="send">
      <div class="send-head"><span class="ap-sw big" style="background-image:url(${finishURL(a.finish, 128)})"></span>
        <div><h3>${t('pj.change.t')}</h3><p class="muted">${t(id + '.t')} · ${t('pj.change.p')}</p></div></div>
      <label class="field"><span>${t('snd.note')}</span><textarea rows="3" maxlength="300" name="note" placeholder="${esc(t('pj.change.ph'))}"></textarea></label>
      <button class="pill-btn primary block" data-act="send">${icon('send', 18)}<span>${t('pj.change.send')}</span></button>
    </div>`);
  const s = sheet(c);
  c.addEventListener('click', (e) => {
    if (!e.target.closest('[data-act=send]')) return;
    setApproval(id, 'changes', c.querySelector('textarea').value.trim());
    s.close(); toast(t('pj.toast.change'), 'chat');
  });
}

/**
 * What: handle a click inside the progress pane.
 * In:  e (click event), ctx { openDesignDetail(id) }
 * Out: true when the click was handled here
 */
export function onProgressClick(e, ctx) {
  const b = e.target.closest('[data-ap]');
  if (b) {
    const id = b.dataset.id;
    if (b.dataset.ap === 'ok') { setApproval(id, 'approved'); toast(t('pj.toast.ok'), 'check'); }
    if (b.dataset.ap === 'change') openChangeSheet(id);
    if (b.dataset.ap === 'undo') setApproval(id, null);
    return true;
  }
  const r = e.target.closest('[data-design]');
  if (r) { ctx.openDesignDetail(r.dataset.design); return true; }
  return false;
}
