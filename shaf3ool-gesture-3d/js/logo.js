/* ==========================================================
   logo.js — object #4: the Shaf3ool diamond mark as a real
   motion-design piece (not a turntable):
     · 8 ring segments + a centre gem + 4 accent cubes
     · intro: staggered fly-in with ease-out-back, then a depth "pop"
     · idle: breathing, soft sway, a light sweep across the pieces
     · fist (setBurn): the pieces explode apart, glowing
     · open palm (setGrowth / burn → 0): they fly back together + pop
   Follows the object contract from objects.js.
   ========================================================== */

import * as THREE from "three";

// ---- Shape of the mark (outer diamond, inner hole scale) ----
const OUTER = [new THREE.Vector2(0, 2.2), new THREE.Vector2(1.6, 0), new THREE.Vector2(0, -2.2), new THREE.Vector2(-1.6, 0)];
const INNER_SCALE = 0.5;
const PALETTE = [0x49c27a, 0x3fae6c, 0x2c8a8f, 0x58d08a];
const WHITE = new THREE.Color(0xffffff);
const EMBER = new THREE.Color(0xff5a1f);

/*
 * easeOutBack — overshoots slightly then settles (classic motion-design easing).
 * In:  t — 0..1
 * Out: number (≈0..1.1..1)
 */
function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/*
 * clamp01 — keeps a number in 0..1.
 * In:  v — number
 * Out: number
 */
function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

/*
 * ringSegments — splits the diamond ring into 8 quads (each side cut in half).
 * In:  nothing
 * Out: array of 4-point polygons [outerA, outerB, innerB, innerA] (THREE.Vector2)
 */
function ringSegments() {
  const segs = [];
  // Walk the 4 sides, two halves each
  for (let i = 0; i < 4; i += 1) {
    const a = OUTER[i];
    const b = OUTER[(i + 1) % 4];
    const m = a.clone().lerp(b, 0.5);
    for (const [p, q] of [[a, m], [m, b]]) {
      segs.push([p.clone(), q.clone(), q.clone().multiplyScalar(INNER_SCALE), p.clone().multiplyScalar(INNER_SCALE)]);
    }
  }
  return segs;
}

/*
 * makePiece — extrudes one flat polygon into a bevelled 3D piece centred on itself.
 * In:  poly — THREE.Vector2[]; color — hex
 * Out: THREE.Mesh positioned at the polygon's centroid
 */
function makePiece(poly, color) {
  const c = poly.reduce((acc, p) => acc.add(p), new THREE.Vector2()).multiplyScalar(1 / poly.length);
  const shape = new THREE.Shape(poly.map((p) => p.clone().sub(c)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.6, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.06, bevelSegments: 1 });
  geo.translate(0, 0, -0.3);   // centre the depth so z-pops scale symmetrically
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, flatShading: true, metalness: 0.3, roughness: 0.45 }));
  mesh.position.set(c.x, c.y, 0);
  return mesh;
}

/*
 * createLogo — builds the animated Shaf3ool mark.
 * In:  nothing
 * Out: object contract { group, emitters, autoRotate:false, setBurn, setGrowth, update }
 */
