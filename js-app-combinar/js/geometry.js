/* =========================================================================
   geometry.js — turns a project (plan coordinates, cm) into simple solids
   (cuboids, plus a few small prisms/circles) and projects them with the
   isometric formula. Pure math, no DOM. No WebGL: everything is drawn
   later as flat SVG polygons.
   Plan axes (shared with js-app-taller): x → right, y → toward the front
   wall (down in the plan), z → up. Origin = inner top-left room corner.
   ========================================================================= */

export const WALL_T = 15;   // wall thickness, cm
export const SLAB_T = 14;   // floor slab thickness, cm

// --- constants --------------------------------------------------------------
const DEG = Math.PI / 180;

/**
 * What: strip accents + lowercase, for matching furniture types by keyword.
 * In:   s — string
 * Out:  normalised string
 */
function norm(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/**
 * What: decide which drawing recipe an item uses (from `type`, else its name).
 * In:   it — item
 * Out:  recipe key
 */
export function kindOf(it) {
  const s = norm(it.type) + ' ' + norm(it.name);
  // ordered: more specific words first
  const table = [
    ['tapete', /tapete|alfombra|rug/], ['planta', /planta|plant|maceta/], ['lampara', /lampara|lamp/],
    ['sofa', /sofa|sillon|couch|loveseat|armchair/], ['cama', /cama|bed/],
    ['silla', /silla|chair/], ['banco', /banco|banca|stool|bench|taburete/],
    ['cocina', /cocina|kitchen|isla|island|barra/], ['alto', /closet|ropero|armario|wardrobe|librero|vestidor|alacena|refri|fridge/],
    ['mesa', /mesa|comedor|table|escritorio|desk/],
    ['mueble', /credenza|buro|tocador|mueble|comoda|cabinet|tv/],
  ];
  for (const [k, re] of table) if (re.test(s)) return k;
  return 'box';
}

/**
 * What: make a footprint helper for one item: local rectangles → plan polygons.
 * In:   it — item (x,y = top-left at rot 0; rot clockwise about the centre)
 * Out:  { P(lx,ly)→[x,y], rect(x0,y0,x1,y1)→4 points }; local ly<0 = item back
 */
function framer(it) {
  const cx = it.x + it.w / 2, cy = it.y + it.d / 2;
  const c = Math.cos((it.rot || 0) * DEG), s = Math.sin((it.rot || 0) * DEG);
  // plan coordinates: y grows toward the front wall (downward in the plan)
  const P = (lx, ly) => [cx + lx * c - ly * s, cy + lx * s + ly * c];
  const rect = (x0, y0, x1, y1) => [P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)];
  return { P, rect, cx, cy, c, s };
}

/**
 * What: regular polygon footprint (pots, lamp bases) around a local point.
 * In:   f — framer, lx, ly — local centre, r — radius, n — sides
 * Out:  plan [x,y] points
 */
function ngon(f, lx, ly, r, n = 10) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push(f.P(lx + Math.cos(a) * r, ly + Math.sin(a) * r));
  }
  return pts;
}

/**
 * What: build one vertical prism (box, octagon…) part.
 * In:   foot — plan footprint, z0/z1 — base/top height, color, extra props
 * Out:  part object { kind:'prism', foot (plan points), z0, z1, color, … }
 */
function prism(foot, z0, z1, color, extra = {}) {
  return { kind: 'prism', foot, z0, z1, color, ...extra };
}

/**
 * What: vertical door/drawer lines drawn on the item's front face.
 * In:   f — framer, it — item, n — door count, z0/z1, ly — local front
 * Out:  decor entry { n: outward normal, segs: [[p,q]…] }
 */
function frontLines(f, it, n, z0, z1, ly) {
  const segs = [];
  for (let i = 1; i < n; i++) {
    const lx = -it.w / 2 + (it.w * i) / n;
    const [X, Y] = f.P(lx, ly);
    segs.push([[X, Y, z0 + 4], [X, Y, z1 - 4]]);
  }
  // outward normal of the local front (+ly) in plan space
  return { n: [-f.s, f.c, 0], segs };
}

