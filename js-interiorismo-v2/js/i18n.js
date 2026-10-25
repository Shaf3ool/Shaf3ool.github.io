/* ==========================================================
   i18n.js — Spanish (Mexico) primary, English toggle.
   Every visible string lives here; HTML carries the Spanish default
   and data-i18n / data-i18n-html / data-i18n-ph / data-i18n-alt keys.
   ========================================================== */

// ---- Dictionary: es (default) and en ----
export const DICT = {
  es: {
    'doc.title': 'Js Interiorismo — Jorge Santana · Diseño de interiores en Aguascalientes',
    skip: 'Saltar al contenido', menu: 'Menú',
    'nav.studio': 'Estudio', 'nav.services': 'Servicios', 'nav.projects': 'Proyectos', 'nav.process': 'Proceso', 'nav.contact': 'Contacto',
    'tagline.short': 'Residencial • Comercial • Paisajismo',
    'fallback.alt': 'Fachada Blanca — render de Jorge Santana',
    'part.roof': 'Cubierta', 'part.pergola': 'Pérgola', 'part.walls': 'Muros', 'part.arch': 'Arco', 'part.base': 'Plataforma',
    'hero.meta': 'Estudio de diseño de interiores',
    'hero.l1': 'Espacios', 'hero.l2': 'funcionales y', 'hero.l3': '<em>atemporales.</em>',
    'hero.lede': 'Jorge Santana diseña y visualiza en 3D espacios residenciales, comerciales y de paisaje.',
    'hero.cue': 'Desplaza · gira la maqueta',
    'x.label': 'La maqueta',
    'x.text': 'Cada espacio se construye <em>por capas</em>: estructura, luz y material.',
    'x.end': 'Y vuelve a ser <em>uno solo</em>.',
    'studio.statement': 'Js Interiorismo es el estudio de <strong>Jorge Santana</strong>, licenciado en Diseño de Interiores. Desde Aguascalientes, México, diseña espacios <em>funcionales y atemporales</em>: casas, comercios y los jardines que los rodean.',
    'studio.imgalt': 'Fachada Blanca — render de Jorge Santana',
    'disc.1': 'Residencial', 'disc.2': 'Comercial', 'disc.3': 'Paisajismo', 'disc.4': 'Visualización 3D',
    'fact.1': 'Licenciado en Diseño de Interiores', 'fact.2': 'Sus propios renders fotorrealistas',
    'fact.3': 'Participante con un baño y una cocina', 'fact.4': 'Portafolio público desde 2013',
    'studio.quote': '“Espacios que no buscan impresionar. <em>Buscan permanecer.</em>”', 'studio.quoteby': '— Jorge Santana, en Instagram',
    'mats.label': 'Materiales', 'mats.title': 'Una paleta que <em>se toca.</em>',
    'mats.lede': 'Los materiales que se repiten en su trabajo: maderas cálidas, piedra, acabados minerales y un verde salvia.',
    'mats.note': 'Texturas dibujadas con código, como muestra de la paleta.',
    'sw.1': 'Roble', 'sw.1s': 'Madera clara', 'sw.2': 'Nogal', 'sw.2s': 'Madera oscura', 'sw.3': 'Travertino', 'sw.3s': 'Piedra natural',
    'sw.4': 'Microcemento', 'sw.4s': 'Acabado continuo', 'sw.5': 'Chukum', 'sw.5s': 'Estuco maya', 'sw.6': 'Salvia', 'sw.6s': 'Laca mate',
    'srv.title': 'Del primer trazo <em>al último detalle.</em>',
    'srv.1': 'Diseño interior residencial', 'srv.1d': 'Recámaras, baños, cocinas y estancias pensados para la vida diaria: primero la función, después una belleza que dura.',
    'srv.2': 'Espacios comerciales', 'srv.2d': 'Cafeterías y locales con identidad propia, donde la luz y los materiales trabajan para la marca.',
    'srv.3': 'Paisajismo y fachadas', 'srv.3d': 'Patios, jardines y fachadas que unen la arquitectura con el paisaje mexicano.',
    'srv.4': 'Visualización 3D fotorrealista', 'srv.4d': 'Renders en 3ds Max y V-Ray para ver cada material y cada luz antes de construir.',
    'srv.5': 'Mobiliario a medida', 'srv.5d': 'Closets, tocadores y vestidores diseñados a la medida, con iluminación integrada.',
    'work.title': 'Índice de <em>proyectos</em>',
    'work.lede': 'Dieciséis espacios diseñados y visualizados por Jorge Santana. Elige uno para verlo en grande.',
    'f.all': 'Todos', 'f.banos': 'Baños', 'f.cocinas': 'Cocinas', 'f.recamaras': 'Recámaras', 'f.comercial': 'Comercial', 'f.exterior': 'Exterior',
    'proc.title': 'Cinco pasos, <em>un mismo cuidado.</em>', 'proc.badge': 'Propuesta de proceso · por confirmar con el estudio',
    'st.1': 'Escucha', 'st.1d': 'Visita, medidas y una conversación sobre cómo vives o trabajas el espacio.',
    'st.2': 'Concepto', 'st.2d': 'Distribución, paleta de materiales y la idea que guía todo el proyecto.',
    'st.3': 'Visualización 3D', 'st.3d': 'Renders fotorrealistas para decidir con certeza antes de construir.',
    'st.4': 'Proyecto ejecutivo', 'st.4d': 'Planos, detalles y mobiliario a medida, listos para obra.',
    'st.5': 'Ejecución', 'st.5d': 'Fabricación y supervisión hasta la entrega del espacio.',
    'ct.title': 'Hablemos de <em>tu espacio.</em>',
    'ct.wa': '[WhatsApp del estudio]', 'ct.mail.l': 'Correo', 'ct.mail': '[Correo del estudio]', 'ct.place.l': 'Estudio',
    'ct.phnote': 'Los datos entre corchetes se completan con el estudio.',
    'f.kind': 'Tipo de proyecto', 'f.k1': 'Residencial', 'f.k2': 'Comercial', 'f.k3': 'Paisajismo', 'f.k4': 'Render 3D',
    'f.name': 'Nombre', 'f.name.ph': 'Tu nombre', 'f.msg': 'Mensaje', 'f.msg.ph': 'Cuéntanos sobre el espacio',
    'f.send': 'Enviar', 'f.demo': 'Formulario de demostración: no envía datos.',
    'f.sent': 'Gracias. Esta es una demostración: el mensaje no se envió.',
    'ft.renders': 'Renders © Jorge Santana / Js Interiorismo', 'ft.visual': 'Maqueta y texturas generadas por código · sin imágenes IA',
    'ft.concept': 'Propuesta conceptual · v2 Galería blanca', 'ft.top': 'Volver arriba ↑',
    'lb.close': 'Cerrar', 'lb.src': 'Ver publicación original', 'lb.nextp': 'Siguiente proyecto', 'cursor.view': 'Ver',
    'aria.lang': 'Cambiar idioma / Change language'
  },
  en: {
    'doc.title': 'Js Interiorismo — Jorge Santana · Interior design in Aguascalientes',
    skip: 'Skip to content', menu: 'Menu',
    'nav.studio': 'Studio', 'nav.services': 'Services', 'nav.projects': 'Projects', 'nav.process': 'Process', 'nav.contact': 'Contact',
    'tagline.short': 'Residential • Commercial • Landscape',
    'fallback.alt': 'White Façade — render by Jorge Santana',
    'part.roof': 'Roof', 'part.pergola': 'Pergola', 'part.walls': 'Walls', 'part.arch': 'Arch', 'part.base': 'Platform',
    'hero.meta': 'Interior design studio',
    'hero.l1': 'Functional,', 'hero.l2': 'timeless', 'hero.l3': '<em>spaces.</em>',
    'hero.lede': 'Jorge Santana designs and visualises residential, commercial and landscape spaces in 3D.',
    'hero.cue': 'Scroll · turn the model',
    'x.label': 'The model',
    'x.text': 'Every space is built <em>in layers</em>: structure, light and material.',
    'x.end': 'And becomes <em>one</em> again.',
    'studio.statement': 'Js Interiorismo is the studio of <strong>Jorge Santana</strong>, a graduate in Interior Design. From Aguascalientes, Mexico, he designs <em>functional, timeless</em> spaces: homes, shops and the gardens around them.',
    'studio.imgalt': 'White Façade — render by Jorge Santana',
    'disc.1': 'Residential', 'disc.2': 'Commercial', 'disc.3': 'Landscape', 'disc.4': '3D visualisation',
    'fact.1': 'Graduate in Interior Design', 'fact.2': 'His own photoreal renders',
    'fact.3': 'Entrant with a bathroom and a kitchen', 'fact.4': 'Public portfolio since 2013',
    'studio.quote': '“Spaces that don’t try to impress. <em>They aim to last.</em>”', 'studio.quoteby': '— Jorge Santana, on Instagram',
    'mats.label': 'Materials', 'mats.title': 'A palette you <em>can touch.</em>',
    'mats.lede': 'The materials that recur in his work: warm woods, stone, mineral finishes and a sage green.',
    'mats.note': 'Textures drawn in code, as a sample of the palette.',
    'sw.1': 'Oak', 'sw.1s': 'Light wood', 'sw.2': 'Walnut', 'sw.2s': 'Dark wood', 'sw.3': 'Travertine', 'sw.3s': 'Natural stone',
    'sw.4': 'Microcement', 'sw.4s': 'Seamless finish', 'sw.5': 'Chukum', 'sw.5s': 'Mayan plaster', 'sw.6': 'Sage', 'sw.6s': 'Matte lacquer',
    'srv.title': 'From the first line <em>to the last detail.</em>',
    'srv.1': 'Residential interiors', 'srv.1d': 'Bedrooms, bathrooms, kitchens and living spaces made for everyday life: function first, then a beauty that lasts.',
    'srv.2': 'Commercial spaces', 'srv.2d': 'Cafés and shops with their own identity, where light and materials work for the brand.',
    'srv.3': 'Landscape & façades', 'srv.3d': 'Patios, gardens and façades that join architecture with the Mexican landscape.',
    'srv.4': 'Photoreal 3D visualisation', 'srv.4d': 'Renders in 3ds Max and V-Ray to see every material and every light before building.',
    'srv.5': 'Bespoke furniture', 'srv.5d': 'Made-to-measure closets, dressing tables and walk-in wardrobes with integrated lighting.',
    'work.title': 'Project <em>index</em>',
    'work.lede': 'Sixteen spaces designed and visualised by Jorge Santana. Pick one to see it large.',
    'f.all': 'All', 'f.banos': 'Bathrooms', 'f.cocinas': 'Kitchens', 'f.recamaras': 'Bedrooms', 'f.comercial': 'Commercial', 'f.exterior': 'Exterior',
    'proc.title': 'Five steps, <em>one standard of care.</em>', 'proc.badge': 'Proposed process · to be confirmed with the studio',
    'st.1': 'Listen', 'st.1d': 'A visit, measurements and a conversation about how you live or work in the space.',
    'st.2': 'Concept', 'st.2d': 'Layout, material palette and the idea that guides the whole project.',
    'st.3': '3D visualisation', 'st.3d': 'Photoreal renders so you can decide with certainty before building.',
    'st.4': 'Construction set', 'st.4d': 'Drawings, details and bespoke furniture, ready for site.',
    'st.5': 'Delivery', 'st.5d': 'Fabrication and supervision until the space is handed over.',
    'ct.title': 'Let’s talk about <em>your space.</em>',
    'ct.wa': '[Studio WhatsApp]', 'ct.mail.l': 'Email', 'ct.mail': '[Studio email]', 'ct.place.l': 'Studio',
    'ct.phnote': 'Details in brackets will be completed with the studio.',
    'f.kind': 'Project type', 'f.k1': 'Residential', 'f.k2': 'Commercial', 'f.k3': 'Landscape', 'f.k4': '3D render',
    'f.name': 'Name', 'f.name.ph': 'Your name', 'f.msg': 'Message', 'f.msg.ph': 'Tell us about the space',
    'f.send': 'Send', 'f.demo': 'Demo form: no data is sent.',
    'f.sent': 'Thank you. This is a demo: the message was not sent.',
    'ft.renders': 'Renders © Jorge Santana / Js Interiorismo', 'ft.visual': 'Model and textures generated in code · no AI images',
    'ft.concept': 'Concept proposal · v2 White gallery', 'ft.top': 'Back to top ↑',
    'lb.close': 'Close', 'lb.src': 'View original post', 'lb.nextp': 'Next project', 'cursor.view': 'View',
    'aria.lang': 'Change language / Cambiar idioma'
  }
};

