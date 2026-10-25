/* =========================================================================
   render.js — draws a project as SVG:
   • cardSVG(): one of the three orthographic views (Planta, Alzado frontal,
     Alzado lateral) as a clean architectural drawing
   • axoSVG(): the merged isometric view, and every in-between frame of the
     merge animation (each vertex moves from its 2D-view position to its
     isometric position)
   Pure string building — no canvas, no WebGL.
   ========================================================================= */
import { projectParts, shellSolids, isoCamera, footEdges, partDepth, tone, faceK, hexRgb, WALL_T, SLAB_T } from './geometry.js';

const INK = '#2E2520';
let uidSeq = 0;

// --- number formatting for SVG coordinates ------------------------------
const f1 = (v) => (Math.round(v * 10) / 10).toString();
const ptsStr = (pts) => pts.map((p) => f1(p[0]) + ',' + f1(p[1])).join(' ');

/**
 * What: SVG <defs> with the hatch patterns used for cut walls / slab / shadows.
 * In:   id — unique prefix, size — pattern tile size in the SVG's units
 * Out:  defs markup string
 */
function defs(id, size) {
  const s = f1(size), sw = f1(size * 0.13);
  return `<defs>
<pattern id="${id}-cut" patternUnits="userSpaceOnUse" width="${s}" height="${s}" patternTransform="rotate(45)"><rect width="${s}" height="${s}" fill="#CBB79D"/><line x1="0" y1="0" x2="0" y2="${s}" stroke="${INK}" stroke-width="${sw}" opacity=".55"/></pattern>
<pattern id="${id}-shd" patternUnits="userSpaceOnUse" width="${s}" height="${s}" patternTransform="rotate(-45)"><line x1="0" y1="0" x2="0" y2="${s}" stroke="${INK}" stroke-width="${f1(size * 0.08)}" opacity=".35"/></pattern>
</defs>`;
}

/* -------------------------------------------------------------------------
   Sheet layout: the three views placed like on a drawing board
   (third-angle): Planta on top, Alzado frontal under it, Alzado lateral to
   the right of the front elevation. Units: cm, y down.
   ------------------------------------------------------------------------- */

/**
 * What: layout constants for the three-view sheet of a room.
 * In:   room {w,l,h}
 * Out:  { gap, F0 (floor line of the elevations), SX (x offset of the side view), map(view,p) }
 */
export function sheetLayout(room, portrait = false) {
  const t = WALL_T, gap = Math.max(80, 0.22 * Math.max(room.w, room.l));
  const F0 = room.l + t + gap + room.h;
  const SX = room.w + t + gap + t;
  // portrait screens: stack plan / front / side vertically so each view is bigger
  const F1 = F0 + SLAB_T + gap + room.h;
  const map = portrait
    ? (view, p) => {
      if (view === 'plan') return [p[0], p[1]];
      if (view === 'front') return [p[0], F0 - p[2]];
      return [room.l - p[1], F1 - p[2]];
    }
    : (view, p) => {
      if (view === 'plan') return [p[0], p[1]];
      if (view === 'front') return [p[0], F0 - p[2]];
      return [SX + (room.l - p[1]), F0 - p[2]];   // side: y = l on the left
    };
  // bounding box of the whole sheet (for fitting)
  const box = portrait
    ? [-t, -t, Math.max(room.w, room.l) + t, F1 + SLAB_T]
    : [-t, -t, SX + room.l + t, F0 + SLAB_T];
  return { gap, F0, F1, SX, map, box, portrait };
}

/**
 * What: architectural dimension line with slash ticks and a centred label.
 * In:   a, b — end points [x,y]; off — offset vector [dx,dy]; label; u — unit size
 * Out:  SVG markup
 */
