/* =========================================================================
   app.js: boot + UI glue for "Taller" (Js Interiorismo app prototype).
   - Phone: one projection at a time, switched with a segmented control.
   - Wide screens: side panel + the full drawing sheet (all 3 views).
   - Desktop can also preview the app inside an iPhone frame.
   ========================================================================= */
import { t, apply, setLang, getLang, onLang } from './i18n.js';
import { CATALOG, FINISHES, byType } from './catalog.js';
import { S, LIMITS, boot, subscribe, emit, selected, setRoom, addItem, editSelected, saveProject, listProjects, deleteProject, load, seedProject } from './state.js';
import { viewSVG, sheetSVG, escapeXml } from './draw.js';
import { planSymbol } from './symbols.js';
import { clampItem } from './geometry.js';
import { attachInteraction } from './interact.js';
import { doExport } from './export.js';
import { sheet, toast, ICON } from './ui.js';

const $ = (id) => document.getElementById(id);
const app = $('app'), stage = $('stage');
let view = 'plan';
let phonePreview = false;

// --- layout: framed phone preview vs wide studio vs phone -----------------------
const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

/**
 * What: decide the layout (phone / wide / framed preview) and re-render.
 * In:  —
 * Out: —
 */
function layout() {
  const desktop = window.innerWidth >= 960 && window.innerHeight >= 620 && !standalone;
  const framed = desktop && phonePreview;
  document.body.classList.toggle('framed', framed);
  if (framed) {
    // scale the 414×868 device to fit the window height
    const s = Math.min(1, (window.innerHeight - 48) / 884, (window.innerWidth * 0.55) / 430);
    document.documentElement.style.setProperty('--frame-scale', s.toFixed(3));
  }
  const wide = desktop && !framed;
  const changed = wide !== app.classList.contains('wide');
  app.classList.toggle('wide', wide);
  // the inspector lives in the side panel when wide, above the dock on phone
  ($(wide ? 'inspHome' : 'app')).appendChild($('insp'));
  if (changed) render();
}
window.addEventListener('resize', layout);

/**
 * What: update the decorative status-bar clock (framed preview only).
 * In:  —
 * Out: —
 */
function clock() {
  const d = new Date();
  $('sbTime').textContent = d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
}
setInterval(clock, 30000); clock();

// --- drawing ---------------------------------------------------------------------
let raf = 0;
/**
 * What: schedule a render on the next animation frame (coalesces drags).
 * In:  —
 * Out: —
 */
function render() {
  if (raf) return;
  raf = requestAnimationFrame(() => { raf = 0; draw(); });
}

/**
 * What: draw the drawings + refresh the room summary and inspector.
 * In:  —
 * Out: —
 */
function draw() {
  // wide: the full sheet; phone: the active projection only
  stage.innerHTML = app.classList.contains('wide') ? sheetSVG(S, { id: 'live' }) : viewSVG(S, view, { id: 'live' });
  $('roomVal').textContent = `${S.room.w} × ${S.room.l} × ${S.room.h} cm`;
  $('pName').textContent = S.name;
  syncRoomInputs();
  renderInspector();
  // empty state hint
  $('hint').textContent = S.items.length ? (selected() && byType(selected().type).mount !== 'floor' && view !== 'plan' ? t('wallHint') : t('tapHint')) : t('emptyBody');
}

/**
 * What: switch the active projection on phone (segmented control).
 * In:  next ('plan' | 'front' | 'side')
 * Out: —
 */
