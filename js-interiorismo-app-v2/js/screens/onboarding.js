/* =========================================================================
   screens/onboarding.js — 3 full-bleed slides with Jorge's renders
   Swipe (scroll-snap) or tap "Siguiente"; shown on first launch only.
   ========================================================================= */
import { t, apply, getLang, setLang } from '../i18n.js';
import { h, icon } from '../ui.js';

const SLIDES = [
  { img: 'loft-1', w: 1440, h: 1800, k: 1 },
  { img: 'bano-chukum-1', w: 1440, h: 1440, k: 2 },
  { img: 'recamara-1', w: 1440, h: 1440, k: 3 },
];

/**
 * What: show the onboarding over the app.
 * In:  onDone () => void
 * Out: —
 */
export function showOnboarding(onDone) {
  const layer = document.getElementById('layers');
  const el = h(`
    <div class="onb">
      <div class="onb-track">${SLIDES.map((s, i) => `
        <section class="onb-slide">
          <img src="img/${s.img}.webp" width="${s.w}" height="${s.h}" alt="" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}>
          <div class="onb-grad"></div>
        </section>`).join('')}</div>
      <div class="onb-top">
        <span class="brand-mark">Js<i>.</i></span>
        <div class="onb-top-r">
          <button class="lang-mini" data-act="lang">${getLang() === 'es' ? 'EN' : 'ES'}</button>
          <button class="skip" data-act="skip" data-i18n="ob.skip"></button>
        </div>
      </div>
      <div class="onb-copy">
        <div class="onb-dots">${SLIDES.map(() => '<i></i>').join('')}</div>
        <h1 class="onb-t"></h1>
        <p class="onb-p"></p>
        <button class="pill-btn primary block onb-next" data-act="next"><span></span>${icon('arrow', 18)}</button>
        <p class="onb-note" data-i18n="ob.note"></p>
      </div>
    </div>`);
  layer.appendChild(el);
  apply(el);
  const track = el.querySelector('.onb-track');
  let idx = 0;

  /**
   * What: update copy, dots and button label for slide i.
   * In:  i (index)
   * Out: —
   */
  function show(i) {
    idx = i;
    const k = SLIDES[i].k;
    const tt = el.querySelector('.onb-t'), pp = el.querySelector('.onb-p');
    // re-trigger the text reveal animation
    tt.classList.remove('in'); pp.classList.remove('in'); void tt.offsetWidth;
    tt.innerHTML = t(`ob.${k}.t`); pp.textContent = t(`ob.${k}.p`);
    tt.classList.add('in'); pp.classList.add('in');
    el.querySelectorAll('.onb-dots i').forEach((d, j) => d.classList.toggle('on', j === i));
    el.querySelector('.onb-next span').textContent = i === SLIDES.length - 1 ? t('ob.start') : t('ob.next');
  }

  /**
   * What: close the onboarding with a fade.
   * In:  —
   * Out: —
   */
  function done() {
    el.classList.add('out');
    setTimeout(() => { el.remove(); onDone(); }, 450);
  }
  // swipe position → slide index
  let st = 0;
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(st);
    st = requestAnimationFrame(() => { const i = Math.round(track.scrollLeft / track.clientWidth); if (i !== idx) show(i); });
  }, { passive: true });
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    if (b.dataset.act === 'skip') done();
    if (b.dataset.act === 'lang') { setLang(getLang() === 'es' ? 'en' : 'es'); b.textContent = getLang() === 'es' ? 'EN' : 'ES'; show(idx); }
    if (b.dataset.act === 'next') {
      if (idx >= SLIDES.length - 1) done();
      else track.scrollTo({ left: track.clientWidth * (idx + 1), behavior: 'smooth' });
    }
  });
  show(0);
}
