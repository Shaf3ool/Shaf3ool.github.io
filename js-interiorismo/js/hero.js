/* =========================================================================
   hero.js — full-bleed hero built only from Jorge Santana's real renders.
   A slow crossfade with a gentle Ken Burns drift between 4 slides, a
   timeline bar per slide, and a light parallax as the page scrolls away.
   GSAP + ScrollTrigger are classic-script globals (window.gsap).
   ========================================================================= */
import { PROJECTS } from './projects.js';
import { getLang, onLang } from './i18n.js';

const HOLD = 6.2;      // seconds each render stays on screen
const FADE = 1.8;      // crossfade length in seconds

/* -------------------------------------------------------------------------
   hydrate
   What: give a lazily-declared slide image its real src/srcset (slides 2–4
         are not downloaded until the slide before them is showing).
   In:   img (HTMLImageElement)
   Out:  Promise<void> that resolves once the image is decoded (or failed)
   ------------------------------------------------------------------------- */
function hydrate(img) {
  if (img.dataset.src) {
    // srcset first so the browser picks the right width straight away
    img.srcset = img.dataset.srcset;
    img.src = img.dataset.src;
    delete img.dataset.src; delete img.dataset.srcset;
  }
  if (img.complete && img.naturalWidth) return Promise.resolve();
  return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
}

/* -------------------------------------------------------------------------
   titleOf
   What: the project title for a slide in the active language.
   In:   slug (string)
   Out:  string
   ------------------------------------------------------------------------- */
function titleOf(slug) {
  const p = PROJECTS.find((x) => x.slug === slug);
  return p ? `${p.title[getLang()]} · ${p.year}` : '';
}

/* -------------------------------------------------------------------------
   initHero
   What: run the crossfade loop (paused while the hero is off screen or the
         tab is hidden), keep the caption/counter/bars in sync, and add a
         soft scroll parallax. Reduced motion: one still render, no loop.
   In:   { gsap, ScrollTrigger, reduced, onFirstImage }
   Out:  nothing
   ------------------------------------------------------------------------- */
export function initHero({ gsap, ScrollTrigger, reduced, onFirstImage }) {
  const root = document.querySelector('[data-hero]');
  const slides = [...root.querySelectorAll('[data-slide]')];
  const bars = [...root.querySelectorAll('.hero__bars b')];
  const cap = root.querySelector('[data-hero-cap]');
  const num = root.querySelector('[data-hero-n]');
  let index = 0;
  let timer = null;
  let visible = true;

  // the first render decides when the page is "ready"
  hydrate(slides[0].querySelector('img')).then(onFirstImage);

  /* What: write caption + counter for slide i.  In: i  Out: nothing */
  const label = (i) => {
    cap.textContent = titleOf(slides[i].dataset.slug);
    num.textContent = String(i + 1).padStart(2, '0');
  };
  label(0);
  onLang(() => label(index));

  if (reduced) { bars.forEach((b, i) => { b.style.transform = i === 0 ? 'scaleX(1)' : 'scaleX(0)'; }); return; }

  /* What: Ken Burns drift + timeline bar for the slide that is showing.
     In: i  Out: nothing */
  const drift = (i) => {
    const img = slides[i].querySelector('img');
    // alternate the drift direction so consecutive slides don't feel alike
    const dir = i % 2 ? -1 : 1;
    gsap.fromTo(img, { scale: 1.14, xPercent: -1.5 * dir }, { scale: 1.02, xPercent: 1.5 * dir, duration: HOLD + FADE + 0.6, ease: 'none', overwrite: true });
    bars.forEach((b, k) => { gsap.killTweensOf(b); if (k !== i) gsap.set(b, { scaleX: k < i ? 1 : 0 }); });
    gsap.fromTo(bars[i], { scaleX: 0 }, { scaleX: 1, duration: HOLD + FADE, ease: 'none' });
    // warm the next slide while this one is showing
    hydrate(slides[(i + 1) % slides.length].querySelector('img'));
  };

  /* What: crossfade to slide `next`.  In: next  Out: nothing */
  const go = async (next) => {
    await hydrate(slides[next].querySelector('img'));
    const prev = slides[index];
    index = next;
    slides[next].classList.add('is-active');
    gsap.fromTo(slides[next], { opacity: 0 }, { opacity: 1, duration: FADE, ease: 'power2.inOut', onComplete: () => prev.classList.remove('is-active') });
    gsap.to(prev, { opacity: 0, duration: FADE, ease: 'power2.inOut' });
    // caption, Ken Burns and next timer follow the new slide
    label(next);
    drift(next);
    schedule();
  };

  /* What: queue the next crossfade (only while visible).  In/Out: nothing */
  const schedule = () => {
    clearTimeout(timer);
    if (!visible || document.hidden) return;
    timer = setTimeout(() => go((index + 1) % slides.length), (HOLD + FADE) * 1000);
  };

  gsap.set(slides, { opacity: 0 }); gsap.set(slides[0], { opacity: 1 });
  drift(0);
  schedule();

  // pause the loop and every tween in the hero when it cannot be seen
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) schedule(); else clearTimeout(timer);
  }).observe(root);
  document.addEventListener('visibilitychange', schedule);

  // scroll away: the media drifts down slower than the page, copy fades up
  gsap.to('[data-hero-media]', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('[data-hero-copy]', { y: -60, opacity: 0, ease: 'none', scrollTrigger: { trigger: root, start: 'top top', end: '70% top', scrub: true } });
  gsap.to('.scrollcue', { opacity: 0, ease: 'none', scrollTrigger: { trigger: root, start: 'top top', end: '15% top', scrub: true } });
  ScrollTrigger.refresh();
}
