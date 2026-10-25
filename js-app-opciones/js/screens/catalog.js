/* =========================================================================
   catalog.js — the main screen: header, search, category chips, the grid of
   options grouped by category, and the floating "Favoritos" bar.
   ========================================================================= */
import { CATEGORIES, ITEMS } from '../data.js';
import { t, L, lang, onLang } from '../i18n.js';
import { favIds, isFav, toggleFav, onChange } from '../store.js';
import { h, icon, media, esc, toast } from '../ui.js';
import { openDetail } from './detail.js';
import { openFavorites } from './favorites.js';

// --- screen state ---------------------------------------------------------------
const view = { cat: 'all', q: '' };
let root, grid, chips, scroller, favbar, badge;

/**
 * What: lower-case + strip accents, so "iluminacion" finds "Iluminación".
 * In:  s (string)
 * Out: string
 */
function norm(s) { return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }

/**
 * What: does an item match the search? Name + material, in ES and EN,
 *       lower-cased and accent-stripped (NFD); every word must appear.
 * In:  it (item), q (normalised query)
 * Out: boolean
 */
function matches(it, q) {
  if (!q) return true;
  const hay = norm([it.name.es, it.name.en, it.material.es, it.material.en].join(' '));
  return q.split(/\s+/).every((w) => hay.includes(w));
}

/**
 * What: HTML of one option card (media, tag, heart, name, note).
 * In:  it (item), i (index, for the stagger delay)
 * Out: HTML string
 */
function cardHTML(it, i) {
  const fav = isFav(it.id);
  const tag = it.kind === 'photo' ? t('tag.photo') : t('tag.sample');
  return `<div class="card" data-id="${it.id}" style="--d:${Math.min(i, 10) * 35}ms">
    <button class="card-open" aria-label="${esc(L(it.name))}">
      <span class="card-media">${media(it)}<span class="card-tag ${it.kind}">${tag}</span></span>
      <span class="card-body"><span class="card-name">${esc(L(it.name))}</span><span class="card-note">${esc(L(it.note))}</span></span>
    </button>
    <button class="heart ${fav ? 'on' : ''}" aria-pressed="${fav}" aria-label="${esc(t('fav.add'))}">${icon('heart', 19)}</button>
  </div>`;
}

/**
 * What: re-render the grid for the current category + search.
 * In:  —
 * Out: —
 */
function renderGrid() {
  const q = norm(view.q.trim());
  // the filter: (selected category) AND (search)
  const list = ITEMS.filter((it) => (view.cat === 'all' || it.category === view.cat) && matches(it, q));
  let html = '';
  // a result count while searching
  if (q) html += `<p class="count">${list.length} ${list.length === 1 ? t('one.result') : t('results')}</p>`;
  if (!list.length) {
    html += `<div class="empty">${icon('search', 30)}<h3>${t('empty.t')}</h3><p>${t('empty.p')}</p></div>`;
  } else {
    // grouped by category, in the category order
    let n = 0;
    for (const c of CATEGORIES) {
      const its = list.filter((it) => it.category === c.key);
      if (!its.length) continue;
      html += `<section class="group"><div class="group-head"><h2>${c[lang()]}</h2><span>${its.length}</span></div><div class="grid">`;
      html += its.map((it) => cardHTML(it, n++)).join('');
      html += `</div></section>`;
    }
  }
  grid.innerHTML = html;
}

/**
 * What: render the category chips (Todo + 7 categories) with counts.
 * In:  —
 * Out: —
 */
function renderChips() {
  const all = [{ key: 'all', label: t('all'), n: ITEMS.length }]
    .concat(CATEGORIES.map((c) => ({ key: c.key, label: c[lang()], n: ITEMS.filter((it) => it.category === c.key).length })));
  chips.innerHTML = all.map((c) => `<button class="chip ${view.cat === c.key ? 'on' : ''}" data-cat="${c.key}" aria-pressed="${view.cat === c.key}">${c.label}<i>${c.n}</i></button>`).join('');
}

/**
 * What: update the header badge and the floating favourites bar.
 * In:  —
 * Out: —
 */
