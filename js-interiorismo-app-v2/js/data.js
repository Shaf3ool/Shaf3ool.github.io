/* =========================================================================
   data.js — static content for the Js Interiorismo app prototype (v2)
   - PROJECTS: Jorge Santana's 16 real projects (titles/captions from the kit,
     renders © Jorge Santana / Js Interiorismo). "palette" is OUR suggestion
     for the planner (labelled "sugerida" in the UI), not a claim about his specs.
   - CATALOGUE: furniture blocks for the planner (sizes in centimetres).
   - FINISHES: floor / wall materials (procedural textures, see textures.js).
   - TEMPLATES: demo starting rooms (all labelled Demo in the UI).
   ========================================================================= */

// --- Real projects (from kit/projects.json, image sizes measured) ---------
export const PROJECTS = [
 {
  "slug": "bano-negro",
  "title": {
   "es": "Baño Noir",
   "en": "Noir Bathroom"
  },
  "cat": {
   "es": "Baño · Residencial",
   "en": "Bathroom · Residential"
  },
  "year": 2025,
  "text": {
   "es": "Elegancia en cada detalle. Un baño moderno que redefine el confort y el estilo.",
   "en": "Elegance in every detail. A modern bathroom that redefines comfort and style."
  },
  "imgs": [
   {
    "src": "bano-negro-1",
    "w": 1440,
    "h": 1080,
    "sw": 900,
    "sh": 675
   },
   {
    "src": "bano-negro-2",
    "w": 1440,
    "h": 1080,
    "sw": 900,
    "sh": 675
   }
  ],
  "group": "bano",
  "palette": [
   "microcemento",
   "nogal"
  ]
 },
 {
  "slug": "recamara",
  "title": {
   "es": "Recámara",
   "en": "Master Bedroom"
  },
  "cat": {
   "es": "Recámara · Residencial",
   "en": "Bedroom · Residential"
  },
  "year": 2024,
  "text": {
   "es": "Madera, textiles y luz cálida en una recámara pensada para el descanso.",
   "en": "Wood, textiles and warm light in a bedroom designed for rest."
  },
  "imgs": [
   {
    "src": "recamara-1",
    "w": 1440,
    "h": 1440,
    "sw": 900,
    "sh": 900
   },
   {
    "src": "recamara-2",
    "w": 1440,
    "h": 1440,
    "sw": 900,
    "sh": 900
   }
  ],
  "group": "habitar",
  "palette": [
   "roble",
   "chukum"
  ]
 },
 {
  "slug": "loft",
  "title": {
   "es": "Loft contemporáneo",
   "en": "Contemporary Loft"
  },
  "cat": {
   "es": "Loft · Residencial",
   "en": "Loft · Residential"
  },
  "year": 2023,
  "text": {
   "es": "Doble altura, ventanales en arco y madera: un loft abierto a la luz.",
   "en": "Double height, arched windows and timber: a loft open to the light."
  },
  "imgs": [
   {
    "src": "loft-1",
    "w": 1440,
    "h": 1800,
    "sw": 900,
    "sh": 1125
   },
   {
    "src": "loft-2",
    "w": 1440,
    "h": 1800,
    "sw": 900,
    "sh": 1125
   }
  ],
  "group": "habitar",
  "palette": [
   "roble",
   "microcemento"
  ]
 },
 {
  "slug": "bano-sereno",
  "title": {
   "es": "Baño Sereno",
   "en": "Serene Bathroom"
  },
  "cat": {
   "es": "Baño · Residencial",
   "en": "Bathroom · Residential"
  },
  "year": 2026,
  "text": {
   "es": "Espacios que no buscan impresionar. Buscan permanecer.",
   "en": "Spaces that don't try to impress. They're made to last."
  },
  "imgs": [
   {
    "src": "bano-sereno-1",
    "w": 1800,
    "h": 1800,
    "sw": 900,
    "sh": 900
   },
   {
    "src": "bano-sereno-2",
    "w": 1800,
    "h": 1800,
    "sw": 900,
    "sh": 900
   }
  ],
  "group": "bano",
  "palette": [
   "travertino",
   "chukum"
  ]
 },
 {
  "slug": "cafe-goretti",
  "title": {
   "es": "Café Goretti",
   "en": "Café Goretti"
  },
  "cat": {
   "es": "Cafetería · Comercial",
   "en": "Café · Commercial"
  },
  "year": 2026,
  "text": {
   "es": "El verdadero lujo reside en los detalles: diseño, luz y materiales en equilibrio.",
   "en": "True luxury lives in the details: design, light and materials in balance."
  },
  "imgs": [
   {
    "src": "cafe-goretti-1",
    "w": 1800,
    "h": 1350,
    "sw": 900,
    "sh": 675
   },
   {
    "src": "cafe-goretti-2",
    "w": 1800,
    "h": 1350,
    "sw": 900,
    "sh": 675
   }
  ],
  "group": "comercial",
  "palette": [
   "nogal",
   "terracota"
  ]
 },
 {
  "slug": "vestidor-salvia",
  "title": {
   "es": "Vestidor Salvia",
   "en": "Sage Walk-in Closet"
  },
  "cat": {
   "es": "Vestidor · Residencial",
   "en": "Walk-in closet · Residential"
  },
  "year": 2026,
  "text": {
   "es": "Un espacio pensado no solo para almacenar, sino para desconectar y disfrutar.",
   "en": "A space designed not only for storage, but to unwind and enjoy."
  },
  "imgs": [
   {
    "src": "vestidor-salvia-1",
    "w": 1800,
    "h": 2250,
    "sw": 900,
    "sh": 1125
   },
   {
    "src": "vestidor-salvia-2",
    "w": 1800,
    "h": 2250,
    "sw": 900,
    "sh": 1125
   }
  ],
  "group": "habitar",
  "palette": [
   "roble",
   "chukum"
  ]
 },
 {
  "slug": "cocina-neutra",
  "title": {
   "es": "Cocina Neutra",
   "en": "Neutral Kitchen"
  },
  "cat": {
   "es": "Cocina · Residencial",
   "en": "Kitchen · Residential"
  },
  "year": 2025,
  "text": {
   "es": "Un diseño moderno y minimalista con materiales neutros y elegantes.",
   "en": "A modern, minimal design in neutral, elegant materials."
  },
  "imgs": [
   {
    "src": "cocina-neutra-1",
    "w": 1440,
    "h": 1440,
    "sw": 900,
    "sh": 900
   },
   {
    "src": "cocina-neutra-2",
    "w": 1440,
    "h": 1440,
    "sw": 900,
    "sh": 900
   }
  ],
  "group": "cocina",
  "palette": [
   "travertino",
   "microcemento"
  ]
 },
 {
  "slug": "bano-gilsa",
  "title": {
   "es": "Baño Gilsa",
   "en": "Gilsa Bathroom"
  },
  "cat": {
   "es": "Baño · Gilsa Render Awards 2024",
   "en": "Bathroom · Gilsa Render Awards 2024"
  },
  "year": 2024,
  "text": {
   "es": "Baño contemporáneo de paleta neutra, presentado en los Gilsa Render Awards 2024.",
   "en": "A contemporary bathroom in a neutral palette, entered in the Gilsa Render Awards 2024."
  },
  "imgs": [
   {
    "src": "bano-gilsa-1",
    "w": 1440,
    "h": 960,
    "sw": 900,
    "sh": 600
   },
   {
    "src": "bano-gilsa-2",
    "w": 1440,
    "h": 1440,
    "sw": 900,
    "sh": 900
   }
  ],
  "group": "bano",
  "palette": [
   "travertino",
   "microcemento"
  ]
 },
 {
  "slug": "cocina-gilsa",
  "title": {
   "es": "Cocina Gilsa",
   "en": "Gilsa Kitchen"
  },
  "cat": {
   "es": "Cocina · Gilsa Render Awards 2024",
   "en": "Kitchen · Gilsa Render Awards 2024"
  },
  "year": 2024,
  "text": {
   "es": "Elegancia y calidez natural, con la luz que entra por una claraboya.",
   "en": "Elegance and natural warmth, with light falling through a skylight."
  },
  "imgs": [
   {
    "src": "cocina-gilsa-1",
    "w": 1440,
    "h": 957,
    "sw": 900,
    "sh": 598
   },
   {
    "src": "cocina-gilsa-2",
    "w": 1440,
    "h": 960,
    "sw": 900,
    "sh": 600
   }
  ],
  "group": "cocina",
  "palette": [
   "roble",
   "chukum"
  ]
 },
 {
  "slug": "closet-tocador",
  "title": {
   "es": "Closet Tocador",
   "en": "Closet & Vanity"
  },
  "cat": {
   "es": "Mobiliario · Residencial",
   "en": "Joinery · Residential"
  },
  "year": 2023,
  "text": {
   "es": "Closet y tocador a medida, con iluminación integrada.",
   "en": "Bespoke closet and vanity with integrated lighting."
  },
  "imgs": [
   {
    "src": "closet-tocador-1",
    "w": 1440,
    "h": 753,
    "sw": 900,
    "sh": 471
   }
  ],
  "group": "habitar",
  "palette": [
   "nogal",
   "chukum"
  ]
 },
 {
  "slug": "bano-chukum",
  "title": {
   "es": "Baño Chukum",
   "en": "Chukum Bathroom"
  },
  "cat": {
   "es": "Baño · Residencial",
   "en": "Bathroom · Residential"
  },
  "year": 2023,
  "text": {
   "es": "Acabado chukum, madera y luz cenital.",
   "en": "Chukum finish, timber and overhead daylight."
  },
  "imgs": [
   {
    "src": "bano-chukum-1",
    "w": 1440,
    "h": 1440,
    "sw": 900,
    "sh": 900
   },
   {
    "src": "bano-chukum-2",
    "w": 1440,
    "h": 1440,
    "sw": 900,
    "sh": 900
   }
  ],
  "group": "bano",
  "palette": [
   "roble",
   "chukum"
  ]
 },
 {
  "slug": "patio-jacaranda",
  "title": {
   "es": "Patio Jacaranda",
   "en": "Jacaranda Courtyard"
  },
  "cat": {
   "es": "Paisajismo · Residencial",
   "en": "Landscape · Residential"
  },
  "year": 2026,
  "text": {
   "es": "El lujo de la sencillez: calma, equilibrio y conexión con el entorno.",
   "en": "The luxury of simplicity: calm, balance and connection with the surroundings."
  },
  "imgs": [
   {
    "src": "patio-jacaranda-1",
    "w": 1800,
    "h": 1800,
    "sw": 900,
    "sh": 900
   },
   {
    "src": "patio-jacaranda-2",
    "w": 1800,
    "h": 1800,
    "sw": 900,
    "sh": 900
   }
  ],
  "group": "exterior",
  "palette": [
   "terracota",
   "chukum"
  ]
 },
 {
  "slug": "escenario-natural",
  "title": {
   "es": "Escenario Natural",
   "en": "Natural Stage"
  },
  "cat": {
   "es": "Exterior · Paisajismo",
   "en": "Outdoor · Landscape"
  },
  "year": 2025,
  "text": {
   "es": "Integración armónica entre naturaleza y arquitectura contemporánea.",
   "en": "A harmonious meeting of nature and contemporary architecture."
  },
  "imgs": [
   {
    "src": "escenario-natural-1",
    "w": 1440,
    "h": 1153,
    "sw": 900,
    "sh": 721
   },
   {
    "src": "escenario-natural-2",
    "w": 1440,
    "h": 1154,
    "sw": 900,
    "sh": 721
   }
  ],
  "group": "exterior",
  "palette": [
   "travertino",
   "chukum"
  ]
 },
 {
  "slug": "fachada-blanca",
  "title": {
   "es": "Fachada Blanca",
   "en": "White Façade"
  },
  "cat": {
   "es": "Fachada · Arquitectura",
   "en": "Façade · Architecture"
  },
  "year": 2026,
  "text": {
   "es": "Una fachada donde la sencillez se convierte en diseño.",
   "en": "A façade where simplicity becomes design."
  },
  "imgs": [
   {
    "src": "fachada-blanca-1",
    "w": 1800,
    "h": 2250,
    "sw": 900,
    "sh": 1125
   },
   {
    "src": "fachada-blanca-2",
    "w": 1800,
    "h": 2250,
    "sw": 900,
    "sh": 1125
   }
  ],
  "group": "exterior",
  "palette": [
   "microcemento",
   "chukum"
  ]
 },
 {
  "slug": "fachada-contemporanea",
  "title": {
   "es": "Fachada Contemporánea",
   "en": "Contemporary Façade"
  },
  "cat": {
   "es": "Fachada · Arquitectura",
   "en": "Façade · Architecture"
  },
  "year": 2026,
  "text": {
   "es": "Volúmenes sobrios, líneas puras y una fachada que proyecta contemporaneidad.",
   "en": "Sober volumes, pure lines and a façade with a contemporary presence."
  },
  "imgs": [
   {
    "src": "fachada-contemporanea-1",
    "w": 1440,
    "h": 1440,
    "sw": 900,
    "sh": 900
   }
  ],
  "group": "exterior",
  "palette": [
   "nogal",
   "microcemento"
  ]
 },
 {
  "slug": "fachada-casa-pequena",
  "title": {
   "es": "Fachada Casa Pequeña",
   "en": "Small House Façade"
  },
  "cat": {
   "es": "Fachada · Arquitectura",
   "en": "Façade · Architecture"
  },
  "year": 2024,
  "text": {
   "es": "Materiales naturales y texturas contemporáneas para una casa pequeña.",
   "en": "Natural materials and contemporary textures for a small house."
  },
  "imgs": [
   {
    "src": "fachada-casa-pequena-1",
    "w": 1440,
    "h": 1800,
    "sw": 900,
    "sh": 1125
   }
  ],
  "group": "exterior",
  "palette": [
   "terracota",
   "chukum"
  ]
 }
];

