/* ==========================================================
   modules/hero3d-scene.js — the interactive 3D centrepiece
   of the hero: a glossy ink phone that plays Shaf3ool's
   concept sites, in front of the spinning orange seal, with
   a glossy orange orbit (the seal's arc + three dots in 3D)
   and drifting embers.
   Loaded lazily by hero3d.js after first paint; never part
   of the first download.
   Performance rules kept here:
   - 8 draw calls, low-poly, no lights: all shading is baked
     into two tiny matcap textures drawn on a 2D canvas.
   - One texture atlas for every phone screen.
   - Pixel ratio capped (1.5 touch / 2 desktop) and lowered
     on its own if frames get slow.
   - Renders only while the hero is on screen and the tab is
     visible; zero work otherwise.
   ========================================================== */

import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, Points, InstancedMesh,
  Shape, ExtrudeGeometry, PlaneGeometry, CircleGeometry, TorusGeometry, SphereGeometry,
  BufferGeometry, Float32BufferAttribute, MeshMatcapMaterial, MeshBasicMaterial,
  ShaderMaterial, CanvasTexture, TextureLoader, SRGBColorSpace, AdditiveBlending,
  Object3D, Vector2, MathUtils,
} from "../vendor/three.module.min.js";

// Brand colours (match css/tokens.css)
const ORANGE = "#ff5a36";
// Phone screen atlas: 3 columns × 2 rows of live-site screenshots
const ATLAS = { url: "assets/img/hero3d-screens.webp", cols: 3, rows: 2, count: 6 };
// Seconds each site stays on the phone before the next one wipes in
const SCREEN_HOLD = 3.4;

/**
 * Draws a matcap (a sphere photo of a material) on a 2D canvas,
 * so lighting is baked: the GPU does one texture read per pixel.
 * In: stops (array of [offset, colour] for the body gradient),
 *     rim (colour of the edge light), spec (highlight strength 0–1)
 * Out: CanvasTexture (sRGB)
 */
