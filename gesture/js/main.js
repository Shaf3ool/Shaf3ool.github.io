/* ==========================================================
   main.js — entry point. Wires the scene, the object picker,
   touch fallback, hand tracking and the effects together, and
   runs the animation loop.

   Data flow every frame:
     input (hand OR pointer) → target {x, y, yaw, pitch, scale}
     → smoothed into the pivot → effects / object hooks → render
   ========================================================== */

import { createScene, hasWebGL } from "./scene.js";
import { OBJECTS, buildObject, loadGLTFObject, withDefaults } from "./objects.js";
import { attachPointerControls } from "./fallback.js";
import { startCamera, stopCamera, createHandTracker } from "./hands.js";
import { pinchAmount, palmCenter, palmRoll, handPose, createPoseTrigger } from "./gestures.js";
import { setStatus, setMode, drawHandPreview } from "./ui.js";
import { TRANSFORM, STORY } from "./config.js";

// ---- DOM ----
const stage = document.getElementById("stage");
const video = document.getElementById("cam");
const btnCamera = document.getElementById("btn-camera");
const btnFire = document.getElementById("btn-fire");
const btnRegrow = document.getElementById("btn-regrow");
const picker = document.getElementById("object-picker");
const fileInput = document.getElementById("file-glb");

// ---- App state ----
const target = { x: 0, y: 0, yaw: 0.6, pitch: 0.18, scale: 1 };   // where input wants the object
const now = { x: 0, y: 0, yaw: 0.6, pitch: 0.18, scale: 1 };      // where it is (smoothed)
const story = { phase: "calm", t: 0 };                           // calm | burning | burnt | sparkle
let world = null;          // scene API
let object = null;         // current object contract
let objectId = "island";
let tracker = null;        // MediaPipe tracker (null in touch mode)
let pointer = null;        // touch/mouse controls
let lastInput = -Infinity; // for idle auto-rotate
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/*
 * markInput — records that the user just interacted (pauses auto-rotate).
 * In:  nothing
 * Out: nothing
 */
function markInput() {
  lastInput = performance.now();
}

/*
 * useObject — puts a new object under the user's control and resets the effects.
 * In:  obj — full object contract; id — picker id ("custom" for loaded files)
 * Out: nothing
 */
function useObject(obj, id) {
  object = obj;
  objectId = id;
  world.setObject(obj);
  // Objects with their own motion face the viewer (snap yaw to the nearest full turn)
  if (obj.autoRotate === false) target.yaw = Math.round(target.yaw / (Math.PI * 2)) * Math.PI * 2;
  story.phase = "calm";
  world.fireLight.intensity = 0;
  document.body.classList.remove("is-burning");
  // Reflect the choice on the picker buttons
  for (const b of picker.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.id === id));
}

/*
 * selectBuiltIn — switches to one of the procedural objects.
 * In:  id — OBJECTS[].id
 * Out: nothing
 */
function selectBuiltIn(id) {
  useObject(buildObject(id), id);
}

/*
 * nextObject — cycles to the next built-in object (✌️ gesture).
 * In:  nothing
 * Out: nothing
 */
function nextObject() {
  const i = OBJECTS.findIndex((o) => o.id === objectId);
  selectBuiltIn(OBJECTS[(i + 1) % OBJECTS.length].id);
}

/*
 * buildPicker — creates one button per registered object.
 * In:  nothing
 * Out: nothing
 */
function buildPicker() {
  for (const o of OBJECTS) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn";
    b.dataset.id = o.id;
    b.textContent = o.label;
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => selectBuiltIn(o.id));
    picker.appendChild(b);
  }
}

/*
 * loadCustom — loads a .glb from a File or URL and makes it the object.
 * In:  source — File | string URL
 * Out: Promise<void>
 */
async function loadCustom(source) {
  setStatus("Loading your model…");
  try {
    const obj = withDefaults(await loadGLTFObject(source));
    useObject(obj, "custom");
    setStatus("Your model is loaded — control it like the others.");
  } catch (err) {
    setStatus(`Could not load that model (${err.message || "unknown error"}). Try a .glb file.`);
  }
}