// --- Filter groups used by the Inspiración screen --------------------------
export const GROUPS = ['todo', 'bano', 'cocina', 'habitar', 'comercial', 'exterior'];

// --- Furniture catalogue (w = width along x, d = depth along y, cm) --------
export const CATALOGUE = [
  { type: 'sofa',    w: 220, d: 92,  icon: 'sofa' },
  { type: 'mesa',    w: 160, d: 90,  icon: 'mesa' },
  { type: 'cama',    w: 170, d: 210, icon: 'cama' },
  { type: 'closet',  w: 180, d: 62,  icon: 'closet' },
  { type: 'isla',    w: 210, d: 100, icon: 'isla' },
  { type: 'planta',  w: 56,  d: 56,  icon: 'planta' },
  { type: 'tapete',  w: 240, d: 170, icon: 'tapete' },
];

// --- Finishes (keys double as i18n keys "fin.<key>") -----------------------
// tone = representative colour used for UI dots and 2D fallbacks
export const FINISHES = [
  { key: 'roble',        tone: '#C9A57C', kind: 'wood'  },
  { key: 'nogal',        tone: '#6E4B34', kind: 'wood'  },
  { key: 'travertino',   tone: '#E2D3BC', kind: 'stone' },
  { key: 'microcemento', tone: '#CEC6BB', kind: 'plaster' },
  { key: 'chukum',       tone: '#DCC9AE', kind: 'plaster' },
  { key: 'terracota',    tone: '#B8643E', kind: 'tile'  },
];

