/* =========================================================================
   screens/inspiration.js — Inspiración: Jorge's 16 real projects
   Filter chips, 2-column staggered grid, save to board (♡), project sheet
   with gallery + "Diseñar con esta paleta" (suggested palette → planner).
   ========================================================================= */
import { t, onLang, getLang } from '../i18n.js';
import { h, icon, toast, sheet } from '../ui.js';
import { PROJECTS, GROUPS, FINISHES } from '../data.js';
import { get, subscribe, toggleBoard } from '../store.js';
import { finishURL } from '../textures.js';

/**
 * What: category + year line, without repeating a year already in the category.
 * In:  p (project)
 * Out: string
 */
function catLine(p) {
  const c = p.cat[getLang()];
  return c.includes(String(p.year)) ? c : `${c} · ${p.year}`;
}

/**
 * What: mount the Inspiración tab.
 * In:  host (Element), ctx { newDesign(tplKey, palette), startNew() }
 * Out: { el, refresh() }
 */
export function mountInspiration(host, ctx) {
  let group = 'todo';
  const el = h(`<section class="screen tab-screen inspo"><div class="scroll"></div></section>`);
  host.appendChild(el);
  const sc = el.querySelector('.scroll');

  /**
   * What: render the whole screen (header, CTA, chips, grid).
   * In:  —
   * Out: —
   */
  function render() {
    const board = get().board;
    const list = PROJECTS.filter((p) => group === 'todo' || p.group === group);
    // split into two columns for a staggered "masonry" look
    const cols = [[], []];
    list.forEach((p, i) => cols[i % 2].push(card(p, board.includes(p.slug))));
    sc.innerHTML = `
      <header class="big-head">
        <p class="eyebrow"><span class="brand-mark sm">Js<i>.</i></span> Interiorismo · Aguascalientes</p>
        <h1>${t('in.title')}</h1>
      </header>
      <button class="cta-card" data-act="new">
        <div class="cta-art">
          <svg viewBox="0 0 120 90" aria-hidden="true"><rect x="8" y="8" width="104" height="74" rx="4" fill="#F4ECE0" stroke="#3E3027" stroke-width="4"/><rect x="20" y="18" width="46" height="20" rx="5" fill="#E6D8C3" stroke="#5A4636" stroke-width="1.5"/><rect x="60" y="48" width="38" height="24" rx="3" fill="#8A6247" stroke="#5A4636" stroke-width="1.5"/><circle cx="96" cy="22" r="8" fill="#6E7656"/><path d="M14 82v-14a10 10 0 0 1 20 0v14" fill="none" stroke="#B8643E" stroke-width="2" stroke-dasharray="3 3"/></svg>
        </div>
        <div class="cta-txt"><b>${t('in.cta.t')}</b><span>${t('in.cta.p')}</span></div>
        <span class="cta-go">${icon('arrow', 20)}</span>
      </button>
      <div class="sec-head"><h2>${t('in.section')}</h2><span class="muted">${t('in.count')}</span></div>
      <div class="chips" role="tablist">${GROUPS.map((g) => `<button class="chip ${g === group ? 'on' : ''}" data-g="${g}">${t('grp.' + g)}</button>`).join('')}</div>
      <div class="grid"><div class="col">${cols[0].join('')}</div><div class="col">${cols[1].join('')}</div></div>
      <p class="credit-line">${t('st.renders')} · ${t('st.credit')}</p>`;
  }

  /**
   * What: one project card.
   * In:  p (project), saved (bool)
   * Out: string
   */
  function card(p, saved) {
    const im = p.imgs[0];
    return `<article class="pcard" data-slug="${p.slug}">
      <div class="pimg" style="aspect-ratio:${im.sw}/${im.sh}">
        <img src="img/${im.src}-sm.webp" width="${im.sw}" height="${im.sh}" loading="lazy" alt="${p.title.es}">
        <button class="heart ${saved ? 'on' : ''}" data-heart="${p.slug}" aria-label="${t('pr.save')}">${icon('heart', 18)}</button>
      </div>
      <h3>${p.title[getLang()]}</h3>
      <p>${catLine(p)}</p>
    </article>`;
  }

  // --- interactions --------------------------------------------------------
  sc.addEventListener('click', (e) => {
    const heart = e.target.closest('[data-heart]');
    if (heart) {
      const saved = toggleBoard(heart.dataset.heart);
      heart.classList.toggle('on', saved);
      heart.classList.remove('pop'); void heart.offsetWidth; heart.classList.add('pop');
      toast(saved ? t('in.saved') : t('in.unsaved'), 'heart');
      return;
    }
    const chip = e.target.closest('[data-g]');
    if (chip) { group = chip.dataset.g; render(); return; }
    if (e.target.closest('[data-act=new]')) { ctx.startNew(); return; }
    const c = e.target.closest('.pcard');
    if (c) openProject(c.dataset.slug, ctx);
  });

  const offLang = onLang(render);
  const offStore = subscribe(() => { /* board badges refresh lazily */ });
  render();
  return { el, refresh: render, destroy() { offLang(); offStore(); } };
}

