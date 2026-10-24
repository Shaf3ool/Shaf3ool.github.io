/* ==========================================================
   ui.js — everything the user reads: status line, hint text,
   camera button label and the hand-skeleton preview.
   ========================================================== */

// ---- Cached DOM references ----
const el = {
  status: document.getElementById("status"),
  hint: document.getElementById("hint-text"),
  camera: document.getElementById("btn-camera"),
  preview: document.getElementById("hand-preview"),
};
const ctx = el.preview.getContext("2d");

// Bones to draw between landmark indices (MediaPipe hand topology)
const BONES = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
];

// ---- Hint texts for both modes ----
const HINTS = {
  touch: "Drag = rotate · Scroll / pinch = zoom · Tap 🔥 / ✨ · Pick an object",
  hand: "✋ Move = move · 🔄 Twist = rotate · 🤏 Pinch = size · ✊ Fist = fire · 🖐 Open = sparkle · ✌️ = next object",
};

/*
 * setStatus — writes the one-line status under the camera button.
 * In:  text — string
 * Out: nothing
 */
export function setStatus(text) {
  el.status.textContent = text;
}

/*
 * setMode — switches hint, button label and preview for touch or hand mode.
 * In:  mode — "touch" | "hand" | "loading"
 * Out: nothing
 */
export function setMode(mode) {
  el.hint.textContent = mode === "hand" ? HINTS.hand : HINTS.touch;
  el.camera.disabled = mode === "loading";
  el.preview.hidden = mode !== "hand";
  // Button label follows the mode
  if (mode === "hand") el.camera.innerHTML = '<span aria-hidden="true">⏹</span> Stop camera';
  else if (mode === "loading") el.camera.innerHTML = '<span aria-hidden="true">⏳</span> Starting…';
  else el.camera.innerHTML = '<span aria-hidden="true">📷</span> Enable camera';
}

/*
 * drawHandPreview — draws the tracked hand as dots and lines (never the camera image).
 * In:  lm — 21 landmarks or null; pose — "fist" | "open" | "other"
 * Out: nothing
 */
export function drawHandPreview(lm, pose) {
  const { width: w, height: h } = el.preview;
  ctx.clearRect(0, 0, w, h);
  if (!lm) {
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "13px system-ui, sans-serif";
    ctx.fillText("Show one hand…", 12, h / 2);
    return;
  }
  // Mirror X so the preview moves like a mirror
  const px = (p) => (1 - p.x) * w;
  const py = (p) => p.y * h;
  ctx.strokeStyle = pose === "fist" ? "#ff8a3d" : pose === "open" ? "#9fe3b9" : "rgba(255,255,255,0.75)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const [a, b] of BONES) {
    ctx.moveTo(px(lm[a]), py(lm[a]));
    ctx.lineTo(px(lm[b]), py(lm[b]));
  }
  ctx.stroke();
  // Fingertips as bright dots (like the reel's white markers)
  ctx.fillStyle = "#ffffff";
  for (const i of [4, 8, 12, 16, 20]) {
    ctx.beginPath();
    ctx.arc(px(lm[i]), py(lm[i]), 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
