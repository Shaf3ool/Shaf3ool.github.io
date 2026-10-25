/* =========================================================================
   ar.js — "Ver en tu espacio": 2D preview over the camera
   Rear camera via getUserMedia (only after the user taps). On top, the
   piece's own floor-plan drawing laid on the floor (foreshortened, soft
   shadow) with its real measurements. Drag = move, pinch = scale and
   twist, button = rotate 45°. No camera / permission denied → preview
   over one of Jorge's renders. Nothing is recorded or uploaded; it is
   not real AR (no surface tracking, no measuring).
   ========================================================================= */
import { t } from './i18n.js';
import { h, icon, toast } from './ui.js';
import { CATALOGUE } from './data.js';
import { pieceSVG } from './furniture2d.js';

const FALLBACK_IMG = 'img/recamara-2.webp';
const FLOOR_K = 0.56;         // vertical squash that lays the drawing on the floor

/**
 * What: padding (cm) around a piece's drawing so chairs / stools fit.
 * In:  type (catalogue type)
 * Out: number
 */
const padFor = (type) => (type === 'mesa' ? 60 : type === 'isla' ? 46 : 10);

/**
 * What: standalone SVG of one piece, 1 user unit = 1 px at scale 1.
 * In:  c (catalogue entry)
 * Out: { svg: markup string, vw, vh }
 */
function pieceArt(c) {
  const p = padFor(c.type), vw = c.w + p * 2, vh = c.d + p * 2;
  // dashed footprint guide (the piece's real width × depth) under the drawing
  const guide = `<rect x="${-c.w / 2 - 5}" y="${-c.d / 2 - 5}" width="${c.w + 10}" height="${c.d + 10}" rx="8" fill="#FFFFFF" fill-opacity=".16" stroke="#FFFFFF" stroke-width="2.4" stroke-dasharray="9 7"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-vw / 2} ${-vh / 2} ${vw} ${vh}" width="${vw}" height="${vh}">${guide}${pieceSVG(c.type, c.w, c.d)}</svg>`;
  return { svg, vw, vh };
}

/**
 * What: open the preview layer over the app.
 * In:  startType (catalogue type), opts { onClose() }
 * Out: —
 */
