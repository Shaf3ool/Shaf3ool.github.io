/* =========================================================================
   plan2d.js — architectural floor-plan drawing (pure SVG string builders)
   Shared by the planner editor and the mini thumbnails, so a saved design
   looks the same everywhere. Two drawing modes:
     - "color": finish textures as floor fill, wall finish inside the poché
     - "tech":  monochrome technical drawing (ink poché, joint lines)
   Coordinates are centimetres; the room interior spans 0..w × 0..d and
   the walls (WALL cm thick) are drawn outside that rectangle.
   ========================================================================= */
import { FINISHES } from './data.js';
import { finishURL, tileSizeCm } from './textures.js';

export const WALL = 18;          // wall thickness in cm (drawn outside the room)
const DOOR = 90;                 // door opening width (cm)
const DOOR_OFF = 40;             // distance from the corner to the opening (cm)
const INK = '#2E2520';           // drawing ink
const DIM = '#9C8B7C';           // dimension line colour

// plan margins around the walls (room for dimensions and the title block)
export const MARGINS = { top: WALL + 64, left: WALL + 64, right: WALL + 26, bottom: WALL + 92 };

/**
 * What: look up a finish definition by key.
 * In:  key (string)
 * Out: finish object { key, tone, kind } (falls back to the first finish)
 */
const finish = (key) => FINISHES.find((f) => f.key === key) || FINISHES[0];

/**
 * What: the SVG viewBox that frames the room, walls, dimensions and title.
 * In:  room { w, d }, compact (bool: thumbnails use a tight frame)
 * Out: { x, y, w, h } in cm
 */
export function planBox(room, compact = false) {
  if (compact) { const m = WALL + 10; return { x: -m, y: -m, w: room.w + m * 2, h: room.d + m * 2 }; }
  const M = MARGINS;
  return { x: -M.left, y: -M.top, w: room.w + M.left + M.right, h: room.d + M.top + M.bottom };
}

/**
 * What: choose where the door goes the first time a design is drawn —
 *       the first candidate whose swing area is free of furniture.
 * In:  design { room, items }, footprint(item) => { hx, hy }
 * Out: door object { wall: 'b'|'r'|'l'|'t', end: 'start'|'end' }
 */
export function pickDoor(design, footprint) {
  const cands = [['b', 'end'], ['b', 'start'], ['r', 'end'], ['l', 'end'], ['r', 'start'], ['l', 'start'], ['t', 'end'], ['t', 'start']];
  // test each candidate's 90×90 swing square against every piece's bounding box
  for (const [wall, end] of cands) {
    const sq = swingRect({ wall, end }, design.room);
    const blocked = design.items.some((it) => {
      const { hx, hy } = footprint(it);
      return it.x + hx > sq.x0 && it.x - hx < sq.x1 && it.y + hy > sq.y0 && it.y - hy < sq.y1;
    });
    if (!blocked) return { wall, end };
  }
  return { wall: 'b', end: 'end' };
}

/**
 * What: the room-space rectangle swept by the door leaf.
 * In:  door { wall, end }, room { w, d }
 * Out: { x0, y0, x1, y1 } in cm
 */
function swingRect(door, room) {
  const L = door.wall === 'b' || door.wall === 't' ? room.w : room.d;
  const s = door.end === 'end' ? L - DOOR_OFF - DOOR : DOOR_OFF;
  // map the along-wall span [s, s+DOOR] and the depth [0, DOOR] into room space
  if (door.wall === 'b') return { x0: s, x1: s + DOOR, y0: room.d - DOOR, y1: room.d };
  if (door.wall === 't') return { x0: s, x1: s + DOOR, y0: 0, y1: DOOR };
  if (door.wall === 'l') return { x0: 0, x1: DOOR, y0: s, y1: s + DOOR };
  return { x0: room.w - DOOR, x1: room.w, y0: s, y1: s + DOOR };
}

/**
 * What: SVG transform that turns "wall-local" coordinates into room space.
 *       Local x runs along the wall, local +y points out through the wall.
 * In:  wall ('b'|'t'|'l'|'r'), room { w, d }
 * Out: { tf: transform string, len: wall length in cm }
 */
function wallFrame(wall, room) {
  if (wall === 'b') return { tf: `translate(0 ${room.d})`, len: room.w };
  if (wall === 't') return { tf: 'scale(1 -1)', len: room.w };
  if (wall === 'l') return { tf: 'rotate(90)', len: room.d };
  return { tf: `matrix(0 1 1 0 ${room.w} 0)`, len: room.d };
}

