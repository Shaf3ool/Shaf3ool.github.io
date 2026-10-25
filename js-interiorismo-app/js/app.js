/* =========================================================================
   app.js — Js Interiorismo client app (concept v1)
   Hash-free tab router, demo state in localStorage, five views:
   home · project · design (3D finishes + moodboard) · chat · agenda.
   ========================================================================= */
import { t, setLang, savedLang, getLang } from './i18n.js';
import { INSPIRATION, RENDERS, PHASES, APPROVALS } from './data.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const mobile = window.matchMedia('(pointer: coarse)').matches;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* demo state, persisted so the prototype feels alive between visits */
const state = loadState();
let current = 'home';
let room = null;          // 3D room on the design tab
let finishesMod = null;   // materials.js, loaded on demand
let designTab = 'floor';

/* -------------------------------------------------------------------------
   loadState / saveState
   What: read and write the demo state (saved images, approvals, chat).
   In:   nothing / nothing
   Out:  state object / nothing
   ------------------------------------------------------------------------- */
function loadState() {
  const base = { saved: [0, 2], approvals: Object.fromEntries(APPROVALS.map((a) => [a.id, a.status])), chat: [], booked: null, entered: false };
  try { return { ...base, ...JSON.parse(localStorage.getItem('jsapp-state') || '{}') }; } catch (e) { return base; }
}
function saveState() {
  try { localStorage.setItem('jsapp-state', JSON.stringify(state)); } catch (e) { /* private mode: keep in memory */ }
}

/* -------------------------------------------------------------------------
   toast
   What: short confirmation pill at the top of the app.
   In:   msg (string)
   Out:  nothing
   ------------------------------------------------------------------------- */
let toastTimer = 0;
function toast(msg) {
  const el = $('[data-toast]');
  el.textContent = msg;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 2200);
}

/* -------------------------------------------------------------------------
   sheet
   What: open a bottom sheet with given HTML; returns the sheet element.
   In:   html (string)
   Out:  HTMLElement
   ------------------------------------------------------------------------- */
function openSheet(html) {
  const sh = $('[data-sheet]');
  sh.innerHTML = html;
  sh.classList.add('is-on');
  $('[data-scrim]').classList.add('is-on');
  return sh;
}
/* What: close the bottom sheet.  In: nothing  Out: nothing */
function closeSheet() {
  $('[data-sheet]').classList.remove('is-on');
  $('[data-scrim]').classList.remove('is-on');
}

/* ---------- small templates ---------- */
const ICON = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m5 12 4 4 10-10"/></svg>',
  img: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20s-7.5-4.6-9-9.3C1.8 6.9 4.4 4 7.4 4c2 0 3.6 1.2 4.6 2.8C13 5.2 14.6 4 16.6 4c3 0 5.6 2.9 4.4 6.7-1.5 4.7-9 9.3-9 9.3z"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  cube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="18" height="18"><path d="M12 3 3 8l9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8"/></svg>',
};
/* What: progress ring SVG.  In: pct (0..100)  Out: HTML string */
const ring = (pct) => {
  const c = 2 * Math.PI * 32;
  return `<div class="ring"><svg viewBox="0 0 76 76"><circle cx="38" cy="38" r="32" stroke="rgba(255,255,255,.25)"/><circle cx="38" cy="38" r="32" stroke="#E6C9A3" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct / 100)}"/></svg><b>${pct}%<span>${t('home.progress')}</span></b></div>`;
};

/* -------------------------------------------------------------------------
   viewHome
   What: dashboard — project hero with progress, phase cards, to-dos,
         inspiration rail of Jorge's real projects.
   In:   nothing
   Out:  HTML string
   ------------------------------------------------------------------------- */