export function openAR(startType = 'sofa', opts = {}) {
  const layer = document.getElementById('layers');
  const el = h(`
    <div class="ar" role="dialog" aria-modal="true">
      <video class="ar-video" playsinline muted autoplay></video>
      <img class="ar-bg" alt="" src="${FALLBACK_IMG}" width="1440" height="1440" hidden>
      <div class="ar-floor"><div class="ar-piece"></div><span class="ar-dim"></span></div>
      <div class="ar-top">
        <button class="icon-btn glass" data-act="close" aria-label="${t('ar.close')}">${icon('close')}</button>
        <div class="ar-status glass"><i class="dot"></i><span></span></div>
        <button class="icon-btn glass" data-act="rot" aria-label="${t('ar.rotate')}">${icon('rotate')}</button>
      </div>
      <p class="ar-hint glass">${t('ar.hint')}</p>
      <div class="ar-bottom">
        <div class="ar-chips">${CATALOGUE.filter((c) => c.type !== 'tapete').map((c) => `<button class="ar-chip" data-type="${c.type}">${t('f.' + c.type)}</button>`).join('')}</div>
        <div class="ar-actions">
          <div class="ar-shot" hidden></div>
          <button class="ar-capture" data-act="cap" aria-label="${t('ar.capture')}"><span></span></button>
          <span class="ar-note">${t('ar.note')}</span>
        </div>
      </div>
      <div class="ar-intro">
        <div class="ar-card">
          <div class="ar-card-ic">${icon('camera', 30)}</div>
          <h3>${t('ar.title')}</h3>
          <p>${t('ar.ask')}</p>
          <button class="pill-btn primary block" data-act="cam">${icon('camera', 18)}<span>${t('ar.start')}</span></button>
          <button class="pill-btn ghost block light" data-act="preview">${t('ar.preview')}</button>
          <button class="ar-cancel" data-act="close">${t('ar.close')}</button>
        </div>
      </div>
      <div class="ar-flash"></div>
    </div>`);
  layer.appendChild(el);
  requestAnimationFrame(() => el.classList.add('open'));
  const video = el.querySelector('.ar-video');
  const bg = el.querySelector('.ar-bg');
  const floor = el.querySelector('.ar-floor');
  const pieceEl = el.querySelector('.ar-piece');
  const dimEl = el.querySelector('.ar-dim');
  let stream = null, type = startType, closed = false;
  // placement state: centre (px), scale (px per cm), rotation (deg)
  const st = { x: 0, y: 0, s: 1, rot: 0, placed: false };
  let art = null, artImg = null;

  /**
   * What: show which mode we are in (live camera or fallback preview).
   * In:  live (bool)
   * Out: —
   */
  function setStatus(live) {
    el.querySelector('.ar-status span').textContent = live ? t('ar.live') : t('ar.fallback');
    el.querySelector('.ar-status').classList.toggle('live', live);
  }

  /**
   * What: try the rear camera; fall back to a render on any failure.
   * In:  —
   * Out: Promise<void>
   */
  async function startCamera() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('no-media');
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false });
      if (closed) { stopCamera(); return; }
      video.srcObject = stream;
      await video.play().catch(() => {});
      setStatus(true);
    } catch (err) {
      // denied, no device or insecure context → fallback image
      startPreview();
    }
  }

  /**
   * What: fallback mode over one of Jorge's renders.
   * In:  —
   * Out: —
   */
  function startPreview() {
    bg.hidden = false; video.hidden = true; setStatus(false);
  }

  /**
   * What: stop every camera track.
   * In:  —
   * Out: —
   */
  function stopCamera() { if (stream) stream.getTracks().forEach((tr) => tr.stop()); stream = null; }

  // --- the piece -----------------------------------------------------------
  /**
   * What: apply the placement state to the drawing and its size label.
   * In:  —
   * Out: —
   */
  function paint() {
    if (!art) return;
    pieceEl.style.transform = `translate(${st.x}px, ${st.y}px) scale(1, ${FLOOR_K}) rotate(${st.rot}deg) scale(${st.s})`;
    // label sits just below the piece's on-screen footprint
    const c = CATALOGUE.find((x) => x.type === type), a = (st.rot * Math.PI) / 180;
    const hy = (Math.abs(Math.sin(a)) * art.vw / 2 + Math.abs(Math.cos(a)) * art.vh / 2) * st.s * FLOOR_K;
    dimEl.style.transform = `translate(${st.x}px, ${st.y + hy + 16}px) translateX(-50%)`;
    dimEl.textContent = `${t('f.' + c.type)} · ${c.w} × ${c.d} cm`;
  }

  /**
   * What: swap the displayed piece and fit it to the view.
   * In:  ty (catalogue type)
   * Out: —
   */
  function setPiece(ty) {
    type = ty;
    el.querySelectorAll('.ar-chip').forEach((b) => b.classList.toggle('on', b.dataset.type === ty));
    const c = CATALOGUE.find((x) => x.type === ty);
    art = pieceArt(c);
    pieceEl.innerHTML = art.svg;
    pieceEl.style.width = art.vw + 'px'; pieceEl.style.height = art.vh + 'px';
    pieceEl.style.margin = `${-art.vh / 2}px 0 0 ${-art.vw / 2}px`;
    // an <img> copy of the drawing is what the capture paints
    artImg = new Image();
    artImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(art.svg);
    // big pieces start at ~62% of the width, small ones at a natural size
    const W = el.clientWidth || 390, H = el.clientHeight || 844;
    st.s = Math.min(1.5, (0.62 * W) / Math.max(art.vw, art.vh));
    if (!st.placed) { st.x = W / 2; st.y = H * 0.62; st.placed = true; }
    pieceEl.classList.remove('drop'); void pieceEl.offsetWidth; pieceEl.classList.add('drop');
    paint();
  }

  // --- gestures: drag to move, pinch to scale + twist ----------------------
  const pointers = new Map();
  let g0 = null;
  /**
   * What: snapshot the gesture start (one or two fingers).
   * In:  —
   * Out: —
   */
  function startGesture() {
    const ps = [...pointers.values()];
    if (ps.length === 1) g0 = { kind: 'drag', px: ps[0].x, py: ps[0].y, x: st.x, y: st.y };
    else if (ps.length >= 2) {
      const [a, b] = ps;
      g0 = { kind: 'pinch', d: Math.hypot(a.x - b.x, a.y - b.y) || 1, ang: Math.atan2(b.y - a.y, b.x - a.x), s: st.s, rot: st.rot };
    }
  }
  floor.addEventListener('pointerdown', (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    floor.setPointerCapture(e.pointerId);
    startGesture();
    pieceEl.classList.add('held');
    el.querySelector('.ar-hint').classList.add('gone');
  });
  floor.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId) || !g0) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const ps = [...pointers.values()];
    if (g0.kind === 'drag' && ps.length === 1) {
      // keep the piece inside the visible frame
      st.x = Math.min(el.clientWidth - 20, Math.max(20, g0.x + ps[0].x - g0.px));
      st.y = Math.min(el.clientHeight - 120, Math.max(110, g0.y + ps[0].y - g0.py));
    } else if (g0.kind === 'pinch' && ps.length >= 2) {
      const [a, b] = ps;
      st.s = Math.min(3, Math.max(0.15, g0.s * (Math.hypot(a.x - b.x, a.y - b.y) / g0.d)));
      st.rot = g0.rot + ((Math.atan2(b.y - a.y, b.x - a.x) - g0.ang) * 180) / Math.PI;
    }
    paint();
  });
  /**
   * What: a finger lifted: restart the gesture with the remaining fingers.
   * In:  e (PointerEvent)
   * Out: —
   */
  function up(e) {
    pointers.delete(e.pointerId);
    if (pointers.size) startGesture(); else { g0 = null; pieceEl.classList.remove('held'); }
  }
  floor.addEventListener('pointerup', up);
  floor.addEventListener('pointercancel', up);

  // --- capture: background + drawing composited (stays on the device) ------
  /**
   * What: build a still frame of the current view and show it as a thumbnail.
   * In:  —
   * Out: —
   */
  function capture() {
    const c = document.createElement('canvas');
    const w = el.clientWidth, hh = el.clientHeight, k = 2;
    c.width = w * k; c.height = hh * k;
    const ctx = c.getContext('2d');
    const src = stream ? video : bg;
    const sw = stream ? video.videoWidth : bg.naturalWidth, sh = stream ? video.videoHeight : bg.naturalHeight;
    // object-fit: cover maths
    if (sw && sh) {
      const s = Math.max(c.width / sw, c.height / sh);
      ctx.drawImage(src, (c.width - sw * s) / 2, (c.height - sh * s) / 2, sw * s, sh * s);
    }
    // same transform chain as the CSS: translate → floor squash → rotate → scale
    if (artImg && artImg.complete && art) {
      ctx.save();
      ctx.translate(st.x * k, st.y * k); ctx.scale(1, FLOOR_K); ctx.rotate((st.rot * Math.PI) / 180); ctx.scale(st.s * k, st.s * k);
      ctx.shadowColor = 'rgba(20, 12, 6, .45)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 18;
      ctx.drawImage(artImg, -art.vw / 2, -art.vh / 2, art.vw, art.vh);
      ctx.restore();
    }
    const shot = el.querySelector('.ar-shot');
    shot.hidden = false;
    shot.style.backgroundImage = `url(${c.toDataURL('image/jpeg', 0.8)})`;
    el.querySelector('.ar-flash').classList.remove('go'); void el.offsetWidth; el.querySelector('.ar-flash').classList.add('go');
    toast(t('ar.captured'), 'camera');
  }

  // --- wiring --------------------------------------------------------------
  /**
   * What: close the layer and stop the camera.
   * In:  —
   * Out: —
   */
  function close() {
    if (closed) return; closed = true;
    stopCamera();
    el.classList.remove('open');
    setTimeout(() => { el.remove(); if (opts.onClose) opts.onClose(); }, 320);
  }
  /**
   * What: leave the intro card and start the live view (camera or preview).
   * In:  useCamera (bool)
   * Out: —
   */
  function begin(useCamera) {
    el.querySelector('.ar-intro').classList.add('gone');
    el.classList.add('live');
    setPiece(type);
    if (useCamera) startCamera(); else startPreview();
  }
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act],[data-type]'); if (!b) return;
    if (b.dataset.type) { setPiece(b.dataset.type); return; }
    const a = b.dataset.act;
    if (a === 'close') close();
    if (a === 'cam') begin(true);
    if (a === 'preview') begin(false);
    if (a === 'rot') { st.rot += 45; pieceEl.classList.add('ease'); paint(); setTimeout(() => pieceEl.classList.remove('ease'), 320); }
    if (a === 'cap') capture();
  });
  el.querySelectorAll('.ar-chip').forEach((b) => b.classList.toggle('on', b.dataset.type === type));
}
