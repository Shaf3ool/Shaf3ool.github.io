/* ==========================================================
   particles.js — lightweight GPU point particles:
   fire, smoke, sparkles and a star field.
   One tiny shader draws soft round dots with per-particle
   colour, size and transparency (no texture files needed).
   ========================================================== */

import * as THREE from "three";

// ---- Shared shader: soft round point with its own colour / alpha / size ----
const VERTEX = /* glsl */ `
  attribute vec3 aColor;
  attribute float aAlpha;
  attribute float aSize;
  uniform float uScale;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vColor = aColor;
    vAlpha = aAlpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uScale / max(0.1, -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float soft = smoothstep(0.5, 0.0, d);
    if (soft * vAlpha < 0.01) discard;
    gl_FragColor = vec4(vColor, soft * vAlpha);
  }
`;

/*
 * makeMaterial — builds the point shader material.
 * In:  additive — true for glowing light (fire/sparkles), false for smoke
 * Out: THREE.ShaderMaterial
 */
function makeMaterial(additive) {
  return new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: { uScale: { value: 300 } },
    transparent: true,
    depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
}

/*
 * makePointsGeometry — allocates the per-particle buffers.
 * In:  count — number of particles
 * Out: { geometry, pos, col, alpha, size } — typed arrays are written every frame
 */
