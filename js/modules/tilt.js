/* ==========================================================
   modules/tilt.js — pointer-driven 3D tilt for the project
   cards (.case__media). Writes four CSS variables per card;
   css/depth.css turns them into transforms.
   Runs only for a real mouse/trackpad (hover + fine pointer)
   and never under prefers-reduced-motion. Touch devices get
   the CSS-only tip-up on reveal, so phones do no extra work.
   ========================================================== */

/**
 * Says whether the visitor should get pointer tilt.
 * In: nothing
 * Out: boolean (true = mouse/trackpad and motion allowed)
 */
function tiltAllowed() {
  // matchMedia is in every target browser; guard anyway
  if (!window.matchMedia) return false;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return finePointer && !calm;
}

/**
 * Writes the tilt variables for one card from a pointer position.
 * In: card (the .case__media element), x / y (pointer in px, viewport)
 * Out: nothing (sets --rx, --ry, --gx, --gy on the card)
 */
function setTilt(card, x, y) {
  const box = card.getBoundingClientRect();
  // Position inside the card, 0 … 1 on each axis
  const px = Math.min(Math.max((x - box.left) / box.width, 0), 1);
  const py = Math.min(Math.max((y - box.top) / box.height, 0), 1);
  // Centre-based −1 … 1 values drive the rotation
  card.style.setProperty("--rx", (px * 2 - 1).toFixed(3));
  card.style.setProperty("--ry", (py * 2 - 1).toFixed(3));
  // Glare follows the pointer
  card.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
  card.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
}

/**
 * Returns a card to rest (flat, no glare).
 * In: card (the .case__media element)
 * Out: nothing
 */
function resetTilt(card) {
  card.classList.remove("is-tilting");
  // Back to 0 lets the CSS transition ease it home
  card.style.setProperty("--rx", "0");
  card.style.setProperty("--ry", "0");
}

/**
 * Wires pointer tilt on one card, throttled to one update per frame.
 * In: card (the .case__media element)
 * Out: nothing
 */
function wireCard(card) {
  let frame = 0;
  let lastX = 0;
  let lastY = 0;
  // Only a mouse/pen moves the card; touch keeps native behaviour
  card.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    lastX = e.clientX;
    lastY = e.clientY;
    // One style write per animation frame, however fast the mouse moves
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      card.classList.add("is-tilting");
      setTilt(card, lastX, lastY);
    });
  });
  // Leaving the card cancels any pending frame and eases back
  card.addEventListener("pointerleave", () => {
    if (frame) { cancelAnimationFrame(frame); frame = 0; }
    resetTilt(card);
  });
}

/**
 * Starts pointer tilt on every project card, when allowed.
 * In: nothing
 * Out: nothing
 */
export function initTilt() {
  if (!tiltAllowed()) return;
  // Featured project cards only (one small part of the page)
  document.querySelectorAll(".case__media").forEach(wireCard);
}
