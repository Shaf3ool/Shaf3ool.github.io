/* ============================================================
   scroll.js — Lenis (smooth scroll) + GSAP ScrollTrigger
   Relie chaque scène épinglée à sa séquence d'images.
   ============================================================ */
import { SCENES, PRELOAD_AHEAD } from "./config.js";
import { ImageSequence } from "./sequence.js";

/**
 * initSmoothScroll — démarre Lenis et le synchronise avec ScrollTrigger.
 * In:  rien (utilise window.Lenis, window.gsap, window.ScrollTrigger)
 * Out: instance Lenis (ou null si indisponible)
 */
export function initSmoothScroll() {
  if (!window.Lenis) return null;
  const lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
  // ScrollTrigger recalcule à chaque frame de Lenis
  lenis.on("scroll", window.ScrollTrigger.update);
  // Une seule boucle d'animation : celle de GSAP
  window.gsap.ticker.add((time) => lenis.raf(time * 1000));
  window.gsap.ticker.lagSmoothing(0);
  // Liens d'ancre (#carte…) : défilement doux via Lenis
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -10 });
    });
  });
  return lenis;
}

/**
 * initScenes — crée une ImageSequence par scène et la pilote au scroll.
 * In:  reduced (booléen : l'utilisateur préfère moins d'animations)
 * Out: tableau des séquences créées
 */
export function initScenes(reduced) {
  const { gsap, ScrollTrigger } = window;
  const sequences = [];
  document.querySelectorAll(".scene").forEach((section, i) => {
    const scene = SCENES[section.dataset.scene];
    if (!scene) return;
    const seq = new ImageSequence(section.querySelector(".scene__canvas"), scene);
    sequences.push(seq);
    const copy = section.querySelector(".scene__copy");

    // Mode réduit : une seule image fixe (la dernière, la plus « finie »)
    if (reduced) {
      seq.progress = 1;
      seq.load();
      return;
    }
    // Fenêtre de mémoire : charge à l'approche (PRELOAD_AHEAD écrans avant),
    // libère quand la scène est loin (même marge après) — mémoire bornée sur mobile
    if (i === 0) seq.load();
    ScrollTrigger.create({
      trigger: section,
      start: () => `top bottom+=${window.innerHeight * PRELOAD_AHEAD}`,
      end: () => `bottom top-=${window.innerHeight * PRELOAD_AHEAD}`,
      onToggle: (self) => (self.isActive ? seq.load() : seq.release()),
    });
    // Scrub : la progression du scroll dans la section = l'image affichée
    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => seq.setProgress(self.progress),
    });
    // Le texte entre puis s'efface en fin de scène (sauf la 1re qui est déjà visible)
    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: true },
    });
    if (i > 0) tl.fromTo(copy, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.2 });
    tl.to(copy, { autoAlpha: 1, duration: 0.55 });               // temps de lecture
    tl.to(copy, { autoAlpha: 0, y: -40, duration: 0.25 });        // sortie
  });

  // Redimensionnement : canvas recalculés (debounce léger)
  let timer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(() => sequences.forEach((s) => s.resize()), 120);
  });
  return sequences;
}