function makePointsGeometry(count) {
  const geometry = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const alpha = new Float32Array(count);
  const size = new Float32Array(count);
  // Register each typed array as a shader attribute
  geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
  geometry.setAttribute("aAlpha", new THREE.BufferAttribute(alpha, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  return { geometry, pos, col, alpha, size };
}

/*
 * createEmitter — a pool of particles that can be spawned and simulated.
 * In:  opts — { count, additive, spawn(p), color(p, t) , baseSize }
 *        spawn(p): fills p.x,y,z, p.vx,vy,vz, p.life for a new particle
 *        color(p, t): returns [r,g,b,alpha] for life fraction t (0 new .. 1 dead)
 * Out: { points, emit(n), update(dt), clear(), alive() }
 */
export function createEmitter(opts) {
  const { count, additive, spawn, color, baseSize, grow = 0 } = opts;
  const buf = makePointsGeometry(count);
  const points = new THREE.Points(buf.geometry, makeMaterial(additive));
  points.frustumCulled = false;   // particles move outside the initial bounds

  // Simulation state, one object per particle (reused, never re-allocated)
  const parts = Array.from({ length: count }, () => ({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, age: 1, life: 0 }));
  let cursor = 0;   // ring-buffer write position
  let living = 0;

  /*
   * emit — spawns n new particles (overwrites the oldest when full).
   * In:  n — how many
   * Out: nothing
   */
  function emit(n) {
    for (let k = 0; k < n; k += 1) {
      const p = parts[cursor];
      spawn(p);
      p.age = 0;
      cursor = (cursor + 1) % count;
    }
  }

  /*
   * update — moves particles, ages them, writes the GPU buffers.
   * In:  dt — seconds since last frame
   * Out: nothing
   */
  function update(dt) {
    living = 0;
    for (let i = 0; i < count; i += 1) {
      const p = parts[i];
      const i3 = i * 3;
      // Dead particles are hidden with alpha 0
      if (p.age >= p.life) {
        buf.alpha[i] = 0;
        continue;
      }
      living += 1;
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      // Colour and fade follow the particle's life fraction
      const t = Math.min(1, p.age / p.life);
      const c = color(p, t);
      buf.pos[i3] = p.x;
      buf.pos[i3 + 1] = p.y;
      buf.pos[i3 + 2] = p.z;
      buf.col[i3] = c[0];
      buf.col[i3 + 1] = c[1];
      buf.col[i3 + 2] = c[2];
      buf.alpha[i] = c[3];
      buf.size[i] = baseSize * (1 + grow * t);
    }
    // Tell Three.js the buffers changed
    const g = buf.geometry.attributes;
    g.position.needsUpdate = true;
    g.aColor.needsUpdate = true;
    g.aAlpha.needsUpdate = true;
    g.aSize.needsUpdate = true;
  }

  /*
   * clear — kills every particle at once.
   * In:  nothing
   * Out: nothing
   */
  function clear() {
    for (const p of parts) p.age = p.life;
  }

  return { points, emit, update, clear, alive: () => living };
}

/*
 * createStars — a static star field on a big sphere around the scene.
 * In:  count — number of stars
 * Out: THREE.Points
 */
export function createStars(count) {
  const buf = makePointsGeometry(count);
  // Scatter stars on a sphere shell, random brightness
  for (let i = 0; i < count; i += 1) {
    const u = Math.random() * 2 - 1;
    const a = Math.random() * Math.PI * 2;
    const r = 40 + Math.random() * 20;
    const s = Math.sqrt(1 - u * u);
    buf.pos.set([Math.cos(a) * s * r, u * r, Math.sin(a) * s * r], i * 3);
    buf.col.set([0.85, 0.9, 1], i * 3);
    buf.alpha[i] = 0.35 + Math.random() * 0.6;
    buf.size[i] = 0.6 + Math.random() * 1.2;
  }
  const points = new THREE.Points(buf.geometry, makeMaterial(true));
  points.material.uniforms.uScale.value = 60;
  return points;
}

/*
 * createEffects — the three story effects wired to the island's tree positions.
 * In:  emitters — array of THREE.Vector3 fire spawn points (island space); budget — counts
 * Out: { group, fire, smoke, sparkle, setPixelScale(px), setEmitters(list) }
 */
export function createEffects(emitters, budget) {
  const group = new THREE.Group();
  let spots = emitters;   // current object's spawn points (swappable)
  const pick = () => spots[(Math.random() * spots.length) | 0];

  // 🔥 Fire: fast, short-lived, yellow → orange → red
  const fire = createEmitter({
    count: budget.fire,
    additive: true,
    baseSize: 0.55,
    spawn(p) {
      const e = pick();
      p.x = e.x + (Math.random() - 0.5) * 0.35;
      p.y = e.y + Math.random() * 0.2;
      p.z = e.z + (Math.random() - 0.5) * 0.35;
      p.vx = (Math.random() - 0.5) * 0.25;
      p.vy = 0.9 + Math.random() * 0.9;
      p.vz = (Math.random() - 0.5) * 0.25;
      p.life = 0.5 + Math.random() * 0.6;
    },
    color(p, t) {
      return [1, 0.85 - t * 0.6, 0.35 - t * 0.33, (1 - t) * 0.9];
    },
  });

  // 💨 Smoke: slow, grey, grows and fades
  const smoke = createEmitter({
    count: budget.smoke,
    additive: false,
    baseSize: 0.9,
    grow: 2.2,
    spawn(p) {
      const e = pick();
      p.x = e.x;
      p.y = e.y + 0.6;
      p.z = e.z;
      p.vx = (Math.random() - 0.5) * 0.3 + 0.15;
      p.vy = 0.55 + Math.random() * 0.4;
      p.vz = (Math.random() - 0.5) * 0.3;
      p.life = 2 + Math.random() * 1.2;
    },
    color(p, t) {
      return [0.42, 0.4, 0.4, Math.sin(t * Math.PI) * 0.32];
    },
  });

  // ✨ Sparkles: gentle green/gold glitter that rises in a spiral
  const sparkle = createEmitter({
    count: budget.sparkle,
    additive: true,
    baseSize: 0.32,
    spawn(p) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 3;
      p.x = Math.cos(a) * r;
      p.y = 0.2 + Math.random() * 0.4;
      p.z = Math.sin(a) * r;
      p.vx = -Math.sin(a) * 0.35;
      p.vy = 0.5 + Math.random() * 0.7;
      p.vz = Math.cos(a) * 0.35;
      p.life = 1.4 + Math.random() * 1.2;
    },
    color(p, t) {
      const twinkle = 0.6 + 0.4 * Math.sin((p.age + p.life) * 18);
      return [0.55 + t * 0.45, 1, 0.55, (1 - t) * twinkle];
    },
  });

  group.add(smoke.points, fire.points, sparkle.points);

  /*
   * setPixelScale — keeps particle size consistent across screens.
   * In:  px — renderer height in device pixels
   * Out: nothing
   */
  function setPixelScale(px) {
    for (const e of [fire, smoke, sparkle]) e.points.material.uniforms.uScale.value = px * 0.45;
  }

  /*
   * setEmitters — points the fire/smoke at a new object's spawn spots.
   * In:  list — THREE.Vector3[] (non-empty)
   * Out: nothing
   */
  function setEmitters(list) {
    spots = list;
    for (const e of [fire, smoke, sparkle]) e.clear();
  }

  return { group, fire, smoke, sparkle, setPixelScale, setEmitters };
}
