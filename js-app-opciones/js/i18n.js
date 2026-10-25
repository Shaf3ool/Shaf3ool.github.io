/* =========================================================================
   i18n.js — Mexican Spanish (primary) + English UI strings
   Item texts live in data.js as { es, en }; this file holds the UI copy.
   ========================================================================= */
import { get, set } from './store.js';

// --- dictionary -------------------------------------------------------------
const D = {
  es: {
    'title': 'Opciones', 'hero': 'Todas tus <em>opciones</em>', 'kicker': 'Catálogo del proyecto', 'project': 'Casa Demo · Aguascalientes',
    'lead': 'Todo lo que Jorge tiene disponible para tu proyecto. Guarda lo que te guste y envíaselo.',
    'search': 'Buscar material, mueble, luz…', 'all': 'Todo', 'results': 'resultados', 'one.result': 'resultado',
    'empty.t': 'Sin resultados', 'empty.p': 'Prueba con otra palabra o elige otra categoría.',
    'demo.banner': 'Demo · catálogo de ejemplo. Las fotos son renders reales de Jorge; nombres, notas y medidas son de muestra.',
    'tag.photo': 'Foto real', 'tag.sample': 'Muestra', 'tag.real': 'En su trabajo', 'tag.demo': 'Demo',
    'seen': 'Visto en', 'sample.note': 'Muestra de material dibujada para la demo, no es una foto.',
    'specs': 'Ficha', 'specs.demo': 'Datos de ejemplo (Demo)', 'fmt': 'Formato', 'fin': 'Acabado', 'use': 'Ideal para',
    'pairs': 'Combina con', 'fav.add': 'Guardar en favoritos', 'fav.on': 'En tus favoritos',
    'fav.added': 'Guardado en favoritos', 'fav.removed': 'Quitado de favoritos',
    'favs': 'Favoritos', 'favs.title': 'Tus favoritos', 'favs.see': 'Ver', 'favs.count1': 'favorito', 'favs.countN': 'favoritos',
    'favs.empty.t': 'Aún no guardas nada', 'favs.empty.p': 'Toca el corazón en cualquier opción para guardarla aquí.',
    'favs.browse': 'Ver opciones', 'favs.note': 'Mensaje para Jorge (opcional)',
    'favs.note.ph': 'Ej. Me gusta el roble para la recámara y el chukum en el baño…',
    'send': 'Enviar a Jorge', 'send.hint': 'Demo: este prototipo no envía nada.',
    'sent.t': 'Selección lista', 'sent.p1': 'En la app real, Jorge recibiría tu lista con {n} y tu mensaje para preparar tu propuesta.',
    'sent.p2': 'Esto es una demo: no se envió nada y nadie recibió tu selección.', 'sent.ok': 'Entendido', 'sent.list': 'Tu lista para Jorge', 'material': 'Material',
    'remove': 'Quitar', 'close': 'Cerrar', 'back': 'Atrás', 'clear': 'Borrar búsqueda',
    'credit': 'Renders © Jorge Santana / Js Interiorismo · Concept by Shaf3ool',
    'credit2': 'Prototipo web (PWA), no es una app de tienda. Contacto: [WhatsApp de Jorge — por confirmar].',
    'side.kicker': 'Js Interiorismo · App concepto',
    'side.title': 'Todas tus <em>opciones</em>, en un lugar.',
    'side.text': 'El cliente ve todo lo que Jorge ofrece para su proyecto: pisos, muros, mobiliario, iluminación, baño, cocina y exteriores. Guarda sus favoritos y se los envía.',
    'side.open': 'Ábrelo en tu celular', 'side.honest': 'Prototipo web instalable (PWA), no una app de App Store. Catálogo y datos de ejemplo (Demo); las fotos son renders reales de Jorge Santana.',
    'side.credit': 'Renders © Jorge Santana / Js Interiorismo · Concept by Shaf3ool',
  },
  en: {
    'title': 'Options', 'hero': 'All your <em>options</em>', 'kicker': 'Project catalogue', 'project': 'Demo House · Aguascalientes',
    'lead': 'Everything Jorge has available for your project. Save what you like and send it to him.',
    'search': 'Search materials, furniture, lights…', 'all': 'All', 'results': 'results', 'one.result': 'result',
    'empty.t': 'No results', 'empty.p': 'Try another word or pick another category.',
    'demo.banner': 'Demo · sample catalogue. Photos are Jorge’s real renders; names, notes and sizes are examples.',
    'tag.photo': 'Real photo', 'tag.sample': 'Sample', 'tag.real': 'In his work', 'tag.demo': 'Demo',
    'seen': 'Seen in', 'sample.note': 'Material sample drawn for the demo, not a photo.',
    'specs': 'Details', 'specs.demo': 'Sample data (Demo)', 'fmt': 'Format', 'fin': 'Finish', 'use': 'Best for',
    'pairs': 'Pairs well with', 'fav.add': 'Save to favourites', 'fav.on': 'In your favourites',
    'fav.added': 'Saved to favourites', 'fav.removed': 'Removed from favourites',
    'favs': 'Favourites', 'favs.title': 'Your favourites', 'favs.see': 'View', 'favs.count1': 'favourite', 'favs.countN': 'favourites',
    'favs.empty.t': 'Nothing saved yet', 'favs.empty.p': 'Tap the heart on any option to keep it here.',
    'favs.browse': 'Browse options', 'favs.note': 'Message for Jorge (optional)',
    'favs.note.ph': 'E.g. I like the oak for the bedroom and chukum in the bathroom…',
    'send': 'Send to Jorge', 'send.hint': 'Demo: this prototype sends nothing.',
    'sent.t': 'Selection ready', 'sent.p1': 'In the real app, Jorge would receive your list of {n} and your message to prepare your proposal.',
    'sent.p2': 'This is a demo: nothing was sent and nobody received your selection.', 'sent.ok': 'Got it', 'sent.list': 'Your list for Jorge', 'material': 'Material',
    'remove': 'Remove', 'close': 'Close', 'back': 'Back', 'clear': 'Clear search',
    'credit': 'Renders © Jorge Santana / Js Interiorismo · Concept by Shaf3ool',
    'credit2': 'Web prototype (PWA), not an app-store app. Contact: [Jorge’s WhatsApp — to be confirmed].',
    'side.kicker': 'Js Interiorismo · App concept',
    'side.title': 'All your <em>options</em>, in one place.',
    'side.text': 'The client sees everything Jorge offers for their project: floors, walls, furniture, lighting, bathroom, kitchen and outdoors. They save favourites and send them to him.',
    'side.open': 'Open it on your phone', 'side.honest': 'Installable web prototype (PWA), not an App Store app. Sample catalogue and data (Demo); the photos are Jorge Santana’s real renders.',
    'side.credit': 'Renders © Jorge Santana / Js Interiorismo · Concept by Shaf3ool',
  },
};

