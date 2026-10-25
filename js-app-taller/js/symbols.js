/* =========================================================================
   symbols.js: architectural line-drawing symbols for every catalogue type.
   planSymbol()  → top view, centred on (0,0), unrotated, front facing +y.
   elevSymbol()  → elevation profile inside a projected box (u, z), drawn
                   in SVG space where Y = −z (floor at 0).
   Every function returns an SVG string; fills come from the item colour.
   ========================================================================= */

const INK = '#2E2520';

/**
 * What: darken / lighten a hex colour.
 * In:  hex ('#rrggbb'), amt (−1..1; negative darkens)
 * Out: hex string
 */
export function shade(hex, amt) {
  const n = parseInt(String(hex).replace('#', ''), 16) || 0xd6c6a8;
  // mix each channel toward black (amt<0) or white (amt>0)
  const mix = (c) => Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt);
  const r = mix((n >> 16) & 255), g = mix((n >> 8) & 255), b = mix(n & 255);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

/**
 * What: tiny SVG element helpers (rect, line, circle, path) as strings.
 * In:  geometry numbers + optional extra attribute string
 * Out: SVG string
 */
const f = (n) => Math.round(n * 100) / 100;
const R = (x, y, w, h, a = '', r = 0) => `<rect x="${f(x)}" y="${f(y)}" width="${f(Math.max(0, w))}" height="${f(Math.max(0, h))}"${r ? ` rx="${f(r)}"` : ''} ${a}/>`;
const L = (x1, y1, x2, y2, a = '') => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" ${a}/>`;
const C = (cx, cy, r, a = '') => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" ${a}/>`;
const P = (d, a = '') => `<path d="${d}" ${a}/>`;

/**
 * What: top-view symbol of an item.
 * In:  it (item), sw (main stroke width in cm)
 * Out: SVG string (centred, unrotated)
 */
