/* ============================================================
   sequence.js — moteur « séquence d'images sur canvas »
   Charge les images d'une scène, les dessine en mode « cover »
   centré, et mélange 2 images voisines pour un rendu fluide
   même avec peu d'images (≈ 40 par clip).
   ============================================================ */
import { framePath, BG_COLOR, EDGE_FADE } from "./config.js";

export class ImageSequence {
  /**
   * constructor — prépare le canvas et la liste d'images (sans charger).
   * In:  canvas (HTMLCanvasElement), scene (objet {dir,count,ext})
   * Out: instance ImageSequence
   */
  constructor(canvas, scene) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.scene = scene;
    this.images = new Array(scene.count);   // Image() par index
    this.loaded = new Array(scene.count).fill(false);
    this.progress = 0;                      // 0 → 1 (position du scroll)
    this.started = false;                   // chargement lancé ?
    this.resize();
  }

  /**
   * load — lance le chargement : 1re image d'abord, puis le reste
   *        dans un ordre « grossier → fin » (1 sur 8, puis 1 sur 4…)
   *        pour avoir vite une animation complète, même approximative.
   * In:  rien
   * Out: Promise résolue quand la 1re image est prête
   */
  load() {
    if (this.started) return this.firstReady;
    this.started = true;
    const order = this.loadOrder(this.scene.count);
    // La première image est attendue pour afficher le canvas tout de suite
    this.firstReady = this.loadOne(order[0]).then(() => this.render());
    // Les suivantes arrivent en arrière-plan, sans bloquer
    order.slice(1).forEach((i) => this.loadOne(i).then(() => this.render()));
    return this.firstReady;
  }

  /**
   * release — libère la mémoire des images quand la scène est loin de l'écran
   *           (sur iPhone, trop d'images décodées font planter l'onglet).
   *           Le prochain load() les reprend depuis le cache HTTP.
   * In:  rien
   * Out: rien
   */
  release() {
    if (!this.started) return;
    this.started = false;
    this.images = new Array(this.scene.count);
    this.loaded = new Array(this.scene.count).fill(false);
  }

  /**
   * loadOrder — ordre de chargement progressif des index.
   * In:  count (nombre d'images)
   * Out: tableau d'index sans doublon (0, 8, 16…, puis 4, 12…, puis le reste)
   */
  loadOrder(count) {
    const seen = new Set();
    const out = [];
    // Pas décroissants : 8, 4, 2, 1
    for (const step of [8, 4, 2, 1]) {
      for (let i = 0; i < count; i += step) {
        if (!seen.has(i)) { seen.add(i); out.push(i); }
      }
    }
    return out;
  }

  /**
   * loadOne — charge et décode une image de la séquence.
   * In:  index
   * Out: Promise<void> (résolue même en cas d'erreur, pour ne rien bloquer)
   */
  loadOne(index) {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        // decode() évite un à-coup au premier dessin sur certains navigateurs
        // Si la scène a été libérée entre-temps, on n'enregistre pas l'image
        const done = () => { if (this.started) { this.images[index] = img; this.loaded[index] = true; } resolve(); };
        img.decode ? img.decode().then(done, done) : done();
      };
      img.onerror = () => resolve();
      img.src = framePath(this.scene, index);
    });
  }

  /**
   * nearestLoaded — trouve l'image chargée la plus proche d'un index.
   * In:  index visé
   * Out: index chargé le plus proche, ou -1 si rien n'est prêt
   */
  nearestLoaded(index) {
    // Recherche alternée gauche / droite
    for (let d = 0; d < this.scene.count; d++) {
      if (this.loaded[index - d]) return index - d;
      if (this.loaded[index + d]) return index + d;
    }
    return -1;
  }

  /**
   * resize — adapte la taille interne du canvas à l'écran (net sur Retina).
   * In:  rien (lit la taille CSS du canvas)
   * Out: rien (redessine)
   */
  resize() {
    // Plafond de densité à 2 : au-delà, coût mémoire sans gain visible
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.round(r.width * dpr);
    this.canvas.height = Math.round(r.height * dpr);
    this.render();
  }

  /**
   * setProgress — met à jour la position (appelé par ScrollTrigger).
   * In:  p (0 → 1)
   * Out: rien (redessine si la valeur change)
   */
  setProgress(p) {
    const clamped = Math.min(1, Math.max(0, p));
    if (clamped === this.progress) return;
    this.progress = clamped;
    this.render();
  }

  /**
   * render — dessine l'image courante (+ fondu avec la suivante).
   * In:  rien (utilise this.progress)
   * Out: rien
   */
  render() {
    const { ctx, canvas } = this;
    const exact = this.progress * (this.scene.count - 1);  // ex. 12.4
    const a = Math.floor(exact);
    const t = exact - a;                                    // part de l'image suivante
    const ia = this.nearestLoaded(a);
    if (ia < 0) return;                                     // rien de prêt
    // Fond de la couleur des vidéos : pas de bord visible
    ctx.globalAlpha = 1;
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.drawCover(this.images[ia]);
    // Fondu avec l'image suivante si elle est chargée (interpolation douce)
    if (t > 0.02 && this.loaded[a + 1] && ia === a) {
      ctx.globalAlpha = t;
      this.drawCover(this.images[a + 1]);
      ctx.globalAlpha = 1;
    }
    // Bords fondus une seule fois, après le mélange des deux images
    if (this.lastRect) this.fadeEdges(...this.lastRect);
  }

  /**
   * drawCover — dessine une image carrée selon la mise en page :
   *             bureau = à droite/gauche du texte, mobile = en bas.
   * In:  img (HTMLImageElement chargée)
   * Out: rien
   */
  drawCover(img) {
    const { ctx, canvas } = this;
    const W = canvas.width, H = canvas.height;
    const portrait = H > W * 1.1;
    let size, x, y;
    if (portrait) {
      // Mobile : carré un peu plus large que l'écran, calé en bas
      size = Math.max(W * 1.18, H * 0.62);
      x = (W - size) / 2;
      y = H - size * 0.94;
    } else {
      // Bureau : carré à hauteur d'écran, décalé du côté opposé au texte
      size = Math.max(H * 1.04, W * 0.5);
      const right = !this.canvas.closest(".scene--right");
      x = right ? W - size * 0.92 : -size * 0.08;
      y = (H - size) / 2;
    }
    ctx.drawImage(img, x, y, size, size);
    this.lastRect = [x, y, size];             // mémorisé pour fadeEdges()
  }

  /**
   * fadeEdges — fond les 4 bords du carré dans la couleur de la page,
   *             pour qu'aucune arête de la vidéo ne soit visible.
   * In:  x, y, size (position et taille du carré dessiné, en pixels canvas)
   * Out: rien
   */
  fadeEdges(x, y, size) {
    const { ctx } = this;
    const f = size * EDGE_FADE;               // largeur du fondu
    const solid = BG_COLOR;
    const clear = "rgba(18,12,9,0)";          // même teinte, transparente
    // Une passe par bord : [x0,y0,x1,y1] du dégradé + rectangle couvert
    const edges = [
      [x, y, x, y + f, x, y, size, f],                         // haut
      [x, y + size, x, y + size - f, x, y + size - f, size, f], // bas
      [x, y, x + f, y, x, y, f, size],                         // gauche
      [x + size, y, x + size - f, y, x + size - f, y, f, size], // droite
    ];
    edges.forEach(([gx0, gy0, gx1, gy1, rx, ry, rw, rh]) => {
      const g = ctx.createLinearGradient(gx0, gy0, gx1, gy1);
      g.addColorStop(0, solid);
      g.addColorStop(1, clear);
      ctx.fillStyle = g;
      ctx.fillRect(rx, ry, rw, rh);
    });
  }
}