export function createLogo() {
  const group = new THREE.Group();
  const pieces = [];   // every animated part with its home + motion data
  const rand = (a, b) => a + Math.random() * (b - a);

  /*
   * addPiece — registers a mesh with its home pose, intro start pose and explode direction.
   * In:  mesh — THREE.Mesh at its home position; delay — intro stagger in seconds
   * Out: nothing
   */
  const addPiece = (mesh, delay) => {
    const home = mesh.position.clone();
    const dir = home.lengthSq() > 0.01 ? home.clone().normalize() : new THREE.Vector3(0, 0, 1);
    pieces.push({
      mesh,
      home,
      delay,
      start: home.clone().add(dir.clone().multiplyScalar(7)).add(new THREE.Vector3(rand(-2, 2), rand(-2, 2), rand(2, 6))),
      startRot: new THREE.Euler(rand(-3, 3), rand(-3, 3), rand(-3, 3)),
      blast: dir.clone().multiplyScalar(rand(2.2, 3.4)).add(new THREE.Vector3(0, 0, rand(-1.5, 2.5))),
      blastRot: new THREE.Euler(rand(-2.5, 2.5), rand(-2.5, 2.5), rand(-2.5, 2.5)),
    });
    group.add(mesh);
  };

  // Ring segments fly in clockwise, one after another
  ringSegments().forEach((poly, i) => addPiece(makePiece(poly, PALETTE[i % PALETTE.length]), i * 0.09));

  // Centre gem arrives last (the "hero" beat)
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.6, 0), new THREE.MeshStandardMaterial({ color: 0xf2f5ff, flatShading: true, metalness: 0.35, roughness: 0.3 }));
  gem.scale.set(0.85, 1.3, 0.85);
  addPiece(gem, 0.95);

  // Four accent cubes settle at the corners
  OUTER.forEach((p, i) => {
    const cube = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), new THREE.MeshStandardMaterial({ color: i % 2 ? 0xffc93c : 0xf2f5ff, flatShading: true }));
    cube.position.set(p.x * 1.32, p.y * 1.18, 0.2);
    addPiece(cube, 1.1 + i * 0.06);
  });

  // Motion state
  let age = 0;            // seconds since the intro started
  let explode = 0;        // 0 = assembled, 1 = fully blown apart (driven by setBurn)
  let glow = 0;           // ember glow while burning
  let pop = 0;            // 0..1 replay of the depth pop (driven by setGrowth)
  const introEnd = 1.1 + 3 * 0.06 + 0.9;   // last piece delay + its flight time

  /*
   * setBurn — fist: pieces explode outward and glow orange.
   * In:  t — 0..1 explode amount; g — 0..1 ember glow
   * Out: nothing
   */
  function setBurn(t, g = 0) {
    explode = t;
    glow = g;
  }

  /*
   * setGrowth — open palm: plays the depth pop as the pieces land.
   * In:  t — 0..1 progress
   * Out: nothing
   */
  function setGrowth(t) {
    pop = t;
  }

  /*
   * update — runs the intro, idle breathing / sway / light sweep, explode and pop.
   * In:  dt — seconds since last frame; time — total seconds
   * Out: nothing
   */
  function update(dt, time) {
    age += dt;
    // Light sweep: a band of light crosses the mark every ~4.5 s (pauses between passes)
    const sweepX = ((time * 1.1) % 5) * 3 - 4.5;
    // Depth pop after the intro, and again on every "regrow"
    const introPop = clamp01((age - introEnd) / 0.6);
    const zPop = 1 + Math.sin(introPop * Math.PI) * 0.45 + Math.sin(pop * Math.PI) * 0.4;
    const e = explode * explode * (3 - 2 * explode);   // smoothstep for a softer burst

    pieces.forEach((p, i) => {
      // Intro flight with overshoot
      const k = easeOutBack(clamp01((age - p.delay) / 0.9));
      const m = p.mesh;
      m.position.lerpVectors(p.start, p.home, k);
      m.position.addScaledVector(p.blast, e);
      m.position.y += Math.sin(time * 1.4 + i * 0.7) * 0.03;           // tiny float per piece
      m.rotation.set(
        p.startRot.x * (1 - k) + p.blastRot.x * e,
        p.startRot.y * (1 - k) + p.blastRot.y * e + (m === gem ? time * 0.8 : 0),
        p.startRot.z * (1 - k) + p.blastRot.z * e,
      );
      const s = Math.max(0.001, Math.min(1, k * 1.05));
      m.scale.set(s, s, s * zPop);
      if (m === gem) m.scale.set(0.85 * s, 1.3 * s, 0.85 * s * zPop);
      // Shine where the sweep band passes + ember glow while exploded
      const shine = Math.max(0, 1 - Math.abs(m.position.x + m.position.y * 0.35 - sweepX) / 0.8) * 0.9;
      m.material.emissive.copy(WHITE).multiplyScalar(shine).lerp(EMBER, Math.min(1, glow * 0.6 + e * 0.15));
    });

    // Whole-mark breathing and soft sway (no full turntable spin)
    const breathe = 1 + Math.sin(time * 1.6) * 0.025;
    group.scale.setScalar(breathe);
    group.rotation.y = Math.sin(time * 0.5) * 0.32;
    group.rotation.x = Math.sin(time * 0.37) * 0.08;
  }

  // Fire / smoke start around the ring
  const emitters = OUTER.flatMap((p, i) => [new THREE.Vector3(p.x, p.y, 0.4), OUTER[i].clone().lerp(OUTER[(i + 1) % 4], 0.5)]).map((v) => new THREE.Vector3(v.x, v.y, 0.4));

  return { group, emitters, autoRotate: false, setBurn, setGrowth, update };
}