/*
 * startFire — 🔥 effect: flames + smoke from the object's emitters.
 * In:  nothing
 * Out: nothing
 */
function startFire() {
  story.phase = "burning";
  story.t = 0;
  document.body.classList.add("is-burning");
  setStatus("🔥 Fire! Open your palm (or tap ✨) to bring it back.");
}

/*
 * startSparkle — ✨ effect: sparkles and the object's regrow / bounce animation.
 * In:  nothing
 * Out: nothing
 */
function startSparkle() {
  story.phase = "sparkle";
  story.t = 0;
  world.effects.fire.clear();
  document.body.classList.remove("is-burning");
  setStatus("✨ Sparkle — everything is fresh again.");
}

/*
 * onGesture — reacts to a confirmed hand pose.
 * In:  pose — "fist" | "open" | "peace"
 * Out: nothing
 */
function onGesture(pose) {
  if (pose === "fist") startFire();
  else if (pose === "open") startSparkle();
  else if (pose === "peace") nextObject();
}
const poseTrigger = createPoseTrigger(onGesture);

/*
 * updateStory — runs the current effect phase for one frame.
 * In:  dt — seconds; time — total seconds
 * Out: nothing
 */
function updateStory(dt, time) {
  const fx = world.effects;
  story.t += dt;
  if (story.phase === "burning") {
    // Burn in over ~1.5 s, flames for STORY.burnSeconds, then smoulder
    const burn = Math.min(1, story.t / 1.5);
    const glow = 0.6 + 0.4 * Math.sin(time * 14);
    object.setBurn(burn, glow);
    fx.fire.emit(Math.ceil(170 * dt));
    if (Math.random() < dt * 40) fx.smoke.emit(1);
    world.fireLight.intensity = 6 + Math.sin(time * 23) * 2.5;
    if (story.t > STORY.burnSeconds) {
      story.phase = "burnt";
      story.t = 0;
      setStatus("The fire is out. Open your palm (or tap ✨) to regrow.");
    }
  } else if (story.phase === "burnt") {
    // Embers fade, a little smoke keeps rising
    object.setBurn(1, Math.max(0, 1 - story.t));
    world.fireLight.intensity = Math.max(0, world.fireLight.intensity - dt * 8);
    if (story.t < 2.5 && Math.random() < dt * 12) fx.smoke.emit(1);
  } else if (story.phase === "sparkle") {
    // Heal colours, play the object's grow animation, emit glitter
    const g = Math.min(1, story.t / STORY.regrowSeconds);
    object.setBurn(1 - Math.min(1, g * 1.6), 0);
    object.setGrowth(g);
    world.fireLight.intensity = 0;
    if (g < 0.85) fx.sparkle.emit(Math.ceil(110 * dt));
    if (g >= 1) story.phase = "calm";
  }
  fx.fire.update(dt);
  fx.smoke.update(dt);
  fx.sparkle.update(dt);
}

/*
 * applyHand — turns one frame of landmarks into the target transform.
 * In:  lm — 21 landmarks (or null when no hand); nowMs — timestamp
 * Out: nothing
 */
function applyHand(lm, nowMs) {
  const pose = lm ? handPose(lm) : "none";
  drawHandPreview(lm, pose);
  poseTrigger.update(pose, nowMs);
  if (!lm) return;
  markInput();
  // Palm position → move the object across the screen (mirrored)
  const c = palmCenter(lm);
  target.x = (c.x - 0.5) * 6;
  target.y = (0.5 - c.y) * 3.2;
  // Wrist twist → spin; height → slight tilt toward the viewer
  target.yaw = Math.max(-TRANSFORM.maxYaw, Math.min(TRANSFORM.maxYaw, palmRoll(lm) * 2.4 + target.x * 0.12));
  target.pitch = (c.y - 0.5) * TRANSFORM.maxPitch;
  // Pinch → size (frozen while making a fist, which also closes the pinch)
  if (pose !== "fist") {
    const p = pinchAmount(lm);
    target.scale = TRANSFORM.minScale + p * (TRANSFORM.maxScale - TRANSFORM.minScale);
  }
}