/**
 * What: turn one item into simple solids following its recipe.
 * In:   it — item (cm)
 * Out:  array of parts (prisms / spheres), all tagged with the item index
 */
export function itemParts(it) {
  const f = framer(it), w = it.w, d = it.d, h = it.h, z = it.z || 0;
  const W2 = w / 2, D2 = d / 2, col = it.color, k = kindOf(it);
  const parts = [];
  // shorthand: box from local rect between heights
  const box = (x0, y0, x1, y1, z0, z1, c = col, extra) => parts.push(prism(f.rect(x0, y0, x1, y1), z + z0, z + z1, c, extra));
  if (k === 'tapete') {
    // rug: flat slab with a woven border line on top
    const inset = Math.min(w, d) * 0.08, b = f.rect(-W2 + inset, -D2 + inset, W2 - inset, D2 - inset);
    const segs = b.map((p, i) => [[...p, z + Math.max(h, 1)], [...b[(i + 1) % 4], z + Math.max(h, 1)]]);
    box(-W2, -D2, W2, D2, 0, Math.max(h, 1), col, { ground: true, decor: [{ n: [0, 0, 1], segs }] });
  } else if (k === 'sofa') {
    // sofa / armchair: seat, back and two arms
    const bk = d * 0.24, arm = Math.min(w * 0.12, 22), seatH = h * 0.5;
    box(-W2 + arm, -D2 + bk, W2 - arm, D2, 0, seatH);
    box(-W2, -D2, W2, -D2 + bk, 0, h);
    box(-W2, -D2 + bk, -W2 + arm, D2, 0, h * 0.7);
    box(W2 - arm, -D2 + bk, W2, D2, 0, h * 0.7);
  } else if (k === 'cama') {
    // bed: frame, mattress, headboard, two pillows and a throw
    const fh = Math.min(h * 0.3, 32), mh = fh + Math.min(h * 0.24, 24);
    box(-W2, -D2 + 8, W2, D2, 0, fh);
    box(-W2 + 3, -D2 + 9, W2 - 3, D2 - 3, fh, mh, '#F5F0E7');
    box(-W2, -D2, W2, -D2 + 8, 0, h);
    const pw = (w - 18) / 2;
    box(-W2 + 6, -D2 + 14, -W2 + 6 + pw, -D2 + 48, mh, mh + 11, '#FBF8F2');
    box(W2 - 6 - pw, -D2 + 14, W2 - 6, -D2 + 48, mh, mh + 11, '#FBF8F2');
    box(-W2 + 1, D2 - d * 0.36, W2 - 1, D2 - 1, mh, mh + 3, '#C98B67');
  } else if (k === 'mesa' || k === 'banco') {
    // table / stool: top slab + four legs
    const t = k === 'mesa' ? 4 : 5, lg = k === 'mesa' ? Math.min(6, w * 0.08) : 3.5, ins = k === 'mesa' ? 6 : 3;
    box(-W2, -D2, W2, D2, h - t, h);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      const lx = sx * (W2 - ins - lg / 2), ly = sy * (D2 - ins - lg / 2);
      box(lx - lg / 2, ly - lg / 2, lx + lg / 2, ly + lg / 2, 0, h - t);
    }
  } else if (k === 'silla') {
    // chair: seat, backrest, legs
    const seat = Math.min(46, h * 0.54);
    box(-W2, -D2, W2, D2, seat - 4, seat);
    box(-W2, -D2, W2, -D2 + 5, seat, h);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      const lx = sx * (W2 - 4), ly = sy * (D2 - 4);
      box(lx - 2, ly - 2, lx + 2, ly + 2, 0, seat - 4);
    }
  } else if (k === 'cocina') {
    // kitchen run / island: base with doors + light stone countertop
    const doors = Math.max(1, Math.round(w / 60));
    const base = prism(f.rect(-W2, -D2, W2, D2 - 4), z, z + h - 4, col);
    base.decor = [frontLines(f, it, doors, z, z + h - 4, D2 - 4)];
    parts.push(base);
    box(-W2 - 1, -D2, W2 + 1, D2 + 1, h - 4, h, '#ECE5DA');
  } else if (k === 'alto' || k === 'mueble') {
    // closet / credenza: one volume with door lines on the front face
    const doors = Math.max(1, Math.round(w / (k === 'alto' ? 55 : 50)));
    const p = prism(f.rect(-W2, -D2, W2, D2), z, z + h, col);
    p.decor = [frontLines(f, it, doors, z, z + h, D2)];
    parts.push(p);
  } else if (k === 'planta') {
    // plant: terracotta pot, a short stem and two overlapping foliage spheres
    const r = Math.min(w, d) * 0.3, ph = Math.min(h * 0.3, 45);
    parts.push(prism(ngon(f, 0, 0, r, 8), z, z + ph, '#B8643E'));
    const fr = Math.min(Math.min(w, d) * 0.62, (h - ph) / 2);
    const [X, Y] = f.P(0, 0);
    box(-1.5, -1.5, 1.5, 1.5, ph, Math.max(ph, h - fr), '#5E5A3E');
    parts.push({ kind: 'sphere', c: [X - fr * 0.25, Y + fr * 0.2, z + ph + fr * 0.62], r: fr * 0.72, color: col });
    parts.push({ kind: 'sphere', c: [X, Y, z + h - fr], r: fr, color: col });
  } else if (k === 'lampara') {
    // floor lamp: base disc, thin pole, linen shade
    const r = Math.min(w, d) / 2;
    parts.push(prism(ngon(f, 0, 0, r * 0.55), z, z + 3, col));
    box(-1.5, -1.5, 1.5, 1.5, 3, h - 30);
    parts.push(prism(ngon(f, 0, 0, r * 0.95, 12), z + h - 32, z + h, '#EFE4D2'));
  } else {
    // anything else: a clean box
    box(-W2, -D2, W2, D2, 0, h);
  }
  return parts;
}

