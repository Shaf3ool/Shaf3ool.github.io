/* =========================================================================
   story.js — three short chapters (light, matter, visualisation).
   Desktop: a sticky frame on the left swaps Jorge's renders with a
   clip-path wipe as each chapter reaches the middle of the screen.
   Phone: each chapter carries its own render, revealed with the same wipe.
   ========================================================================= */

/* -------------------------------------------------------------------------
   wipeIn
   What: reveal an element from the bottom edge up with a clip-path wipe
         and a slight settle in scale.
   In:   gsap, el (Element), dur (seconds)
   Out:  the GSAP tween
   ------------------------------------------------------------------------- */
function wipeIn(gsap, el, dur = 1.25) {
  return gsap.fromTo(el,
    { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.08 },
    { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: dur, ease: 'expo.inOut', overwrite: true });
}

/* -------------------------------------------------------------------------
   initStory
   What: wire the chapters to the sticky frame (desktop) or to their own
         images (phone); chapter text rises in as it enters.
   In:   { gsap, ScrollTrigger, reduced, desktop }
   Out:  nothing
   ------------------------------------------------------------------------- */
export function initStory({ gsap, ScrollTrigger, reduced, desktop }) {
  const chapters = [...document.querySelectorAll('[data-story-ch]')];
  const frameImgs = [...document.querySelectorAll('[data-story-img]')];
  const num = document.querySelector('[data-story-n]');
  let current = 0;

  // text of each chapter: soft rise (no motion for reduced-motion users)
  chapters.forEach((ch) => {
    const parts = ch.querySelectorAll('.chapter__k, .story__t, .story__s');
    if (reduced) return;
    gsap.from(parts, { y: 40, opacity: 0, duration: 1.1, stagger: 0.08, ease: 'power3.out',
      scrollTrigger: { trigger: ch, start: 'top 72%', once: true } });
  });

  if (!desktop) {
    // phone: each chapter's own image wipes in once
    if (reduced) return;
    chapters.forEach((ch) => {
      const img = ch.querySelector('.story__m img');
      gsap.set(img, { clipPath: 'inset(100% 0% 0% 0%)' });
      ScrollTrigger.create({ trigger: ch, start: 'top 85%', once: true, onEnter: () => wipeIn(gsap, img) });
    });
    return;
  }

  /* What: show frame image i (wipe it over the previous one).
     In: i (chapter index)  Out: nothing */
  const show = (i) => {
    if (i === current) return;
    const img = frameImgs[i];
    // the newest image always sits on top of the stack
    frameImgs.forEach((x) => x.classList.toggle('is-top', x === img));
    img.classList.add('is-on');
    if (reduced) gsap.set(img, { clipPath: 'inset(0% 0% 0% 0%)' });
    else wipeIn(gsap, img, 1.1);
    num.textContent = String(i + 1).padStart(2, '0');
    current = i;
  };

  // a chapter becomes active while it crosses the middle of the screen
  chapters.forEach((ch, i) => {
    ScrollTrigger.create({ trigger: ch, start: 'top 55%', end: 'bottom 55%',
      onEnter: () => show(i), onEnterBack: () => show(i) });
  });
}