const KEY = 'js-v2-lang';
let current = 'es';
const listeners = new Set();

/* What: read the saved language (or Spanish by default).
   In: nothing. Out: 'es' | 'en' */
export function savedLang() {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'en' ? 'en' : 'es';
  } catch (e) { return 'es'; } // storage blocked (private mode) → default
}

/* What: translate one key in the current language.
   In: key string. Out: string (falls back to Spanish, then the key) */
export function t(key) {
  return (DICT[current] && DICT[current][key]) || DICT.es[key] || key;
}

/* What: current language code. In: nothing. Out: 'es' | 'en' */
export function lang() { return current; }

/* What: subscribe to language changes (projects re-render on change).
   In: callback(lang). Out: nothing */
export function onLang(fn) { listeners.add(fn); }

/* What: apply a language to every tagged node, <html lang>, title and toggle.
   In: 'es' | 'en'. Out: nothing (DOM updated, choice persisted) */
export function applyLang(code) {
  current = code === 'en' ? 'en' : 'es';
  const root = document.documentElement;
  root.lang = current === 'en' ? 'en' : 'es-MX';
  document.title = t('doc.title');
  // plain text nodes
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  // nodes that carry an <em>/<strong> accent
  document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  // placeholders and alt texts
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.setAttribute('placeholder', t(el.dataset.i18nPh)); });
  document.querySelectorAll('[data-i18n-alt]').forEach((el) => { el.setAttribute('alt', t(el.dataset.i18nAlt)); });
  // toggle state
  document.querySelectorAll('[data-lang-toggle] [data-l]').forEach((s) => s.classList.toggle('is-on', s.dataset.l === current));
  document.querySelectorAll('[data-lang-toggle]').forEach((b) => b.setAttribute('aria-label', t('aria.lang')));
  try { localStorage.setItem(KEY, current); } catch (e) { /* storage blocked: choice lasts this visit only */ }
  listeners.forEach((fn) => fn(current));
}

/* What: wire the ES/EN toggle buttons.
   In: nothing. Out: nothing */
export function initLang() {
  applyLang(savedLang());
  document.querySelectorAll('[data-lang-toggle]').forEach((b) => {
    b.addEventListener('click', () => applyLang(current === 'es' ? 'en' : 'es'));
  });
}
