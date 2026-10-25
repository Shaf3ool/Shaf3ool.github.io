/* =========================================================================
   scene.js — the procedural 3D living room (Three.js r170).
   Built entirely in code: geometry, lights and textures. The camera follows
   a scroll-driven path (setProgress) and can be freed for orbit exploring
   (setExplore). Materials can be swapped live (setFinish).
   ========================================================================= */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { FINISHES, FIXED, finishCanvas, toTexture } from './materials.js';

/* Room size (metres): x = width, z = depth, y = height */
const W = 10, D = 7, H = 3.4;

/* Camera keyframes for the scroll story: [position, target] */
const PATH = [
  [[4.15, 1.55, 3.05], [-1.2, 1.15, -1.7]],   // 0 · hero: wide corner view
  [[2.2, 1.35, 0.9], [3.1, 1.05, -3.4]],      // 1 · light: towards the window
  [[-1.2, 0.95, 1.7], [-4.2, 0.85, -0.6]],    // 2 · matter: sofa, slats, stone
  [[0.6, 2.7, 2.9], [-0.6, 0.35, -0.7]],      // 3 · plan: high overview
  [[3.7, 1.65, 2.95], [-0.9, 0.95, -1.0]],    // 4 · configurator
];

/* -------------------------------------------------------------------------
   rbox
   What: rounded box mesh helper.
   In:   w, h, d (size), mat (material), r (corner radius), x, y, z (centre)
   Out:  THREE.Mesh (casts and receives shadows)
   ------------------------------------------------------------------------- */
function rbox(w, h, d, mat, r = 0.04, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

/* -------------------------------------------------------------------------
   wallWithHole
   What: a flat wall (extruded shape) with an optional rectangular or arched
         opening cut out of it.
   In:   w, h (wall size), hole ({x, y, w, h, arch}) or null, mat, depth
   Out:  THREE.Mesh, wall lying in its local XY plane, origin bottom-centre
   ------------------------------------------------------------------------- */
function wallWithHole(w, h, hole, mat, depth = 0.18) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.lineTo(-w / 2, 0);
  if (hole) {
    const p = new THREE.Path();
    const { x, y, w: hw, h: hh, arch } = hole;
    p.moveTo(x - hw / 2, y);
    p.lineTo(x + hw / 2, y);
    if (arch) {
      // straight jambs then a half-circle on top
      p.lineTo(x + hw / 2, y + hh - hw / 2);
      p.absarc(x, y + hh - hw / 2, hw / 2, 0, Math.PI, false);
    } else {
      p.lineTo(x + hw / 2, y + hh); p.lineTo(x - hw / 2, y + hh);
    }
    p.lineTo(x - hw / 2, y);
    s.holes.push(p);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 32 });
  g.translate(0, 0, -depth / 2);
  // planar UVs in metres so wall textures keep a constant scale
  const uv = g.attributes.uv, pos = g.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 3, pos.getY(i) / 3);
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

/* -------------------------------------------------------------------------
   gradientTexture
   What: vertical CSS-style gradient as a texture (sky outside the window,
         light-shaft falloff).
   In:   stops (array of [offset, colour]), w, h
   Out:  THREE.CanvasTexture
   ------------------------------------------------------------------------- */
function gradientTexture(stops, w = 4, h = 256) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, h);
  stops.forEach(([o, col]) => gr.addColorStop(o, col));
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* =========================================================================
   createRoom — public factory
   What: builds renderer, scene, camera, lights, room and furniture inside
         the given canvas, and returns a small control API.
   In:   canvas (HTMLCanvasElement), opts { mobile, reducedMotion, artURL, onReady }
   Out:  { setProgress, setExplore, setFinish, current, resize, start, stop, dispose }
   ========================================================================= */
