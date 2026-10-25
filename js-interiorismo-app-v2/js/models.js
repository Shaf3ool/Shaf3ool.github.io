/* =========================================================================
   models.js — procedural 3D furniture (Three.js), built from rounded boxes
   Units: metres. Each builder returns a THREE.Group whose origin is the
   centre of the footprint on the floor; front faces +z (matches 2D +y).
   ========================================================================= */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// --- shared materials (created once, reused by every piece) ---------------
const M = {};

/**
 * What: lazily create the shared material palette.
 * In:  —
 * Out: object of THREE.MeshStandardMaterial
 */
function mats() {
  if (M.linen) return M;
  const std = (color, rough = 0.85, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
  M.linen = std('#E6DAC6', 0.95);
  M.linen2 = std('#D8C8AE', 0.95);
  M.cushion = std('#F2E9DA', 0.97);
  M.terra = std('#B8643E', 0.9);
  M.olive = std('#6E7656', 0.9);
  M.walnut = std('#6E4B34', 0.55);
  M.walnutL = std('#8A6247', 0.55);
  M.oak = std('#CDA77B', 0.6);
  M.stone = std('#E8DDCB', 0.35);
  M.black = std('#2A2522', 0.45, 0.4);
  M.white = std('#FBF7F0', 0.95);
  M.pot = std('#B0603C', 0.8);
  M.leaf = new THREE.MeshStandardMaterial({ color: '#6E7656', roughness: 0.7, side: THREE.DoubleSide });
  M.rug = std('#F0E5D2', 1);
  M.rugBorder = std('#C98663', 1);
  return M;
}

const geoCache = new Map();

/**
 * What: cached rounded-box geometry.
 * In:  w, h, d (m), r (radius m)
 * Out: THREE.BufferGeometry
 */
function rbox(w, h, d, r = 0.02) {
  const k = [w, h, d, r].map((v) => v.toFixed(3)).join('|');
  if (!geoCache.has(k)) geoCache.set(k, new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.1, h / 2.1, d / 2.1)));
  return geoCache.get(k);
}

/**
 * What: add a mesh to a group at a position, with shadows on.
 * In:  g (Group), geo, mat, x, y, z (m; y = bottom of the box if box=true)
 * Out: the mesh
 */
function add(g, geo, mat, x, y, z) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  g.add(m);
  return m;
}

/**
 * What: build the 3D model for a catalogue piece.
 * In:  type (string), wcm, dcm (footprint in cm)
 * Out: THREE.Group
 */