/**
 * What: open the project detail sheet.
 * In:  slug (string), ctx { newDesign(tplKey, palette) }
 * Out: —
 */
export function openProject(slug, ctx) {
  const p = PROJECTS.find((x) => x.slug === slug);
  const L = getLang();
  const saved = get().board.includes(slug);
  const fin = p.palette.map((k) => FINISHES.find((f) => f.key === k));
  const c = h(`
    <div class="proj">
      <div class="proj-gal">${p.imgs.map((im, i) => `<img src="img/${im.src}.webp" width="${im.w}" height="${im.h}" alt="${p.title[L]}" ${i ? 'loading="lazy"' : ''}>`).join('')}</div>
      ${p.imgs.length > 1 ? `<div class="gal-dots">${p.imgs.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>` : ''}
      <div class="proj-body">
        <p class="eyebrow">${catLine(p)}</p>
        <h2>${p.title[L]}</h2>
        <p class="proj-text">“${p.text[L]}”</p>
        <div class="pal">
          <p class="pal-t">${t('pr.palette')}</p>
          <div class="pal-row">${fin.map((f) => `<span class="pal-sw"><i style="background-image:url(${finishURL(f.key, 128)})"></i>${t('fin.' + f.key)}</span>`).join('')}</div>
        </div>
        <div class="proj-actions">
          <button class="pill-btn primary" data-act="use">${icon('sparkle', 18)}<span>${t('pr.use')}</span></button>
          <button class="pill-btn ghost round ${saved ? 'on' : ''}" data-act="save" aria-label="${t('pr.save')}">${icon('heart', 20)}</button>
        </div>
        <p class="credit-line left">${t('pr.credit')}</p>
      </div>
    </div>`);
  const s = sheet(c, { tall: true });
  // gallery dots follow the horizontal scroll
  const gal = c.querySelector('.proj-gal');
  gal.addEventListener('scroll', () => {
    const i = Math.round(gal.scrollLeft / gal.clientWidth);
    c.querySelectorAll('.gal-dots i').forEach((d, j) => d.classList.toggle('on', i === j));
  }, { passive: true });
  c.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    if (b.dataset.act === 'save') { const on = toggleBoard(slug); b.classList.toggle('on', on); toast(on ? t('in.saved') : t('in.unsaved'), 'heart'); }
    if (b.dataset.act === 'use') {
      s.close();
      const tpl = p.group === 'cocina' ? 'cocina' : p.slug === 'recamara' || p.slug.startsWith('vestidor') || p.slug.startsWith('closet') ? 'recamara' : 'sala';
      setTimeout(() => ctx.newDesign(tpl, p.palette, p.title[L]), 260);
    }
  });
}
