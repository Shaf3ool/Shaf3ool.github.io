/* =========================================================================
   i18n.js — Spanish (Mexico) primary + English toggle
   All interface strings live here. The language persists in localStorage and
   updates <html lang>. Elements with data-i18n="key" are refreshed by apply().
   ========================================================================= */

// --- dictionary ---------------------------------------------------------------
const DICT = {
  es: {
    // desktop side panel
    'side.kicker': 'Js Interiorismo · Concepto de app',
    'side.title': 'Los avances de tu <em>obra</em>, al día',
    'side.text': 'Tu cliente abre la app y ve qué pasó en su obra: el portón ya quedó, los muros van a la mitad, llegaron los acabados del baño. Con fotos, fecha y etapa.',
    'side.s1': 'La obra en un vistazo: porcentaje y etapa',
    'side.s2': 'Cada novedad con fecha, foto y etapa',
    'side.s3': 'Toca un avance para ver su galería',
    'side.open': 'Ábrelo en tu celular',
    'side.honest': 'Prototipo web instalable (PWA), no es una app de App Store ni Google Play. Proyecto, fechas y textos son Demo.',
    'side.credit': 'Concept by Shaf3ool · Renders © Jorge Santana / Js Interiorismo',
    // header
    'h.kicker': 'Tu proyecto',
    'h.demo': 'Demo',
    'h.lang': 'EN',
    'h.langAria': 'Switch to English',
    'h.bellAria': 'Notificaciones',
    // progress card
    'p.done': 'completado',
    'p.phase': 'Etapa actual',
    'p.delivery': 'Entrega estimada',
    'p.started': 'Inicio',
    // phases
    'ph.diseno': 'Diseño',
    'ph.compras': 'Compras',
    'ph.obra': 'Obra',
    'ph.acabados': 'Acabados',
    'ph.entrega': 'Entrega',
    'st.done': 'Listo',
    'st.now': 'En curso',
    'st.next': 'Próximo',
    // feed
    'f.title': 'Avances',
    'f.count': '{n} actualizaciones',
    'f.all': 'Todo',
    'f.empty': 'Aún no hay avances en esta etapa.',
    'f.new': 'Nuevo',
    'f.photos': '{n} fotos',
    'f.photo': '1 foto',
    'f.today': 'Hoy',
    'f.daysAgo': 'Hace {n} días',
    'f.yesterday': 'Ayer',
    'f.footer1': 'Concept by Shaf3ool',
    'f.footer2': 'Renders © Jorge Santana / Js Interiorismo',
    'f.footer3': 'Prototipo web · las fotos son renders de Jorge usados como referencia; el proyecto y los avances son Demo.',
    // detail
    'd.back': 'Avances',
    'd.next': 'Lo que sigue',
    'd.by': 'Equipo Js Interiorismo',
    'd.byNote': 'Publicado en tu proyecto · Demo',
    'd.photoNote': 'Foto de referencia: render de Jorge Santana (Demo)',
    'd.of': '{i} de {n}',
    'd.prev': 'Avance anterior',
    'd.newer': 'Avance más reciente',
    // notifications sheet
    'n.title': 'Notificaciones',
    'n.text': 'Recibe un aviso cada vez que Jorge publique un avance de tu obra.',
    'n.toggle': 'Avisarme de nuevos avances',
    'n.weekly': 'Resumen semanal los viernes',
    'n.demo': 'Demo: en este prototipo no se envían notificaciones reales.',
    'n.done': 'Listo',
    'n.on': 'Notificaciones activadas (Demo)',
    'n.off': 'Notificaciones desactivadas',
    'n.weeklyOn': 'Resumen semanal activado (Demo)',
    'n.weeklyOff': 'Resumen semanal desactivado'
  },
  en: {
    'side.kicker': 'Js Interiorismo · App concept',
    'side.title': 'Your <em>build</em>, always up to date',
    'side.text': 'The client opens the app and sees what happened on site: the gate is in, the walls are halfway, the bathroom finishes arrived. With photos, dates and phases.',
    'side.s1': 'The build at a glance: progress and phase',
    'side.s2': 'Every update with a date, photo and phase',
    'side.s3': 'Tap an update to see its gallery',
    'side.open': 'Open it on your phone',
    'side.honest': 'Installable web prototype (PWA), not an App Store or Google Play app. Project, dates and texts are Demo.',
    'side.credit': 'Concept by Shaf3ool · Renders © Jorge Santana / Js Interiorismo',
    'h.kicker': 'Your project',
    'h.demo': 'Demo',
    'h.lang': 'ES',
    'h.langAria': 'Cambiar a español',
    'h.bellAria': 'Notifications',
    'p.done': 'complete',
    'p.phase': 'Current phase',
    'p.delivery': 'Estimated handover',
    'p.started': 'Started',
    'ph.diseno': 'Design',
    'ph.compras': 'Purchasing',
    'ph.obra': 'Build',
    'ph.acabados': 'Finishes',
    'ph.entrega': 'Handover',
    'st.done': 'Done',
    'st.now': 'In progress',
    'st.next': 'Upcoming',
    'f.title': 'Updates',
    'f.count': '{n} updates',
    'f.all': 'All',
    'f.empty': 'No updates in this phase yet.',
    'f.new': 'New',
    'f.photos': '{n} photos',
    'f.photo': '1 photo',
    'f.today': 'Today',
    'f.daysAgo': '{n} days ago',
    'f.yesterday': 'Yesterday',
    'f.footer1': 'Concept by Shaf3ool',
    'f.footer2': 'Renders © Jorge Santana / Js Interiorismo',
    'f.footer3': 'Web prototype · photos are Jorge’s renders used as stand-ins; the project and its updates are Demo.',
    'd.back': 'Updates',
    'd.next': 'What’s next',
    'd.by': 'Js Interiorismo team',
    'd.byNote': 'Posted to your project · Demo',
    'd.photoNote': 'Reference photo: a render by Jorge Santana (Demo)',
    'd.of': '{i} of {n}',
    'd.prev': 'Older update',
    'd.newer': 'Newer update',
    'n.title': 'Notifications',
    'n.text': 'Get a heads-up whenever Jorge posts an update on your build.',
    'n.toggle': 'Notify me about new updates',
    'n.weekly': 'Weekly summary on Fridays',
    'n.demo': 'Demo: this prototype sends no real notifications.',
    'n.done': 'Done',
    'n.on': 'Notifications on (Demo)',
    'n.off': 'Notifications off',
    'n.weeklyOn': 'Weekly summary on (Demo)',
    'n.weeklyOff': 'Weekly summary off'
  }
};

