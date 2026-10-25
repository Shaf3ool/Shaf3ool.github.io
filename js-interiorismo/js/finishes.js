/* =========================================================================
   finishes.js — the 2D "Acabados" section (replaces the old 3D room).
   Pick a floor, wall or upholstery sample: the palette board updates and
   the large panel crossfades to a real Jorge Santana render that works
   with related materials. Samples are drawn by code in materials.js.
   ========================================================================= */
import { FINISHES, slabDataURL } from './materials.js';
import { PROJECTS } from './projects.js';
import { getLang, onLang, t } from './i18n.js';

const state = { floor: 'travertino', walls: 'yeso', fabric: 'lino' };
let tab = 'floor';
let lastRef = null;

/* -------------------------------------------------------------------------
   finish
   What: look up one finish entry.
   In:   group ('floor' | 'walls' | 'fabric'), id
   Out:  the FINISHES entry
   ------------------------------------------------------------------------- */
function finish(group, id) {
  return FINISHES[group].find((f) => f.id === id);
}

/* -------------------------------------------------------------------------
   setPhoto
   What: crossfade the large panel to the reference render of a finish and
         write the project's name under it.
   In:   gsap, f (finish entry), reduced (boolean)
   Out:  nothing
   ------------------------------------------------------------------------- */
function setPhoto(gsap, f, reduced) {
  const box = document.querySelector('[data-fin-photo]');
  const p = PROJECTS.find((x) => x.slug === f.ref);
  document.querySelector('[data-fin-ref]').textContent = p ? p.title[getLang()] : '';
  if (lastRef === f.img) return;
  lastRef = f.img;
  // new image goes on top, fades in, then the old ones are removed
  const img = new Image();
  img.decoding = 'async';
  img.sizes = '(max-width: 800px) 100vw, 58vw';
  img.srcset = `${f.img}-sm.webp 900w, ${f.img}.webp 1800w`;
  img.src = `${f.img}-sm.webp`;
  img.alt = p ? `${p.title[getLang()]} — render de Jorge Santana` : '';
  const old = [...box.querySelectorAll('img')];
  box.appendChild(img);
  /* What: animate once the pixels exist.  In/Out: nothing */
  const reveal = () => {
    if (reduced || !old.length) { old.forEach((o) => o.remove()); return; }
    gsap.fromTo(img, { opacity: 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: 1.1, ease: 'power3.out', onComplete: () => old.forEach((o) => o.remove()) });
  };
  (img.decode ? img.decode() : Promise.resolve()).then(reveal, reveal);
}

/* -------------------------------------------------------------------------
   paintBoard
   What: draw the three slabs of the palette board and fill every legend
         (the one under the board, and the chip strip over the photo).
   In:   nothing
   Out:  nothing
   ------------------------------------------------------------------------- */
function paintBoard() {
  const L = getLang();
  const groups = ['floor', 'walls', 'fabric'];
  document.querySelectorAll('[data-slab]').forEach((el) => {
    const g = el.dataset.slab;
    // slab sizes follow the board layout (wide floor, tall wall, round fabric)
    const size = g === 'floor' ? [520, 300] : g === 'walls' ? [360, 440] : [260, 260];
    el.style.backgroundImage = `url(${slabDataURL(g, state[g], size[0], size[1])})`;
    el.classList.toggle('is-focus', g === tab);
  });
  // legend rows: chip + family + finish name, the active family highlighted
  const rows = groups.map((g) => {
    const f = finish(g, state[g]);
    return `<li class="${g === tab ? 'is-focus' : ''}"><i style="background-image:url(${slabDataURL(g, f.id, 64, 64)})"></i><span><small>${t('cfg.' + g)}</small>${f[L]}</span></li>`;
  }).join('');
  document.querySelectorAll('[data-legend]').forEach((ul) => { ul.innerHTML = rows; });
}

/* -------------------------------------------------------------------------
   renderSwatches
   What: the sample tiles for the active tab (radio-style buttons).
   In:   gsap, reduced
   Out:  nothing
   ------------------------------------------------------------------------- */
function renderSwatches(gsap, reduced) {
  const box = document.querySelector('[data-swatches]');
  const L = getLang();
  box.innerHTML = '';
  FINISHES[tab].forEach((f) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'tile';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(state[tab] === f.id));
    b.innerHTML = `<i style="background-image:url(${slabDataURL(tab, f.id, 200, 200)})"></i><span>${f[L]}</span>`;
    // choosing a sample updates the board and the reference render
    b.addEventListener('click', () => {
      state[tab] = f.id;
      box.querySelectorAll('.tile').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
      paintBoard();
      setPhoto(gsap, f, reduced);
      if (!reduced) gsap.fromTo(`[data-slab="${tab}"]`, { scale: 0.96 }, { scale: 1, duration: 0.7, ease: 'back.out(2)' });
    });
    box.appendChild(b);
  });
}

/* -------------------------------------------------------------------------
   initFinishes
   What: build the section the first time it comes near the viewport (the
         canvas drawing is not needed for the first paint), wire the tabs
         and keep labels in the active language.
   In:   { gsap, reduced }
   Out:  nothing
   ------------------------------------------------------------------------- */
export function initFinishes({ gsap, reduced }) {
  const root = document.querySelector('[data-fin]');
  let built = false;

  /* What: first build.  In/Out: nothing */
  const build = () => {
    if (built) return;
    built = true;
    renderSwatches(gsap, reduced);
    paintBoard();
    setPhoto(gsap, finish(tab, state[tab]), reduced);
  };

  // tabs switch the sample family and refocus the board
  document.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => {
    tab = b.dataset.tab;
    document.querySelectorAll('[data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    build();
    renderSwatches(gsap, reduced);
    paintBoard();
    setPhoto(gsap, finish(tab, state[tab]), reduced);
  }));

  // labels follow the language toggle
  onLang(() => { if (built) { renderSwatches(gsap, reduced); paintBoard(); lastRef = null; setPhoto(gsap, finish(tab, state[tab]), true); } });

  // draw lazily: one screen before the section scrolls in
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { build(); io.disconnect(); } }, { rootMargin: '100% 0px' });
  io.observe(root);
}
