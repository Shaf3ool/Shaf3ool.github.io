/* =========================================================================
   textures.js — procedural material textures drawn on <canvas>
   One canvas per finish, reused by: the 2D plan (as SVG pattern image),
   the 3D room (THREE.CanvasTexture) and the swatch chips (CSS background).
   No image files, no AI: everything is drawn by code from a seeded RNG.
   ========================================================================= */

const cache = new Map();

/**
 * What: small deterministic pseudo-random generator (mulberry32).
 * In:  seed (int)
 * Out: function () => float in [0,1)
 */
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * What: speckle a canvas with soft noise dots (plaster / stone pores).
 * In:  ctx, size, rand, count, alpha, colours[]
 * Out: —
 */
function speckle(ctx, size, rand, count, alpha, colours) {
  for (let i = 0; i < count; i++) {
    ctx.globalAlpha = alpha * rand();
    ctx.fillStyle = colours[(rand() * colours.length) | 0];
    const r = rand() * 2.2 + 0.4;
    ctx.beginPath(); ctx.arc(rand() * size, rand() * size, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/**
 * What: soft cloudy blotches for trowelled finishes (microcement, chukum).
 * In:  ctx, size, rand, count, colours[], alpha
 * Out: —
 */
function clouds(ctx, size, rand, count, colours, alpha) {
  for (let i = 0; i < count; i++) {
    const x = rand() * size, y = rand() * size, r = 30 + rand() * 120;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const c = colours[(rand() * colours.length) | 0];
    // fade to the SAME colour at alpha 0 (fading to transparent black darkens)
    g.addColorStop(0, c); g.addColorStop(1, c + '00');
    ctx.globalAlpha = alpha * (0.4 + rand() * 0.6);
    ctx.fillStyle = g;
    // draw wrapped copies so the texture tiles seamlessly
    for (const dx of [-size, 0, size]) for (const dy of [-size, 0, size]) {
      ctx.fillRect(x - r + dx, y - r + dy, r * 2, r * 2);
    }
  }
  ctx.globalAlpha = 1;
}

/**
 * What: wooden planks with grain lines (oak / walnut).
 * In:  ctx, size, rand, base, light, dark
 * Out: —
 */
function planks(ctx, size, rand, base, light, dark) {
  const rows = 6, h = size / rows;
  for (let r = 0; r < rows; r++) {
    // each row is split into 2 boards with a staggered joint
    const off = rand() * size;
    for (let k = -1; k < 2; k++) {
      const x0 = off + k * size * 0.75, len = size * 0.75;
      ctx.fillStyle = base;
      ctx.globalAlpha = 1;
      ctx.fillRect(x0, r * h, len, h);
      ctx.globalAlpha = 0.18 + rand() * 0.18;
      ctx.fillStyle = rand() > 0.5 ? light : dark;
      ctx.fillRect(x0, r * h, len, h);
      // grain: long thin wavy strokes
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = dark; ctx.lineWidth = 0.8;
      for (let g = 0; g < 9; g++) {
        const y = r * h + rand() * h;
        ctx.beginPath(); ctx.moveTo(x0, y);
        for (let s = 1; s <= 8; s++) ctx.lineTo(x0 + (len * s) / 8, y + (rand() - 0.5) * 3);
        ctx.stroke();
      }
      // board end joint
      ctx.globalAlpha = 0.45; ctx.fillStyle = dark; ctx.fillRect(x0, r * h, 1.5, h);
    }
    // long joint between rows
    ctx.globalAlpha = 0.5; ctx.fillStyle = dark; ctx.fillRect(0, r * h, size, 1.5);
  }
  ctx.globalAlpha = 1;
}

/**
 * What: draw the texture for one finish into a fresh canvas.
 * In:  key (finish key), size (px, power of two)
 * Out: HTMLCanvasElement
 */
function draw(key, size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const rand = rng(key.length * 9973 + key.charCodeAt(0) * 31);
  // --- each finish ---------------------------------------------------------
  if (key === 'roble') {
    ctx.fillStyle = '#C9A57C'; ctx.fillRect(0, 0, size, size);
    planks(ctx, size, rand, '#C9A57C', '#DDBE96', '#8E6B47');
  } else if (key === 'nogal') {
    ctx.fillStyle = '#6E4B34'; ctx.fillRect(0, 0, size, size);
    planks(ctx, size, rand, '#6E4B34', '#8A6247', '#3E281B');
  } else if (key === 'travertino') {
    ctx.fillStyle = '#E2D3BC'; ctx.fillRect(0, 0, size, size);
    // horizontal banding typical of travertine
    for (let i = 0; i < 40; i++) {
      ctx.globalAlpha = 0.08 + rand() * 0.12;
      ctx.fillStyle = rand() > 0.5 ? '#CDB99A' : '#EFE4D2';
      ctx.fillRect(0, rand() * size, size, 1 + rand() * 6);
    }
    speckle(ctx, size, rand, 900, 0.35, ['#B9A281', '#A88F6C']);
    // large-format tile joints (2 x 2 per texture)
    ctx.globalAlpha = 0.35; ctx.fillStyle = '#BCA88A';
    ctx.fillRect(0, 0, size, 2); ctx.fillRect(0, size / 2, size, 2);
    ctx.fillRect(0, 0, 2, size); ctx.fillRect(size / 2, 0, 2, size);
  } else if (key === 'microcemento') {
    ctx.fillStyle = '#CEC6BB'; ctx.fillRect(0, 0, size, size);
    clouds(ctx, size, rand, 60, ['#BDB4A8', '#DDD6CC', '#C7BEB2'], 0.5);
    speckle(ctx, size, rand, 1400, 0.18, ['#A99F92', '#E8E2DA']);
  } else if (key === 'chukum') {
    ctx.fillStyle = '#DCC9AE'; ctx.fillRect(0, 0, size, size);
    clouds(ctx, size, rand, 70, ['#CDB797', '#EADBC4', '#D4BD9C'], 0.55);
    // trowel arcs
    ctx.strokeStyle = '#C4AB88'; ctx.lineWidth = 1;
    for (let i = 0; i < 60; i++) {
      ctx.globalAlpha = 0.12;
      ctx.beginPath(); ctx.arc(rand() * size, rand() * size, 20 + rand() * 50, rand() * 6, rand() * 6 + 1.2); ctx.stroke();
    }
    speckle(ctx, size, rand, 900, 0.2, ['#B39C79', '#F1E6D4']);
  } else if (key === 'terracota') {
    // handmade square tiles with per-tile tone variation + grout
    const n = 4, s = size / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const tones = ['#B8643E', '#AE5A36', '#C27046', '#A9552F', '#BE6A41'];
      ctx.globalAlpha = 1;
      ctx.fillStyle = tones[(rand() * tones.length) | 0];
      ctx.fillRect(x * s, y * s, s, s);
      ctx.globalAlpha = 0.15; ctx.fillStyle = '#E39A6F';
      ctx.fillRect(x * s + s * 0.1, y * s + s * 0.1, s * 0.5, s * 0.35);
    }
    speckle(ctx, size, rand, 700, 0.25, ['#8E4426', '#D8875E']);
    ctx.globalAlpha = 1; ctx.fillStyle = '#E7D6C0';
    for (let i = 0; i <= n; i++) { ctx.fillRect(i * s - 2, 0, 4, size); ctx.fillRect(0, i * s - 2, size, 4); }
  }
  ctx.globalAlpha = 1;
  return c;
}

/**
 * What: get (cached) canvas for a finish.
 * In:  key (finish key), size (default 512)
 * Out: HTMLCanvasElement
 */
export function finishCanvas(key, size = 512) {
  const k = key + '@' + size;
  if (!cache.has(k)) {
    // always draw at full detail, then downscale (keeps the grain density right)
    const full = cache.get(key + '@512') || draw(key, 512);
    cache.set(key + '@512', full);
    if (size === 512) return full;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    c.getContext('2d').drawImage(full, 0, 0, size, size);
    cache.set(k, c);
  }
  return cache.get(k);
}

/**
 * What: get a data URL for a finish (for SVG patterns and CSS swatches).
 * In:  key (finish key), size (default 256)
 * Out: string data URL (webp/png)
 */
const urls = new Map();
export function finishURL(key, size = 256) {
  const k = key + '@' + size;
  if (!urls.has(k)) urls.set(k, finishCanvas(key, size).toDataURL('image/png'));
  return urls.get(k);
}

/**
 * What: real-world size one texture tile represents (cm), per finish.
 * In:  key (finish key)
 * Out: number (cm)
 */
export function tileSizeCm(key) {
  return { roble: 150, nogal: 150, travertino: 240, microcemento: 260, chukum: 260, terracota: 120 }[key] || 200;
}
