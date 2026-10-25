/* =========================================================================
   materials.js — procedural (code-generated) textures for the 3D room.
   Every texture is drawn on a 2D canvas at runtime: no image files, no AI.
   Palette taken from Jorge Santana's own projects (oak, walnut, travertine,
   microcement, chukum, black marble, sage lacquer, linen, bouclé).
   ========================================================================= */
import * as THREE from 'three';

/* -------------------------------------------------------------------------
   rng
   What: tiny seeded pseudo-random generator (mulberry32) so textures are
         identical on every load.
   In:   seed (number)
   Out:  function returning a float in [0,1)
   ------------------------------------------------------------------------- */
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* -------------------------------------------------------------------------
   makeCanvas
   What: create an offscreen canvas and its 2D context.
   In:   w, h (pixels)
   Out:  { c: HTMLCanvasElement, g: CanvasRenderingContext2D }
   ------------------------------------------------------------------------- */
function makeCanvas(w, h = w) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return { c, g: c.getContext('2d') };
}

/* -------------------------------------------------------------------------
   noiseLayer
   What: fractal "value noise" made by up-scaling small random grids with
         smoothing (cheap and fast, no per-pixel maths in JS).
   In:   size (px), seed, octaves, startCells (grid cells of the first octave),
         stretchX/stretchY (anisotropy, e.g. for wood or stone banding)
   Out:  canvas with greyscale noise
   ------------------------------------------------------------------------- */
function noiseLayer(size, seed, octaves = 5, startCells = 4, stretchX = 1, stretchY = 1) {
  const r = rng(seed);
  const { c, g } = makeCanvas(size);
  g.fillStyle = '#808080';
  g.fillRect(0, 0, size, size);
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  // each octave doubles the cell count and halves the contribution
  for (let o = 0; o < octaves; o++) {
    const cellsX = Math.max(1, Math.round(startCells * Math.pow(2, o) / stretchX));
    const cellsY = Math.max(1, Math.round(startCells * Math.pow(2, o) / stretchY));
    const small = makeCanvas(cellsX, cellsY);
    const img = small.g.createImageData(cellsX, cellsY);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.floor(r() * 255);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    small.g.putImageData(img, 0, 0);
    // blend the up-scaled grid on top with decreasing weight
    g.globalAlpha = 0.55 / (o + 1);
    g.drawImage(small.c, 0, 0, size, size);
  }
  g.globalAlpha = 1;
  return c;
}

/* -------------------------------------------------------------------------
   tint
   What: paint a noise canvas over a base colour using a blend mode.
   In:   g (context), noise (canvas), mode (composite op), alpha
   Out:  nothing (draws in place)
   ------------------------------------------------------------------------- */
function tint(g, noise, mode = 'overlay', alpha = 0.5) {
  g.save();
  g.globalCompositeOperation = mode;
  g.globalAlpha = alpha;
  g.drawImage(noise, 0, 0, g.canvas.width, g.canvas.height);
  g.restore();
}

/* -------------------------------------------------------------------------
   woodGrain
   What: draw wavy wood-grain strokes into a rectangle (one board/plank).
   In:   g, x, y, w, h (rect), base (css colour), r (rng), vertical (bool)
   Out:  nothing
   ------------------------------------------------------------------------- */
