/* =========================================================================
   i18n.js: Mexican Spanish (primary) + English strings for the Taller.
   Elements carry data-i18n="key" (text) or data-i18n-aria / -ph attrs.
   ========================================================================= */

const DICT = {
  es: {
    title: 'Taller', sub: 'Diseña tu espacio en 3 proyecciones', demo: 'Demo',
    room: 'Habitación', width: 'Ancho', length: 'Largo', height: 'Alto',
    plan: 'Planta', front: 'Alzado frontal', side: 'Alzado lateral',
    planShort: 'Planta', frontShort: 'Frontal', sideShort: 'Lateral',
    catalog: 'Catálogo de Jorge', catShort: 'Catálogo',
    sendNote: 'Demo: al tocar «Enviar» no se manda nada; tu proyecto solo se guarda en este dispositivo. Contacto de Jorge: por definir (placeholder).', catalogNote: 'Productos disponibles · Demo', add: 'Agregar',
    save: 'Guardar', send: 'Enviar a Jorge', projects: 'Mis proyectos', export: 'Exportar',
    rotate: 'Girar', dup: 'Duplicar', del: 'Quitar', finish: 'Acabado', lift: 'Altura desde piso',
    saved: 'Guardado en Mis proyectos', added: 'agregado', removed: 'Quitado',
    floorOnly: 'Este mueble va sobre el piso', wallHint: 'Arrastra en el alzado para subir o bajar',
    tapHint: 'Toca un mueble para moverlo · arrastra para colocarlo',
    emptyTitle: 'Tu espacio está vacío', emptyBody: 'Agrega productos del catálogo de Jorge para empezar.',
    projName: 'Nombre del proyecto', newProj: 'Nuevo proyecto', open: 'Abrir', items: 'piezas',
    noProjects: 'Aún no guardas proyectos.', delProj: 'Eliminar',
    exportTitle: 'Exportar proyecciones', exSheetSvg: 'Lámina completa · SVG', exSheetPng: 'Lámina completa · PNG',
    exViews: 'Las 3 vistas por separado · PNG', exJson: 'Archivo del proyecto · JSON',
    exNote: 'El JSON se puede abrir en la app «Combinar vistas».',
    sendTitle: 'Enviar a Jorge', sendBody: 'Jorge recibiría tus 3 proyecciones con medidas y la lista de productos.',
    msg: 'Mensaje (opcional)', msgPh: 'Ej. Me gustaría que el sofá quede frente a la ventana…',
    sendBtn: 'Enviar (Demo)', sentTitle: 'Demo: no se envió nada',
    sentBody: 'Este es un prototipo. En la versión real, Jorge recibiría tus proyecciones y te respondería por la app. Tu proyecto quedó guardado.',
    contact: 'Contacto de Jorge: por definir (placeholder)', ok: 'Entendido', close: 'Cerrar',
    proto: 'Prototipo web instalable · no es una app de tienda',
    credit1: 'Concept by Shaf3ool', credit2: 'Renders © Jorge Santana / Js Interiorismo',
    sideTitle: 'Taller de proyecciones', sideBody: 'Ajusta las medidas de tu espacio, acomoda los productos que Jorge tiene disponibles y trabaja en planta y alzados a la vez. Al terminar, guarda y envía tus 3 proyecciones.',
    phoneView: 'Ver en iPhone', deskView: 'Vista de escritorio',
    piece: 'pieza', pieces: 'piezas', cm: 'cm', reset: 'Restablecer', lang: 'EN',
    seedName: 'Sala-comedor · Demo', viewFront: 'Vista desde el frente', viewSide: 'Vista desde la derecha',
    downloading: 'Descargando…', copied: 'Listo',
  },
  en: {
    title: 'Workshop', sub: 'Design your space in 3 projections', demo: 'Demo',
    room: 'Room', width: 'Width', length: 'Length', height: 'Height',
    plan: 'Plan', front: 'Front elevation', side: 'Side elevation',
    planShort: 'Plan', frontShort: 'Front', sideShort: 'Side',
    catalog: "Jorge's catalogue", catShort: 'Catalogue',
    sendNote: "Demo: tapping “Send” sends nothing; your project is only saved on this device. Jorge's contact: to be defined (placeholder).", catalogNote: 'Available products · Demo', add: 'Add',
    save: 'Save', send: 'Send to Jorge', projects: 'My projects', export: 'Export',
    rotate: 'Rotate', dup: 'Duplicate', del: 'Remove', finish: 'Finish', lift: 'Height above floor',
    saved: 'Saved to My projects', added: 'added', removed: 'Removed',
    floorOnly: 'This piece stands on the floor', wallHint: 'Drag in the elevation to raise or lower',
    tapHint: 'Tap a piece to select · drag to place it',
    emptyTitle: 'Your space is empty', emptyBody: "Add products from Jorge's catalogue to begin.",
    projName: 'Project name', newProj: 'New project', open: 'Open', items: 'pieces',
    noProjects: 'No saved projects yet.', delProj: 'Delete',
    exportTitle: 'Export projections', exSheetSvg: 'Full sheet · SVG', exSheetPng: 'Full sheet · PNG',
    exViews: 'The 3 views separately · PNG', exJson: 'Project file · JSON',
    exNote: 'The JSON opens in the “Combine views” app.',
    sendTitle: 'Send to Jorge', sendBody: 'Jorge would receive your 3 projections with dimensions and the product list.',
    msg: 'Message (optional)', msgPh: 'E.g. I would like the sofa facing the window…',
    sendBtn: 'Send (Demo)', sentTitle: 'Demo: nothing was sent',
    sentBody: 'This is a prototype. In the real version Jorge would receive your projections and reply in the app. Your project has been saved.',
    contact: "Jorge's contact: to be defined (placeholder)", ok: 'Got it', close: 'Close',
    proto: 'Installable web prototype · not a store app',
    credit1: 'Concept by Shaf3ool', credit2: 'Renders © Jorge Santana / Js Interiorismo',
    sideTitle: 'Projection workshop', sideBody: 'Set the size of your space, arrange the products Jorge makes available and work in plan and elevations at once. When you are done, save and send your 3 projections.',
    phoneView: 'View on iPhone', deskView: 'Desktop view',
    piece: 'piece', pieces: 'pieces', cm: 'cm', reset: 'Reset', lang: 'ES',
    seedName: 'Living-dining · Demo', viewFront: 'Seen from the front', viewSide: 'Seen from the right',
    downloading: 'Downloading…', copied: 'Done',
  },
};

