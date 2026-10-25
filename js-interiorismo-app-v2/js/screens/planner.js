/* =========================================================================
   screens/planner.js — "Diseña tu espacio": the room planner
   2D floor-plan editor (SVG, drag / rotate / duplicate / delete), live 3D
   view (planner3d.js), 2D / 3D / split toggle, catalogue, finish picker,
   room size, AR-style preview and "send to Jorge" (demo).
   ========================================================================= */
import { t, onLang } from '../i18n.js';
import { h, icon, toast, esc } from '../ui.js';
import { CATALOGUE, FINISHES } from '../data.js';
import { finishURL, tileSizeCm } from '../textures.js';
import { pieceSVG, pieceThumb } from '../furniture2d.js';
import { saveDesign, uid } from '../store.js';
import { hasWebGL } from '../planner3d.js';
import { openSendSheet } from './send.js';

const MARGIN = 70;           // cm of breathing room around the plan
const SNAP = 5;              // position snap (cm)
const ROT_SNAP = 15;         // rotation snap (deg)

/**
 * What: catalogue entry for a type.
 * In:  type (string)
 * Out: catalogue object
 */
const cat = (type) => CATALOGUE.find((c) => c.type === type);

/**
 * What: half-extents of a rotated footprint (axis-aligned bounding box).
 * In:  item { type, rot }
 * Out: { hx, hy } in cm
 */
function halfExtents(item) {
  const c = cat(item.type), a = (item.rot * Math.PI) / 180;
  const cs = Math.abs(Math.cos(a)), sn = Math.abs(Math.sin(a));
  return { hx: (c.w / 2) * cs + (c.d / 2) * sn, hy: (c.w / 2) * sn + (c.d / 2) * cs };
}

/**
 * What: keep a piece inside the room (or centred if larger than the room).
 * In:  item (mutated), room { w, d }
 * Out: —
 */
function clampItem(item, room) {
  const { hx, hy } = halfExtents(item);
  item.x = hx * 2 > room.w ? room.w / 2 : Math.min(room.w - hx, Math.max(hx, item.x));
  item.y = hy * 2 > room.d ? room.d / 2 : Math.min(room.d - hy, Math.max(hy, item.y));
}

/**
 * What: mount the planner screen for one design.
 * In:  host (Element), design (object, edited in place), ctx { close(), openAR(type), goDesigns() }
 * Out: { el, destroy() }
 */
