/* =========================================================================
   screens/thumb.js — mini floor-plan thumbnail for a saved design (SVG)
   Cheap, crisp and consistent with the 2D editor (no WebGL capture needed).
   ========================================================================= */
import { CATALOGUE } from '../data.js';
import { finishURL, tileSizeCm } from '../textures.js';
import { pieceSVG } from '../furniture2d.js';

let n = 0;

/**
 * What: build a small SVG plan of a design.
 * In:  design { room, floor, items }
 * Out: SVG markup string
 */
export function planThumb(design) {
  const { w, d } = design.room;
  const m = 26, id = 'tf' + (n++);
  const ts = tileSizeCm(design.floor);
  // pieces drawn with the same top-view art as the editor
  const items = design.items.map((it) => {
    const c = CATALOGUE.find((x) => x.type === it.type);
    return `<g transform="translate(${it.x} ${it.y}) rotate(${it.rot})">${pieceSVG(it.type, c.w, c.d)}</g>`;
  }).join('');
  return `<svg viewBox="${-m} ${-m} ${w + m * 2} ${d + m * 2}" width="100%" height="100%" aria-hidden="true">
    <defs><pattern id="${id}" patternUnits="userSpaceOnUse" width="${ts}" height="${ts}"><image href="${finishURL(design.floor)}" width="${ts}" height="${ts}"/></pattern></defs>
    <rect x="0" y="0" width="${w}" height="${d}" fill="url(#${id})"/>
    <rect x="-6" y="-6" width="${w + 12}" height="${d + 12}" fill="none" stroke="#3E3027" stroke-width="12"/>
    ${items}</svg>`;
}
