/* ==========================================================
   fallback.js — mouse / touch / keyboard control, used when
   there is no camera (or before the user enables it).
   Drag = rotate · wheel or two-finger pinch = scale.
   ========================================================== */

import { TRANSFORM } from "./config.js";

/*
 * clamp — keeps a number between min and max.
 * In:  v, min, max — numbers
 * Out: number
 */
function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

/*
 * attachPointerControls — listens to the canvas and writes into a target transform.
 * In:  canvas — the 3D canvas; target — { yaw, pitch, scale } object (mutated);
 *      onInteract — function() called on every user input (resets idle timer)
 * Out: { setEnabled(bool) } — disable while the hand is in control
 */
export function attachPointerControls(canvas, target, onInteract) {
  const pointers = new Map();   // active touches/mouse: id → {x, y}
  let enabled = true;
  let pinchStart = 0;
  let scaleStart = 1;

  /*
   * spread — distance between the first two active pointers.
   * In:  nothing
   * Out: number (pixels)
   */
  function spread() {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  // Start tracking a finger / mouse button
  canvas.addEventListener("pointerdown", (e) => {
    if (!enabled) return;
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      pinchStart = spread();
      scaleStart = target.scale;
    }
    onInteract();
  });

  // One pointer rotates, two pointers pinch-scale
  canvas.addEventListener("pointermove", (e) => {
    if (!enabled || !pointers.has(e.pointerId)) return;
    const prev = pointers.get(e.pointerId);
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      target.yaw += dx * 0.008;
      target.pitch = clamp(target.pitch + dy * 0.005, -TRANSFORM.maxPitch, TRANSFORM.maxPitch);
    } else if (pointers.size === 2 && pinchStart > 0) {
      target.scale = clamp(scaleStart * (spread() / pinchStart), TRANSFORM.minScale, TRANSFORM.maxScale);
    }
    onInteract();
  });

  // Stop tracking on release / cancel
  const release = (e) => pointers.delete(e.pointerId);
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);

  // Mouse wheel / trackpad = zoom
  canvas.addEventListener(
    "wheel",
    (e) => {
      if (!enabled) return;
      e.preventDefault();
      target.scale = clamp(target.scale * Math.exp(-e.deltaY * 0.0015), TRANSFORM.minScale, TRANSFORM.maxScale);
      onInteract();
    },
    { passive: false },
  );

  return {
    /*
     * setEnabled — turns pointer control on or off.
     * In:  on — boolean
     * Out: nothing
     */
    setEnabled(on) {
      enabled = on;
      pointers.clear();
    },
  };
}
