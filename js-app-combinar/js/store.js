/* =========================================================================
   store.js — local persistence: edited Demo copies and imported projects.
   Everything stays on this device (localStorage). Nothing is uploaded.
   ========================================================================= */
import { DEMOS, cloneProject } from './data.js';

const KEY = 'jsc.projects.v1';

/**
 * What: read the saved state from localStorage.
 * In:   —
 * Out:  { edits: {id: project}, imported: [project] }
 */
function read() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { edits: s.edits || {}, imported: Array.isArray(s.imported) ? s.imported : [] };
  } catch (e) {
    return { edits: {}, imported: [] };
  }
}

/**
 * What: write the state back.
 * In:   s — state
 * Out:  —
 */
function write(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* quota / private mode: keep in memory only */ }
}

/**
 * What: all projects to list: Demos (with local edits applied) + imported.
 * In:   —
 * Out:  array of projects (each has id, name, room, items, flags)
 */
export function listProjects() {
  const s = read();
  // demos first, then the user's imports (newest first)
  const demos = DEMOS.map((d) => (s.edits[d.id] ? { ...cloneProject(s.edits[d.id]), id: d.id, demo: true, ref: d.ref, name: d.name, edited: true } : cloneProject(d)));
  return demos.concat(s.imported.slice().reverse().map((p) => ({ ...p, imported: true })));
}

/**
 * What: find one project by id.
 * In:   id
 * Out:  project or null
 */
export function getProject(id) {
  return listProjects().find((p) => p.id === id) || null;
}

/**
 * What: save an edited project (Demo → edit copy; imported → replace).
 * In:   p — project with id
 * Out:  —
 */
export function saveProject(p) {
  const s = read();
  const clean = { id: p.id, name: p.name, room: p.room, items: p.items };
  if (DEMOS.some((d) => d.id === p.id)) s.edits[p.id] = clean;
  else s.imported = s.imported.map((q) => (q.id === p.id ? clean : q));
  write(s);
}

/**
 * What: drop the local edits of a Demo project.
 * In:   id
 * Out:  —
 */
export function resetDemo(id) {
  const s = read();
  delete s.edits[id];
  write(s);
}

/**
 * What: add an imported project.
 * In:   p — normalised project (room, items, name)
 * Out:  the stored project (with a fresh id)
 */
export function addImported(p) {
  const s = read();
  const stored = { id: 'imp-' + Date.now().toString(36), name: p.name || null, room: p.room, items: p.items };
  s.imported.push(stored);
  // keep the list small on the device
  s.imported = s.imported.slice(-12);
  write(s);
  return stored;
}

/**
 * What: delete an imported project.
 * In:   id
 * Out:  —
 */
export function deleteImported(id) {
  const s = read();
  s.imported = s.imported.filter((q) => q.id !== id);
  write(s);
}
