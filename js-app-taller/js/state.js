/* =========================================================================
   state.js: the single source of truth for the Taller (room + items),
   change notifications, the working draft and "Mis proyectos" in
   localStorage. Export format (cm): {room:{w,l,h}, items:[{name,x,y,w,d,h,
   rot,color,z?,type?}]}; see README.md.
   ========================================================================= */
import { CATALOG, byType } from './catalog.js';
import { clampItem } from './geometry.js';

const DRAFT_KEY = 'taller.draft.v1';
const PROJ_KEY = 'taller.projects.v1';
export const LIMITS = { w: [200, 1200], l: [200, 1500], h: [220, 400] };

let uid = 1;
const subs = [];

/**
 * What: make a placed item from a catalogue type.
 * In:  type (string), x, y (cm), extra (object, optional overrides)
 * Out: item object
 */
export function makeItem(type, x, y, extra = {}) {
  const c = byType(type);
  // copy the product's real dimensions; z only for wall/ceiling pieces
  return Object.assign({
    id: 'i' + (uid++), type, name: c.es, nameEn: c.en,
    x, y, w: c.w, d: c.d, h: c.h, rot: 0, color: c.color, z: c.z || 0,
  }, extra);
}

/**
 * What: the Demo seed project (living-dining room).
 * In:  —
 * Out: project {name, room, items}
 */
export function seedProject() {
  const m = makeItem;
  // a calm living area on top, dining area below (all Demo)
  return {
    name: 'Sala-comedor', demo: true,
    room: { w: 480, l: 620, h: 270 },
    items: [
      m('tapete', 120, 105),
      m('mueblet', 150, 0),
      m('cuadro', 195, 0, { z: 120 }),
      m('mesac', 185, 165),
      m('sofa', 130, 250, { rot: 180 }),
      m('sillon', 20, 130, { rot: 270 }),
      m('planta', 418, 12),
      m('librero', 402, 260, { rot: 90 }),
      m('mesa', 150, 440),
      m('silla', 180, 386), m('silla', 254, 386),
      m('silla', 180, 532, { rot: 180 }), m('silla', 254, 532, { rot: 180 }),
      m('lampara', 215, 460, { z: 180 }),
    ],
  };
}

// --- live state --------------------------------------------------------------
export const S = { name: '', room: { w: 480, l: 620, h: 270 }, items: [], sel: null, projectId: null };

/**
 * What: subscribe to state changes.
 * In:  fn (function(reason))
 * Out: —
 */
export function subscribe(fn) { subs.push(fn); }

/**
 * What: notify subscribers and persist the working draft.
 * In:  reason (string: 'move' | 'room' | 'items' | 'sel' | 'load')
 * Out: —
 */
export function emit(reason) {
  subs.forEach((fn) => fn(reason));
  // moves are frequent: persisting the draft on each is still cheap (small JSON)
  if (reason !== 'sel') localStorage.setItem(DRAFT_KEY, JSON.stringify(serialize()));
}

/**
 * What: current selected item.
 * In:  —
 * Out: item or null
 */
export function selected() { return S.items.find((i) => i.id === S.sel) || null; }

/**
 * What: change room dimensions and keep every item inside.
 * In:  key ('w'|'l'|'h'), value (cm)
 * Out: —
 */
export function setRoom(key, value) {
  const [lo, hi] = LIMITS[key];
  S.room[key] = Math.max(lo, Math.min(hi, Math.round(value)));
  S.items.forEach((it) => clampItem(it, S.room));
  emit('room');
}

/**
 * What: add a catalogue product near the centre of the room.
 * In:  type (string)
 * Out: the new item
 */
export function addItem(type) {
  const c = byType(type);
  const it = makeItem(type, Math.round(S.room.w / 2 - c.w / 2), Math.round(S.room.l / 2 - c.d / 2));
  // wall pieces start against the back wall
  if (c.mount === 'wall') it.y = 0;
  clampItem(it, S.room);
  S.items.push(it); S.sel = it.id;
  emit('items');
  return it;
}

/**
 * What: remove or duplicate the selected item.
 * In:  action ('del' | 'dup')
 * Out: —
 */
export function editSelected(action) {
  const it = selected(); if (!it) return;
  if (action === 'del') { S.items = S.items.filter((i) => i !== it); S.sel = null; }
  if (action === 'dup') {
    const copy = Object.assign({}, it, { id: 'i' + (uid++), x: it.x + 30, y: it.y + 30 });
    clampItem(copy, S.room); S.items.push(copy); S.sel = copy.id;
  }
  emit('items');
}

/**
 * What: the export JSON in the shared format (cm).
 * In:  —
 * Out: plain object {version, app, name, room, items}
 */
export function serialize() {
  return {
    version: 1, app: 'js-app-taller', demo: true, name: S.name, savedAt: new Date().toISOString(),
    room: { ...S.room },
    // item fields follow the shared format; z and type are optional extras
    items: S.items.map((i) => ({
      name: i.name, x: i.x, y: i.y, w: i.w, d: i.d, h: i.h, rot: ((i.rot % 360) + 360) % 360,
      color: i.color, z: i.z || 0, type: i.type,
    })),
  };
}

/**
 * What: load a project object (shared format) into the live state.
 * In:  p ({name?, room, items}), projectId (string | null)
 * Out: —
 */
export function load(p, projectId = null) {
  S.name = p.name || 'Proyecto';
  S.room = { w: +p.room.w, l: +p.room.l, h: +p.room.h };
  // rebuild items with fresh ids; unknown fields are ignored
  S.items = (p.items || []).map((i) => {
    const c = CATALOG.find((k) => k.type === i.type);
    return { id: 'i' + (uid++), type: i.type || 'box', name: i.name, nameEn: c ? c.en : i.name,
      x: +i.x, y: +i.y, w: +i.w, d: +i.d, h: +i.h, rot: +i.rot || 0, color: i.color || '#D6C6A8', z: +i.z || 0 };
  });
  S.sel = null; S.projectId = projectId;
  emit('load');
}

/**
 * What: restore the last working draft, or the Demo seed on first run.
 * In:  —
 * Out: —
 */
export function boot() {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    if (d && d.room && Array.isArray(d.items)) { load(d); return; }
  } catch (e) { /* corrupt draft: fall through to the seed */ }
  load(seedProject());
}

// --- Mis proyectos -----------------------------------------------------------
/**
 * What: read the saved projects list (newest first).
 * In:  —
 * Out: array of {id, savedAt, data}
 */
export function listProjects() {
  try { return JSON.parse(localStorage.getItem(PROJ_KEY) || '[]'); } catch (e) { return []; }
}

/**
 * What: save the live state into Mis proyectos (update if already saved).
 * In:  —
 * Out: saved entry
 */
export function saveProject() {
  const list = listProjects();
  const data = serialize();
  // reuse the id when this project was opened from the list
  const id = S.projectId || ('p' + Date.now());
  const entry = { id, savedAt: data.savedAt, data };
  const at = list.findIndex((p) => p.id === id);
  if (at >= 0) list.splice(at, 1);
  list.unshift(entry);
  localStorage.setItem(PROJ_KEY, JSON.stringify(list));
  S.projectId = id;
  return entry;
}

/**
 * What: delete a saved project.
 * In:  id (string)
 * Out: —
 */
export function deleteProject(id) {
  localStorage.setItem(PROJ_KEY, JSON.stringify(listProjects().filter((p) => p.id !== id)));
  if (S.projectId === id) S.projectId = null;
}
