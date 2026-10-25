/* ==========================================================
   hero.js — full-bleed hero made only of Jorge Santana's renders.
   A slow crossfade with a Ken Burns drift (CSS), a caption with the
   render's name + counter, a light GSAP intro and a scroll parallax.
   No WebGL: every pixel on screen is one of his images.
   ========================================================== */
import { lang, onLang } from './i18n.js';

const HOLD = 6500;          // ms each render stays on screen
let slides = [];            // <figure data-slide> nodes
let current = 0;            // index of the visible slide
let timer = 0;              // setTimeout handle for the next swap
let running = false;        // true while the rotation is allowed to run

/* What: pad a number to two digits for the "01 / 04" counter.
   In: n (number). Out: string */
function pad(n) { return String(n).padStart(2, '0'); }

/* What: load the deferred srcset/src of one slide (only slide 1 loads eagerly).
   In: figure element. Out: nothing (img starts loading) */
function hydrate(fig) {
  const img = fig.querySelector('img');
  if (!img || !img.dataset.src) return;
  img.srcset = img.dataset.srcset;
  img.src = img.dataset.src;
  // clear the markers so we never hydrate twice
  delete img.dataset.src;
  delete img.dataset.srcset;
}

/* What: write the caption (name, counter) and restart the progress line.
   In: nothing. Out: nothing */
function paintCaption() {
  const fig = slides[current];
  const name = document.querySelector('[data-hero-name]');
  const count = document.querySelector('[data-hero-count]');
  const bar = document.querySelector('[data-hero-bar]');
  // name follows the ES/EN toggle
  if (name) name.textContent = lang() === 'en' ? fig.dataset.titleEn : fig.dataset.titleEs;
  if (count) count.textContent = `${pad(current + 1)} / ${pad(slides.length)}`;
  if (!bar) return;
  // restart the CSS progress animation (reflow between class toggles)
  bar.classList.remove('is-run');
  void bar.offsetWidth;
  if (running) { bar.style.setProperty('--dur', HOLD + 'ms'); bar.classList.add('is-run'); }
}

/* What: keep every slide's alt text in the current language.
   In: nothing. Out: nothing */
function paintAlts() {
  slides.forEach((fig) => {
    const img = fig.querySelector('img');
    img.alt = lang() === 'en' ? img.dataset.altEn : img.dataset.altEs;
  });
}

/* What: show slide i (crossfade handled by CSS opacity transition).
   In: i (index). Out: nothing */
function go(i) {
  const next = (i + slides.length) % slides.length;
  hydrate(slides[next]);
  // warm the one after, so it is decoded before its turn
  hydrate(slides[(next + 1) % slides.length]);
  slides[current].classList.remove('is-on');
  slides[next].classList.add('is-on');
  current = next;
  paintCaption();
}

/* What: schedule the next swap if the rotation is running.
   In: nothing. Out: nothing */
function schedule() {
  clearTimeout(timer);
  if (!running) return;
  timer = setTimeout(() => { go(current + 1); schedule(); }, HOLD);
}

/* What: start/stop the rotation (stops when the hero is off-screen or the tab hidden).
   In: on (boolean). Out: nothing */
function setRunning(on) {
  if (on === running) return;
  running = on;
  paintCaption();
  schedule();
}

/* What: GSAP intro (title lines rise) and a light scroll parallax on the slides.
   In: reduced (boolean). Out: nothing */
function motion(reduced) {
  const { gsap } = window;
  if (!gsap || reduced) return;
  // wrap each line's content once so it can rise inside its own mask
  document.querySelectorAll('.hero__title .ln').forEach((ln) => { ln.innerHTML = `<span>${ln.innerHTML}</span>`; });
  const lines = document.querySelectorAll('.hero__title .ln > span');
  // headline lines rise from their own masks
  gsap.from(lines, { yPercent: 105, duration: 1.4, ease: 'expo.out', stagger: 0.09, delay: 0.15 });
  gsap.from('.hero__meta, .hero__foot', { opacity: 0, y: 14, duration: 1.2, ease: 'power2.out', delay: 0.5 });
  if (!window.ScrollTrigger) return;
  // as the page scrolls, the renders drift slower than the type (a quiet sense of depth)
  gsap.to('.hero__slides', {
    yPercent: 14, ease: 'none',
    scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('.hero__inner', {
    opacity: 0, y: -40, ease: 'none',
    scrollTrigger: { trigger: '[data-hero]', start: '4% top', end: '48% top', scrub: true }
  });
}

/* What: wire the hero. In: { reduced } (prefers-reduced-motion). Out: nothing */
export function initHero({ reduced }) {
  const hero = document.querySelector('[data-hero]');
  if (!hero) return;
  slides = [...hero.querySelectorAll('[data-slide]')];
  if (!slides.length) return;
  paintAlts();
  paintCaption();
  onLang(() => { paintAlts(); paintCaption(); });
  motion(reduced);
  // the second render is fetched only after the page has loaded (first paint stays light)
  const warm = () => setTimeout(() => hydrate(slides[1 % slides.length]), 800);
  if (document.readyState === 'complete') warm(); else window.addEventListener('load', warm, { once: true });
  // reduced motion: keep the rotation but it swaps without drift (CSS kills animations)
  let visible = true;
  /* What: recompute whether the rotation should run. In: nothing. Out: nothing */
  const update = () => setRunning(visible && !document.hidden);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; update(); }, { threshold: 0.05 }).observe(hero);
  }
  document.addEventListener('visibilitychange', update);
  update();
}
