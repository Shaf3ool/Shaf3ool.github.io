/* =========================================================================
   interact.js: pointer dragging on the drawings. All three views render
   from the same data, so a drag in any view updates the other two.
   - Plan: drag moves x,y · the round handle rotates (snaps to 15°).
   - Frontal: horizontal drag moves x · vertical drag changes z (wall /
     ceiling pieces only).
   - Lateral: horizontal drag moves y (u = l − y) · vertical drag changes z.
   Pixels → cm through the inverse screen matrix of the view group (the
   scale factor), then snap to 5 cm and clamp inside the room.
   ========================================================================= */
import { S, emit, selected } from './state.js';
import { clampItem, snap, center } from './geometry.js';
import { byType } from './catalog.js';
import { t } from './i18n.js';
import { toast } from './ui.js';

const STEP = 5;     // cm snap
const ROT_STEP = 15; // degrees snap for the rotation handle

/**
 * What: convert a pointer event to local cm coordinates of a view group.
 * In:  e (PointerEvent or {clientX, clientY}), inv (DOMMatrix: inverse screen CTM of the group)
 * Out: {x, y} in the group's local space (cm; elevations use y = −z)
 */
function local(e, inv) {
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(inv);
  return { x: p.x, y: p.y };
}

/**
 * What: attach drag / select / rotate handling to the stage element.
 * In:  stage (HTMLElement holding the SVG, persists across re-renders)
 * Out: —
 */
export function attachInteraction(stage) {
  let drag = null;
  let hinted = false;

  stage.addEventListener('pointerdown', (e) => {
    const handle = e.target.closest('.rh');
    const itEl = e.target.closest('.it');
    const group = e.target.closest('[data-view]');
    // tap on empty paper clears the selection
    if (!group || (!itEl && !handle)) { if (S.sel) { S.sel = null; emit('sel'); } return; }
    const id = (handle || itEl).dataset.id;
    const it = S.items.find((i) => i.id === id); if (!it) return;
    // remember where the drag started (item values + pointer in screen px);
    // cm are computed on each move with the view's current matrix, so a
    // re-layout after selecting never skews the drag
    drag = { id, view: group.dataset.view, sx: e.clientX, sy: e.clientY, x: it.x, y: it.y, z: it.z || 0, rotate: !!handle, moved: false, pid: e.pointerId };
    stage.setPointerCapture(e.pointerId);
    stage.classList.add('dragging');
    if (S.sel !== id) { S.sel = id; emit('sel'); }
    e.preventDefault();
  });

  stage.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.pid) return;
    const it = selected(); if (!it) return;
    const g = stage.querySelector(`[data-view="${drag.view}"]`); if (!g) return;
    const inv = g.getScreenCTM().inverse();
    const p = local(e, inv), p0 = local({ clientX: drag.sx, clientY: drag.sy }, inv);
    const dx = p.x - p0.x, dy = p.y - p0.y;
    // ignore micro-movements so a tap stays a tap
    if (!drag.moved && Math.hypot(dx, dy) < 2) return;
    drag.moved = true;
    const mount = byType(it.type).mount;
    if (drag.rotate) {
      // angle from the item centre to the pointer; 0° = handle straight up
      const { cx, cy } = center(it);
      const a = Math.atan2(p.x - cx, -(p.y - cy)) * 180 / Math.PI;
      it.rot = ((snap(a, ROT_STEP) % 360) + 360) % 360;
    } else if (drag.view === 'plan') {
      it.x = snap(drag.x + dx, STEP); it.y = snap(drag.y + dy, STEP);
    } else {
      // elevations: horizontal = x (front) or −y (side); vertical = −z
      if (drag.view === 'front') it.x = snap(drag.x + dx, STEP); else it.y = snap(drag.y - dx, STEP);
      if (mount !== 'floor') it.z = Math.max(0, snap(drag.z - dy, STEP));
      else if (!hinted && Math.abs(dy) > 25) { hinted = true; toast(t('floorOnly')); }
    }
    clampItem(it, S.room);
    emit('move');
  });

  /**
   * What: finish a drag (pointerup / cancel).
   * In:  e (PointerEvent)
   * Out: —
   */
  const end = (e) => {
    if (!drag || e.pointerId !== drag.pid) return;
    stage.classList.remove('dragging');
    if (drag.moved) emit('items');
    drag = null;
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
}
