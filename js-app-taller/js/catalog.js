/* =========================================================================
   catalog.js: the Demo product catalogue Jorge "makes available" in the
   Taller, plus the finish swatches used as material fills.
   - All sizes are in cm and are typical market sizes (Demo, not his stock).
   - mount: floor items sit at z=0; wall/ceiling items can move vertically
     in the elevations (z = height of the base above the floor).
   ========================================================================= */

// --- material finishes (flat fills for the line drawing) -------------------
export const FINISHES = [
  { key: 'roble',      es: 'Roble',      en: 'Oak',        hex: '#C9A06F' },
  { key: 'nogal',      es: 'Nogal',      en: 'Walnut',     hex: '#7B5338' },
  { key: 'terracota',  es: 'Terracota',  en: 'Terracotta', hex: '#B8643E' },
  { key: 'olivo',      es: 'Olivo',      en: 'Olive',      hex: '#6E7656' },
  { key: 'lino',       es: 'Lino',       en: 'Linen',      hex: '#E4D9C6' },
  { key: 'travertino', es: 'Travertino', en: 'Travertine', hex: '#D6C6A8' },
  { key: 'grafito',    es: 'Grafito',    en: 'Graphite',   hex: '#3B342F' },
  { key: 'salvia',     es: 'Salvia',     en: 'Sage',       hex: '#A3AE8F' },
];

// --- catalogue (Demo) ------------------------------------------------------
// type is the symbol key used by symbols.js for plan + elevation drawings
export const CATALOG = [
  { type: 'sofa',     es: 'Sofá 3 plazas',      en: '3-seat sofa',      w: 220, d: 95,  h: 85,  mount: 'floor', color: '#E4D9C6' },
  { type: 'sillon',   es: 'Sillón',             en: 'Armchair',         w: 85,  d: 85,  h: 80,  mount: 'floor', color: '#A3AE8F' },
  { type: 'mesac',    es: 'Mesa de centro',     en: 'Coffee table',     w: 110, d: 60,  h: 40,  mount: 'floor', color: '#C9A06F' },
  { type: 'tapete',   es: 'Tapete',             en: 'Rug',              w: 240, d: 170, h: 1,   mount: 'floor', color: '#D6C6A8' },
  { type: 'cama',     es: 'Cama queen',         en: 'Queen bed',        w: 160, d: 210, h: 110, mount: 'floor', color: '#E4D9C6' },
  { type: 'buro',     es: 'Buró',               en: 'Nightstand',       w: 50,  d: 40,  h: 55,  mount: 'floor', color: '#7B5338' },
  { type: 'mesa',     es: 'Mesa de comedor',    en: 'Dining table',     w: 180, d: 90,  h: 76,  mount: 'floor', color: '#C9A06F' },
  { type: 'silla',    es: 'Silla',              en: 'Chair',            w: 46,  d: 52,  h: 85,  mount: 'floor', color: '#7B5338' },
  { type: 'closet',   es: 'Closet',             en: 'Wardrobe',         w: 240, d: 60,  h: 240, mount: 'floor', color: '#C9A06F' },
  { type: 'isla',     es: 'Isla de cocina',     en: 'Kitchen island',   w: 220, d: 100, h: 92,  mount: 'floor', color: '#D6C6A8' },
  { type: 'banco',    es: 'Banco alto',         en: 'Bar stool',        w: 40,  d: 40,  h: 75,  mount: 'floor', color: '#3B342F' },
  { type: 'librero',  es: 'Librero',            en: 'Bookcase',         w: 120, d: 35,  h: 200, mount: 'floor', color: '#7B5338' },
  { type: 'mueblet',  es: 'Mueble de TV',       en: 'TV console',       w: 180, d: 45,  h: 55,  mount: 'floor', color: '#7B5338' },
  { type: 'planta',   es: 'Planta en maceta',   en: 'Potted plant',     w: 50,  d: 50,  h: 150, mount: 'floor', color: '#6E7656' },
  { type: 'repisa',   es: 'Repisa flotante',    en: 'Floating shelf',   w: 120, d: 25,  h: 5,   mount: 'wall',  color: '#C9A06F', z: 150 },
  { type: 'cuadro',   es: 'Cuadro',             en: 'Artwork',          w: 90,  d: 4,   h: 60,  mount: 'wall',  color: '#B8643E', z: 140 },
  { type: 'lampara',  es: 'Lámpara colgante',   en: 'Pendant lamp',     w: 50,  d: 50,  h: 40,  mount: 'ceiling', color: '#B8643E', z: 190 },
];

/**
 * What: look up a catalogue entry by its type key.
 * In:  type (string)
 * Out: catalogue entry or a generic box entry
 */
export function byType(type) {
  // unknown types (e.g. from an imported file) fall back to a plain box
  return CATALOG.find((c) => c.type === type) || { type: 'box', es: 'Objeto', en: 'Object', mount: 'floor' };
}