function dimLine(a, b, off, label, u) {
  const A = [a[0] + off[0], a[1] + off[1]], B = [b[0] + off[0], b[1] + off[1]];
  const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1;
  const tx = dx / L, ty = dy / L, k = u * 3;
  // slash ticks at both ends + short extension lines back to the object
  const tick = (P) => `<line x1="${f1(P[0] - (tx - ty) * k * 0.5)}" y1="${f1(P[1] - (ty + tx) * k * 0.5)}" x2="${f1(P[0] + (tx - ty) * k * 0.5)}" y2="${f1(P[1] + (ty + tx) * k * 0.5)}" stroke-width="1.3"/>`;
  const ext = (P, Q) => `<line x1="${f1(P[0])}" y1="${f1(P[1])}" x2="${f1(Q[0] + off[0] * 0.15)}" y2="${f1(Q[1] + off[1] * 0.15)}" opacity=".45"/>`;
  let ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (ang > 90 || ang < -90) ang += 180;
  const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
  const n = [off[0] ? Math.sign(off[0]) : 0, off[1] ? Math.sign(off[1]) : 0];
  const lx = mx + n[0] * u * 4.2, ly = my + n[1] * u * 4.2 + u * 1.6;
  return `<g class="dim" stroke="${INK}" fill="none" vector-effect="non-scaling-stroke">${ext(A, a)}${ext(B, b)}<line x1="${f1(A[0])}" y1="${f1(A[1])}" x2="${f1(B[0])}" y2="${f1(B[1])}"/>${tick(A)}${tick(B)}</g>` +
    `<text x="${f1(lx)}" y="${f1(ly)}" transform="rotate(${f1(ang)} ${f1(lx)} ${f1(ly)})" font-size="${f1(u * 4.4)}" text-anchor="middle" fill="${INK}" font-family="DM Sans, Helvetica, Arial, sans-serif" letter-spacing=".04em">${label}</text>`;
}

/**
 * What: one orthographic view of a project as a standalone SVG drawing.
 * In:   project, view — 'plan' | 'front' | 'side'
 * Out:  complete <svg> markup (viewBox in cm, non-scaling strokes)
 */
