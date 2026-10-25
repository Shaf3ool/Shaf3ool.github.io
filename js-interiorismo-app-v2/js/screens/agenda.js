/* =========================================================================
   screens/agenda.js — Agenda una consulta (calendar UI, DEMO)
   Sample availability only; confirming stores a demo booking on the device.
   ========================================================================= */
import { t, onLang, getLang } from '../i18n.js';
import { h, icon, sheet } from '../ui.js';
import { get, update } from '../store.js';

const TIMES = ['10:00', '11:30', '13:00', '16:30', '18:00'];

/**
 * What: mount the Agenda tab.
 * In:  host (Element)
 * Out: { el, refresh() }
 */
export function mountAgenda(host) {
  const now = new Date();
  let ym = { y: now.getFullYear(), m: now.getMonth() };
  let day = null, time = null, kind = 'virtual';
  const el = h(`<section class="screen tab-screen agenda"><div class="scroll"></div></section>`);
  host.appendChild(el);
  const sc = el.querySelector('.scroll');

  /**
   * What: deterministic "taken" slots per day so the demo looks lived-in.
   * In:  d (Date), i (slot index)
   * Out: boolean
   */
  const taken = (d, i) => ((d.getDate() * 7 + i * 3 + d.getMonth()) % 5) === 0;

  /**
   * What: render calendar, slot chips, type picker and confirm button.
   * In:  —
   * Out: —
   */
  function render() {
    const L = getLang();
    const b = get().booking;
    const first = new Date(ym.y, ym.m, 1);
    const offset = (first.getDay() + 6) % 7;            // Monday-first grid
    const days = new Date(ym.y, ym.m + 1, 0).getDate();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let cells = '';
    for (let i = 0; i < offset; i++) cells += '<span></span>';
    // each day: disabled if past or Sunday
    for (let d = 1; d <= days; d++) {
      const date = new Date(ym.y, ym.m, d);
      const off = date < today || date.getDay() === 0;
      const sel = day && day.getTime() === date.getTime();
      const isT = date.getTime() === today.getTime();
      cells += `<button class="day ${off ? 'off' : ''} ${sel ? 'sel' : ''} ${isT ? 'today' : ''}" ${off ? 'disabled' : ''} data-d="${d}">${d}</button>`;
    }
    const canPrev = ym.y > now.getFullYear() || ym.m > now.getMonth();
    const slots = day ? TIMES.map((tm, i) => {
      const tk = taken(day, i);
      return `<button class="slot ${tk ? 'off' : ''} ${time === tm ? 'sel' : ''}" ${tk ? 'disabled' : ''} data-t="${tm}">${tm}</button>`;
    }).join('') : `<p class="muted">${t('ag.pick')}</p>`;
    const kinds = [['virtual', 'video'], ['studio', 'pin'], ['site', 'home']];
    sc.innerHTML = `
      <header class="big-head"><p class="eyebrow">${t('ag.sub')}</p><h1>${t('ag.title')}</h1></header>
      ${b ? `<div class="booked"><div class="b-ic">${icon('check', 20)}</div><div><b>${t('ag.yours')}</b>
        <p>${new Date(b.date).toLocaleDateString(L === 'en' ? 'en-US' : 'es-MX', { weekday: 'long', day: 'numeric', month: 'long' })} · ${b.time} · ${t('ag.' + b.kind)}</p></div>
        <button class="link-btn" data-act="cancel">${t('ag.cancel')}</button></div>` : ''}
      <div class="kinds">${kinds.map(([k, ic]) => `<button class="kind ${kind === k ? 'on' : ''}" data-k="${k}">${icon(ic, 22)}<b>${t('ag.' + k)}</b><span>${t('ag.' + k + '.p')}</span></button>`).join('')}</div>
      <div class="cal">
        <div class="cal-head">
          <button class="icon-btn sm" data-act="prev" ${canPrev ? '' : 'disabled'} aria-label="prev">${icon('back', 18)}</button>
          <b>${t('ag.months')[ym.m]} ${ym.y}</b>
          <button class="icon-btn sm" data-act="next" aria-label="next">${icon('chev', 18)}</button>
        </div>
        <div class="cal-dow">${t('ag.days').map((x) => `<span>${x}</span>`).join('')}</div>
        <div class="cal-grid">${cells}</div>
      </div>
      <div class="sec-head"><h2>${t('ag.times')}</h2></div>
      <div class="slots">${slots}</div>
      <button class="pill-btn primary block" data-act="confirm" ${day && time ? '' : 'disabled'}>${icon('agenda', 18)}<span>${t('ag.confirm')}</span></button>
      <p class="credit-line">${t('st.credit')}</p>`;
  }

  // --- interactions --------------------------------------------------------
  sc.addEventListener('click', (e) => {
    const k = e.target.closest('[data-k]'); if (k) { kind = k.dataset.k; render(); return; }
    const d = e.target.closest('[data-d]'); if (d) { day = new Date(ym.y, ym.m, +d.dataset.d); time = null; render(); return; }
    const s = e.target.closest('[data-t]'); if (s) { time = s.dataset.t; render(); return; }
    const a = e.target.closest('[data-act]'); if (!a) return;
    if (a.dataset.act === 'prev') { ym = ym.m === 0 ? { y: ym.y - 1, m: 11 } : { y: ym.y, m: ym.m - 1 }; render(); }
    if (a.dataset.act === 'next') { ym = ym.m === 11 ? { y: ym.y + 1, m: 0 } : { y: ym.y, m: ym.m + 1 }; render(); }
    if (a.dataset.act === 'cancel') { update((st) => { st.booking = null; }); render(); }
    if (a.dataset.act === 'confirm' && day && time) {
      update((st) => { st.booking = { date: day.getTime(), time, kind }; });
      const c = h(`<div class="send-done"><div class="done-check">${icon('check', 40)}</div><h3>${t('ag.done.t')}</h3><p class="muted">${t('ag.done.p')}</p><button class="pill-btn primary block" data-act="ok">OK</button></div>`);
      const sh = sheet(c);
      c.querySelector('[data-act=ok]').addEventListener('click', () => sh.close());
      day = null; time = null; render();
    }
  });

  const off = onLang(render);
  render();
  return { el, refresh: render, destroy: off };
}
