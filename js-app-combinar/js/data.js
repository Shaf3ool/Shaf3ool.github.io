/* =========================================================================
   data.js — Demo projects (cm) + palette + project validation
   Format (shared with js-app-taller):
   { room:{w,l,h}, items:[{name,x,y,w,d,h,rot,color, z?, type?}] }
   (x,y) = top-left of the footprint at rot 0, origin = inner top-left corner
   of the room (back wall at y=0). rot = degrees clockwise about the centre.
   All projects here are DEMO data — not real client work.
   ========================================================================= */

// --- material colours (warm palette; names only, no claims) ---------------
export const MAT = {
  roble: '#C49A6C', nogal: '#7A5235', lino: '#E9DFCF', travertino: '#D9CBB3',
  terracota: '#B8643E', olivo: '#6E7656', salvia: '#9AA58A', piedra: '#BDB3A4',
  negro: '#3A332E', blanco: '#F4EFE6', barro: '#A8572F', arena: '#E2D3BC',
};

// --- three Demo projects -------------------------------------------------
export const DEMOS = [
  {
    id: 'recamara', demo: true, ref: 'img/recamara-1-sm.webp',
    name: { es: 'Recámara principal', en: 'Main bedroom' },
    room: { w: 420, l: 380, h: 270, floor: MAT.roble, wall: '#F1E9DD' },
    items: [
      { name: 'Cama queen', type: 'cama', x: 130, y: 0, w: 160, d: 205, h: 105, rot: 0, color: MAT.nogal },
      { name: 'Buró', type: 'buro', x: 72, y: 4, w: 50, d: 40, h: 55, rot: 0, color: MAT.roble },
      { name: 'Buró', type: 'buro', x: 298, y: 4, w: 50, d: 40, h: 55, rot: 0, color: MAT.roble },
      // tapete under the bed foot, banca at the foot of the bed
      { name: 'Tapete', type: 'tapete', x: 110, y: 120, w: 200, d: 150, h: 1, rot: 0, color: MAT.arena },
      { name: 'Banca', type: 'banca', x: 150, y: 222, w: 120, d: 40, h: 45, rot: 0, color: MAT.terracota },
      // closet on the left wall, rotated 90°
      { name: 'Closet', type: 'closet', x: -60, y: 220, w: 180, d: 60, h: 240, rot: 90, color: MAT.salvia },
      { name: 'Sillón', type: 'sillon', x: 318, y: 272, w: 80, d: 80, h: 80, rot: 135, color: MAT.olivo },
      { name: 'Planta', type: 'planta', x: 372, y: 20, w: 40, d: 40, h: 130, rot: 0, color: MAT.olivo },
    ],
  },
  {
    id: 'estancia', demo: true, ref: 'img/loft-1-sm.webp',
    name: { es: 'Estancia y comedor', en: 'Living & dining' },
    room: { w: 620, l: 460, h: 280, floor: MAT.travertino, wall: '#F3ECE2' },
    items: [
      { name: 'Credenza', type: 'credenza', x: 50, y: 0, w: 200, d: 45, h: 60, rot: 0, color: MAT.nogal },
      { name: 'Tapete', type: 'tapete', x: 40, y: 110, w: 240, d: 180, h: 1, rot: 0, color: MAT.lino },
      { name: 'Mesa de centro', type: 'mesa_centro', x: 105, y: 170, w: 110, d: 60, h: 38, rot: 0, color: MAT.roble },
      // sofa faces the credenza (rotated 180°)
      { name: 'Sofá', type: 'sofa', x: 40, y: 270, w: 240, d: 95, h: 80, rot: 180, color: MAT.lino },
      { name: 'Sillón', type: 'sillon', x: 285, y: 150, w: 85, d: 85, h: 80, rot: 90, color: MAT.terracota },
      // dining: table + four chairs
      { name: 'Comedor', type: 'mesa', x: 400, y: 170, w: 180, d: 95, h: 76, rot: 90, color: MAT.roble },
      { name: 'Silla', type: 'silla', x: 390, y: 155, w: 46, d: 50, h: 85, rot: -90, color: MAT.olivo },
      { name: 'Silla', type: 'silla', x: 390, y: 230, w: 46, d: 50, h: 85, rot: -90, color: MAT.olivo },
      { name: 'Silla', type: 'silla', x: 543, y: 155, w: 46, d: 50, h: 85, rot: 90, color: MAT.olivo },
      { name: 'Silla', type: 'silla', x: 543, y: 230, w: 46, d: 50, h: 85, rot: 90, color: MAT.olivo },
      { name: 'Planta', type: 'planta', x: 570, y: 10, w: 45, d: 45, h: 150, rot: 0, color: MAT.olivo },
      { name: 'Lámpara de pie', type: 'lampara', x: 10, y: 395, w: 40, d: 40, h: 160, rot: 0, color: MAT.negro },
    ],
  },
  {
    id: 'cocina', demo: true, ref: 'img/cocina-neutra-1-sm.webp',
    name: { es: 'Cocina con isla', en: 'Kitchen with island' },
    room: { w: 480, l: 400, h: 270, floor: MAT.piedra, wall: '#F2EBE0' },
    items: [
      { name: 'Cocina lineal', type: 'cocina', x: 0, y: 0, w: 330, d: 65, h: 92, rot: 0, color: MAT.blanco },
      { name: 'Alacena alta', type: 'alacena', x: 0, y: 0, w: 330, d: 35, h: 75, z: 150, rot: 0, color: MAT.roble },
      { name: 'Refrigerador', type: 'refri', x: 340, y: 0, w: 90, d: 72, h: 195, rot: 0, color: MAT.piedra },
      // island centred in the room with three stools in front
      { name: 'Isla', type: 'isla', x: 130, y: 165, w: 220, d: 100, h: 92, rot: 0, color: MAT.salvia },
      { name: 'Banco', type: 'banco', x: 160, y: 290, w: 40, d: 40, h: 75, rot: 0, color: MAT.nogal },
      { name: 'Banco', type: 'banco', x: 220, y: 290, w: 40, d: 40, h: 75, rot: 0, color: MAT.nogal },
      { name: 'Banco', type: 'banco', x: 280, y: 290, w: 40, d: 40, h: 75, rot: 0, color: MAT.nogal },
      { name: 'Planta', type: 'planta', x: 425, y: 330, w: 45, d: 45, h: 120, rot: 0, color: MAT.olivo },
    ],
  },
];

