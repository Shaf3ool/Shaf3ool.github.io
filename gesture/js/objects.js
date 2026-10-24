/* ==========================================================
   objects.js — the swappable 3D OBJECTS the hand controls.

   THE OBJECT CONTRACT (every object, built-in or loaded):
     {
       group:      THREE.Group   — the model, centred at (0,0,0), ~5 units wide
       emitters:   THREE.Vector3[] — where fire / smoke particles start
       setBurn?:   (t, glow) => void — custom "fire" look (0..1)
       setGrowth?: (t) => void       — custom "regrow / sparkle" animation (0..1)
       update?:    (dt, time) => void — ambient animation every frame
       autoRotate?: boolean — false = no idle turntable spin (logo has its own motion)
     }
   Missing hooks get sensible defaults (glow + bounce) from withDefaults().

   To add your own model: call loadGLTFObject(urlOrFile) — any .glb/.gltf
   (product, logo, food item…) — or add a builder to OBJECTS below.
   ========================================================== */

import * as THREE from "three";
import { createIsland } from "./island.js";
import { createLogo } from "./logo.js";

// Decoder for Draco-compressed models (common on Sketchfab / Poly Pizza exports)
const DRACO_DECODER = "https://www.gstatic.com/draco/versioned/decoders/1.5.7/";
// Every object is resized to fit inside this many scene units
const FIT_SIZE = 5.2;

/*
 * mat — matte, flat-shaded low-poly material.
 * In:  color — hex number; extra — optional material options
 * Out: THREE.MeshStandardMaterial
 */
function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, metalness: 0, ...extra });
}

/*
 * ringPoints — evenly spaced points on a horizontal circle (fire spawn spots).
 * In:  n — count; radius — circle radius; y — height
 * Out: THREE.Vector3[]
 */
function ringPoints(n, radius, y) {
  const pts = [];
  // Walk round the circle
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius));
  }
  return pts;
}

/*
 * withDefaults — fills any missing contract hook with a generic version:
 * burn = orange emissive glow on every material, growth = a springy bounce.
 * In:  obj — partial object contract
 * Out: full object contract
 */
export function withDefaults(obj) {
  const materials = [];
  // Collect every material that can glow
  obj.group.traverse((o) => {
    if (o.isMesh) {
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (m && m.emissive && !materials.includes(m)) materials.push(m);
      }
    }
  });
  const baseEmissive = materials.map((m) => m.emissive.clone());
  const ember = new THREE.Color(0xff5a1f);

  return {
    ...obj,
    emitters: obj.emitters && obj.emitters.length ? obj.emitters : ringPoints(12, 1.6, 1.2),
    update: obj.update || (() => {}),
    setBurn:
      obj.setBurn ||
      ((t, glow = 0) => {
        materials.forEach((m, i) => m.emissive.copy(baseEmissive[i]).lerp(ember, Math.max(t * 0.25, glow * 0.45)));
      }),
    setGrowth:
      obj.setGrowth ||
      ((t) => {
        // Damped spring: overshoots a little, then settles at 1
        const s = 1 + Math.sin(t * Math.PI * 3) * (1 - t) * 0.18;
        obj.group.scale.setScalar(s);
      }),
  };
}

/*
 * createCoffeeCup — object #2: low-poly cup on a saucer with rising steam spots.
 * In:  nothing
 * Out: object contract (partial — defaults fill the rest)
 */
function createCoffeeCup() {
  const group = new THREE.Group();
  // Cup body: a lathe (profile spun around Y) with few segments = faceted
  const profile = [
    [0.0, 0], [1.05, 0], [1.25, 0.25], [1.5, 1.4], [1.62, 2.3], [1.5, 2.3], [1.38, 1.45], [1.1, 0.3], [0.0, 0.3],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const cup = new THREE.Mesh(new THREE.LatheGeometry(profile, 10), mat(0xf3ede4, { side: THREE.DoubleSide }));
  cup.position.y = -0.9;
  group.add(cup);

  // Coffee surface + a lighter latte-art disc
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(1.44, 10), mat(0x5a3423));
  coffee.rotation.x = -Math.PI / 2;
  coffee.position.y = 1.15;
  group.add(coffee);
  const art = new THREE.Mesh(new THREE.CircleGeometry(0.55, 6), mat(0xd9b48a));
  art.rotation.x = -Math.PI / 2;
  art.position.y = 1.16;
  group.add(art);

  // Handle: half a torus on the side
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.15, 5, 8, Math.PI), mat(0xf3ede4));
  handle.rotation.z = -Math.PI / 2;
  handle.position.set(1.55, 0.3, 0);
  group.add(handle);

  // Saucer
  const saucer = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 1.6, 0.25, 12), mat(0x2c8a8f));
  saucer.position.y = -1.05;
  group.add(saucer);

  // Accent band on the cup (brand colour)
  const band = new THREE.Mesh(new THREE.CylinderGeometry(1.53, 1.47, 0.35, 10, 1, true), mat(0x49c27a));
  band.position.y = 0.55;
  group.add(band);

  return { group, emitters: ringPoints(8, 0.8, 1.3) };
}

/*
 * createBurger — object #3: stacked low-poly burger (bun, salad, tomato, cheese, patty).
 * In:  nothing
 * Out: object contract (partial)
 */