function viewHome() {
  const L = getLang();
  const pending = Object.values(state.approvals).filter((s) => s === 'pending').length;
  const rail = INSPIRATION.map((p, i) => `
    <div class="tile"><button type="button" class="heart" data-save="${i}" aria-pressed="${state.saved.includes(i)}" aria-label="♡">${ICON.heart}</button>
      <button type="button" class="im" data-open="${p.img}"><img src="${p.img}" alt="${p[L]} — render de Jorge Santana" loading="lazy" width="900" height="1125"></button>
      <p>${p[L]}</p><small>Js Interiorismo · ${p.year}</small></div>`).join('');
  return `
    <p class="sub">${t('home.hi')}</p>
    <h1 class="h1">${t('home.project')}</h1>
    <p class="sub">${t('home.projectSub')}</p>
    <div class="hero"><img src="img/patio-jacaranda-1-sm.webp" alt="" width="900" height="675">
      <div class="hero__in"><div><div class="hero__t">${t('home.phaseName')}</div><div class="hero__s">${t('home.phase')} · 3 / 5</div></div>${ring(62)}</div></div>
    <div class="duo">
      <div class="card mini"><div class="k">${t('home.phase')}</div><div class="v">${t('home.phaseName')}</div></div>
      <div class="card mini"><div class="k">${t('home.next')}</div><div class="v">${t('home.nextName')}</div></div>
    </div>
    <h2 class="h2">${t('home.todo')}</h2>
    <div class="list">
      <button type="button" class="row" data-go="project" data-anchor="approvals"><span class="ic">${ICON.check}</span><span class="tx">${pending ? t('home.todo1').replace('2', pending) : t('ap.approved')}</span><span class="ar">›</span></button>
      <button type="button" class="row" data-go="project"><span class="ic">${ICON.img}</span><span class="tx">${t('home.todo2')}</span><span class="ar">›</span></button>
      <button type="button" class="row" data-go="agenda"><span class="ic">${ICON.pin}</span><span class="tx">${t('home.todo3')}</span><span class="ar">›</span></button>
    </div>
    <h2 class="h2">${t('home.insp')}</h2><p class="sub">${t('home.inspSub')}</p>
    <div class="rail">${rail}</div>
    <p class="credit">Renders © Jorge Santana / Js Interiorismo · ${t('demo')} · Concept by Shaf3ool</p>`;
}

/* -------------------------------------------------------------------------
   viewProject
   What: timeline of the five phases, render gallery, finish approvals.
   In:   nothing
   Out:  HTML string
   ------------------------------------------------------------------------- */
function viewProject() {
  const tl = PHASES.map((p, i) => `<li class="${p.st}"><span class="dot">${p.st === 'done' ? '✓' : i + 1}</span><span><b>${t(p.k)}</b><small>${t('st.' + p.st)}</small></span><span class="date">${p.date}</span></li>`).join('');
  const gal = RENDERS.map((src) => `<button type="button" data-open="${src}"><img src="${src}" alt="Render — Jorge Santana" loading="lazy" width="900" height="1125"></button>`).join('');
  const ap = APPROVALS.map((a) => {
    const st = state.approvals[a.id];
    const sw = finishesMod ? finishesMod.swatchDataURL(a.group, a.finish) : '';
    return `<div class="card" data-ap="${a.id}"><span class="sw-img" style="background-image:url(${sw})" data-sw="${a.group}:${a.finish}"></span>
      <div><h4>${t(a.k + '.t')}</h4><p>${t(a.k + '.p')}</p><span class="status status--${st}">${t(st === 'pending' ? 'ap.pending' : st === 'approved' ? 'ap.approved' : 'ap.changes')}</span></div>
      ${st === 'pending' ? `<div class="acts"><button type="button" class="btn btn--line" data-change="${a.id}">${t('ap.change')}</button><button type="button" class="btn btn--dark" data-approve="${a.id}">${t('ap.approve')}</button></div>` : ''}</div>`;
  }).join('');
  return `
    <h1 class="h1">${t('home.project')}</h1><p class="sub">${t('home.projectSub')}</p>
    <h2 class="h2">${t('proj.timeline')}</h2><ol class="tl">${tl}</ol>
    <h2 class="h2">${t('proj.renders')}<small>Baño principal</small></h2><div class="gal">${gal}</div>
    <h2 class="h2" id="approvals">${t('proj.approvals')}</h2><div class="apv">${ap}</div>
    <p class="credit">Renders © Jorge Santana / Js Interiorismo — ${t('demo')}.</p>`;
}

/* -------------------------------------------------------------------------
   viewDesign
   What: compact 3D room with finish swatches, AR entry, saved moodboard.
   In:   nothing
   Out:  HTML string
   ------------------------------------------------------------------------- */