export function createRoom(canvas, opts = {}) {
  const mobile = !!opts.mobile;
  // ---- renderer -----------------------------------------------------------
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.75 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // the room is static: bake the shadow map once instead of every frame
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;

  // ---- frame bookkeeping (declared first: setFinish below uses it) ---------
  let running = false, dirty = true, last = 0, frames = 0;
  /* What: flag that a frame is needed.  In: nothing  Out: nothing */
  function requestRender() { dirty = true; }

  // ---- scene, fog and image-based light ------------------------------------
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#d9cfc2');
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.3;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 60);

  // ---- materials (configurable ones are kept to swap maps later) ----------
  const mats = {
    floor: new THREE.MeshStandardMaterial({ roughness: 0.6 }),
    walls: new THREE.MeshStandardMaterial({ roughness: 0.92 }),
    fabric: new THREE.MeshStandardMaterial({ roughness: 0.95 }),
    ceiling: new THREE.MeshStandardMaterial({ color: '#efe9e0', roughness: 0.95 }),
    walnut: new THREE.MeshStandardMaterial({ map: toTexture(FIXED.walnutSlat(), 1, 2, renderer), roughness: 0.55 }),
    oak: new THREE.MeshStandardMaterial({ map: toTexture(FIXED.oakSlat(), 1, 1, renderer), roughness: 0.6 }),
    travertine: new THREE.MeshStandardMaterial({ map: toTexture(FIXED.travertineSlab(), 1, 1, renderer), roughness: 0.48 }),
    terracotta: new THREE.MeshStandardMaterial({ map: toTexture(FIXED.terracotta(), 2, 1, renderer), roughness: 0.85 }),
    rug: new THREE.MeshStandardMaterial({ map: toTexture(FIXED.rug(), 3, 2, renderer), roughness: 1 }),
    bronze: new THREE.MeshStandardMaterial({ color: '#8a6a45', metalness: 0.85, roughness: 0.32 }),
    black: new THREE.MeshStandardMaterial({ color: '#1c1b1a', metalness: 0.4, roughness: 0.4 }),
    ceramic: new THREE.MeshStandardMaterial({ color: '#efe8dc', roughness: 0.35 }),
    leaf: new THREE.MeshStandardMaterial({ color: '#6f7a5a', roughness: 0.8, side: THREE.DoubleSide }),
    bark: new THREE.MeshStandardMaterial({ color: '#5a4636', roughness: 0.95 }),
    glow: new THREE.MeshBasicMaterial({ color: '#ffe2b8' }),
    paper: new THREE.MeshStandardMaterial({ color: '#f6eadb', emissive: '#ffd9a6', emissiveIntensity: 1.6, roughness: 1 }),
    glass: new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.08, roughness: 0.05, metalness: 0 }),
  };

  const root = new THREE.Group();
  scene.add(root);

  // ---- floor & ceiling -------------------------------------------------------
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), mats.floor);
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  root.add(floor);
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(W, D), mats.ceiling);
  ceiling.rotation.x = Math.PI / 2; ceiling.position.y = H;
  root.add(ceiling);
  // indirect light cove: thin glowing strip around the ceiling edge
  [[0, -D / 2 + 0.25, W - 0.5, 0.04], [0, D / 2 - 0.25, W - 0.5, 0.04]].forEach(([x, z, w, d]) => {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, d), mats.glow);
    strip.position.set(x, H - 0.02, z); root.add(strip);
  });

  // ---- walls -----------------------------------------------------------------
  // back wall (z = -D/2): large floor-to-ceiling window on the right half
  const back = wallWithHole(W, H, { x: 2.15, y: 0.0, w: 4.1, h: 3.0 }, mats.walls);
  back.position.set(0, 0, -D / 2); root.add(back);
  // right wall (x = +W/2): arched doorway
  const right = wallWithHole(D, H, { x: 0.6, y: 0, w: 1.5, h: 2.75, arch: true }, mats.walls);
  right.rotation.y = -Math.PI / 2; right.position.set(W / 2, 0, 0); root.add(right);
  // left and front walls are solid
  const left = wallWithHole(D, H, null, mats.walls);
  left.rotation.y = Math.PI / 2; left.position.set(-W / 2, 0, 0); root.add(left);
  const front = wallWithHole(W, H, null, mats.walls);
  front.rotation.y = Math.PI; front.position.set(0, 0, D / 2); root.add(front);

  // corridor behind the arch (slightly darker, gives depth)
  const corridor = new THREE.Mesh(new THREE.BoxGeometry(2.2, H, 3.2), new THREE.MeshStandardMaterial({ color: '#cbbfae', roughness: 0.95, side: THREE.BackSide }));
  corridor.position.set(W / 2 + 1.1, H / 2, 0.6); root.add(corridor);

  // ---- window: slim black frame + mullions + glass -------------------------
  const win = new THREE.Group();
  const fw = 4.1, fh = 3.0, t = 0.045;
  [[0, fh, fw + t, t], [0, 0.0, fw + t, t]].forEach(([x, y, w, h]) => win.add(rbox(w, h, 0.06, mats.black, 0.005, x, y, 0)));
  [-fw / 2, -fw / 6, fw / 6, fw / 2].forEach((x) => win.add(rbox(t, fh, 0.06, mats.black, 0.005, x, fh / 2, 0)));
  win.add(rbox(fw, t * 0.8, 0.05, mats.black, 0.005, 0, 2.25, 0));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh), mats.glass);
  glass.position.y = fh / 2; win.add(glass);
  win.position.set(2.15, 0, -D / 2); root.add(win);

  // outside: warm sky gradient plane and a low garden wall with agave silhouettes
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(30, 14), new THREE.MeshBasicMaterial({ map: gradientTexture([[0, '#f6e7d2'], [0.55, '#f3dcc0'], [1, '#e6c6a3']]) }));
  sky.position.set(2, 4, -D / 2 - 7); root.add(sky);
  const gardenWall = new THREE.Mesh(new THREE.BoxGeometry(14, 1.4, 0.3), new THREE.MeshStandardMaterial({ color: '#d7c3a6', roughness: 1 }));
  gardenWall.position.set(2, 0.7, -D / 2 - 4); gardenWall.receiveShadow = true; root.add(gardenWall);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(16, 8), new THREE.MeshStandardMaterial({ color: '#cdb594', roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(2, -0.01, -D / 2 - 4); ground.receiveShadow = true; root.add(ground);
  addAgaves(root, mats);

  // ---- left wall: walnut slat panel + floating travertine bench -----------
  const slats = new THREE.InstancedMesh(new THREE.BoxGeometry(0.045, H - 0.02, 0.05), mats.walnut, 44);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 44; i++) {
    dummy.position.set(-W / 2 + 0.12, H / 2, -2.9 + i * 0.09);
    dummy.updateMatrix(); slats.setMatrixAt(i, dummy.matrix);
  }
  slats.castShadow = true; slats.receiveShadow = true; root.add(slats);

  // ---- back wall left: recessed niche shelf with LED and ceramics ---------
  const niche = new THREE.Group();
  niche.add(rbox(3.0, 0.06, 0.38, mats.oak, 0.01, 0, 1.15, 0));
  niche.add(rbox(3.0, 0.06, 0.38, mats.oak, 0.01, 0, 1.85, 0));
  const led = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.012, 0.02), mats.glow);
  led.position.set(0, 1.81, 0.15); niche.add(led);
  addVase(niche, mats.ceramic, -0.9, 1.18, 0.0, 0.11, 0.42);
  addVase(niche, mats.terracotta, -0.55, 1.18, 0.02, 0.09, 0.26);
  addVase(niche, mats.black, 0.7, 1.88, 0.0, 0.07, 0.3);
  niche.add(rbox(0.5, 0.08, 0.26, mats.travertine, 0.01, 0.3, 1.22, 0));
  niche.position.set(-2.6, 0, -D / 2 + 0.3); root.add(niche);

  // ---- sofa (fabric is configurable) --------------------------------------
  const sofa = new THREE.Group();
  sofa.add(rbox(1.0, 0.24, 3.0, mats.walnut, 0.03, 0, 0.14, 0));                 // walnut plinth
  sofa.add(rbox(0.95, 0.2, 2.95, mats.fabric, 0.08, 0.02, 0.36, 0));             // seat base
  [-0.98, 0, 0.98].forEach((z) => sofa.add(rbox(0.82, 0.16, 0.95, mats.fabric, 0.07, 0.06, 0.53, z))); // cushions
  sofa.add(rbox(0.22, 0.48, 3.0, mats.fabric, 0.1, -0.4, 0.6, 0));               // backrest
  [-1.5, 1.5].forEach((z) => sofa.add(rbox(0.95, 0.36, 0.18, mats.fabric, 0.08, 0.02, 0.5, z))); // arms
  sofa.add(rbox(0.5, 0.42, 0.14, mats.rug, 0.06, 0.05, 0.72, -0.6));             // throw pillow
  sofa.children[sofa.children.length - 1].rotation.x = 0.25;
  sofa.position.set(-3.85, 0, -0.1); root.add(sofa);

  // ---- rug, coffee table, armchair, side table ----------------------------
  root.add(rbox(4.2, 0.02, 3.0, mats.rug, 0.01, -1.6, 0.01, -0.1));
  const table = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.34, 64), mats.travertine);
  table.position.set(-1.7, 0.17, -0.1); table.castShadow = table.receiveShadow = true; root.add(table);
  root.add(rbox(0.36, 0.06, 0.26, mats.oak, 0.01, -1.85, 0.37, 0.05));            // books
  root.add(rbox(0.3, 0.05, 0.22, mats.black, 0.01, -1.85, 0.42, 0.05));
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mats.bronze);
  bowl.rotation.x = Math.PI; bowl.position.set(-1.45, 0.5, -0.3); bowl.castShadow = true; root.add(bowl);
  const chair = new THREE.Group();
  chair.add(rbox(0.82, 0.36, 0.86, mats.fabric, 0.16, 0, 0.3, 0));
  chair.add(rbox(0.2, 0.56, 0.86, mats.fabric, 0.1, 0.33, 0.62, 0));
  chair.add(rbox(0.86, 0.06, 0.9, mats.walnut, 0.02, 0, 0.09, 0));
  chair.position.set(0.35, 0, 0.35); chair.rotation.y = 0.35; root.add(chair);
  const side = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.5, 48), mats.travertine);
  side.position.set(0.55, 0.25, -0.75); side.castShadow = side.receiveShadow = true; root.add(side);

  // ---- pendant lantern above the table + its warm light -------------------
  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.36, 48, 32), mats.paper);
  lantern.scale.y = 0.82; lantern.position.set(-1.7, 2.35, -0.1); root.add(lantern);
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, H - 2.65, 6), mats.black);
  cord.position.set(-1.7, (H + 2.65) / 2, -0.1); root.add(cord);
  const lamp = new THREE.PointLight('#ffc98f', 3.2, 7, 1.6);
  lamp.position.copy(lantern.position).add(new THREE.Vector3(0, -0.2, 0)); root.add(lamp);

  // ---- sculpture on a plinth near the arch ---------------------------------
  root.add(rbox(0.5, 0.95, 0.5, mats.travertine, 0.01, 4.35, 0.475, -1.55));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 24, 72), mats.bronze);
  ring.position.set(4.35, 1.23, -1.55); ring.rotation.y = 0.6; ring.castShadow = true; root.add(ring);

  // ---- soft contact shadows (fake ambient occlusion under furniture) --------
  const blobTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    gr.addColorStop(0, 'rgba(40,28,18,0.55)'); gr.addColorStop(1, 'rgba(40,28,18,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const blobMat = new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false });
  [[-3.85, -0.1, 1.5, 3.6], [-1.7, -0.1, 1.6, 1.6], [0.35, 0.35, 1.2, 1.2], [0.55, -0.75, 0.7, 0.7], [4.0, -2.75, 1.0, 1.0], [4.35, -1.55, 0.8, 0.8]].forEach(([bx, bz, sx, sz]) => {
    const b = new THREE.Mesh(new THREE.PlaneGeometry(sx, sz), blobMat);
    b.rotation.x = -Math.PI / 2; b.position.set(bx, 0.022, bz); b.renderOrder = 1; root.add(b);
  });

  // ---- olive tree in a terracotta pot by the window ------------------------
  addOlive(root, mats, 4.0, -2.75);

  // ---- framed print of one of his renders on the right wall ---------------
  if (opts.artURL) {
    const frame = rbox(0.06, 1.25, 0.95, mats.oak, 0.01, W / 2 - 0.12, 1.6, 2.15);
    root.add(frame);
    new THREE.TextureLoader().load(opts.artURL, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      const art = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.1), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
      art.rotation.y = -Math.PI / 2; art.position.set(W / 2 - 0.155, 1.6, 2.15); root.add(art);
    });
  }

  // ---- lights -------------------------------------------------------------
  scene.add(new THREE.HemisphereLight('#fff3e2', '#7d6a55', 0.22));
  const sun = new THREE.DirectionalLight('#ffd3a0', 5.0);
  sun.position.set(6.5, 7.5, -12);
  sun.target.position.set(-0.5, 0, 0.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 4, far: 30 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 4;
  scene.add(sun, sun.target);
  // soft fill from the room side so shadows are not black
  const fill = new THREE.DirectionalLight('#e8eefc', 0.35);
  fill.position.set(-3, 3, 6); scene.add(fill);

  // fake volumetric light shafts through the window (additive gradient planes)
  const shaftMat = new THREE.MeshBasicMaterial({ map: gradientTexture([[0, 'rgba(255,226,180,0)'], [0.35, 'rgba(255,226,180,0.55)'], [1, 'rgba(255,226,180,0)']], 4, 128), transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  for (let i = 0; i < 3; i++) {
    const shaft = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 6.5), shaftMat);
    shaft.position.set(1.0 + i * 1.25, 1.55, -1.3);
    shaft.rotation.set(-0.95, 0.42, 0.18);
    root.add(shaft);
  }

  // dust motes floating in the sunlight
  const dustN = mobile ? 140 : 260;
  const dustGeo = new THREE.BufferGeometry();
  const dp = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN; i++) { dp[i * 3] = 0.2 + Math.random() * 4; dp[i * 3 + 1] = 0.2 + Math.random() * 2.6; dp[i * 3 + 2] = -3.2 + Math.random() * 3.5; }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: '#fff1d6', size: 0.012, transparent: true, opacity: 0.7, depthWrite: false }));
  root.add(dust);

  // ---- configurable finishes ----------------------------------------------
  const current = { floor: 'roble', walls: 'yeso', fabric: 'lino' };

  /* -----------------------------------------------------------------------
     setFinish
     What: swap the texture/roughness of one configurable group.
     In:   group ('floor' | 'walls' | 'fabric'), id (finish id)
     Out:  nothing
     ----------------------------------------------------------------------- */
  function setFinish(group, id) {
    const f = FINISHES[group].find((x) => x.id === id);
    if (!f) return;
    const mat = mats[group];
    const old = mat.map;
    mat.map = toTexture(finishCanvas(group, id, mobile ? 512 : 1024), f.rep[0], f.rep[1], renderer);
    mat.roughness = f.rough;
    mat.color.set('#ffffff');
    mat.needsUpdate = true;
    if (old) old.dispose();
    current[group] = id;
    requestRender();
  }
  setFinish('floor', current.floor); setFinish('walls', current.walls); setFinish('fabric', current.fabric);

  // ---- camera path & controls ---------------------------------------------
  const posCurve = new THREE.CatmullRomCurve3(PATH.map((p) => new THREE.Vector3(...p[0])), false, 'centripetal');
  const tgtCurve = new THREE.CatmullRomCurve3(PATH.map((p) => new THREE.Vector3(...p[1])), false, 'centripetal');
  const camPos = new THREE.Vector3(), camTgt = new THREE.Vector3();
  const goalPos = posCurve.getPoint(0), goalTgt = tgtCurve.getPoint(0);
  camPos.copy(goalPos); camTgt.copy(goalTgt);
  const pointer = new THREE.Vector2();
  let explore = false;
  const controls = new OrbitControls(camera, canvas);
  controls.enabled = false;
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 1.2; controls.maxDistance = 5.2;
  controls.minPolarAngle = 0.35; controls.maxPolarAngle = 1.62;
  controls.rotateSpeed = 0.55; controls.zoomSpeed = 0.6;

  /* -----------------------------------------------------------------------
     setProgress
     What: move the camera goal along the scroll path.
     In:   p (0..1 scroll progress of the story)
     Out:  nothing
     ----------------------------------------------------------------------- */
  function setProgress(p) {
    if (explore) return;
    const e = Math.min(1, Math.max(0, p));
    posCurve.getPoint(e, goalPos);
    tgtCurve.getPoint(e, goalTgt);
    requestRender();
  }

  /* -----------------------------------------------------------------------
     setExplore
     What: hand the camera to OrbitControls (true) or back to the path.
     In:   on (boolean)
     Out:  nothing
     ----------------------------------------------------------------------- */
  function setExplore(on) {
    explore = on;
    controls.enabled = on;
    if (on) {
      controls.target.set(-0.6, 0.9, -0.6);
      camera.position.copy(camPos);
      controls.update();
    } else {
      camPos.copy(camera.position);
      camTgt.copy(controls.target);
    }
    requestRender();
  }

  // gentle parallax from the mouse when not exploring (desktop only)
  const onPointer = (e) => {
    pointer.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    requestRender();
  };
  if (!mobile) window.addEventListener('pointermove', onPointer, { passive: true });

  /* -----------------------------------------------------------------------
     resize
     What: fit renderer and camera to the canvas' CSS size; widen the field
           of view in portrait so the room still reads on a phone.
     In:   nothing
     Out:  nothing
     ----------------------------------------------------------------------- */
  function resize() {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 0.8 ? 64 : camera.aspect < 1.2 ? 54 : 42;
    camera.updateProjectionMatrix();
    requestRender();
  }

  // ---- render loop (only runs while visible) ------------------------------
  const clock = new THREE.Clock();

  /* -----------------------------------------------------------------------
     tick
     What: one animation frame — ease the camera, drift the dust, render.
     In:   nothing (called by setAnimationLoop)
     Out:  nothing
     ----------------------------------------------------------------------- */
  function tick() {
    const dt = Math.min(0.05, clock.getDelta());
    last += dt;
    // dust drifts slowly upward and wraps around
    const arr = dustGeo.attributes.position.array;
    for (let i = 1; i < arr.length; i += 3) { arr[i] += dt * 0.03; if (arr[i] > 2.9) arr[i] = 0.2; }
    dustGeo.attributes.position.needsUpdate = true;
    if (explore) {
      controls.update();
      // keep the orbiting camera inside the room
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -W / 2 + 0.4, W / 2 - 0.4);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -D / 2 + 0.4, D / 2 - 0.3);
      camera.position.y = THREE.MathUtils.clamp(camera.position.y, 0.35, H - 0.3);
    } else {
      // critically-damped follow of the scroll goal + small mouse parallax
      const k = opts.reducedMotion ? 1 : 1 - Math.pow(0.0015, dt);
      camPos.lerp(goalPos, k); camTgt.lerp(goalTgt, k);
      const drift = opts.reducedMotion ? 0 : Math.sin(last * 0.25) * 0.05;
      camera.position.set(camPos.x + pointer.x * 0.18 + drift, camPos.y - pointer.y * 0.08, camPos.z);
      camera.lookAt(camTgt);
    }
    renderer.render(scene, camera);
    frames++;
    if (frames === 2 && opts.onReady) opts.onReady();
    dirty = false;
  }

  /* What: start the loop.  In: nothing  Out: nothing */
  function start() { if (running) return; running = true; clock.getDelta(); renderer.setAnimationLoop(tick); }
  /* What: stop the loop (off-screen).  In: nothing  Out: nothing */
  function stop() { running = false; renderer.setAnimationLoop(null); }

  /* -----------------------------------------------------------------------
     dispose
     What: free GPU memory and listeners.
     In:   nothing
     Out:  nothing
     ----------------------------------------------------------------------- */
  function dispose() {
    stop();
    window.removeEventListener('pointermove', onPointer);
    controls.dispose();
    scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    Object.values(mats).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
    envRT.dispose();
    renderer.dispose();
  }

  resize();
  void dirty;
  return { setProgress, setExplore, setFinish, current, resize, start, stop, dispose };
}