export function cardSVG(project, view) {
  const { room } = project, t = WALL_T, id = 'v' + (++uidSeq);
  const L = sheetLayout(room), parts = projectParts(project);
  const span = view === 'plan' ? Math.max(room.w, room.l) : Math.max(view === 'front' ? room.w : room.l, room.h);
  const u = span / 100;                      // 1 "unit" ≈ 1% of the drawing
  const body = [];
  // stroke style shared by every outline
  const S = `stroke="${INK}" stroke-width="1" vector-effect="non-scaling-stroke" stroke-linejoin="round"`;
  let vb;
  if (view === 'plan') {
    // floor + planks, then the four cut walls as hatched poche
    body.push(`<rect x="0" y="0" width="${room.w}" height="${room.l}" fill="${room.floor}" opacity=".55"/>`);
    body.push(planks(room, (p) => p, u));
    const sh = shellSolids(room);
    for (const wl of sh.walls) body.push(`<polygon points="${ptsStr(wl.p.foot)}" fill="url(#${id}-cut)" ${S}/>`);
    // furniture seen from above: tops sorted low → high
    const tops = [];
    for (const p of parts) {
      if (p.kind === 'sphere') tops.push({ z: p.c[2] + p.r, svg: circleMark([p.c[0], p.c[1]], p.r, p.color, S) });
      // overhead pieces (wall cabinets, shelves) are dashed, as in a real plan
      else if (p.z0 >= 100) tops.push({ z: 1e4 + p.z1, svg: `<polygon points="${ptsStr(p.foot)}" fill="${tone(p.color, 1.04)}" fill-opacity=".18" ${S} stroke-dasharray="5 4"/>` });
      else tops.push({ z: p.z1, svg: `<polygon points="${ptsStr(p.foot)}" fill="${tone(p.color, 1.04)}" ${S}/>` + decorTop(p, (q) => [q[0], q[1]], S) });
    }
    tops.sort((a, b) => a.z - b.z).forEach((o) => body.push(o.svg));
    // dimensions: width above, length on the left
    body.push(dimLine([0, -t], [room.w, -t], [0, -u * 9], `${fmt(room.w)}`, u));
    body.push(dimLine([-t, 0], [-t, room.l], [-u * 9, 0], `${fmt(room.l)}`, u));
    vb = [-t - u * 22, -t - u * 20, room.w + 2 * t + u * 28, room.l + 2 * t + u * 26];
  } else {
    // elevation: the far wall as background, cut walls + slab hatched
    const front = view === 'front', len = front ? room.w : room.l;
    const M = (p) => { const q = L.map(view, p); return [q[0] - (front ? 0 : L.SX), q[1] - L.F0 + room.h]; };
    body.push(`<rect x="0" y="0" width="${len}" height="${room.h}" fill="${room.wall}"/>`);
    body.push(`<rect x="${-t}" y="0" width="${t}" height="${room.h}" fill="url(#${id}-cut)" ${S}/><rect x="${len}" y="0" width="${t}" height="${room.h}" fill="url(#${id}-cut)" ${S}/>`);
    body.push(`<rect x="${-t}" y="${room.h}" width="${len + 2 * t}" height="${SLAB_T}" fill="url(#${id}-cut)" ${S}/>`);
    body.push(`<line x1="0" y1="0" x2="${len}" y2="0" ${S} opacity=".5"/>`);
    // faces looking at the viewer, farthest first
    const faces = [];
    for (const p of parts) {
      if (p.kind === 'sphere') {
        const d = front ? p.c[1] : p.c[0];
        faces.push({ d: d + p.r, svg: circleMark(M(p.c), p.r, p.color, S) });
        continue;
      }
      for (const e of footEdges(p.foot)) {
        const vis = front ? e.n[1] : e.n[0];
        if (vis <= 1e-6) continue;
        const quad = [[e.a[0], e.a[1], p.z0], [e.b[0], e.b[1], p.z0], [e.b[0], e.b[1], p.z1], [e.a[0], e.a[1], p.z1]].map(M);
        const d = front ? (e.a[1] + e.b[1]) / 2 : (e.a[0] + e.b[0]) / 2;
        faces.push({ d, svg: `<polygon points="${ptsStr(quad)}" fill="${tone(p.color, 0.97 + 0.05 * vis)}" ${S}/>` + decorFace(p, e.n, M, S) });
      }
    }
    faces.sort((a, b) => a.d - b.d).forEach((o) => body.push(o.svg));
    body.push(dimLine([0, room.h + SLAB_T], [len, room.h + SLAB_T], [0, u * 8], `${fmt(len)}`, u));
    body.push(dimLine([len + t, 0], [len + t, room.h], [u * 8, 0], `${fmt(room.h)}`, u));
    vb = [-t - u * 6, -u * 6, len + 2 * t + u * 24, room.h + SLAB_T + u * 24];
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.map(f1).join(' ')}" class="view-svg" role="img">${defs(id, u * 2.2)}${body.join('')}</svg>`;
}

/**
 * What: format centimetres for labels (e.g. 420 → "4.20 m").
 * In:   cm — number
 * Out:  string
 */
export function fmt(cm) {
  return (cm / 100).toFixed(2) + ' m';
}

/**
 * What: light plank lines across the floor (along the longer side).
 * In:   room, M — maps a plan point [x,y,z] to drawing coords, u — unit size
 * Out:  SVG markup
 */
function planks(room, M, u) {
  const step = 22, out = [];
  const alongX = room.w >= room.l;
  const n = Math.floor((alongX ? room.l : room.w) / step);
  // one line per plank joint, from wall to wall
  for (let i = 1; i <= n; i++) {
    const a = alongX ? [0, i * step, 0] : [i * step, 0, 0];
    const b = alongX ? [room.w, i * step, 0] : [i * step, room.l, 0];
    const A = M(a), B = M(b);
    out.push(`<line x1="${f1(A[0])}" y1="${f1(A[1])}" x2="${f1(B[0])}" y2="${f1(B[1])}"/>`);
  }
  return `<g stroke="${INK}" stroke-opacity=".13" stroke-width="${f1(Math.max(0.6, u * 0.12))}" vector-effect="non-scaling-stroke">${out.join('')}</g>`;
}

