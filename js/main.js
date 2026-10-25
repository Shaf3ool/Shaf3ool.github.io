/* ==========================================================
   main.js — entry point. Imports each module and starts it.
   Modules: lang (EN/FR), nav (header), reveal (scroll fades),
   tilt (3D tilt on the project cards), hero3d (interactive
   3D phone in the hero, lazy-loaded).
   ========================================================== */

import { initLang } from "./modules/lang.js";
import { initNav } from "./modules/nav.js";
import { initReveal } from "./modules/reveal.js";
import { initTilt } from "./modules/tilt.js";
import { initHero3D } from "./modules/hero3d.js";

/**
 * Boots the page: flags JS, sets the footer year, starts modules.
 * In: nothing
 * Out: nothing
 */
function boot() {
  // CSS hides .reveal items only when this class is present
  document.documentElement.classList.add("js");
  // Current year in the footer
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
  // Feature modules
  initLang();
  initNav();
  initReveal();
  initTilt();
  // Hero 3D last: it only schedules work for after first paint
  initHero3D();
}

boot();
