/* =========================================================================
   geometry.js: pure maths for the three linked orthographic projections.
   Convention (cm): plan origin = inner top-left corner of the room,
   x → along width w, y ↓ along length l. (x,y) = top-left of the item's
   footprint at rot=0; rot = degrees clockwise about the footprint centre.
   Frontal elevation: viewer at y=l looking at the y=0 wall (u = x).
   Lateral elevation: viewer at x=w looking at the x=0 wall (u = l − y).
   ========================================================================= */

export const WALL = 15; // wall / slab thickness drawn in the projections (cm)

/**
 * What: centre point of an item's footprint.
 * In:  it (item)
 * Out: {cx, cy}
 */
export function center(it) {
  return { cx: it.x + it.w / 2, cy: it.y + it.d / 2 };
}

/**
 * What: axis-aligned bounding box of the rotated footprint.
 * In:  it (item)
 * Out: {x0, y0, x1, y1}
 */
export function bbox(it) {
  const r = (it.rot || 0) * Math.PI / 180;
  // half-extents of the rotated rectangle projected on x and y
  const hx = (Math.abs(Math.cos(r)) * it.w + Math.abs(Math.sin(r)) * it.d) / 2;
  const hy = (Math.abs(Math.sin(r)) * it.w + Math.abs(Math.cos(r)) * it.d) / 2;
  const { cx, cy } = center(it);
  return { x0: cx - hx, y0: cy - hy, x1: cx + hx, y1: cy + hy };
}

/**
 * What: unit vector the item "faces" (its front), in plan coordinates.
 *       At rot=0 the front points down the plan (+y, toward the viewer
 *       of the frontal elevation).
 * In:  it (item)
 * Out: {fx, fy}
 */
export function facing(it) {
  const r = (it.rot || 0) * Math.PI / 180;
  // rotating (0,1) clockwise on screen (y down)
  return { fx: -Math.sin(r), fy: Math.cos(r) };
}

/**
 * What: projection of an item into one elevation.
 * In:  it (item), view ('front' | 'side'), room ({w,l,h})
 * Out: {u0, u1, z0, z1, depth, face, backHigh}
 *      face = 'front' when we see its front/back, 'side' when its flank;
 *      backHigh = in a side profile, is the item's back at the high-u end
 */
export function project(it, view, room) {
  const b = bbox(it);
  const { fx, fy } = facing(it);
  const z0 = it.z || 0;
  const z1 = z0 + it.h;
  if (view === 'front') {
    // horizontal axis is x; nearer to the viewer = larger y
    const face = Math.abs(fy) >= Math.abs(fx) ? 'front' : 'side';
    return { u0: b.x0, u1: b.x1, z0, z1, depth: (b.y0 + b.y1) / 2, face, backHigh: fx < 0, faceSign: fy };
  }
  // lateral: u = l − y, nearer to the viewer = larger x
  const face = Math.abs(fx) >= Math.abs(fy) ? 'front' : 'side';
  return { u0: room.l - b.y1, u1: room.l - b.y0, z0, z1, depth: (b.x0 + b.x1) / 2, face, backHigh: fy > 0, faceSign: fx };
}

/**
 * What: keep an item inside the room (footprint and height).
 * In:  it (item, mutated), room ({w,l,h})
 * Out: the same item
 */
export function clampItem(it, room) {
  const b = bbox(it);
  // push back inside along x and y using the rotated bounding box
  if (b.x0 < 0) it.x -= b.x0; else if (b.x1 > room.w) it.x -= (b.x1 - room.w);
  if (b.y0 < 0) it.y -= b.y0; else if (b.y1 > room.l) it.y -= (b.y1 - room.l);
  // vertical: never below the floor or through the ceiling
  const z = it.z || 0;
  if (z + it.h > room.h) it.z = Math.max(0, room.h - it.h);
  if (z < 0) it.z = 0;
  it.x = Math.round(it.x); it.y = Math.round(it.y);
  return it;
}

/**
 * What: snap a value to a step.
 * In:  v (number), step (number)
 * Out: snapped number
 */
export function snap(v, step) { return Math.round(v / step) * step; }

/**
 * What: free distances from the item's bounding box to the 4 walls.
 * In:  it (item), room ({w,l,h})
 * Out: {left, right, top, bottom} in cm
 */
export function wallGaps(it, room) {
  const b = bbox(it);
  return { left: b.x0, right: room.w - b.x1, top: b.y0, bottom: room.l - b.y1 };
}