/**
 * What: plant foliage mark — a filled circle with a soft highlight.
 * In:   c — centre [x,y], r — radius, color, S — stroke attributes
 * Out:  SVG markup
 */
function circleMark(c, r, color, S) {
  return `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${f1(r)}" fill="${tone(color, 1)}" ${S}/>` +
    `<circle cx="${f1(c[0] - r * 0.28)}" cy="${f1(c[1] - r * 0.3)}" r="${f1(r * 0.45)}" fill="${tone(color, 1.18)}" opacity=".75"/>`;
}

/**
 * What: decor lines lying on a part's top face (rug border).
 * In:   p — part, M — point mapper, S — stroke attributes
 * Out:  SVG markup
 */
function decorTop(p, M, S) {
  if (!p.decor) return '';
  return p.decor.filter((d) => d.n[2] > 0.5).map((d) => d.segs.map(([a, b]) => {
    const A = M(a), B = M(b);
    return `<line x1="${f1(A[0])}" y1="${f1(A[1])}" x2="${f1(B[0])}" y2="${f1(B[1])}" ${S} opacity=".45"/>`;
  }).join('')).join('');
}

/**
 * What: decor lines (doors) on a side face whose normal matches n.
 * In:   p — part, n — face normal, M — point mapper, S — stroke attrs
 * Out:  SVG markup
 */
function decorFace(p, n, M, S) {
  if (!p.decor) return '';
  return p.decor.filter((d) => d.n[2] < 0.5 && Math.abs(d.n[0] - n[0]) + Math.abs(d.n[1] - n[1]) < 0.05).map((d) => d.segs.map(([a, b]) => {
    const A = M(a), B = M(b);
    return `<line x1="${f1(A[0])}" y1="${f1(A[1])}" x2="${f1(B[0])}" y2="${f1(B[1])}" ${S} opacity=".6"/>`;
  }).join('')).join('');
}

/* -------------------------------------------------------------------------
   The merged isometric view
   ------------------------------------------------------------------------- */

/**
 * What: collect every drawable element of the isometric view with both its
 *       isometric 3D vertices and the 2D-view (sheet) vertices it starts from.
 * In:   project, angle — view angle in degrees, portrait — sheet layout for tall screens
 * Out:  { elems:[…], cam, layout } — elems sorted for the isometric painter
 */
