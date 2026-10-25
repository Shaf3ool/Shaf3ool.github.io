/* =========================================================================
   data.js — the catalogue: categories + every option Jorge offers (Demo)
   - kind 'swatch': a code-drawn material sample (textures.js key)
   - kind 'photo' : a crop of one of Jorge's REAL renders (img/), with the
     project it comes from in `seen` (© Jorge Santana / Js Interiorismo)
   - real: true  → the material/style is documented in his work (research.md:
     "light oak and walnut, travertine/stone, microcement and chukum, black
     accents in bathrooms, arched openings, linear LED/indirect light, sage
     green joinery, biophilic touches, Mexican landscape").
   Item shape: { id, category, name, material, kind ('swatch'|'photo'), src,
   note, desc, specs } — names, materials, notes and specs are DEMO content:
   Jorge sets the real list.
   ========================================================================= */

// --- Categories (order = order of the chips and of the sections) ----------
export const CATEGORIES = [
  { key: 'pisos',       es: 'Pisos',       en: 'Floors' },
  { key: 'muros',       es: 'Muros',       en: 'Walls' },
  { key: 'mobiliario',  es: 'Mobiliario',  en: 'Furniture' },
  { key: 'iluminacion', es: 'Iluminación', en: 'Lighting' },
  { key: 'bano',        es: 'Baño',        en: 'Bathroom' },
  { key: 'cocina',      es: 'Cocina',      en: 'Kitchen' },
  { key: 'exteriores',  es: 'Exteriores',  en: 'Outdoors' },
];

// --- Project titles of the renders used (kit/projects.json) ---------------
export const PROJECTS = {
  'bano-gilsa': 'Baño Gilsa', 'bano-negro': 'Baño Noir', 'bano-sereno': 'Baño Sereno',
  'bano-chukum': 'Baño Chukum', 'cafe-goretti': 'Café Goretti', 'closet-tocador': 'Closet Tocador',
  'cocina-gilsa': 'Cocina Gilsa', 'cocina-neutra': 'Cocina Neutra', 'escenario-natural': 'Escenario Natural',
  'fachada-blanca': 'Fachada Blanca', 'fachada-casa-pequena': 'Fachada Casa Pequeña', 'loft': 'Loft contemporáneo',
  'patio-jacaranda': 'Patio Jacaranda', 'recamara': 'Recámara', 'vestidor-salvia': 'Vestidor Salvia',
};

// --- Material of each option (searchable together with the name) ----------
const MATERIAL = {
  'roble': ["Madera de roble", "Oak wood"],
  'nogal': ["Madera de nogal", "Walnut wood"],
  'travertino': ["Piedra travertino", "Travertine stone"],
  'microcemento': ["Microcemento", "Microcement"],
  'terracota': ["Barro terracota", "Terracotta clay"],
  'porcelanato': ["Porcelanato", "Porcelain tile"],
  'chukum': ["Chukum (estuco natural)", "Chukum (natural render)"],
  'arco': ["Chukum / pintura mineral", "Chukum / mineral paint"],
  'listones': ["Madera de nogal", "Walnut wood"],
  'verde': ["Plantas naturales", "Living plants"],
  'piedra': ["Piedra oscura", "Dark stone"],
  'cal': ["Pintura de cal", "Lime paint"],
  'vestidor': ["Laca mate y roble", "Matte lacquer and oak"],
  'salvia': ["Laca mate", "Matte lacquer"],
  'tocador': ["Madera y piedra", "Wood and stone"],
  'cama': ["Madera de nogal y lino", "Walnut wood and linen"],
  'sala': ["Lino natural", "Natural linen"],
  'comedor': ["Madera de roble", "Oak wood"],
  'lineal': ["LED cálido", "Warm LED"],
  'espejo': ["Espejo con LED", "LED mirror"],
  'colgante': ["Fibra natural (ratán)", "Natural fibre (rattan)"],
  'cenital': ["Vidrio templado", "Tempered glass"],
  'tina': ["Solid surface", "Solid surface"],
  'griferia': ["Metal negro mate", "Matte black metal"],
  'lavabo': ["Madera de nogal y piedra", "Walnut wood and stone"],
  'tina-chukum': ["Chukum sellado", "Sealed chukum"],
  'isla': ["Cuarzo y madera", "Quartz and wood"],
  'cocina-u': ["Laca y roble", "Lacquer and oak"],
  'barra': ["Madera maciza", "Solid wood"],
  'altos': ["Laca mate", "Matte lacquer"],
  'cuarzo': ["Cuarzo", "Quartz"],
  'agave': ["Agave, cactáceas y piedra", "Agave, cacti and stone"],
  'jacaranda': ["Jacaranda, piedra y grava", "Jacaranda, stone and gravel"],
  'alberca': ["Piedra natural", "Natural stone"],
  'fachada': ["Aplanado y madera", "Render and wood"],
  'celosia': ["Madera o metal", "Wood or metal"],
  'deck': ["Madera exterior", "Exterior wood"],
};

