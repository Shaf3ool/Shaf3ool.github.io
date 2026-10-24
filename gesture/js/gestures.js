/* ==========================================================
   gestures.js — turns 21 MediaPipe hand landmarks into simple
   numbers and events: pinch amount, hand position, open/fist.
   Pure math, no DOM and no Three.js, so it is easy to test.

   Landmark indices (MediaPipe Hands):
   0 wrist · 4 thumb tip · 5 index base · 8 index tip
   9 middle base · 12 middle tip · 16 ring tip · 17 pinky base · 20 pinky tip
   ========================================================== */

import { GESTURE } from "./config.js";

// Finger tip / middle-joint pairs used to decide "extended or curled"
const FINGERS = [
  { tip: 8, pip: 6 },    // index
  { tip: 12, pip: 10 },  // middle
  { tip: 16, pip: 14 },  // ring
  { tip: 20, pip: 18 },  // pinky
];

/*
 * dist — straight-line distance between two landmarks (x, y only).
 * In:  a, b — {x, y} points in normalised image space (0..1)
 * Out: number — distance in the same units
 */
export function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/*
 * clamp01 — keep a number inside 0..1.
 * In:  v — any number
 * Out: number between 0 and 1
 */
export function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

/*
 * palmSize — a stable "ruler" for this hand: wrist to middle-finger base.
 * Dividing by it makes gestures work whether the hand is near or far.
 * In:  lm — array of 21 landmarks
 * Out: number (> 0)
 */
export function palmSize(lm) {
  return Math.max(1e-4, dist(lm[0], lm[9]));
}

/*
 * pinchAmount — how open the thumb–index "pinch" is.
 * In:  lm — array of 21 landmarks
 * Out: number 0 (touching) .. 1 (wide open)
 */
export function pinchAmount(lm) {
  const gap = dist(lm[4], lm[8]) / palmSize(lm);
  // Map the raw gap into 0..1 using the configured range
  return clamp01((gap - GESTURE.pinchMin) / (GESTURE.pinchMax - GESTURE.pinchMin));
}

/*
 * palmCenter — centre of the palm, mirrored so moving your hand
 * right moves it right on screen (front cameras are mirrored).
 * In:  lm — array of 21 landmarks
 * Out: {x, y} — 0..1, (0,0) = top-left of the screen
 */
export function palmCenter(lm) {
  const ids = [0, 5, 9, 13, 17];
  let x = 0;
  let y = 0;
  // Average the wrist and the four finger bases
  for (const i of ids) {
    x += lm[i].x;
    y += lm[i].y;
  }
  return { x: 1 - x / ids.length, y: y / ids.length };
}

/*
 * palmRoll — how much the hand is turned like a knob (in the image plane).
 * Folded to ±90° so left and right hands behave the same.
 * In:  lm — array of 21 landmarks
 * Out: number — radians, about 0 when the hand is upright
 */
export function palmRoll(lm) {
  // Vector across the knuckles (index base → pinky base), mirrored on X
  const dx = -(lm[17].x - lm[5].x);
  const dy = lm[17].y - lm[5].y;
  let a = Math.atan2(dy, dx);
  // Fold so a left hand (pointing the other way) reads the same as a right hand
  if (a > Math.PI / 2) a -= Math.PI;
  if (a < -Math.PI / 2) a += Math.PI;
  return a;
}

/*
 * isExtended — is one finger straight?
 * In:  lm — landmarks; f — {tip, pip} pair
 * Out: boolean
 */
function isExtended(lm, f) {
  return dist(lm[f.tip], lm[0]) > dist(lm[f.pip], lm[0]) * 1.12;
}

/*
 * extendedCount — how many of the 4 long fingers are straight.
 * A finger is "extended" when its tip is farther from the wrist than its middle joint.
 * In:  lm — array of 21 landmarks
 * Out: integer 0..4
 */
export function extendedCount(lm) {
  let n = 0;
  // Compare tip-to-wrist with joint-to-wrist for each finger
  for (const f of FINGERS) {
    if (isExtended(lm, f)) n += 1;
  }
  return n;
}

/*
 * handPose — names the pose of the hand.
 * In:  lm — array of 21 landmarks
 * Out: "fist" | "open" | "peace" | "other"
 */
export function handPose(lm) {
  const ext = extendedCount(lm);
  const thumbOut = dist(lm[4], lm[17]) / palmSize(lm) > 0.9;
  // Fist: no long finger extended. Open: all four plus the thumb out.
  if (ext === 0) return "fist";
  if (ext === 4 && thumbOut) return "open";
  // Peace / V sign: only index + middle straight
  if (ext === 2 && isExtended(lm, FINGERS[0]) && isExtended(lm, FINGERS[1])) return "peace";
  return "other";
}

/*
 * createPoseTrigger — turns a noisy per-frame pose into clean one-shot events.
 * A pose must be held for GESTURE.holdMs, then a cooldown blocks repeats.
 * In:  onTrigger — function(poseName) called once per confirmed gesture
 * Out: { update(pose, nowMs) } — call every frame with the current pose
 */
export function createPoseTrigger(onTrigger) {
  let current = "other";   // pose seen on the previous frame
  let since = 0;           // when that pose started
  let fired = false;       // already triggered during this hold?
  let lastFire = -Infinity;

  return {
    /*
     * update — feed one frame's pose.
     * In:  pose — "fist" | "open" | "peace" | "other" | "none"; nowMs — timestamp in ms
     * Out: nothing (calls onTrigger when a hold completes)
     */
    update(pose, nowMs) {
      // A new pose restarts the hold timer
      if (pose !== current) {
        current = pose;
        since = nowMs;
        fired = false;
        return;
      }
      // Only fist / open / peace are triggers; respect hold time and cooldown
      const held = nowMs - since >= GESTURE.holdMs;
      const cooled = nowMs - lastFire >= GESTURE.cooldownMs;
      if ((pose === "fist" || pose === "open" || pose === "peace") && held && cooled && !fired) {
        fired = true;
        lastFire = nowMs;
        onTrigger(pose);
      }
    },
  };
}
