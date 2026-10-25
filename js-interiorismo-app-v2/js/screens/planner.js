/* =========================================================================
   screens/planner.js — "Diseña tu espacio": the room planner
   A full-stage architectural 2D plan (SVG): drag / rotate / duplicate /
   delete pieces with live distance guides, two drawing modes (colour
   finishes or technical line drawing), catalogue, finish picker that
   repaints floor and walls, room size, the 2D "Ver en tu espacio" preview
   and "send to Jorge" (demo).
   ========================================================================= */
import { t, onLang } from '../i18n.js';
import { h, icon, toast } from '../ui.js';
import { CATALOGUE, FINISHES } from '../data.js';
import { finishURL } from '../textures.js';
import { pieceSVG, pieceThumb } from '../furniture2d.js';
import { planBox, planDefs, roomMarkup, annotationMarkup, guidesMarkup, pickDoor } from '../plan2d.js';
import { saveDesign, uid } from '../store.js';
import { openSendSheet } from './send.js';

const ROT_SNAP = 15;         // rotation magnet step (deg)
const ROT_PULL = 5;          // within this many degrees the magnet snaps
const ID = 'pl';             // defs id prefix for the editor SVG
const MODE_KEY = 'jsi-v2-planmode';

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
 * What: read the remembered drawing mode (colour / technical).
 * In:  —
 * Out: 'color' | 'tech'
 */
function savedMode() {
  try { return localStorage.getItem(MODE_KEY) === 'tech' ? 'tech' : 'color'; } catch (e) { return 'color'; }
}

/**
 * What: mount the planner screen for one design.
 * In:  host (Element), design (object, edited in place), ctx { close(), openAR(type), goDesigns() }
 * Out: { el, pause(), destroy() }
 */
