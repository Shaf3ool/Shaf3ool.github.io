/* =========================================================================
   data.js — the ONE Demo project shown in the app
   Everything here is Demo data: the project, the dates, the status lines and
   the progress numbers are invented for the prototype. The photos are Jorge
   Santana's real renders (© Js Interiorismo) used as stand-ins for site photos.
   ========================================================================= */

// --- phases, in order (Diseño → Compras → Obra → Acabados → Entrega) -------
export const PHASES = ['diseno', 'compras', 'obra', 'acabados', 'entrega'];

// --- project summary ---------------------------------------------------------
// state per phase: 'done' | 'now' | 'next'; pct is the overall progress
export const PROJECT = {
  name: { es: 'Casa Encino', en: 'Casa Encino' },
  scope: { es: 'Remodelación integral · Aguascalientes', en: 'Full remodel · Aguascalientes' },
  pct: 64,
  phase: 'obra',
  phaseState: { diseno: 'done', compras: 'done', obra: 'now', acabados: 'next', entrega: 'next' },
  phaseDates: {
    diseno:   '2026-09-22',
    compras:  '2026-10-21',
    obra:     '2026-11-14',
    acabados: '2026-12-05',
    entrega:  '2026-12-18'
  },
  start: '2026-09-10',
  delivery: '2026-12-18'
};

// --- helper to build an image record from a kit file name -------------------
/**
 * What: describe one of Jorge's renders as a responsive image.
 * In:  name (string) — file stem in img/, e.g. "loft-1"; ratio (number) — w/h
 * Out: { src, sm, ratio }
 */
function img(name, ratio = 1) {
  return { src: `img/${name}.webp`, sm: `img/${name}-sm.webp`, ratio };
}

// --- the Avances feed (newest first after sorting in feed.js) ---------------
// Each update: id, date (ISO), phase, title/text/next (ES + EN), photos
export const UPDATES = [
  {
    id: 'muros', date: '2026-10-24', phase: 'obra', isNew: true,
    title: { es: 'Se están instalando los muros', en: 'The walls are going up' },
    text: {
      es: 'Arrancamos los muros divisorios de la recámara y el vestidor. Ya quedaron trazados los vanos en arco y mañana seguimos con el aplanado.',
      en: 'We started the partition walls of the bedroom and walk-in closet. The arched openings are laid out; plastering continues tomorrow.'
    },
    next: { es: 'Aplanado de muros y canalización eléctrica', en: 'Wall plastering and electrical conduit' },
    photos: [img('loft-1', 0.8), img('loft-2', 0.8), img('recamara-1')]
  },
  {
    id: 'bano', date: '2026-10-21', phase: 'compras',
    title: { es: 'Llegaron los acabados del baño', en: 'The bathroom finishes arrived' },
    text: {
      es: 'Recibimos el chukum, la grifería negra y el lavabo de piedra. Todo se revisó pieza por pieza y quedó resguardado en obra.',
      en: 'The chukum, black fixtures and stone basin were delivered. Every piece was checked and stored safely on site.'
    },
    next: { es: 'Instalación en la etapa de Acabados', en: 'Installation during the Finishes phase' },
    photos: [img('bano-chukum-1'), img('bano-chukum-2'), img('bano-sereno-1')]
  },
  {
    id: 'porton', date: '2026-10-17', phase: 'obra',
    title: { es: 'Se instaló el portón', en: 'The front gate was installed' },
    text: {
      es: 'Quedó colocado el portón de la fachada, con herrería en negro mate. Falta el ajuste final del motor y la cerradura.',
      en: 'The façade gate is in place, with matte-black ironwork. The motor and lock still need their final adjustment.'
    },
    next: { es: 'Ajuste del motor y la cerradura', en: 'Motor and lock adjustment' },
    photos: [img('fachada-contemporanea-1'), img('fachada-blanca-1', 0.8), img('fachada-blanca-2', 0.8)]
  },
  {
    id: 'electrica', date: '2026-10-13', phase: 'obra',
    title: { es: 'Lista la instalación eléctrica de la cocina', en: 'Kitchen wiring is done' },
    text: {
      es: 'Contactos, salidas para la iluminación lineal LED y la campana ya están en su lugar, según el plano aprobado.',
      en: 'Outlets and the feeds for the linear LED lighting and the hood are in place, following the approved plan.'
    },
    next: { es: 'Colocación de muebles bajos', en: 'Fitting the base cabinets' },
    photos: [img('cocina-neutra-1'), img('cocina-neutra-2')]
  },
  {
    id: 'patio', date: '2026-10-08', phase: 'obra',
    title: { es: 'Se coló el firme del patio', en: 'The patio slab was poured' },
    text: {
      es: 'El firme del patio quedó nivelado con su pendiente hacia el drenaje. Se deja curar una semana antes de colocar el piso.',
      en: 'The patio slab is level and sloped toward the drain. It cures for a week before the flooring goes down.'
    },
    next: { es: 'Curado y colocación de piso exterior', en: 'Curing, then outdoor flooring' },
    photos: [img('patio-jacaranda-1'), img('patio-jacaranda-2')]
  },
  {
    id: 'cubierta', date: '2026-10-01', phase: 'compras',
    title: { es: 'Pedido confirmado: cubierta de travertino', en: 'Order confirmed: travertine countertop' },
    text: {
      es: 'El proveedor confirmó la cubierta de travertino para la isla de la cocina. Tiempo de entrega estimado: tres semanas.',
      en: 'The supplier confirmed the travertine countertop for the kitchen island. Estimated lead time: three weeks.'
    },
    next: { es: 'Entrega e instalación de la cubierta', en: 'Countertop delivery and fitting' },
    photos: [img('cocina-gilsa-1', 1.5), img('cocina-gilsa-2', 1.5)]
  },
  {
    id: 'renders', date: '2026-09-22', phase: 'diseno',
    title: { es: 'Renders finales aprobados', en: 'Final renders approved' },
    text: {
      es: 'Cerramos el diseño: recámara en roble y textiles cálidos, vestidor en verde salvia. Con esto arranca la etapa de compras.',
      en: 'Design is closed: an oak bedroom with warm textiles and a sage-green closet. Purchasing starts now.'
    },
    next: { es: 'Cotizaciones y pedidos de materiales', en: 'Quotes and material orders' },
    photos: [img('recamara-2'), img('vestidor-salvia-1'), img('vestidor-salvia-2')]
  },
  {
    id: 'inicio', date: '2026-09-10', phase: 'diseno',
    title: { es: 'Arrancamos: levantamiento y medidas', en: 'Kick-off: site survey and measurements' },
    text: {
      es: 'Visita a la casa para tomar medidas y fotos del estado actual. Con esto se hace el plano base del proyecto.',
      en: 'A visit to measure the house and photograph its current state. This becomes the base plan of the project.'
    },
    next: { es: 'Propuesta de distribución y primeros renders', en: 'Layout proposal and first renders' },
    photos: [img('fachada-casa-pequena-1', 0.8)]
  }
];