function createBurger() {
  const group = new THREE.Group();
  let y = -0.95;  // build the stack from the bottom up (stack ends up centred)

  /*
   * layer — adds one cylinder slice to the stack.
   * In:  rTop, rBottom, h — size; color — hex; segs — facets
   * Out: THREE.Mesh
   */
  const layer = (rTop, rBottom, h, color, segs = 10) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segs), mat(color));
    m.position.y = y + h / 2;
    y += h;
    group.add(m);
    return m;
  };

  // Bottom to top
  layer(1.9, 1.75, 0.55, 0xd9953f);           // bottom bun
  layer(2.05, 2.05, 0.5, 0x5b3622);           // patty
  const cheese = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 3.2), mat(0xffc93c));
  cheese.position.y = y + 0.06;
  cheese.rotation.y = Math.PI / 4;
  group.add(cheese);
  y += 0.12;
  layer(1.95, 1.95, 0.18, 0xd8402b, 9);        // tomato
  const salad = layer(2.25, 2.1, 0.16, 0x58b84a, 7);  // lettuce
  salad.rotation.y = 0.3;

  // Top bun: half sphere, low poly
  const top = new THREE.Mesh(new THREE.SphereGeometry(1.95, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xe0a24a));
  top.scale.y = 0.72;
  top.position.y = y;
  group.add(top);

  // Sesame seeds scattered on the bun
  const seedMat = mat(0xfff3d6);
  for (let i = 0; i < 18; i += 1) {
    const a = i * 2.4;
    const r = 0.3 + (i % 6) * 0.22;
    const seed = new THREE.Mesh(new THREE.TetrahedronGeometry(0.07, 0), seedMat);
    const h = Math.sqrt(Math.max(0, 1.95 * 1.95 - r * r)) * 0.72;
    seed.position.set(Math.cos(a) * r, y + h, Math.sin(a) * r);
    group.add(seed);
  }
  return { group, emitters: ringPoints(10, 1.4, y + 0.9) };
}

/*
 * fitToSize — centres any model on (0,0,0) and scales it to FIT_SIZE.
 * In:  root — THREE.Object3D
 * Out: THREE.Group wrapping the fitted model
 */
export function fitToSize(root) {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  // Move the model's centre to the origin, then scale its largest side
  root.position.sub(center);
  const holder = new THREE.Group();
  holder.add(root);
  holder.scale.setScalar(FIT_SIZE / Math.max(size.x, size.y, size.z, 1e-6));
  const wrap = new THREE.Group();
  wrap.add(holder);
  return wrap;
}

/*
 * sampleEmitters — picks random vertex positions on the upper half of a model,
 * so fire/smoke appear to come from the model itself.
 * In:  group — fitted model group; n — how many points
 * Out: THREE.Vector3[] in the group's space
 */
export function sampleEmitters(group, n = 24) {
  const pts = [];
  const v = new THREE.Vector3();
  group.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(group.matrixWorld).invert();
  // Gather candidate vertices from every mesh
  group.traverse((o) => {
    if (!o.isMesh || !o.geometry.attributes.position) return;
    const pos = o.geometry.attributes.position;
    const step = Math.max(1, Math.floor(pos.count / 200));
    for (let i = 0; i < pos.count; i += step) {
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld).applyMatrix4(inv);
      if (v.y > -0.2) pts.push(v.clone());
    }
  });
  // Shuffle-pick n of them
  const out = [];
  for (let i = 0; i < n && pts.length; i += 1) out.push(pts[(Math.random() * pts.length) | 0]);
  return out;
}

/*
 * loadGLTFObject — loads ANY glTF/GLB model and turns it into an object.
 * Works with a URL (CORS must allow it) or a File picked by the user
 * (stays on the device). Draco-compressed files are supported.
 * In:  source — string URL | File
 * Out: Promise<object contract>
 */
export async function loadGLTFObject(source) {
  // Loaders are fetched only when needed, so the first page load stays light
  const [{ GLTFLoader }, { DRACOLoader }] = await Promise.all([
    import("three/addons/loaders/GLTFLoader.js"),
    import("three/addons/loaders/DRACOLoader.js"),
  ]);
  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath(DRACO_DECODER);
  loader.setDRACOLoader(draco);

  // A local File becomes a temporary blob: URL
  const url = typeof source === "string" ? source : URL.createObjectURL(source);
  try {
    const gltf = await loader.loadAsync(url);
    const group = fitToSize(gltf.scene);
    return { group, emitters: sampleEmitters(group) };
  } finally {
    if (typeof source !== "string") URL.revokeObjectURL(url);
    draco.dispose();
  }
}

// ---- Registry of built-in objects (id → label + builder) ----
export const OBJECTS = [
  { id: "island", label: "🌲 Island", build: createIsland },
  { id: "coffee", label: "☕ Coffee", build: createCoffeeCup },
  { id: "burger", label: "🍔 Burger", build: createBurger },
  { id: "logo", label: "◆ Logo", build: createLogo },
];

/*
 * buildObject — creates a built-in object by id, with defaults filled in.
 * In:  id — one of OBJECTS[].id
 * Out: full object contract
 */
export function buildObject(id) {
  const entry = OBJECTS.find((o) => o.id === id) || OBJECTS[0];
  return withDefaults(entry.build());
}
