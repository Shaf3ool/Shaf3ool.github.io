/* =========================================================================
   i18n.js — Spanish (Mexico) first, English second.
   Every visible string carries data-i18n="key"; this module swaps them.
   ========================================================================= */

export const STRINGS = {
  es: {
    'meta.title': 'Js Interiorismo — Jorge Santana · Diseño de interiores en Aguascalientes',
    'nav.studio': 'Estudio', 'nav.space': 'Espacio 3D', 'nav.projects': 'Proyectos', 'nav.process': 'Proceso', 'nav.contact': 'Contacto',
    'nav.cta': 'Agenda una cita', 'nav.menu': 'Menú', 'nav.close': 'Cerrar',
    'hero.eyebrow': 'Jorge Santana · Aguascalientes, México',
    'hero.title': 'Espacios funcionales<br><em>y atemporales.</em>',
    'hero.sub': 'Residencial · Comercial · Paisajismo',
    'hero.cta1': 'Ver proyectos', 'hero.cta2': 'Recorrer el espacio', 'hero.scroll': 'Desliza',
    'ch1.k': '01 — Luz', 'ch1.t': 'La luz no solo ilumina, también define el espacio.', 'ch1.s': 'Cada proyecto empieza por cómo entra el sol: orientación, sombras y reflejos.',
    'ch2.k': '02 — Materia', 'ch2.t': 'El verdadero lujo reside en los detalles.', 'ch2.s': 'Madera, piedra y texturas naturales en equilibrio: roble, nogal, travertino, chukum.',
    'ch3.k': '03 — Visualización', 'ch3.t': 'Lo ves antes de construirlo.', 'ch3.s': 'Cada espacio se diseña y se visualiza en 3D fotorrealista (3ds Max + V-Ray) antes de la obra.',
    'ch4.k': '04 — Tu espacio', 'ch4.t': 'Prueba los acabados.', 'ch4.s': 'Cambia piso, muros y tapiz en tiempo real. Arrastra para recorrer la sala.',
    'ch4.btn': 'Explorar en 3D',
    'cfg.floor': 'Piso', 'cfg.walls': 'Muros', 'cfg.fabric': 'Tapiz', 'cfg.hint': 'Arrastra para girar · pellizca para acercar', 'cfg.close': 'Cerrar', 'cfg.title': 'Configurador de acabados',
    'cfg.note': 'Escena 3D generada por código — ilustrativa, no es un proyecto real.',
    'studio.k': 'El estudio',
    'studio.t': 'Diseño de espacios <em>funcionales y atemporales.</em>',
    'studio.p1': 'Js Interiorismo es el estudio del diseñador de interiores Jorge Santana (L.D.I.) en Aguascalientes, México. Desarrolla proyectos residenciales, comerciales y de paisajismo con una estética cálida y contemporánea: maderas claras, piedra, luz indirecta y materiales que envejecen bien.',
    'studio.p2': 'Diseña cada espacio en 3D fotorrealista antes de construirlo, para que el cliente vea y decida con certeza: distribución, materiales, iluminación y mobiliario a medida.',
    'studio.f1': 'Seguidores en Instagram', 'studio.f2': 'Diseño y visualización 3D', 'studio.f3': 'Participante · Gilsa Render Awards 2024', 'studio.f4': 'Portafolio público desde',
    'studio.quote': '«Espacios que no buscan impresionar. Buscan permanecer.»', 'studio.quoteby': '— Jorge Santana',
    'serv.k': 'Servicios', 'serv.t': 'Del concepto <em>a la obra.</em>',
    's1.t': 'Interiorismo residencial', 's1.p': 'Casas y departamentos completos: salas, recámaras, baños, cocinas y vestidores.',
    's2.t': 'Interiorismo comercial', 's2.p': 'Cafeterías y espacios comerciales con identidad, pensados para la experiencia del cliente.',
    's3.t': 'Paisajismo y exteriores', 's3.p': 'Patios, terrazas y jardines con vegetación local: agave, cactus, jacaranda.',
    's4.t': 'Visualización 3D', 's4.p': 'Renders fotorrealistas en 3ds Max + V-Ray para decidir antes de construir.',
    's5.t': 'Mobiliario a medida', 's5.p': 'Closets, cocinas, tocadores y piezas especiales: diseño, fabricación y supervisión.',
    's6.t': 'Fachadas', 's6.p': 'Volúmenes sobrios, líneas puras y materiales naturales para la primera impresión.',
    'proj.k': 'Proyectos seleccionados', 'proj.t': 'Trabajo <em>reciente.</em>',
    'proj.all': 'Todos', 'proj.banos': 'Baños', 'proj.cocinas': 'Cocinas', 'proj.interiores': 'Interiores', 'proj.comercial': 'Comercial', 'proj.exteriores': 'Exteriores',
    'proj.view': 'Ver', 'proj.ig': 'Ver publicación en Instagram', 'proj.credit': 'Render © Jorge Santana',
    'proc.k': 'Proceso', 'proc.t': 'Cinco pasos, <em>sin sorpresas.</em>', 'proc.note': 'Propuesta de proceso para validar con el estudio.',
    'p1.t': 'Escucha', 'p1.p': 'Visita, levantamiento y conversación sobre cómo vives o trabajas el espacio.',
    'p2.t': 'Concepto', 'p2.p': 'Distribución, paleta de materiales y moodboard.',
    'p3.t': 'Visualización 3D', 'p3.p': 'Renders fotorrealistas para ajustar cada detalle antes de la obra.',
    'p4.t': 'Proyecto ejecutivo', 'p4.p': 'Planos, especificaciones y presupuesto claros.',
    'p5.t': 'Fabricación y supervisión', 'p5.p': 'Seguimiento de obra y mobiliario hasta la entrega.',
    'cont.k': 'Contacto', 'cont.t': 'Hablemos de <em>tu espacio.</em>',
    'cont.p': 'Cuéntanos qué quieres transformar. Respondemos con una propuesta de visita.',
    'cont.wa': 'WhatsApp', 'cont.mail': 'Correo', 'cont.where': 'Ubicación', 'cont.city': 'Aguascalientes, México',
    'cont.ph.wa': '[WhatsApp del estudio]', 'cont.ph.mail': '[correo del estudio]',
    'form.name': 'Nombre', 'form.type': 'Tipo de proyecto', 'form.msg': 'Mensaje', 'form.send': 'Enviar solicitud',
    'form.o1': 'Residencial', 'form.o2': 'Comercial', 'form.o3': 'Paisajismo', 'form.o4': 'Visualización 3D',
    'form.demo': 'Demostración: este formulario aún no está conectado. Escribe por Instagram mientras tanto.',
    'foot.rights': 'Js Interiorismo · Jorge Santana · Aguascalientes, México',
    'foot.credit': 'Renders y fotografías © Jorge Santana / Js Interiorismo. Escena 3D generada por código (procedural) · sin imágenes generadas por IA.',
    'foot.concept': 'Concept by Shaf3ool', 'foot.top': 'Volver arriba',
    'webgl.fallback': 'Tu navegador no permite 3D; mostramos un render del estudio.',
  },
  en: {
    'meta.title': 'Js Interiorismo — Jorge Santana · Interior design in Aguascalientes, Mexico',
    'nav.studio': 'Studio', 'nav.space': '3D Space', 'nav.projects': 'Projects', 'nav.process': 'Process', 'nav.contact': 'Contact',
    'nav.cta': 'Book a visit', 'nav.menu': 'Menu', 'nav.close': 'Close',
    'hero.eyebrow': 'Jorge Santana · Aguascalientes, Mexico',
    'hero.title': 'Functional,<br><em>timeless spaces.</em>',
    'hero.sub': 'Residential · Commercial · Landscape',
    'hero.cta1': 'View projects', 'hero.cta2': 'Walk the space', 'hero.scroll': 'Scroll',
    'ch1.k': '01 — Light', 'ch1.t': 'Light doesn’t just illuminate — it defines the space.', 'ch1.s': 'Every project starts with how the sun comes in: orientation, shadows, reflections.',
    'ch2.k': '02 — Matter', 'ch2.t': 'True luxury lives in the details.', 'ch2.s': 'Wood, stone and natural textures in balance: oak, walnut, travertine, chukum.',
    'ch3.k': '03 — Visualisation', 'ch3.t': 'See it before it’s built.', 'ch3.s': 'Every space is designed and visualised in photoreal 3D (3ds Max + V-Ray) before construction.',
    'ch4.k': '04 — Your space', 'ch4.t': 'Try the finishes.', 'ch4.s': 'Change floor, walls and upholstery in real time. Drag to walk around the room.',
    'ch4.btn': 'Explore in 3D',
    'cfg.floor': 'Floor', 'cfg.walls': 'Walls', 'cfg.fabric': 'Upholstery', 'cfg.hint': 'Drag to orbit · pinch to zoom', 'cfg.close': 'Close', 'cfg.title': 'Finish configurator',
    'cfg.note': 'Code-generated 3D scene — illustrative, not a real project.',
    'studio.k': 'The studio',
    'studio.t': 'Designing <em>functional, timeless spaces.</em>',
    'studio.p1': 'Js Interiorismo is the studio of interior designer Jorge Santana in Aguascalientes, Mexico. He designs residential, commercial and landscape projects with a warm, contemporary language: light woods, stone, indirect light and materials that age well.',
    'studio.p2': 'Every space is designed in photoreal 3D before it is built, so clients can see and decide with certainty: layout, materials, lighting and bespoke furniture.',
    'studio.f1': 'Instagram followers', 'studio.f2': 'Design & 3D visualisation', 'studio.f3': 'Entrant · Gilsa Render Awards 2024', 'studio.f4': 'Public portfolio since',
    'studio.quote': '“Spaces that don’t try to impress. They’re made to last.”', 'studio.quoteby': '— Jorge Santana',
    'serv.k': 'Services', 'serv.t': 'From concept <em>to completion.</em>',
    's1.t': 'Residential interiors', 's1.p': 'Whole homes and apartments: living rooms, bedrooms, bathrooms, kitchens and closets.',
    's2.t': 'Commercial interiors', 's2.p': 'Cafés and commercial spaces with identity, designed around the guest experience.',
    's3.t': 'Landscape & outdoors', 's3.p': 'Courtyards, terraces and gardens with local plants: agave, cactus, jacaranda.',
    's4.t': '3D visualisation', 's4.p': 'Photoreal renders in 3ds Max + V-Ray to decide before building.',
    's5.t': 'Bespoke furniture', 's5.p': 'Closets, kitchens, vanities and special pieces: design, making and supervision.',
    's6.t': 'Façades', 's6.p': 'Sober volumes, pure lines and natural materials for a first impression.',
    'proj.k': 'Selected projects', 'proj.t': 'Recent <em>work.</em>',
    'proj.all': 'All', 'proj.banos': 'Bathrooms', 'proj.cocinas': 'Kitchens', 'proj.interiores': 'Interiors', 'proj.comercial': 'Commercial', 'proj.exteriores': 'Outdoors',
    'proj.view': 'View', 'proj.ig': 'See the post on Instagram', 'proj.credit': 'Render © Jorge Santana',
    'proc.k': 'Process', 'proc.t': 'Five steps, <em>no surprises.</em>', 'proc.note': 'Proposed process, to be confirmed with the studio.',
    'p1.t': 'Listen', 'p1.p': 'Site visit, survey and a conversation about how you live or work in the space.',
    'p2.t': 'Concept', 'p2.p': 'Layout, material palette and moodboard.',
    'p3.t': '3D visualisation', 'p3.p': 'Photoreal renders to fine-tune every detail before work starts.',
    'p4.t': 'Construction documents', 'p4.p': 'Clear drawings, specifications and budget.',
    'p5.t': 'Making & supervision', 'p5.p': 'Site and furniture follow-up through to handover.',
    'cont.k': 'Contact', 'cont.t': 'Let’s talk about <em>your space.</em>',
    'cont.p': 'Tell us what you want to transform. We reply with a proposal for a visit.',
    'cont.wa': 'WhatsApp', 'cont.mail': 'Email', 'cont.where': 'Location', 'cont.city': 'Aguascalientes, Mexico',
    'cont.ph.wa': '[studio WhatsApp]', 'cont.ph.mail': '[studio email]',
    'form.name': 'Name', 'form.type': 'Project type', 'form.msg': 'Message', 'form.send': 'Send request',
    'form.o1': 'Residential', 'form.o2': 'Commercial', 'form.o3': 'Landscape', 'form.o4': '3D visualisation',
    'form.demo': 'Demo: this form is not connected yet. Please write on Instagram for now.',
    'foot.rights': 'Js Interiorismo · Jorge Santana · Aguascalientes, Mexico',
    'foot.credit': 'Renders and photos © Jorge Santana / Js Interiorismo. Code-generated (procedural) 3D scene · no AI-generated images.',
    'foot.concept': 'Concept by Shaf3ool', 'foot.top': 'Back to top',
    'webgl.fallback': 'Your browser can’t show 3D; here is a studio render instead.',
  },
};