// --- language state -----------------------------------------------------------
const listeners = new Set();

/**
 * What: current UI language.
 * In:  —
 * Out: 'es' | 'en'
 */
export function lang() { return get().lang === 'en' ? 'en' : 'es'; }

/**
 * What: translate a UI key, with optional {n}-style substitutions.
 * In:  key (string), vars (object, optional)
 * Out: string (falls back to Spanish, then to the key)
 */
export function t(key, vars) {
  let s = D[lang()][key] ?? D.es[key] ?? key;
  if (vars) for (const k in vars) s = s.replace('{' + k + '}', vars[k]);
  return s;
}

/**
 * What: pick the current-language string from a { es, en } object.
 * In:  obj ({ es, en })
 * Out: string
 */
export function L(obj) { return obj ? (obj[lang()] || obj.es) : ''; }

/**
 * What: fill every [data-i18n] (innerHTML) and [data-i18n-ph] (placeholder) node.
 * In:  root (Element, default document)
 * Out: —
 */
export function apply(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.innerHTML = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  // keep <html lang> honest for screen readers
  document.documentElement.lang = lang() === 'en' ? 'en' : 'es-MX';
}

/**
 * What: switch language, re-apply static copy and notify the screens.
 * In:  next ('es' | 'en')
 * Out: —
 */
export function setLang(next) {
  set({ lang: next });
  apply();
  listeners.forEach((fn) => fn(next));
}

/**
 * What: subscribe to language changes.
 * In:  fn (lang => void)
 * Out: —
 */
export function onLang(fn) { listeners.add(fn); }
