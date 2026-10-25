/* ==========================================================
   modules/hero3d.js — tiny gatekeeper for the hero 3D.
   Decides whether this visitor gets the live WebGL scene and,
   if so, loads it only after the page has painted and the
   browser is idle. Everyone else keeps the static poster
   image already in the HTML (no WebGL, reduced motion, or
   an error while loading).
   ========================================================== */

/**
 * Checks for WebGL 2 (what three.js r170 needs) without keeping a context.
 * In: nothing
 * Out: boolean
 */
function hasWebGL2() {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    // Release the probe context straight away
    if (gl) gl.getExtension("WEBGL_lose_context")?.loseContext();
    return !!gl;
  } catch (err) {
    return false;
  }
}

/**
 * Runs a callback once the page has loaded and the main thread is idle.
 * In: fn (function to run)
 * Out: nothing
 */
function whenIdle(fn) {
  // requestIdleCallback is missing on Safari: fall back to a short timeout
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 200));
  const go = () => idle(fn, { timeout: 1500 });
  if (document.readyState === "complete") go();
  else window.addEventListener("load", go, { once: true });
}

/**
 * Starts the hero 3D for capable, motion-friendly visitors.
 * In: nothing
 * Out: nothing (the stage keeps its poster if anything fails)
 */
export function initHero3D() {
  const stage = document.querySelector(".hero3d");
  if (!stage) return;
  // Reduced motion or no WebGL 2: the poster stays, nothing else loads
  const calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (calm || !hasWebGL2()) {
    stage.classList.add("is-static");
    return;
  }
  // Touch-first devices get idle sway instead of mouse follow
  const touch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  whenIdle(() => {
    import("./hero3d-scene.js")
      .then((m) => m.startHero3D(stage, { touch }))
      .catch(() => {
        // Any failure: keep the poster, show no broken canvas
        stage.classList.add("is-static");
      });
  });
}