let lang = 'es';
const listeners = new Set();

/* -------------------------------------------------------------------------
   t
   What: translate one key in the active language.
   In:   key (string)
   Out:  string (falls back to Spanish, then to the key)
   ------------------------------------------------------------------------- */
export function t(key) {
  return STRINGS[lang][key] ?? STRINGS.es[key] ?? key;
}

/* -------------------------------------------------------------------------
   getLang
   What: the active language code.
   In:   nothing
   Out:  'es' | 'en'
   ------------------------------------------------------------------------- */
export function getLang() { return lang; }

/* -------------------------------------------------------------------------
   onLang
   What: subscribe to language changes (e.g. to re-render project cards).
   In:   fn (callback receiving the new code)
   Out:  nothing
   ------------------------------------------------------------------------- */
export function onLang(fn) { listeners.add(fn); }

/* -------------------------------------------------------------------------
   applyLang
   What: write every data-i18n / data-i18n-attr string into the DOM, update
         <html lang>, the title and the toggle; remember the choice.
   In:   code ('es' | 'en')
   Out:  nothing
   ------------------------------------------------------------------------- */
export function applyLang(code) {
  lang = code === 'en' ? 'en' : 'es';
  document.documentElement.lang = lang === 'es' ? 'es-MX' : 'en';
  document.title = t('meta.title');
  // innerHTML is used because a few strings carry <em>/<br> (our own copy only)
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.innerHTML = t(el.dataset.i18n); });
  // attributes, written as data-i18n-attr="aria-label:key;placeholder:key2"
  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(';').forEach((pair) => {
      const [attr, key] = pair.split(':');
      if (attr && key) el.setAttribute(attr.trim(), t(key.trim()));
    });
  });
  document.querySelectorAll('[data-lang-btn]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.langBtn === lang)));
  try { localStorage.setItem('js-lang', lang); } catch (e) { /* private mode: ignore */ }
  listeners.forEach((fn) => fn(lang));
}

/* -------------------------------------------------------------------------
   initialLang
   What: saved choice, else the browser language (English only if it starts
         with "en"), else Spanish.
   In:   nothing
   Out:  'es' | 'en'
   ------------------------------------------------------------------------- */
export function initialLang() {
  let saved = null;
  try { saved = localStorage.getItem('js-lang'); } catch (e) { saved = null; }
  if (saved === 'es' || saved === 'en') return saved;
  return 'es';
}