export function mountPlanner(host, design, ctx) {
  let view = 'split';
  let tab = 'furniture';
  let selected = null;
  let room3d = null;
  const webgl = hasWebGL();
  // --- markup ------------------------------------------------------------
  const el = h(`
    <section class="screen planner" aria-label="Planner">
      <header class="pl-top">
        <button class="icon-btn" data-act="back" aria-label="Back">${icon('back')}</button>
        <div class="pl-title"><span class="pl-name"></span><span class="pl-meta"></span></div>
        <button class="pill-btn primary sm" data-act="save">${icon('send', 16)}<span data-i18n="pl.save"></span></button>
      </header>
      <div class="pl-seg seg" role="tablist">
        <button data-view="2d" data-i18n="pl.view2d"></button>
        <button data-view="3d" data-i18n="pl.view3d"></button>
        <button data-view="split" data-i18n="pl.split"></button>
        <span class="seg-ind"></span>
      </div>
      <div class="pl-stage" data-view="split">
        <div class="pane pane-2d"><svg class="plan" xmlns="http://www.w3.org/2000/svg"></svg></div>
        <div class="pane pane-3d"><div class="gl-host"></div><div class="gl-badge">3D</div></div>
        <div class="pl-hint"></div>
        <div class="sel-bar" hidden>
          <span class="sel-name"></span>
          <button data-act="rot" aria-label="Rotate">${icon('rotate', 18)}</button>
          <button data-act="dup" aria-label="Duplicate">${icon('copy', 18)}</button>
          <button data-act="del" aria-label="Delete">${icon('trash', 18)}</button>
        </div>
        <button class="ar-fab" data-act="ar">${icon('ar', 18)}<span data-i18n="pl.ar"></span></button>
      </div>
      <div class="pl-panel">
        <div class="pl-tabs">
          <button data-tab="furniture" data-i18n="pl.furniture"></button>
          <button data-tab="finishes" data-i18n="pl.finishes"></button>
          <button data-tab="room" data-i18n="pl.room"></button>
        </div>
        <div class="pl-body"></div>
      </div>
    </section>`);
  host.appendChild(el);
  const svg = el.querySelector('svg.plan');
  const stage = el.querySelector('.pl-stage');
  const body = el.querySelector('.pl-body');
  const selBar = el.querySelector('.sel-bar');

  // --- persistence (autosave, debounced) ---------------------------------
  let saveT = 0;
  /**
   * What: schedule a save of the design to the device.
   * In:  —
   * Out: —
   */
  function persist() { clearTimeout(saveT); saveT = setTimeout(() => saveDesign(design), 350); }

  // --- 3D ----------------------------------------------------------------
  /**
   * What: create the 3D view on demand (lazy import keeps first paint light).
   * In:  —
   * Out: Promise<void>
   */
  async function ensure3D() {
    if (room3d || !webgl) return;
    const { Room3D } = await import('../planner3d.js');
    if (destroyed) return;
    room3d = new Room3D(el.querySelector('.gl-host'));
    room3d.set(design, selected);
    room3d.setActive(view !== '2d');
  }
  let raf3d = 0;
  /**
   * What: push the design to the 3D view at most once per frame.
   * In:  —
   * Out: —
   */
  function sync3D() {
    if (!room3d || raf3d) return;
    raf3d = requestAnimationFrame(() => { raf3d = 0; room3d && room3d.set(design, selected); });
  }

  // --- 2D plan rendering -------------------------------------------------
  /**
   * What: (re)draw the whole SVG plan from the design.
   * In:  —
   * Out: —
   */
  function draw2D() {
    const { w, d } = design.room;
    svg.setAttribute('viewBox', `${-MARGIN} ${-MARGIN} ${w + MARGIN * 2} ${d + MARGIN * 2}`);
    const ts = tileSizeCm(design.floor);
    const items = design.items.map((it) => itemMarkup(it)).join('');
    // dimension labels in metres
    const mw = (w / 100).toFixed(2), md = (d / 100).toFixed(2);
    svg.innerHTML = `
      <defs>
        <pattern id="pfloor" patternUnits="userSpaceOnUse" width="${ts}" height="${ts}"><image href="${finishURL(design.floor)}" width="${ts}" height="${ts}"/></pattern>
        <pattern id="pgrid" patternUnits="userSpaceOnUse" width="50" height="50"><path d="M50 0H0V50" fill="none" stroke="#B8643E" stroke-opacity=".08" stroke-width="1"/></pattern>
        <filter id="pshadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#3b2a1e" flood-opacity=".22"/></filter>
      </defs>
      <rect x="${-MARGIN}" y="${-MARGIN}" width="${w + MARGIN * 2}" height="${d + MARGIN * 2}" fill="url(#pgrid)"/>
      <rect x="0" y="0" width="${w}" height="${d}" fill="url(#pfloor)"/>
      <rect x="0" y="0" width="${w}" height="${d}" fill="#fff" fill-opacity=".12"/>
      <rect x="-7" y="-7" width="${w + 14}" height="${d + 14}" fill="none" stroke="#3E3027" stroke-width="14"/>
      <g class="dims" font-family="DM Sans, sans-serif" font-size="17" fill="#8B7563" text-anchor="middle">
        <line x1="0" y1="-38" x2="${w}" y2="-38" stroke="#B9A48F" stroke-width="1.2"/>
        <line x1="0" y1="-46" x2="0" y2="-30" stroke="#B9A48F" stroke-width="1.2"/><line x1="${w}" y1="-46" x2="${w}" y2="-30" stroke="#B9A48F" stroke-width="1.2"/>
        <rect x="${w / 2 - 34}" y="-50" width="68" height="24" rx="12" fill="#F7F1E8"/>
        <text x="${w / 2}" y="-32">${mw} m</text>
        <line x1="-38" y1="0" x2="-38" y2="${d}" stroke="#B9A48F" stroke-width="1.2"/>
        <line x1="-46" y1="0" x2="-30" y2="0" stroke="#B9A48F" stroke-width="1.2"/><line x1="-46" y1="${d}" x2="-30" y2="${d}" stroke="#B9A48F" stroke-width="1.2"/>
        <g transform="translate(-38 ${d / 2}) rotate(-90)"><rect x="-34" y="-12" width="68" height="24" rx="12" fill="#F7F1E8"/><text x="0" y="6">${md} m</text></g>
      </g>
      <g class="items">${items}</g>`;
    updateMeta();
  }

  /**
   * What: SVG markup for one placed piece (with selection chrome if selected).
   * In:  it (item)
   * Out: string
   */
  function itemMarkup(it) {
    const c = cat(it.type);
    const sel = it.id === selected;
    const chrome = sel ? `
      <rect x="${-c.w / 2 - 8}" y="${-c.d / 2 - 8}" width="${c.w + 16}" height="${c.d + 16}" rx="10" fill="#B8643E" fill-opacity=".06" stroke="#B8643E" stroke-width="2.2" stroke-dasharray="7 6"/>
      <line x1="0" y1="${-c.d / 2 - 8}" x2="0" y2="${-c.d / 2 - 40}" stroke="#B8643E" stroke-width="2.2"/>
      <circle class="rot-handle" cx="0" cy="${-c.d / 2 - 52}" r="13" fill="#fff" stroke="#B8643E" stroke-width="3"/>
      <circle cx="0" cy="${-c.d / 2 - 52}" r="4.5" fill="#B8643E" pointer-events="none"/>
      <circle class="rot-handle hit" cx="0" cy="${-c.d / 2 - 52}" r="30" fill="transparent"/>` : '';
    return `<g class="piece ${sel ? 'sel' : ''}" data-id="${it.id}" transform="translate(${it.x} ${it.y}) rotate(${it.rot})">
      <g filter="url(#pshadow)">${pieceSVG(it.type, c.w, c.d)}</g>
      <rect class="hit" x="${-c.w / 2}" y="${-c.d / 2}" width="${c.w}" height="${c.d}" fill="transparent"/>
      ${chrome}</g>`;
  }

  /**
   * What: refresh header name / area and the selection bar.
   * In:  —
   * Out: —
   */
  function updateMeta() {
    el.querySelector('.pl-name').textContent = design.name;
    const area = ((design.room.w * design.room.d) / 10000).toFixed(1);
    el.querySelector('.pl-meta').textContent = `${area} ${t('pl.area')} · ${design.items.length} ${t('ds.pieces')}${design.demo ? ' · ' + t('common.demo') : ''}`;
    const it = design.items.find((i) => i.id === selected);
    selBar.hidden = !it;
    if (it) selBar.querySelector('.sel-name').textContent = t('f.' + it.type);
    el.querySelector('.pl-hint').textContent = view === '3d' ? t('pl.hint3d') : t('pl.hint');
  }

  /**
   * What: move one piece's <g> without a full redraw (smooth dragging).
   * In:  it (item)
   * Out: —
   */
  function moveNode(it) {
    const g = svg.querySelector(`g.piece[data-id="${it.id}"]`);
    if (g) g.setAttribute('transform', `translate(${it.x} ${it.y}) rotate(${it.rot})`);
  }

  // --- pointer interaction on the plan -----------------------------------
  /**
   * What: convert a pointer event to plan coordinates (cm).
   * In:  e (PointerEvent)
   * Out: { x, y }
   */
  function toPlan(e) {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: p.x, y: p.y };
  }
  let drag = null;
  svg.addEventListener('pointerdown', (e) => {
    const g = e.target.closest('g.piece');
    if (!g) { select(null); return; }
    const it = design.items.find((i) => i.id === g.dataset.id);
    const p = toPlan(e);
    // rotate handle vs body drag
    if (e.target.classList.contains('rot-handle')) drag = { it, mode: 'rot' };
    else { drag = { it, mode: 'move', dx: p.x - it.x, dy: p.y - it.y, moved: false }; if (selected !== it.id) select(it.id, true); }
    svg.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  svg.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = toPlan(e), it = drag.it;
    if (drag.mode === 'move') {
      it.x = Math.round((p.x - drag.dx) / SNAP) * SNAP;
      it.y = Math.round((p.y - drag.dy) / SNAP) * SNAP;
      drag.moved = true;
    } else {
      // angle from piece centre to pointer, 0° = handle straight up
      const a = (Math.atan2(p.y - it.y, p.x - it.x) * 180) / Math.PI + 90;
      it.rot = ((Math.round(a / ROT_SNAP) * ROT_SNAP) % 360 + 360) % 360;
    }
    clampItem(it, design.room);
    moveNode(it); sync3D();
  });
  /**
   * What: finish a drag / rotate gesture and save.
   * In:  —
   * Out: —
   */
  function endDrag() {
    if (!drag) return;
    drag = null;
    draw2D(); sync3D(); persist();
  }
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);

  /**
   * What: select a piece (or none) and refresh the views.
   * In:  id (string|null), keepDrag (bool: don't redraw while a drag starts)
   * Out: —
   */
  function select(id, keepDrag = false) {
    selected = id;
    draw2D();
    // after a redraw the dragged node is new; the drag object keeps the item ref
    if (keepDrag) { /* nothing else needed */ }
    if (room3d) room3d.select(id);
  }

  // --- selection actions ---------------------------------------------------
  selBar.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const it = design.items.find((i) => i.id === selected); if (!it) return;
    if (b.dataset.act === 'rot') { it.rot = (it.rot + 90) % 360; clampItem(it, design.room); }
    if (b.dataset.act === 'dup') {
      const copy = { ...it, id: uid('p'), x: it.x + 30, y: it.y + 30 };
      clampItem(copy, design.room); design.items.push(copy); selected = copy.id;
    }
    if (b.dataset.act === 'del') { design.items = design.items.filter((i) => i.id !== it.id); selected = null; }
    draw2D(); sync3D(); persist();
  });

  // --- view toggle -------------------------------------------------------
  /**
   * What: switch between 2D, 3D and split views.
   * In:  v ('2d' | '3d' | 'split')
   * Out: —
   */
  function setView(v) {
    view = v;
    stage.dataset.view = v;
    el.querySelectorAll('.pl-seg button').forEach((b, i) => {
      b.classList.toggle('on', b.dataset.view === v);
      if (b.dataset.view === v) el.querySelector('.seg-ind').style.transform = `translateX(${i * 100}%)`;
    });
    if (v !== '2d') ensure3D();
    if (room3d) { room3d.setActive(v !== '2d'); room3d.resize(); }
    updateMeta();
  }
  el.querySelector('.pl-seg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setView(b.dataset.view); });
  if (!webgl) el.querySelector('.pane-3d').innerHTML = `<div class="nogl">${icon('info', 22)}<p>${t('pl.nowebgl')}</p></div>`;

  // --- bottom panel ------------------------------------------------------
  /**
   * What: render the active bottom-panel tab (furniture / finishes / room).
   * In:  —
   * Out: —
   */
  function drawPanel() {
    el.querySelectorAll('.pl-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    if (tab === 'furniture') {
      body.innerHTML = `<div class="cat-row">${CATALOGUE.map((c) => `
        <button class="cat-tile" data-type="${c.type}"><span class="cat-art">${pieceThumb(c.type, c.w, c.d)}</span>
        <span class="cat-name">${t('f.' + c.type)}</span><span class="cat-size">${c.w}×${c.d}</span></button>`).join('')}</div>`;
    } else if (tab === 'finishes') {
      const row = (slot) => `<div class="fin-row"><span class="fin-label">${t('pl.' + slot)}</span><div class="fin-chips">${FINISHES.map((f) => `
        <button class="fin-chip ${design[slot] === f.key ? 'on' : ''}" data-slot="${slot}" data-key="${f.key}" style="background-image:url(${finishURL(f.key, 128)})">
        <span>${t('fin.' + f.key)}</span></button>`).join('')}</div></div>`;
      body.innerHTML = row('floor') + row('wall');
    } else {
      const sl = (k, label) => `<label class="dim-row"><span>${t(label)}</span>
        <input type="range" min="250" max="700" step="10" value="${design.room[k]}" data-dim="${k}">
        <b>${(design.room[k] / 100).toFixed(2)} m</b></label>`;
      body.innerHTML = `<div class="dims-box">${sl('w', 'pl.width')}${sl('d', 'pl.depth')}
        <p class="dim-area">${icon('ruler', 16)} <span>${((design.room.w * design.room.d) / 10000).toFixed(1)} ${t('pl.area')}</span></p></div>`;
    }
  }
  el.querySelector('.pl-tabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { tab = b.dataset.tab; drawPanel(); } });
  body.addEventListener('click', (e) => {
    const tile = e.target.closest('.cat-tile');
    if (tile) {
      // add a piece near the centre, nudged so it doesn't stack exactly
      const n = design.items.length % 5;
      const it = { id: uid('p'), type: tile.dataset.type, x: design.room.w / 2 + (n - 2) * 15, y: design.room.d / 2 + (n - 2) * 15, rot: 0 };
      clampItem(it, design.room);
      design.items.push(it); selected = it.id;
      draw2D(); sync3D(); persist();
      toast(`${t('f.' + it.type)} ${t('pl.added')}`, 'plus');
      return;
    }
    const chip = e.target.closest('.fin-chip');
    if (chip) { design[chip.dataset.slot] = chip.dataset.key; drawPanel(); draw2D(); sync3D(); persist(); }
  });
  body.addEventListener('input', (e) => {
    const r = e.target.closest('input[data-dim]'); if (!r) return;
    design.room[r.dataset.dim] = +r.value;
    design.items.forEach((it) => clampItem(it, design.room));
    r.nextElementSibling.textContent = (r.value / 100).toFixed(2) + ' m';
    body.querySelector('.dim-area span').textContent = `${((design.room.w * design.room.d) / 10000).toFixed(1)} ${t('pl.area')}`;
    draw2D(); sync3D(); persist();
  });

  // --- header + AR actions -----------------------------------------------
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    if (b.dataset.act === 'back') { saveDesign(design); ctx.close(); }
    if (b.dataset.act === 'save') {
      saveDesign(design);
      openSendSheet(design, { onSaved: () => { draw2D(); }, goDesigns: () => { ctx.close(); ctx.goDesigns(); } });
    }
    if (b.dataset.act === 'ar') {
      const it = design.items.find((i) => i.id === selected);
      ctx.openAR(it ? it.type : (design.items.find((i) => i.type !== 'tapete') || { type: 'sofa' }).type);
    }
  });

  // --- language refresh ----------------------------------------------------
  const offLang = onLang(() => { drawPanel(); draw2D(); if (!webgl) el.querySelector('.nogl p').textContent = t('pl.nowebgl'); });
  let destroyed = false;

  // --- first render ------------------------------------------------------
  draw2D(); drawPanel(); setView(view);

  return {
    el,
    /**
     * What: pause the 3D loop when another layer covers the planner (AR).
     * In:  on (bool)
     * Out: —
     */
    pause(on) { if (room3d) room3d.setActive(!on && view !== '2d'); },
    /**
     * What: tear down the planner and free the 3D view.
     * In:  —
     * Out: —
     */
    destroy() {
      destroyed = true;
      clearTimeout(saveT); cancelAnimationFrame(raf3d);
      offLang();
      if (room3d) room3d.destroy();
      room3d = null;
      el.remove();
    },
  };
}
