/* =========================================================================
   main.js — page orchestration for Js Interiorismo · site v1
   Boot order: language → smooth scroll → hero renders → story → finishes
   → projects → reveals. No WebGL anywhere: every image is Jorge's own.
   GSAP, ScrollTrigger and Lenis are loaded as classic scripts (globals).
   ========================================================================= */
import { applyLang, initialLang, onLang, t, getLang } from './i18n.js';
import { PROJECTS } from './projects.js';
// page modules (no WebGL): hero renders, story chapters, 2D finishes
import { initHero } from './hero.js';
import { initStory } from './story.js';
import { initFinishes } from './finishes.js';

// libraries are classic scripts, read from window
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

let lenis = null;

/* -------------------------------------------------------------------------
   initScroll
   What: Lenis inertia scrolling driven by GSAP's ticker, so ScrollTrigger
         and the smooth scroll share one clock. Skipped for reduced motion.
   In:   nothing
   Out:  nothing (sets module-level `lenis`)
   ------------------------------------------------------------------------- */
function initScroll() {
  gsap.registerPlugin(ScrollTrigger);
  if (reduced || typeof window.Lenis !== 'function') return;
  lenis = new window.Lenis({ duration: 1.15, smoothWheel: true, easing: (x) => 1 - Math.pow(1 - x, 3.2) });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  // in-page anchors go through Lenis for the same easing
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const target = $(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    closeMenu();
    // the header is fixed: land the section just below it
    lenis.scrollTo(target, { offset: a.getAttribute('href') === '#top' ? 0 : -8 });
  }));
}

/* -------------------------------------------------------------------------
   reveal
   What: hide the preloader (once the first hero render is decoded, or on
         a timeout so a slow network never traps the visitor).
   In:   nothing
   Out:  nothing
   ------------------------------------------------------------------------- */
let revealed = false;
function reveal() {
  if (revealed) return;
  revealed = true;
  document.body.classList.remove('is-loading');
  // hero copy rises in after the veil lifts
  if (!reduced) gsap.from('[data-hero-copy] > *', { y: 36, opacity: 0, duration: 1.3, stagger: 0.09, ease: 'power3.out', delay: 0.25 });
  ScrollTrigger.refresh();
}

/* -------------------------------------------------------------------------
   renderProjects
   What: build the project cards from PROJECTS in the active language.
   In:   nothing
   Out:  nothing
   ------------------------------------------------------------------------- */
function renderProjects() {
  const grid = $('[data-grid]');
  const L = getLang();
  grid.innerHTML = PROJECTS.map((p, i) => {
    const im = p.images[0];
    return `<li class="pcard" data-group="${p.group}" data-index="${i}" tabindex="0" role="button" aria-label="${p.title[L]}">
      <figure>
        <div class="pcard__img"><img src="${im.sm}" srcset="${im.sm} 900w, ${im.src} 1800w" sizes="(max-width: 800px) 100vw, 50vw" width="${im.w}" height="${im.h}" loading="lazy" decoding="async" alt="${p.title[L]} — ${p.category[L]}, render de Jorge Santana"></div>
        <figcaption class="pcard__meta"><h3>${p.title[L]}</h3><span>${p.category[L]} · ${p.year}</span></figcaption>
      </figure></li>`;
  }).join('');
  // every card opens the lightbox by click or Enter
  $$('.pcard', grid).forEach((c) => {
    c.addEventListener('click', () => openLightbox(+c.dataset.index));
    c.addEventListener('keydown', (e) => { if (e.key === 'Enter') openLightbox(+c.dataset.index); });
  });
  applyFilter(currentFilter);
  bindCursor();
}

let currentFilter = 'all';
/* -------------------------------------------------------------------------
   applyFilter
   What: show only the projects of one group.
   In:   f ('all' | group id)
   Out:  nothing
   ------------------------------------------------------------------------- */
function applyFilter(f) {
  currentFilter = f;
  $$('.pcard').forEach((c) => { c.hidden = !(f === 'all' || c.dataset.group === f); });
  $$('[data-filter]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.filter === f)));
  ScrollTrigger.refresh();
}

/* -------------------------------------------------------------------------
   openLightbox
   What: show one project large (all its images, caption, source link).
   In:   i (index in PROJECTS)
   Out:  nothing
   ------------------------------------------------------------------------- */
let lbIndex = 0;
function openLightbox(i) {
  const lb = $('[data-lb]');
  const L = getLang();
  lbIndex = (i + PROJECTS.length) % PROJECTS.length;
  const p = PROJECTS[lbIndex];
  $('[data-lb-media]').innerHTML = p.images.map((im) => `<img src="${im.src}" width="${im.w}" height="${im.h}" alt="${p.title[L]} — render de Jorge Santana">`).join('');
  // caption, story and the Instagram source of the project
  $('[data-lb-cat]').textContent = `${p.category[L]} · ${p.year}`;
  $('[data-lb-title]').textContent = p.title[L];
  $('[data-lb-text]').textContent = p.text[L];
  $('[data-lb-src]').href = p.source;
  $('[data-lb-media]').scrollTop = 0;
  if (!lb.open) { lb.showModal(); if (lenis) lenis.stop(); }
}

/* -------------------------------------------------------------------------
   initLightbox
   What: close / previous / next / keyboard / swipe for the lightbox.
   In:   nothing
   Out:  nothing
   ------------------------------------------------------------------------- */
function initLightbox() {
  const lb = $('[data-lb]');
  const close = () => { lb.close(); };
  lb.addEventListener('close', () => { if (lenis) lenis.start(); });
  $('[data-lb-close]').addEventListener('click', close);
  $('[data-lb-prev]').addEventListener('click', () => openLightbox(lbIndex - 1));
  $('[data-lb-next]').addEventListener('click', () => openLightbox(lbIndex + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  lb.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') openLightbox(lbIndex + 1); if (e.key === 'ArrowLeft') openLightbox(lbIndex - 1); });
  // horizontal swipe on touch screens
  let x0 = null;
  lb.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 60) openLightbox(lbIndex + (dx < 0 ? 1 : -1));
    x0 = null;
  });
}