/**
 * What: all furniture parts of a project, tagged with their item index.
 * In:   project
 * Out:  parts array
 */
export function projectParts(project) {
  const out = [];
  project.items.forEach((it, i) => itemParts(it).forEach((p) => { p.item = i; out.push(p); }));
  return out;
}

/**
 * What: the room shell as prisms: floor slab, the four walls (outside the
 *       clear interior). Which walls are "back" depends on the rotation.
 * In:   room {w,l,h}
 * Out:  { slab, walls:[{ p, n:[nx,ny] outward plan normal, side }] }
 */
export function shellSolids(room) {
  const t = WALL_T, w = room.w, l = room.l, h = room.h;
  const R = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  return {
    slab: prism(R(-t, -t, w + t, l + t), -SLAB_T, 0, '#D8C8B2', { slab: true }),
    walls: [
      // back (y<0) and front (y>l) walls run the full width incl. corners
      { side: 'back', n: [0, -1], p: prism(R(-t, -t, w + t, 0), 0, h, room.wall, { wall: true }) },
      { side: 'front', n: [0, 1], p: prism(R(-t, l, w + t, l + t), 0, h, room.wall, { wall: true }) },
      { side: 'left', n: [-1, 0], p: prism(R(-t, 0, 0, l), 0, h, room.wall, { wall: true }) },
      { side: 'right', n: [1, 0], p: prism(R(w, 0, w + t, l), 0, h, room.wall, { wall: true }) },
    ],
  };
}

/* -------------------------------------------------------------------------
   The isometric camera — exactly the method agreed with DJG:
     1. turn plan coordinates (x,y) about the room centre by the view angle
     2. X = (x − y)·cos30°,  Y = (x + y)·sin30° − z
     3. painter's sort by depth = x + y + z (farthest first)
   ------------------------------------------------------------------------- */
