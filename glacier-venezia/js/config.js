/* ============================================================
   config.js — réglages des séquences d'images
   Une entrée par scène : où sont les images, combien, extension.
   « base » vide = images servies depuis ce dossier (chemins relatifs).
   ============================================================ */

/* Liste des scènes (clé = attribut data-scene du HTML) */
export const SCENES = {
  pistache: { base: "", dir: "frames/pistache", count: 50, ext: "webp" },
  chocolat: { base: "", dir: "frames/chocolat", count: 56, ext: "webp" },
  fruits:   { base: "", dir: "frames/fruits",   count: 52,   ext: "webp" },
};

/* Couleur de fond des vidéos : le canvas se fond dans la page */
export const BG_COLOR = "#120c09";

/* Largeur (en fraction du carré) du fondu des bords vers BG_COLOR */
export const EDGE_FADE = 0.16;

/* Distance (en écrans) avant une scène à partir de laquelle on précharge ses images */
export const PRELOAD_AHEAD = 1.5;

/**
 * framePath — construit l'URL d'une image de la séquence.
 * In:  scene (objet SCENES[x]), index (0 … count-1)
 * Out: chaîne « https://…/frames/chocolat/f001.webp » (ou relative)
 */
export function framePath(scene, index) {
  // Numérotation sur 3 chiffres, à partir de 1 (sortie ffmpeg)
  const n = String(index + 1).padStart(3, "0");
  return `${scene.base}${scene.dir}/f${n}.${scene.ext}`;
}