export function buildIso(project, angle = 0, portrait = false) {
  const { room } = project, cam = isoCamera(room, angle), L = sheetLayout(room, portrait);
  const parts = projectParts(project), sh = shellSolids(room), elems = [];
  // which 2D view a face comes from (unturned normal): top → plan, +y → front, +x → side
  const viewOf = (n) => (n[2] > 0.5 ? 'plan' : (n[0] >= n[1] ? 'side' : 'front'));
  // push one polygon face
  const face = (pts3, n, fill, layer, depth, extra = {}) => {
    const v = viewOf(n);
    elems.push({ type: 'poly', pts3, src: pts3.map((p) => L.map(v, p)), view: v, fill, layer, depth, sheetKey: sheetKey(v, pts3), ...extra });
  };
  // --- 1. floor + slab section -------------------------------------------
  face(sh.slab.foot.map((q) => [q[0], q[1], 0]), [0, 0, 1], room.floor, 0, -1e9, { floor: true });
  for (const e of footEdges(sh.slab.foot)) {
    if (!cam.sideVisible(e.n)) continue;
    face(quad(e, -SLAB_T, 0), e.n, 'cut', 0, -1e9 + 1, { hatch: true });
  }
  // plank joints (lines on the floor, clipped by the room rectangle)
  elems.push({ type: 'planks', layer: 0, depth: -1e9 + 2, view: 'plan' });
  // --- 2. walls: the two away from the viewer stand, the near two are cut --
  for (const wl of sh.walls) {
    const r = cam.rotN([wl.n[0], wl.n[1], 0]);
    const back = r[0] + r[1] < 0;
    if (!back) {
      // cut-away wall: just its hatched footprint at floor level
      face(wl.p.foot.map((q) => [q[0], q[1], 0.2]), [0, 0, 1], 'cut', 1, -1e8, { hatch: true });
      continue;
    }
    for (const e of footEdges(wl.p.foot)) {
      if (!cam.sideVisible(e.n)) continue;
      face(quad(e, 0, room.h), e.n, tone(room.wall, wallK(cam.rotN(e.n))), 2, -1e7 + partDepth(wl.p, cam), { wall: true });
    }
    face(wl.p.foot.map((q) => [q[0], q[1], room.h]), [0, 0, 1], 'cut', 2, -1e7 + partDepth(wl.p, cam) + 0.5, { hatch: true });
  }
  // --- 3. shadows on the floor (flat, clipped to the room) ----------------
  elems.push({ type: 'shadows', layer: 1, depth: -1e8 + 1, view: 'plan' });
  // --- 4. furniture: painter's sort by x + y + z of each solid -----------
  for (const p of parts) {
    const base = (p.ground ? -1e8 + 0.5 : 0) + partDepth(p, cam);
    if (p.kind === 'sphere') {
      elems.push({ type: 'circle', c3: p.c, r: p.r, color: p.color, src: [L.map('plan', p.c)], view: 'plan', layer: p.ground ? 1 : 3, depth: base, sheetKey: sheetKey('plan', [p.c]) + p.r });
      continue;
    }
    let sub = 0;
    for (const e of footEdges(p.foot)) {
      if (!cam.sideVisible(e.n)) continue;
      const pts3 = quad(e, p.z0, p.z1), rn = cam.rotN(e.n);
      face(pts3, e.n, tone(p.color, faceK(rn)), p.ground ? 1 : 3, base + (sub += 1e-4), { decor: segsFor(p, e.n), item: p.item });
    }
    face(p.foot.map((q) => [q[0], q[1], p.z1]), [0, 0, 1], tone(p.color, faceK([0, 0, 1])), p.ground ? 1 : 3, base + 0.01, { decor: segsFor(p, [0, 0, 1]), item: p.item });
  }
  elems.sort((a, b) => (a.layer - b.layer) || (a.depth - b.depth));
  return { elems, cam, layout: L, parts };
}

/**
 * What: softer shading for wall faces (they are large; keep them warm).
 * In:   n — turned normal
 * Out:  brightness factor
 */
function wallK(n) {
  return 0.955 + 0.03 * (n[1] - n[0]);
}

/**
 * What: the side quad of a prism edge between two heights.
 * In:   e — edge {a,b}, z0, z1
 * Out:  4 plan-space 3D points
 */
function quad(e, z0, z1) {
  return [[e.a[0], e.a[1], z0], [e.b[0], e.b[1], z0], [e.b[0], e.b[1], z1], [e.a[0], e.a[1], z1]];
}

/**
 * What: decor segments of a part that lie on the face with normal n.
 * In:   p — part, n — normal
 * Out:  array of [a,b] 3D segments (maybe empty)
 */
function segsFor(p, n) {
  if (!p.decor) return null;
  const out = [];
  for (const d of p.decor) if (Math.abs(d.n[0] - n[0]) + Math.abs(d.n[1] - n[1]) + Math.abs((d.n[2] || 0) - (n[2] || 0)) < 0.05) out.push(...d.segs);
  return out.length ? out : null;
}

/**
 * What: drawing order inside the 2D sheet (used early in the animation).
 * In:   view, pts3 — face points
 * Out:  number (bigger = drawn later)
 */
function sheetKey(view, pts3) {
  const n = pts3.length;
  const avg = (i) => pts3.reduce((s, p) => s + p[i], 0) / n;
  if (view === 'plan') return Math.max(...pts3.map((p) => p[2]));
  if (view === 'front') return avg(1);
  return avg(0);
}