function makeMatcap(stops, rim, spec) {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  // Body: soft light from the upper left
  const body = g.createRadialGradient(size * 0.36, size * 0.3, 0, size * 0.5, size * 0.5, size * 0.72);
  stops.forEach(([o, col]) => body.addColorStop(o, col));
  g.fillStyle = body;
  g.fillRect(0, 0, size, size);
  // Rim light hugging the lower-right edge (a reflected brand light)
  g.globalCompositeOperation = "lighter";
  const r = g.createRadialGradient(size * 0.5, size * 0.5, size * 0.36, size * 0.5, size * 0.5, size * 0.5);
  r.addColorStop(0, "rgba(0,0,0,0)");
  r.addColorStop(1, rim);
  g.save();
  g.beginPath();
  g.arc(size * 0.5, size * 0.5, size * 0.5, -0.35, Math.PI * 0.95);
  g.lineTo(size * 0.5, size * 0.5);
  g.closePath();
  g.clip();
  g.fillStyle = r;
  g.fillRect(0, 0, size, size);
  g.restore();
  // Sharp studio highlight, then a wider soft sheen around it
  const h = g.createRadialGradient(size * 0.31, size * 0.25, 0, size * 0.31, size * 0.25, size * 0.2);
  h.addColorStop(0, `rgba(255,255,255,${spec})`);
  h.addColorStop(0.35, `rgba(255,255,255,${spec * 0.35})`);
  h.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = h;
  g.fillRect(0, 0, size, size);
  // Texture for the GPU
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

/**
 * Builds a soft round glow sprite (the cheap "bloom" behind the phone).
 * In: colour (CSS colour of the centre)
 * Out: CanvasTexture (sRGB)
 */
function makeGlow(colour) {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  // Radial falloff from the brand colour to nothing
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, colour);
  grd.addColorStop(0.4, "rgba(255,90,54,0.35)");
  grd.addColorStop(1, "rgba(255,90,54,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

/**
 * Loads an image URL (the brand seal SVG) into a square canvas texture.
 * In: url (string), size (px of the square canvas)
 * Out: Promise<CanvasTexture>
 */
function loadSealTexture(url, size) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      // Rasterise the vector seal once, at a fixed size
      const c = document.createElement("canvas");
      c.width = c.height = size;
      c.getContext("2d").drawImage(img, 0, 0, size, size);
      const tex = new CanvasTexture(c);
      tex.colorSpace = SRGBColorSpace;
      tex.anisotropy = 4;
      resolve(tex);
    };
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Loads the phone-screen atlas.
 * In: url (string)
 * Out: Promise<Texture>
 */
function loadAtlas(url) {
  return new Promise((resolve, reject) => {
    new TextureLoader().load(url, (tex) => {
      // Screenshots are sRGB images; keep them crisp when tilted
      tex.colorSpace = SRGBColorSpace;
      tex.anisotropy = 4;
      resolve(tex);
    }, undefined, reject);
  });
}

/**
 * Makes the rounded-rectangle outline of the phone body.
 * In: w, h (size in world units), r (corner radius)
 * Out: Shape
 */
function roundedRect(w, h, r) {
  const s = new Shape();
  const x = -w / 2;
  const y = -h / 2;
  // Four straight edges joined by quarter-circle corners
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/**
 * Shader for the phone screen: picks two tiles of the atlas,
 * wipes diagonally from one to the next, rounds the corners,
 * draws the camera pill and a gloss streak that slides as the
 * phone turns. Opaque, so no transparency sorting is needed.
 * In: atlas (Texture), aspect (screen width / height)
 * Out: ShaderMaterial
 */
function makeScreenMaterial(atlas, aspect) {
  return new ShaderMaterial({
    uniforms: {
      uMap: { value: atlas },
      uGrid: { value: new Vector2(ATLAS.cols, ATLAS.rows) },
      uA: { value: 0 },
      uB: { value: 1 },
      uMix: { value: 0 },
      uGloss: { value: 0.5 },
      uSize: { value: new Vector2(aspect, 1) },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform vec2 uGrid;
      uniform float uA;
      uniform float uB;
      uniform float uMix;
      uniform float uGloss;
      uniform vec2 uSize;
      varying vec2 vUv;
      // UV inside tile idx of the atlas (row 0 = top of the image)
      vec2 tile(float idx, vec2 uv) {
        float col = mod(idx, uGrid.x);
        float row = floor(idx / uGrid.x);
        return vec2((col + uv.x) / uGrid.x, 1.0 - (row + 1.0 - uv.y) / uGrid.y);
      }
      // Signed distance to a rounded box (negative inside)
      float sdBox(vec2 p, vec2 b, float r) {
        vec2 q = abs(p) - b + r;
        return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
      }
      void main() {
        // Diagonal wipe from site A to site B
        float edge = vUv.y * 0.85 + (1.0 - vUv.x) * 0.15;
        float m = smoothstep(edge - 0.08, edge + 0.08, uMix * 1.2 - 0.1);
        vec3 col = mix(texture2D(uMap, tile(uA, vUv)).rgb, texture2D(uMap, tile(uB, vUv)).rgb, m);
        // A thin orange line rides the wipe front
        float front = 1.0 - smoothstep(0.0, 0.03, abs(edge - (uMix * 1.2 - 0.1)));
        col = mix(col, vec3(1.0, 0.353, 0.212), front * step(0.001, uMix) * step(uMix, 0.999) * 0.9);
        // Gloss streak that slides with the phone's rotation
        float band = vUv.x * 0.55 + vUv.y * 0.45;
        col += vec3(1.0) * smoothstep(0.16, 0.0, abs(band - uGloss)) * 0.16;
        // Rounded screen corners and the camera pill (bezel colour outside)
        vec2 p = (vUv - 0.5) * uSize;
        float aa = fwidth(p.x) * 1.5;
        float inside = 1.0 - smoothstep(-aa, aa, sdBox(p, uSize * 0.5, 0.06));
        float pill = 1.0 - smoothstep(-aa, aa, sdBox(p - vec2(0.0, uSize.y * 0.5 - 0.045), vec2(0.075, 0.016), 0.016));
        col = mix(vec3(0.03), col, inside * (1.0 - pill));
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });
}

/**
 * Builds the drifting ember particles: one Points draw call,
 * all motion done in the vertex shader (no per-frame CPU work).
 * In: count (number of embers), pixelRatio (renderer pixel ratio)
 * Out: Points
 */
function makeEmbers(count, pixelRatio) {
  const pos = [];
  const seed = [];
  for (let i = 0; i < count; i++) {
    // Random point in a thick shell around the phone
    const r = 1.7 + Math.random() * 1.7;
    const a = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 3.6;
    pos.push(Math.cos(a) * r, y, Math.sin(a) * r * 0.6 - 0.4);
    seed.push(Math.random());
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(pos, 3));
  geo.setAttribute("aSeed", new Float32BufferAttribute(seed, 1));
  // Additive, soft round points in orange and paper tones
  const mat = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPR: { value: pixelRatio }, uBoost: { value: 0 } },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uPR;
      uniform float uBoost;
      attribute float aSeed;
      varying float vSeed;
      void main() {
        vSeed = aSeed;
        vec3 p = position;
        // Slow orbit around the phone plus a gentle rise
        float a = uTime * (0.05 + aSeed * 0.08) * (1.0 + uBoost * 3.0);
        p.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * p.xz;
        p.y += sin(uTime * 0.6 + aSeed * 30.0) * 0.12 + uBoost * (aSeed - 0.5) * 0.6;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (2.0 + aSeed * 4.0) * uPR * (6.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      varying float vSeed;
      void main() {
        // Soft disc, brighter in the middle
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        vec3 c = mix(vec3(1.0, 0.353, 0.212), vec3(1.0, 0.86, 0.78), step(0.7, vSeed));
        gl_FragColor = vec4(c * a * 0.75, a);
      }`,
  });
  return new Points(geo, mat);
}

/**
 * Starts the whole 3D centrepiece inside the hero stage.
 * In: stage (the .hero3d element; holds the canvas), opts
 *     ({ touch: boolean } — true on phones/tablets)
 * Out: Promise<{ stop: Function }> (resolves once the first frame is drawn)
 */
export async function startHero3D(stage, opts) {
  const canvas = stage.querySelector("canvas");
  const touch = !!opts.touch;
  // ---------- Renderer (transparent, pixel ratio capped) ----------
  const maxPR = touch ? 1.5 : 2;
  let pixelRatio = Math.min(window.devicePixelRatio || 1, maxPR);
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x000000, 0);
  // ---------- Scene + camera ----------
  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 8);
  // All moving parts hang off one rig that follows pointer/scroll
  const rig = new Group();
  scene.add(rig);

  // ---------- Textures (loaded in parallel) ----------
  const [atlas, seal] = await Promise.all([loadAtlas(ATLAS.url), loadSealTexture("assets/img/shaf3ool-seal.svg", 1024)]);
  const inkCap = makeMatcap([[0, "#5a5450"], [0.3, "#24211f"], [0.75, "#0d0c0c"], [1, "#050505"]], "rgba(255,90,54,0.85)", 0.95);
  const orangeCap = makeMatcap([[0, "#ffc4ae"], [0.22, "#ff7d58"], [0.6, ORANGE], [0.9, "#a5290c"], [1, "#4d1204"]], "rgba(255,226,214,0.6)", 1);

  // ---------- The seal: big orange disc behind, slowly spinning ----------
  const sealMesh = new Mesh(new PlaneGeometry(3.3, 3.3), new MeshBasicMaterial({ map: seal, transparent: true, depthWrite: false }));
  sealMesh.position.set(0.15, 0.35, -1.6);
  scene.add(sealMesh);
  // Soft glow halo just in front of the seal (fake bloom)
  const glow = new Mesh(new PlaneGeometry(3.5, 3.5), new MeshBasicMaterial({ map: makeGlow("rgba(255,120,80,0.55)"), transparent: true, depthWrite: false, blending: AdditiveBlending }));
  glow.position.set(0, 0, -1.2);
  scene.add(glow);

  // ---------- The phone (body, screen, seal on the back) ----------
  const PW = 1.04;
  const PH = 2.12;
  const PD = 0.1;
  const phone = new Group();
  rig.add(phone);
  // Body: extruded rounded rectangle with a bevel for a glossy edge
  const bodyGeo = new ExtrudeGeometry(roundedRect(PW, PH, 0.17), { depth: PD, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.035, bevelSegments: 4, curveSegments: 10 });
  bodyGeo.translate(0, 0, -PD / 2);
  phone.add(new Mesh(bodyGeo, new MeshMatcapMaterial({ matcap: inkCap })));
  // Screen: just in front of the glass face
  const SW = PW - 0.07;
  const SH = PH - 0.07;
  const screenMat = makeScreenMaterial(atlas, SW / SH);
  screenMat.uniforms.uSize.value.set(SW, SH);
  const screen = new Mesh(new PlaneGeometry(SW, SH), screenMat);
  screen.position.z = PD / 2 + 0.036;
  phone.add(screen);
  // Back: the Shaf3ool seal, seen when the phone is spun around
  const back = new Mesh(new CircleGeometry(0.34, 48), new MeshBasicMaterial({ map: seal, transparent: true }));
  back.position.set(0, 0.42, -PD / 2 - 0.036);
  back.rotation.y = Math.PI;
  phone.add(back);

  // ---------- Orbit: the seal's arc + three dots, in glossy 3D ----------
  const orbit = new Group();
  orbit.rotation.set(1.18, 0.0, 0.42);
  rig.add(orbit);
  // Arc (open torus) and its spin pivot
  const arc = new Mesh(new TorusGeometry(1.62, 0.045, 12, 96, Math.PI * 1.45), new MeshMatcapMaterial({ matcap: orangeCap }));
  orbit.add(arc);
  // Three glossy dots, one instanced draw call
  const dots = new InstancedMesh(new SphereGeometry(1, 20, 14), new MeshMatcapMaterial({ matcap: orangeCap }), 3);
  orbit.add(dots);
  const dummy = new Object3D();

  // ---------- Embers ----------
  const embers = makeEmbers(touch ? 90 : 160, pixelRatio);
  scene.add(embers);

  // ---------- Interaction state ----------
  const state = {
    mx: 0, my: 0,          // mouse position, −1 … 1 (desktop follow)
    yaw: 0, pitch: 0,      // eased rotation of the rig
    spin: 0, vel: 0,       // free spin from dragging, with inertia
    dragging: false,
    lastX: 0, lastY: 0, downX: 0, downY: 0, downT: 0,
    pulse: 0,              // 1 on a tap, decays to 0
    scroll: 0,             // 0 at top of hero → 1 when hero has scrolled away
    screenA: 0, screenT: 0, wiping: false, wipe: 0,
    running: false, visible: true, pageVisible: !document.hidden,
    lastTime: 0, slowFrames: 0, frameAvg: 16.7,
  };
  // Public numbers for QA (frames drawn and last render cost in ms)
  const stats = { frames: 0, renderMs: 0, pixelRatio };
  window.__shaf3oolHero3d = stats;

  /**
   * Fits renderer and camera to the stage size.
   * In: nothing
   * Out: nothing
   */
  function resize() {
    const w = Math.max(1, stage.clientWidth);
    const h = Math.max(1, stage.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Pull the camera back until a 3.6 × 3.0 unit box fits either way
    // (narrow phone stages fit 3.25 wide: the orbit may kiss the edges)
    const boxW = camera.aspect < 1.15 ? 3.2 : 3.6;
    const fitH = 3.0 / (2 * Math.tan(MathUtils.degToRad(camera.fov / 2)));
    const fitW = fitH * (boxW / 3.0) / camera.aspect;
    camera.position.z = Math.max(fitH, fitW) + 0.4;
    camera.updateProjectionMatrix();
  }

  /**
   * Starts the next site wiping onto the phone screen.
   * In: nothing
   * Out: nothing
   */
  function nextScreen() {
    if (state.wiping) return;
    state.wiping = true;
    state.wipe = 0;
    screenMat.uniforms.uA.value = state.screenA;
    screenMat.uniforms.uB.value = (state.screenA + 1) % ATLAS.count;
  }

  /**
   * Advances every animated value and draws one frame.
   * In: now (ms timestamp from requestAnimationFrame)
   * Out: nothing
   */
  function frame(now) {
    if (!state.running) return;
    requestAnimationFrame(frame);
    // Delta time in seconds, clamped after a pause
    const dt = Math.min(0.05, state.lastTime ? (now - state.lastTime) / 1000 : 0.016);
    state.lastTime = now;
    const t = now / 1000;
    // Ease factor that feels the same at 30, 60 or 120 fps
    const k = 1 - Math.pow(0.0025, dt);

    // --- Free spin: drag velocity with inertia, then settle face-front ---
    if (!state.dragging) {
      state.spin += state.vel;
      state.vel *= Math.pow(0.04, dt);
      if (Math.abs(state.vel) < 0.002) {
        const home = Math.round(state.spin / (Math.PI * 2)) * Math.PI * 2;
        state.spin += (home - state.spin) * k * 0.6;
      }
    }
    // --- Target pose: mouse follow on desktop, idle sway on touch ---
    const idleYaw = touch ? Math.sin(t * 0.55) * 0.38 : Math.sin(t * 0.4) * 0.08;
    const tYaw = state.mx * 0.55 + idleYaw + state.scroll * 0.9;
    const tPitch = -state.my * 0.3 + Math.sin(t * 0.45) * 0.06 + state.scroll * 0.55;
    state.yaw += (tYaw - state.yaw) * k;
    state.pitch += (tPitch - state.pitch) * k;
    rig.rotation.set(state.pitch, state.yaw + state.spin, Math.sin(t * 0.5) * 0.03);
    // Float, scroll lift and tap pop
    state.pulse *= Math.pow(0.02, dt);
    rig.position.set(state.mx * 0.12, Math.sin(t * 1.1) * 0.07 + state.scroll * 1.1, 0);
    phone.scale.setScalar(1 + state.pulse * 0.08);

    // --- Orbit: arc turns, dots ride the gap, faster on a tap/scroll ---
    const orbitSpeed = 0.35 + state.pulse * 2.5 + state.scroll * 1.5 + Math.abs(state.vel) * 8;
    arc.rotation.z += orbitSpeed * dt;
    orbit.scale.setScalar(1 + state.pulse * 0.1 + state.scroll * 0.25);
    for (let i = 0; i < 3; i++) {
      const a = arc.rotation.z + Math.PI * 1.45 + 0.22 + i * 0.27;
      dummy.position.set(Math.cos(a) * 1.62, Math.sin(a) * 1.62, 0);
      dummy.scale.setScalar(0.085 - i * 0.012);
      dummy.updateMatrix();
      dots.setMatrixAt(i, dummy.matrix);
    }
    dots.instanceMatrix.needsUpdate = true;

    // --- Seal + glow: slow spin, parallax opposite to the phone ---
    sealMesh.rotation.z -= dt * 0.16;
    sealMesh.position.x = 0.15 - state.mx * 0.25;
    sealMesh.position.y = 0.35 + state.my * 0.15 - state.scroll * 0.6;
    glow.material.opacity = 0.75 + state.pulse * 0.6;

    // --- Screens: auto-advance, and run the wipe ---
    state.screenT += dt;
    if (!state.wiping && state.screenT > SCREEN_HOLD) nextScreen();
    if (state.wiping) {
      state.wipe = Math.min(1, state.wipe + dt / 0.9);
      screenMat.uniforms.uMix.value = MathUtils.smoothstep(state.wipe, 0, 1);
      if (state.wipe >= 1) {
        // Wipe finished: B becomes the resting screen
        state.screenA = screenMat.uniforms.uB.value;
        screenMat.uniforms.uA.value = state.screenA;
        screenMat.uniforms.uMix.value = 0;
        state.wiping = false;
        state.screenT = 0;
      }
    }
    // Gloss streak follows the turn of the phone
    screenMat.uniforms.uGloss.value = 0.55 + Math.sin(state.yaw + state.spin) * 0.7;
    embers.material.uniforms.uTime.value = t;
    embers.material.uniforms.uBoost.value = state.pulse;

    // --- Draw, timing the CPU side of the render call ---
    const t0 = performance.now();
    renderer.render(scene, camera);
    stats.renderMs = performance.now() - t0;
    stats.frames++;
    adaptQuality(dt);
  }

  /**
   * Lowers the pixel ratio if frames stay slow (protects old phones).
   * In: dt (seconds since the last frame)
   * Out: nothing
   */
  function adaptQuality(dt) {
    state.frameAvg += (dt * 1000 - state.frameAvg) * 0.05;
    // About 1.5 s in a row under ~40 fps → step the resolution down
    state.slowFrames = state.frameAvg > 25 ? state.slowFrames + 1 : 0;
    if (state.slowFrames > 90 && pixelRatio > 1) {
      pixelRatio = Math.max(1, pixelRatio - 0.25);
      renderer.setPixelRatio(pixelRatio);
      embers.material.uniforms.uPR.value = pixelRatio;
      stats.pixelRatio = pixelRatio;
      resize();
      state.slowFrames = 0;
    }
  }

  /**
   * Runs or pauses the loop from on-screen and tab-visible state.
   * In: nothing
   * Out: nothing
   */
  function updateRunning() {
    const should = state.visible && state.pageVisible;
    if (should && !state.running) {
      state.running = true;
      state.lastTime = 0;
      requestAnimationFrame(frame);
    } else if (!should) {
      state.running = false;
    }
  }

  // ---------- Pointer: mouse follow anywhere in the window ----------
  const onMove = (e) => {
    if (e.pointerType !== "mouse") return;
    state.mx = (e.clientX / window.innerWidth) * 2 - 1;
    state.my = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener("pointermove", onMove, { passive: true });

  // ---------- Pointer: drag to spin (finger or mouse) ----------
  canvas.addEventListener("pointerdown", (e) => {
    state.dragging = true;
    state.lastX = state.downX = e.clientX;
    state.lastY = state.downY = e.clientY;
    state.downT = performance.now();
    state.vel = 0;
    canvas.setPointerCapture(e.pointerId);
    stage.classList.add("is-grabbing");
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!state.dragging) return;
    // Horizontal drag spins the phone; keep the last delta as velocity
    const dx = e.clientX - state.lastX;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    const d = dx * 0.011;
    state.spin += d;
    state.vel = d;
  });
  // Release: a short, still press is a tap → next site
  const endDrag = (e) => {
    if (!state.dragging) return;
    state.dragging = false;
    stage.classList.remove("is-grabbing");
    stage.classList.add("is-used");
    const moved = Math.hypot(e.clientX - state.downX, e.clientY - state.downY);
    if (e.type === "pointerup" && moved < 8 && performance.now() - state.downT < 400) {
      state.pulse = 1;
      nextScreen();
    }
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  // Keyboard: Enter / Space on the focused stage also switches site
  stage.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    state.pulse = 1;
    nextScreen();
  });

  // ---------- Scroll: hero progress drives tilt/lift (one read per frame) ----------
  const hero = stage.closest(".hero") || stage;
  let scrollQueued = false;
  const onScroll = () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      scrollQueued = false;
      const r = hero.getBoundingClientRect();
      state.scroll = MathUtils.clamp(-r.top / Math.max(1, r.height), 0, 1);
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  // ---------- Pause when off-screen or the tab is hidden ----------
  const io = new IntersectionObserver((entries) => {
    state.visible = entries[0].isIntersecting;
    updateRunning();
  });
  io.observe(stage);
  document.addEventListener("visibilitychange", () => {
    state.pageVisible = !document.hidden;
    updateRunning();
  });
  // Keep the canvas sized to its box
  new ResizeObserver(resize).observe(stage);
  // A lost GPU context falls back to the static poster
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    state.running = false;
    stage.classList.remove("is-live");
  });

  // ---------- First frame, then reveal the canvas ----------
  resize();
  renderer.render(scene, camera);
  stage.classList.add("is-live");
  updateRunning();
  return {
    stop() {
      state.running = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    },
  };
}