// --- Demo templates: a room size + a few pieces ---------------------------
// x / y = centre of the piece inside the room (cm), rot = degrees clockwise
export const TEMPLATES = {
  sala: {
    room: { w: 480, d: 400 }, floor: 'roble', wall: 'chukum',
    items: [
      { type: 'tapete', x: 240, y: 210, rot: 0 },
      { type: 'sofa',   x: 240, y: 100, rot: 0 },
      { type: 'mesa',   x: 240, y: 300, rot: 0 },
      { type: 'planta', x: 430, y: 60,  rot: 0 },
      { type: 'planta', x: 50,  y: 350, rot: 0 },
    ],
  },
  recamara: {
    room: { w: 420, d: 440 }, floor: 'nogal', wall: 'chukum',
    items: [
      { type: 'tapete', x: 210, y: 210, rot: 0 },
      { type: 'cama',   x: 210, y: 140, rot: 0 },
      { type: 'closet', x: 31,  y: 330, rot: 270 },
      { type: 'planta', x: 375, y: 50,  rot: 0 },
    ],
  },
  cocina: {
    room: { w: 460, d: 420 }, floor: 'travertino', wall: 'microcemento',
    items: [
      { type: 'isla',   x: 230, y: 170, rot: 0 },
      { type: 'mesa',   x: 230, y: 330, rot: 0 },
      { type: 'planta', x: 410, y: 380, rot: 0 },
    ],
  },
  blanco: { room: { w: 400, d: 360 }, floor: 'roble', wall: 'chukum', items: [] },
};
