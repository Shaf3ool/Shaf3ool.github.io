/* =========================================================================
   main.js — page orchestration for Js Interiorismo · site v1
   Boot order: language → smooth scroll → 3D stage → projects → reveals.
   GSAP, ScrollTrigger and Lenis are loaded as classic scripts (globals).
   ========================================================================= */
import { applyLang, initialLang, onLang, t, getLang } from './i18n.js';
import { PROJECTS } from './projects.js';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = window.matchMedia('(max-width: 800px)').matches || window.matchMedia('(pointer: coarse)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

let lenis = null;
let room = null;

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
    lenis.scrollTo(target, { offset: a.getAttribute('href') === '#space' ? window.innerHeight * 0.0 : 0 });
  }));
}

/* -------------------------------------------------------------------------
   hasWebGL
   What: feature-test WebGL before importing three.js.
   In:   nothing
   Out:  boolean
   ------------------------------------------------------------------------- */
function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

/* -------------------------------------------------------------------------
   reveal
   What: hide the preloader (once the first 3D frames exist, or on timeout).
   In:   nothing
   Out:  nothing
   ------------------------------------------------------------------------- */
let revealed = false;
function reveal() {
  if (revealed) return;
  revealed = true;
  document.body.classList.remove('is-loading');
  // hero copy rises in after the veil lifts
  if (!reduced) gsap.from('.hero > *', { y: 36, opacity: 0, duration: 1.3, stagger: 0.09, ease: 'power3.out', delay: 0.25 });
  ScrollTrigger.refresh();
}

/* -------------------------------------------------------------------------
   chapterOpacity
   What: fade window for a story chapter as a function of scroll progress.
   In:   p (0..1), a (start), b (end), f (fade width)
   Out:  number 0..1
   ------------------------------------------------------------------------- */
function chapterOpacity(p, a, b, f = 0.045) {
  if (p < a - f || p > b + f) return 0;
  if (p < a) return (p - (a - f)) / f;
  if (p > b) return 1 - (p - b) / f;
  return 1;
}

/* -------------------------------------------------------------------------
   initStage
   What: build the 3D room (dynamic import so a failure never blocks the
         page), wire scroll → camera, chapters, progress bar, visibility.
   In:   nothing
   Out:  Promise<void>
   ------------------------------------------------------------------------- */
async function initStage() {
  const canvas = $('[data-canvas]');
  const fallback = $('[data-fallback]');
  // chapter windows on the 0..1 scroll progress of the pinned stage
  const windows = [[0, 0.1], [0.2, 0.34], [0.42, 0.56], [0.64, 0.76], [0.85, 1.05]];
  const chapters = $$('[data-chapter]');
  const bar = $('[data-progress]');

  if (!hasWebGL()) {
    canvas.hidden = true; fallback.hidden = false;
    fallback.alt = t('webgl.fallback');
    reveal();
  } else {
    try {
      const { createRoom } = await import('./scene.js');
      room = createRoom(canvas, { mobile, reducedMotion: reduced, artURL: 'img/bano-sereno-1-sm.webp', onReady: reveal });
      room.start();
      window.addEventListener('resize', () => room.resize(), { passive: true });
      // render only while the stage is on screen
      new IntersectionObserver(([e]) => { if (e.isIntersecting) room.start(); else if (!document.body.classList.contains('is-exploring')) room.stop(); }).observe($('[data-stage]'));
    } catch (err) {
      canvas.hidden = true; fallback.hidden = false;
      reveal();
    }
  }

  // one ScrollTrigger maps the whole pinned stage to 0..1
  ScrollTrigger.create({
    trigger: '[data-stage]', start: 'top top', end: 'bottom bottom', scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      // camera: hold the hero for the first 6 %, then travel the path
      if (room) room.setProgress(Math.min(1, Math.max(0, (p - 0.06) / 0.84)));
      chapters.forEach((el, i) => {
        const o = chapterOpacity(p, windows[i][0], windows[i][1]);
        el.style.opacity = o;
        el.style.visibility = o > 0.01 ? 'visible' : 'hidden';
        el.style.transform = `translateY(${(1 - o) * 24}px)`;
      });
      $('.scrollcue').style.opacity = String(Math.max(0, 1 - p * 12));
      bar.style.transform = `scaleX(${p})`;
    },
  });
  // the hero is visible at load (progress 0)
  chapters[0].style.opacity = 1; chapters[0].style.visibility = 'visible'; chapters[0].style.transform = 'none';

  initExplore();
}