export function planSymbol(it, sw) {
  const w = it.w, d = it.d, x = -w / 2, y = -d / 2;
  const col = it.color, dark = shade(col, -0.28), soft = shade(col, 0.25);
  // shared stroke attributes: main outline and thin detail lines
  const o = `fill="${col}" stroke="${INK}" stroke-width="${sw}"`;
  const t = `fill="none" stroke="${INK}" stroke-width="${sw * 0.5}" stroke-opacity=".75"`;
  const dash = `stroke-dasharray="${sw * 5} ${sw * 3}"`;
  switch (it.type) {
    case 'sofa': case 'sillon': {
      const back = d * 0.24, arm = Math.min(w * 0.12, 22), n = it.type === 'sofa' ? 3 : 1;
      let s = R(x, y, w, d, o, 6);
      // back band + arms, then seat cushions
      s += R(x + arm, y, w - 2 * arm, back, `fill="${dark}" fill-opacity=".35" stroke="${INK}" stroke-width="${sw * 0.5}"`);
      s += L(x + arm, y, x + arm, y + d, t) + L(x + w - arm, y, x + w - arm, y + d, t);
      for (let i = 1; i < n; i++) { const cx = x + arm + (w - 2 * arm) * i / n; s += L(cx, y + back, cx, y + d - 4, t); }
      return s;
    }
    case 'cama': {
      const hb = 7, pil = d * 0.14;
      let s = R(x, y, w, d, o, 4);
      // headboard, two pillows, folded duvet
      s += R(x, y, w, hb, `fill="${dark}" stroke="${INK}" stroke-width="${sw * 0.5}"`);
      s += R(x + w * 0.07, y + hb + 6, w * 0.38, pil, `fill="${soft}" ${t.replace('fill="none" ', '')}`, 6);
      s += R(x + w * 0.55, y + hb + 6, w * 0.38, pil, `fill="${soft}" ${t.replace('fill="none" ', '')}`, 6);
      s += L(x, y + d * 0.36, x + w, y + d * 0.36, t);
      s += P(`M${f(x + w)} ${f(y + d * 0.36)} L${f(x + w * 0.72)} ${f(y + d * 0.36)} L${f(x + w)} ${f(y + d * 0.52)} Z`, `fill="${soft}" ${t.replace('fill="none" ', '')}`);
      return s;
    }
    case 'mesa': case 'mesac': case 'escritorio':
      // table top with an inner bevel line
      return R(x, y, w, d, o, 3) + R(x + 5, y + 5, w - 10, d - 10, t, 2);
    case 'buro':
      return R(x, y, w, d, o, 2) + L(x + 3, y + d - 6, x + w - 3, y + d - 6, t);
    case 'silla':
      return R(x, y, w, d, o, 5) + R(x + 3, y + 2, w - 6, d * 0.16, `fill="${dark}" stroke="${INK}" stroke-width="${sw * 0.5}"`, 2);
    case 'tapete': {
      // rug: soft fill, inner border, fringe on the short ends
      let s = R(x, y, w, d, `fill="${col}" fill-opacity=".55" stroke="${INK}" stroke-width="${sw * 0.6}"`);
      s += R(x + 10, y + 10, w - 20, d - 20, `${t} ${dash}`);
      for (let i = 0; i <= d; i += 9) s += L(x - 5, y + i, x, y + i, t) + L(x + w, y + i, x + w + 5, y + i, t);
      return s;
    }
    case 'closet': {
      let s = R(x, y, w, d, o) + L(x, y + d - 4, x + w, y + d - 4, t);
      // hanging rod and door divisions
      s += L(x + 6, y + d * 0.48, x + w - 6, y + d * 0.48, `${t} ${dash}`);
      const doors = Math.max(2, Math.round(w / 60));
      for (let i = 1; i < doors; i++) s += L(x + w * i / doors, y + d - 4, x + w * i / doors, y + d, t);
      return s;
    }
    case 'isla':
      // counter top + overhang for stools (dashed)
      return R(x, y, w, d, o, 2) + R(x + 3, y + 3, w - 6, d * 0.72, t) + L(x, y + d * 0.75, x + w, y + d * 0.75, `${t} ${dash}`);
    case 'banco':
      return C(0, 0, Math.min(w, d) / 2, o) + C(0, 0, Math.min(w, d) * 0.32, t);
    case 'librero': case 'mueblet': {
      let s = R(x, y, w, d, o) + R(x + 3, y + 3, w - 6, d - 6, t);
      // vertical divisions every ~40-60 cm
      const n = Math.max(2, Math.round(w / (it.type === 'librero' ? 40 : 60)));
      for (let i = 1; i < n; i++) s += L(x + w * i / n, y + 3, x + w * i / n, y + d - 3, t);
      return s;
    }
    case 'planta': {
      const r = Math.min(w, d) / 2;
      let s = C(0, 0, r * 0.55, `fill="${shade('#B8643E', 0.1)}" stroke="${INK}" stroke-width="${sw * 0.6}"`);
      // leaves radiating from the pot
      for (let k = 0; k < 7; k++) {
        const a = k * 360 / 7 + 10;
        s += `<ellipse cx="0" cy="${f(-r * 0.55)}" rx="${f(r * 0.22)}" ry="${f(r * 0.48)}" transform="rotate(${a})" fill="${col}" fill-opacity=".85" stroke="${INK}" stroke-width="${sw * 0.45}"/>`;
      }
      return s + C(0, 0, r * 0.12, `fill="${dark}"`);
    }
    case 'repisa': case 'cuadro':
      // above the cut plane: dashed outline (architectural convention)
      return R(x, y, w, Math.max(d, 3), `fill="${col}" fill-opacity=".35" stroke="${INK}" stroke-width="${sw * 0.6}" ${dash}`);
    case 'lampara': {
      const r = Math.min(w, d) / 2;
      return C(0, 0, r, `fill="${col}" fill-opacity=".18" stroke="${INK}" stroke-width="${sw * 0.6}" ${dash}`)
        + L(-r * 0.6, 0, r * 0.6, 0, t) + L(0, -r * 0.6, 0, r * 0.6, t) + C(0, 0, r * 0.18, `fill="${col}" stroke="${INK}" stroke-width="${sw * 0.5}"`);
    }
    default:
      return R(x, y, w, d, o) + L(x, y, x + w, y + d, t) + L(x + w, y, x, y + d, t);
  }
}