export function buildPiece(type, wcm, dcm) {
  const m = mats();
  const g = new THREE.Group();
  const w = wcm / 100, d = dcm / 100;
  // --- per type -------------------------------------------------------------
  if (type === 'sofa') {
    add(g, rbox(w, 0.22, d, 0.05), m.linen, 0, 0.17, 0);                       // base
    add(g, rbox(w - 0.1, 0.42, 0.2, 0.08), m.linen2, 0, 0.5, -d / 2 + 0.12);   // back
    add(g, rbox(0.2, 0.38, d - 0.04, 0.07), m.linen2, -w / 2 + 0.1, 0.42, 0.02); // arms
    add(g, rbox(0.2, 0.38, d - 0.04, 0.07), m.linen2, w / 2 - 0.1, 0.42, 0.02);
    const cw = (w - 0.44) / 3;
    for (let i = 0; i < 3; i++) add(g, rbox(cw - 0.02, 0.14, d - 0.3, 0.06), m.cushion, -w / 2 + 0.22 + cw / 2 + i * cw, 0.34, 0.08);
    add(g, rbox(0.42, 0.36, 0.13, 0.06), m.terra, -w / 2 + 0.48, 0.55, -d / 2 + 0.3).rotation.set(-0.2, 0.15, 0.05);
    add(g, rbox(0.4, 0.34, 0.12, 0.06), m.olive, w / 2 - 0.48, 0.55, -d / 2 + 0.3).rotation.set(-0.2, -0.15, -0.05);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(g, rbox(0.04, 0.06, 0.04, 0.01), m.walnut, sx * (w / 2 - 0.08), 0.03, sz * (d / 2 - 0.08));
  } else if (type === 'mesa') {
    add(g, rbox(w, 0.045, d, 0.015), m.walnutL, 0, 0.75, 0);                    // top
    for (const sx of [-1, 1]) add(g, rbox(0.06, 0.73, d * 0.6, 0.02), m.walnut, sx * (w / 2 - 0.18), 0.365, 0);
    const cx = w / 3.2;
    // six chairs: seat + backrest + legs
    for (const x of [-cx, 0, cx]) for (const side of [-1, 1]) {
      const c = new THREE.Group();
      add(c, rbox(0.44, 0.05, 0.42, 0.02), m.oak, 0, 0.45, 0);
      add(c, rbox(0.42, 0.34, 0.04, 0.02), m.oak, 0, 0.68, -0.2);
      for (const lx of [-0.18, 0.18]) for (const lz of [-0.17, 0.17]) add(c, rbox(0.03, 0.44, 0.03, 0.01), m.walnut, lx, 0.22, lz);
      add(c, rbox(0.38, 0.03, 0.34, 0.015), m.linen, 0, 0.49, 0.02);
      c.position.set(x, 0, side * (d / 2 + 0.06));
      c.rotation.y = side > 0 ? Math.PI : 0;
      g.add(c);
    }
  } else if (type === 'cama') {
    add(g, rbox(w, 0.28, d, 0.04), m.walnutL, 0, 0.18, 0);                     // frame
    add(g, rbox(w, 1.0, 0.1, 0.04), m.walnut, 0, 0.5, -d / 2 + 0.05);          // headboard
    add(g, rbox(w - 0.1, 0.22, d - 0.2, 0.08), m.white, 0, 0.42, 0.06);        // mattress + duvet
    add(g, rbox(w / 2 - 0.16, 0.14, 0.32, 0.07), m.white, -w / 4 + 0.02, 0.58, -d / 2 + 0.32);
    add(g, rbox(w / 2 - 0.16, 0.14, 0.32, 0.07), m.white, w / 4 - 0.02, 0.58, -d / 2 + 0.32);
    add(g, rbox(w - 0.04, 0.05, 0.42, 0.02), m.terra, 0, 0.55, d / 2 - 0.36);   // throw
    for (const sx of [-1, 1]) add(g, rbox(0.42, 0.5, 0.4, 0.03), m.oak, sx * (w / 2 + 0.28), 0.25, -d / 2 + 0.26); // nightstands
  } else if (type === 'closet') {
    const h = 2.3;
    add(g, rbox(w, h, d, 0.015), m.oak, 0, h / 2, 0);
    const n = Math.max(2, Math.round(wcm / 60));
    // door seams + slim black pulls
    for (let i = 1; i < n; i++) add(g, rbox(0.006, h - 0.04, 0.01, 0.002), m.walnut, -w / 2 + (w / n) * i, h / 2, d / 2 + 0.002);
    for (let i = 0; i < n; i++) add(g, rbox(0.012, 0.5, 0.02, 0.005), m.black, -w / 2 + (w / n) * (i + (i % 2 ? 0.12 : 0.88)), 1.05, d / 2 + 0.012);
    add(g, rbox(w, 0.06, d - 0.04, 0.01), m.walnut, 0, 0.03, -0.01);
  } else if (type === 'isla') {
    add(g, rbox(w - 0.08, 0.86, d - 0.1, 0.02), m.oak, 0, 0.43, -0.03);       // base
    add(g, rbox(w, 0.05, d, 0.012), m.stone, 0, 0.885, 0);                     // stone top
    add(g, rbox(0.5, 0.012, 0.36, 0.004), m.black, w / 5, 0.912, -0.08);       // cooktop
    for (const x of [-w / 3.2, 0, w / 3.2]) {
      // stools
      add(g, new THREE.CylinderGeometry(0.17, 0.17, 0.05, 28), m.linen, x, 0.66, d / 2 + 0.22);
      add(g, new THREE.CylinderGeometry(0.02, 0.025, 0.64, 10), m.black, x, 0.32, d / 2 + 0.22);
      add(g, new THREE.CylinderGeometry(0.14, 0.14, 0.015, 24), m.black, x, 0.008, d / 2 + 0.22);
    }
  } else if (type === 'planta') {
    const r = w / 2;
    add(g, new THREE.CylinderGeometry(r * 0.62, r * 0.48, 0.42, 32), m.pot, 0, 0.21, 0);
    // leaves: flattened ellipsoids fanning out
    const leafGeo = new THREE.SphereGeometry(1, 12, 8);
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2, tilt = 0.35 + (i % 3) * 0.18;
      const leaf = add(g, leafGeo, m.leaf, Math.cos(a) * 0.08, 0.72 + (i % 4) * 0.08, Math.sin(a) * 0.08);
      leaf.scale.set(0.05, 0.32, 0.012);
      leaf.rotation.set(0, -a, 0); leaf.rotateZ(tilt); leaf.translateY(0.2);
    }
  } else if (type === 'tapete') {
    add(g, rbox(w, 0.012, d, 0.005), m.rugBorder, 0, 0.006, 0);
    add(g, rbox(w - 0.16, 0.014, d - 0.16, 0.005), m.rug, 0, 0.007, 0);
  }
  return g;
}

/**
 * What: free GPU geometry for pieces built with non-cached geometries.
 * In:  group (THREE.Object3D)
 * Out: —
 */
export function disposePiece(group) {
  group.traverse((o) => {
    if (o.isMesh && !(o.geometry instanceof RoundedBoxGeometry) && o.geometry.type !== 'SphereGeometry') o.geometry.dispose();
  });
}