function setView(next) {
  view = next;
  const idx = ['plan', 'front', 'side'].indexOf(view);
  $('seg').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.view === view));
  $('seg').querySelector('.seg-thumb').style.transform = `translateX(${idx * 100}%)`;
  // caption: view key, name and where the viewer stands
  $('vKey').textContent = ['01', 'A', 'B'][idx];
  $('vName').dataset.i18n = view; $('vName').textContent = t(view);
  $('vSub').textContent = view === 'plan' ? '' : t(view === 'front' ? 'viewFront' : 'viewSide');
  render();
}
$('seg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setView(b.dataset.view); });

// --- room dimensions ----------------------------------------------------------------
/**
 * What: build the three slider + number rows for width, length, height.
 * In:  —
 * Out: —
 */
function buildRoom() {
  const rows = ['w', 'l', 'h'].map((k) => {
    const [lo, hi] = LIMITS[k];
    const key = { w: 'width', l: 'length', h: 'height' }[k];
    return `<div class="rrow"><label for="r-${k}" data-i18n="${key}">${t(key)}</label>
      <input type="range" id="r-${k}" data-k="${k}" min="${lo}" max="${hi}" step="5" aria-label="${t(key)}">
      <div class="num"><input type="number" inputmode="numeric" id="n-${k}" data-k="${k}" min="${lo}" max="${hi}" step="1" aria-label="${t(key)} (cm)"><span>cm</span></div></div>`;
  }).join('');
  $('roomBody').innerHTML = `<div>${rows}</div>`;
  // sliders update live; number inputs commit on change / enter
  $('roomBody').addEventListener('input', (e) => { if (e.target.type === 'range') setRoom(e.target.dataset.k, +e.target.value); });
  $('roomBody').addEventListener('change', (e) => { if (e.target.type === 'number') setRoom(e.target.dataset.k, +e.target.value || S.room[e.target.dataset.k]); });
  $('roomSum').addEventListener('click', () => {
    const open = $('room').classList.toggle('open');
    $('roomSum').setAttribute('aria-expanded', String(open));
  });
}

/**
 * What: reflect the room values into the sliders / inputs (not while typing).
 * In:  —
 * Out: —
 */
function syncRoomInputs() {
  ['w', 'l', 'h'].forEach((k) => {
    const r = $('r-' + k), n = $('n-' + k), [lo, hi] = LIMITS[k];
    r.value = S.room[k];
    r.style.setProperty('--p', ((S.room[k] - lo) / (hi - lo) * 100).toFixed(1) + '%');
    if (document.activeElement !== n) n.value = S.room[k];
  });
}

// --- catalogue --------------------------------------------------------------------------
/**
 * What: small plan-symbol icon for a catalogue type.
 * In:  c (catalogue entry)
 * Out: SVG string
 */
function prodIcon(c) {
  const it = { ...c, rot: 0 };
  const pad = 8, w = Math.max(c.w, 4) + pad * 2, d = Math.max(c.d, 4) + pad * 2;
  const s = Math.max(w, d) / 60;
  return `<svg viewBox="${-w / 2} ${-d / 2} ${w} ${d}" aria-hidden="true">${planSymbol(it, s)}</svg>`;
}

/**
 * What: the catalogue cards (used in the phone sheet and the wide panel).
 * In:  —
 * Out: HTML string
 */
function catalogHTML() {
  const L = getLang();
  return CATALOG.map((c) => `<button class="prod" data-type="${c.type}" type="button">
    <span class="pic">${prodIcon(c)}</span><b>${L === 'en' ? c.en : c.es}</b>
    <small>${c.w} × ${c.d} × ${c.h} cm</small><span class="plus">${ICON.plus}</span></button>`).join('');
}

/**
 * What: add a product and confirm with a toast.
 * In:  type (string)
 * Out: —
 */
function addProduct(type) {
  const it = addItem(type);
  toast(`${getLang() === 'en' ? it.nameEn : it.name} · ${t('added')}`);
}

/**
 * What: open the catalogue bottom sheet (phone).
 * In:  —
 * Out: —
 */
function openCatalog() {
  const sh = sheet(`<div class="sheet-hd"><div><h3>${t('catalog')}</h3><p class="muted small">${t('catalogNote')}</p></div><button class="x" data-close aria-label="${t('close')}">${ICON.x}</button></div>
    <div class="cat-grid">${catalogHTML()}</div>`);
  sh.el.addEventListener('click', (e) => { const p = e.target.closest('.prod'); if (p) { addProduct(p.dataset.type); sh.close(); } });
}
$('catInline').addEventListener('click', (e) => { const p = e.target.closest('.prod'); if (p) addProduct(p.dataset.type); });

// --- inspector (selected piece) --------------------------------------------------------
/**
 * What: render the inspector card for the selected piece.
 * In:  —
 * Out: —
 */
function renderInspector() {
  const el = $('insp'), it = selected();
  app.classList.toggle('has-insp', !!it);
  if (!it) { el.hidden = true; el.dataset.id = ''; return; }
  const c = byType(it.type), name = getLang() === 'en' && it.nameEn ? it.nameEn : it.name;
  // keep the DOM while dragging the same piece (only refresh numbers)
  if (el.dataset.id === it.id && !el.hidden) { refreshInspector(it); return; }
  el.dataset.id = it.id; el.hidden = false;
  const lift = c.mount !== 'floor' ? `<label class="lift">${t('lift')}<input type="range" id="iz" min="0" max="${S.room.h - it.h}" step="5" value="${it.z || 0}"><output id="izv">${it.z || 0} cm</output></label>` : '';
  el.innerHTML = `<div class="insp-h"><span class="ico">${prodIcon(c.type === 'box' ? { ...it } : c)}</span><div><b>${escapeXml(name)}</b><small id="idim"></small></div><button class="x" id="ix" aria-label="${t('close')}">${ICON.x}</button></div>
    <div class="insp-tools"><button class="tool" data-act="rot">${ICON.rot}${t('rotate')}</button><button class="tool" data-act="dup">${ICON.dup}${t('dup')}</button><button class="tool danger" data-act="del">${ICON.del}${t('del')}</button></div>
    <div class="sw-row" role="radiogroup" aria-label="${t('finish')}">${FINISHES.map((f) => `<button class="sw" data-hex="${f.hex}" style="background:${f.hex}" aria-label="${getLang() === 'en' ? f.en : f.es}"></button>`).join('')}</div>${lift}`;
  refreshInspector(it);
}

/**
 * What: refresh the inspector's live values (dimensions, finish, height).
 * In:  it (item)
 * Out: —
 */
function refreshInspector(it) {
  const el = $('insp');
  el.querySelector('#idim').textContent = `${it.w} × ${it.d} × ${it.h} cm · ${Math.round(it.rot)}°`;
  el.querySelectorAll('.sw').forEach((b) => b.classList.toggle('on', b.dataset.hex.toLowerCase() === String(it.color).toLowerCase()));
  const z = el.querySelector('#iz');
  if (z && document.activeElement !== z) { z.max = S.room.h - it.h; z.value = it.z || 0; el.querySelector('#izv').textContent = (it.z || 0) + ' cm'; }
}

$('insp').addEventListener('click', (e) => {
  const it = selected(); if (!it) return;
  if (e.target.closest('#ix')) { S.sel = null; emit('sel'); return; }
  const tool = e.target.closest('.tool');
  // rotate in 90° steps (fine rotation: the round handle in plan)
  if (tool && tool.dataset.act === 'rot') { it.rot = ((Math.round(it.rot / 90) * 90 + 90) % 360); clampItem(it, S.room); emit('items'); }
  if (tool && tool.dataset.act === 'dup') editSelected('dup');
  if (tool && tool.dataset.act === 'del') { editSelected('del'); toast(t('removed')); }
  const sw = e.target.closest('.sw');
  if (sw) { it.color = sw.dataset.hex; emit('items'); }
});
$('insp').addEventListener('input', (e) => {
  if (e.target.id !== 'iz') return;
  const it = selected(); if (!it) return;
  it.z = +e.target.value; clampItem(it, S.room);
  $('izv').textContent = it.z + ' cm';
  emit('move');
});

// --- projects -----------------------------------------------------------------------------
/**
 * What: save the project into Mis proyectos and confirm.
 * In:  —
 * Out: —
 */
function save() {
  saveProject();
  toast(t('saved'));
}

/**
 * What: format a saved date for the list.
 * In:  iso (string)
 * Out: string
 */
function fmtDate(iso) {
  return new Date(iso).toLocaleString(getLang() === 'en' ? 'en-US' : 'es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/**
 * What: open "Mis proyectos" (saved list, open / delete / new).
 * In:  —
 * Out: —
 */
function openProjects() {
  const list = listProjects();
  const cards = list.map((p) => {
    const st = { room: p.data.room, items: p.data.items.map((i, k) => ({ ...i, id: 'p' + k, nameEn: i.name })), sel: null };
    return `<div class="proj" data-id="${p.id}"><div class="th">${viewSVG(st, 'plan', { id: 'th' + p.id, interactive: false })}</div>
      <div><b>${escapeXml(p.data.name || '')}</b><small>${p.data.room.w} × ${p.data.room.l} × ${p.data.room.h} cm · ${p.data.items.length} ${t('items')}<br>${fmtDate(p.savedAt)}</small>
      <div class="pa"><button class="go" data-act="open">${t('open')}</button><button data-act="del">${t('delProj')}</button></div></div></div>`;
  }).join('');
  const sh = sheet(`<div class="sheet-hd"><h3>${t('projects')}</h3><button class="x" data-close aria-label="${t('close')}">${ICON.x}</button></div>
    <div class="hero-img"><img src="img/loft-1-sm.webp" alt="" width="900" height="1125" loading="lazy" decoding="async"><span>${t('credit2')}</span></div>
    <div class="list" id="plist">${cards || `<p class="muted center" style="padding:18px 0">${t('noProjects')}</p>`}</div>
    <div class="list" style="margin-top:12px"><button class="row-btn" data-act="new"><span class="ri">${ICON.plus}</span>${t('newProj')}<span class="chev">${ICON.chev}</span></button></div>
    <p class="note">${t('proto')} · ${t('credit1')}</p>`);
  sh.el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const card = b.closest('.proj');
    if (b.dataset.act === 'open') { const p = listProjects().find((x) => x.id === card.dataset.id); if (p) load(p.data, p.id); sh.close(); }
    if (b.dataset.act === 'del') { deleteProject(card.dataset.id); card.remove(); }
    // a new project starts from an empty room with the default size
    if (b.dataset.act === 'new') { load({ name: (getLang() === 'en' ? 'New project' : 'Nuevo proyecto') + ' · Demo', room: { w: 400, l: 500, h: 260 }, items: [] }); sh.close(); }
  });
}

/**
 * What: rename the project (prompt-free inline sheet).
 * In:  —
 * Out: —
 */
function rename() {
  const sh = sheet(`<div class="sheet-hd"><h3>${t('projName')}</h3><button class="x" data-close aria-label="${t('close')}">${ICON.x}</button></div>
    <label class="field"><input id="nameIn" maxlength="60" value="${escapeXml(S.name)}"></label><button class="btn primary block" id="nameOk">${t('ok')}</button>`);
  const inp = sh.el.querySelector('#nameIn');
  const ok = () => { S.name = inp.value.trim() || S.name; emit('items'); sh.close(); };
  sh.el.querySelector('#nameOk').addEventListener('click', ok);
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') ok(); });
}

// --- export -------------------------------------------------------------------------------
/**
 * What: open the export sheet (sheet SVG/PNG, 3 PNGs, JSON).
 * In:  —
 * Out: —
 */
function openExport() {
  const row = (act, ic, label) => `<button class="row-btn" data-ex="${act}"><span class="ri">${ic}</span>${label}<span class="chev">${ICON.chev}</span></button>`;
  const sh = sheet(`<div class="sheet-hd"><h3>${t('exportTitle')}</h3><button class="x" data-close aria-label="${t('close')}">${ICON.x}</button></div>
    <div class="list">${row('sheet-svg', ICON.vec, t('exSheetSvg'))}${row('sheet-png', ICON.img, t('exSheetPng'))}${row('views-png', ICON.views, t('exViews'))}${row('json', ICON.json, t('exJson'))}</div>
    <p class="note">${t('exNote')}</p>`);
  sh.el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-ex]'); if (!b) return;
    toast(t('downloading'));
    try { await doExport(b.dataset.ex); toast(t('copied')); } catch (err) { toast('PNG ✕'); }
  });
}