function woodGrain(g, x, y, w, h, base, r, vertical = false) {
  g.save();
  g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.fillStyle = base; g.fillRect(x, y, w, h);
  const lines = Math.floor((vertical ? w : h) / 2.2);
  const phase = r() * 100;
  // fine grain lines: darker and lighter alternating, low alpha
  for (let i = 0; i < lines; i++) {
    const t = i / lines;
    g.strokeStyle = r() > 0.5 ? 'rgba(40,22,10,0.10)' : 'rgba(255,240,220,0.06)';
    g.lineWidth = 0.6 + r() * 1.6;
    g.beginPath();
    const steps = 24;
    for (let s = 0; s <= steps; s++) {
      const u = s / steps;
      const wob = Math.sin(u * 6.0 + phase + t * 9.0) * 3.0 + Math.sin(u * 17.0 + t * 30.0) * 1.2;
      const px = vertical ? x + t * w + wob : x + u * w;
      const py = vertical ? y + u * h : y + t * h + wob;
      if (s === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.stroke();
  }
  // occasional knot / cathedral figure
  if (r() > 0.55) {
    const kx = x + w * (0.2 + r() * 0.6), ky = y + h * (0.2 + r() * 0.6);
    for (let k = 1; k < 9; k++) {
      g.strokeStyle = 'rgba(50,28,12,0.08)';
      g.lineWidth = 1.2;
      g.beginPath();
      g.ellipse(kx, ky, (vertical ? 3 : 14) * k, (vertical ? 14 : 3) * k, 0, 0, Math.PI * 2);
      g.stroke();
    }
  }
  g.restore();
}

/* -------------------------------------------------------------------------
   planks
   What: a plank floor (or slat face) texture: boards with colour variation,
         grain and thin dark joints.
   In:   size, colours (array of css colours), rows, seed, vertical
   Out:  canvas
   ------------------------------------------------------------------------- */
function planks(size, colours, rows, seed, vertical = false) {
  const r = rng(seed);
  const { c, g } = makeCanvas(size);
  const bandH = size / rows;
  // each row is split into long planks with staggered joints; every plank is
  // drawn twice (at x and x - size) so the texture wraps without a seam
  for (let row = 0; row < rows; row++) {
    const start = r() * size;
    let pos = start;
    while (pos < start + size) {
      const len = Math.min(size * (0.55 + r() * 0.6), start + size - pos);
      const col = colours[Math.floor(r() * colours.length)];
      const grainSeed = Math.floor(r() * 1e6);
      for (const shift of [0, -size]) {
        const p = pos + shift;
        const rr = rng(grainSeed);
        if (vertical) woodGrain(g, row * bandH, p, bandH, len, col, rr, true);
        else woodGrain(g, p, row * bandH, len, bandH, col, rr, false);
        // end joint of this plank
        g.fillStyle = 'rgba(20,12,6,0.5)';
        if (vertical) g.fillRect(row * bandH, p + len - 1, bandH, 1.5);
        else g.fillRect(p + len - 1, row * bandH, 1.5, bandH);
      }
      pos += len;
    }
    // long joint between rows
    g.fillStyle = 'rgba(20,12,6,0.55)';
    if (vertical) g.fillRect(row * bandH, 0, 1.5, size); else g.fillRect(0, row * bandH, size, 1.5);
  }
  tint(g, noiseLayer(size, seed + 7, 5, 6), 'soft-light', 0.4);
  return c;
}

/* -------------------------------------------------------------------------
   stone
   What: banded stone (travertine) with pores, optionally cut into tiles.
   In:   size, base, band (css colour of veins), seed, tiles (0 = slab)
   Out:  canvas
   ------------------------------------------------------------------------- */
function stone(size, base, band, seed, tiles = 0) {
  const r = rng(seed);
  const { c, g } = makeCanvas(size);
  g.fillStyle = base; g.fillRect(0, 0, size, size);
  // horizontal banding typical of travertine (stretched noise)
  tint(g, noiseLayer(size, seed, 6, 3, 0.15, 3.0), 'multiply', 0.35);
  for (let i = 0; i < 70; i++) {
    const y = r() * size;
    g.strokeStyle = band; g.globalAlpha = 0.05 + r() * 0.12; g.lineWidth = 1 + r() * 5;
    g.beginPath(); g.moveTo(0, y);
    for (let x = 0; x <= size; x += size / 16) g.lineTo(x, y + Math.sin(x * 0.01 + i) * 4 + (r() - 0.5) * 3);
    g.stroke();
  }
  g.globalAlpha = 1;
  // pores: tiny elongated darker holes
  for (let i = 0; i < size * 1.4; i++) {
    g.fillStyle = `rgba(90,70,50,${0.12 + r() * 0.25})`;
    g.beginPath();
    g.ellipse(r() * size, r() * size, 0.6 + r() * 3.2, 0.4 + r() * 1.0, 0, 0, Math.PI * 2);
    g.fill();
  }
  // optional tile joints
  if (tiles) {
    g.fillStyle = 'rgba(120,105,90,0.55)';
    for (let k = 1; k < tiles; k++) {
      g.fillRect(0, (k * size) / tiles - 1, size, 2);
      g.fillRect((k * size) / tiles - 1, 0, 2, size);
    }
  }
  return c;
}

/* -------------------------------------------------------------------------
   veinedMarble
   What: dark marble with soft white veins drawn as random walks.
   In:   size, base, vein, seed
   Out:  canvas
   ------------------------------------------------------------------------- */
function veinedMarble(size, base, vein, seed) {
  const r = rng(seed);
  const { c, g } = makeCanvas(size);
  g.fillStyle = base; g.fillRect(0, 0, size, size);
  tint(g, noiseLayer(size, seed, 6, 3), 'overlay', 0.35);
  // three passes: wide blurred glow, mid vein, fine crisp vein
  [[6, 0.06, 'blur(4px)'], [2, 0.22, 'blur(1px)'], [0.7, 0.55, 'none']].forEach(([w, a, f]) => {
    const rr = rng(seed + 3);
    g.filter = f; g.strokeStyle = vein; g.globalAlpha = a; g.lineWidth = w;
    for (let v = 0; v < 9; v++) {
      let x = rr() * size, y = rr() * size, ang = rr() * Math.PI * 2;
      g.beginPath(); g.moveTo(x, y);
      for (let s = 0; s < 90; s++) {
        ang += (rr() - 0.5) * 0.6; x += Math.cos(ang) * 9; y += Math.sin(ang) * 9;
        g.lineTo(x, y);
      }
      g.stroke();
    }
  });
  g.filter = 'none'; g.globalAlpha = 1;
  void r;
  return c;
}

/* -------------------------------------------------------------------------
   plaster
   What: matte plaster / microcement / chukum: base colour with cloudy noise
         and fine speckles.
   In:   size, base, seed, cloud (0..1 strength), speck (0..1 density)
   Out:  canvas
   ------------------------------------------------------------------------- */
function plaster(size, base, seed, cloud = 0.35, speck = 0.3) {
  const r = rng(seed);
  const { c, g } = makeCanvas(size);
  g.fillStyle = base; g.fillRect(0, 0, size, size);
  tint(g, noiseLayer(size, seed, 6, 2), 'soft-light', cloud);
  tint(g, noiseLayer(size, seed + 11, 3, 24), 'overlay', cloud * 0.4);
  // speckles (chukum and microcement have visible aggregate)
  const n = Math.floor(size * size * 0.002 * speck);
  for (let i = 0; i < n; i++) {
    g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.18)' : 'rgba(60,45,30,0.16)';
    g.fillRect(r() * size, r() * size, 1 + r(), 1 + r());
  }
  return c;
}

/* -------------------------------------------------------------------------
   fabric
   What: woven upholstery (linen / bouclé / velvet) — base colour, weave
         lines and fibre noise.
   In:   size, base, seed, loops (true = bouclé texture)
   Out:  canvas
   ------------------------------------------------------------------------- */
function fabric(size, base, seed, loops = false) {
  const r = rng(seed);
  const { c, g } = makeCanvas(size);
  g.fillStyle = base; g.fillRect(0, 0, size, size);
  // weave: alternating faint warp and weft lines
  for (let i = 0; i < size; i += 3) {
    g.fillStyle = `rgba(0,0,0,${0.03 + r() * 0.04})`; g.fillRect(0, i, size, 1);
    g.fillStyle = `rgba(255,255,255,${0.02 + r() * 0.04})`; g.fillRect(i, 0, 1, size);
  }
  // bouclé: little loops all over
  if (loops) {
    for (let i = 0; i < size * 6; i++) {
      g.strokeStyle = r() > 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';
      g.lineWidth = 1; g.beginPath();
      g.arc(r() * size, r() * size, 1 + r() * 2.2, 0, Math.PI * 2); g.stroke();
    }
  }
  tint(g, noiseLayer(size, seed, 4, 8), 'soft-light', 0.35);
  return c;
}

/* -------------------------------------------------------------------------
   toTexture
   What: wrap a canvas as a repeating, colour-correct three.js texture.
   In:   canvas, repeatX, repeatY, renderer (for anisotropy), isColour
   Out:  THREE.CanvasTexture
   ------------------------------------------------------------------------- */
export function toTexture(canvas, rx = 1, ry = 1, renderer = null, isColour = true) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  if (isColour) t.colorSpace = THREE.SRGBColorSpace;
  if (renderer) t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}

