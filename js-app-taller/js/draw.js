/* =========================================================================
   draw.js: builds the three linked orthographic views as SVG from the same
   state: Planta (x,y), Alzado frontal (x,z) and Alzado lateral (y,z).
   Painter's order (farthest first) in the elevations; rotated items use
   their rotated bounding box (w·|cosθ| + d·|sinθ|). Also builds the full
   drawing "lámina" (all 3 views + title block) used on desktop and export.
   ========================================================================= */
import { WALL, bbox, center, project, wallGaps } from './geometry.js';
import { planSymbol, elevSymbol } from './symbols.js';
import { t, getLang } from './i18n.js';

const INK = '#2E2520', CUT = '#3A2F28', ACC = '#B8643E', PAPER = '#FBF7F0';
const f = (n) => Math.round(n * 100) / 100;

/**
 * What: drawing scale unit: cm that roughly equal 1 screen px for a room.
 * In:  room ({w,l,h})
 * Out: number (cm)
 */
export function unit(room) { return Math.max(room.w, room.l) / 400; }

/**
 * What: margin around each view (wall + dimension lines + markers).
 * In:  U (unit)
 * Out: cm
 */
export function margin(U) { return WALL + 58 * U; }

/**
 * What: shared <defs> (floor planks, slab hatch, drafting grid).
 * In:  id (prefix string, unique per <svg>), U (unit)
 * Out: SVG string
 */
export function defs(id, U) {
  // floor planks run along x; slab hatch is 45°
  return `<defs>
    <pattern id="${id}-pl" width="120" height="18" patternUnits="userSpaceOnUse">
      <rect width="120" height="18" fill="#F1E7D6"/>
      <path d="M0 18H120M60 0V9M0 9H0M20 9V18M100 9V18M0 9H120" stroke="#D9C8AC" stroke-width="${f(U * 0.5)}" fill="none"/>
    </pattern>
    <pattern id="${id}-ht" width="${f(8 * U)}" height="${f(8 * U)}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="${f(8 * U)}" height="${f(8 * U)}" fill="#CDBFA8"/>
      <line x1="0" y1="0" x2="0" y2="${f(8 * U)}" stroke="#8E7F6C" stroke-width="${f(U * 0.6)}"/>
    </pattern>
  </defs>`;
}

/**
 * What: an architectural dimension line with 45° ticks and a label.
 * In:  x1,y1,x2,y2 (cm), label (string), U (unit), opts {color, ext:[ex,ey]
 *      extension-line offset, side: label side −1|1}
 * Out: SVG string
 */
export function dim(x1, y1, x2, y2, label, U, opts = {}) {
  const col = opts.color || INK, sw = f(U * 0.7), fs = f(U * 10.5);
  const vertical = Math.abs(x2 - x1) < Math.abs(y2 - y1);
  const tk = U * 4.5;
  let s = `<g class="dim" stroke="${col}" stroke-width="${sw}" fill="none">`;
  s += `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"/>`;
  // 45° architectural ticks at both ends
  [[x1, y1], [x2, y2]].forEach(([x, y]) => { s += `<line x1="${f(x - tk)}" y1="${f(y + tk)}" x2="${f(x + tk)}" y2="${f(y - tk)}" stroke-width="${f(U * 1.2)}"/>`; });
  // optional extension lines back toward the measured object
  if (opts.ext) {
    const [ex, ey] = opts.ext;
    s += `<line x1="${f(x1 + ex)}" y1="${f(y1 + ey)}" x2="${f(x1 - ex * 0.18)}" y2="${f(y1 - ey * 0.18)}" stroke-opacity=".5"/>`;
    s += `<line x1="${f(x2 + ex)}" y1="${f(y2 + ey)}" x2="${f(x2 - ex * 0.18)}" y2="${f(y2 - ey * 0.18)}" stroke-opacity=".5"/>`;
  }
  s += '</g>';
  // label: centred, on a paper chip so lines never cross the digits
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, side = opts.side || -1;
  const lx = vertical ? mx + side * U * 9 : mx, ly = vertical ? my : my + side * U * 8;
  const rot = vertical ? ` transform="rotate(-90 ${f(lx)} ${f(ly)})"` : '';
  s += `<text x="${f(lx)}" y="${f(ly)}"${rot} font-size="${fs}" fill="${col}" text-anchor="middle" dominant-baseline="central" class="dt" paint-order="stroke" stroke="${opts.bg || PAPER}" stroke-width="${f(U * 4)}">${label}</text>`;
  return s;
}