export function mountPlanner(host, design, ctx) {
  let mode = savedMode();
  let tab = 'furniture';
  let selected = null;
  let fresh = null;          // id of a piece just added (plays the pop-in once)
  // --- markup ------------------------------------------------------------
  const el = h(`
    <section class="screen planner" aria-label="Planner">
      <header class="pl-top">
        <button class="icon-btn" data-act="back" aria-label="Back">${icon('back')}</button>
        <div class="pl-title"><span class="pl-name"></span><span class="pl-meta"></span></div>
        <button class="icon-btn place-btn" data-act="ar" data-i18n-aria="pl.ar">${icon('place', 21)}</button>
        <button class="pill-btn primary sm" data-act="save">${icon('send', 16)}<span data-i18n="pl.save"></span></button>
      </header>
      <div class="pl-seg seg two" role="tablist">
        <button data-mode="color" data-i18n="pl.mode.color"></button>
        <button data-mode="tech" data-i18n="pl.mode.tech"></button>
        <span class="seg-ind"></span>
      </div>
      <div class="pl-stage">
        <svg class="plan" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"></svg>
        <div class="pl-legend" aria-hidden="true">
          <span class="lg" data-slot="floor"><i></i><b></b></span>
          <span class="lg" data-slot="wall"><i></i><b></b></span>
        </div>
        <div class="pl-hint"></div>
        <div class="sel-bar" hidden>
          <span class="sel-name"></span><span class="sel-size"></span>
          <button data-act="rot" aria-label="Rotate">${icon('rotate', 18)}</button>
          <button data-act="dup" aria-label="Duplicate">${icon('copy', 18)}</button>
          <button data-act="del" aria-label="Delete">${icon('trash', 18)}</button>
        </div>
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

  // --- 2D plan rendering -------------------------------------------------
  /**
   * What: (re)draw the whole SVG plan from the design.
   * In:  —
   * Out: —
   */
  function draw2D() {
    // the door is placed once (where it doesn't hit furniture) and then kept
    if (!design.door) design.door = pickDoor(design, halfExtents);
    const b = planBox(design.room);
    svg.setAttribute('viewBox', `${b.x} ${b.y} ${b.w} ${b.h}`);
    svg.classList.toggle('tech', mode === 'tech');
    const labels = { area: t('pl.area'), floor: `${t('pl.floor')} ${t('fin.' + design.floor).toLowerCase()}`, wall: `${t('pl.wall')} ${t('fin.' + design.wall).toLowerCase()}` };
    svg.innerHTML = `${planDefs(design, ID)}
      <rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="url(#${ID}-grid)"/>
      <g class="room">${roomMarkup(design, ID, mode)}</g>
      <g class="items">${design.items.map((it) => itemMarkup(it)).join('')}</g>
      <g class="annot">${annotationMarkup(design, labels)}</g>
      <g class="guides"></g>`;
    fresh = null;
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
    // selection: dashed frame + stalk + round rotate handle (big invisible hit area)
    const hy = -c.d / 2 - 52;
    const chrome = sel ? `
      <rect x="${-c.w / 2 - 8}" y="${-c.d / 2 - 8}" width="${c.w + 16}" height="${c.d + 16}" rx="10" fill="#B8643E" fill-opacity=".05" stroke="#B8643E" stroke-width="2.2" stroke-dasharray="7 6"/>
      <line x1="0" y1="${-c.d / 2 - 8}" x2="0" y2="${hy + 13}" stroke="#B8643E" stroke-width="2.2"/>
      <circle cx="0" cy="${hy}" r="13" fill="#fff" stroke="#B8643E" stroke-width="3"/>
      <path d="M-5 ${hy - 1}a5.5 5.5 0 1 1 1.6 4.2" fill="none" stroke="#B8643E" stroke-width="2" stroke-linecap="round" pointer-events="none"/>
      <circle class="rot-handle" cx="0" cy="${hy}" r="32" fill="transparent"/>` : '';
    return `<g class="piece ${sel ? 'sel' : ''}" data-id="${it.id}" transform="translate(${it.x} ${it.y}) rotate(${it.rot})">
      <g class="body ${it.id === fresh ? 'pop' : ''}" filter="url(#${ID}-sh)">${pieceSVG(it.type, c.w, c.d)}</g>
      <rect class="hit" x="${-c.w / 2}" y="${-c.d / 2}" width="${c.w}" height="${c.d}" fill="transparent"/>
      ${chrome}</g>`;
  }

  /**
   * What: refresh header, finish legend, selection bar and hint.
   * In:  —
   * Out: —
   */
  function updateMeta() {
    el.querySelector('.pl-name').textContent = design.name;
    const area = ((design.room.w * design.room.d) / 10000).toFixed(1);
    el.querySelector('.pl-meta').textContent = `${area} ${t('pl.area')} · ${design.items.length} ${t('ds.pieces')}${design.demo ? ' · ' + t('common.demo') : ''}`;
    // legend chips: swatch + finish name for floor and wall
    el.querySelectorAll('.pl-legend .lg').forEach((lg) => {
      const key = design[lg.dataset.slot];
      lg.querySelector('i').style.backgroundImage = `url(${finishURL(key, 128)})`;
      lg.querySelector('b').textContent = `${t('pl.' + lg.dataset.slot)} · ${t('fin.' + key)}`;
    });
    const it = design.items.find((i) => i.id === selected);
    selBar.hidden = !it;
    if (it) {
      const c = cat(it.type);
      selBar.querySelector('.sel-name').textContent = t('f.' + it.type);
      selBar.querySelector('.sel-size').textContent = `${c.w}×${c.d}`;
    }
    el.querySelector('.pl-hint').textContent = t('pl.hint');
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

  /**
   * What: draw (or clear) the live guides for the piece being handled.
   * In:  it (item or null), gmode ('move' | 'rot')
   * Out: —
   */
  function drawGuides(it, gmode) {
    const g = svg.querySelector('g.guides'); if (!g) return;
    g.innerHTML = it ? guidesMarkup(it, halfExtents(it), design.room, gmode, -cat(it.type).d / 2 - 52) : '';
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
  let rafMove = 0;
  svg.addEventListener('pointerdown', (e) => {
    const g = e.target.closest('g.piece');
    if (!g) { if (selected) select(null); return; }
    const it = design.items.find((i) => i.id === g.dataset.id);
    const p = toPlan(e);
    // rotate handle vs body drag
    if (e.target.classList.contains('rot-handle')) drag = { it, mode: 'rot' };
    else { drag = { it, mode: 'move', dx: p.x - it.x, dy: p.y - it.y }; if (selected !== it.id) select(it.id); }
    // "pick up" feel: deeper shadow while the finger holds the piece
    const node = svg.querySelector(`g.piece[data-id="${it.id}"]`);
    if (node) { node.classList.add('lift'); node.querySelector('.body').setAttribute('filter', `url(#${ID}-lift)`); }
    drawGuides(it, drag.mode);
    svg.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  svg.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = toPlan(e), it = drag.it;
    if (drag.mode === 'move') {
      // follow the finger 1:1 (1 cm resolution), no jumpy grid
      it.x = Math.round(p.x - drag.dx);
      it.y = Math.round(p.y - drag.dy);
    } else {
      // angle from piece centre to pointer, 0° = handle straight up; soft magnet every 15°
      const a = (((Math.atan2(p.y - it.y, p.x - it.x) * 180) / Math.PI + 90) % 360 + 360) % 360;
      const near = Math.round(a / ROT_SNAP) * ROT_SNAP;
      it.rot = (Math.abs(a - near) <= ROT_PULL ? near : Math.round(a)) % 360;
    }
    clampItem(it, design.room);
    // paint at most once per frame
    if (!rafMove) rafMove = requestAnimationFrame(() => { rafMove = 0; if (drag) { moveNode(drag.it); drawGuides(drag.it, drag.mode); } });
  });
  /**
   * What: finish a drag / rotate gesture and save.
   * In:  —
   * Out: —
   */
  function endDrag() {
    if (!drag) return;
    drag = null;
    cancelAnimationFrame(rafMove); rafMove = 0;
    draw2D(); persist();
  }
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);

  /**
   * What: select a piece (or none) and redraw.
   * In:  id (string|null)
   * Out: —
   */
  function select(id) {
    selected = id;
    draw2D();
  }

  // --- selection actions ---------------------------------------------------
  selBar.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const it = design.items.find((i) => i.id === selected); if (!it) return;
    if (b.dataset.act === 'rot') { it.rot = (Math.round(it.rot / 90) * 90 + 90) % 360; clampItem(it, design.room); }
    if (b.dataset.act === 'dup') {
      // the copy lands slightly offset so both stay visible
      const copy = { ...it, id: uid('p'), x: it.x + 30, y: it.y + 30 };
      clampItem(copy, design.room); design.items.push(copy); selected = copy.id; fresh = copy.id;
    }
    if (b.dataset.act === 'del') { design.items = design.items.filter((i) => i.id !== it.id); selected = null; }
    draw2D(); persist();
  });

  // --- drawing mode toggle -------------------------------------------------
  /**
   * What: switch between the colour-finish plan and the technical drawing.
   * In:  m ('color' | 'tech')
   * Out: —
   */
  function setMode(m) {
    mode = m;
    try { localStorage.setItem(MODE_KEY, m); } catch (e) { /* private mode */ }
    el.querySelectorAll('.pl-seg button').forEach((b, i) => {
      b.classList.toggle('on', b.dataset.mode === m);
      if (b.dataset.mode === m) el.querySelector('.seg-ind').style.transform = `translateX(${i * 100}%)`;
    });
    el.querySelector('.pl-stage').classList.toggle('tech', m === 'tech');
    draw2D();
  }
  el.querySelector('.pl-seg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setMode(b.dataset.mode); });

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
      // one row per slot; the chip is the procedural texture itself
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
      design.items.push(it); selected = it.id; fresh = it.id;
      draw2D(); persist();
      toast(`${t('f.' + it.type)} ${t('pl.added')}`, 'plus');
      return;
    }
    const chip = e.target.closest('.fin-chip');
    if (chip) {
      design[chip.dataset.slot] = chip.dataset.key;
      drawPanel(); draw2D(); persist();
      // brief highlight on the legend chip that changed
      const lg = el.querySelector(`.pl-legend .lg[data-slot="${chip.dataset.slot}"]`);
      lg.classList.remove('flash'); void lg.offsetWidth; lg.classList.add('flash');
    }
  });
  body.addEventListener('input', (e) => {
    const r = e.target.closest('input[data-dim]'); if (!r) return;
    design.room[r.dataset.dim] = +r.value;
    design.items.forEach((it) => clampItem(it, design.room));
    r.nextElementSibling.textContent = (r.value / 100).toFixed(2) + ' m';
    body.querySelector('.dim-area span').textContent = `${((design.room.w * design.room.d) / 10000).toFixed(1)} ${t('pl.area')}`;
    draw2D(); persist();
  });

  // --- header + preview actions --------------------------------------------
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    if (b.dataset.act === 'back') { saveDesign(design); ctx.close(); }
    if (b.dataset.act === 'save') {
      saveDesign(design);
      openSendSheet(design, { onSaved: () => { draw2D(); }, goDesigns: () => { ctx.close(); ctx.goDesigns(); }, goProgress: () => { ctx.close(); ctx.goProgress(); } });
    }
    if (b.dataset.act === 'ar') {
      // preview the selected piece, else the first piece that isn't a rug
      const it = design.items.find((i) => i.id === selected);
      ctx.openAR(it ? it.type : (design.items.find((i) => i.type !== 'tapete') || { type: 'sofa' }).type);
    }
  });

  // --- language refresh ----------------------------------------------------
  const offLang = onLang(() => { drawPanel(); draw2D(); });

  // --- first render ------------------------------------------------------
  drawPanel(); setMode(mode);

  return {
    el,
    /**
     * What: kept for the app shell's API (the 2D plan has no loop to pause).
     * In:  on (bool)
     * Out: —
     */
    pause() { /* nothing runs in the background */ },
    /**
     * What: tear down the planner.
     * In:  —
     * Out: —
     */
    destroy() {
      clearTimeout(saveT); cancelAnimationFrame(rafMove);
      offLang();
      el.remove();
    },
  };
}