// --- state ----------------------------------------------------------------------
const KEY = 'jsavances.lang';
let lang = readLang();

/**
 * What: read the saved language (falls back to Spanish).
 * In:  —
 * Out: 'es' | 'en'
 */
function readLang() {
  try { return localStorage.getItem(KEY) === 'en' ? 'en' : 'es'; } catch { return 'es'; }
}

/**
 * What: translate a key, filling {placeholders}.
 * In:  key (string), vars (object, optional) e.g. {n: 3}
 * Out: string (the key itself if missing, so gaps are visible in QA)
 */
export function t(key, vars = {}) {
  const s = DICT[lang][key] ?? DICT.es[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : ''));
}

/**
 * What: current language code.
 * In:  —
 * Out: 'es' | 'en'
 */
export function getLang() { return lang; }

/**
 * What: pick the right side of a bilingual {es, en} object.
 * In:  obj ({es, en})
 * Out: string
 */
export function L(obj) { return obj[lang] ?? obj.es; }

/**
 * What: format an ISO date for the current locale.
 * In:  iso (string 'YYYY-MM-DD'), opts (Intl options)
 * Out: string, e.g. "24 oct 2026"
 */
export function fmtDate(iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  // noon local time avoids off-by-one days across time zones
  const d = new Date(`${iso}T12:00:00`);
  return new Intl.DateTimeFormat(lang === 'es' ? 'es-MX' : 'en-US', opts).format(d).replace('.', '');
}

/**
 * What: switch language, persist it and refresh static strings.
 * In:  next ('es' | 'en')
 * Out: —
 */
export function setLang(next) {
  lang = next === 'en' ? 'en' : 'es';
  try { localStorage.setItem(KEY, lang); } catch { /* private mode: ignore */ }
  apply();
}

/**
 * What: refresh every [data-i18n] element and <html lang>.
 * In:  root (Element, default document)
 * Out: —
 */
export function apply(root = document) {
  document.documentElement.lang = lang === 'es' ? 'es-MX' : 'en';
  // innerHTML is safe: all strings come from the dictionary above
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.innerHTML = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
}
