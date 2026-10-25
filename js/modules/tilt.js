/* ==========================================================
   modules/tilt.js — strong, clearly visible 3D on the project
   cards (.case__media). Writes CSS variables only; the look
   lives in css/depth.css. Three inputs, one style write per
   card per frame at most:
   - Mouse/trackpad: the card tilts hard toward the pointer,
     with a moving shine and the phone mock floating forward.
   - Finger (phones): press + drag on a card tilts it under
     the finger and dips it in; release springs back. A tap
     still opens the site.
   - Scroll (everyone): each visible card leans back as it
     enters, stands up mid-screen and tips forward as it
     leaves, while the phone mock slides against the desktop
     shot (parallax depth).
   prefers-reduced-motion: nothing runs, cards stay flat.
   ========================================================== */

// Cards currently on screen (only these get scroll updates)
const visible = new Set();
// Pointer positions waiting for the next frame: card → {x, y}
const pending = new Map();
let frameQueued = false;
let scrollDirty = true;

/**
 * Says whether motion is allowed for this visitor.
 * In: nothing
 * Out: boolean
 */
function motionAllowed() {
  if (!window.matchMedia) return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Writes the pointer-tilt variables for one card.
 * In: card (.case__media element), x / y (pointer in viewport px)
 * Out: nothing (sets --rx, --ry, --gx, --gy)
 */
function setTilt(card, x, y) {
  const box = card.getBoundingClientRect();
  // Position inside the card, 0 … 1 on each axis
  const px = Math.min(Math.max((x - box.left) / box.width, 0), 1);
  const py = Math.min(Math.max((y - box.top) / box.height, 0), 1);
  // Centre-based −1 … 1 values drive the rotation
  card.style.setProperty("--rx", (px * 2 - 1).toFixed(3));
  card.style.setProperty("--ry", (py * 2 - 1).toFixed(3));
  // The shine sits under the pointer
  card.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
  card.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
}

/**
 * Writes the scroll lean (--sy, −1 … 1) for every visible card.
 * In: nothing
 * Out: nothing
 */
function updateScroll() {
  const vh = window.innerHeight || 1;
  visible.forEach((card) => {
    const box = card.getBoundingClientRect();
    // 1 when the card's centre is at the bottom edge, −1 at the top edge
    const centre = box.top + box.height / 2;
    const sy = Math.min(Math.max((centre - vh / 2) / (vh / 2 + box.height / 2), -1), 1);
    card.style.setProperty("--sy", sy.toFixed(3));
  });
}

/**
 * Applies everything queued for this frame (pointer + scroll).
 * In: nothing
 * Out: nothing
 */
function flush() {
  frameQueued = false;
  // Pointer tilts first, then the scroll lean
  pending.forEach((pos, card) => setTilt(card, pos.x, pos.y));
  pending.clear();
  if (scrollDirty) {
    scrollDirty = false;
    updateScroll();
  }
}

/**
 * Asks for one animation frame, if none is waiting.
 * In: nothing
 * Out: nothing
 */
function queue() {
  if (frameQueued) return;
  frameQueued = true;
  requestAnimationFrame(flush);
}

/**
 * Returns a card to rest (flat to the pointer, no shine, no press).
 * In: card (.case__media element)
 * Out: nothing
 */
function resetTilt(card) {
  pending.delete(card);
  card.classList.remove("is-tilting", "is-pressed");
  // Back to 0 lets the CSS transition spring it home
  card.style.setProperty("--rx", "0");
  card.style.setProperty("--ry", "0");
}

/**
 * Wires mouse and finger tilt on one card.
 * In: card (.case__media element)
 * Out: nothing
 */
function wireCard(card) {
  let fingerDown = false;
  // Mouse/pen: follow while hovering
  card.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch" && !fingerDown) return;
    card.classList.add("is-tilting");
    pending.set(card, { x: e.clientX, y: e.clientY });
    queue();
  });
  // Finger: press dips the card in and tilts it under the finger
  card.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "touch") return;
    fingerDown = true;
    card.classList.add("is-tilting", "is-pressed");
    pending.set(card, { x: e.clientX, y: e.clientY });
    queue();
  });
  // Release, cancel (page scroll took over) or leave: spring back
  const end = () => {
    fingerDown = false;
    resetTilt(card);
  };
  card.addEventListener("pointerup", end);
  card.addEventListener("pointercancel", end);
  card.addEventListener("pointerleave", end);
}

/**
 * Switches a card to quick response once its reveal tip-up is done.
 * In: card (.case__media element)
 * Out: nothing
 */
function markReady(card) {
  const article = card.closest(".case");
  // The reveal lean-back transition lasts ~1.2 s after .is-in appears
  const check = () => {
    if (article && !article.classList.contains("is-in")) return setTimeout(check, 250);
    setTimeout(() => card.classList.add("is-ready"), 1300);
  };
  check();
}

/**
 * Starts the card 3D on every project card, when motion is allowed.
 * In: nothing
 * Out: nothing
 */
export function initTilt() {
  if (!motionAllowed()) return;
  const cards = document.querySelectorAll(".case__media");
  cards.forEach((card) => {
    wireCard(card);
    markReady(card);
  });
  // Track which cards are on screen so scroll work stays tiny
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => (en.isIntersecting ? visible.add(en.target) : visible.delete(en.target)));
      scrollDirty = true;
      queue();
    }, { rootMargin: "10% 0px" });
    cards.forEach((c) => io.observe(c));
  }
  // One scroll read/write pass per frame, never more
  const onScroll = () => { scrollDirty = true; queue(); };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
}
