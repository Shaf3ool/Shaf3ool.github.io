/* =========================================================================
   detail.js — the detail sheet of one option: large visual, honest tags
   (real render vs. drawn sample, Demo data), short description, specs,
   "Combina con" suggestions and the favourite toggle.
   ========================================================================= */
import { CATEGORIES, ITEMS, BY_ID, PROJECTS } from '../data.js';
import { t, L, lang } from '../i18n.js';
import { isFav, toggleFav } from '../store.js';
import { h, icon, media, esc, sheet, toast } from '../ui.js';

/**
 * What: choose up to 4 options that pair with this one — same project
 *       first, then neighbours from other categories (deterministic).
 * In:  it (item)
 * Out: item[]
 */
function pairsFor(it) {
  const out = ITEMS.filter((o) => o.id !== it.id && o.src !== it.src && o.seen && o.seen === it.seen);
  const used = new Set([it.src, ...out.map((o) => o.src)]);
  const idx = ITEMS.indexOf(it);
  // walk outwards through the list, skipping the same category and any
  // render already shown (never the same photo twice in one row)
  for (let step = 1; out.length < 4 && step < ITEMS.length; step++) {
    for (const j of [idx + step * 3, idx - step * 3]) {
      const o = ITEMS[(j + ITEMS.length * 4) % ITEMS.length];
      if (o && o.category !== it.category && !used.has(o.src) && out.length < 4) { out.push(o); used.add(o.src); }
    }
  }
  return out.slice(0, 4);
}

/**
 * What: open the detail sheet for one option.
 * In:  id (item id)
 * Out: —
 */
export function openDetail(id) {
  const it = BY_ID[id];
  if (!it) return;
  const cat = CATEGORIES.find((c) => c.key === it.category);
  // provenance line: which of Jorge's projects the photo is from, or "drawn sample"
  const origin = it.kind === 'photo'
    ? `${t('seen')} <b>${esc(PROJECTS[it.seen] || '')}</b> · © Jorge Santana`
    : t('sample.note');
  const tags = (it.kind === 'photo' ? `<span class="tag photo">${t('tag.photo')}</span>` : `<span class="tag sample">${t('tag.sample')}</span>`)
    + (it.real ? `<span class="tag real">${t('tag.real')}</span>` : '');
  const specs = `<div class="spec"><span>${t('material')}</span><b>${esc(L(it.material))}</b></div>` + it.specs.map((s) => `<div class="spec"><span>${t(s.k)}</span><b>${esc(s[lang()] || s.es)}</b></div>`).join('');
  const pairs = pairsFor(it).map((o) => `<button class="pair" data-id="${o.id}"><span class="pair-media">${media(o)}</span><span class="pair-name">${esc(L(o.name))}</span></button>`).join('');

  // the sheet body
  const body = h(`<div class="detail">
    <div class="detail-media drag-zone">${media(it, true)}<button class="sheet-close" aria-label="${esc(t('close'))}">${icon('close', 18)}</button></div>
    <p class="eyebrow">${cat[lang()]}<span class="dot"></span><span class="demo-chip">${t('tag.demo')}</span></p>
    <h2 class="detail-title">${esc(L(it.name))}</h2>
    <p class="detail-note">${esc(L(it.note))}</p>
    <div class="tags">${tags}</div>
    <p class="origin">${origin}</p>
    <p class="detail-desc">${esc(L(it.desc))}</p>
    <div class="specs"><div class="specs-head"><h3>${t('specs')}</h3><span>${t('specs.demo')}</span></div>${specs}</div>
    <h3 class="pairs-head">${t('pairs')}</h3>
    <div class="pairs">${pairs}</div>
    <p class="credit-line">${t('credit')}</p>
    <div class="detail-cta"><button class="pill-btn fav-btn">${icon('heart', 20)}<span></span></button></div>
  </div>`);

  const sh = sheet(body, { cls: 'tall', label: L(it.name) });
  const favBtn = body.querySelector('.fav-btn');

  /**
   * What: reflect the favourite state on the big button.
   * In:  —
   * Out: —
   */
  function paint() {
    const on = isFav(it.id);
    favBtn.classList.toggle('on', on);
    favBtn.setAttribute('aria-pressed', on);
    favBtn.querySelector('span').textContent = on ? t('fav.on') : t('fav.add');
  }
  paint();

  // favourite toggle with a small pop
  favBtn.addEventListener('click', () => {
    const on = toggleFav(it.id);
    paint();
    favBtn.classList.remove('pop'); void favBtn.offsetWidth; favBtn.classList.add('pop');
    toast(on ? t('fav.added') : t('fav.removed'), on ? 'heart' : 'close');
  });
  body.querySelector('.sheet-close').addEventListener('click', sh.close);
  // tapping a pairing swaps this sheet for that option's sheet
  body.querySelector('.pairs').addEventListener('click', (e) => {
    const b = e.target.closest('.pair'); if (!b) return;
    sh.close(); setTimeout(() => openDetail(b.dataset.id), 260);
  });
}