/* -------------------------------------------------------------------------
   addVase
   What: lathe-turned ceramic vase.
   In:   parent (Object3D), mat, x, y, z, r (radius), h (height)
   Out:  nothing (adds mesh to parent)
   ------------------------------------------------------------------------- */
function addVase(parent, mat, x, y, z, r, h) {
  const pts = [];
  // profile: foot, belly, shoulder, neck, lip
  const prof = [[0, 0], [0.55, 0], [0.8, 0.1], [1, 0.38], [0.85, 0.7], [0.42, 0.86], [0.38, 1], [0.45, 1.02]];
  prof.forEach(([px, py]) => pts.push(new THREE.Vector2(px * r, py * h)));
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
}

/* -------------------------------------------------------------------------
   addOlive
   What: stylised olive tree: terracotta pot, twisted trunk and an instanced
         cloud of leaves.
   In:   parent, mats, x, z (floor position)
   Out:  nothing
   ------------------------------------------------------------------------- */
function addOlive(parent, mats, x, z) {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.27, 0.62, 48), mats.terracotta);
  pot.position.y = 0.31; pot.castShadow = pot.receiveShadow = true; g.add(pot);
  // trunk as a curved tube
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.55, 0), new THREE.Vector3(0.08, 1.1, 0.05), new THREE.Vector3(-0.06, 1.6, -0.02), new THREE.Vector3(0.05, 2.05, 0.04)]);
  const trunk = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.045, 8, false), mats.bark);
  trunk.castShadow = true; g.add(trunk);
  // leaves: small flattened ellipsoids scattered on three crown spheres
  const leafGeo = new THREE.SphereGeometry(0.05, 6, 4); leafGeo.scale(1, 0.18, 0.38);
  const N = 420;
  const leaves = new THREE.InstancedMesh(leafGeo, mats.leaf, N);
  const d = new THREE.Object3D();
  const crowns = [[0.05, 2.05, 0.04, 0.48], [-0.25, 1.75, 0.1, 0.34], [0.3, 1.8, -0.1, 0.36]];
  for (let i = 0; i < N; i++) {
    const c = crowns[i % 3];
    const u = Math.random() * Math.PI * 2, v = Math.acos(2 * Math.random() - 1), rr = c[3] * Math.cbrt(Math.random());
    d.position.set(c[0] + rr * Math.sin(v) * Math.cos(u), c[1] + rr * Math.cos(v) * 0.75, c[2] + rr * Math.sin(v) * Math.sin(u));
    d.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    d.updateMatrix(); leaves.setMatrixAt(i, d.matrix);
  }
  leaves.castShadow = true; g.add(leaves);
  g.position.set(x, 0, z);
  parent.add(g);
}

