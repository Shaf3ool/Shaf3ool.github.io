/* =========================================================================
   merge.js — the "Combinar vistas" screen.
   Plays the merge (each vertex travels from its position in the 2D views to
   its isometric position), then lets the designer turn the view in 90°
   steps, export PNG/SVG, and share a view link (Demo).
   ========================================================================= */
import { t } from './i18n.js';
import { buildIso, axoSVG } from './render.js';
import { projectParts } from './geometry.js';
import { ICON, esc, toast, openSheet, download } from './ui.js';
import { exportSVG, exportPNG, shareLink } from './share.js';
import { pname } from './screens.js';

const DURATION = 2600;        // merge animation length (ms)
const TURN_MS = 620;          // one 90° turn (ms)
const reduce = matchMedia('(prefers-reduced-motion: reduce)');

let state = null;             // { project, angle, t, raf, shared }

/**
 * What: open the merge screen for a project and play the animation.
 * In:   project, opts = { shared:bool, angle:number }
 * Out:  —
 */
export function openMerge(project, opts = {}) {
  const el = document.getElementById('merge');
  state = { project, angle: opts.angle || 0, t: 0, raf: 0, shared: !!opts.shared };
  el.innerHTML = `<div class="m-top">
      <button class="icon-btn" data-close aria-label="${t('back')}">${ICON.back}</button>
      <div class="mt"><b>${esc(pname(project))}</b><span>${t('m.title')} · Demo</span></div>
      <button class="icon-btn" data-replay aria-label="${t('m.replay')}">${ICON.replay}</button></div>
    ${state.shared ? `<div class="shared-bar"><span>${t('m.shared')}</span><a href="./">${t('m.openApp')}</a></div>` : ''}
    <div class="m-meta"><span class="pill">Demo</span><span class="pill olive">${countSolids(project)} ${t('m.volumes')}</span><span class="pill ink">${t('m.views3')}</span></div>
    <div class="stage" id="stage"><div class="caption" id="caption"><i></i><span></span></div></div>
    <div class="m-bar">
      <div class="m-row">
        <button class="round" data-rot="-1" aria-label="${t('m.rotL')}">${ICON.rotL}</button>
        <span class="angle" id="angle">0°</span>
        <button class="round" data-rot="1" aria-label="${t('m.rotR')}">${ICON.rotR}</button>
        <button class="btn2" data-export>${ICON.export}<span>${t('m.export')}</span></button>
      </div>
      <button class="btn1 full" data-share>${ICON.share}<span>${t('m.share')}</span></button>
    </div>`;
  el.classList.add('open');
  el.setAttribute('aria-hidden', 'false');
  // controls
  el.querySelector('[data-close]').addEventListener('click', closeMerge);
  el.querySelector('[data-replay]').addEventListener('click', () => play(true));
  el.querySelectorAll('[data-rot]').forEach((b) => b.addEventListener('click', () => turn(+b.dataset.rot)));
  el.querySelector('[data-export]').addEventListener('click', exportSheet);
  el.querySelector('[data-share]').addEventListener('click', shareSheet);
  requestAnimationFrame(() => play(!opts.instant));
}

/**
 * What: number of solids computed from the three views (cuboids, pots, foliage).
 * In:   project
 * Out:  number
 */
function countSolids(project) {
  return projectParts(project).length;
}

/**
 * What: close the merge screen and stop any animation.
 * In:   —
 * Out:  —
 */
export function closeMerge() {
  const el = document.getElementById('merge');
  if (state) cancelAnimationFrame(state.raf);
  el.classList.remove('open');
  el.setAttribute('aria-hidden', 'true');
  if (state && state.shared) history.replaceState(null, '', location.pathname);
  state = null;
}

/**
 * What: draw the stage for the current state (angle, t).
 * In:   —
 * Out:  —
 */
function draw() {
  const stage = document.getElementById('stage');
  if (!stage || !state) return;
  const W = Math.round(stage.clientWidth), H = Math.round(stage.clientHeight);
  if (W < 10 || H < 10) return;
  const model = buildIso(state.project, state.angle, H > W * 1.15);
  const svg = axoSVG(model, state.project, { W, H, t: state.t, pad: 22, bottom: 40 });
  const ang = document.getElementById('angle');
  if (ang) ang.textContent = `${Math.round(((state.angle % 360) + 360) % 360)}°`;
  // keep the caption element, swap only the drawing
  const old = stage.querySelector('svg');
  if (old) old.outerHTML = svg; else stage.insertAdjacentHTML('afterbegin', svg);
}

/**
 * What: update the caption pill for the animation progress.
 * In:   k — progress 0..1
 * Out:  —
 */