/**
 * What: <defs> for one plan: floor + wall finish patterns, technical
 *       joint patterns, background grid and the piece shadows.
 * In:  design { floor, wall }, id (unique prefix for this SVG)
 * Out: SVG markup string
 */
export function planDefs(design, id) {
  const ts = tileSizeCm(design.floor);
  const kind = finish(design.floor).kind;
  // technical floor joints depend on the material family
  let joints = '';
  if (kind === 'wood') joints = `<pattern id="${id}-tf" patternUnits="userSpaceOnUse" width="150" height="40"><path d="M0 .4H150M0 20.4H150M.4 0V20M75.4 20V40" stroke="${INK}" stroke-opacity=".16" stroke-width=".8" fill="none"/></pattern>`;
  else if (kind === 'plaster') joints = `<pattern id="${id}-tf" patternUnits="userSpaceOnUse" width="24" height="24"><circle cx="6" cy="7" r=".7" fill="${INK}" fill-opacity=".14"/><circle cx="18" cy="17" r=".6" fill="${INK}" fill-opacity=".1"/></pattern>`;
  else { const s = ts / 2; joints = `<pattern id="${id}-tf" patternUnits="userSpaceOnUse" width="${s}" height="${s}"><path d="M0 .4H${s}M.4 0V${s}" stroke="${INK}" stroke-opacity=".16" stroke-width=".8" fill="none"/></pattern>`; }
  return `<defs>
    <pattern id="${id}-floor" patternUnits="userSpaceOnUse" width="${ts}" height="${ts}"><image href="${finishURL(design.floor)}" width="${ts}" height="${ts}"/></pattern>
    <pattern id="${id}-wall" patternUnits="userSpaceOnUse" width="90" height="90"><image href="${finishURL(design.wall, 128)}" width="90" height="90"/></pattern>
    ${joints}
    <pattern id="${id}-hatch" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)"><path d="M0 0V7" stroke="#FBF8F2" stroke-opacity=".22" stroke-width="1.2"/></pattern>
    <pattern id="${id}-grid" patternUnits="userSpaceOnUse" width="50" height="50"><circle cx="0" cy="0" r="1.4" fill="#B8643E" fill-opacity=".22"/></pattern>
    <linearGradient id="${id}-ao" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2E2520" stop-opacity=".16"/><stop offset="1" stop-color="#2E2520" stop-opacity="0"/></linearGradient>
    <filter id="${id}-sh" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="0" dy="2.5" stdDeviation="3.2" flood-color="#3b2a1e" flood-opacity=".24"/></filter>
    <filter id="${id}-lift" x="-35%" y="-35%" width="170%" height="170%"><feDropShadow dx="0" dy="10" stdDeviation="9" flood-color="#3b2a1e" flood-opacity=".3"/></filter>
  </defs>`;
}

/**
 * What: floor, soft wall shading, walls (poché), door and window.
 * In:  design { room, floor, wall, door }, id (defs prefix), mode ('color'|'tech')
 * Out: SVG markup string
 */
export function roomMarkup(design, id, mode = 'color') {
  const { w, d } = design.room, T = WALL;
  const tech = mode === 'tech';
  const door = design.door || { wall: 'b', end: 'end' };
  const winWall = { b: 't', t: 'b', l: 'r', r: 'l' }[door.wall];
  // floor: finish texture (colour) or paper + joints (technical)
  let s = tech
    ? `<rect width="${w}" height="${d}" fill="#FFFDF9"/><rect width="${w}" height="${d}" fill="url(#${id}-tf)"/>`
    : `<rect width="${w}" height="${d}" fill="url(#${id}-floor)"/><rect width="${w}" height="${d}" fill="#fff" fill-opacity=".08"/>`;
  // ambient shading along the four walls (colour mode only)
  if (!tech) {
    const ao = 16;
    s += `<g opacity=".9"><rect width="${ao}" height="${d}" fill="url(#${id}-ao)"/>
      <rect width="${ao}" height="${d}" fill="url(#${id}-ao)" transform="translate(${w} 0) scale(-1 1)"/>
      <rect width="${ao}" height="${w}" fill="url(#${id}-ao)" transform="rotate(90) scale(1 -1)"/>
      <rect width="${ao}" height="${w}" fill="url(#${id}-ao)" transform="translate(0 ${d}) rotate(-90)"/></g>`;
  }
  // walls: one even-odd ring, finish texture or solid ink poché
  const ring = `M${-T} ${-T}H${w + T}V${d + T}H${-T}Z M0 0V${d}H${w}V0Z`;
  s += tech
    ? `<path d="${ring}" fill="${INK}" fill-rule="evenodd"/><path d="${ring}" fill="url(#${id}-hatch)" fill-rule="evenodd"/>`
    : `<path d="${ring}" fill="url(#${id}-wall)" fill-rule="evenodd"/><path d="${ring}" fill="${finish(design.wall).tone}" fill-opacity=".35" fill-rule="evenodd"/>`;
  s += `<path d="${ring}" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linejoin="miter"/>`;
  s += openingMarkup(door, winWall, design.room, tech);
  return s;
}