const C30 = Math.cos(30 * DEG), S30 = Math.sin(30 * DEG);

/**
 * What: build the isometric projector for a room and a view angle.
 * In:   room {w,l}, angle — degrees (0, 90, 180, 270 or in-between while turning)
 * Out:  { rot(x,y)→[x',y'], rotN(n)→n', proj([x,y,z])→[X,Y], depth([x,y,z]) }
 */
export function isoCamera(room, angle = 0) {
  const cx = room.w / 2, cy = room.l / 2;
  const c = Math.cos(angle * DEG), s = Math.sin(angle * DEG);
  // rotate a plan point about the room centre (clockwise in the plan)
  const rot = (x, y) => {
    const dx = x - cx, dy = y - cy;
    return [cx + dx * c - dy * s, cy + dx * s + dy * c];
  };
  const rotN = (n) => [n[0] * c - n[1] * s, n[0] * s + n[1] * c, n[2] || 0];
  return {
    rot, rotN,
    proj: (p) => { const [x, y] = rot(p[0], p[1]); return [(x - y) * C30, (x + y) * S30 - p[2]]; },
    depth: (p) => { const [x, y] = rot(p[0], p[1]); return x + y + p[2]; },
    // a side face shows when its turned normal points toward the viewer (+x,+y)
    sideVisible: (n) => { const r = rotN(n); return r[0] + r[1] > 1e-6; },
  };
}

/**
 * What: outward plan normal of each footprint edge (works for any winding).
 * In:   foot — plan points
 * Out:  [{ a, b, n:[nx,ny,0] }]
 */
export function footEdges(foot) {
  const n = foot.length;
  const cx = foot.reduce((s, q) => s + q[0], 0) / n, cy = foot.reduce((s, q) => s + q[1], 0) / n;
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = foot[i], b = foot[(i + 1) % n];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    let nx = dy / L, ny = -dx / L;
    // flip the normal if it points toward the centroid
    if (((a[0] + b[0]) / 2 - cx) * nx + ((a[1] + b[1]) / 2 - cy) * ny < 0) { nx = -nx; ny = -ny; }
    out.push({ a, b, n: [nx, ny, 0] });
  }
  return out;
}

/**
 * What: depth of a part's centre for the painter's sort (x + y + z).
 * In:   p — part, cam — iso camera
 * Out:  number (bigger = nearer the viewer)
 */
export function partDepth(p, cam) {
  if (p.kind === 'sphere') return cam.depth(p.c);
  const n = p.foot.length;
  const cx = p.foot.reduce((s, q) => s + q[0], 0) / n, cy = p.foot.reduce((s, q) => s + q[1], 0) / n;
  return cam.depth([cx, cy, (p.z0 + p.z1) / 2]);
}

/**
 * What: flat shade of a material colour: top lighter, the two sides darker.
 * In:   hex — base colour, k — brightness factor (1 = as is)
 * Out:  rgb() string
 */
export function tone(hex, k) {
  const [r, g, b] = hexRgb(hex);
  // above 1 mixes toward white, below 1 darkens
  const m = (v) => Math.round(k >= 1 ? v + (255 - v) * (k - 1) : v * k);
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}

/**
 * What: brightness for a face: top 1.07, left side .92, right side .8.
 * In:   n — plan normal already turned by the view angle (or [0,0,1])
 * Out:  factor for tone()
 */
export function faceK(n) {
  if (n[2] > 0.5) return 1.07;
  return 0.86 + 0.06 * (n[1] - n[0]);
}

/**
 * What: parse #rgb / #rrggbb into numbers.
 * In:   hex string
 * Out:  [r,g,b]
 */
export function hexRgb(hex) {
  let h = String(hex).replace('#', '');
  if (h.length === 3) h = h.split('').map((ch) => ch + ch).join('');
  const v = parseInt(h.slice(0, 6), 16) || 0;
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