/* -------------------------------------------------------------------------
   roughFrom
   What: build a greyscale roughness map from a noise seed (adds subtle
         sheen variation so surfaces do not look like plastic).
   In:   size, seed, min (0..255 darkest), max (brightest)
   Out:  canvas
   ------------------------------------------------------------------------- */
function roughFrom(size, seed, min = 150, max = 235) {
  const { c, g } = makeCanvas(size);
  g.fillStyle = `rgb(${(min + max) / 2},${(min + max) / 2},${(min + max) / 2})`;
  g.fillRect(0, 0, size, size);
  tint(g, noiseLayer(size, seed, 5, 4), 'overlay', 0.6);
  return c;
}

/* -------------------------------------------------------------------------
   FINISHES — the catalogue shown in the configurator.
   Each entry knows how to draw itself (lazy, cached) and its PBR values.
   ------------------------------------------------------------------------- */
export const FINISHES = {
  floor: [
    { id: 'roble', es: 'Roble natural', en: 'Natural oak', draw: (s) => planks(s, ['#C9A57F', '#C49F78', '#CDAA84', '#C29C74'], 6, 11), rough: 0.62, rep: [6, 6] },
    { id: 'nogal', es: 'Nogal', en: 'Walnut', draw: (s) => planks(s, ['#6E4B33', '#684631', '#73503A', '#6A4830'], 6, 21), rough: 0.55, rep: [6, 6] },
    { id: 'travertino', es: 'Travertino', en: 'Travertine', draw: (s) => stone(s, '#DCCDB6', '#B9A27F', 31, 2), rough: 0.5, rep: [6, 6] },
    { id: 'microcemento', es: 'Microcemento', en: 'Microcement', draw: (s) => plaster(s, '#B9B2A8', 41, 0.5, 0.6), rough: 0.7, rep: [3, 3] },
    { id: 'marmol', es: 'Mármol negro', en: 'Black marble', draw: (s) => veinedMarble(s, '#1E1C1B', '#E9E4DC', 51), rough: 0.18, rep: [3, 3] },
  ],
  walls: [
    { id: 'yeso', es: 'Yeso cálido', en: 'Warm plaster', draw: (s) => plaster(s, '#E4D4BE', 61, 0.22, 0.1), rough: 0.92, rep: [2, 1] },
    { id: 'chukum', es: 'Chukum', en: 'Chukum', draw: (s) => plaster(s, '#D8C2A4', 71, 0.45, 0.9), rough: 0.9, rep: [2, 1] },
    { id: 'salvia', es: 'Verde salvia', en: 'Sage green', draw: (s) => plaster(s, '#9AA591', 81, 0.25, 0.15), rough: 0.88, rep: [2, 1] },
    { id: 'arcilla', es: 'Arcilla', en: 'Clay', draw: (s) => plaster(s, '#C59C7E', 91, 0.3, 0.3), rough: 0.9, rep: [2, 1] },
  ],
  fabric: [
    { id: 'lino', es: 'Lino hueso', en: 'Bone linen', draw: (s) => fabric(s, '#E6DED1', 101), rough: 0.95, rep: [2, 2] },
    { id: 'boucle', es: 'Bouclé arena', en: 'Sand bouclé', draw: (s) => fabric(s, '#D6C7B0', 111, true), rough: 1.0, rep: [3, 3] },
    { id: 'olivo', es: 'Terciopelo olivo', en: 'Olive velvet', draw: (s) => fabric(s, '#6E7458', 121), rough: 0.75, rep: [2, 2] },
    { id: 'cognac', es: 'Piel cognac', en: 'Cognac leather', draw: (s) => plaster(s, '#8A5A3A', 131, 0.25, 0.05), rough: 0.5, rep: [1.5, 1.5] },
  ],
};

