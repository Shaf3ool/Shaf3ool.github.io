/* =========================================================================
   textures.js — procedural material textures drawn on <canvas>
   One canvas per finish, used as the swatch image of material cards and
   of the detail sheet (CSS background from a data URL).
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
 * In:  ctx, size, rand, base, light, dark, rows (boards per tile)
 * Out: —
 */
function planks(ctx, size, rand, base, light, dark, rows = 9) {
  const h = size / rows;
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
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = dark; ctx.lineWidth = 0.7;
      for (let g = 0; g < 14; g++) {
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
    for (let i = 0; i < 70; i++) {
      ctx.globalAlpha = 0.12 + rand() * 0.2;
      ctx.fillStyle = rand() > 0.5 ? '#C4AD8B' : '#F0E6D5';
      ctx.fillRect(0, rand() * size, size, 1 + rand() * 7);
    }
    // travertine pores: small elongated dark holes
    for (let i = 0; i < 160; i++) {
      ctx.globalAlpha = 0.25 + rand() * 0.3; ctx.fillStyle = '#9C8565';
      ctx.beginPath(); ctx.ellipse(rand() * size, rand() * size, 1 + rand() * 4, 0.6 + rand() * 1.2, 0, 0, Math.PI * 2); ctx.fill();
    }
    speckle(ctx, size, rand, 900, 0.35, ['#B9A281', '#A88F6C']);
    // large-format tile joints (2 x 2 per texture)
    ctx.globalAlpha = 0.35; ctx.fillStyle = '#BCA88A';
    ctx.fillRect(0, 0, size, 2); ctx.fillRect(0, size / 2, size, 2);
    ctx.fillRect(0, 0, 2, size); ctx.fillRect(size / 2, 0, 2, size);
  } else if (key === 'microcemento') {
    ctx.fillStyle = '#CEC6BB'; ctx.fillRect(0, 0, size, size);
    clouds(ctx, size, rand, 70, ['#B3AA9D', '#E0DAD1', '#C2B8AB', '#A99F92'], 0.75);
    speckle(ctx, size, rand, 1400, 0.18, ['#A99F92', '#E8E2DA']);
  } else if (key === 'chukum') {
    ctx.fillStyle = '#DCC9AE'; ctx.fillRect(0, 0, size, size);
    clouds(ctx, size, rand, 80, ['#C8AF8C', '#EADBC4', '#D0B793', '#BFA27C'], 0.7);
    // trowel arcs
    ctx.strokeStyle = '#C4AB88'; ctx.lineWidth = 1;
    for (let i = 0; i < 60; i++) {
      ctx.globalAlpha = 0.2; ctx.lineWidth = 1 + rand();
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
  } else if (key === 'porcelanato') {
    // large-format porcelain: quiet grey-beige with 2 x 2 fine joints
    ctx.fillStyle = '#D2C9BC'; ctx.fillRect(0, 0, size, size);
    clouds(ctx, size, rand, 40, ['#C9C1B5', '#E3DED6'], 0.5);
    speckle(ctx, size, rand, 500, 0.12, ['#B7AFA3', '#EEEAE4']);
    ctx.globalAlpha = 0.8; ctx.fillStyle = '#B2A89A';
    ctx.fillRect(0, size / 2 - 1.5, size, 3); ctx.fillRect(size / 2 - 1.5, 0, 3, size);
    ctx.globalAlpha = 0.5; ctx.fillStyle = '#EEE9E1';
    ctx.fillRect(0, size / 2 + 1.5, size, 1); ctx.fillRect(size / 2 + 1.5, 0, 1, size);
  } else if (key === 'piedra') {
    // dark honed stone (black accents of his bathrooms)
    ctx.fillStyle = '#34302C'; ctx.fillRect(0, 0, size, size);
    clouds(ctx, size, rand, 50, ['#2A2623', '#433D38', '#3A3531'], 0.6);
    speckle(ctx, size, rand, 1600, 0.25, ['#5C554F', '#1F1C1A']);
  } else if (key === 'cal') {
    // warm lime paint: soft brushed clouds
    ctx.fillStyle = '#EDE3D3'; ctx.fillRect(0, 0, size, size);
    clouds(ctx, size, rand, 90, ['#DCCCB4', '#F5EDE1', '#E3D3BC', '#D3C1A6'], 0.7);
    speckle(ctx, size, rand, 500, 0.1, ['#D2C3AC', '#FBF6EE']);
  } else if (key === 'cuarzo') {
    // white quartz / marble-look with thin grey veins
    ctx.fillStyle = '#F1EEE9'; ctx.fillRect(0, 0, size, size);
    clouds(ctx, size, rand, 30, ['#E8E4DD', '#F8F6F2'], 0.4);
    ctx.strokeStyle = '#A9A39A';
    for (let i = 0; i < 7; i++) {
      // each vein: a wandering polyline with varying alpha
      ctx.globalAlpha = 0.18 + rand() * 0.3; ctx.lineWidth = 0.6 + rand() * 1.4;
      let x = rand() * size, y = 0;
      ctx.beginPath(); ctx.moveTo(x, y);
      while (y < size) { x += (rand() - 0.35) * 30; y += 12 + rand() * 18; ctx.lineTo(x, y); }
      ctx.stroke();
    }
  } else if (key === 'salvia') {
    // sage-green lacquered joinery: vertical door panels
    ctx.fillStyle = '#8C957A'; ctx.fillRect(0, 0, size, size);
    clouds(ctx, size, rand, 20, ['#848D72', '#97A086'], 0.35);
    ctx.globalAlpha = 0.45; ctx.fillStyle = '#6A7259';
    for (let i = 1; i < 4; i++) ctx.fillRect((size / 4) * i - 1, 0, 2, size);
    ctx.globalAlpha = 0.2; ctx.fillStyle = '#C5CBB6';
    for (let i = 0; i < 4; i++) ctx.fillRect((size / 4) * i + 2, 0, 2, size);
  } else if (key === 'deck') {
    // exterior timber deck: narrow weathered boards
    ctx.fillStyle = '#9C7B5C'; ctx.fillRect(0, 0, size, size);
    planks(ctx, size, rand, '#9C7B5C', '#B49274', '#5E4632', 12);
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