/**
 * What: elevation marker (circle + pointing triangle + letter) used in plan.
 * In:  x, y (cm), dir ('up' | 'left'), letter (string), U (unit)
 * Out: SVG string
 */
function marker(x, y, dir, letter, U) {
  const r = U * 9, a = dir === 'up' ? 0 : -90;
  // triangle points toward the wall being drawn
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})">
    <path d="M${f(-r * 1.15)} ${f(-r * 0.25)} L0 ${f(-r * 1.9)} L${f(r * 1.15)} ${f(-r * 0.25)} Z" fill="${ACC}"/>
    <circle r="${f(r)}" fill="${PAPER}" stroke="${INK}" stroke-width="${f(U * 0.9)}"/>
    <text transform="rotate(${-a})" font-size="${f(U * 10)}" text-anchor="middle" dominant-baseline="central" fill="${INK}" class="dt">${letter}</text>
  </g>`;
}

/**
 * What: item label (localised name) for the selected piece.
 * In:  it (item)
 * Out: string
 */
function itemName(it) { return getLang() === 'en' && it.nameEn ? it.nameEn : it.name; }

/**
 * What: SVG content of the PLAN view in local cm coordinates.
 * In:  S (state: room, items, sel), id (defs prefix), opts {interactive}
 * Out: SVG string (no outer <svg>)
 */
export function planView(S, id, opts = {}) {
  const { w, l } = S.room, U = unit(S.room), T = WALL, sw = f(U * 0.9);
  let s = `<g data-view="plan">`;
  // floor with planks, then the cut walls as solid poché
  s += `<rect x="0" y="0" width="${w}" height="${l}" fill="url(#${id}-pl)"/>`;
  s += `<path d="M${-T} ${-T}H${w + T}V${l + T}H${-T}Z M0 0V${l}H${w}V0Z" fill="${CUT}" fill-rule="evenodd"/>`;
  // overall dimensions: width on top, length on the left
  s += dim(0, -T - 24 * U, w, -T - 24 * U, String(w), U, { ext: [0, 20 * U] });
  s += dim(-T - 24 * U, 0, -T - 24 * U, l, String(l), U, { ext: [20 * U, 0] });
  // elevation markers A (front, at the bottom) and B (side, at the right)
  s += marker(w / 2, l + T + 30 * U, 'up', 'A', U) + marker(w + T + 30 * U, l / 2, 'left', 'B', U);
  // painter's order in plan: rugs, floor pieces, wall pieces, ceiling pieces
  const rank = (it) => (it.type === 'tapete' ? 0 : it.type === 'lampara' ? 3 : (it.type === 'repisa' || it.type === 'cuadro') ? 2 : 1);
  const items = [...S.items].sort((a, b) => rank(a) - rank(b));
  items.forEach((it) => {
    const { cx, cy } = center(it);
    const sel = it.id === S.sel;
    s += `<g class="it${sel ? ' sel' : ''}" data-id="${it.id}" transform="translate(${f(cx)} ${f(cy)}) rotate(${it.rot || 0})">`;
    s += planSymbol(it, sw);
    // generous invisible hit area for fingers
    s += `<rect x="${f(-it.w / 2 - 6)}" y="${f(-it.d / 2 - 6)}" width="${f(it.w + 12)}" height="${f(it.d + 12)}" fill="transparent"/>`;
    s += '</g>';
  });
  // selection overlay: outline, rotation handle, distances to walls
  const it = S.items.find((i) => i.id === S.sel);
  if (it && opts.interactive !== false) s += planSelection(it, S.room, U);
  return s + '</g>';
}

/**
 * What: selection overlay in plan (outline, rotate handle, wall gaps).
 * In:  it (item), room, U (unit)
 * Out: SVG string
 */
function planSelection(it, room, U) {
  const { cx, cy } = center(it), b = bbox(it), g = wallGaps(it, room);
  const hd = it.d / 2 + 22 * U;
  let s = `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${it.rot || 0})" pointer-events="none">`;
  s += `<rect x="${f(-it.w / 2 - 3 * U)}" y="${f(-it.d / 2 - 3 * U)}" width="${f(it.w + 6 * U)}" height="${f(it.d + 6 * U)}" rx="${f(3 * U)}" fill="none" stroke="${ACC}" stroke-width="${f(U * 1.6)}"/>`;
  s += `<line x1="0" y1="${f(-it.d / 2 - 3 * U)}" x2="0" y2="${f(-hd)}" stroke="${ACC}" stroke-width="${f(U)}"/>`;
  s += '</g>';
  // rotate handle (interactive), drawn upright on top
  const r = (it.rot || 0) * Math.PI / 180;
  const hx = cx + Math.sin(r) * hd, hy = cy - Math.cos(r) * hd;
  s += `<g class="rh" data-id="${it.id}" transform="translate(${f(hx)} ${f(hy)})"><circle r="${f(16 * U)}" fill="transparent"/><circle r="${f(7.5 * U)}" fill="#fff" stroke="${ACC}" stroke-width="${f(U * 1.6)}"/><path d="M${f(-3.5 * U)} ${f(1.5 * U)} A${f(3.6 * U)} ${f(3.6 * U)} 0 1 1 ${f(1.5 * U)} ${f(3.4 * U)}" fill="none" stroke="${ACC}" stroke-width="${f(U * 1.2)}" stroke-linecap="round"/></g>`;
  // live distances to the nearest walls (terracotta dimension lines)
  const o = { color: ACC };
  const my = (b.y0 + b.y1) / 2, mx = (b.x0 + b.x1) / 2;
  if (g.left > 8) s += dim(0, my, b.x0, my, String(Math.round(g.left)), U, o);
  if (g.right > 8) s += dim(b.x1, my, room.w, my, String(Math.round(g.right)), U, o);
  if (g.top > 8) s += dim(mx, 0, mx, b.y0, String(Math.round(g.top)), U, { ...o, side: 1 });
  if (g.bottom > 8) s += dim(mx, b.y1, mx, room.l, String(Math.round(g.bottom)), U, { ...o, side: 1 });
  return s;
}

