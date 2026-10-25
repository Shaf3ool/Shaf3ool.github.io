/* =========================================================================
   i18n.js — Mexican Spanish (primary) + English. Every visible string.
   Elements with data-i18n="key" get innerHTML; data-i18n-aria → aria-label.
   ========================================================================= */

const DICT = {
  es: {
    'side.kicker': 'Js Interiorismo · App de estudio',
    'side.title': 'Combina tus <em>vistas</em>',
    'side.text': 'Carga la planta, el alzado frontal y el alzado lateral de un espacio. La app calcula los volúmenes y dibuja una isometría limpia que puedes girar, exportar y compartir con tu cliente. Sin Blender.',
    'side.open': 'Ábrelo en tu teléfono',
    'side.honest': 'Prototipo web instalable (PWA): no es una app de App Store ni de Google Play. Los proyectos son de ejemplo (Demo) y compartir es una demostración: no se envía nada a ningún cliente.',
    'side.credit': 'Concept by Shaf3ool · Renders © Jorge Santana / Js Interiorismo',
    'home.kicker': 'Estudio · Combinar vistas',
    'home.title': 'De tres vistas 2D a una <em>isometría</em>',
    'home.sub': 'Planta + alzado frontal + alzado lateral → volúmenes calculados, dibujados como lámina de arquitectura.',
    'home.projects': 'Proyectos',
    'home.mine': 'Importados',
    'home.import': 'Importar JSON',
    'home.importSub': 'Un proyecto del Taller u otro archivo con el mismo formato',
    'home.how': 'Cómo funciona',
    'home.how1': 'Planta: posición y huella (x, y, ancho, fondo).',
    'home.how2': 'Alzados: altura y nivel de cada pieza.',
    'home.how3': 'Isometría: X = (x − y)·cos 30°, Y = (x + y)·sin 30° − z.',
    'card.pieces': 'piezas',
    'card.ref': 'Referencia',
    'pill.demo': 'Demo',
    'pill.imported': 'Importado',
    'pill.edited': 'Editado',
    'v.plan': 'Planta',
    'v.front': 'Alzado frontal',
    'v.side': 'Alzado lateral',
    'p.views': '3 vistas ortogonales',
    'p.edit': 'Editar',
    'p.merge': 'Combinar vistas',
    'p.mergeSub': 'Calcula los volúmenes y dibuja la isometría',
    'm.title': 'Isometría',
    'm.s0': 'Planta · Alzado frontal · Alzado lateral',
    'm.s1': 'Plegando las vistas',
    'm.s2': 'Calculando volúmenes',
    'm.s3': 'Isometría lista',
    'm.rotL': 'Girar a la izquierda',
    'm.rotR': 'Girar a la derecha',
    'm.export': 'Exportar',
    'm.share': 'Compartir con el cliente',
    'm.replay': 'Repetir animación',
    'm.volumes': 'volúmenes',
    'm.views3': 'desde 3 vistas',
    'm.shared': 'Vista compartida · Demo',
    'm.openApp': 'Abrir la app',
    'x.title': 'Exportar lámina',
    'x.png': 'Imagen PNG',
    'x.pngSub': 'Alta resolución, lista para WhatsApp o correo',
    'x.svg': 'Vector SVG',
    'x.svgSub': 'Líneas limpias para Illustrator o AutoCAD',
    'x.done': 'Lámina exportada',
    's.title': 'Compartir con el cliente',
    's.demo': 'Demo: no se envía nada a ningún cliente real.',
    's.text': 'Se abre el menú de compartir de tu teléfono con la lámina y un enlace de vista. Si tu navegador no puede compartir, se copia el enlace.',
    's.go': 'Compartir',
    's.copied': 'Enlace copiado · Demo',
    's.shared': 'Listo · Demo, no llegó a ningún cliente',
    's.msg': 'Isometría de tu proyecto · Js Interiorismo (Demo)',
    'e.title': 'Editar medidas',
    'e.room': 'Espacio',
    'e.w': 'Ancho',
    'e.l': 'Largo',
    'e.h': 'Alto',
    'e.items': 'Piezas',
    'e.rot': 'Giro',
    'e.z': 'Nivel',
    'e.save': 'Guardar cambios',
    'e.reset': 'Restaurar demo',
    'e.saved': 'Cambios guardados',
    'e.del': 'Quitar pieza',
    'i.title': 'Importar proyecto',
    'i.file': 'Elegir archivo .json',
    'i.paste': 'O pega el JSON aquí',
    'i.go': 'Importar',
    'i.format': 'Formato (cm):',
    'i.ok': 'Proyecto importado',
    'i.untitled': 'Proyecto importado',
    'err.noRoom': 'No encuentro "room" con w, l, h.',
    'err.roomSize': 'Las medidas del espacio no parecen válidas (cm).',
    'err.noItems': 'Falta la lista "items".',
    'err.json': 'El texto no es un JSON válido.',
    'err.share': 'No se pudo compartir',
    'del.confirm': 'Eliminar',
    'del.done': 'Proyecto eliminado',
    'foot.concept': 'Concept by Shaf3ool',
    'foot.renders': 'Renders © Jorge Santana / Js Interiorismo',
    'foot.pwa': 'Prototipo web (PWA) · Datos de ejemplo',
    'cm': 'cm',
    'back': 'Volver',
    'close': 'Cerrar',
  },
  en: {
    'side.kicker': 'Js Interiorismo · Studio app',
    'side.title': 'Merge your <em>views</em>',
    'side.text': 'Load the plan, front elevation and side elevation of a space. The app computes the volumes and draws a clean isometric view you can rotate, export and share with your client. No Blender.',
    'side.open': 'Open it on your phone',
    'side.honest': 'Installable web prototype (PWA): not an App Store or Google Play app. Projects are sample data (Demo) and sharing is a demo: nothing reaches any client.',
    'side.credit': 'Concept by Shaf3ool · Renders © Jorge Santana / Js Interiorismo',
    'home.kicker': 'Studio · Merge views',
    'home.title': 'From three 2D views to an <em>isometric</em>',
    'home.sub': 'Plan + front elevation + side elevation → computed volumes, drawn as an architectural sheet.',
    'home.projects': 'Projects',
    'home.mine': 'Imported',
    'home.import': 'Import JSON',
    'home.importSub': 'A project from Taller or any file in the same format',
    'home.how': 'How it works',
    'home.how1': 'Plan: position and footprint (x, y, width, depth).',
    'home.how2': 'Elevations: height and level of each piece.',
    'home.how3': 'Isometric: X = (x − y)·cos 30°, Y = (x + y)·sin 30° − z.',
    'card.pieces': 'pieces',
    'card.ref': 'Reference',
    'pill.demo': 'Demo',
    'pill.imported': 'Imported',
    'pill.edited': 'Edited',
    'v.plan': 'Plan',
    'v.front': 'Front elevation',
    'v.side': 'Side elevation',
    'p.views': '3 orthographic views',
    'p.edit': 'Edit',
    'p.merge': 'Merge views',
    'p.mergeSub': 'Computes the volumes and draws the isometric',
    'm.title': 'Isometric',
    'm.s0': 'Plan · Front elevation · Side elevation',
    'm.s1': 'Folding the views',
    'm.s2': 'Computing volumes',
    'm.s3': 'Isometric ready',
    'm.rotL': 'Rotate left',
    'm.rotR': 'Rotate right',
    'm.export': 'Export',
    'm.share': 'Share with client',
    'm.replay': 'Replay animation',
    'm.volumes': 'volumes',
    'm.views3': 'from 3 views',
    'm.shared': 'Shared view · Demo',
    'm.openApp': 'Open the app',
    'x.title': 'Export sheet',
    'x.png': 'PNG image',
    'x.pngSub': 'High resolution, ready for WhatsApp or email',
    'x.svg': 'SVG vector',
    'x.svgSub': 'Clean lines for Illustrator or AutoCAD',
    'x.done': 'Sheet exported',
    's.title': 'Share with client',
    's.demo': 'Demo: nothing is sent to any real client.',
    's.text': 'Your phone’s share menu opens with the sheet and a view link. If your browser can’t share, the link is copied.',
    's.go': 'Share',
    's.copied': 'Link copied · Demo',
    's.shared': 'Done · Demo, no client received it',
    's.msg': 'Isometric of your project · Js Interiorismo (Demo)',
    'e.title': 'Edit dimensions',
    'e.room': 'Room',
    'e.w': 'Width',
    'e.l': 'Length',
    'e.h': 'Height',
    'e.items': 'Pieces',
    'e.rot': 'Turn',
    'e.z': 'Level',
    'e.save': 'Save changes',
    'e.reset': 'Restore demo',
    'e.saved': 'Changes saved',
    'e.del': 'Remove piece',
    'i.title': 'Import project',
    'i.file': 'Choose a .json file',
    'i.paste': 'Or paste the JSON here',
    'i.go': 'Import',
    'i.format': 'Format (cm):',
    'i.ok': 'Project imported',
    'i.untitled': 'Imported project',
    'err.noRoom': 'Can’t find "room" with w, l, h.',
    'err.roomSize': 'The room dimensions don’t look valid (cm).',
    'err.noItems': 'The "items" list is missing.',
    'err.json': 'That text is not valid JSON.',
    'err.share': 'Couldn’t share',
    'del.confirm': 'Delete',
    'del.done': 'Project deleted',
    'foot.concept': 'Concept by Shaf3ool',
    'foot.renders': 'Renders © Jorge Santana / Js Interiorismo',
    'foot.pwa': 'Web prototype (PWA) · Sample data',
    'cm': 'cm',
    'back': 'Back',
    'close': 'Close',
  },
};

// --- current language (persisted) ----------------------------------------
let lang = 'es';
try { lang = localStorage.getItem('jsc.lang') === 'en' ? 'en' : 'es'; } catch (e) { /* storage blocked: stay in Spanish */ }

/**
 * What: translate a key in the current language.
 * In:   k — key
 * Out:  string (the key itself if missing)
 */
export function t(k) {
  return (DICT[lang] && DICT[lang][k]) || DICT.es[k] || k;
}

/**
 * What: current language code.
 * In:   —
 * Out:  'es' | 'en'
 */
export function getLang() {
  return lang;
}

/**
 * What: switch language, persist it and refresh static strings.
 * In:   l — 'es' | 'en'
 * Out:  —
 */
export function setLang(l) {
  lang = l === 'en' ? 'en' : 'es';
  try { localStorage.setItem('jsc.lang', lang); } catch (e) { /* ignore */ }
  apply(document);
}

/**
 * What: fill every [data-i18n] / [data-i18n-aria] element under root.
 * In:   root — element or document
 * Out:  —
 */
export function apply(root) {
  document.documentElement.lang = lang === 'es' ? 'es-MX' : 'en';
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.innerHTML = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
}
