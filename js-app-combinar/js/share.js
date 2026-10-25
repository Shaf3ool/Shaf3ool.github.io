/* =========================================================================
   share.js — export (SVG / PNG) and the Demo "share with client" link.
   The link carries the project inside the URL hash, so opening it shows
   the same isometric view. Nothing is uploaded anywhere; no client is
   contacted by this prototype.
   ========================================================================= */
import { buildIso, axoSVG, fmt } from './render.js';
import { t } from './i18n.js';
import { pname } from './screens.js';

const EXP_W = 1600, EXP_H = 1200;

/**
 * What: title block drawn at the bottom of an exported sheet.
 * In:   project, angle
 * Out:  SVG markup
 */
function titleBlock(project, angle) {
  const y = EXP_H - 70, ink = '#2E2520';
  const font = 'font-family="Georgia, \'Times New Roman\', serif"', ui = 'font-family="Helvetica, Arial, sans-serif"';
  const r = project.room;
  return `<g>
    <line x1="60" y1="${y - 26}" x2="${EXP_W - 60}" y2="${y - 26}" stroke="${ink}" stroke-width="1" opacity=".35"/>
    <text x="60" y="${y + 6}" font-size="30" fill="${ink}" ${font}>${xml(pname(project))}</text>
    <text x="60" y="${y + 38}" font-size="15" fill="#6E5E51" letter-spacing="2" ${ui}>${xml(t('m.title').toUpperCase())} · ${fmt(r.w)} × ${fmt(r.l)} × ${fmt(r.h)} · ${angle}° · DEMO</text>
    <text x="${EXP_W - 60}" y="${y + 6}" font-size="15" text-anchor="end" fill="${ink}" letter-spacing="2" ${ui}>JS INTERIORISMO</text>
    <text x="${EXP_W - 60}" y="${y + 38}" font-size="13" text-anchor="end" fill="#9C8B7C" ${ui}>Concept by Shaf3ool</text>
  </g>`;
}

/**
 * What: escape text for XML.
 * In:   s — string
 * Out:  escaped string
 */
function xml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/**
 * What: the full export sheet as an SVG document (cream paper + drawing + title block).
 * In:   project, angle
 * Out:  SVG string
 */
export function exportSVG(project, angle) {
  const inner = axoSVG(buildIso(project, angle), project, { W: EXP_W, H: EXP_H - 120, pad: 90 });
  // wrap: paper background, drawing, title block
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${EXP_W}" height="${EXP_H}" viewBox="0 0 ${EXP_W} ${EXP_H}"><rect width="${EXP_W}" height="${EXP_H}" fill="#FBF8F2"/>${inner}${titleBlock(project, angle)}</svg>`;
}

/**
 * What: rasterise the export sheet to a PNG blob.
 * In:   project, angle
 * Out:  Promise<Blob>
 */
export function exportPNG(project, angle) {
  const svg = exportSVG(project, angle);
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    img.onload = () => {
      // draw at native size onto a canvas, then encode
      const c = document.createElement('canvas');
      c.width = EXP_W; c.height = EXP_H;
      c.getContext('2d').drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('png'))), 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('svg')); };
    img.src = url;
  });
}

/**
 * What: pack a project into a short base64url string for the link.
 * In:   project, angle
 * Out:  string
 */
export function encodeView(project, angle) {
  const r = project.room;
  const compact = {
    n: pname(project), a: angle, r: [r.w, r.l, r.h, r.floor, r.wall],
    i: project.items.map((it) => [it.name, it.x, it.y, it.w, it.d, it.h, it.rot || 0, it.color, it.z || 0, it.type || '']),
  };
  const bytes = new TextEncoder().encode(JSON.stringify(compact));
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * What: unpack a view link back into a project.
 * In:   s — base64url string
 * Out:  { project, angle } or null
 */
export function decodeView(s) {
  try {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
    const c = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0))));
    const [w, l, h, floor, wall] = c.r;
    // rebuild the shared format, then let data.js validate it
    return {
      angle: [0, 90, 180, 270].includes(c.a) ? c.a : 0,
      raw: { name: c.n, room: { w, l, h, floor, wall }, items: c.i.map((a) => ({ name: a[0], x: a[1], y: a[2], w: a[3], d: a[4], h: a[5], rot: a[6], color: a[7], z: a[8], type: a[9] || undefined })) },
    };
  } catch (e) {
    return null;
  }
}

/**
 * What: Demo share: native share sheet (with the PNG when supported) or copy the link.
 * In:   project, angle, title, fileBase
 * Out:  Promise<'shared'|'copied'|'cancel'|'error'>
 */
export async function shareLink(project, angle, title, fileBase) {
  const url = `${location.origin}${location.pathname}#v=${encodeView(project, angle)}`;
  const text = t('s.msg');
  try {
    if (navigator.share) {
      // try to include the sheet as an image file first
      let data = { title, text, url };
      try {
        const png = await exportPNG(project, angle);
        const file = new File([png], fileBase + '.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) data = { title, text: `${text}\n${url}`, files: [file] };
      } catch (e) { /* fall back to the link only */ }
      await navigator.share(data);
      return 'shared';
    }
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch (e) {
    if (e && e.name === 'AbortError') return 'cancel';
    // last resort: a hidden textarea copy
    try {
      const ta = document.createElement('textarea');
      ta.value = url; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.append(ta); ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok ? 'copied' : 'error';
    } catch (e2) {
      return 'error';
    }
  }
}