/* -------------------------------------------------------------------------
   addAgaves
   What: a few agave / cactus silhouettes in the garden outside the window
         (Aguascalientes desert landscaping, as in his garden projects).
   In:   parent, mats
   Out:  nothing
   ------------------------------------------------------------------------- */
function addAgaves(parent, mats) {
  const mat = new THREE.MeshStandardMaterial({ color: '#7f8a6c', roughness: 0.9 });
  const leaf = new THREE.ConeGeometry(0.06, 0.9, 6); leaf.translate(0, 0.45, 0);
  [[0.6, -6.2], [2.4, -6.6], [4.2, -6.0]].forEach(([ax, az], k) => {
    const g = new THREE.Group();
    for (let i = 0; i < 14; i++) {
      const m = new THREE.Mesh(leaf, mat);
      m.rotation.z = 0.35 + (i % 3) * 0.22;
      m.rotation.y = (i / 14) * Math.PI * 2;
      m.castShadow = true;
      // tilt each blade outward around the rosette centre
      const holder = new THREE.Group(); holder.rotation.y = (i / 14) * Math.PI * 2; holder.add(m); g.add(holder);
    }
    g.position.set(ax, 0, az); g.scale.setScalar(0.9 + k * 0.2);
    parent.add(g);
  });
  // a tall columnar cactus
  const cactus = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 1.8, 6, 12), mat);
  cactus.position.set(3.3, 1.0, -6.4); cactus.castShadow = true; parent.add(cactus);
  void mats;
}