/**
 * What: SVG content of an ELEVATION (front: x,z · side: y,z) in local cm
 *       coordinates with Y = −z (floor line at 0).
 * In:  S (state), view ('front' | 'side'), id (defs prefix)
 * Out: SVG string
 */
export function elevView(S, view, id) {
  const room = S.room, U = unit(room), T = WALL, sw = f(U * 0.9);
  const W = view === 'front' ? room.w : room.l, H = room.h;
  let s = `<g data-view="${view}">`;
  // back wall surface, baseboard, cut side walls and slabs
  s += `<rect x="0" y="${-H}" width="${W}" height="${H}" fill="#F6EFE3"/>`;
  s += `<line x1="0" y1="-8" x2="${W}" y2="-8" stroke="${INK}" stroke-width="${f(U * 0.45)}" stroke-opacity=".5"/>`;
  s += `<rect x="${-T}" y="${-H - T}" width="${T}" height="${H + 2 * T}" fill="${CUT}"/><rect x="${W}" y="${-H - T}" width="${T}" height="${H + 2 * T}" fill="${CUT}"/>`;
  s += `<rect x="0" y="0" width="${W}" height="${T}" fill="url(#${id}-ht)" stroke="${CUT}" stroke-width="${sw}"/>`;
  s += `<rect x="0" y="${-H - T}" width="${W}" height="${T}" fill="url(#${id}-ht)" stroke="${CUT}" stroke-width="${sw}"/>`;
  // painter's order: farthest from the viewer first
  const projected = S.items.map((it) => ({ it, p: project(it, view, room) })).sort((a, b) => a.p.depth - b.p.depth);
  projected.forEach(({ it, p }) => {
    const sel = it.id === S.sel;
    s += `<g class="it${sel ? ' sel' : ''}" data-id="${it.id}">${elevSymbol(it, p, sw, H)}`;
    s += `<rect x="${f(p.u0 - 4)}" y="${f(-p.z1 - 4)}" width="${f(p.u1 - p.u0 + 8)}" height="${f(p.z1 - p.z0 + 8)}" fill="transparent"/></g>`;
  });
  // overall dimensions: height on the left, length along the bottom
  s += dim(-T - 24 * U, 0, -T - 24 * U, -H, String(H), U, { ext: [20 * U, 0] });
  s += dim(0, T + 24 * U, W, T + 24 * U, String(W), U, { ext: [0, -20 * U], side: 1 });
  // selected piece: highlight box + its height (and height above floor)
  const sel = projected.find((x) => x.it.id === S.sel);
  if (sel) {
    const p = sel.p, x = p.u1 + 12 * U > W ? p.u0 - 12 * U : p.u1 + 12 * U;
    s += `<rect x="${f(p.u0 - 2 * U)}" y="${f(-p.z1 - 2 * U)}" width="${f(p.u1 - p.u0 + 4 * U)}" height="${f(p.z1 - p.z0 + 4 * U)}" rx="${f(2 * U)}" fill="none" stroke="${ACC}" stroke-width="${f(U * 1.6)}" pointer-events="none"/>`;
    s += dim(x, -p.z0, x, -p.z1, String(Math.round(p.z1 - p.z0)), U, { color: ACC, side: x < p.u0 ? -1 : 1, bg: '#F6EFE3' });
    if (p.z0 > 6) s += dim(x, 0, x, -p.z0, String(Math.round(p.z0)), U, { color: ACC, side: x < p.u0 ? -1 : 1, bg: '#F6EFE3' });
  }
  return s + '</g>';
}

