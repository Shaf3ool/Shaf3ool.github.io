/* =========================================================================
   screens/studio.js — Perfil del estudio: real facts + clear placeholders
   Facts from kit/research.md only. Unknown contacts are styled placeholders.
   Also: language, install instructions, reset demo data, honest "about".
   ========================================================================= */
import { t, onLang, getLang, setLang } from '../i18n.js';
import { h, icon, toast } from '../ui.js';
import { reset } from '../store.js';

/**
 * What: mount the Estudio tab.
 * In:  host (Element), ctx { install(): Promise<bool>, isStandalone(): bool }
 * Out: { el, refresh() }
 */
export function mountStudio(host, ctx) {
  const el = h(`<section class="screen tab-screen studio"><div class="scroll"></div></section>`);
  host.appendChild(el);
  const sc = el.querySelector('.scroll');

  /**
   * What: render profile, services, links, contact placeholders, settings.
   * In:  —
   * Out: —
   */
  function render() {
    const L = getLang();
    sc.innerHTML = `
      <div class="st-hero">
        <img src="img/cafe-goretti-1.webp" width="1800" height="1350" alt="Café Goretti — Jorge Santana" loading="lazy">
        <div class="st-hero-grad"></div>
        <div class="st-hero-copy">
          <span class="brand-mark lg">Js<i>.</i></span>
          <h1>${t('st.title')}</h1>
          <p>${t('st.role')}</p>
        </div>
      </div>
      <div class="st-body">
        <p class="st-place">${icon('pin', 16)} ${t('st.place')}</p>
        <blockquote class="st-bio">“${t('st.bio')}”<span>${t('st.areas')}</span></blockquote>
        <div class="sec-head"><h2>${t('st.what')}</h2></div>
        <div class="services">
          ${[['s1', 'home'], ['s2', 'layers'], ['s3', 'sparkle']].map(([k, ic]) => `<div class="svc">${icon(ic, 22)}<b>${t('st.' + k + '.t')}</b><span>${t('st.' + k + '.p')}</span></div>`).join('')}
        </div>
        <p class="gilsa">${icon('info', 16)} ${t('st.gilsa')}</p>
        <div class="sec-head"><h2>${t('st.links')}</h2></div>
        <div class="list">
          <a class="row" href="https://www.instagram.com/js.interiorismo/" target="_blank" rel="noopener">${icon('ig')}<span>@js.interiorismo</span>${icon('chev', 16, 'dim')}</a>
          <a class="row" href="https://www.instagram.com/missyplicity/" target="_blank" rel="noopener">${icon('ig')}<span>@missyplicity</span>${icon('chev', 16, 'dim')}</a>
          <a class="row" href="https://www.behance.net/JorgeSantana" target="_blank" rel="noopener">${icon('be')}<span>Behance · JorgeSantana</span>${icon('chev', 16, 'dim')}</a>
        </div>
        <div class="sec-head"><h2>${t('st.contact')}</h2><span class="muted">${t('st.ph.note')}</span></div>
        <div class="list">
          <div class="row ph">${icon('chat')}<span class="placeholder">${t('st.ph.wa')}</span></div>
          <div class="row ph">${icon('mail')}<span class="placeholder">${t('st.ph.mail')}</span></div>
          <div class="row ph">${icon('pin')}<span class="placeholder">${t('st.ph.addr')}</span></div>
        </div>
        <div class="sec-head"><h2>${t('st.settings')}</h2></div>
        <div class="list">
          <div class="row">${icon('globe')}<span>${t('st.lang')}</span>
            <div class="seg mini"><button data-lang="es" class="${L === 'es' ? 'on' : ''}">ES</button><button data-lang="en" class="${L === 'en' ? 'on' : ''}">EN</button></div></div>
          <button class="row" data-act="install">${icon('download')}<span>${ctx.isStandalone() ? t('st.installed') : t('st.install')}<small>${t('st.install.p')}</small></span></button>
          <button class="row" data-act="reset">${icon('refresh')}<span>${t('st.reset')}</span></button>
        </div>
        <div class="about">
          <h3>${t('st.about')}</h3>
          <p>${t('st.about.p')}</p>
          <p class="muted small">${t('st.visuals')}</p>
          <p class="sig">${t('st.credit')}</p>
          <p class="muted small">${t('st.renders')}</p>
        </div>
      </div>`;
  }

  // --- interactions --------------------------------------------------------
  sc.addEventListener('click', async (e) => {
    const lb = e.target.closest('[data-lang]'); if (lb) { setLang(lb.dataset.lang); return; }
    const a = e.target.closest('[data-act]'); if (!a) return;
    if (a.dataset.act === 'reset') { reset(); toast(t('st.reset.done'), 'refresh'); }
    if (a.dataset.act === 'install') { const ok = await ctx.install(); if (!ok) toast(t('st.install.p'), 'info'); }
  });

  const off = onLang(render);
  render();
  return { el, refresh: render, destroy: off };
}
