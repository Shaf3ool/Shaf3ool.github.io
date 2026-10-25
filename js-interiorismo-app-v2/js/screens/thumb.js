/* =========================================================================
   screens/thumb.js — mini floor-plan thumbnail for a saved design (SVG)
   Uses the same drawing code as the editor (plan2d.js): floor finish,
   wall finish in the poché, door, window and the furniture symbols.
   ========================================================================= */
import { CATALOGUE } from '../data.js';
import { pieceSVG } from '../furniture2d.js';
import { planBox, planDefs, roomMarkup } from '../plan2d.js';

let n = 0;

/**
 * What: build a small SVG plan of a design.
 * In:  design { room, floor, wall, door, items }
 * Out: SVG markup string
 */
export function planThumb(design) {
  const id = 'tf' + (n++);
  const b = planBox(design.room, true);
  // pieces drawn with the same top-view art as the editor
  const items = design.items.map((it) => {
    const c = CATALOGUE.find((x) => x.type === it.type);
    return `<g transform="translate(${it.x} ${it.y}) rotate(${it.rot})">${pieceSVG(it.type, c.w, c.d)}</g>`;
  }).join('');
  return `<svg viewBox="${b.x} ${b.y} ${b.w} ${b.h}" width="100%" height="100%" aria-hidden="true">
    ${planDefs(design, id)}${roomMarkup(design, id, 'color')}${items}</svg>`;
}
