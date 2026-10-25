/* ==========================================================
   main.js — boots v2 "Galería blanca": language, smooth scroll,
   the full-bleed render hero, reveals, menu, cursor,
   swatch tilt and the demo form. No WebGL anywhere.
   ========================================================== */
import { initLang } from './i18n.js';
import { initProjects } from './projects.js';
import { initHero } from './hero.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
document.documentElement.classList.add('js');

/* What: Lenis inertia scroll tied to GSAP's ticker (wheel only; touch stays native).
   In: nothing. Out: Lenis instance or null */
function initScroll() {
  const { gsap, ScrollTrigger, Lenis } = window;
  if (!gsap || !ScrollTrigger) return null;
  gsap.registerPlugin(ScrollTrigger);
  if (reduced || !Lenis) return null;
  const lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.95 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  // anchor links glide instead of jumping
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const el = id === '#top' ? document.body : document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(id === '#top' ? 0 : el, { offset: id === '#top' ? 0 : -8, duration: 1.4 });
    });
  });
  window.__lenis = lenis;
  return lenis;
}

/* What: fade/rise elements tagged data-reveal as they enter.
   In: nothing. Out: nothing */
function initReveal() {
  const els = document.querySelectorAll('[data-reveal]');
  if (reduced || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-in')); return; }
  const io = new IntersectionObserver((ents) => {
    ents.forEach((en) => {
      if (!en.isIntersecting) return;
      // small stagger for siblings revealed together
      const sibs = [...en.target.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
      en.target.style.transitionDelay = `${Math.min(sibs.indexOf(en.target), 6) * 70}ms`;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach((e) => io.observe(e));
}

/* What: header turns solid after the hero; active nav link follows the section.
   In: nothing. Out: nothing */
function initHeader() {
  const hdr = document.querySelector('.hdr');
  const hero = document.querySelector('[data-hero]');
  /* What: header is light-on-dark over the hero, solid paper after it.
     In: nothing. Out: nothing */
  const onScroll = () => {
    const end = hero ? hero.offsetTop + hero.offsetHeight - hdr.offsetHeight : 0;
    const past = window.scrollY > end;
    hdr.classList.toggle('is-solid', past);
    hdr.classList.toggle('on-hero', !past);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  // highlight current section in the nav
  const links = [...document.querySelectorAll('.hdr__nav a')];
  const io = new IntersectionObserver((ents) => {
    ents.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main section[id]').forEach((s) => io.observe(s));
}

/* What: full-screen mobile menu. In: nothing. Out: nothing */
function initMenu() {
  const btn = document.querySelector('[data-menu-open]');
  const menu = document.getElementById('menu');
  /* What: open/close the menu. In: boolean. Out: nothing */
  const set = (open) => {
    menu.hidden = !open;
    // dark-on-light header while the paper menu is open
    document.documentElement.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (window.__lenis) open ? window.__lenis.stop() : window.__lenis.start();
  };
  btn.addEventListener('click', () => set(menu.hidden));
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => set(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) set(false); });
}

/* What: "Ver" cursor bubble over projects (desktop pointers only).
   In: nothing. Out: nothing */
function initCursor() {
  if (!fine || reduced) return;
  const c = document.querySelector('.cursor');
  let x = -100, y = -100, cx = -100, cy = -100;
  window.addEventListener('pointermove', (e) => {
    x = e.clientX; y = e.clientY;
    c.classList.toggle('is-on', !!e.target.closest('[data-cursor]') && !e.target.closest('[data-lb]'));
  }, { passive: true });
  /* What: ease the bubble toward the pointer. In: nothing. Out: nothing */
  const loop = () => {
    cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
    c.style.translate = `${cx}px ${cy}px`;
    requestAnimationFrame(loop);
  };
  loop();
}

/* What: tactile tilt (CSS perspective) on the material tiles (pointer position).
   In: nothing. Out: nothing */
function initTilt() {
  if (!fine || reduced) return;
  document.querySelectorAll('[data-tilt]').forEach((tile) => {
    tile.addEventListener('pointermove', (e) => {
      const r = tile.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      tile.style.transform = `perspective(700px) rotateX(${-py * 10}deg) rotateY(${px * 12}deg) translateZ(6px)`;
      tile.style.boxShadow = `${-px * 18}px ${22 - py * 10}px 38px -22px rgba(17,17,17,.45)`;
    });
    tile.addEventListener('pointerleave', () => { tile.style.transform = ''; tile.style.boxShadow = ''; });
  });
}

/* What: demo-only contact form (never sends anything).
   In: nothing. Out: nothing */
function initForm() {
  const form = document.querySelector('[data-form]');
  const note = document.querySelector('[data-form-note]');
  form.querySelectorAll('.chip').forEach((ch) => ch.addEventListener('click', () => {
    form.querySelectorAll('.chip').forEach((c) => c.classList.remove('is-on'));
    ch.classList.add('is-on');
  }));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    note.dataset.i18n = 'f.sent';
    import('./i18n.js').then(({ t }) => { note.textContent = t('f.sent'); });
    note.classList.add('is-flash');
  });
}

/* What: boot everything in order. In: nothing. Out: nothing */
function boot() {
  initLang();
  initProjects();
  initScroll();
  initHeader();
  initMenu();
  initReveal();
  initCursor();
  initTilt();
  initForm();
  initHero({ reduced });
  // fonts change line lengths → re-measure scroll triggers once loaded
  if (document.fonts && window.ScrollTrigger) document.fonts.ready.then(() => window.ScrollTrigger.refresh());
}
boot();
