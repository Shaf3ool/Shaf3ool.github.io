/* =========================================================================
   planner3d.js — live 3D "dollhouse" view of the current design
   - Builds floor + 4 walls from the design, textures from textures.js
   - Walls facing the camera fade out so the room is always readable
   - Renders on demand (only when something changed), pauses off-screen,
     caps devicePixelRatio at 2, disposes GPU resources on destroy()
   ========================================================================= */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { finishCanvas, tileSizeCm } from './textures.js';
import { buildPiece, disposePiece } from './models.js';
import { CATALOGUE } from './data.js';

const WALL_H = 2.6, WALL_T = 0.12;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * What: check WebGL availability without leaving a context alive.
 * In:  —
 * Out: boolean
 */
export function hasWebGL() {
  try {
    if (hasWebGL.cached !== undefined) return hasWebGL.cached;
    const c = document.createElement('canvas');
    const gl = window.WebGL2RenderingContext ? c.getContext('webgl2') : null;
    hasWebGL.cached = !!gl;
    // free the probe context straight away
    if (gl) { const ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); }
    return hasWebGL.cached;
  } catch (e) { return false; }
}

export class Room3D {
  /**
   * What: create renderer, scene, camera, lights and controls inside host.
   * In:  host (Element that receives the canvas)
   * Out: Room3D instance
   */
  constructor(host) {
    this.host = host;
    this.pieces = new Map();       // item id → { group, key }
    this.dirty = true;
    this.active = false;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(this.renderer.domElement);
    // --- scene & environment ------------------------------------------------
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#EADFCF');
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.scene.environment = this.envTex;
    this.scene.environmentIntensity = 0.55;
    // --- lights ------------------------------------------------------------
    this.scene.add(new THREE.HemisphereLight('#FFF4E6', '#B59A80', 0.9));
    const sun = new THREE.DirectionalLight('#FFE1C2', 2.4);
    sun.position.set(-3.5, 6, 4.5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -5; sun.shadow.camera.right = 5;
    sun.shadow.camera.top = 5; sun.shadow.camera.bottom = -5;
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 4;
    this.scene.add(sun); this.sun = sun;
    // --- camera & controls -------------------------------------------------
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    this.camera.position.set(4.6, 5.4, 6.4);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !reduceMotion;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.minDistance = 3; this.controls.maxDistance = 14;
    this.controls.minPolarAngle = 0.15; this.controls.maxPolarAngle = 1.32;
    this.controls.addEventListener('change', () => { this.dirty = true; });
    // --- room shell ---------------------------------------------------------
    this.roomGroup = new THREE.Group();
    this.scene.add(this.roomGroup);
    this.itemsGroup = new THREE.Group();
    this.scene.add(this.itemsGroup);
    this.floorMat = new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0 });
    this.wallMat = new THREE.MeshStandardMaterial({ roughness: 0.95, transparent: true });
    this.plinthMat = new THREE.MeshStandardMaterial({ color: '#D9C6AE', roughness: 1 });
    // selection ring (terracotta) shown under the selected piece
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.98, 1, 64), new THREE.MeshBasicMaterial({ color: '#B8643E', transparent: true, opacity: 0.9 }));
    this.ring.rotation.x = -Math.PI / 2; this.ring.position.y = 0.012; this.ring.visible = false;
    this.scene.add(this.ring);
    // --- sizing & visibility -----------------------------------------------
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.io = new IntersectionObserver((e) => { this.visible = e[0].isIntersecting; this.kick(); });
    this.io.observe(host);
    this.visible = true;
    this.loop = this.loop.bind(this);
    this.resize();
  }

  /**
   * What: match renderer + camera to the host size.
   * In:  —
   * Out: —
   */
  resize() {
    const w = this.host.clientWidth, h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // narrow viewports need a wider field of view to fit the room
    this.camera.fov = w / h < 0.9 ? 46 : 36;
    this.camera.updateProjectionMatrix();
    this.dirty = true; this.kick();
  }

  /**
   * What: make (or reuse) a repeating texture for a finish.
   * In:  key (finish), repX, repY (repeats)
   * Out: THREE.CanvasTexture
   */
  tex(key, repX, repY) {
    this.texCache = this.texCache || new Map();
    let t = this.texCache.get(key);
    if (!t) {
      t = new THREE.CanvasTexture(finishCanvas(key, 512));
      t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
      this.texCache.set(key, t);
    }
    return t;
  }

  /**
   * What: rebuild the room shell (floor, walls, plinth) for a size + finishes.
   * In:  design { room:{w,d}, floor, wall }
   * Out: —
   */
  buildRoom(design) {
    const { w: wcm, d: dcm } = design.room;
    const key = [wcm, dcm, design.floor, design.wall].join('|');
    if (key === this.roomKey) return;
    this.roomKey = key;
    // clear previous shell
    this.roomGroup.children.forEach((o) => o.geometry && o.geometry.dispose());
    this.roomGroup.clear();
    const W = wcm / 100, D = dcm / 100;
    // floor texture repeats according to the real tile size
    const ft = this.tex(design.floor).clone();
    ft.needsUpdate = true;
    ft.repeat.set(wcm / tileSizeCm(design.floor), dcm / tileSizeCm(design.floor));
    if (this.floorMat.map) this.floorMat.map.dispose();
    this.floorMat.map = ft; this.floorMat.needsUpdate = true;
    const floor = new THREE.Mesh(new THREE.BoxGeometry(W, 0.04, D), this.floorMat);
    floor.position.y = -0.02; floor.receiveShadow = true;
    this.roomGroup.add(floor);
    // plinth under the room → diorama look
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(W + WALL_T * 2 + 0.3, 0.16, D + WALL_T * 2 + 0.3), this.plinthMat);
    plinth.position.y = -0.12; plinth.receiveShadow = true;
    this.roomGroup.add(plinth);
    // walls: N, S, E, W with their outward normals (used for the fade)
    const wt = this.tex(design.wall).clone();
    wt.needsUpdate = true;
    wt.repeat.set(Math.max(W, D) * 100 / tileSizeCm(design.wall), WALL_H * 100 / tileSizeCm(design.wall));
    if (this.wallMat.map) this.wallMat.map.dispose();
    this.wallMat.map = wt; this.wallMat.needsUpdate = true;
    this.walls = [];
    const defs = [
      { w: W + WALL_T * 2, x: 0, z: -D / 2 - WALL_T / 2, n: new THREE.Vector3(0, 0, -1) },
      { w: W + WALL_T * 2, x: 0, z: D / 2 + WALL_T / 2, n: new THREE.Vector3(0, 0, 1) },
      { w: D, x: W / 2 + WALL_T / 2, z: 0, n: new THREE.Vector3(1, 0, 0), rot: true },
      { w: D, x: -W / 2 - WALL_T / 2, z: 0, n: new THREE.Vector3(-1, 0, 0), rot: true },
    ];
    for (const def of defs) {
      const geo = def.rot ? new THREE.BoxGeometry(WALL_T, WALL_H, def.w) : new THREE.BoxGeometry(def.w, WALL_H, WALL_T);
      const m = new THREE.Mesh(geo, this.wallMat.clone());
      m.position.set(def.x, WALL_H / 2, def.z);
      m.castShadow = true; m.receiveShadow = true;
      m.userData.n = def.n;
      this.roomGroup.add(m); this.walls.push(m);
    }
    // frame the camera to the room size
    const r = Math.max(W, D);
    this.controls.target.set(0, 0.6, 0);
    this.controls.maxDistance = r * 3.2;
    if (!this.framed) {
      this.camera.position.set(r * 0.95, r * 1.25, r * 1.35);
      this.framed = true;
    }
    this.sun.shadow.camera.left = -r; this.sun.shadow.camera.right = r;
    this.sun.shadow.camera.top = r; this.sun.shadow.camera.bottom = -r;
    this.sun.shadow.camera.updateProjectionMatrix();
    this.dirty = true;
  }

  /**
   * What: sync the whole design (room + pieces) into the scene.
   * In:  design object, selectedId (string|null)
   * Out: —
   */
  set(design, selectedId) {
    this.design = design;
    this.buildRoom(design);
    const W = design.room.w, D = design.room.d;
    const seen = new Set();
    for (const it of design.items) {
      seen.add(it.id);
      const cat = CATALOGUE.find((c) => c.type === it.type);
      const k = it.type;
      let rec = this.pieces.get(it.id);
      // create new pieces lazily
      if (!rec || rec.key !== k) {
        if (rec) { this.itemsGroup.remove(rec.group); disposePiece(rec.group); }
        rec = { group: buildPiece(it.type, cat.w, cat.d), key: k };
        this.itemsGroup.add(rec.group);
        this.pieces.set(it.id, rec);
      }
      rec.group.position.set((it.x - W / 2) / 100, 0, (it.y - D / 2) / 100);
      rec.group.rotation.y = -THREE.MathUtils.degToRad(it.rot);
    }
    // remove deleted pieces
    for (const [id, rec] of this.pieces) {
      if (!seen.has(id)) { this.itemsGroup.remove(rec.group); disposePiece(rec.group); this.pieces.delete(id); }
    }
    this.select(selectedId);
    this.dirty = true; this.kick();
  }

  /**
   * What: move the selection ring under a piece.
   * In:  id (string|null)
   * Out: —
   */
  select(id) {
    const it = this.design && this.design.items.find((i) => i.id === id);
    if (!it) { this.ring.visible = false; this.dirty = true; return; }
    const cat = CATALOGUE.find((c) => c.type === it.type);
    const r = Math.hypot(cat.w, cat.d) / 200 + 0.08;
    this.ring.scale.set(r, r, 1);
    this.ring.position.x = (it.x - this.design.room.w / 2) / 100;
    this.ring.position.z = (it.y - this.design.room.d / 2) / 100;
    this.ring.visible = true; this.dirty = true; this.kick();
  }

  /**
   * What: fade walls that stand between the camera and the room centre.
   * In:  —
   * Out: —
   */
  fadeWalls() {
    if (!this.walls) return;
    const dir = new THREE.Vector3().subVectors(this.camera.position, this.controls.target).setY(0).normalize();
    for (const w of this.walls) {
      const facing = w.userData.n.dot(dir);  // >0 = wall is on the camera side
      const target = facing > 0.25 ? 0.0 : facing > -0.05 ? 0.35 : 1;
      w.material.opacity = target;
      w.visible = target > 0.01;
      w.castShadow = target > 0.5;
    }
  }

  /**
   * What: start / stop the render loop (called by the planner screen).
   * In:  on (boolean)
   * Out: —
   */
  setActive(on) { this.active = on; this.kick(); }

  /**
   * What: ensure a frame is scheduled when active + visible.
   * In:  —
   * Out: —
   */
  kick() {
    if (this.raf || !this.active || !this.visible || document.hidden) return;
    this.raf = requestAnimationFrame(this.loop);
  }

  /**
   * What: one animation frame — update controls, render only when dirty.
   * In:  —
   * Out: —
   */
  loop() {
    this.raf = 0;
    if (!this.active || !this.visible || document.hidden) return;
    const moved = this.controls.update();
    if (moved || this.dirty) {
      this.fadeWalls();
      this.renderer.render(this.scene, this.camera);
      this.dirty = false;
    }
    this.raf = requestAnimationFrame(this.loop);
  }

  /**
   * What: release every GPU resource and observer.
   * In:  —
   * Out: —
   */
  destroy() {
    this.active = false;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect(); this.io.disconnect();
    this.controls.dispose();
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); }
    });
    if (this.texCache) this.texCache.forEach((t) => t.dispose());
    this.envTex.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