// --- send to Jorge (Demo) -------------------------------------------------------------------
/**
 * What: open the "Enviar a Jorge" sheet with the 3 projections (Demo).
 * In:  —
 * Out: —
 */
function openSend() {
  const st = { ...S, sel: null };
  const v = (k, label) => `<div><em>${label}</em>${viewSVG(st, k, { id: 'sd' + k, interactive: false })}</div>`;
  const sh = sheet(`<div class="sheet-hd"><h3>${t('sendTitle')}</h3><button class="x" data-close aria-label="${t('close')}">${ICON.x}</button></div>
    <p class="lead">${t('sendBody')}</p>
    <div class="views3">${v('plan', t('planShort'))}${v('front', t('frontShort'))}${v('side', t('sideShort'))}</div>
    <label class="field"><span>${t('msg')}</span><textarea rows="3" placeholder="${t('msgPh')}"></textarea></label>
    <div class="demo-banner">${ICON.info}<span>${t('sendNote')}</span></div>
    <button class="btn primary block" id="sendGo">${t('sendBtn')}</button>`);
  sh.el.querySelector('#sendGo').addEventListener('click', () => {
    // nothing leaves the device: the project is saved locally and we say so
    saveProject();
    sh.close();
    setTimeout(() => sheet(`<div class="done-ic">${ICON.check}</div><h3 class="center">${t('sentTitle')}</h3>
      <p class="lead center" style="margin-top:10px">${t('sentBody')}</p><button class="btn primary block" data-close>${t('ok')}</button>`), 300);
  });
}

// --- wiring -------------------------------------------------------------------------------------
$('bCat').addEventListener('click', openCatalog);
$('bSave').addEventListener('click', save);
$('bSave2').addEventListener('click', save);
$('bSend').addEventListener('click', openSend);
$('bSend2').addEventListener('click', openSend);
$('bProjects').addEventListener('click', openProjects);
$('bExport').addEventListener('click', openExport);
$('pName').addEventListener('click', rename);
$('bLang').addEventListener('click', () => setLang(getLang() === 'es' ? 'en' : 'es'));
$('bPhone').addEventListener('click', () => { phonePreview = true; layout(); render(); });
$('bDesk').addEventListener('click', () => { phonePreview = false; layout(); render(); });

onLang(() => {
  // product names follow the language; re-render everything
  $('catInline').innerHTML = catalogHTML();
  $('insp').dataset.id = '';
  setView(view);
  render();
});

subscribe(() => render());
buildRoom();
$('catInline').innerHTML = catalogHTML();
attachInteraction(stage);
boot();
apply();
layout();
setView('plan');

// keep the seed reachable from the console-free UI: an empty first run loads the demo
if (!S.items.length && !listProjects().length) load(seedProject());

// --- PWA: offline service worker -------------------------------------------------------------------
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