/**
 * What: elevation profile of an item inside its projected box.
 * In:  it (item), p (projection from geometry.project), sw (stroke cm),
 *      roomH (cm, for pendant cables)
 * Out: SVG string in elevation space (X = u, Y = −z)
 */
export function elevSymbol(it, p, sw, roomH) {
  const u0 = p.u0, W = p.u1 - p.u0, Z0 = -p.z0, H = p.z1 - p.z0, top = -p.z1;
  const col = it.color, dark = shade(col, -0.3), soft = shade(col, 0.22);
  const o = `fill="${col}" stroke="${INK}" stroke-width="${sw}"`;
  const od = `fill="${dark}" stroke="${INK}" stroke-width="${sw}"`;
  const t = `fill="none" stroke="${INK}" stroke-width="${sw * 0.5}" stroke-opacity=".75"`;
  const leg = `fill="${INK}"`;
  // side profiles need to know which end is the item's back
  const backAt = (frac) => (p.backHigh ? u0 + W - W * frac : u0);
  const front = p.face === 'front';
  // seen from behind (front face points away from the viewer)
  const back = front && p.faceSign < -0.01;
  switch (it.type) {
    case 'sofa': case 'sillon': {
      const seat = H * 0.5, arm = H * 0.72;
      if (back) {
        // the back of the backrest hides the seat; arms show at the ends
        const a = Math.min(W * 0.12, 22);
        return R(u0, top, W, H - 6, o, 6) + L(u0 + a, top + 8, u0 + a, Z0 - 10, t) + L(u0 + W - a, top + 8, u0 + W - a, Z0 - 10, t)
          + R(u0 + 6, Z0 - 6, 4, 6, leg) + R(u0 + W - 10, Z0 - 6, 4, 6, leg);
      }
      if (front) {
        const a = Math.min(W * 0.12, 22);
        // legs, seat block, back cushions, arms
        let s = R(u0 + 6, Z0 - 6, 4, 6, leg) + R(u0 + W - 10, Z0 - 6, 4, 6, leg);
        s += R(u0 + a, top, W - 2 * a, H - seat + 4, `fill="${dark}" stroke="${INK}" stroke-width="${sw}"`, 6);
        s += R(u0, Z0 - seat, W, seat - 6, o, 4);
        s += R(u0, Z0 - arm, a, arm - 6, o, 5) + R(u0 + W - a, Z0 - arm, a, arm - 6, o, 5);
        const n = it.type === 'sofa' ? 3 : 1;
        for (let i = 1; i < n; i++) { const cx = u0 + a + (W - 2 * a) * i / n; s += L(cx, Z0 - seat, cx, Z0 - seat + 14, t); }
        return s;
      }
      const bw = W * 0.24;
      // side: back rising at the back end, arm silhouette in front
      let s = R(backAt(0.24), top, bw, H - 6, `fill="${dark}" stroke="${INK}" stroke-width="${sw}"`, 6);
      s += R(u0, Z0 - arm, W, arm - 6, o, 6) + L(u0 + 4, Z0 - seat, u0 + W - 4, Z0 - seat, t);
      return s + R(u0 + 6, Z0 - 6, 4, 6, leg) + R(u0 + W - 10, Z0 - 6, 4, 6, leg);
    }
    case 'cama': {
      const mat = 55, base = 25;
      if (back) return R(u0, top, W, H - 6, od, 3) + R(u0 + 4, Z0 - 8, 5, 8, leg) + R(u0 + W - 9, Z0 - 8, 5, 8, leg);
      if (front) {
        // headboard behind, mattress + base in front
        let s = R(u0, top, W, H - 6, od, 3);
        s += R(u0 + 2, Z0 - base, W - 4, base - 8, o) + R(u0, Z0 - mat, W, mat - base, `fill="${soft}" stroke="${INK}" stroke-width="${sw}"`, 6);
        return s + R(u0 + 4, Z0 - 8, 5, 8, leg) + R(u0 + W - 9, Z0 - 8, 5, 8, leg);
      }
      let s = R(backAt(0.04), top, Math.max(6, W * 0.04), H - 6, od, 2);
      s += R(u0, Z0 - base, W, base - 8, o) + R(u0, Z0 - mat, W, mat - base, `fill="${soft}" stroke="${INK}" stroke-width="${sw}"`, 6);
      return s + R(u0 + 4, Z0 - 8, 5, 8, leg) + R(u0 + W - 9, Z0 - 8, 5, 8, leg);
    }
    case 'mesa': case 'mesac': case 'escritorio': {
      const slab = 4, lw = Math.max(4, W * 0.03);
      // top slab on two visible legs
      return R(u0, top, W, slab, o, 1) + R(u0 + 5, top + slab, lw, H - slab, od) + R(u0 + W - 5 - lw, top + slab, lw, H - slab, od);
    }
    case 'buro':
      return R(u0, top, W, H - 8, o, 2) + L(u0 + 3, top + (H - 8) / 2, u0 + W - 3, top + (H - 8) / 2, t)
        + R(u0 + 3, Z0 - 8, 4, 8, leg) + R(u0 + W - 7, Z0 - 8, 4, 8, leg);
    case 'silla': {
      const seat = 46;
      if (front) {
        // backrest above the seat, legs to the floor
        return R(u0 + 3, top, W - 6, H - seat - 4, `fill="${dark}" stroke="${INK}" stroke-width="${sw}"`, 4)
          + R(u0, Z0 - seat, W, 5, o, 2) + R(u0 + 2, Z0 - seat + 5, 3, seat - 5, leg) + R(u0 + W - 5, Z0 - seat + 5, 3, seat - 5, leg);
      }
      return R(backAt(0.1), top, Math.max(4, W * 0.1), H, od, 2) + R(u0, Z0 - seat, W, 5, o, 2)
        + R(u0 + 2, Z0 - seat + 5, 3, seat - 5, leg) + R(u0 + W - 5, Z0 - seat + 5, 3, seat - 5, leg);
    }
    case 'closet': {
      let s = R(u0, top, W, H, o);
      if (front && !back) {
        // doors with handles
        const doors = Math.max(2, Math.round(W / 60));
        for (let i = 1; i < doors; i++) s += L(u0 + W * i / doors, top, u0 + W * i / doors, Z0, t);
        for (let i = 0; i < doors; i++) { const hx = u0 + W * (i + (i % 2 ? 0.12 : 0.88)) / doors; s += L(hx, top + H * 0.42, hx, top + H * 0.56, `stroke="${INK}" stroke-width="${sw * 1.4}"`); }
      }
      return s + L(u0, Z0 - 8, u0 + W, Z0 - 8, t);
    }
    case 'isla':
      // body, recessed plinth, thicker counter on top
      return R(u0 + 2, top + 4, W - 4, H - 4, o) + R(u0 - 2, top, W + 4, 4, od) + L(u0 + 2, Z0 - 10, u0 + W - 2, Z0 - 10, t)
        + (front ? L(u0 + W / 2, top + 4, u0 + W / 2, Z0 - 10, t) : '');
    case 'banco':
      return R(u0, top, W, 5, o, 2) + P(`M${f(u0 + 6)} ${f(top + 5)} L${f(u0 + 2)} ${f(Z0)} M${f(u0 + W - 6)} ${f(top + 5)} L${f(u0 + W - 2)} ${f(Z0)}`, `stroke="${INK}" stroke-width="${sw * 1.6}" fill="none"`)
        + L(u0 + 4, Z0 - 25, u0 + W - 4, Z0 - 25, `stroke="${INK}" stroke-width="${sw}"`);
    case 'librero': {
      let s = R(u0, top, W, H, o);
      if (front && !back) {
        // shelves every ~38 cm
        for (let zz = 38; zz < H - 10; zz += 38) s += L(u0 + 3, Z0 - zz, u0 + W - 3, Z0 - zz, t);
        s += L(u0 + 3, top, u0 + 3, Z0, t) + L(u0 + W - 3, top, u0 + W - 3, Z0, t);
      }
      return s;
    }
    case 'mueblet': {
      let s = R(u0, top, W, H - 10, o, 2) + R(u0 + 6, Z0 - 10, 4, 10, leg) + R(u0 + W - 10, Z0 - 10, 4, 10, leg);
      if (front && !back) { const n = Math.max(2, Math.round(W / 60)); for (let i = 1; i < n; i++) s += L(u0 + W * i / n, top + 3, u0 + W * i / n, Z0 - 13, t); }
      return s;
    }
    case 'planta': {
      const pot = Math.min(H * 0.3, 45), cx = u0 + W / 2;
      // terracotta pot + layered foliage
      let s = P(`M${f(cx - W * 0.3)} ${f(Z0 - pot)} L${f(cx + W * 0.3)} ${f(Z0 - pot)} L${f(cx + W * 0.22)} ${f(Z0)} L${f(cx - W * 0.22)} ${f(Z0)} Z`, `fill="#C27A55" stroke="${INK}" stroke-width="${sw}"`);
      const fh = H - pot;
      const leaves = [[0, 0.62, 0.32, 0.4], [-0.28, 0.42, 0.26, 0.32], [0.28, 0.45, 0.26, 0.3], [-0.14, 0.82, 0.22, 0.24], [0.16, 0.8, 0.2, 0.22]];
      leaves.forEach(([dx, dy, rx, ry]) => { s += `<ellipse cx="${f(cx + dx * W)}" cy="${f(Z0 - pot - fh * dy + fh * 0.1)}" rx="${f(rx * W)}" ry="${f(ry * fh)}" fill="${col}" fill-opacity=".9" stroke="${INK}" stroke-width="${sw * 0.6}"/>`; });
      return s + L(cx, Z0 - pot, cx, Z0 - pot - fh * 0.4, t);
    }
    case 'tapete':
      return R(u0, Z0 - Math.max(2, H), W, Math.max(2, H), `fill="${col}" stroke="${INK}" stroke-width="${sw * 0.6}"`);
    case 'repisa':
      return R(u0, top, W, Math.max(H, 3), o, 1) + (front ? '' : L(backAt(0), top + H, backAt(0), top + H + 10, t));
    case 'cuadro':
      return front ? R(u0, top, W, H, od) + R(u0 + 5, top + 5, W - 10, H - 10, `fill="${soft}" stroke="${INK}" stroke-width="${sw * 0.5}"`)
        + R(u0 + 14, top + 14, W - 28, H - 28, `fill="${col}" fill-opacity=".65"`) : R(u0, top, Math.max(W, 3), H, od);
    case 'lampara': {
      const cx = u0 + W / 2;
      // cable from the ceiling, dome shade
      return L(cx, -roomH, cx, top, `stroke="${INK}" stroke-width="${sw * 0.6}"`)
        + P(`M${f(u0)} ${f(Z0)} Q${f(u0 + W * 0.05)} ${f(top)} ${f(cx)} ${f(top)} Q${f(u0 + W * 0.95)} ${f(top)} ${f(u0 + W)} ${f(Z0)} Z`, o)
        + L(u0 - 2, Z0, u0 + W + 2, Z0, `stroke="${INK}" stroke-width="${sw}"`);
    }
    default:
      return R(u0, top, W, H, o) + L(u0, top, u0 + W, Z0, t) + L(u0 + W, top, u0, Z0, t);
  }
}
