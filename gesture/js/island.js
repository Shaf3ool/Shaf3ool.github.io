/* ==========================================================
   island.js — object #1: the floating low-poly forest island
   (the one from the reel), built entirely in code — no model
   file to download or license. It follows the same "object"
   contract as every model in objects.js, plus custom burn /
   regrow behaviour for its trees.
   ========================================================== */

import * as THREE from "three";

// ---- Palette ----
const COLORS = {
  rock: 0x6b5a4e,
  rockDark: 0x4a3d36,
  grass: 0x5dae4f,
  trunk: 0x7a4f32,
  leaves: [0x3fa35b, 0x2f8a4e, 0x63bd63],
  burnt: 0x241d1a,
  ember: 0xff5a1f,
  water: 0x3fa7d6,
  cloud: 0xf4f7ff,
};

/*
 * makeRandom — tiny seeded random generator (same island every load).
 * In:  seed — integer
 * Out: function() → number 0..1
 */
function makeRandom(seed) {
  let s = seed >>> 0;
  return function random() {
    // Mulberry32: fast, good enough for decoration
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/*
 * jitter — nudges every vertex a little for a hand-made, faceted look.
 * Vertices sharing a position move together, so no cracks appear.
 * In:  geometry — THREE.BufferGeometry; amount — max offset; seed — integer
 * Out: the same geometry (modified in place)
 */
function jitter(geometry, amount, seed) {
  const pos = geometry.attributes.position;
  const v = new THREE.Vector3();
  // Hash each position so duplicated seam vertices get the same offset
  for (let i = 0; i < pos.count; i += 1) {
    v.fromBufferAttribute(pos, i);
    const key = Math.round(v.x * 100) * 73856093 ^ Math.round(v.y * 100) * 19349663 ^ Math.round(v.z * 100) * 83492791;
    const r = makeRandom(key ^ seed);
    pos.setXYZ(i, v.x + (r() - 0.5) * amount, v.y + (r() - 0.5) * amount, v.z + (r() - 0.5) * amount);
  }
  geometry.computeVertexNormals();
  return geometry;
}

/*
 * flatMat — a matte, flat-shaded material (the low-poly look).
 * In:  color — hex number
 * Out: THREE.MeshStandardMaterial
 */
function flatMat(color) {
  return new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.92, metalness: 0 });
}

/*
 * buildBase — the rocky underside and grassy top of the island.
 * In:  group — THREE.Group to add meshes to
 * Out: nothing
 */
function buildBase(group) {
  // Upside-down rocky cone
  const rockGeo = jitter(new THREE.CylinderGeometry(3, 0.5, 2.6, 10, 4), 0.35, 11);
  const rock = new THREE.Mesh(rockGeo, flatMat(COLORS.rock));
  rock.position.y = -1.45;
  group.add(rock);

  // A darker dangling chunk for silhouette interest
  const chunk = new THREE.Mesh(jitter(new THREE.ConeGeometry(0.6, 1.4, 6), 0.2, 5), flatMat(COLORS.rockDark));
  chunk.rotation.x = Math.PI;
  chunk.position.set(0.9, -2.55, 0.4);
  group.add(chunk);

  // Grass cap on top
  const grassGeo = jitter(new THREE.CylinderGeometry(3.15, 3.0, 0.32, 10, 1), 0.12, 23);
  const grass = new THREE.Mesh(grassGeo, flatMat(COLORS.grass));
  group.add(grass);

  // Small pond
  const pond = new THREE.Mesh(new THREE.CircleGeometry(0.7, 7), new THREE.MeshStandardMaterial({ color: COLORS.water, flatShading: true, roughness: 0.25 }));
  pond.rotation.x = -Math.PI / 2;
  pond.position.set(-1.1, 0.175, 1.0);
  group.add(pond);
}

/*
 * buildTree — one low-poly tree (pine or round), sharing materials.
 * In:  kind — "pine" | "round"; leafMat, trunkMat — materials; scale — size
 * Out: { tree: THREE.Group, top: number } — top = height of the crown in local units
 */
function buildTree(kind, leafMat, trunkMat, scale) {
  const tree = new THREE.Group();
  // Trunk
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 0.5, 5), trunkMat);
  trunk.position.y = 0.25;
  tree.add(trunk);

  // Crown: stacked cones for pines, a faceted ball for round trees
  if (kind === "pine") {
    for (let k = 0; k < 3; k += 1) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.42 - k * 0.1, 0.55, 6), leafMat);
      cone.position.y = 0.6 + k * 0.32;
      tree.add(cone);
    }
  } else {
    const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), leafMat);
    ball.position.y = 0.85;
    tree.add(ball);
  }
  tree.scale.setScalar(scale);
  return { tree, top: (kind === "pine" ? 1.45 : 1.2) * scale };
}

