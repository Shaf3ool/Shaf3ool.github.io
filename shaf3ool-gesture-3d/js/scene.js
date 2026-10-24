/* ==========================================================
   scene.js — Three.js setup: renderer, camera, lights, the
   pivot that the hand moves, and a slot for the current object.
   Other modules only touch the returned API.

   Hierarchy:  scene → pivot (hand: move / rotate / scale)
                         → floater (gentle bob)
                             → current object · particles · fire light
   ========================================================== */

import * as THREE from "three";
import { createEffects, createStars } from "./particles.js";
import { PARTICLES } from "./config.js";

/*
 * hasWebGL — checks whether this browser can draw WebGL.
 * In:  nothing
 * Out: boolean
 */
export function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/*
 * disposeTree — frees GPU memory of a removed object.
 * In:  root — THREE.Object3D
 * Out: nothing
 */
function disposeTree(root) {
  root.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    // Materials (and their textures) can be arrays
    for (const m of Array.isArray(o.material) ? o.material : o.material ? [o.material] : []) {
      for (const key of Object.keys(m)) if (m[key] && m[key].isTexture) m[key].dispose();
      m.dispose();
    }
  });
}

/*
 * createScene — builds the 3D world and mounts the canvas.
 * In:  container — DOM element that will hold the canvas
 * Out: { canvas, pivot, effects, fireLight, setObject(obj), render(dt, time), resize() }
 */
export function createScene(container) {
  // ---- Renderer ----
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));   // cap at 2x for phones
  renderer.setClearColor(0x000000, 0);                                  // CSS gradient shows through
  container.appendChild(renderer.domElement);

  // ---- Scene + camera ----
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0b1020, 14, 60);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  camera.position.set(0, 2.6, 11.5);
  camera.lookAt(0, 0, 0);

  // ---- Lights: soft sky fill + warm sun + flickering fire light ----
  scene.add(new THREE.HemisphereLight(0xcfe3ff, 0x2a2238, 1.25));
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.2);
  sun.position.set(5, 8, 6);
  scene.add(sun);
  const fireLight = new THREE.PointLight(0xff6a2a, 0, 12, 1.6);
  fireLight.position.set(0, 1.5, 0);

  // ---- Pivot (gesture transform) → floater (bob) → object + effects ----
  const pivot = new THREE.Group();
  const floater = new THREE.Group();
  const effects = createEffects([new THREE.Vector3()], PARTICLES);
  floater.add(effects.group, fireLight);
  pivot.add(floater);
  scene.add(pivot);
  let current = null;

  // ---- Background stars ----
  const stars = createStars(PARTICLES.stars);
  scene.add(stars);

  /*
   * setObject — swaps the object the hand controls.
   * In:  obj — object contract (see objects.js)
   * Out: nothing
   */
  function setObject(obj) {
    if (current) {
      floater.remove(current.group);
      disposeTree(current.group);
    }
    current = obj;
    floater.add(obj.group);
    effects.setEmitters(obj.emitters);
  }

  /*
   * resize — matches the canvas to the window; pulls the camera back on portrait phones.
   * In:  nothing
   * Out: nothing
   */
  function resize() {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Keep ~8.5 units of width visible (tan(20°)·2 ≈ 0.728 for the 40° lens)
    camera.position.z = Math.max(11.5, 8.5 / (0.728 * camera.aspect));
    // Portrait phones: aim a little higher so the object sits below the control panel
    camera.lookAt(0, camera.aspect < 0.8 ? 1.6 : 0, 0);
    camera.updateProjectionMatrix();
    effects.setPixelScale(h * renderer.getPixelRatio());
  }

  /*
   * render — ambient animation + draws one frame.
   * In:  dt — seconds since last frame; time — total seconds
   * Out: nothing
   */
  function render(dt, time) {
    floater.position.y = Math.sin(time * 0.8) * 0.18;   // gentle float
    if (current) current.update(dt, time);              // object's own animation
    stars.rotation.y += dt * 0.004;                     // sky drifts
    renderer.render(scene, camera);
  }

  window.addEventListener("resize", resize);
  resize();
  return { canvas: renderer.domElement, pivot, effects, fireLight, setObject, render, resize };
}
