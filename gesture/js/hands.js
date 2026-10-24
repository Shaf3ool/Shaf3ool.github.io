/* ==========================================================
   hands.js — webcam + MediaPipe Hand Landmarker.
   Loaded only when the user taps "Enable camera", so visitors
   in touch mode never download the ~8 MB model.
   Video frames stay in this browser tab; nothing is uploaded.
   ========================================================== */

import { CDN, HAND } from "./config.js";

// MediaPipe's WebAssembly runtime prints internal start-up lines
// (TensorFlow Lite / glog "INFO:", "I0000", "W0000"...). They are not
// problems in our page, so we hide exactly those lines to keep the console clean.
const MP_NOISE = /^(INFO:|I\d{4}|W\d{4}|WARNING: All log messages|Created TensorFlow Lite|Graph successfully)/;

/*
 * muteMediaPipeLogs — filters MediaPipe's internal log lines out of the console.
 * Every other message still passes through untouched.
 * In:  nothing
 * Out: nothing
 */
function muteMediaPipeLogs() {
  for (const level of ["log", "info", "warn", "error"]) {
    const original = console[level].bind(console);
    // Wrap each console method once
    console[level] = (...args) => {
      if (typeof args[0] === "string" && MP_NOISE.test(args[0])) return;
      original(...args);
    };
  }
}

/*
 * startCamera — asks for the front camera and plays it into the hidden <video>.
 * In:  video — HTMLVideoElement
 * Out: Promise<MediaStream> — rejects if denied or unavailable
 */
export async function startCamera(video) {
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Camera needs HTTPS and a browser with camera support.");
  }
  // Small resolution = faster tracking, plenty for 21 landmarks
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
  });
  video.srcObject = stream;
  await video.play();
  return stream;
}

/*
 * stopCamera — turns the camera light off and releases the stream.
 * In:  video — HTMLVideoElement holding the stream
 * Out: nothing
 */
export function stopCamera(video) {
  const stream = video.srcObject;
  if (stream) stream.getTracks().forEach((t) => t.stop());
  video.srcObject = null;
}

/*
 * createHandTracker — downloads MediaPipe and the hand model on the configured
 * processor (HAND.delegate), falling back to the other one if it fails.
 * In:  nothing
 * Out: Promise<{ detect(video, nowMs) → landmarks[] | null, close() }>
 */
export async function createHandTracker() {
  muteMediaPipeLogs();
  const { FilesetResolver, HandLandmarker } = await import(CDN.visionBundle);
  const fileset = await FilesetResolver.forVisionTasks(CDN.visionWasm);

  /*
   * build — creates a HandLandmarker on the chosen processor.
   * In:  delegate — "GPU" | "CPU"
   * Out: Promise<HandLandmarker>
   */
  const build = (delegate) =>
    HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: CDN.handModel, delegate },
      runningMode: "VIDEO",
      numHands: 1,
      minHandDetectionConfidence: 0.6,
      minHandPresenceConfidence: 0.6,
      minTrackingConfidence: 0.5,
    });

  // Try the configured processor first, then the other one
  let landmarker;
  try {
    landmarker = await build(HAND.delegate);
  } catch {
    landmarker = await build(HAND.delegate === "GPU" ? "CPU" : "GPU");
  }

  let lastVideoTime = -1;
  return {
    /*
     * detect — runs the model on the current video frame (skips repeated frames).
     * In:  video — playing HTMLVideoElement; nowMs — performance.now()
     * Out: array of 21 {x,y,z} landmarks for the first hand, null if none, undefined if no new frame
     */
    detect(video, nowMs) {
      if (video.readyState < 2 || video.currentTime === lastVideoTime) return undefined;
      lastVideoTime = video.currentTime;
      const result = landmarker.detectForVideo(video, nowMs);
      return result.landmarks && result.landmarks.length ? result.landmarks[0] : null;
    },
    /*
     * close — frees the model's memory.
     * In:  nothing
     * Out: nothing
     */
    close() {
      landmarker.close();
    },
  };
}
