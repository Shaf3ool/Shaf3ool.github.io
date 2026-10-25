/* =========================================================================
   screens/send.js — "Enviar a Jorge para revisión" bottom sheet (DEMO)
   Nothing is sent anywhere: the design is only marked "in review" locally.
   ========================================================================= */
import { t } from '../i18n.js';
import { h, icon, sheet, toast, esc } from '../ui.js';
import { saveDesign } from '../store.js';
import { planThumb } from './thumb.js';

/**
 * What: open the send / save sheet for a design.
 * In:  design (object, mutated), opts { onSaved(), goDesigns() }
 * Out: —
 */
export function openSendSheet(design, opts = {}) {
  const c = h(`
    <div class="send">
      <div class="send-head">
        <div class="send-thumb">${planThumb(design)}</div>
        <div><h3 data-i18n="snd.title">${t('snd.title')}</h3><p class="muted">${t('snd.sub')}</p></div>
      </div>
      <label class="field"><span>${t('snd.name')}</span><input type="text" maxlength="40" value="${esc(design.name)}" name="name" autocomplete="off"></label>
      <label class="field"><span>${t('snd.note')}</span><textarea rows="3" maxlength="300" name="note" placeholder="${esc(t('snd.note.ph'))}">${esc(design.note || '')}</textarea></label>
      <div class="send-to">${icon('chat', 18)}<span>Jorge Santana · Js Interiorismo</span><em class="demo-tag">${t('common.demo')}</em></div>
      <button class="pill-btn primary block" data-act="send">${icon('send', 18)}<span>${t('snd.btn')}</span></button>
      <button class="pill-btn ghost block" data-act="save">${t('snd.later')}</button>
    </div>`);
  const s = sheet(c);

  /**
   * What: copy the form fields into the design.
   * In:  —
   * Out: —
   */
  function read() {
    design.name = c.querySelector('[name=name]').value.trim() || t('pl.untitled');
    design.note = c.querySelector('[name=note]').value.trim();
  }
  c.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    if (b.dataset.act === 'save' || b.dataset.act === 'send') read();
    if (b.dataset.act === 'save') {
      saveDesign(design); s.close(); toast(t('pl.saved'));
      if (opts.onSaved) opts.onSaved();
      return;
    }
    if (b.dataset.act === 'send') {
      design.status = 'review';
      saveDesign(design);
      if (opts.onSaved) opts.onSaved();
      // success state: animated check + honest demo note
      c.innerHTML = `
        <div class="send-done">
          <div class="done-check">${icon('check', 40)}</div>
          <h3>${t('snd.done.t')}</h3>
          <p class="muted">${t('snd.done.p')}</p>
          <button class="pill-btn primary block" data-act="designs">${t('snd.done.btn')}</button>
        </div>`;
      return;
    }
    if (b.dataset.act === 'designs') { s.close(); if (opts.goDesigns) opts.goDesigns(); }
  });
}