/*
 * enableCamera — starts the camera + hand model, or stops them if running.
 * In:  nothing
 * Out: Promise<void>
 */
async function enableCamera() {
  // Second tap: stop and go back to touch mode
  if (tracker) {
    tracker.close();
    tracker = null;
    stopCamera(video);
    pointer.setEnabled(true);
    setMode("touch");
    setStatus("Camera off — touch / mouse mode.");
    return;
  }
  setMode("loading");
  setStatus("Asking for the camera… then loading the hand model (~8 MB, first time only).");
  try {
    // Ask permission first, download the model at the same time
    const [, t] = await Promise.all([startCamera(video), createHandTracker()]);
    tracker = t;
    pointer.setEnabled(false);
    setMode("hand");
    setStatus("Hand mode on. Show one hand to the camera. 🔒 Video stays on this device.");
  } catch (err) {
    stopCamera(video);
    setMode("touch");
    const denied = err && (err.name === "NotAllowedError" || err.name === "SecurityError");
    setStatus(denied ? "Camera blocked — allow it in the browser, or keep using touch / mouse." : `No camera available (${(err && err.message) || "unknown"}). Touch / mouse still works.`);
  }
}

/*
 * loop — the animation frame: input → smoothing → effects → render.
 * In:  ms — requestAnimationFrame timestamp
 * Out: nothing (schedules itself)
 */
let lastMs = performance.now();
function loop(ms) {
  const dt = Math.min(0.05, (ms - lastMs) / 1000);   // clamp after tab switches
  lastMs = ms;
  const time = ms / 1000;

  // Hand input (only when a new camera frame exists)
  if (tracker) {
    const lm = tracker.detect(video, ms);
    if (lm !== undefined) applyHand(lm, ms);
  }
  // Idle: slow showcase spin after 3 s without input
  if (ms - lastInput > 3000 && !tracker && object.autoRotate !== false) target.yaw += dt * (reduceMotion ? 0.05 : 0.22);

  // Smooth every channel toward its target (frame-rate independent)
  const k = 1 - Math.pow(1 - TRANSFORM.smoothing, dt * 60);
  for (const key of Object.keys(now)) now[key] += (target[key] - now[key]) * k;
  world.pivot.position.set(now.x, now.y, 0);
  world.pivot.rotation.set(now.pitch, now.yaw, 0);
  world.pivot.scale.setScalar(now.scale);

  updateStory(dt, time);
  world.render(dt, time);
  requestAnimationFrame(loop);
}

/*
 * init — boots the page (or explains why it cannot).
 * In:  nothing
 * Out: nothing
 */
function init() {
  if (!hasWebGL()) {
    setStatus("This browser cannot show 3D (WebGL is off). Try Chrome, Safari or Firefox.");
    btnCamera.disabled = true;
    return;
  }
  world = createScene(stage);
  buildPicker();
  selectBuiltIn("island");
  pointer = attachPointerControls(world.canvas, target, markInput);
  setMode("touch");

  // Buttons + keyboard shortcuts (F = fire, S = sparkle, N = next object)
  btnCamera.addEventListener("click", enableCamera);
  btnFire.addEventListener("click", startFire);
  btnRegrow.addEventListener("click", startSparkle);
  fileInput.addEventListener("change", () => fileInput.files[0] && loadCustom(fileInput.files[0]));
  window.addEventListener("keydown", (e) => {
    if (e.target instanceof HTMLInputElement) return;
    const k = e.key.toLowerCase();
    if (k === "f") startFire();
    else if (k === "s") startSparkle();
    else if (k === "n") nextObject();
  });

  // Optional ?model=<url to a .glb> loads any CORS-enabled model at start
  const modelUrl = new URLSearchParams(location.search).get("model");
  if (modelUrl) loadCustom(modelUrl);

  requestAnimationFrame(loop);
}

init();