/**
 * What: viewBox for one view (local cm space).
 * In:  room, view ('plan' | 'front' | 'side')
 * Out: [x, y, w, h]
 */
export function viewBox(room, view) {
  const M = margin(unit(room));
  if (view === 'plan') return [-M, -M, room.w + 2 * M, room.l + 2 * M];
  const W = view === 'front' ? room.w : room.l;
  return [-M, -room.h - M, W + 2 * M, room.h + 2 * M];
}

/**
 * What: one standalone view as a full <svg> string.
 * In:  S (state), view, opts {id, interactive, title}
 * Out: SVG string
 */
export function viewSVG(S, view, opts = {}) {
  const id = opts.id || 'v' + view, U = unit(S.room), vb = viewBox(S.room, view);
  const body = view === 'plan' ? planView(S, id, opts) : elevView(S, view, id);
  // a paper background so exports are never transparent
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.map(f).join(' ')}" class="drawing">${opts.style || ''}${defs(id, U)}
    <rect x="${f(vb[0])}" y="${f(vb[1])}" width="${f(vb[2])}" height="${f(vb[3])}" fill="${PAPER}"/>${body}</svg>`;
}

/**
 * What: layout of the drawing sheet: front elevation above the plan
 *       (sharing x), side elevation to the right of the front elevation
 *       (sharing z), title block below it (right of the plan).
 * In:  room
 * Out: {W, H, front:[dx,dy], plan:[dx,dy], side:[dx,dy], block:[x,y,w,h], M, U}
 */
export function sheetLayout(room) {
  const U = unit(room), M = margin(U), G = 34 * U, TL = 30 * U;
  const colA = room.w + 2 * M, colB = room.l + 2 * M;
  const rowA = room.h + 2 * M + TL, rowB = room.l + 2 * M + TL;
  // translations put each view's local origin in sheet space
  return {
    U, M, W: colA + G + colB, H: rowA + G + rowB,
    front: [M, M + room.h], plan: [M, rowA + G + M], side: [colA + G + M, M + room.h],
    block: [colA + G, rowA + G, colB, rowB - TL], TL, G,
  };
}

/**
 * What: the complete drawing sheet (lámina) with all 3 views.
 * In:  S (state), opts {id, interactive, style, titleBlock}
 * Out: SVG string
 */
export function sheetSVG(S, opts = {}) {
  const id = opts.id || 'sh', L = sheetLayout(S.room), U = L.U, room = S.room;
  const tx = ([x, y]) => `translate(${f(x)} ${f(y)})`;
  // outer paper margin so titles never touch the sheet edge
  const pad = 24 * U;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(-pad)} ${f(-pad)} ${f(L.W + 2 * pad)} ${f(L.H + 2 * pad)}" class="drawing lamina">${opts.style || ''}${defs(id, U)}`;
  s += `<rect x="${f(-pad)}" y="${f(-pad)}" width="${f(L.W + 2 * pad)}" height="${f(L.H + 2 * pad)}" fill="${PAPER}"/>`;
  // projection lines linking the selected piece across the views
  const it = S.items.find((i) => i.id === S.sel);
  if (it) s += projectionLines(it, S, L);
  s += `<g transform="${tx(L.front)}">${elevView(S, 'front', id)}</g>`;
  s += `<g transform="${tx(L.plan)}">${planView(S, id, opts)}</g>`;
  s += `<g transform="${tx(L.side)}">${elevView(S, 'side', id)}</g>`;
  // view titles under each drawing
  const title = (x, y, k, txt) => `<g class="vt"><text x="${f(x)}" y="${f(y)}" font-size="${f(U * 11)}" fill="${INK}" class="dt" letter-spacing="${f(U * 1.4)}"><tspan fill="${ACC}">${k}</tspan>  ${txt.toUpperCase()}</text></g>`;
  s += title(0, L.front[1] + L.M + L.TL * 0.55, 'A', t('front'));
  s += title(L.side[0] - L.M, L.side[1] + L.M + L.TL * 0.55, 'B', t('side'));
  s += title(0, L.plan[1] + room.l + L.M + L.TL * 0.55, '01', t('plan'));
  s += titleBlock(S, L);
  return s + '</svg>';
}