/*
 * buildForest — scatters trees and rocks over the grass, avoiding the pond.
 * In:  group — island group; random — seeded generator
 * Out: { leafMats, trees, emitters } — materials to recolour, tree groups, fire spawn points
 */
function buildForest(group, random) {
  const leafMats = COLORS.leaves.map((c) => flatMat(c));
  const trunkMat = flatMat(COLORS.trunk);
  const trees = [];
  const emitters = [];

  // Place ~26 trees on a jittered spiral so they never clump
  for (let i = 0; i < 26; i += 1) {
    const a = i * 2.399 + random() * 0.4;           // golden-angle spiral
    const r = 0.45 + Math.sqrt(i / 26) * 2.35;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (Math.hypot(x + 1.1, z - 1.0) < 0.85) continue;  // keep the pond clear
    const kind = random() > 0.35 ? "pine" : "round";
    const { tree, top } = buildTree(kind, leafMats[i % leafMats.length], trunkMat, 0.75 + random() * 0.55);
    tree.position.set(x, 0.16, z);
    tree.rotation.y = random() * Math.PI;
    tree.userData.baseScale = tree.scale.x;
    group.add(tree);
    trees.push(tree);
    emitters.push(new THREE.Vector3(x, 0.16 + top * 0.7, z));
  }

  // A few grey boulders for texture
  const rockMat = flatMat(0x8d8a86);
  for (let i = 0; i < 7; i += 1) {
    const b = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12 + random() * 0.14, 0), rockMat);
    const a = random() * Math.PI * 2;
    const r = 1 + random() * 1.8;
    b.position.set(Math.cos(a) * r, 0.2, Math.sin(a) * r);
    group.add(b);
  }
  return { leafMats, trees, emitters };
}

/*
 * buildClouds — three puffy clouds that orbit the island.
 * In:  group — island group
 * Out: THREE.Group — the cloud ring (rotate it to animate)
 */
function buildClouds(group) {
  const ring = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: COLORS.cloud, flatShading: true, roughness: 1, transparent: true, opacity: 0.92 });
  // Each cloud = 3 overlapping faceted balls
  for (let c = 0; c < 3; c += 1) {
    const cloud = new THREE.Group();
    for (let k = 0; k < 3; k += 1) {
      const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32 - k * 0.06, 0), mat);
      puff.position.set(k * 0.32 - 0.3, k === 1 ? 0.1 : 0, 0);
      cloud.add(puff);
    }
    const a = (c / 3) * Math.PI * 2;
    cloud.position.set(Math.cos(a) * 3.9, 1.6 + c * 0.35, Math.sin(a) * 3.9);
    ring.add(cloud);
  }
  group.add(ring);
  return ring;
}

/*
 * createIsland — assembles the full island and returns its controls.
 * In:  nothing
 * Out: object contract { group, emitters, setBurn(t, glow), setGrowth(t), update(dt, time) }
 */
export function createIsland() {
  const random = makeRandom(20261024);
  const group = new THREE.Group();
  buildBase(group);
  const { leafMats, trees, emitters } = buildForest(group, random);
  const clouds = buildClouds(group);

  // Remember the healthy colours so burning can be undone
  const healthy = leafMats.map((m) => m.color.clone());
  const burnt = new THREE.Color(COLORS.burnt);
  const ember = new THREE.Color(COLORS.ember);

  /*
   * setBurn — blends the leaves from green (0) to charred with glowing embers (1).
   * In:  t — 0..1 burn amount; glow — 0..1 ember intensity
   * Out: nothing
   */
  function setBurn(t, glow = 0) {
    leafMats.forEach((m, i) => {
      m.color.copy(healthy[i]).lerp(burnt, t);
      m.emissive.copy(ember).multiplyScalar(glow * 0.55);
    });
  }

  /*
   * setGrowth — scales every tree from 0 (sapling) to 1 (full size).
   * In:  t — 0..1
   * Out: nothing
   */
  function setGrowth(t) {
    const eased = 1 - Math.pow(1 - t, 3);   // ease-out cubic
    for (const tree of trees) tree.scale.setScalar(tree.userData.baseScale * (0.15 + 0.85 * eased));
  }

  /*
   * update — per-frame ambient animation (clouds orbit the island).
   * In:  dt — seconds since last frame
   * Out: nothing
   */
  function update(dt) {
    clouds.rotation.y += dt * 0.12;
  }

  return { group, emitters, setBurn, setGrowth, update };
}