function viewDesign() {
  const L = getLang();
  const board = state.saved.length
    ? state.saved.map((i) => `<div><img src="${INSPIRATION[i].img}" alt="${INSPIRATION[i][L]}" loading="lazy" width="900" height="1125"></div>`).join('')
      + (finishesMod ? ['floor', 'walls'].map((g) => `<div class="swc" style="background-image:url(${finishesMod.swatchDataURL(g, room ? room.current[g] : (g === 'floor' ? 'roble' : 'yeso'))})">${t('des.' + g)}</div>`).join('') : '')
    : `<div class="empty">${t('des.boardSub')}</div>`;
  return `
    <h1 class="h1">${t('des.t')}</h1><p class="sub">${t('des.sub')}</p>
    <div class="viewer" data-viewer><canvas data-room aria-label="3D"></canvas><span class="viewer__tag">${t('des.scene')}</span></div>
    <div class="seg" role="tablist">
      ${['floor', 'walls', 'fabric'].map((g) => `<button type="button" role="tab" data-dtab="${g}" aria-selected="${designTab === g}">${t('des.' + g)}</button>`).join('')}
    </div>
    <div class="swatches" data-dsw></div>
    <button type="button" class="btn btn--bronze" data-ar-open style="margin-top:16px">${ICON.cube} ${t('des.ar')}</button>
    <h2 class="h2">${t('des.board')}</h2><p class="sub">${t('des.boardSub')}</p>
    <div class="board">${board}</div>`;
}

/* -------------------------------------------------------------------------
   viewChat
   What: demo conversation with the designer, quick replies, composer.
   In:   nothing
   Out:  HTML string
   ------------------------------------------------------------------------- */
function viewChat() {
  const seed = [
    { who: 'in', k: 'chat.m1', img: 'img/bano-sereno-2-sm.webp', time: '09:12' },
    { who: 'out', k: 'chat.m2', time: '09:20' },
    { who: 'in', k: 'chat.m3', time: '09:21' },
  ];
  const all = [...seed, ...state.chat];
  const msgs = all.map((m) => `<div class="msg msg--${m.who}">${m.img ? `<img src="${m.img}" alt="Render — Jorge Santana" width="900" height="1125">` : ''}${m.k ? t(m.k) : escapeHTML(m.text)}<time>${m.time}</time></div>`).join('');
  return `
    <div class="who"><img src="img/js-profile-150.png" alt="Js Interiorismo" width="150" height="150"><div><b>${t('chat.t')}</b><small><span class="on"></span>${t('chat.sub')}</small></div></div>
    <p class="sub" style="text-align:center;margin-top:12px;font-size:11px">${t('chat.demo')}</p>
    <div class="msgs" data-msgs>${msgs}</div>`;
}

/* -------------------------------------------------------------------------
   viewAgenda
   What: month calendar, meeting type, time slots and booking request.
   In:   nothing
   Out:  HTML string
   ------------------------------------------------------------------------- */
