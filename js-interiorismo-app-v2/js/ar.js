/* =========================================================================
   ar.js — "Ver en tu espacio": AR-style preview in the browser
   Rear camera via getUserMedia (only after the user taps), a transparent
   Three.js layer with the chosen piece + soft contact shadow on top.
   Drag = move on the floor, pinch = scale, button = rotate.
   No camera / permission denied → graceful fallback over one of Jorge's
   renders. Nothing is recorded or uploaded. Not real AR (no surface tracking).
   ========================================================================= */
import * as THREE from 'three';
import { t } from './i18n.js';
import { h, icon, toast } from './ui.js';
import { CATALOGUE } from './data.js';
import { buildPiece, disposePiece } from './models.js';
import { hasWebGL } from './planner3d.js';

const FALLBACK_IMG = 'img/recamara-2.webp';

/**
 * What: open the AR layer over the app.
 * In:  startType (catalogue type), opts { onClose() }
 * Out: —
 */
export function openAR(startType = 'sofa', opts = {}) {
  const layer = document.getElementById('layers');
  const el = h(`
    <div class="ar" role="dialog" aria-modal="true">
      <video class="ar-video" playsinline muted autoplay></video>
      <img class="ar-bg" alt="" src="${FALLBACK_IMG}" width="1440" height="1440" hidden>
      <div class="ar-gl"></div>
      <div class="ar-top">
        <button class="icon-btn glass" data-act="close" aria-label="${t('ar.close')}">${icon('close')}</button>
        <div class="ar-status glass"><i class="dot"></i><span></span></div>
        <button class="icon-btn glass" data-act="rot" aria-label="${t('ar.rotate')}">${icon('rotate')}</button>
      </div>
      <div class="ar-reticle"></div>
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
  let stream = null, three = null, type = startType;

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

  // --- Three.js overlay ----------------------------------------------------
  /**
   * What: create the transparent 3D layer with the piece and a contact shadow.
   * In:  —
   * Out: state object { renderer, scene, camera, piece, ... }
   */
  function initThree() {
    const host = el.querySelector('.ar-gl');
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#FFF6EA', '#9C8570', 1.3));
    const sun = new THREE.DirectionalLight('#FFE8D0', 2.2);
    sun.position.set(-2, 5, 3); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -3; sun.shadow.camera.right = 3; sun.shadow.camera.top = 3; sun.shadow.camera.bottom = -3;
    sun.shadow.radius = 6;
    scene.add(sun);
    // camera at eye height, almost level (like a phone held upright)
    const camera = new THREE.PerspectiveCamera(60, 1, 0.05, 60);
    camera.position.set(0, 1.5, 0.6);
    camera.lookAt(0, 1.3, -4);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.ShadowMaterial({ opacity: 0.32 }));
    shadow.rotation.x = -Math.PI / 2; shadow.receiveShadow = true;
    scene.add(shadow);
    const holder = new THREE.Group();
    holder.position.set(0, 0, -4.2);
    scene.add(holder);
    return { renderer, scene, camera, holder, piece: null, scale: 1, raf: 0, dirty: true };
  }

  /**
   * What: swap the displayed piece.
   * In:  ty (catalogue type)
   * Out: —
   */
  function setPiece(ty) {
    type = ty;
    el.querySelectorAll('.ar-chip').forEach((b) => b.classList.toggle('on', b.dataset.type === ty));
    if (!three) return;
    if (three.piece) { three.holder.remove(three.piece); disposePiece(three.piece); }
    const c = CATALOGUE.find((x) => x.type === ty);
    three.piece = buildPiece(ty, c.w, c.d);
    three.holder.add(three.piece);
    fitScale(c);
    three.dirty = true;
  }

  /**
   * What: start big pieces at a scale that fits ~70% of the visible width
   *       (small pieces stay at real size); pinch changes it afterwards.
   * In:  c (catalogue entry)
   * Out: —
   */
  function fitScale(c) {
    const cam = three.camera;
    const dist = cam.position.distanceTo(three.holder.position);
    const vfov = THREE.MathUtils.degToRad(cam.fov);
    const visW = 2 * dist * Math.tan(vfov / 2) * (cam.aspect || 0.5);
    three.scale = Math.min(1, (0.7 * visW) / (Math.max(c.w, c.d) / 100));
    three.holder.scale.setScalar(three.scale);
  }

  /**
   * What: fit renderer to the layer size.
   * In:  —
   * Out: —
   */
  function resize() {
    if (!three) return;
    const w = el.clientWidth, hh = el.clientHeight;
    three.renderer.setSize(w, hh, false);
    three.camera.aspect = w / hh; three.camera.updateProjectionMatrix();
    if (three.piece) fitScale(CATALOGUE.find((x) => x.type === type));
    three.dirty = true;
  }

  /**
   * What: render loop (on demand + gentle idle float of the reticle).
   * In:  —
   * Out: —
   */
  function loop() {
    if (!three || closed) return;
    if (three.dirty) { three.renderer.render(three.scene, three.camera); three.dirty = false; }
    three.raf = requestAnimationFrame(loop);
  }

  // --- gestures: drag to move, pinch to scale ----------------------------
  const pointers = new Map();
  let pinch0 = 0, scale0 = 1;
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
  const glHost = el.querySelector('.ar-gl');

  /**
   * What: project a screen point onto the floor plane and move the piece there.
   * In:  x, y (client px)
   * Out: —
   */
  function moveTo(x, y) {
    const r = glHost.getBoundingClientRect();
    const ndc = new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, three.camera);
    if (ray.ray.intersectPlane(plane, hit)) {
      three.holder.position.set(THREE.MathUtils.clamp(hit.x, -3, 3), 0, THREE.MathUtils.clamp(hit.z, -9, -1.2));
      three.dirty = true;
    }
  }
  glHost.addEventListener('pointerdown', (e) => {
    if (!three) return;
    pointers.set(e.pointerId, e); glHost.setPointerCapture(e.pointerId);
    if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch0 = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); scale0 = three.scale; }
    el.querySelector('.ar-hint').classList.add('gone');
  });
  glHost.addEventListener('pointermove', (e) => {
    if (!three || !pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, e);
    if (pointers.size === 1) moveTo(e.clientX, e.clientY);
    else if (pointers.size === 2 && pinch0) {
      const [a, b] = [...pointers.values()];
      three.scale = THREE.MathUtils.clamp(scale0 * (Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / pinch0), 0.25, 1.8);
      three.holder.scale.setScalar(three.scale); three.dirty = true;
    }
  });
  // pointer released: forget it (ends pinch when fewer than two remain)
  const up = (e) => { pointers.delete(e.pointerId); if (pointers.size < 2) pinch0 = 0; };
  glHost.addEventListener('pointerup', up);
  glHost.addEventListener('pointercancel', up);

  // --- capture: composite background + 3D layer (stays on the device) -----
  /**
   * What: build a still frame of the current view and show it as a thumbnail.
   * In:  —
   * Out: —
   */
  function capture() {
    const c = document.createElement('canvas');
    const w = el.clientWidth, hh = el.clientHeight;
    c.width = w * 2; c.height = hh * 2;
    const ctx = c.getContext('2d');
    const src = stream ? video : bg;
    const sw = stream ? video.videoWidth : bg.naturalWidth, sh = stream ? video.videoHeight : bg.naturalHeight;
    // object-fit: cover maths
    if (sw && sh) {
      const s = Math.max(c.width / sw, c.height / sh);
      ctx.drawImage(src, (c.width - sw * s) / 2, (c.height - sh * s) / 2, sw * s, sh * s);
    }
    if (three) { three.renderer.render(three.scene, three.camera); ctx.drawImage(three.renderer.domElement, 0, 0, c.width, c.height); }
    const shot = el.querySelector('.ar-shot');
    shot.hidden = false;
    shot.style.backgroundImage = `url(${c.toDataURL('image/jpeg', 0.8)})`;
    el.querySelector('.ar-flash').classList.remove('go'); void el.offsetWidth; el.querySelector('.ar-flash').classList.add('go');
    toast(t('ar.captured'), 'camera');
  }

  // --- wiring --------------------------------------------------------------
  let closed = false;
  /**
   * What: close the layer, stop camera, free WebGL.
   * In:  —
   * Out: —
   */
  function close() {
    if (closed) return; closed = true;
    stopCamera();
    window.removeEventListener('resize', resize);
    if (three) {
      cancelAnimationFrame(three.raf);
      if (three.piece) disposePiece(three.piece);
      three.scene.traverse((o) => { if (o.geometry && o.geometry.type === 'PlaneGeometry') o.geometry.dispose(); });
      three.renderer.dispose();
    }
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
    if (hasWebGL()) { three = initThree(); resize(); setPiece(type); loop(); }
    if (useCamera) startCamera(); else startPreview();
  }
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act],[data-type]'); if (!b) return;
    if (b.dataset.type) { setPiece(b.dataset.type); return; }
    const a = b.dataset.act;
    if (a === 'close') close();
    if (a === 'cam') begin(true);
    if (a === 'preview') begin(false);
    if (a === 'rot' && three) { three.holder.rotation.y += Math.PI / 4; three.dirty = true; }
    if (a === 'cap') capture();
  });
  window.addEventListener('resize', resize);
  setPiece(type);
}
