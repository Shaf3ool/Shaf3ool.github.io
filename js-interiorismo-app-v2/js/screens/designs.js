/* =========================================================================
   screens/designs.js — Mis diseños: saved designs + inspiration board
   Designs live on this device (localStorage). Review status is a demo.
   ========================================================================= */
import { t, onLang, getLang } from '../i18n.js';
import { h, icon, esc, fmtDate, sheet, toast } from '../ui.js';
import { PROJECTS } from '../data.js';
import { get, subscribe, update } from '../store.js';
import { planThumb } from './thumb.js';
import { openProject } from './inspiration.js';

/**
 * What: mount the Mis diseños tab.
 * In:  host (Element), ctx { openDesign(id), startNew(), newDesign() }
 * Out: { el, refresh() }
 */
export function mountDesigns(host, ctx) {
  const el = h(`<section class="screen tab-screen designs"><div class="scroll"></div></section>`);
  host.appendChild(el);
  const sc = el.querySelector('.scroll');

  /**
   * What: render designs list and board strip.
   * In:  —
   * Out: —
   */
  function render() {
    const { designs, board } = get();
    const L = getLang();
    const cards = designs.map((d) => `
      <article class="dcard" data-id="${d.id}">
        <div class="dthumb">${planThumb(d)}</div>
        <div class="dinfo">
          <div class="drow"><h3>${esc(d.name)}</h3></div>
          <p class="muted">${((d.room.w * d.room.d) / 10000).toFixed(1)} m² · ${d.items.length} ${t('ds.pieces')} · ${fmtDate(d.updated, L)}</p>
          <div class="drow2">
            <span class="tags"><span class="status ${d.status}">${d.status === 'review' ? t('ds.status.review') : t('ds.status.draft')}</span>${d.demo || d.status === 'review' ? `<em class="demo-tag">${t('ds.demo')}</em>` : ''}</span>
            <span class="fin-dots"><i style="background:var(--f-${d.floor})"></i><i style="background:var(--f-${d.wall})"></i></span>
          </div>
        </div>
        <button class="more" data-more="${d.id}" aria-label="${t('ds.open')}">${icon('chev', 18)}</button>
      </article>`).join('');
    const boardItems = board.map((slug) => PROJECTS.find((p) => p.slug === slug)).filter(Boolean);
    sc.innerHTML = `
      <header class="big-head"><p class="eyebrow">${t('ds.sub')}</p><h1>${t('ds.title')}</h1></header>
      <div class="dlist">${cards || `<p class="empty">${t('ds.empty')}</p>`}</div>
      <button class="pill-btn ghost block dashed" data-act="new">${icon('plus', 18)}<span>${t('nd.title')}</span></button>
      <div class="sec-head"><h2>${t('ds.board')}</h2><span class="muted">${boardItems.length}</span></div>
      ${boardItems.length ? `<div class="board">${boardItems.map((p) => `
        <button class="bitem" data-slug="${p.slug}"><img src="img/${p.imgs[0].src}-sm.webp" width="${p.imgs[0].sw}" height="${p.imgs[0].sh}" loading="lazy" alt=""><span>${p.title[L]}</span></button>`).join('')}</div>`
        : `<p class="empty">${t('ds.board.empty')}</p>`}
      <p class="credit-line">${t('st.renders')}</p>`;
  }

  // --- interactions --------------------------------------------------------
  sc.addEventListener('click', (e) => {
    if (e.target.closest('[data-act=new]')) { ctx.startNew(); return; }
    const b = e.target.closest('.bitem'); if (b) { openProject(b.dataset.slug, ctx); return; }
    const more = e.target.closest('[data-more]');
    const card = e.target.closest('.dcard');
    if (more || card) openDetail((more || card).dataset.more || card.dataset.id);
  });

  /**
   * What: design detail sheet: preview, review timeline (demo), open / delete.
   * In:  id (design id)
   * Out: —
   */
  function openDetail(id) {
    const d = get().designs.find((x) => x.id === id); if (!d) return;
    const steps = [
      { k: 'ds.tl.sent', done: d.status === 'review' },
      { k: 'ds.tl.review', done: false, now: d.status === 'review' },
      { k: 'ds.tl.proposal', done: false },
    ];
    const c = h(`
      <div class="ddetail">
        <div class="dd-thumb">${planThumb(d)}</div>
        <div class="drow"><h3>${esc(d.name)}</h3>${d.demo ? `<em class="demo-tag">${t('ds.demo')}</em>` : ''}</div>
        <p class="muted">${t('fin.' + d.floor)} · ${t('fin.' + d.wall)} · ${((d.room.w * d.room.d) / 10000).toFixed(1)} m²</p>
        ${d.note ? `<p class="dd-note">“${esc(d.note)}”</p>` : ''}
        <ol class="timeline">${steps.map((s) => `<li class="${s.done ? 'done' : ''} ${s.now ? 'now' : ''}"><i>${s.done ? icon('check', 14) : ''}</i><span>${t(s.k)}</span></li>`).join('')}</ol>
        <p class="muted small">${t('common.demo')} · ${t('snd.done.p')}</p>
        <div class="proj-actions">
          <button class="pill-btn primary" data-act="open">${icon('layers', 18)}<span>${t('ds.open')}</span></button>
          <button class="pill-btn ghost round" data-act="del" aria-label="${t('ds.delete')}">${icon('trash', 20)}</button>
        </div>
      </div>`);
    const s = sheet(c);
    c.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'open') { s.close(); setTimeout(() => ctx.openDesign(id), 200); }
      if (b.dataset.act === 'del') { update((st) => { st.designs = st.designs.filter((x) => x.id !== id); }); s.close(); toast(t('ds.deleted'), 'trash'); }
    });
  }

  const offLang = onLang(render);
  const offStore = subscribe(render);
  render();
  return { el, refresh: render, destroy() { offLang(); offStore(); } };
}
