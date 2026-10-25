/* =========================================================================
   ar.js — "Ver en tu espacio": a 3D lounge chair over the live camera.
   Not true AR (no plane detection): the chair sits on a virtual floor in
   front of the camera; drag moves it, buttons rotate it, swatches re-cover
   it. Without a camera it falls back to a studio render as the backdrop.
   ========================================================================= */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

let stopFn = null;

/* -------------------------------------------------------------------------
   buildChair
   What: procedural lounge chair (walnut frame + upholstered cushions).
   In:   fabricTex (THREE.Texture)
   Out:  { group, fabricMat }
   ------------------------------------------------------------------------- */
function buildChair(fabricTex) {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x5a3a24, roughness: 0.55 });
  const fabricMat = new THREE.MeshStandardMaterial({ map: fabricTex, roughness: 0.92 });
  // legs: four slim tapered posts
  const legGeo = new THREE.CylinderGeometry(0.022, 0.016, 0.26, 12);
  [[-0.32, -0.3], [0.32, -0.3], [-0.32, 0.3], [0.32, 0.3]].forEach(([x, z]) => {
    const l = new THREE.Mesh(legGeo, wood); l.position.set(x, 0.13, z); l.castShadow = true; group.add(l);
  });
  // seat frame and cushion
  const frame = new THREE.Mesh(new RoundedBoxGeometry(0.78, 0.06, 0.74, 3, 0.02), wood);
  frame.position.y = 0.29; frame.castShadow = true; group.add(frame);
  const seat = new THREE.Mesh(new RoundedBoxGeometry(0.72, 0.14, 0.68, 5, 0.06), fabricMat);
  seat.position.y = 0.38; seat.castShadow = true; group.add(seat);
  // reclined back cushion
  const back = new THREE.Mesh(new RoundedBoxGeometry(0.72, 0.56, 0.14, 5, 0.06), fabricMat);
  back.position.set(0, 0.66, -0.3); back.rotation.x = -0.22; back.castShadow = true; group.add(back);
  // arms in walnut
  [-0.39, 0.39].forEach((x) => {
    const arm = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.05, 0.7, 3, 0.02), wood);
    arm.position.set(x, 0.55, 0); arm.castShadow = true; group.add(arm);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.24, 10), wood);
    post.position.set(x, 0.42, 0.28); group.add(post);
  });
  return { group, fabricMat };
}

/* -------------------------------------------------------------------------
   startAR
   What: open the camera (or fallback), render the chair, wire controls.
   In:   host (section element), opts { t, getLang, finishes, fabric, onClose }
   Out:  Promise<void>
   ------------------------------------------------------------------------- */
export async function startAR(host, opts) {
  const { t, getLang, finishes, onClose } = opts;
  const L = getLang();
  const fabrics = finishes.FINISHES.fabric;
  host.innerHTML = `
    <video playsinline muted autoplay hidden></video>
    <img class="arv__bg" src="img/loft-1-sm.webp" alt="" hidden width="900" height="1125">
    <canvas aria-label="3D"></canvas>
    <div class="arv__top"><b>${t('ar.t')}</b><button type="button" class="arv__x" data-ar-x aria-label="${t('ar.close')}">✕</button></div>
    <p class="arv__note" data-ar-note hidden>${t('ar.nocam')}</p>
    <div class="arv__bar"><p>${t('ar.hint')}</p><div class="arv__row">
      <button type="button" class="rot" data-rot="-1" aria-label="⟲">⟲</button>
      <div class="arv__fab">${fabrics.map((f) => `<button type="button" data-fab="${f.id}" aria-pressed="${f.id === opts.fabric}" aria-label="${f[L]}" style="background-image:url(${finishes.swatchDataURL('fabric', f.id)})"></button>`).join('')}</div>
      <button type="button" class="rot" data-rot="1" aria-label="⟳">⟳</button></div></div>`;
  const video = host.querySelector('video');
  const bg = host.querySelector('.arv__bg');
  const canvas = host.querySelector('canvas');

  // camera feed, rear camera preferred; any failure → studio render backdrop
  let stream = null;
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('no media');
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    video.srcObject = stream; video.hidden = false; await video.play();
  } catch (e) {
    bg.hidden = false; host.querySelector('[data-ar-note]').hidden = false;
  }

  // transparent renderer over the feed
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 50);
  camera.position.set(0, 1.35, 2.6); camera.lookAt(0, 0.35, 0);
  // soft daylight
  scene.add(new THREE.HemisphereLight(0xfff4e6, 0x6b5a48, 1.6));
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.2);
  sun.position.set(1.6, 3.2, 1.8); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -2; sun.shadow.camera.right = 2; sun.shadow.camera.top = 2; sun.shadow.camera.bottom = -2; sun.shadow.radius = 6;
  scene.add(sun);
  // invisible floor that only receives the contact shadow
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: 0.32 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  // the chair, covered in the chosen fabric
  const texFor = (id) => { const tx = new THREE.CanvasTexture(finishes.finishCanvas('fabric', id)); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(1.5, 1.5); return tx; };
  const { group: chair, fabricMat } = buildChair(texFor(opts.fabric));
  chair.rotation.y = -0.5; scene.add(chair);
  let targetRot = chair.rotation.y;

  /* What: fit renderer to the overlay.  In: nothing  Out: nothing */
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  // drag on the floor plane moves the chair
  const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2(); const hit = new THREE.Vector3();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  let dragging = false;
  /* What: pointer → floor point.  In: e  Out: boolean (hit) */
  const pick = (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.ray.intersectPlane(plane, hit) !== null;
  };
  canvas.addEventListener('pointerdown', (e) => { dragging = true; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging || !pick(e)) return;
    chair.position.x = THREE.MathUtils.clamp(hit.x, -1.4, 1.4);
    chair.position.z = THREE.MathUtils.clamp(hit.z, -2.5, 1.2);
  });
  canvas.addEventListener('pointerup', () => { dragging = false; });

  // buttons: rotate, re-cover, close
  const onBar = (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.rot) targetRot += +b.dataset.rot * Math.PI / 4;
    if (b.dataset.fab) {
      fabricMat.map.dispose(); fabricMat.map = texFor(b.dataset.fab); fabricMat.needsUpdate = true;
      host.querySelectorAll('[data-fab]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    }
    if ('arX' in b.dataset) stop();
  };
  host.addEventListener('click', onBar);

  // render loop with an eased rotation and a short drop-in on open
  let raf = 0; const t0 = performance.now();
  const loop = () => {
    raf = requestAnimationFrame(loop);
    const k = Math.min(1, (performance.now() - t0) / 700);
    chair.position.y = (1 - (1 - (1 - k) ** 3)) * 0.4;
    chair.rotation.y += (targetRot - chair.rotation.y) * 0.12;
    renderer.render(scene, camera);
  };
  loop();

  /* What: tear everything down.  In: nothing  Out: nothing */
  function stop() {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    host.removeEventListener('click', onBar);
    if (stream) stream.getTracks().forEach((tr) => tr.stop());
    renderer.dispose();
    host.innerHTML = '';
    stopFn = null;
    onClose();
  }
  stopFn = stop;
}

/* What: close AR from outside (e.g. Escape).  In: nothing  Out: nothing */
export function stopAR() { if (stopFn) stopFn(); }
