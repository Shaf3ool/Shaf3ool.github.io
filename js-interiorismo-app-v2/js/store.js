/* =========================================================================
   store.js — tiny persisted state (localStorage) for designs, board, booking
   Everything stays on the device; nothing is sent anywhere.
   ========================================================================= */
import { TEMPLATES } from './data.js';

const KEY = 'jsapp2.state.v1';
const listeners = new Set();

/**
 * What: build a fresh unique id.
 * In:  prefix (string)
 * Out: string id
 */
export function uid(prefix = 'id') {
  return prefix + '-' + Math.random().toString(36).slice(2, 9);
}

/**
 * What: deep-copy a template into a design object.
 * In:  tplKey (string), name (string), demo (bool)
 * Out: design object { id, name, room, floor, wall, items[], status, demo, updated }
 */
export function designFromTemplate(tplKey, name, demo = false) {
  const tpl = TEMPLATES[tplKey] || TEMPLATES.blanco;
  // every piece gets its own id so the planner can select it
  return {
    id: uid('d'), name, tpl: tplKey, demo,
    room: { ...tpl.room }, floor: tpl.floor, wall: tpl.wall,
    items: tpl.items.map((it) => ({ ...it, id: uid('p') })),
    status: 'draft', note: '', updated: Date.now(),
  };
}

/**
 * What: the seeded demo state shown on first launch.
 * In:  —
 * Out: state object
 */
function seed() {
  const a = designFromTemplate('sala', 'Sala Mediterránea', true);
  const b = designFromTemplate('recamara', 'Recámara principal', true);
  // the second demo shows the "in review" timeline
  b.status = 'review'; b.updated = Date.now() - 1000 * 60 * 60 * 26;
  a.updated = Date.now() - 1000 * 60 * 40;
  return { designs: [a, b], board: ['bano-chukum', 'loft'], booking: null, onboarded: false, approvals: {}, approvalNotes: {} };
}

// --- load once ------------------------------------------------------------
let state;
try { state = JSON.parse(localStorage.getItem(KEY)) || seed(); } catch (e) { state = seed(); }

/**
 * What: read the whole state (treat as read-only; use update()).
 * In:  —
 * Out: state object
 */
export function get() { return state; }

/**
 * What: mutate state through a function, persist, notify subscribers.
 * In:  fn (state) => void
 * Out: —
 */
export function update(fn) {
  fn(state);
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* quota / private mode */ }
  listeners.forEach((l) => l(state));
}

/**
 * What: subscribe to state changes.
 * In:  fn (state) => void
 * Out: unsubscribe function
 */
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

/**
 * What: restore the seeded demo data (keeps onboarding done).
 * In:  —
 * Out: —
 */
export function reset() {
  update((s) => { const f = seed(); f.onboarded = true; Object.assign(s, f); });
}

/**
 * What: toggle a project slug on the inspiration board.
 * In:  slug (string)
 * Out: true if now saved
 */
export function toggleBoard(slug) {
  let saved = false;
  update((s) => {
    const i = s.board.indexOf(slug);
    if (i >= 0) s.board.splice(i, 1); else { s.board.unshift(slug); saved = true; }
  });
  return saved;
}

/**
 * What: insert or replace a design by id.
 * In:  design object
 * Out: —
 */
export function saveDesign(design) {
  update((s) => {
    design.updated = Date.now();
    const i = s.designs.findIndex((d) => d.id === design.id);
    const copy = JSON.parse(JSON.stringify(design));
    if (i >= 0) s.designs[i] = copy; else s.designs.unshift(copy);
  });
}