function caption(k) {
  const c = document.getElementById('caption');
  if (!c) return;
  const key = k < 0.18 ? 'm.s0' : k < 0.55 ? 'm.s1' : k < 0.95 ? 'm.s2' : 'm.s3';
  c.querySelector('span').textContent = t(key);
  c.classList.toggle('done', k >= 0.95);
}

/**
 * What: play the merge animation (or jump to the end with reduced motion).
 * In:   animate — false shows the final view immediately
 * Out:  —
 */
function play(animate) {
  if (!state) return;
  cancelAnimationFrame(state.raf);
  state.angle = 0;
  if (!animate || reduce.matches) { state.t = 1; caption(1); draw(); return; }
  const t0 = performance.now(), hold = 450;
  // hold the three flat views for a beat, then merge
  const step = (now) => {
    if (!state) return;
    const k = Math.min(1, Math.max(0, (now - t0 - hold) / DURATION));
    state.t = k;
    caption(k);
    draw();
    if (k < 1) state.raf = requestAnimationFrame(step);
  };
  state.t = 0; caption(0); draw();
  state.raf = requestAnimationFrame(step);
}

/**
 * What: turn the view 90° left or right, animated around the room centre.
 * In:   dir — −1 or +1
 * Out:  —
 */
function turn(dir) {
  if (!state) return;
  cancelAnimationFrame(state.raf);
  state.t = 1; caption(1);
  const from = state.angle, to = Math.round((from + dir * 90) / 90) * 90;
  if (reduce.matches) { state.angle = to; draw(); return; }
  const t0 = performance.now();
  // ease-in-out over TURN_MS; every frame re-sorts the faces (x + y + z)
  const step = (now) => {
    if (!state) return;
    const k = Math.min(1, (now - t0) / TURN_MS), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    state.angle = from + (to - from) * e;
    draw();
    if (k < 1) state.raf = requestAnimationFrame(step);
    else state.angle = ((to % 360) + 360) % 360;
  };
  state.raf = requestAnimationFrame(step);
}

/**
 * What: export sheet (PNG / SVG of the current angle).
 * In:   —
 * Out:  —
 */
function exportSheet() {
  if (!state) return;
  const { project, angle } = state;
  const body = `<button class="opt" data-x="png"><span class="oi">PNG</span><span><b>${t('x.png')}</b><span>${t('x.pngSub')}</span></span></button>
    <button class="opt" data-x="svg"><span class="oi">SVG</span><span><b>${t('x.svg')}</b><span>${t('x.svgSub')}</span></span></button>`;
  openSheet(t('x.title'), body, (el, close) => {
    el.querySelectorAll('[data-x]').forEach((b) => b.addEventListener('click', async () => {
      const name = fileBase(project);
      if (b.dataset.x === 'svg') download(new Blob([exportSVG(project, angle)], { type: 'image/svg+xml' }), name + '.svg');
      else download(await exportPNG(project, angle), name + '.png');
      toast(t('x.done'));
      close();
    }));
  });
}

/**
 * What: "Compartir con el cliente" sheet (Demo — nothing reaches a client).
 * In:   —
 * Out:  —
 */
function shareSheet() {
  if (!state) return;
  const { project, angle } = state;
  const prev = axoSVG(buildIso(project, angle), project, { W: 330, H: 210, pad: 14, labels: false });
  const body = `<div class="share-prev">${prev}</div>
    <div class="demo-note">${ICON.info}<span>${t('s.demo')}</span></div>
    <p class="sh-p">${t('s.text')}</p>
    <button class="btn1 full" data-go>${ICON.share}<span>${t('s.go')}</span></button>`;
  openSheet(t('s.title'), body, (el, close) => {
    el.querySelector('[data-go]').addEventListener('click', async () => {
      const r = await shareLink(project, angle, pname(project), fileBase(project));
      if (r === 'shared') toast(t('s.shared'));
      else if (r === 'copied') toast(t('s.copied'));
      else if (r === 'error') toast(t('err.share'));
      if (r !== 'cancel') close();
    });
  });
}

/**
 * What: a tidy file name for exports.
 * In:   project
 * Out:  string without extension
 */
function fileBase(project) {
  const n = pname(project).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `isometria-${n || 'proyecto'}-demo`;
}

/**
 * What: redraw on resize / language change while open.
 * In:   —
 * Out:  —
 */
export function refreshMerge() {
  if (!state) return;
  const el = document.getElementById('merge');
  const tt = el.querySelector('.mt span');
  if (tt) tt.textContent = `${t('m.title')} · Demo`;
  caption(state.t);
  draw();
}
