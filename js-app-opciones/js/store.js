/* =========================================================================
   store.js — tiny persisted state (localStorage): language, note, favourites
   Favourites are a Set of item IDs (in memory), saved to localStorage as a
   JSON array. Nothing leaves the device: this prototype has no server.
   ========================================================================= */
const KEY = 'js-app-opciones:v1';
const listeners = new Set();

// --- load once, with safe defaults -------------------------------------------
let state = { lang: 'es', note: '' };
let favs = new Set();
try {
  const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (raw) { state = Object.assign(state, { lang: raw.lang, note: raw.note || '' }); favs = new Set(raw.favs || []); }
} catch (e) { /* private mode / corrupted value: keep defaults */ }

/**
 * What: write the state + the favourites Set (as an array) to localStorage.
 * In:  —
 * Out: —
 */
function save() {
  try { localStorage.setItem(KEY, JSON.stringify({ ...state, favs: [...favs] })); } catch (e) { /* storage full / blocked */ }
}

/**
 * What: read the plain state (lang, note) — treat as read-only.
 * In:  —
 * Out: state object
 */
export function get() { return state; }

/**
 * What: merge a patch into the state, persist it and notify listeners.
 * In:  patch (object)
 * Out: —
 */
export function set(patch) {
  state = Object.assign({}, state, patch);
  save();
  listeners.forEach((fn) => fn(state));
}

/**
 * What: subscribe to any change (state or favourites).
 * In:  fn (state => void)
 * Out: —
 */
export function onChange(fn) { listeners.add(fn); }

/**
 * What: is this item a favourite? (Set lookup)
 * In:  id (item id)
 * Out: boolean
 */
export function isFav(id) { return favs.has(id); }

/**
 * What: the favourite IDs, newest first (a Set keeps insertion order).
 * In:  —
 * Out: string[]
 */
export function favIds() { return [...favs].reverse(); }

/**
 * What: add or remove one favourite, persist, notify.
 * In:  id (item id)
 * Out: boolean — true if it is now a favourite
 */
export function toggleFav(id) {
  const on = !favs.has(id);
  if (on) favs.add(id); else favs.delete(id);
  save();
  listeners.forEach((fn) => fn(state));
  return on;
}