/**
 * What: compute a "fit into box" transform for a set of 2D points.
 * In:   pts — [[x,y]…], W, H — box size, pad — padding (px), top/bottom — reserved px
 * Out:  (p) → [x,y] mapped, plus .s scale
 */
function fitter(pts, W, H, pad, top = 0, bottom = 0) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of pts) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
  // usable height leaves room for a header (top) and the caption (bottom)
  const hh = H - top - bottom;
  const s = Math.min((W - pad * 2) / (x1 - x0 || 1), (hh - pad * 2) / (y1 - y0 || 1));
  const ox = (W - (x1 - x0) * s) / 2 - x0 * s, oy = top + (hh - (y1 - y0) * s) / 2 - y0 * s;
  const fn = (p) => [p[0] * s + ox, p[1] * s + oy];
  fn.s = s;
  return fn;
}

// --- easing --------------------------------------------------------------
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

/**
 * What: render the merged view (t = 1) or an in-between frame of the merge.
 * In:   model — buildIso() result, project, o = { W, H, t (0 sheet → 1 iso), pad, labels }
 * Out:  complete <svg> markup in pixel units
 */
export function axoSVG(model, project, o) {
  const { W, H, pad = 22 } = o, t = o.t ?? 1, { room } = project, id = 'a' + (++uidSeq);
  const { cam, layout: L, elems, parts } = model, tw = WALL_T;
  // fit both the sheet and the isometric box into the same viewport
  const isoPts = [];
  for (const x of [-tw, room.w + tw]) for (const y of [-tw, room.l + tw]) for (const z of [-SLAB_T, room.h]) isoPts.push(cam.proj([x, y, z]));
  const FI = fitter(isoPts, W, H, pad, o.top || 0, o.bottom || 0);
  let FS = null;
  if (t < 1) {
    const sp = [[L.box[0] - 30, L.box[1] - 40], [L.box[2] + 30, L.box[3] + 20]];
    FS = fitter(sp, W, H, pad * 0.6, o.top || 0, o.bottom || 0);
  }
  // per-element progress: plan first, then the front and side elevations
  const delayOf = { plan: 0, front: 0.12, side: 0.22 };
  const prog = (v) => (t >= 1 ? 1 : ease(clamp01((t - delayOf[v]) / 0.72)));
  const P = (src, p3, k) => {
    const b = FI(cam.proj(p3));
    if (k >= 1) return b;
    const a = FS(src);
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  };
  // stroke widths in px
  const SW = Math.max(0.7, Math.min(1.25, FI.s * 2.2));
  const S = `stroke="${INK}" stroke-width="${f1(SW)}" stroke-linejoin="round"`;
  const out = [];
  // sheet order early in the move, isometric order after the midpoint
  const list = t < 0.5 ? elems.slice().sort((a, b) => sheetRank(a) - sheetRank(b)) : elems;
  const floorPoly = [[0, 0, 0], [room.w, 0, 0], [room.w, room.l, 0], [0, room.l, 0]];
  const floorK = prog('plan');
  const floorClip = `<clipPath id="${id}-fl"><polygon points="${ptsStr(floorPoly.map((p) => P(L.map('plan', p), p, floorK)))}"/></clipPath>`;
  for (const e of list) {
    const k = prog(e.view);
    if (e.type === 'poly') {
      const pts = e.pts3.map((p, i) => P(e.src[i], p, k));
      const fill = e.fill === 'cut' ? `url(#${id}-cut)` : (e.floor ? e.fill : mixFill(e.fill, k));
      out.push(`<polygon points="${ptsStr(pts)}" fill="${fill}" ${S}${e.floor ? ' stroke-opacity=".9"' : ''}/>`);
      if (e.decor) out.push(`<g ${S} opacity=".55">${e.decor.map(([a, b]) => { const A = P(L.map(e.view, a), a, k), B = P(L.map(e.view, b), b, k); return `<line x1="${f1(A[0])}" y1="${f1(A[1])}" x2="${f1(B[0])}" y2="${f1(B[1])}"/>`; }).join('')}</g>`);
    } else if (e.type === 'circle') {
      const c = P(e.src[0], e.c3, k), r = e.r * (FS ? FS.s + (FI.s - FS.s) * k : FI.s);
      out.push(circleMark(c, r, e.color, S));
    } else if (e.type === 'planks') {
      out.push(`<g clip-path="url(#${id}-fl)">${planks(room, (p) => P(L.map('plan', p), p, floorK), 1)}</g>`);
    } else if (e.type === 'shadows' && t > 0.55) {
      out.push(`<g clip-path="url(#${id}-fl)" opacity="${f1(clamp01((t - 0.55) / 0.45))}">${shadows(parts, cam, FI)}</g>`);
      out.push(`<g clip-path="url(#${id}-fl)" opacity="${f1(clamp01((t - 0.55) / 0.45))}">${shadows(parts, cam, FI, `url(#${id}-shd)`)}</g>`);
    }
  }
  // sheet furniture: titles + dimensions of the three views, fading out
  let extras = '';
  if (t < 0.3 && FS) extras = sheetExtras(room, L, FS, 1 - t / 0.3);
  // room dimensions along the two near floor edges in the final view
  let dims = '';
  if (t > 0.85 && o.labels !== false) dims = `<g opacity="${f1(clamp01((t - 0.85) / 0.15))}">${isoDims(room, cam, FI, Math.max(10.5, W / 120))}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="axo-svg" role="img">${defs(id, 5.5)}<defs>${floorClip}</defs>${out.join('')}${extras}${dims}${o.titleBlock || ''}</svg>`;
}

/**
 * What: sort key for the sheet (2D views) order: shell first, then by view depth.
 * In:   e — element
 * Out:  number
 */
function sheetRank(e) {
  const vb = { plan: 0, front: 1e6, side: 2e6 }[e.view] || 0;
  const shell = e.floor || e.type === 'planks' ? -5e5 : (e.hatch || e.wall ? -4e5 : 0);
  return vb + shell + (e.sheetKey || 0);
}

/**
 * What: blend a shaded rgb() fill toward a lighter "paper" version early on.
 * In:   fill — rgb() or hex string, k — progress 0..1
 * Out:  rgb() string
 */
function mixFill(fill, k) {
  if (k >= 1 || !fill.startsWith('rgb')) return fill;
  const m = fill.match(/\d+/g).map(Number);
  const lift = (1 - k) * 0.12;
  return `rgb(${m.map((v) => Math.round(v + (255 - v) * lift)).join(',')})`;
}

/**
 * What: flat cast shadows of every solid on the floor (light from upper-left).
 * In:   parts, cam — iso camera, FI — fit transform, pattern — optional fill
 * Out:  SVG markup
 */
function shadows(parts, cam, FI, pattern) {
  // shadow direction is fixed on screen, so turn it back into plan space
  const inv = isoCamInverse(cam);
  const dir = inv([0.42, 0.1]);
  const out = [];
  for (const p of parts) {
    if (p.ground) continue;
    let pts;
    if (p.kind === 'sphere') {
      pts = [];
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; pts.push([p.c[0] + Math.cos(a) * p.r + dir[0] * p.c[2], p.c[1] + Math.sin(a) * p.r + dir[1] * p.c[2]]); }
    } else {
      pts = hull([...p.foot.map((q) => [q[0] + dir[0] * p.z0, q[1] + dir[1] * p.z0]), ...p.foot.map((q) => [q[0] + dir[0] * p.z1, q[1] + dir[1] * p.z1])]);
    }
    out.push(`<polygon points="${ptsStr(pts.map((q) => FI(cam.proj([q[0], q[1], 0]))))}"/>`);
  }
  return pattern ? `<g fill="${pattern}">${out.join('')}</g>` : `<g fill="#5A3A22" fill-opacity=".11">${out.join('')}</g>`;
}

/**
 * What: inverse of the camera's plan rotation, for screen-fixed directions.
 * In:   cam — iso camera
 * Out:  (v[2]) → plan-space vector
 */
function isoCamInverse(cam) {
  // rotN(n) = R·n; R is orthonormal so R⁻¹ = Rᵀ — recover it from two probes
  const ex = cam.rotN([1, 0, 0]), ey = cam.rotN([0, 1, 0]);
  return (v) => [v[0] * ex[0] + v[1] * ex[1], v[0] * ey[0] + v[1] * ey[1]];
}

/**
 * What: convex hull (monotone chain) of 2D points.
 * In:   pts — [[x,y]…]
 * Out:  hull points in order
 */
function hull(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}

/**
 * What: view titles + dimension lines of the 3-view sheet (start of the merge).
 * In:   room, L — layout, FS — sheet fit, op — opacity
 * Out:  SVG markup
 */
function sheetExtras(room, L, FS, op) {
  const lab = (x, y, s) => { const p = FS([x, y]); return `<text x="${f1(p[0])}" y="${f1(p[1])}" font-size="10" letter-spacing=".16em" fill="${INK}" font-family="DM Sans, Helvetica, Arial, sans-serif">${s}</text>`; };
  const t = WALL_T;
  const side = L.portrait ? lab(-t, L.F1 - room.h - 14, 'ALZADO LATERAL') : lab(L.SX - t, L.F0 - room.h - 14, 'ALZADO LATERAL');
  return `<g opacity="${f1(op)}" class="sheet-labels">${lab(-t, -t - 14, 'PLANTA')}${lab(-t, L.F0 - room.h - 14, 'ALZADO FRONTAL')}${side}</g>`;
}

/**
 * What: room width/length labels along the two near floor edges (iso view).
 * In:   room, cam, FI — fit transform, fs — label font size (px)
 * Out:  SVG markup
 */
function isoDims(room, cam, FI, fs = 10.5) {
  const edges = [
    { a: [0, room.l, 0], b: [room.w, room.l, 0], n: [0, 1, 0], v: room.w },
    { a: [room.w, 0, 0], b: [room.w, room.l, 0], n: [1, 0, 0], v: room.l },
    { a: [0, 0, 0], b: [room.w, 0, 0], n: [0, -1, 0], v: room.w },
    { a: [0, 0, 0], b: [0, room.l, 0], n: [-1, 0, 0], v: room.l },
  ];
  const out = [];
  // only the edges facing the viewer get a label, offset outside the slab
  for (const e of edges) {
    if (!cam.sideVisible(e.n)) continue;
    const off = WALL_T + 46;
    const A = FI(cam.proj([e.a[0] + e.n[0] * off, e.a[1] + e.n[1] * off, -SLAB_T]));
    const B = FI(cam.proj([e.b[0] + e.n[0] * off, e.b[1] + e.n[1] * off, -SLAB_T]));
    let ang = (Math.atan2(B[1] - A[1], B[0] - A[0]) * 180) / Math.PI;
    if (ang > 90 || ang < -90) ang += 180;
    const m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    out.push(`<line x1="${f1(A[0])}" y1="${f1(A[1])}" x2="${f1(B[0])}" y2="${f1(B[1])}" stroke="${INK}" stroke-width=".8" opacity=".5"/>`);
    for (const P of [A, B]) out.push(`<circle cx="${f1(P[0])}" cy="${f1(P[1])}" r="1.6" fill="${INK}" opacity=".6"/>`);
    out.push(`<text x="${f1(m[0])}" y="${f1(m[1] - fs * 0.6)}" transform="rotate(${f1(ang)} ${f1(m[0])} ${f1(m[1])})" font-size="${f1(fs)}" text-anchor="middle" fill="${INK}" font-family="DM Sans, Helvetica, Arial, sans-serif" letter-spacing=".05em">${fmt(e.v)}</text>`);
  }
  return out.join('');
}

export { hexRgb };
