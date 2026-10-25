/* =========================================================================
   export.js: exports the projections: full sheet SVG / PNG, the 3 views
   as separate PNGs, and the project JSON (shared format, cm).
   Fonts are embedded in exported SVGs so text renders the same anywhere.
   ========================================================================= */
import { S, serialize } from './state.js';
import { sheetSVG, viewSVG } from './draw.js';

let fontCss = null;

/**
 * What: build (once) an embedded @font-face style with DM Sans + Fraunces.
 * In:  —
 * Out: Promise<string> (<style> element as a string)
 */
async function fontStyle() {
  if (fontCss !== null) return fontCss;
  const load = async (file) => {
    const buf = await (await fetch('fonts/' + file)).arrayBuffer();
    // base64 encode in chunks to avoid call-stack limits
    let bin = ''; const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return 'data:font/woff2;base64,' + btoa(bin);
  };
  try {
    const [dm, dm5, fr] = await Promise.all([load('DMSans-normal-400-latin.woff2'), load('DMSans-normal-500-latin.woff2'), load('Fraunces-normal-400-latin.woff2')]);
    fontCss = `<style>@font-face{font-family:'DM Sans';font-weight:400;src:url(${dm}) format('woff2')}@font-face{font-family:'DM Sans';font-weight:500;src:url(${dm5}) format('woff2')}@font-face{font-family:'Fraunces';src:url(${fr}) format('woff2')}text{font-family:'DM Sans',sans-serif}.dt{font-weight:500}.tbh{font-family:'Fraunces',serif}</style>`;
  } catch (e) {
    // offline without cached fonts: fall back to system fonts
    fontCss = '<style>text{font-family:Helvetica,Arial,sans-serif}</style>';
  }
  return fontCss;
}

/**
 * What: trigger a browser download of a Blob.
 * In:  blob (Blob), name (file name)
 * Out: —
 */
function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  // revoke later so Safari has time to start the download
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * What: safe file-name stem from the project name.
 * In:  —
 * Out: string
 */
function stem() {
  const base = (S.name || 'proyecto').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  return 'js-taller-' + (base || 'proyecto');
}

/**
 * What: the drawing to export, without the interactive selection overlay.
 * In:  kind ('sheet' | 'plan' | 'front' | 'side'), style (string)
 * Out: SVG string
 */
function exportSvg(kind, style) {
  const state = { ...S, sel: null };
  return kind === 'sheet' ? sheetSVG(state, { id: 'ex', style, interactive: false }) : viewSVG(state, kind, { id: 'ex' + kind, style, interactive: false });
}

/**
 * What: rasterise an SVG string to a PNG Blob.
 * In:  svg (string), width (px of the output)
 * Out: Promise<Blob>
 */
function toPng(svg, width) {
  return new Promise((resolve, reject) => {
    const vb = /viewBox="([-\d.\s]+)"/.exec(svg)[1].trim().split(/\s+/).map(Number);
    const hgt = Math.round(width * vb[3] / vb[2]);
    // give the SVG explicit pixel size so the image decodes at full resolution
    const sized = svg.replace('<svg ', `<svg width="${width}" height="${hgt}" `);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = width; c.height = hgt;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, width, hgt);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('png'))), 'image/png');
    };
    img.onerror = () => reject(new Error('svg decode'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sized);
  });
}

/**
 * What: run one export action.
 * In:  what ('sheet-svg' | 'sheet-png' | 'views-png' | 'json')
 * Out: Promise<void>
 */
export async function doExport(what) {
  const style = await fontStyle();
  if (what === 'json') {
    download(new Blob([JSON.stringify(serialize(), null, 2)], { type: 'application/json' }), stem() + '.json');
  } else if (what === 'sheet-svg') {
    download(new Blob([exportSvg('sheet', style)], { type: 'image/svg+xml' }), stem() + '-lamina.svg');
  } else if (what === 'sheet-png') {
    download(await toPng(exportSvg('sheet', style), 3000), stem() + '-lamina.png');
  } else if (what === 'views-png') {
    // one file per projection, spaced so browsers accept several downloads
    const names = { plan: 'planta', front: 'alzado-frontal', side: 'alzado-lateral' };
    for (const v of ['plan', 'front', 'side']) {
      download(await toPng(exportSvg(v, style), 2000), `${stem()}-${names[v]}.png`);
      await new Promise((r) => setTimeout(r, 450));
    }
  }
}
