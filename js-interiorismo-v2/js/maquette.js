/* ==========================================================
   maquette.js — the signature 3D piece of v2 "Galería blanca".
   A floating white architectural model (procedural Three.js):
   plinth, walls, an arched wall, a slatted pergola, a roof slab,
   a shallow pool and two sage "model trees". Scroll explodes it
   into its parts and reassembles it; drag turns it.
   ========================================================== */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// ---- Palette (gallery whites + the single sage accent) ----
const C = {
  white: 0xf4f2ee, warm: 0xebe7df, roof: 0xf7f6f3, edge: 0xc9c4ba,
  water: 0xc4cfc0, sage: 0x8a9a82, trunk: 0xd8d2c7
};

/* What: smooth 0→1 easing between two edges (GLSL smoothstep).
   In: edge0, edge1, x. Out: number in [0,1] */
function smooth(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/* What: a wall slab with an arched opening cut through it.
   In: w (width), h (height), t (thickness), aw (arch width), ah (spring height). Out: BufferGeometry */
function archWallGeometry(w, h, t, aw, ah) {
  const s = new THREE.Shape();
  // outline walks round the opening so the arch reaches the floor
  s.moveTo(-w / 2, 0);
  s.lineTo(-aw / 2, 0);
  s.lineTo(-aw / 2, ah);
  s.absarc(0, ah, aw / 2, Math.PI, 0, true);
  s.lineTo(aw / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(w / 2, h);
  s.lineTo(-w / 2, h);
  s.lineTo(-w / 2, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 28 });
  g.translate(0, 0, -t / 2); // centre the thickness on z = 0
  return g;
}

/* What: a soft round contact-shadow texture drawn on a 2D canvas.
   In: nothing. Out: CanvasTexture */
function shadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(17,17,17,0.55)');
  grd.addColorStop(0.45, 'rgba(17,17,17,0.18)');
  grd.addColorStop(1, 'rgba(17,17,17,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* What: build the whole maquette as named parts that can explode.
   In: nothing. Out: { root, parts[], anchors{}, disposables[] }
   Each part = { obj, base: Vector3, off: Vector3, rot: Euler-ish {x,y,z}, delay } */
function buildModel() {
  const root = new THREE.Group();
  const disposables = [];
  const parts = [];
  const anchors = {};

  // shared materials — matte paper/plaster look of an architect's model
  const mWhite = new THREE.MeshStandardMaterial({ color: C.white, roughness: 0.92, metalness: 0 });
  const mWarm = new THREE.MeshStandardMaterial({ color: C.warm, roughness: 0.95, metalness: 0 });
  const mRoof = new THREE.MeshStandardMaterial({ color: C.roof, roughness: 0.9, metalness: 0 });
  const mWater = new THREE.MeshStandardMaterial({ color: C.water, roughness: 0.18, metalness: 0.05 });
  const mSage = new THREE.MeshStandardMaterial({ color: C.sage, roughness: 0.85, metalness: 0, flatShading: true });
  const mTrunk = new THREE.MeshStandardMaterial({ color: C.trunk, roughness: 0.9 });
  const mEdge = new THREE.LineBasicMaterial({ color: C.edge, transparent: true, opacity: 0.55 });
  disposables.push(mWhite, mWarm, mRoof, mWater, mSage, mTrunk, mEdge);

  /* What: make a mesh (+ crisp model edges) and register it for disposal.
     In: geometry, material, edges flag. Out: Mesh */
  const mesh = (geo, mat, edges = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    disposables.push(geo);
    if (edges) {
      const eg = new THREE.EdgesGeometry(geo, 28);
      const l = new THREE.LineSegments(eg, mEdge);
      disposables.push(eg);
      m.add(l);
    }
    return m;
  };
  /* What: register a part with its exploded offset.
     In: object, offset [x,y,z], rotation [x,y,z], delay 0..1. Out: object */
  const part = (obj, off, rot = [0, 0, 0], delay = 0) => {
    root.add(obj);
    parts.push({ obj, base: obj.position.clone(), baseRot: obj.rotation.clone(), off: new THREE.Vector3(...off), rot, delay });
    return obj;
  };

  const H = 1.62;   // wall height
  const T = 0.12;   // wall thickness
  const Y0 = 0.26;  // top of plinth

  // ---- 1. Plinth / platform (base) ----
  const base = new THREE.Group();
  base.add(mesh(new RoundedBoxGeometry(7.2, 0.26, 5.2, 3, 0.05), mWarm));
  base.children[0].position.y = 0.13;
  // terrace deck under the pergola
  const deck = mesh(new THREE.BoxGeometry(2.6, 0.05, 2.9), mWhite);
  deck.position.set(2.05, Y0 + 0.025, -0.3);
  base.add(deck);
  // pool, recessed look: water plane with a thin white coping
  const coping = mesh(new THREE.BoxGeometry(2.2, 0.05, 1.12), mWhite);
  coping.position.set(2.0, Y0 + 0.025, 1.85);
  base.add(coping);
  const water = mesh(new THREE.BoxGeometry(1.98, 0.056, 0.9), mWater, false);
  water.position.set(2.0, Y0 + 0.03, 1.85);
  base.add(water);
  // three steps at the front
  for (let i = 0; i < 3; i++) {
    const st = mesh(new THREE.BoxGeometry(1.1, 0.08 * (3 - i), 0.26), mWhite);
    st.position.set(-0.55, 0.04 * (3 - i), 2.73 + i * 0.26); // tallest step against the plinth
    st.position.y = 0.04 * (3 - i);
    base.add(st);
  }
  part(base, [0, -1.25, 0], [0, 0, 0], 0);
  anchors.base = new THREE.Object3D();
  anchors.base.position.set(-3.4, 0.13, 2.4);
  base.add(anchors.base);

  // ---- 2. Walls (each slides out on its own axis) ----
  const back = mesh(new THREE.BoxGeometry(3.8, H, T), mWhite);
  back.position.set(-1.2, Y0 + H / 2, -2.0);
  part(back, [0, 0.35, -1.5], [0, 0, 0], 0.05);
  const left = mesh(new THREE.BoxGeometry(T, H, 2.9), mWhite);
  left.position.set(-3.04, Y0 + H / 2, -0.61);
  part(left, [-1.5, 0.35, 0], [0, 0, 0], 0.08);
  // right wall carries the house's own arched opening
  const right = mesh(archWallGeometry(2.9, H, T, 0.8, 0.82), mWhite);
  right.rotation.y = Math.PI / 2;
  right.position.set(0.64, Y0, -0.61);
  part(right, [1.15, 0.35, 0], [0, 0, 0], 0.1);
  // short front wall + a round column holding the roof corner
  const front = mesh(new THREE.BoxGeometry(1.5, H, T), mWhite);
  front.position.set(-2.35, Y0 + H / 2, 0.78);
  part(front, [0, 0.35, 1.3], [0, 0, 0], 0.12);
  const col = mesh(new THREE.CylinderGeometry(0.075, 0.075, H, 24), mWhite);
  col.position.set(0.52, Y0 + H / 2, 0.66);
  part(col, [0.5, 0.6, 0.9], [0, 0, 0], 0.14);
  // interior partition + a built-in bench (furniture as volumes)
  const inner = mesh(new THREE.BoxGeometry(T, H * 0.72, 1.4), mWhite);
  inner.position.set(-1.25, Y0 + H * 0.36, -1.25);
  part(inner, [0, 1.05, 0], [0, 0, 0], 0.18);
  const bench = mesh(new THREE.BoxGeometry(1.2, 0.32, 0.42), mWarm);
  bench.position.set(-2.3, Y0 + 0.16, -1.65);
  part(bench, [0, 0.75, 0], [0, 0, 0], 0.2);
  anchors.walls = new THREE.Object3D();
  anchors.walls.position.set(0, H / 2, -1.3); // top-back corner, relative to the left wall's centre
  left.add(anchors.walls);

  // ---- 3. Free-standing garden arch (his recurring arched openings) ----
  const arch = mesh(archWallGeometry(1.7, 1.42, 0.14, 0.72, 0.68), mWhite);
  arch.position.set(-2.1, Y0, 2.05);
  part(arch, [-0.4, 0.55, 1.6], [0, -0.25, 0], 0.16);
  anchors.arch = new THREE.Object3D();
  anchors.arch.position.set(0, 1.42, 0);
  arch.add(anchors.arch);

  // ---- 4. Roof slab, cantilevered ----
  const roof = mesh(new RoundedBoxGeometry(4.3, 0.12, 3.5, 2, 0.02), mRoof);
  roof.position.set(-1.2, Y0 + H + 0.06, -0.55);
  part(roof, [0, 2.7, 0], [0.12, 0, -0.05], 0.22);
  anchors.roof = new THREE.Object3D();
  anchors.roof.position.set(-1.6, 0.06, -1.6);
  roof.add(anchors.roof);

  // ---- 5. Pergola: posts, beams and lifting slats ----
  const PH = 1.42;
  const posts = new THREE.Group();
  [[1.0, -1.6], [3.2, -1.6], [1.0, 1.0], [3.2, 1.0]].forEach(([x, z]) => {
    const p = mesh(new THREE.BoxGeometry(0.07, PH, 0.07), mWhite);
    p.position.set(x, Y0 + PH / 2, z);
    posts.add(p);
  });
  part(posts, [0.8, 0.25, 0], [0, 0, 0], 0.12);
  const beams = new THREE.Group();
  [-1.6, 1.0].forEach((z) => {
    const b = mesh(new THREE.BoxGeometry(2.45, 0.09, 0.08), mWhite);
    b.position.set(2.1, Y0 + PH + 0.045, z);
    beams.add(b);
  });
  part(beams, [0.8, 1.25, 0], [0, 0, 0], 0.18);
  // slats run across the beams; each one lifts a little later than the last
  const N = 13;
  for (let i = 0; i < N; i++) {
    const s = mesh(new THREE.BoxGeometry(0.045, 0.07, 2.85), mWhite);
    s.position.set(0.98 + i * (2.24 / (N - 1)), Y0 + PH + 0.125, -0.3);
    part(s, [0.8, 1.9 + i * 0.07, 0], [0, 0, 0.25 + i * 0.05], 0.2 + i * 0.012);
    if (i === Math.floor(N / 2)) {
      anchors.pergola = new THREE.Object3D();
      anchors.pergola.position.set(0, 0.05, -1.2);
      s.add(anchors.pergola);
    }
  }

  // ---- 6. Two model trees in the sage accent ----
  [[3.05, -2.05, 0.42, 1.25], [-0.25, 1.95, 0.32, 0.95]].forEach(([x, z, r, h], k) => {
    const tree = new THREE.Group();
    const trunk = mesh(new THREE.CylinderGeometry(0.025, 0.03, h, 10), mTrunk, false);
    trunk.position.y = h / 2;
    tree.add(trunk);
    const crown = mesh(new THREE.IcosahedronGeometry(r, 1), mSage, false);
    crown.position.y = h + r * 0.55;
    tree.add(crown);
    tree.position.set(x, Y0, z);
    part(tree, [0, 1.1 + k * 0.3, 0], [0, 0.8, 0], 0.25);
  });

  return { root, parts, anchors, disposables };
}

/* What: create and run the maquette inside a container element.
   In: container element, options { reducedMotion, onFail }. Out: controller
   { setProgress(p), explosion(), anchorsScreen(), dispose() } or null on failure */
export function createMaquette(container, opts = {}) {
  const reduced = !!opts.reducedMotion;
  // ---- renderer (guarded: some devices refuse WebGL) ----
  let renderer;
  try {
    const probe = document.createElement('canvas');
    const ok = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!ok) throw new Error('no webgl');
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    if (opts.onFail) opts.onFail(e);
    return null;
  }
  const isSmall = () => container.clientWidth < 800;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); // cap DPR at 2
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');

  // ---- scene, light and environment ----
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.55;
  pmrem.dispose();

  const sun = new THREE.DirectionalLight(0xffffff, 2.1);
  sun.position.set(-5, 9, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(isSmall() ? 1024 : 2048, isSmall() ? 1024 : 2048);
  sun.shadow.camera.left = -6; sun.shadow.camera.right = 6;
  sun.shadow.camera.top = 6; sun.shadow.camera.bottom = -6;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 30;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 4;
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xe9e4da, 0.6));

  // ---- the model, spun around its own centre ----
  const model = buildModel();
  const pivot = new THREE.Group();   // rotates (drag / auto)
  const floater = new THREE.Group(); // bobs gently
  model.root.position.set(0, -1.05, 0);
  pivot.add(model.root);
  floater.add(pivot);
  scene.add(floater);

  // soft contact shadow on the "gallery floor" below the floating model
  const shTex = shadowTexture();
  const shMat = new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false, opacity: 0.5 });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(11, 8), shMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -2.15;
  scene.add(shadow);
  model.disposables.push(shTex, shMat, shadow.geometry);

  // ---- camera: long lens, three-quarter view like a model photo ----
  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100);
  const camDir = new THREE.Vector3(1, 0.78, 1.15).normalize();
  const target = new THREE.Vector3(0, 0, 0);
  let baseDist = 20;

  /* What: size renderer + frame the model for the current viewport.
     In: nothing. Out: nothing */
  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    camera.aspect = aspect;
    // distance so the ~8.5-unit model fits the narrower side
    const small = w < 800;
    const fit = small ? 10.6 / Math.min(aspect, 1) * Math.min(1, aspect * 2.05) : 10.8;
    baseDist = (fit / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.position.copy(camDir).multiplyScalar(baseDist).add(target);
    camera.lookAt(target);
    // shift the framing: model sits right on desktop, high on mobile
    if (small) camera.setViewOffset(w, h, 0, h * 0.12, w, h);
    else camera.setViewOffset(w, h, -w * 0.2, -h * 0.03, w, h);
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  // ---- interaction: horizontal drag turns the model (vertical stays scroll) ----
  let rotY = -0.35, vel = 0, dragging = false, lastX = 0, pointerX = 0, pointerY = 0;
  const el = renderer.domElement;
  /* What: start a drag. In: PointerEvent. Out: nothing */
  const down = (e) => { dragging = true; lastX = e.clientX; vel = 0; };
  /* What: follow the drag / track the pointer for parallax. In: PointerEvent. Out: nothing */
  const move = (e) => {
    const r = container.getBoundingClientRect();
    pointerX = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointerY = ((e.clientY - r.top) / r.height) * 2 - 1;
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    vel = dx * 0.0065;
    rotY += vel;
  };
  /* What: end a drag. In: nothing. Out: nothing */
  const up = () => { dragging = false; };
  el.addEventListener('pointerdown', down);
  window.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);

  // ---- explode state (driven from scroll) ----
  let progress = 0, eased = 0;
  /* What: map scroll progress to explosion amount (0 assembled → 1 apart → 0).
     In: p 0..1. Out: number 0..1 */
  const explodeOf = (p) => smooth(0.1, 0.45, p) * (1 - smooth(0.62, 0.94, p));

  /* What: move every part to its exploded/assembled place.
     In: e 0..1. Out: nothing */
  function applyExplode(e) {
    model.parts.forEach((pt) => {
      const k = smooth(pt.delay * 0.6, 1, e) ; // staggered start per part
      pt.obj.position.set(pt.base.x + pt.off.x * k, pt.base.y + pt.off.y * k, pt.base.z + pt.off.z * k);
      pt.obj.rotation.set(pt.baseRot.x + pt.rot[0] * k, pt.baseRot.y + pt.rot[1] * k, pt.baseRot.z + pt.rot[2] * k);
    });
    shMat.opacity = 0.5 - e * 0.25;
  }

  // ---- render loop (paused off-screen / hidden tab) ----
  const clock = new THREE.Clock();
  let visible = true, raf = 0, running = false, elapsed = 0;
  /* What: one animation frame. In: nothing. Out: nothing */
  function frame() {
    raf = 0;
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    elapsed += dt;
    // inertia + slow auto-rotation (none with reduced motion)
    if (!dragging) {
      vel *= 0.94;
      rotY += vel;
      rotY += (-0.35 - rotY) * dt * 0.08; // drift slowly back toward the hero angle
    }
    const sway = reduced ? 0 : Math.sin(elapsed * 0.16) * 0.42; // slow architectural sway
    eased += (explodeOf(progress) - eased) * Math.min(1, dt * 7);
    pivot.rotation.y = rotY + sway + Math.sin(progress * Math.PI) * 0.75; // scroll turns it and brings it back
    // dolly out while exploded so every part stays in frame
    camera.position.copy(camDir).multiplyScalar(baseDist * (1 + eased * 0.32)).add(target);
    floater.position.y = reduced ? 0 : Math.sin(elapsed * 0.7) * 0.06;
    // tiny pointer parallax on desktop
    floater.rotation.x += ((reduced ? 0 : pointerY * 0.035) - floater.rotation.x) * 0.05;
    floater.rotation.z += ((reduced ? 0 : -pointerX * 0.02) - floater.rotation.z) * 0.05;
    applyExplode(eased);
    renderer.render(scene, camera);
    if (opts.onFrame) opts.onFrame(api);
    raf = requestAnimationFrame(frame);
  }
  /* What: start/stop the loop according to visibility. In: nothing. Out: nothing */
  function sync() {
    const should = visible && !document.hidden;
    if (should && !running) { running = true; clock.getDelta(); raf = requestAnimationFrame(frame); }
    if (!should && running) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
  }
  const io = new IntersectionObserver((ents) => { visible = ents[0].isIntersecting; sync(); }, { rootMargin: '80px' });
  io.observe(container);
  document.addEventListener('visibilitychange', sync);

  // ---- screen positions of the part labels ----
  const tmp = new THREE.Vector3();
  /* What: project each label anchor to container pixels.
     In: nothing. Out: { name: {x, y, visible} } */
  function anchorsScreen() {
    const out = {};
    const w = container.clientWidth, h = container.clientHeight;
    Object.entries(model.anchors).forEach(([k, a]) => {
      a.getWorldPosition(tmp);
      tmp.project(camera);
      out[k] = { x: (tmp.x * 0.5 + 0.5) * w, y: (-tmp.y * 0.5 + 0.5) * h, visible: tmp.z < 1 };
    });
    return out;
  }

  /* What: free every GPU resource and listener. In: nothing. Out: nothing */
  function dispose() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    io.disconnect(); ro.disconnect();
    document.removeEventListener('visibilitychange', sync);
    el.removeEventListener('pointerdown', down);
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    model.disposables.forEach((d) => d.dispose && d.dispose());
    envTex.dispose();
    renderer.dispose();
    el.remove();
  }

  const api = {
    setProgress: (p) => { progress = Math.min(1, Math.max(0, p)); },
    explosion: () => eased,
    anchorsScreen,
    dispose
  };
  // first frame immediately so the hero is never empty
  applyExplode(0);
  sync();
  return api;
}