/**
 * What: check and normalise a project object (imported JSON or edited).
 * In:   raw — any parsed JSON value
 * Out:  { ok:true, project } or { ok:false, error:'i18n key' }
 */
export function normalizeProject(raw) {
  // accept { room, items } at the root or wrapped in { project:{…} }
  const p = raw && raw.room ? raw : (raw && raw.project && raw.project.room ? raw.project : null);
  if (!p) return { ok: false, error: 'err.noRoom' };
  const num = (v, d) => (Number.isFinite(+v) ? +v : d);
  const room = { w: num(p.room.w, 0), l: num(p.room.l, 0), h: num(p.room.h, 0) };
  if (room.w < 50 || room.l < 50 || room.h < 50 || room.w > 5000 || room.l > 5000 || room.h > 1000) return { ok: false, error: 'err.roomSize' };
  // keep optional finish colours when they look like hex colours
  const hex = (c) => (typeof c === 'string' && /^#[0-9a-f]{3,8}$/i.test(c) ? c : null);
  room.floor = hex(p.room.floor) || MAT.roble;
  room.wall = hex(p.room.wall) || '#F1E9DD';
  if (!Array.isArray(p.items)) return { ok: false, error: 'err.noItems' };
  // items: clamp numbers, keep the shared keys only
  const items = p.items.slice(0, 80).map((it, i) => ({
    name: String(it.name || `Pieza ${i + 1}`).slice(0, 40),
    type: it.type ? String(it.type).slice(0, 24) : undefined,
    x: num(it.x, 0), y: num(it.y, 0),
    w: Math.max(1, num(it.w, 50)), d: Math.max(1, num(it.d, 50)), h: Math.max(0.5, num(it.h, 50)),
    z: Math.max(0, num(it.z, 0)), rot: num(it.rot, 0),
    color: hex(it.color) || MAT.roble,
  }));
  const name = typeof p.name === 'string' ? p.name : (p.name && p.name.es) || null;
  return { ok: true, project: { room, items, name } };
}

/**
 * What: deep copy of a project (so edits never touch the Demo originals).
 * In:   p — project
 * Out:  new project object
 */
export function cloneProject(p) {
  return JSON.parse(JSON.stringify(p));
}
