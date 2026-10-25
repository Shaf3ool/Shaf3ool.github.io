/* =========================================================================
   i18n.js — Spanish (Mexico) primary + English toggle
   All visible strings live here. Language persists in localStorage and
   updates <html lang>. Elements with data-i18n="key" are refreshed by apply().
   ========================================================================= */

// --- Dictionary -------------------------------------------------------------
const DICT = {
  es: {
    // desktop side panel
    'side.kicker': 'Js Interiorismo · Concepto de app',
    'side.title': 'Diseña tu <em>espacio</em>',
    'side.text': 'Planea tu habitación en 2D, mírala en 3D en vivo, elige acabados de la paleta de Jorge Santana y envíale tu diseño para revisión.',
    'side.open': 'Ábrelo en tu teléfono',
    'side.honest': 'Prototipo web instalable (PWA) — no es una app de App Store ni Google Play. Datos de ejemplo marcados como Demo.',
    'side.credit': 'Concept by Shaf3ool · Renders © Jorge Santana / Js Interiorismo',
    // onboarding
    'ob.skip': 'Omitir',
    'ob.next': 'Siguiente',
    'ob.start': 'Comenzar',
    'ob.1.t': 'Diseña tu <em>espacio</em>',
    'ob.1.p': 'Dibuja tu habitación en 2D y mírala en 3D al instante, con tus dedos.',
    'ob.2.t': 'Acabados de <em>autor</em>',
    'ob.2.p': 'Roble, nogal, travertino, microcemento, chukum y terracota: materiales cálidos, atemporales.',
    'ob.3.t': 'Revisado por <em>Jorge</em>',
    'ob.3.p': 'Cuando te guste, envía tu diseño a Jorge Santana para que lo revise.',
    'ob.note': 'Prototipo web · Renders © Jorge Santana',
    // tabs
    'tab.inspo': 'Inspiración',
    'tab.designs': 'Mis diseños',
    'tab.new': 'Diseñar',
    'tab.agenda': 'Agenda',
    'tab.studio': 'Estudio',
    // inspiration
    'in.hello': 'Hola',
    'in.title': 'Diseña tu <em>espacio</em>',
    'in.cta.t': 'Empieza un diseño',
    'in.cta.p': 'Plano 2D + vista 3D en vivo',
    'in.section': 'Proyectos de Jorge',
    'in.count': '16 proyectos reales',
    'in.board': 'Tablero',
    'in.saved': 'Guardado en tu tablero',
    'in.unsaved': 'Quitado del tablero',
    'grp.todo': 'Todo', 'grp.bano': 'Baños', 'grp.cocina': 'Cocinas', 'grp.habitar': 'Habitar', 'grp.comercial': 'Comercial', 'grp.exterior': 'Exterior',
    'pr.palette': 'Paleta sugerida para este estilo',
    'pr.use': 'Diseñar con esta paleta',
    'pr.save': 'Guardar',
    'pr.saved': 'Guardado',
    'pr.credit': 'Render © Jorge Santana / Js Interiorismo',
    // new design sheet
    'nd.title': 'Nuevo diseño',
    'nd.sub': 'Elige un punto de partida. Puedes cambiarlo todo.',
    'tpl.sala': 'Sala', 'tpl.recamara': 'Recámara', 'tpl.cocina': 'Cocina', 'tpl.blanco': 'En blanco',
    'tpl.sala.p': 'Sofá, tapete, mesa', 'tpl.recamara.p': 'Cama, closet, tapete', 'tpl.cocina.p': 'Isla, mesa, planta', 'tpl.blanco.p': 'Solo la habitación',
    // planner
    'pl.view2d': '2D', 'pl.view3d': '3D', 'pl.split': 'Dividir',
    'pl.furniture': 'Muebles', 'pl.finishes': 'Acabados', 'pl.room': 'Habitación',
    'pl.floor': 'Piso', 'pl.wall': 'Muro',
    'pl.width': 'Ancho', 'pl.depth': 'Largo',
    'pl.ar': 'Ver en tu espacio',
    'pl.save': 'Guardar',
    'pl.rotate': 'Girar', 'pl.dup': 'Duplicar', 'pl.del': 'Quitar',
    'pl.hint': 'Arrastra para mover · gira con el punto',
    'pl.hint3d': 'Arrastra para orbitar · pellizca para acercar',
    'pl.added': 'añadido',
    'pl.nowebgl': 'Tu navegador no muestra 3D. El plano 2D sigue funcionando.',
    'pl.untitled': 'Mi diseño',
    'pl.saved': 'Diseño guardado',
    'pl.area': 'm²',
    // furniture names
    'f.sofa': 'Sofá', 'f.mesa': 'Mesa', 'f.cama': 'Cama', 'f.closet': 'Closet', 'f.isla': 'Isla de cocina', 'f.planta': 'Planta', 'f.tapete': 'Tapete',
    // finishes
    'fin.roble': 'Roble', 'fin.nogal': 'Nogal', 'fin.travertino': 'Travertino', 'fin.microcemento': 'Microcemento', 'fin.chukum': 'Chukum', 'fin.terracota': 'Terracota',
    // send sheet
    'snd.title': 'Enviar a Jorge para revisión',
    'snd.sub': 'Jorge recibiría tu plano, la vista 3D y los acabados elegidos.',
    'snd.name': 'Nombre del diseño',
    'snd.note': 'Nota para Jorge (opcional)',
    'snd.note.ph': 'Ej. Me gustaría más luz natural…',
    'snd.btn': 'Enviar a Jorge · Demo',
    'snd.later': 'Solo guardar',
    'snd.done.t': '¡Listo! (Demo)',
    'snd.done.p': 'En la app real, Jorge recibiría tu diseño para revisión. En este prototipo no se envió nada.',
    'snd.done.btn': 'Ver mis diseños',
    // AR
    'ar.title': 'Ver en tu espacio',
    'ar.live': 'Cámara en vivo',
    'ar.fallback': 'Sin cámara · vista previa sobre un render de Jorge',
    'ar.hint': 'Arrastra para mover · pellizca para escalar',
    'ar.close': 'Cerrar',
    'ar.rotate': 'Girar',
    'ar.capture': 'Capturar',
    'ar.captured': 'Captura lista (Demo)',
    'ar.note': 'Vista tipo AR en el navegador · no mide tu espacio real',
    'ar.start': 'Activar cámara',
    'ar.preview': 'Usar vista previa',
    'ar.ask': 'Para ver la pieza en tu espacio, la app usa tu cámara. Nada se graba ni se envía.',
    // designs
    'ds.title': 'Mis <em>diseños</em>',
    'ds.sub': 'Se guardan en este teléfono',
    'ds.empty': 'Aún no tienes diseños.',
    'ds.board': 'Tablero de inspiración',
    'ds.board.empty': 'Toca ♡ en un proyecto de Jorge para guardarlo aquí.',
    'ds.status.draft': 'Borrador',
    'ds.status.review': 'En revisión',
    'ds.open': 'Abrir',
    'ds.pieces': 'piezas',
    'ds.demo': 'Demo',
    'ds.tl.sent': 'Enviado a Jorge',
    'ds.tl.review': 'Jorge revisa tu diseño',
    'ds.tl.proposal': 'Propuesta y cotización',
    'ds.delete': 'Eliminar',
    'ds.deleted': 'Diseño eliminado',
    // agenda
    'ag.title': 'Agenda una <em>consulta</em>',
    'ag.sub': 'Calendario de ejemplo · Demo',
    'ag.type': 'Tipo de consulta',
    'ag.virtual': 'Videollamada', 'ag.virtual.p': '45 min',
    'ag.studio': 'En el estudio', 'ag.studio.p': 'Aguascalientes',
    'ag.site': 'En tu espacio', 'ag.site.p': 'Visita',
    'ag.times': 'Horarios disponibles (Demo)',
    'ag.confirm': 'Confirmar · Demo',
    'ag.pick': 'Elige día y hora',
    'ag.done.t': 'Consulta apartada (Demo)',
    'ag.done.p': 'En la app real, Jorge confirmaría tu cita. En este prototipo no se reservó nada.',
    'ag.cancel': 'Cancelar cita',
    'ag.yours': 'Tu cita · Demo',
    'ag.days': ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
    'ag.months': ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    // studio
    'st.title': 'Js <em>Interiorismo</em>',
    'st.role': 'L. DI Jorge Santana · Diseñador de interiores',
    'st.place': 'Aguascalientes, México',
    'st.bio': 'Diseño de espacios funcionales y atemporales.',
    'st.areas': 'Residencial • Comercial • Paisajismo',
    'st.what': 'Lo que hace',
    'st.s1.t': 'Interiorismo', 'st.s1.p': 'Ambientes habitacionales y comerciales.',
    'st.s2.t': 'Visualización 3D', 'st.s2.p': 'Renders fotorrealistas con 3ds Max + V-Ray.',
    'st.s3.t': 'Paisajismo', 'st.s3.p': 'Patios, jardines y fachadas.',
    'st.gilsa': 'Participó en los Gilsa Render Awards 2024 (baño y cocina).',
    'st.links': 'Encuéntralo en',
    'st.contact': 'Contacto',
    'st.ph.wa': '[WhatsApp del estudio]',
    'st.ph.mail': '[Correo del estudio]',
    'st.ph.addr': '[Dirección del estudio]',
    'st.ph.note': 'Datos por confirmar con el estudio',
    'st.settings': 'Ajustes',
    'st.lang': 'Idioma',
    'st.install': 'Instalar en tu teléfono',
    'st.install.p': 'iPhone: Compartir → “Agregar a inicio”. Android: menú → “Instalar app”.',
    'st.installed': 'Ya está instalada',
    'st.reset': 'Restablecer datos de ejemplo',
    'st.reset.done': 'Datos restablecidos',
    'st.about': 'Sobre este prototipo',
    'st.about.p': 'Prototipo web instalable (PWA) creado como propuesta para Js Interiorismo. No es una app de App Store ni Google Play. Diseños, citas y envíos son de demostración y se guardan solo en este dispositivo.',
    'st.visuals': 'Escenas 3D y texturas generadas por código · sin imágenes IA.',
    'st.credit': 'Concept by Shaf3ool',
    'st.renders': 'Renders © Jorge Santana / Js Interiorismo',
    'common.demo': 'Demo',
    'common.close': 'Cerrar',
    'common.offline': 'Lista para usarse sin conexión',
  },
  en: {
    'side.kicker': 'Js Interiorismo · App concept',
    'side.title': 'Design your <em>space</em>',
    'side.text': 'Plan your room in 2D, see it live in 3D, pick finishes from Jorge Santana’s palette and send your design to him for review.',
    'side.open': 'Open it on your phone',
    'side.honest': 'Installable web prototype (PWA) — not an App Store or Google Play app. Sample data is marked Demo.',
    'side.credit': 'Concept by Shaf3ool · Renders © Jorge Santana / Js Interiorismo',
    'ob.skip': 'Skip',
    'ob.next': 'Next',
    'ob.start': 'Get started',
    'ob.1.t': 'Design your <em>space</em>',
    'ob.1.p': 'Sketch your room in 2D and see it in 3D instantly, right under your fingers.',
    'ob.2.t': 'Signature <em>finishes</em>',
    'ob.2.p': 'Oak, walnut, travertine, microcement, chukum and terracotta: warm, timeless materials.',
    'ob.3.t': 'Reviewed by <em>Jorge</em>',
    'ob.3.p': 'When you love it, send your design to Jorge Santana for review.',
    'ob.note': 'Web prototype · Renders © Jorge Santana',
    'tab.inspo': 'Inspiration',
    'tab.designs': 'My designs',
    'tab.new': 'Design',
    'tab.agenda': 'Book',
    'tab.studio': 'Studio',
    'in.hello': 'Hello',
    'in.title': 'Design your <em>space</em>',
    'in.cta.t': 'Start a design',
    'in.cta.p': '2D plan + live 3D view',
    'in.section': 'Jorge’s projects',
    'in.count': '16 real projects',
    'in.board': 'Board',
    'in.saved': 'Saved to your board',
    'in.unsaved': 'Removed from board',
    'grp.todo': 'All', 'grp.bano': 'Baths', 'grp.cocina': 'Kitchens', 'grp.habitar': 'Living', 'grp.comercial': 'Commercial', 'grp.exterior': 'Outdoor',
    'pr.palette': 'Suggested palette for this style',
    'pr.use': 'Design with this palette',
    'pr.save': 'Save',
    'pr.saved': 'Saved',
    'pr.credit': 'Render © Jorge Santana / Js Interiorismo',
    'nd.title': 'New design',
    'nd.sub': 'Pick a starting point. You can change everything.',
    'tpl.sala': 'Living room', 'tpl.recamara': 'Bedroom', 'tpl.cocina': 'Kitchen', 'tpl.blanco': 'Blank',
    'tpl.sala.p': 'Sofa, rug, table', 'tpl.recamara.p': 'Bed, closet, rug', 'tpl.cocina.p': 'Island, table, plant', 'tpl.blanco.p': 'Just the room',
    'pl.view2d': '2D', 'pl.view3d': '3D', 'pl.split': 'Split',
    'pl.furniture': 'Furniture', 'pl.finishes': 'Finishes', 'pl.room': 'Room',
    'pl.floor': 'Floor', 'pl.wall': 'Wall',
    'pl.width': 'Width', 'pl.depth': 'Length',
    'pl.ar': 'View in your space',
    'pl.save': 'Save',
    'pl.rotate': 'Rotate', 'pl.dup': 'Duplicate', 'pl.del': 'Remove',
    'pl.hint': 'Drag to move · rotate with the dot',
    'pl.hint3d': 'Drag to orbit · pinch to zoom',
    'pl.added': 'added',
    'pl.nowebgl': 'Your browser can’t show 3D. The 2D plan still works.',
    'pl.untitled': 'My design',
    'pl.saved': 'Design saved',
    'pl.area': 'm²',
    'f.sofa': 'Sofa', 'f.mesa': 'Table', 'f.cama': 'Bed', 'f.closet': 'Closet', 'f.isla': 'Kitchen island', 'f.planta': 'Plant', 'f.tapete': 'Rug',
    'fin.roble': 'Oak', 'fin.nogal': 'Walnut', 'fin.travertino': 'Travertine', 'fin.microcemento': 'Microcement', 'fin.chukum': 'Chukum', 'fin.terracota': 'Terracotta',
    'snd.title': 'Send to Jorge for review',
    'snd.sub': 'Jorge would receive your plan, the 3D view and your chosen finishes.',
    'snd.name': 'Design name',
    'snd.note': 'Note for Jorge (optional)',
    'snd.note.ph': 'E.g. I’d love more natural light…',
    'snd.btn': 'Send to Jorge · Demo',
    'snd.later': 'Just save',
    'snd.done.t': 'Done! (Demo)',
    'snd.done.p': 'In the real app, Jorge would receive your design for review. Nothing was sent in this prototype.',
    'snd.done.btn': 'See my designs',
    'ar.title': 'View in your space',
    'ar.live': 'Live camera',
    'ar.fallback': 'No camera · preview over one of Jorge’s renders',
    'ar.hint': 'Drag to move · pinch to scale',
    'ar.close': 'Close',
    'ar.rotate': 'Rotate',
    'ar.capture': 'Capture',
    'ar.captured': 'Capture ready (Demo)',
    'ar.note': 'AR-style view in the browser · does not measure your real space',
    'ar.start': 'Turn on camera',
    'ar.preview': 'Use preview',
    'ar.ask': 'To place the piece in your space, the app uses your camera. Nothing is recorded or sent.',
    'ds.title': 'My <em>designs</em>',
    'ds.sub': 'Saved on this phone',
    'ds.empty': 'No designs yet.',
    'ds.board': 'Inspiration board',
    'ds.board.empty': 'Tap ♡ on one of Jorge’s projects to save it here.',
    'ds.status.draft': 'Draft',
    'ds.status.review': 'In review',
    'ds.open': 'Open',
    'ds.pieces': 'pieces',
    'ds.demo': 'Demo',
    'ds.tl.sent': 'Sent to Jorge',
    'ds.tl.review': 'Jorge reviews your design',
    'ds.tl.proposal': 'Proposal and quote',
    'ds.delete': 'Delete',
    'ds.deleted': 'Design deleted',
    'ag.title': 'Book a <em>consultation</em>',
    'ag.sub': 'Sample calendar · Demo',
    'ag.type': 'Consultation type',
    'ag.virtual': 'Video call', 'ag.virtual.p': '45 min',
    'ag.studio': 'At the studio', 'ag.studio.p': 'Aguascalientes',
    'ag.site': 'At your place', 'ag.site.p': 'Site visit',
    'ag.times': 'Available times (Demo)',
    'ag.confirm': 'Confirm · Demo',
    'ag.pick': 'Pick a day and time',
    'ag.done.t': 'Consultation held (Demo)',
    'ag.done.p': 'In the real app, Jorge would confirm your appointment. Nothing was booked in this prototype.',
    'ag.cancel': 'Cancel booking',
    'ag.yours': 'Your booking · Demo',
    'ag.days': ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    'ag.months': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    'st.title': 'Js <em>Interiorismo</em>',
    'st.role': 'Jorge Santana, L. DI · Interior designer',
    'st.place': 'Aguascalientes, Mexico',
    'st.bio': 'Design of functional, timeless spaces.',
    'st.areas': 'Residential • Commercial • Landscape',
    'st.what': 'What he does',
    'st.s1.t': 'Interior design', 'st.s1.p': 'Residential and commercial spaces.',
    'st.s2.t': '3D visualisation', 'st.s2.p': 'Photoreal renders with 3ds Max + V-Ray.',
    'st.s3.t': 'Landscape', 'st.s3.p': 'Courtyards, gardens and façades.',
    'st.gilsa': 'Entered the Gilsa Render Awards 2024 (bathroom and kitchen).',
    'st.links': 'Find him on',
    'st.contact': 'Contact',
    'st.ph.wa': '[Studio WhatsApp]',
    'st.ph.mail': '[Studio email]',
    'st.ph.addr': '[Studio address]',
    'st.ph.note': 'Details to be confirmed with the studio',
    'st.settings': 'Settings',
    'st.lang': 'Language',
    'st.install': 'Install on your phone',
    'st.install.p': 'iPhone: Share → “Add to Home Screen”. Android: menu → “Install app”.',
    'st.installed': 'Already installed',
    'st.reset': 'Reset demo data',
    'st.reset.done': 'Data reset',
    'st.about': 'About this prototype',
    'st.about.p': 'Installable web prototype (PWA) made as a proposal for Js Interiorismo. It is not an App Store or Google Play app. Designs, bookings and sends are demos and stay on this device only.',
    'st.visuals': '3D scenes and textures generated by code · no AI images.',
    'st.credit': 'Concept by Shaf3ool',
    'st.renders': 'Renders © Jorge Santana / Js Interiorismo',
    'common.demo': 'Demo',
    'common.close': 'Close',
    'common.offline': 'Ready to use offline',
  },
};