function renderFavs() {
  const favs = favIds();
  badge.textContent = favs.length; badge.hidden = !favs.length;
  favbar.classList.toggle('show', favs.length > 0);
  // up to 3 stacked thumbnails of the newest favourites
  const thumbs = favs.slice(0, 3).map((id) => ITEMS.find((it) => it.id === id)).filter(Boolean)
    .map((it) => `<span class="fb-thumb">${media(it)}</span>`).join('');
  favbar.querySelector('.fb-thumbs').innerHTML = thumbs;
  favbar.querySelector('.fb-label').textContent = `${favs.length} ${favs.length === 1 ? t('favs.count1') : t('favs.countN')}`;
  // keep every visible heart in sync (detail sheet can change them too)
  grid.querySelectorAll('.card').forEach((card) => {
    const on = favs.includes(card.dataset.id), btn = card.querySelector('.heart');
    btn.classList.toggle('on', on); btn.setAttribute('aria-pressed', on);
  });
}

/**
 * What: pick a category chip and scroll it into view.
 * In:  key ('all' | category key)
 * Out: —
 */
function selectCat(key) {
  view.cat = key;
  renderChips(); renderGrid(); renderFavs();
  // bring the chosen chip into view and the grid to the top of its area
  chips.querySelector('.chip.on')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  const top = root.querySelector('.search').offsetTop - 8;
  if (scroller.scrollTop > top) scroller.scrollTo({ top, behavior: 'smooth' });
}

/**
 * What: build the catalogue screen inside the given host and wire it up.
 * In:  host (Element)
 * Out: —
 */
export function mountCatalog(host) {
  root = h(`<section class="screen catalog">
    <header class="nav"><span class="brand-mark sm">Js<i>.</i></span><span class="nav-title" data-i18n="title"></span>
      <div class="nav-right"><button class="lang" aria-label="Idioma / Language"><b data-l="es">ES</b><b data-l="en">EN</b></button>
      <button class="nav-fav" data-i18n-aria="favs">${icon('heart', 20)}<span class="badge" hidden>0</span></button></div></header>
    <div class="scroll">
      <div class="hero"><p class="eyebrow"><span data-i18n="kicker"></span><span class="dot"></span><span data-i18n="project"></span></p>
        <h1 class="hero-title" data-i18n="hero"></h1><p class="lead" data-i18n="lead"></p></div>
      <p class="demo-note">${icon('info', 16)}<span data-i18n="demo.banner"></span></p>
      <label class="search">${icon('search', 18)}<input type="search" enterkeyhint="search" autocomplete="off" data-i18n-ph="search" data-i18n-aria="search"><button class="search-x" data-i18n-aria="clear" hidden>${icon('close', 14)}</button></label>
      <div class="chips-wrap"><div class="chips" role="toolbar"></div></div>
      <div class="results"></div>
      <footer class="credits"><p data-i18n="credit"></p><p data-i18n="credit2"></p></footer>
    </div>
    <button class="favbar" aria-live="polite"><span class="fb-thumbs"></span><span class="fb-label"></span><span class="fb-see"><span data-i18n="favs.see"></span>${icon('chevron', 15)}</span></button>
  </section>`);
  host.appendChild(root);
  // cache the parts we update often
  grid = root.querySelector('.results'); chips = root.querySelector('.chips');
  scroller = root.querySelector('.scroll'); favbar = root.querySelector('.favbar'); badge = root.querySelector('.badge');
  const input = root.querySelector('input'), clear = root.querySelector('.search-x');

  // search: live filter, with a clear button
  input.addEventListener('input', () => { view.q = input.value; clear.hidden = !input.value; renderGrid(); renderFavs(); });
  clear.addEventListener('click', (e) => { e.preventDefault(); input.value = ''; view.q = ''; clear.hidden = true; renderGrid(); renderFavs(); input.focus(); });
  chips.addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (b) selectCat(b.dataset.cat); });

  // grid: heart toggles, card opens the detail sheet
  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.card'); if (!card) return;
    const id = card.dataset.id;
    if (e.target.closest('.heart')) {
      const on = toggleFav(id);
      const btn = card.querySelector('.heart');
      btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop');
      toast(on ? t('fav.added') : t('fav.removed'), on ? 'heart' : 'close');
      return;
    }
    openDetail(id);
  });

  // compact nav bar fades in once the big title scrolls away
  scroller.addEventListener('scroll', () => root.classList.toggle('scrolled', scroller.scrollTop > 64), { passive: true });
  root.querySelector('.nav-fav').addEventListener('click', openFavorites);
  favbar.addEventListener('click', openFavorites);

  // re-render on favourites / language changes
  onChange(renderFavs);
  onLang(() => { renderChips(); renderGrid(); renderFavs(); });
  renderChips(); renderGrid(); renderFavs();
}

/**
 * What: jump the catalogue back to the full list (used by "Ver opciones").
 * In:  —
 * Out: —
 */
export function showAll() { selectCat('all'); scroller.scrollTo({ top: 0, behavior: 'smooth' }); }
