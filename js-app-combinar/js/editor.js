/* =========================================================================
   editor.js — two sheets:
   • Editar medidas: room width/length/height + each piece's numbers
   • Importar proyecto: .json file or pasted text in the shared format
   ========================================================================= */
import { t } from './i18n.js';
import { normalizeProject, cloneProject, DEMOS } from './data.js';
import { saveProject, resetDemo, addImported, getProject } from './store.js';
import { openSheet, toast, esc, ICON } from './ui.js';

/**
 * What: one labelled numeric field.
 * In:   key — data key, label, value, step
 * Out:  HTML string
 */
function num(key, label, value, step = 1) {
  return `<label class="field"><span>${label}</span><input type="number" inputmode="decimal" step="${step}" data-k="${key}" value="${Math.round(value * 10) / 10}"></label>`;
}

/**
 * What: open the edit sheet for a project; calls onSave with the new project.
 * In:   project, onSave(project)
 * Out:  —
 */
export function openEditor(project, onSave) {
  const p = cloneProject(project);
  const isDemo = DEMOS.some((d) => d.id === p.id);
  // room block + one block per piece
  const items = p.items.map((it, i) => `<div class="irow" data-i="${i}"><header><span class="sw" style="background:${esc(it.color)}"></span><b>${esc(it.name)}</b><button class="x" data-del="${i}" aria-label="${t('e.del')}">${ICON.trash}</button></header>
      <div class="fgrid">${num('x', 'x', it.x)}${num('y', 'y', it.y)}${num('rot', t('e.rot') + ' °', it.rot || 0, 15)}${num('z', t('e.z'), it.z || 0)}${num('w', t('e.w'), it.w)}${num('d', 'Fondo', it.d)}${num('h', t('e.h'), it.h)}</div></div>`).join('');
  const body = `<div class="e-sec">${t('e.room')} · ${t('cm')}</div>
    <div class="fgrid" data-room>${num('w', t('e.w'), p.room.w)}${num('l', t('e.l'), p.room.l)}${num('h', t('e.h'), p.room.h)}</div>
    <div class="e-sec">${t('e.items')} · ${t('cm')}</div>
    <div data-items>${items}</div>
    <div class="sheet-actions"><button class="btn1 full" data-save>${t('e.save')}</button>${isDemo && project.edited ? `<button class="linkish" data-reset>${t('e.reset')}</button>` : ''}</div>`;
  openSheet(t('e.title'), body, (el, close) => {
    // translate "Fondo" label in English
    el.querySelectorAll('.field span').forEach((s) => { if (s.textContent === 'Fondo' && t('e.w') === 'Width') s.textContent = 'Depth'; });
    const removed = new Set();
    el.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => {
      removed.add(+b.dataset.del);
      b.closest('.irow').remove();
    }));
    el.querySelector('[data-save]').addEventListener('click', () => {
      // read the room numbers, then every remaining piece
      const room = { ...p.room };
      el.querySelectorAll('[data-room] input').forEach((inp) => { room[inp.dataset.k] = +inp.value; });
      const items = [];
      p.items.forEach((it, i) => {
        if (removed.has(i)) return;
        const row = el.querySelector(`.irow[data-i="${i}"]`);
        const n = { ...it };
        row.querySelectorAll('input').forEach((inp) => { n[inp.dataset.k] = +inp.value; });
        items.push(n);
      });
      const res = normalizeProject({ room, items, name: p.name });
      if (!res.ok) { toast(t(res.error)); return; }
      const next = { ...p, room: res.project.room, items: res.project.items };
      saveProject(next);
      toast(t('e.saved'));
      close();
      onSave(getProject(p.id) || next);
    });
    const rs = el.querySelector('[data-reset]');
    if (rs) rs.addEventListener('click', () => { resetDemo(p.id); close(); onSave(getProject(p.id)); });
  });
}

const FORMAT = `{
  "room": { "w": 420, "l": 380, "h": 270 },
  "items": [
    { "name": "Sofá", "x": 40, "y": 120, "w": 220,
      "d": 95, "h": 80, "rot": 0, "color": "#E9DFCF" }
  ]
}
x, y = esquina sup. izq. (rot 0) · rot = grados, horario
z (opcional) = altura de la base · type (opcional)`;

/**
 * What: open the import sheet; calls onDone with the stored project.
 * In:   onDone(project)
 * Out:  —
 */
export function openImport(onDone) {
  const body = `<label class="opt file-btn"><span class="oi">${ICON.file}</span><span><b>${t('i.file')}</b><span>.json · Taller</span></span><input type="file" accept=".json,application/json" data-file></label>
    <div class="e-sec">${t('i.paste')}</div>
    <textarea class="paste" data-paste spellcheck="false" placeholder='{"room":{"w":420,"l":380,"h":270},"items":[…]}'></textarea>
    <p class="err" data-err></p>
    <button class="btn1 full" data-go>${t('i.go')}</button>
    <div class="e-sec">${t('i.format')}</div><pre class="fmt">${esc(FORMAT)}</pre>`;
  openSheet(t('i.title'), body, (el, close) => {
    const err = el.querySelector('[data-err]');
    // parse text → validate → store → hand back
    const take = (text) => {
      let raw;
      try { raw = JSON.parse(text); } catch (e) { err.textContent = t('err.json'); return; }
      const res = normalizeProject(raw);
      if (!res.ok) { err.textContent = t(res.error); return; }
      const stored = addImported(res.project);
      toast(t('i.ok'));
      close();
      onDone(stored.id);
    };
    el.querySelector('[data-file]').addEventListener('change', async (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) take(await f.text());
    });
    el.querySelector('[data-go]').addEventListener('click', () => take(el.querySelector('[data-paste]').value.trim()));
  });
}