/**
 * What: door (opening, leaf, swing arc) and window (glazing) drawn in the
 *       frame of the wall they sit in.
 * In:  door { wall, end }, winWall (wall key), room { w, d }, tech (bool)
 * Out: SVG markup string
 */
function openingMarkup(door, winWall, room, tech) {
  const T = WALL;
  const gapFill = tech ? '#FFFDF9' : '#EFE6D8';
  // door: opening cut through the wall + leaf + dashed swing arc
  const df = wallFrame(door.wall, room);
  const sd = door.end === 'end' ? df.len - DOOR_OFF - DOOR : DOOR_OFF;
  const hinge = door.end === 'end' ? sd + DOOR : sd, free = door.end === 'end' ? sd : sd + DOOR;
  const sweep = door.end === 'end' ? 1 : 0;
  const leafX = door.end === 'end' ? hinge - 4 : hinge;
  let s = `<g transform="${df.tf}">
    <rect x="${sd}" y="-1" width="${DOOR}" height="${T + 2.5}" fill="${gapFill}"/>
    <path d="M${sd} 0V${T}M${sd + DOOR} 0V${T}" stroke="${INK}" stroke-width="1.8"/>
    <path d="M${free} 0A${DOOR} ${DOOR} 0 0 ${sweep} ${hinge} ${-DOOR}" fill="none" stroke="${INK}" stroke-width="1" stroke-dasharray="4 4" stroke-opacity=".7"/>
    <rect x="${leafX}" y="${-DOOR}" width="4" height="${DOOR}" fill="#FBF8F2" stroke="${INK}" stroke-width="1.4"/>
  </g>`;
  // window: centred on the opposite wall, three glazing lines
  const wf = wallFrame(winWall, room);
  const ww = Math.min(160, Math.round(wf.len * 0.4)), wx = (wf.len - ww) / 2;
  s += `<g transform="${wf.tf}">
    <rect x="${wx}" y="0" width="${ww}" height="${T}" fill="#FBF8F2" stroke="${INK}" stroke-width="1.4"/>
    <path d="M${wx} ${T * 0.38}H${wx + ww}M${wx} ${T * 0.62}H${wx + ww}" stroke="${INK}" stroke-width=".9"/>
    <path d="M${wx} ${T * 0.5}H${wx + ww}" stroke="#7FA3B0" stroke-width="1.6" stroke-opacity=".8"/>
  </g>`;
  return s;
}

/**
 * What: one architectural dimension line (extension lines, 45° ticks, label).
 * In:  x1, y1, x2, y2 (measured points), off (offset out from the wall, cm),
 *      vertical (bool), label (string)
 * Out: SVG markup string
 */
function dimLine(x1, y1, x2, y2, off, vertical, label) {
  const tk = 7;
  if (!vertical) {
    const y = y1 - off;
    // extension lines from the wall face up past the dimension line
    return `<path d="M${x1} ${y1 - WALL - 8}V${y - 9}M${x2} ${y1 - WALL - 8}V${y - 9}M${x1 - 12} ${y}H${x2 + 12}M${x1 - tk} ${y + tk}L${x1 + tk} ${y - tk}M${x2 - tk} ${y + tk}L${x2 + tk} ${y - tk}" stroke="${DIM}" stroke-width="1.1" fill="none"/>
      <text x="${(x1 + x2) / 2}" y="${y - 9}" text-anchor="middle">${label}</text>`;
  }
  const x = x1 - off;
  // same construction rotated: label reads bottom-to-top
  return `<path d="M${x1 - WALL - 8} ${y1}H${x - 9}M${x1 - WALL - 8} ${y2}H${x - 9}M${x} ${y1 - 12}V${y2 + 12}M${x - tk} ${y1 + tk}L${x + tk} ${y1 - tk}M${x - tk} ${y2 + tk}L${x + tk} ${y2 - tk}" stroke="${DIM}" stroke-width="1.1" fill="none"/>
    <text transform="translate(${x - 9} ${(y1 + y2) / 2}) rotate(-90)" text-anchor="middle">${label}</text>`;
}