const cal = { month: null, day: null, slot: null, type: 'visit' };
function viewAgenda() {
  const L = getLang();
  const now = new Date();
  if (!cal.month) cal.month = new Date(now.getFullYear(), now.getMonth(), 1);
  const m = cal.month;
  const first = (m.getDay() + 6) % 7; // weeks start on Monday
  const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  const loc = L === 'es' ? 'es-MX' : 'en-US';
  const dw = [...Array(7)].map((_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(loc, { weekday: 'narrow' }));
  let cells = dw.map((d) => `<span class="dw">${d}</span>`).join('') + '<span></span>'.repeat(first);
  for (let d = 1; d <= days; d++) {
    const date = new Date(m.getFullYear(), m.getMonth(), d);
    const past = date < new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekend = date.getDay() === 0;
    const isToday = date.toDateString() === now.toDateString();
    const sel = cal.day && cal.day.toDateString() === date.toDateString();
    cells += `<button type="button" data-day="${d}" ${past || weekend ? 'disabled' : ''} class="${isToday ? 'today' : ''}" aria-pressed="${!!sel}">${d}</button>`;
  }
  const slots = ['09:00', '10:30', '12:00', '13:30', '16:00', '17:30'];
  return `
    <h1 class="h1">${t('ag.t')}</h1>
    <div class="seg" role="tablist">${['visit', 'video', 'studio'].map((k) => `<button type="button" role="tab" data-type="${k}" aria-selected="${cal.type === k}">${t('ag.' + k)}</button>`).join('')}</div>
    <div class="cal card" style="margin-top:14px">
      <div class="cal__head"><button type="button" data-month="-1" aria-label="‹">‹</button><span>${cap(m.toLocaleDateString(loc, { month: 'long' }))} ${m.getFullYear()}</span><button type="button" data-month="1" aria-label="›">›</button></div>
      <div class="cal__grid">${cells}</div>
    </div>
    <h2 class="h2">${t('ag.time')}</h2>
    ${cal.day ? `<div class="slots">${slots.map((s) => `<button type="button" data-slot="${s}" aria-pressed="${cal.slot === s}">${s}</button>`).join('')}</div>` : `<div class="empty" style="margin-top:12px">${t('ag.pick')}</div>`}
    <button type="button" class="btn btn--bronze" data-book style="margin-top:18px" ${cal.day && cal.slot ? '' : 'disabled'}>${t('ag.book')}</button>`;
}

/* What: capitalise the first letter.  In: s  Out: string */
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* What: escape user text for HTML.  In: s  Out: safe string */
function escapeHTML(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

const VIEWS = { home: viewHome, project: viewProject, design: viewDesign, chat: viewChat, agenda: viewAgenda };

/* -------------------------------------------------------------------------
   go
   What: switch tab — render the view, animate it in, mount 3D on design,
         stop 3D elsewhere, show the chat composer only on chat.
   In:   name (view key), anchor (optional element id to scroll to)
   Out:  nothing
   ------------------------------------------------------------------------- */
function go(name, anchor) {
  current = name;
  // swatches need materials.js first; render once it is in
  if ((name === 'design' || name === 'project') && !finishesMod) { loadFinishes().then(() => { if (current === name) go(name, anchor); }); }
  const host = $('[data-views]');
  if (room) { room.dispose(); room = null; }
  host.innerHTML = `<section class="view view--${name} is-enter" data-view="${name}">${VIEWS[name]()}</section>${name === 'chat' ? composer() : ''}`;
  $$('[data-tabbar] [data-go]').forEach((b) => b.setAttribute('aria-current', b.dataset.go === name ? 'page' : 'false'));
  if (name === 'chat') { $('[data-badge]').hidden = true; scrollChat(); }
  if (name === 'design' && finishesMod) mountDesign();
  if (anchor) requestAnimationFrame(() => { const el = document.getElementById(anchor); if (el) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); });
}

/* What: load materials.js once.  In: nothing  Out: Promise */
async function loadFinishes() { if (!finishesMod) finishesMod = await import('./materials.js'); return finishesMod; }

/* -------------------------------------------------------------------------
   mountDesign
   What: create the 3D room in the design viewer (or a photo fallback),
         render the swatches of the active tab.
   In:   nothing
   Out:  Promise<void>
   ------------------------------------------------------------------------- */
async function mountDesign() {
  await loadFinishes();
  const canvas = $('[data-room]');
  if (!canvas || current !== 'design') return;
  let ok = false;
  try { const c = document.createElement('canvas'); ok = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { ok = false; }
  if (ok) {
    try {
      const { createRoom } = await import('./scene.js');
      if (current !== 'design' || !canvas.isConnected) return;
      room = createRoom(canvas, { mobile: true, reducedMotion: reduced, artURL: 'img/bano-sereno-1-sm.webp' });
      room.setExplore(true);
      ['floor', 'walls', 'fabric'].forEach((g) => { if (state['f_' + g]) room.setFinish(g, state['f_' + g]); });
      room.resize(); room.start();
    } catch (e) { ok = false; }
  }
  if (!ok) canvas.outerHTML = '<img class="viewer__fb" src="img/loft-1-sm.webp" alt="Render — Jorge Santana" width="900" height="1125">';
  renderSwatches();
}

/* -------------------------------------------------------------------------
   renderSwatches
   What: swatch buttons for the active design tab.
   In:   nothing
   Out:  nothing
   ------------------------------------------------------------------------- */
function renderSwatches() {
  const box = $('[data-dsw]');
  if (!box || !finishesMod) return;
  const L = getLang();
  const cur = room ? room.current[designTab] : state['f_' + designTab];
  box.innerHTML = finishesMod.FINISHES[designTab].map((f) => `<button type="button" class="swb" data-fin="${f.id}" aria-pressed="${cur === f.id}"><i style="background-image:url(${finishesMod.swatchDataURL(designTab, f.id)})"></i>${f[L]}</button>`).join('');
}

/* What: chat composer markup.  In: nothing  Out: HTML string */
function composer() {
  return `<div class="compose"><div class="quick">${['chat.q1', 'chat.q2', 'chat.q3'].map((k, i) => `<button type="button" data-quick="${i + 1}">${t(k)}</button>`).join('')}</div>
    <form data-chatform><input name="m" autocomplete="off" placeholder="${t('chat.ph')}" aria-label="${t('chat.ph')}"><button type="submit" aria-label="${t('ap.send')}">${ICON.send}</button></form></div>`;
}
/* What: keep the chat scrolled to the newest message.  In: nothing  Out: nothing */
function scrollChat() { const v = $('[data-view="chat"]'); if (v) v.scrollTop = v.scrollHeight; }

/* -------------------------------------------------------------------------
   sendChat
   What: append the client's message, show typing, then the demo reply.
   In:   text (string), replyKey (i18n key of the scripted reply)
   Out:  nothing
   ------------------------------------------------------------------------- */
function sendChat(text, replyKey) {
  const time = new Date().toLocaleTimeString(getLang() === 'es' ? 'es-MX' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  state.chat.push({ who: 'out', text, time });
  saveState();
  const box = $('[data-msgs]');
  box.insertAdjacentHTML('beforeend', `<div class="msg msg--out">${escapeHTML(text)}<time>${time}</time></div><div class="msg msg--in typing" data-typing><i></i><i></i><i></i></div>`);
  scrollChat();
  setTimeout(() => {
    state.chat.push({ who: 'in', k: replyKey, time });
    saveState();
    const ty = $('[data-typing]');
    if (ty) ty.outerHTML = `<div class="msg msg--in">${t(replyKey)}<time>${time}</time></div>`;
    scrollChat();
  }, 1400);
}

/* -------------------------------------------------------------------------
   openLightbox
   What: full-screen image viewer.
   In:   src (image path; the 1800w version is used when we ship it)
   Out:  nothing
   ------------------------------------------------------------------------- */
function openLightbox(src) {
  const lb = $('[data-lbx]');
  lb.innerHTML = `<button type="button" class="lbx__x" data-lbx-close aria-label="${t('ar.close')}">✕</button><img src="${src}" alt="Render — Jorge Santana"><p>Render © Jorge Santana / Js Interiorismo</p>`;
  lb.hidden = false;
}

/* -------------------------------------------------------------------------
   onClick
   What: one delegated click handler for the whole app.
   In:   e (click event)
   Out:  nothing
   ------------------------------------------------------------------------- */
function onClick(e) {
  const el = e.target.closest('button, [data-scrim]');
  if (!el) return;
  const d = el.dataset;
  if ('enter' in d) { enter(); return; }
  if (d.langBtn) { applyLang(d.langBtn); return; }
  if (d.go) { go(d.go, d.anchor); return; }
  if (d.save !== undefined) {
    // heart toggle on an inspiration tile
    const i = +d.save; const on = !state.saved.includes(i);
    state.saved = on ? [...state.saved, i] : state.saved.filter((x) => x !== i);
    saveState(); el.setAttribute('aria-pressed', String(on)); toast(t(on ? 'saved' : 'removed'));
    return;
  }
  if (d.open) { openLightbox(d.open); return; }
  if ('lbxClose' in d) { $('[data-lbx]').hidden = true; return; }
  if (d.approve) { state.approvals[d.approve] = 'approved'; saveState(); toast(t('approvedToast')); go('project', 'approvals'); return; }
  if (d.change) {
    // change request sheet with a note
    const sh = openSheet(`<h3 class="h2" style="margin-top:0">${t('ap.change')}</h3><textarea data-note placeholder="${t('ap.note')}"></textarea><button type="button" class="btn btn--bronze" data-change-send="${d.change}">${t('ap.send')}</button>`);
    setTimeout(() => $('[data-note]', sh).focus({ preventScroll: true }), 350);
    return;
  }
  if (d.changeSend) { state.approvals[d.changeSend] = 'changes'; saveState(); closeSheet(); toast(t('changeToast')); go('project', 'approvals'); return; }
  if ('scrim' in d) { closeSheet(); return; }
  if (d.dtab) { designTab = d.dtab; $$('[data-dtab]').forEach((b) => b.setAttribute('aria-selected', String(b === el))); renderSwatches(); return; }
  if (d.fin) {
    if (room) room.setFinish(designTab, d.fin);
    state['f_' + designTab] = d.fin; saveState();
    $$('[data-fin]').forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
    return;
  }
  if ('arOpen' in d) { openAR(); return; }
  if (d.quick) { sendChat(t('chat.q' + d.quick), 'chat.r' + d.quick); return; }
  if (d.type) { cal.type = d.type; go('agenda'); return; }
  if (d.month) { cal.month = new Date(cal.month.getFullYear(), cal.month.getMonth() + +d.month, 1); go('agenda'); return; }
  if (d.day) { cal.day = new Date(cal.month.getFullYear(), cal.month.getMonth(), +d.day); cal.slot = null; go('agenda'); return; }
  if (d.slot) { cal.slot = d.slot; go('agenda'); return; }
  if ('book' in d) {
    const L = getLang() === 'es' ? 'es-MX' : 'en-US';
    openSheet(`<h3 class="h2" style="margin-top:0">${t('ag.' + cal.type)}</h3><p class="sub" style="font-size:15px;color:var(--ink)">${cal.day.toLocaleDateString(L, { weekday: 'long', day: 'numeric', month: 'long' })} · ${cal.slot}</p><p class="sub" style="margin:12px 0 18px">${t('ag.done')}</p><button type="button" class="btn btn--bronze" data-scrim>OK</button>`);
    state.booked = { day: cal.day.toISOString(), slot: cal.slot, type: cal.type }; saveState();
  }
}

/* -------------------------------------------------------------------------
   openAR
   What: lazy-load the "view in your space" module and start it.
   In:   nothing
   Out:  Promise<void>
   ------------------------------------------------------------------------- */
async function openAR() {
  const host = $('[data-arv]');
  const { startAR } = await import('./ar.js');
  if (room) room.stop();
  host.hidden = false;
  await startAR(host, { t, getLang, finishes: finishesMod, fabric: (room && room.current.fabric) || state.f_fabric || 'lino', onClose: () => { host.hidden = true; if (room) room.start(); } });
}

/* What: switch language everywhere and re-render the view.  In: code  Out: nothing */
function applyLang(code) {
  setLang(code);
  $$('[data-lang-btn]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.langBtn === getLang())));
  if (state.entered) go(current);
}

/* What: leave the onboarding screen.  In: nothing  Out: nothing */
function enter() {
  state.entered = true; saveState();
  $('[data-ob]').classList.add('is-out');
  setTimeout(() => { $('[data-ob]').hidden = true; }, 750);
  go('home');
}

/* -------------------------------------------------------------------------
   boot
   What: language, listeners, first view, service worker.
   In:   nothing
   Out:  nothing
   ------------------------------------------------------------------------- */
function boot() {
  applyLang(savedLang());
  document.addEventListener('click', onClick);
  document.addEventListener('submit', (e) => {
    // chat composer
    if (!e.target.matches('[data-chatform]')) return;
    e.preventDefault();
    const v = e.target.m.value.trim();
    if (!v) return;
    e.target.m.value = '';
    sendChat(v, 'chat.rx');
  });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeSheet(); $('[data-lbx]').hidden = true; if (!$('[data-arv]').hidden) import('./ar.js').then((m) => m.stopAR()); } });
  window.addEventListener('resize', () => { if (room) room.resize(); }, { passive: true });
  // returning visitors skip the splash; ?intro shows it again
  if (state.entered && !location.search.includes('intro')) { $('[data-ob]').hidden = true; go('home'); }
  // offline shell (relative scope keeps it inside this folder)
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {});
}

boot();