/**
 * What: shorthand to build one catalogue item.
 * In:  id, category, kind, src (texture key or image base name), pos (CSS
 *      object-position for photos), es [name, note, desc], en [name, note,
 *      desc], specs [[labelKey, es, en]…], real (bool)
 * Out: item object
 */
function item(id, category, kind, src, pos, es, en, specs, real = false) {
  // the project slug is the image name without its trailing "-N"
  const seen = kind === 'photo' ? src.replace(/-\d$/, '') : null;
  const m = MATERIAL[id] || ['', ''];
  return { id, category, kind, src, pos, seen, real,
    name: { es: es[0], en: en[0] }, material: { es: m[0], en: m[1] }, note: { es: es[1], en: en[1] }, desc: { es: es[2], en: en[2] },
    specs: specs.map(([k, a, b]) => ({ k, es: a, en: b })) };
}

// --- Items ------------------------------------------------------------------
export const ITEMS = [
  // Pisos ---------------------------------------------------------------------
  item('roble', 'pisos', 'swatch', 'roble', '', ['Roble claro', 'Duela de madera cálida', 'Madera clara de veta suave; uno de los materiales que más se ven en los proyectos de Jorge.'],
    ['Light oak', 'Warm timber planks', 'Pale, softly grained wood; one of the materials seen most often in Jorge’s projects.'],
    [['fmt', 'Duela 20 × 180 cm', '20 × 180 cm planks'], ['fin', 'Mate natural', 'Natural matte'], ['use', 'Recámaras, sala', 'Bedrooms, living']], true),
  item('nogal', 'pisos', 'swatch', 'nogal', '', ['Nogal', 'Madera oscura y profunda', 'Un tono más intenso para espacios acogedores y contrastes elegantes.'],
    ['Walnut', 'Deep, dark timber', 'A richer tone for cosy rooms and elegant contrast.'],
    [['fmt', 'Duela 19 × 190 cm', '19 × 190 cm planks'], ['fin', 'Aceite satinado', 'Satin oil'], ['use', 'Sala, estudio', 'Living, study']], true),
  item('travertino', 'pisos', 'swatch', 'travertino', '', ['Travertino', 'Piedra natural en gran formato', 'Piedra cálida con vetas horizontales, presente en el estilo de Jorge.'],
    ['Travertine', 'Large-format natural stone', 'Warm stone with horizontal banding, part of Jorge’s signature look.'],
    [['fmt', 'Placa 60 × 120 cm', '60 × 120 cm slab'], ['fin', 'Apomazado', 'Honed'], ['use', 'Interior y baño', 'Interior & bath']], true),
  item('microcemento', 'pisos', 'swatch', 'microcemento', '', ['Microcemento', 'Continuo, sin juntas', 'Superficie continua y suave que une pisos y muros sin cortes.'],
    ['Microcement', 'Seamless, no joints', 'A smooth continuous surface that runs from floor to wall.'],
    [['fmt', 'Aplicación continua', 'Seamless application'], ['fin', 'Sellado mate', 'Matte sealed'], ['use', 'Toda la casa', 'Whole home']], true),
  item('terracota', 'pisos', 'swatch', 'terracota', '', ['Terracota artesanal', 'Barro hecho a mano', 'Piezas de barro con variación natural de tono, para un ambiente cálido.'],
    ['Handmade terracotta', 'Hand-made clay tiles', 'Clay tiles with natural tone variation for a warm, grounded feel.'],
    [['fmt', '30 × 30 cm', '30 × 30 cm'], ['fin', 'Encerado', 'Waxed'], ['use', 'Cocina, terraza', 'Kitchen, terrace']]),
  item('porcelanato', 'pisos', 'swatch', 'porcelanato', '', ['Porcelanato gran formato', 'Resistente y fácil de limpiar', 'Tono neutro y juntas mínimas para espacios amplios y luminosos.'],
    ['Large-format porcelain', 'Durable and easy-care', 'Neutral tone and minimal joints for wide, bright rooms.'],
    [['fmt', '120 × 120 cm', '120 × 120 cm'], ['fin', 'Mate', 'Matte'], ['use', 'Áreas de alto tránsito', 'High-traffic areas']]),

  // Muros ---------------------------------------------------------------------
  item('chukum', 'muros', 'swatch', 'chukum', '', ['Chukum', 'Acabado yucateco a llana', 'Recubrimiento tradicional de Yucatán con textura de llana; Jorge lo usa en baños y muros.'],
    ['Chukum', 'Trowelled Yucatán finish', 'Traditional Yucatán render with a trowelled texture; Jorge uses it in bathrooms and walls.'],
    [['fmt', 'Aplicación a llana', 'Trowel-applied'], ['fin', 'Natural impermeable', 'Natural, water-resistant'], ['use', 'Baño, muros', 'Bath, walls']], true),
  item('arco', 'muros', 'photo', 'bano-gilsa-2', '50% 40%', ['Vano en arco', 'Aberturas suaves y curvas', 'Arcos en puertas y nichos que suavizan el espacio, una firma en su trabajo.'],
    ['Arched opening', 'Soft, curved openings', 'Arches in doorways and niches that soften a room, a signature of his work.'],
    [['fmt', 'A medida', 'Made to measure'], ['fin', 'Chukum o pintura mineral', 'Chukum or mineral paint'], ['use', 'Pasillos, baños', 'Halls, bathrooms']], true),
  item('listones', 'muros', 'photo', 'bano-negro-1', '82% 50%', ['Listones de madera', 'Ritmo vertical cálido', 'Panel de listones que da textura, calidez y oculta puertas o instalaciones.'],
    ['Timber slats', 'Warm vertical rhythm', 'A slatted panel that adds texture and warmth and hides doors or services.'],
    [['fmt', 'Listón 4 × 6 cm', '4 × 6 cm slats'], ['fin', 'Nogal o roble', 'Walnut or oak'], ['use', 'Baño, recámara', 'Bath, bedroom']]),
  item('verde', 'muros', 'photo', 'cafe-goretti-1', '50% 30%', ['Muro verde', 'Vegetación integrada', 'Plantas en muro para un toque biofílico, como en el Café Goretti.'],
    ['Living wall', 'Built-in greenery', 'Planted wall for a biophilic touch, as in Café Goretti.'],
    [['fmt', 'Por m²', 'Per m²'], ['fin', 'Riego integrado', 'Built-in irrigation'], ['use', 'Comercial, terraza', 'Commercial, terrace']], true),
  item('piedra', 'muros', 'swatch', 'piedra', '', ['Piedra oscura', 'Acento negro mate', 'Placas oscuras para un muro protagonista con mucho carácter.'],
    ['Dark stone', 'Matte black accent', 'Dark slabs for a feature wall with real presence.'],
    [['fmt', '60 × 120 cm', '60 × 120 cm'], ['fin', 'Apomazado', 'Honed'], ['use', 'Baño, chimenea', 'Bath, fireplace']]),
  item('cal', 'muros', 'swatch', 'cal', '', ['Pintura de cal', 'Mineral y transpirable', 'Pintura de cal con nubes suaves de color; luce cálida con luz natural.'],
    ['Lime paint', 'Mineral and breathable', 'Lime wash with soft cloudy tones; glows in natural light.'],
    [['fmt', 'Por m²', 'Per m²'], ['fin', 'Mate aterciopelado', 'Velvet matte'], ['use', 'Sala, recámara', 'Living, bedroom']]),

  // Mobiliario ----------------------------------------------------------------
  item('vestidor', 'mobiliario', 'photo', 'vestidor-salvia-1', '50% 55%', ['Vestidor verde salvia', 'Carpintería a medida', 'Vestidor con frentes en verde salvia y madera, diseñado al milímetro.'],
    ['Sage walk-in closet', 'Bespoke joinery', 'Walk-in closet with sage-green fronts and timber, designed to the millimetre.'],
    [['fmt', 'A medida', 'Made to measure'], ['fin', 'Laca mate + roble', 'Matte lacquer + oak'], ['use', 'Recámara principal', 'Master bedroom']], true),
  item('salvia', 'mobiliario', 'swatch', 'salvia', '', ['Laca verde salvia', 'Color para carpintería', 'El verde suave que aparece en su carpintería, como muestra de color.'],
    ['Sage lacquer', 'Joinery colour', 'The soft green seen in his joinery, as a colour sample.'],
    [['fmt', 'Muestra de color', 'Colour sample'], ['fin', 'Laca mate', 'Matte lacquer'], ['use', 'Clósets, cocina', 'Closets, kitchen']], true),
  item('tocador', 'mobiliario', 'photo', 'closet-tocador-1', '50% 45%', ['Tocador con espejo', 'Mueble integrado al clóset', 'Tocador con espejo e iluminación, integrado al vestidor.'],
    ['Vanity with mirror', 'Built into the closet', 'Dressing table with mirror and lighting, built into the closet.'],
    [['fmt', '120 × 50 cm', '120 × 50 cm'], ['fin', 'Madera + piedra', 'Timber + stone'], ['use', 'Vestidor', 'Dressing room']]),
  item('cama', 'mobiliario', 'photo', 'recamara-1', '30% 60%', ['Cama con cabecera', 'Madera y textiles', 'Cama con cabecera de madera y textiles naturales, pensada para el descanso.'],
    ['Bed with headboard', 'Timber and textiles', 'Bed with a timber headboard and natural textiles, made for rest.'],
    [['fmt', 'King 200 × 200 cm', 'King 200 × 200 cm'], ['fin', 'Nogal', 'Walnut'], ['use', 'Recámara', 'Bedroom']]),
  item('sala', 'mobiliario', 'photo', 'loft-1', '50% 70%', ['Sala lineal', 'Sofá bajo y amplio', 'Sofá bajo en tonos neutros que deja respirar la doble altura.'],
    ['Linear sofa', 'Low, generous seating', 'Low sofa in neutral tones that lets a double-height room breathe.'],
    [['fmt', '280 × 95 cm', '280 × 95 cm'], ['fin', 'Lino natural', 'Natural linen'], ['use', 'Sala', 'Living room']]),
  item('comedor', 'mobiliario', 'photo', 'loft-2', '50% 60%', ['Comedor de madera', 'Mesa para 6', 'Mesa de comedor de madera maciza con sillas de líneas simples.'],
    ['Timber dining set', 'Table for 6', 'Solid timber dining table with simple, clean-lined chairs.'],
    [['fmt', '200 × 95 cm', '200 × 95 cm'], ['fin', 'Roble', 'Oak'], ['use', 'Comedor', 'Dining']]),

  // Iluminación ---------------------------------------------------------------
  item('lineal', 'iluminacion', 'photo', 'bano-negro-2', '50% 35%', ['Luz lineal indirecta', 'LED oculto en nichos', 'Tiras LED ocultas que bañan muros y nichos con luz cálida, muy presente en su trabajo.'],
    ['Indirect linear light', 'Hidden LED in niches', 'Concealed LED strips that wash walls and niches in warm light, common in his work.'],
    [['fmt', 'Por metro lineal', 'Per linear metre'], ['fin', '2700 K cálida', '2700 K warm'], ['use', 'Baño, pasillo', 'Bath, hallway']], true),
  item('espejo', 'iluminacion', 'photo', 'bano-sereno-2', '44% 50%', ['Espejo retroiluminado', 'Halo de luz suave', 'Espejo redondo con luz posterior que crea un halo cálido.'],
    ['Backlit mirror', 'Soft halo of light', 'Round mirror with a rear light that creates a warm halo.'],
    [['fmt', 'Ø 80 cm', 'Ø 80 cm'], ['fin', 'LED regulable', 'Dimmable LED'], ['use', 'Baño', 'Bathroom']]),
  item('colgante', 'iluminacion', 'photo', 'cocina-gilsa-2', '50% 18%', ['Lámpara de fibra natural', 'Colgantes tejidos', 'Lámparas colgantes tejidas que suman textura sobre la isla.'],
    ['Woven pendant', 'Natural-fibre pendants', 'Woven pendant lamps that add texture above the island.'],
    [['fmt', 'Ø 45 cm', 'Ø 45 cm'], ['fin', 'Ratán', 'Rattan'], ['use', 'Cocina, comedor', 'Kitchen, dining']]),
  item('cenital', 'iluminacion', 'photo', 'bano-chukum-1', '88% 50%', ['Luz cenital', 'Tragaluz natural', 'Tragaluz que baja luz natural sobre los muros de textura.'],
    ['Skylight', 'Natural top light', 'A skylight that pours daylight down textured walls.'],
    [['fmt', 'A medida', 'Made to measure'], ['fin', 'Vidrio templado', 'Tempered glass'], ['use', 'Baño, vestidor', 'Bath, closet']]),

  // Baño ----------------------------------------------------------------------
  item('tina', 'bano', 'photo', 'bano-gilsa-1', '50% 60%', ['Tina exenta', 'Pieza central del baño', 'Tina independiente que convierte el baño en un espacio de descanso.'],
    ['Freestanding tub', 'The bathroom’s centrepiece', 'A freestanding bathtub that turns the bathroom into a place to unwind.'],
    [['fmt', '170 × 80 cm', '170 × 80 cm'], ['fin', 'Solid surface mate', 'Matte solid surface'], ['use', 'Baño principal', 'Master bath']]),
  item('griferia', 'bano', 'photo', 'bano-sereno-1', '6% 50%', ['Grifería negra', 'Acentos negro mate', 'Llaves y regadera en negro mate, los acentos oscuros que distinguen sus baños.'],
    ['Black fixtures', 'Matte black accents', 'Taps and shower in matte black, the dark accents that mark his bathrooms.'],
    [['fmt', 'Juego completo', 'Full set'], ['fin', 'Negro mate', 'Matte black'], ['use', 'Baño', 'Bathroom']], true),
  item('lavabo', 'bano', 'photo', 'bano-negro-1', '25% 60%', ['Lavabo sobre mueble', 'Madera y piedra', 'Mueble de lavabo flotante con cubierta de piedra.'],
    ['Vanity basin', 'Timber and stone', 'Floating vanity with a stone top.'],
    [['fmt', '120 × 50 cm', '120 × 50 cm'], ['fin', 'Nogal + piedra', 'Walnut + stone'], ['use', 'Baño', 'Bathroom']]),
  item('tina-chukum', 'bano', 'photo', 'bano-chukum-1', '28% 50%', ['Tina en chukum', 'Recubrimiento continuo', 'Tina y muros con un acabado continuo de llana, cálido y sin juntas.'],
    ['Chukum tub', 'Seamless finish', 'Tub and walls in a seamless trowelled finish, warm and joint-free.'],
    [['fmt', 'A medida', 'Made to measure'], ['fin', 'Chukum sellado', 'Sealed chukum'], ['use', 'Baño principal', 'Master bath']], true),

  // Cocina --------------------------------------------------------------------
  item('isla', 'cocina', 'photo', 'cocina-gilsa-2', '50% 75%', ['Isla de cocina', 'Cubierta tipo mármol', 'Isla amplia con cubierta clara, lugar de reunión de la casa.'],
    ['Kitchen island', 'Marble-look top', 'Generous island with a light top, the gathering spot of the home.'],
    [['fmt', '240 × 100 cm', '240 × 100 cm'], ['fin', 'Cuarzo + madera', 'Quartz + timber'], ['use', 'Cocina', 'Kitchen']]),
  item('cocina-u', 'cocina', 'photo', 'cocina-neutra-1', '50% 55%', ['Cocina neutra', 'Tonos claros y madera', 'Cocina en tonos neutros con madera cálida y líneas limpias.'],
    ['Neutral kitchen', 'Light tones and timber', 'Kitchen in neutral tones with warm timber and clean lines.'],
    [['fmt', 'A medida', 'Made to measure'], ['fin', 'Laca + roble', 'Lacquer + oak'], ['use', 'Cocina', 'Kitchen']]),
  item('barra', 'cocina', 'photo', 'cocina-neutra-2', '50% 60%', ['Barra desayunadora', 'Para comer rápido', 'Barra integrada con bancos, ideal para desayunos y reuniones.'],
    ['Breakfast bar', 'For quick meals', 'Built-in bar with stools, ideal for breakfasts and get-togethers.'],
    [['fmt', '180 × 45 cm', '180 × 45 cm'], ['fin', 'Madera maciza', 'Solid timber'], ['use', 'Cocina', 'Kitchen']]),
  item('altos', 'cocina', 'photo', 'cocina-gilsa-1', '50% 40%', ['Muebles a techo', 'Guardado sin perder espacio', 'Alacenas hasta el techo que ordenan todo y alargan visualmente la cocina.'],
    ['Floor-to-ceiling units', 'Storage without clutter', 'Cabinets up to the ceiling that keep things tidy and make the kitchen feel taller.'],
    [['fmt', 'A medida', 'Made to measure'], ['fin', 'Laca mate', 'Matte lacquer'], ['use', 'Cocina', 'Kitchen']]),
  item('cuarzo', 'cocina', 'swatch', 'cuarzo', '', ['Cuarzo blanco', 'Cubierta con veta suave', 'Cubierta clara con veta fina, resistente a manchas y fácil de mantener.'],
    ['White quartz', 'Softly veined worktop', 'Light worktop with fine veining, stain-resistant and easy to keep.'],
    [['fmt', 'Espesor 2 cm', '2 cm thick'], ['fin', 'Pulido', 'Polished'], ['use', 'Cubiertas', 'Worktops']]),

  // Exteriores ----------------------------------------------------------------
  item('agave', 'exteriores', 'photo', 'escenario-natural-1', '50% 60%', ['Jardín de agaves', 'Paisaje mexicano', 'Agaves, cactáceas y piedra: paisajismo de bajo riego con identidad local.'],
    ['Agave garden', 'Mexican landscape', 'Agaves, cacti and stone: low-water landscaping with local character.'],
    [['fmt', 'Por m²', 'Per m²'], ['fin', 'Bajo riego', 'Low water'], ['use', 'Jardín, acceso', 'Garden, entrance']], true),
  item('jacaranda', 'exteriores', 'photo', 'patio-jacaranda-2', '50% 30%', ['Patio con jacaranda', 'Sombra y color', 'Un árbol protagonista que da sombra y color lila en primavera.'],
    ['Jacaranda patio', 'Shade and colour', 'A feature tree that brings shade and lilac colour in spring.'],
    [['fmt', 'Árbol + jardinera', 'Tree + planter'], ['fin', 'Piedra y grava', 'Stone & gravel'], ['use', 'Patio', 'Patio']], true),
  item('alberca', 'exteriores', 'photo', 'escenario-natural-2', '50% 60%', ['Alberca / jacuzzi', 'Agua al aire libre', 'Espejo de agua o jacuzzi integrado al jardín.'],
    ['Pool / hot tub', 'Water outdoors', 'Reflecting pool or hot tub set into the garden.'],
    [['fmt', 'A medida', 'Made to measure'], ['fin', 'Piedra natural', 'Natural stone'], ['use', 'Terraza, jardín', 'Terrace, garden']]),
  item('fachada', 'exteriores', 'photo', 'fachada-blanca-1', '50% 50%', ['Fachada blanca', 'Volúmenes limpios', 'Fachada clara de volúmenes puros, con madera en los accesos.'],
    ['White façade', 'Clean volumes', 'Light façade of pure volumes, with timber at the entrances.'],
    [['fmt', 'Proyecto completo', 'Full project'], ['fin', 'Aplanado + madera', 'Render + timber'], ['use', 'Fachada', 'Façade']]),
  item('celosia', 'exteriores', 'photo', 'fachada-casa-pequena-1', '50% 45%', ['Celosía', 'Privacidad con luz', 'Celosía que filtra la luz y da privacidad sin cerrar la fachada.'],
    ['Lattice screen', 'Privacy with light', 'A lattice that filters light and gives privacy without closing the façade.'],
    [['fmt', 'A medida', 'Made to measure'], ['fin', 'Madera o metal', 'Timber or metal'], ['use', 'Fachada, terraza', 'Façade, terrace']]),
  item('deck', 'exteriores', 'swatch', 'deck', '', ['Deck de madera', 'Exterior resistente', 'Duela exterior tratada para terrazas y bordes de alberca.'],
    ['Timber deck', 'Weather-proof', 'Treated exterior boards for terraces and pool edges.'],
    [['fmt', 'Duela 14 × 220 cm', '14 × 220 cm boards'], ['fin', 'Aceite exterior', 'Exterior oil'], ['use', 'Terraza', 'Terrace']]),
];

// --- Lookup by id -----------------------------------------------------------
export const BY_ID = Object.fromEntries(ITEMS.map((it) => [it.id, it]));