let lang = localStorage.getItem('taller.lang') || 'es';
const listeners = [];

/**
 * What: translate a key in the current language.
 * In:  key (string)
 * Out: translated string (falls back to the key itself)
 */
export function t(key) {
  return (DICT[lang] && DICT[lang][key]) || DICT.es[key] || key;
}

/**
 * What: current language code.
 * In:  —
 * Out: 'es' | 'en'
 */
export function getLang() { return lang; }

/**
 * What: apply translations to every [data-i18n*] element under a root.
 * In:  root (Element, default document)
 * Out: —
 */
export function apply(root = document) {
  // text content, aria-label and placeholder variants
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
  root.querySelectorAll('[data-i18n-ph]').forEach((el) => el.setAttribute('placeholder', t(el.dataset.i18nPh)));
  document.documentElement.lang = lang === 'es' ? 'es-MX' : 'en';
}

/**
 * What: switch language, persist it and notify listeners.
 * In:  next ('es' | 'en')
 * Out: —
 */
export function setLang(next) {
  lang = next;
  localStorage.setItem('taller.lang', lang);
  apply();
  listeners.forEach((fn) => fn(lang));
}

/**
 * What: subscribe to language changes.
 * In:  fn (function(lang))
 * Out: —
 */
export function onLang(fn) { listeners.push(fn); }