/* Fixed (non-configurable) surfaces used around the room */
export const FIXED = {
  walnutSlat: () => planks(512, ['#6A4831', '#5C3E2A', '#71503A'], 4, 141, true),
  oakSlat: () => planks(512, ['#C9A57F', '#BE9A73'], 4, 151, true),
  travertineSlab: () => stone(512, '#DED0BA', '#BDA584', 161, 0),
  terracotta: () => plaster(256, '#B4683F', 171, 0.35, 0.4),
  rug: () => fabric(512, '#D9CFBF', 181, true),
  rough: (seed) => roughFrom(256, seed),
};

const cache = new Map();

/* -------------------------------------------------------------------------
   finishCanvas
   What: draw (once) and cache the canvas for a finish at a given size.
   In:   group ('floor' | 'walls' | 'fabric'), id, size
   Out:  canvas
   ------------------------------------------------------------------------- */
export function finishCanvas(group, id, size = 1024) {
  const key = `${group}:${id}:${size}`;
  if (!cache.has(key)) {
    const f = FINISHES[group].find((x) => x.id === id);
    cache.set(key, f.draw(size));
  }
  return cache.get(key);
}

/* -------------------------------------------------------------------------
   swatchDataURL
   What: a small PNG data-URL of a finish for the round UI swatches.
   In:   group, id
   Out:  string (data URL)
   ------------------------------------------------------------------------- */
export function swatchDataURL(group, id) {
  const src = finishCanvas(group, id, group === 'floor' ? 512 : 256);
  const { c, g } = makeCanvas(96);
  // crop the centre so planks/tiles read clearly at small size
  g.drawImage(src, src.width * 0.3, src.height * 0.3, src.width * 0.4, src.height * 0.4, 0, 0, 96, 96);
  return c.toDataURL('image/png');
}
