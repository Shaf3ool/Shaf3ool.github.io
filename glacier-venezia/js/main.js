/* ============================================================
   main.js — point d'entrée
   Attend GSAP/Lenis (scripts « defer »), puis initialise tout.
   ============================================================ */
import { initSmoothScroll, initScenes } from "./scroll.js";
import { initSplitTitles, initReveal } from "./reveal.js";
import { initNav, highlightToday, initDemoButtons } from "./ui.js";

/**
 * boot — initialise la page dans le bon ordre.
 * In:  rien
 * Out: rien
 */
function boot() {
  // Préférence système « réduire les animations »
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Interface de base : marche même sans GSAP
  initNav();
  highlightToday();
  initDemoButtons();
  initReveal();
  // Sans GSAP (CDN bloqué) : on garde une page lisible, sans animation
  if (!window.gsap || !window.ScrollTrigger) { document.querySelectorAll(".scene").forEach((s) => s.classList.add("static")); return; }
  window.gsap.registerPlugin(window.ScrollTrigger);
  if (!reduced) initSmoothScroll();
  initScenes(reduced);
  initSplitTitles(reduced);
  // Recalcul des positions une fois les polices chargées (hauteurs de titres)
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => window.ScrollTrigger.refresh());
}

// Les modules s'exécutent après les scripts « defer » : GSAP est déjà là
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