/* -------------------------------------------------------------------------
   bindCursor
   What: "Ver" bubble cursor that follows the mouse over project cards.
   In:   nothing
   Out:  nothing
   ------------------------------------------------------------------------- */
let cursorBound = false;
function bindCursor() {
  const cur = $('[data-cursor]');
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  $$('.pcard').forEach((c) => {
    c.addEventListener('mouseenter', () => cur.classList.add('is-on'));
    c.addEventListener('mouseleave', () => cur.classList.remove('is-on'));
  });
  // the follow-the-mouse listener is bound once only
  if (cursorBound) return;
  cursorBound = true;
  const xTo = gsap.quickTo(cur, 'x', { duration: 0.45, ease: 'power3' });
  const yTo = gsap.quickTo(cur, 'y', { duration: 0.45, ease: 'power3' });
  window.addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });
}

/* -------------------------------------------------------------------------
   initReveals
   What: fade/rise elements marked data-reveal when they enter the viewport;
         slow parallax on images marked data-parallax.
   In:   nothing
   Out:  nothing
   ------------------------------------------------------------------------- */
function initReveals() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  $$('[data-reveal]').forEach((el) => io.observe(el));
  if (reduced) return;
  $$('[data-parallax]').forEach((img) => {
    gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

/* -------------------------------------------------------------------------
   initNav
   What: header turns solid after the hero; hides on scroll-down and
         returns on scroll-up; mobile full-screen menu.
   In:   nothing
   Out:  nothing
   ------------------------------------------------------------------------- */
function initNav() {
  const nav = $('[data-nav]');
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    // the hero is exactly one screen tall; past it the header needs a backdrop
    const heroEnd = $('[data-hero]').offsetHeight - (nav.offsetHeight || 64);
    nav.classList.toggle('is-solid', y > heroEnd - 10);
    nav.classList.toggle('is-hidden', y > lastY && y > 200 && y > heroEnd);
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  const burger = $('[data-burger]');
  burger.addEventListener('click', () => (burger.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu()));
}

/* What: open the mobile menu.  In: nothing  Out: nothing */
function openMenu() {
  $('[data-menu]').hidden = false;
  document.body.classList.add('menu-open');
  $('[data-burger]').setAttribute('aria-expanded', 'true');
  if (lenis) lenis.stop();
  gsap.from('[data-menu] a', { y: 30, opacity: 0, duration: 0.7, stagger: 0.05, ease: 'power3.out' });
}
/* What: close the mobile menu.  In: nothing  Out: nothing */
function closeMenu() {
  const m = $('[data-menu]');
  if (m.hidden) return;
  m.hidden = true;
  document.body.classList.remove('menu-open');
  $('[data-burger]').setAttribute('aria-expanded', 'false');
  if (lenis) lenis.start();
}

/* -------------------------------------------------------------------------
   initForm
   What: the contact form is a UI demo only — it never sends data.
   In:   nothing
   Out:  nothing
   ------------------------------------------------------------------------- */
function initForm() {
  $('[data-form]').addEventListener('submit', (e) => {
    e.preventDefault();
    $('[data-form-note]').hidden = false;
  });
}

/* -------------------------------------------------------------------------
   boot
   What: start everything in order.
   In:   nothing
   Out:  nothing
   ------------------------------------------------------------------------- */
function boot() {
  applyLang(initialLang());
  $$('[data-lang-btn]').forEach((b) => b.addEventListener('click', () => applyLang(b.dataset.langBtn)));
  // smooth scroll + header, then the project grid
  initScroll();
  initNav();
  renderProjects();
  onLang(renderProjects);
  $$('[data-filter]').forEach((b) => b.addEventListener('click', () => applyFilter(b.dataset.filter)));
  initLightbox();
  initReveals();
  initForm();
  // sections that replaced the old 3D stage
  initHero({ gsap, ScrollTrigger, reduced, onFirstImage: reveal });
  initStory({ gsap, ScrollTrigger, reduced, desktop: !window.matchMedia('(max-width: 800px)').matches });
  initFinishes({ gsap, reduced });
  // never keep the loader longer than 3 s, even on a slow network
  setTimeout(reveal, 3000);
}

boot();
