/* =========================================================================
   favorites.js — the "Tus favoritos" screen (pushed from the right):
   the saved options grouped by category, an optional message, and
   "Enviar a Jorge" — a DEMO that sends nothing and says so.
   ========================================================================= */
import { CATEGORIES, BY_ID } from '../data.js';
import { t, L, lang, onLang } from '../i18n.js';
import { get, set, favIds, toggleFav, onChange } from '../store.js';
import { h, icon, media, esc, sheet } from '../ui.js';
import { openDetail } from './detail.js';
import { showAll } from './catalog.js';

let screen = null;

/**
 * What: HTML of the list body (grouped rows, note, send button) or the
 *       empty state when nothing is saved.
 * In:  —
 * Out: HTML string
 */
function listHTML() {
  const favs = favIds().map((id) => BY_ID[id]).filter(Boolean);
  if (!favs.length) {
    return `<div class="empty fav-empty"><span class="empty-heart">${icon('heart', 30)}</span><h3>${t('favs.empty.t')}</h3><p>${t('favs.empty.p')}</p>
      <button class="pill-btn primary browse">${t('favs.browse')}</button></div>`;
  }
  let html = '';
  // one group per category, in catalogue order
  for (const c of CATEGORIES) {
    const its = favs.filter((it) => it.category === c.key);
    if (!its.length) continue;
    html += `<div class="fav-group"><p class="fav-cat">${c[lang()]}</p>`;
    html += its.map((it) => `<div class="row" data-id="${it.id}"><button class="row-open"><span class="row-media">${media(it)}</span>
      <span class="row-text"><b>${esc(L(it.name))}</b><span>${esc(L(it.material))}</span></span></button>
      <button class="row-x" aria-label="${esc(t('remove'))}">${icon('close', 16)}</button></div>`).join('');
    html += `</div>`;
  }
  // message + send (demo)
  html += `<label class="note"><span>${t('favs.note')}</span><textarea rows="3" placeholder="${esc(t('favs.note.ph'))}">${esc(get().note || '')}</textarea></label>
    <button class="pill-btn primary block send">${icon('send', 19)}${t('send')}</button>
    <p class="send-hint">${icon('info', 14)}${t('send.hint')}</p>
    <p class="credit-line">${t('credit')}</p>`;
  return html;
}

/**
 * What: refresh the header count and the list.
 * In:  —
 * Out: —
 */
function render() {
  if (!screen) return;
  const n = favIds().length;
  screen.querySelector('.push-title').textContent = t('favs.title');
  screen.querySelector('.push-count').textContent = n ? `${n} ${n === 1 ? t('favs.count1') : t('favs.countN')}` : '';
  screen.querySelector('.push-back span').textContent = t('back');
  screen.querySelector('.fav-list').innerHTML = listHTML();
}

/**
 * What: build the list that "Enviar a Jorge" would send: one line per
 *       favourite (name — category · material), plus the client's note.
 * In:  —
 * Out: { lines: string[], note: string }
 */
function buildList() {
  const lines = favIds().map((id) => BY_ID[id]).filter(Boolean).map((it, i) => {
    const cat = CATEGORIES.find((c) => c.key === it.category);
    return `${i + 1}. ${L(it.name)} — ${cat[lang()]} · ${L(it.material)}`;
  });
  return { lines, note: (get().note || '').trim() };
}

/**
 * What: the honest "sent" confirmation: shows the list that WOULD go to
 *       Jorge. Nothing actually leaves the phone (Demo).
 * In:  —
 * Out: —
 */
function showSent() {
  const { lines, note } = buildList();
  const n = `${lines.length} ${lines.length === 1 ? t('favs.count1') : t('favs.countN')}`;
  const body = h(`<div class="sent">
    <span class="sent-ic">${icon('check', 30)}</span>
    <h2>${t('sent.t')} <span class="demo-chip">${t('tag.demo')}</span></h2>
    <p>${esc(t('sent.p1', { n }))}</p>
    <div class="sent-list"><p class="sent-list-head">${t('sent.list')}</p>
      <ol>${lines.map((l) => `<li>${esc(l.replace(/^\d+\.\s/, ''))}</li>`).join('')}</ol>
      ${note ? `<p class="sent-list-note">“${esc(note)}”</p>` : ''}</div>
    <p class="sent-warn">${icon('info', 16)}<span>${t('sent.p2')}</span></p>
    <button class="pill-btn primary block ok">${t('sent.ok')}</button>
  </div>`);
  const sh = sheet(body, { label: t('sent.t') });
  body.querySelector('.ok').addEventListener('click', sh.close);
}

/**
 * What: slide the favourites screen in (builds it once, then reuses it).
 * In:  —
 * Out: —
 */
export function openFavorites() {
  const app = document.getElementById('app');
  if (!screen) {
    screen = h(`<section class="push-screen" aria-label="Favoritos">
      <header class="push-nav"><button class="push-back">${icon('back', 22)}<span></span></button></header>
      <div class="scroll"><div class="push-head"><h1 class="push-title"></h1><p class="push-count"></p></div><div class="fav-list"></div></div>
    </section>`);
    document.getElementById('push').appendChild(screen);
    // back closes the screen
    screen.querySelector('.push-back').addEventListener('click', closeFavorites);
    const list = screen.querySelector('.fav-list');
    // remove / open / browse / send — all delegated on the list
    list.addEventListener('click', (e) => {
      const row = e.target.closest('.row');
      if (e.target.closest('.row-x') && row) {
        row.classList.add('leaving');
        setTimeout(() => toggleFav(row.dataset.id), 220);
      } else if (e.target.closest('.row-open') && row) openDetail(row.dataset.id);
      else if (e.target.closest('.browse')) { closeFavorites(); showAll(); }
      else if (e.target.closest('.send')) showSent();
    });
    // keep the note as the client types
    list.addEventListener('input', (e) => { if (e.target.tagName === 'TEXTAREA') set({ note: e.target.value }); });
    // re-render on favourites changes, but never while typing in the note
    onChange(() => { if (document.activeElement?.tagName !== 'TEXTAREA') render(); });
    onLang(render);
  }
  render();
  screen.querySelector('.scroll').scrollTop = 0;
  // two frames so the slide-in transition runs
  requestAnimationFrame(() => requestAnimationFrame(() => { app.classList.add('pushed'); screen.classList.add('in'); }));
}

/**
 * What: slide the favourites screen back out.
 * In:  —
 * Out: —
 */
export function closeFavorites() {
  document.getElementById('app').classList.remove('pushed');
  screen?.classList.remove('in');
}