/* -------------------------------------------------------------------------
   initExplore
   What: explore mode — full-screen orbit + material configurator.
   In:   nothing
   Out:  nothing
   ------------------------------------------------------------------------- */
function initExplore() {
  const box = $('[data-swatches]');
  let tab = 'floor';
  let finishes = null;

  /* What: draw the swatch buttons for the active tab.  In: nothing  Out: nothing */
  const renderSwatches = async () => {
    if (!room) return;
    if (!finishes) finishes = await import('./materials.js');
    box.innerHTML = '';
    finishes.FINISHES[tab].forEach((f) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'sw';
      b.setAttribute('aria-pressed', String(room.current[tab] === f.id));
      b.innerHTML = `<i style="background-image:url(${finishes.swatchDataURL(tab, f.id)})"></i><span>${f[getLang()]}</span>`;
      b.addEventListener('click', () => {
        room.setFinish(tab, f.id);
        $$('.sw', box).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      });
      box.appendChild(b);
    });
  };

  /* What: enter/leave explore mode.  In: on (boolean)  Out: nothing */
  const setMode = (on) => {
    if (!room) return;
    document.body.classList.toggle('is-exploring', on);
    $('[data-cfg]').setAttribute('aria-hidden', String(!on));
    room.setExplore(on);
    room.start();
    room.resize();
    if (on) { if (lenis) lenis.stop(); renderSwatches(); }
    else if (lenis) lenis.start();
  };

  $$('[data-explore]').forEach((b) => b.addEventListener('click', () => setMode(true)));
  $('[data-explore-close]').addEventListener('click', () => setMode(false));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('is-exploring')) setMode(false); });
  $$('[data-tab]').forEach((b) => b.addEventListener('click', () => {
    tab = b.dataset.tab;
    $$('[data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    renderSwatches();
  }));
  onLang(() => { if (document.body.classList.contains('is-exploring')) renderSwatches(); });
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
   What: header turns solid after the 3D stage; hides on scroll-down and
         returns on scroll-up; mobile full-screen menu.
   In:   nothing
   Out:  nothing
   ------------------------------------------------------------------------- */
function initNav() {
  const nav = $('[data-nav]');
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    const stageEnd = $('[data-stage]').offsetHeight - window.innerHeight;
    nav.classList.toggle('is-solid', y > stageEnd - 10);
    nav.classList.toggle('is-hidden', y > lastY && y > 200 && y > stageEnd);
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  const burger = $('[data-burger]');
  burger.addEventListener('click', () => (burger.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu()));
}

/* What: open the mobile menu.  In: nothing  Out: nothing */
function openMenu() {
  $('[data-menu]').hidden = false;
  $('[data-burger]').setAttribute('aria-expanded', 'true');
  if (lenis) lenis.stop();
  gsap.from('[data-menu] a', { y: 30, opacity: 0, duration: 0.7, stagger: 0.05, ease: 'power3.out' });
}
/* What: close the mobile menu.  In: nothing  Out: nothing */
function closeMenu() {
  const m = $('[data-menu]');
  if (m.hidden) return;
  m.hidden = true;
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
  initScroll();
  initNav();
  renderProjects();
  onLang(renderProjects);
  $$('[data-filter]').forEach((b) => b.addEventListener('click', () => applyFilter(b.dataset.filter)));
  initLightbox();
  initReveals();
  initForm();
  initStage();
  // never keep the loader longer than 4 s, even on a slow GPU
  setTimeout(reveal, 4000);
}

boot();
