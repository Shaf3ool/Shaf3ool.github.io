/* ==========================================================
   config.js — every tunable number and URL in one place.
   Change values here instead of hunting through modules.
   ========================================================== */

// ---- CDN locations (pinned versions so the demo never breaks on an update) ----
export const CDN = {
  // MediaPipe Tasks Vision: JS bundle + its WebAssembly runtime folder
  visionBundle: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/vision_bundle.mjs",
  visionWasm: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm",
  // Google's hosted hand model (~7.8 MB, cached by the browser after first load)
  handModel: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
};

// ---- Hand tracking processor ----
// "CPU" (default): WebAssembly + SIMD, fast enough for one hand at 30 fps on recent phones,
//   and it keeps the browser console clean.
// "GPU": faster on weak CPUs, but Chrome then logs a "GPU stall due to ReadPixels"
//   performance warning (MediaPipe reads results back from the GPU every frame).
export const HAND = {
  delegate: "CPU",
};

// ---- Object transform limits ----
export const TRANSFORM = {
  minScale: 0.55,          // smallest size (pinch closed)
  maxScale: 1.5,           // largest size (pinch wide open)
  maxYaw: Math.PI * 0.95,  // left/right rotation range from hand X
  maxPitch: 0.55,          // up/down tilt range from hand Y (radians)
  smoothing: 0.14,         // 0..1 per frame — lower = smoother but laggier
};

// ---- Gesture thresholds (distances are divided by palm size, so they work near or far) ----
export const GESTURE = {
  pinchMin: 0.25,          // thumb–index gap counted as "fully pinched"
  pinchMax: 1.45,          // thumb–index gap counted as "fully open"
  holdMs: 450,             // a fist / open palm must be held this long to trigger
  cooldownMs: 1500,        // no new trigger for this long after one fires
};

// ---- Particle budgets (kept small so phones stay at 60 fps) ----
export const PARTICLES = {
  fire: 520,
  smoke: 160,
  sparkle: 260,
  stars: 450,
};

// ---- Scene timing ----
export const STORY = {
  burnSeconds: 7,          // how long the fire runs before it dies down
  regrowSeconds: 3.5,      // how long the green-up animation takes
};