// --- Current language (persisted) ----------------------------------------
let lang = 'es';
try { lang = localStorage.getItem('jsapp2.lang') === 'en' ? 'en' : 'es'; } catch (e) { lang = 'es'; }
const listeners = new Set();

/**
 * What: translate a key in the current language.
 * In:  key (string)
 * Out: string (or array for list keys); the key itself if missing
 */
export function t(key) {
  const v = DICT[lang][key];
  return v === undefined ? (DICT.es[key] ?? key) : v;
}

/**
 * What: get the active language code.
 * In:  —
 * Out: 'es' | 'en'
 */
export function getLang() { return lang; }

/**
 * What: switch language, persist it, refresh static strings and notify screens.
 * In:  next ('es' | 'en')
 * Out: —
 */
export function setLang(next) {
  lang = next === 'en' ? 'en' : 'es';
  try { localStorage.setItem('jsapp2.lang', lang); } catch (e) { /* private mode */ }
  apply(document);
  // screens re-render their dynamic parts
  listeners.forEach((fn) => fn(lang));
}

/**
 * What: subscribe to language changes.
 * In:  fn (lang) => void
 * Out: unsubscribe function
 */
export function onLang(fn) { listeners.add(fn); return () => listeners.delete(fn); }

/**
 * What: fill every [data-i18n] (innerHTML) and [data-i18n-ph] (placeholder) under root.
 * In:  root (Element | Document)
 * Out: —
 */
export function apply(root) {
  document.documentElement.lang = lang === 'en' ? 'en' : 'es-MX';
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.innerHTML = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
}