/**
 * What: dashed terracotta projection lines for the selected item, from
 *       the plan up to the front elevation and across to the side one.
 * In:  it (item), S (state), L (sheet layout)
 * Out: SVG string
 */
function projectionLines(it, S, L) {
  const b = bbox(it), U = L.U, fz = it.z || 0;
  const a = `stroke="${ACC}" stroke-width="${f(U * 0.6)}" stroke-dasharray="${f(U * 4)} ${f(U * 3)}" stroke-opacity=".7"`;
  let s = '<g pointer-events="none">';
  // vertical lines: plan x-extent → front elevation
  [b.x0, b.x1].forEach((x) => { s += `<line x1="${f(L.plan[0] + x)}" y1="${f(L.plan[1] + b.y0)}" x2="${f(L.front[0] + x)}" y2="${f(L.front[1] - fz)}" ${a}/>`; });
  // horizontal lines: front elevation heights → side elevation
  [fz, fz + it.h].forEach((z) => { s += `<line x1="${f(L.front[0] + b.x1)}" y1="${f(L.front[1] - z)}" x2="${f(L.side[0] + S.room.l - b.y1)}" y2="${f(L.side[1] - z)}" ${a}/>`; });
  return s + '</g>';
}

/**
 * What: architectural title block (project, room, pieces, credits, Demo).
 * In:  S (state), L (sheet layout)
 * Out: SVG string
 */
function titleBlock(S, L) {
  const [x, y, w, h] = L.block, U = L.U, pad = 16 * U;
  const bw = Math.min(w, 300 * U), bh = Math.min(h, 170 * U), bx = x + w - bw, by = y + h - bh;
  const tt = (dy, txt, size, extra = '') => `<text x="${f(bx + pad)}" y="${f(by + dy)}" font-size="${f(size * U)}"${/fill=/.test(extra.replace(/fill-opacity/g, '')) ? '' : ` fill="${INK}"`} ${extra}>${txt}</text>`;
  const r = S.room, n = S.items.length;
  const date = new Date().toLocaleDateString(getLang() === 'en' ? 'en-US' : 'es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  // frame + rows of information
  let s = `<g class="tb"><rect x="${f(bx)}" y="${f(by)}" width="${f(bw)}" height="${f(bh)}" fill="#fff" stroke="${INK}" stroke-width="${f(U * 0.9)}"/>`;
  s += `<line x1="${f(bx)}" y1="${f(by + 64 * U)}" x2="${f(bx + bw)}" y2="${f(by + 64 * U)}" stroke="${INK}" stroke-width="${f(U * 0.5)}"/>`;
  s += tt(28 * U, 'Js Interiorismo', 17, 'class="tbh"') + tt(48 * U, `${t('title')} · ${t('demo')}`, 10, `fill="${ACC}" letter-spacing="${f(U)}" class="dt"`);
  s += tt(86 * U, escapeXml(S.name || ''), 11.5, 'class="dt"');
  s += tt(106 * U, `${r.w} × ${r.l} × ${r.h} cm · ${n} ${n === 1 ? t('piece') : t('pieces')}`, 10);
  s += tt(124 * U, date, 10, 'fill-opacity=".6"');
  s += tt(150 * U, `${t('credit1')} · ${t('credit2')}`, 7.6, 'fill-opacity=".55"');
  return s + '</g>';
}

/**
 * What: escape text for safe inclusion in SVG/XML.
 * In:  s (string)
 * Out: escaped string
 */
export function escapeXml(s) {
  return String(s).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]));
}
