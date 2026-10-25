/* =========================================================================
   furniture2d.js — architectural top-view drawings of each catalogue piece
   Drawn centred on (0,0) in centimetres, front of the piece facing +y.
   Used by the 2D plan editor and by the catalogue tiles.
   ========================================================================= */

const INK = '#5A4636';      // line colour (warm brown ink)
const SW = 1.6;             // stroke width in cm-units (scaled with the plan)

/**
 * What: rounded rectangle helper centred on cx, cy.
 * In:  cx, cy, w, h, r, fill, extra attributes string
 * Out: SVG <rect> string
 */
function rr(cx, cy, w, h, r, fill, extra = '') {
  return `<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${INK}" stroke-width="${SW}" ${extra}/>`;
}

/**
 * What: SVG markup for one piece type at its size.
 * In:  type (catalogue type), w, d (cm)
 * Out: SVG markup string (group contents)
 */
export function pieceSVG(type, w, d) {
  const hw = w / 2, hd = d / 2;
  let s = '';
  switch (type) {
    case 'sofa': {
      // base, backrest along the top edge, two arms, three seat cushions
      s += rr(0, 0, w, d, 10, '#E9DECB');
      s += rr(0, -hd + 11, w - 8, 18, 7, '#DCCDB4');
      s += rr(-hw + 11, 6, 18, d - 16, 7, '#DCCDB4');
      s += rr(hw - 11, 6, 18, d - 16, 7, '#DCCDB4');
      const cw = (w - 44) / 3;
      for (let i = 0; i < 3; i++) s += rr(-hw + 22 + cw / 2 + i * cw, 10, cw - 3, d - 32, 6, '#F3EADB');
      s += rr(-hw + 40, -hd + 28, 26, 16, 6, '#B8643E', 'stroke-opacity=".5"');
      s += rr(hw - 40, -hd + 28, 26, 16, 6, '#6E7656', 'stroke-opacity=".5"');
      break;
    }
    case 'mesa': {
      // dining table with six chairs around it (chair = seat + backrest, rotated per side)
      const chair = (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})">${rr(0, 0, 42, 40, 9, '#EADFCD')}${rr(0, -16, 38, 8, 4, '#CDB99B')}</g>`;
      const cx = w / 3.2;
      [-cx, 0, cx].forEach((x) => { s += chair(x, -hd - 8, 0); s += chair(x, hd + 8, 180); });
      s += rr(0, 0, w, d, 8, '#8A6247');
      s += `<rect x="${-hw + 8}" y="${-hd + 8}" width="${w - 16}" height="${d - 16}" rx="5" fill="none" stroke="#F3E6D3" stroke-opacity=".35" stroke-width="1"/>`;
      break;
    }
    case 'cama': {
      // frame + headboard on top edge, pillows, folded duvet with throw
      s += rr(0, 0, w, d, 6, '#8A6247');
      s += rr(0, -hd + 6, w, 12, 4, '#6E4B34');
      s += rr(0, 12, w - 12, d - 36, 6, '#FAF5EC');
      s += rr(-w / 4 + 2, -hd + 32, w / 2 - 18, 30, 10, '#FFFFFF');
      s += rr(w / 4 - 2, -hd + 32, w / 2 - 18, 30, 10, '#FFFFFF');
      s += rr(0, hd - 42, w - 10, 36, 5, '#B8643E');
      s += `<line x1="${-hw + 8}" y1="${-hd + 60}" x2="${hw - 8}" y2="${-hd + 60}" stroke="${INK}" stroke-width="1" stroke-opacity=".5"/>`;
      break;
    }
    case 'closet': {
      // carcass with door split lines and swing hint
      s += rr(0, 0, w, d, 3, '#D9BD98');
      const n = Math.max(2, Math.round(w / 60));
      for (let i = 1; i < n; i++) {
        const x = -hw + (w / n) * i;
        s += `<line x1="${x}" y1="${-hd + 3}" x2="${x}" y2="${hd - 3}" stroke="${INK}" stroke-width="1"/>`;
      }
      s += `<path d="M${-hw + 2} ${hd + 2} q ${w / n / 2} ${w / n / 2.4} ${w / n - 4} 0" fill="none" stroke="${INK}" stroke-dasharray="3 3" stroke-width="1" stroke-opacity=".55"/>`;
      break;
    }
    case 'isla': {
      // stone top, base inset, three stools on the front side
      for (const x of [-w / 3.2, 0, w / 3.2]) s += `<circle cx="${x}" cy="${hd + 22}" r="17" fill="#EADFCD" stroke="${INK}" stroke-width="${SW}"/>`;
      s += rr(0, 0, w, d, 4, '#E7DCC9');
      s += rr(0, -6, w - 22, d - 34, 3, 'none', 'stroke-opacity=".45" stroke-dasharray="4 3"');
      s += `<circle cx="${-w / 4}" cy="-6" r="11" fill="none" stroke="${INK}" stroke-width="1.2"/>`;
      s += `<rect x="${w / 8}" y="-20" width="${w / 4}" height="26" rx="6" fill="#D9CCB6" stroke="${INK}" stroke-width="1.2"/>`;
      break;
    }
    case 'planta': {
      // terracotta pot seen from above with radiating leaves
      s += `<circle cx="0" cy="0" r="${hw * 0.62}" fill="#B8643E" stroke="${INK}" stroke-width="${SW}"/>`;
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2, r = hw * 0.98;
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        s += `<path d="M0 0 Q ${x * 0.5 - y * 0.25} ${y * 0.5 + x * 0.25} ${x} ${y} Q ${x * 0.5 + y * 0.25} ${y * 0.5 - x * 0.25} 0 0z" fill="#6E7656" fill-opacity=".9" stroke="#4E5540" stroke-width="1"/>`;
      }
      s += `<circle cx="0" cy="0" r="5" fill="#4E5540"/>`;
      break;
    }
    case 'tapete': {
      // woven rug with inner border and fringe
      s += `<rect x="${-hw}" y="${-hd}" width="${w}" height="${d}" rx="3" fill="#F1E7D6" stroke="#CDB99B" stroke-width="${SW}"/>`;
      s += `<rect x="${-hw + 12}" y="${-hd + 12}" width="${w - 24}" height="${d - 24}" rx="2" fill="none" stroke="#B8643E" stroke-opacity=".55" stroke-width="2"/>`;
      s += `<rect x="${-hw + 20}" y="${-hd + 20}" width="${w - 40}" height="${d - 40}" rx="2" fill="none" stroke="#6E7656" stroke-opacity=".35" stroke-width="1"/>`;
      break;
    }
    default:
      s += rr(0, 0, w, d, 6, '#E9DECB');
  }
  return s;
}

/**
 * What: standalone SVG thumbnail of a piece (catalogue tiles).
 * In:  type, w, d
 * Out: SVG markup string
 */
export function pieceThumb(type, w, d) {
  const pad = type === 'mesa' ? 60 : type === 'isla' ? 46 : 14;
  const vw = w + pad * 2, vh = d + pad * 2;
  return `<svg viewBox="${-vw / 2} ${-vh / 2} ${vw} ${vh}" width="100%" height="100%" aria-hidden="true">${pieceSVG(type, w, d)}</svg>`;
}