/**
 * What: overall dimensions (top + left) and the title block under the plan
 *       (room name, area, finishes, graphic scale and north arrow).
 * In:  design { room, name, floor, wall }, labels { area, floor, wall, scale } (translated words + finish names)
 * Out: SVG markup string
 */
export function annotationMarkup(design, labels) {
  const { w, d } = design.room, T = WALL;
  const m = (v) => (v / 100).toFixed(2);
  let s = `<g class="dims" font-family="DM Sans, system-ui, sans-serif" font-size="17" font-weight="500" fill="#6E5E51" letter-spacing=".5">`;
  s += dimLine(0, 0, w, 0, T + 36, false, `${m(w)} m`);
  s += dimLine(0, 0, 0, d, T + 36, true, `${m(d)} m`);
  s += '</g>';
  // title block: name + area on the left, scale bar under it, north arrow right
  const ty = d + T + 40;
  const area = ((w * d) / 10000).toFixed(1);
  s += `<g class="title" font-family="DM Sans, system-ui, sans-serif">
    <text x="0" y="${ty}" font-size="17" font-weight="700" letter-spacing="2.2" fill="${INK}">${esc(design.name).toUpperCase()}</text>
    <text x="0" y="${ty + 24}" font-size="14.5" fill="#8B7563">${area} ${labels.area} · ${labels.floor} · ${labels.wall}</text>
    <g transform="translate(0 ${ty + 40})" font-size="12" fill="#8B7563">
      <rect width="50" height="6" fill="${INK}"/><rect x="50" width="50" height="6" fill="#FFFDF9" stroke="${INK}" stroke-width="1"/>
      <text x="0" y="22">0</text><text x="100" y="22" text-anchor="middle">1 m</text>
    </g>
    <g transform="translate(${w - 14} ${ty - 2})">
      <circle r="17" fill="none" stroke="${DIM}" stroke-width="1.1"/>
      <path d="M0 -14L6 7L0 3L-6 7Z" fill="${INK}"/>
      <text y="-22" text-anchor="middle" font-size="12" font-weight="700" fill="${INK}">N</text>
    </g>
  </g>`;
  return s;
}

/**
 * What: live distance guides from a piece to the nearest walls (cm),
 *       shown while dragging, plus an angle badge while rotating.
 * In:  it { x, y, rot }, ext { hx, hy } (half bounding box), room { w, d },
 *      mode ('move' | 'rot'), handleY (local y of the rotate handle)
 * Out: SVG markup string
 */
export function guidesMarkup(it, ext, room, mode, handleY = 0) {
  const pill = (x, y, txt) => `<g transform="translate(${x} ${y})"><rect x="${-(txt.length * 5.2 + 12)}" y="-13" width="${txt.length * 10.4 + 24}" height="26" rx="13" fill="#B8643E"/><text y="5.5" text-anchor="middle" font-size="15" font-weight="700" fill="#fff" font-family="DM Sans, system-ui, sans-serif">${txt}</text></g>`;
  if (mode === 'rot') {
    // angle badge sits just beyond the rotate handle, kept upright
    const a = (it.rot * Math.PI) / 180, r = Math.abs(handleY) + 38;
    return pill(it.x + Math.sin(a) * r, it.y - Math.cos(a) * r, `${Math.round(it.rot)}°`);
  }
  const L = it.x - ext.hx, R = room.w - (it.x + ext.hx), Tp = it.y - ext.hy, B = room.d - (it.y + ext.hy);
  let s = '';
  const line = (x1, y1, x2, y2) => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="#B8643E" stroke-width="1.6" stroke-dasharray="5 4"/><circle cx="${x2}" cy="${y2}" r="3" fill="#B8643E"/>`;
  // horizontal guide to the closer side wall
  if (Math.min(L, R) > 6) {
    if (L <= R) s += line(it.x - ext.hx, it.y, 0, it.y) + pill(L / 2, it.y, `${Math.round(L)}`);
    else s += line(it.x + ext.hx, it.y, room.w, it.y) + pill(room.w - R / 2, it.y, `${Math.round(R)}`);
  }
  // vertical guide to the closer front/back wall
  if (Math.min(Tp, B) > 6) {
    if (Tp <= B) s += line(it.x, it.y - ext.hy, it.x, 0) + pill(it.x, Tp / 2, `${Math.round(Tp)}`);
    else s += line(it.x, it.y + ext.hy, it.x, room.d) + pill(it.x, room.d - B / 2, `${Math.round(B)}`);
  }
  return s;
}

/**
 * What: escape text for SVG/HTML.
 * In:  s (string)
 * Out: escaped string
 */
function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
