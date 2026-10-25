# Combinar vistas · Js Interiorismo (concept)

Designer-side prototype (installable PWA / web prototype — **not** an App Store or Google Play app).
It loads the three orthographic views of a room — **Planta**, **Alzado frontal**, **Alzado lateral** —
computes the volumes and draws a clean **isometric** SVG illustration you can turn in 90° steps,
export (PNG / SVG) and "share with the client" (**Demo**: nothing reaches any real client).

Live: https://shaf3ool.github.io/js-app-combinar/ · Concept by Shaf3ool · Renders © Jorge Santana / Js Interiorismo.
All projects are **Demo** data. No WebGL, no three.js, no 3D rendering: computed geometry drawn as 2D SVG.

## Project format (cm) — shared with js-app-taller

```json
{
  "room":  { "w": 420, "l": 380, "h": 270 },
  "items": [ { "name": "Sofá", "x": 40, "y": 120, "w": 220, "d": 95, "h": 80, "rot": 0, "color": "#E9DFCF" } ]
}
```

- Origin (0,0) = inner top-left corner of the room in the plan. `x` runs along the width `w` (right),
  `y` along the length `l` (down in the plan). Back wall at y=0, front wall at y=l, left wall x=0, right wall x=w.
- `(x, y)` = top-left corner of the item's footprint at rot 0 → the rectangle runs x..x+w, y..y+d.
- `rot` = degrees, clockwise in the plan, about the footprint centre (x+w/2, y+d/2).
- `h` = height. Optional `z` = height of the base above the floor (wall cabinets, shelves). Optional `type`
  (sofa, cama, mesa, closet, isla, planta, tapete…). Optional `room.floor` / `room.wall` colours.
- Extra keys (version, app, name, savedAt, demo) are accepted; `name` is shown as the project title.
- Alzado frontal: viewer at y=l looking toward y=0 → horizontal = x, vertical = z.
- Alzado lateral: viewer at x=w looking toward x=0 → horizontal = y (y=l on the left), vertical = z.

## How the merge works (exactly as implemented — `js/geometry.js`, `js/render.js`)

1. **Volumes from the three views.** Each item becomes a cuboid: footprint x, y, w, d (+ rot) from the
   **plan**; base z and height h from the **elevations**. For readability some catalogue types are split
   into a few cuboids (sofa = seat + back + 2 arms; bed = frame + mattress + headboard + pillows; table /
   stool / chair = top + legs; kitchen = base + countertop). Plants are a small 8-sided pot + circular
   foliage; a floor lamp has a 12-sided shade. Doors on closets/kitchens are lines on the front face.
2. **Rotation.** The 90° buttons turn the plan coordinates around the room centre (w/2, l/2) *before*
   projecting (animated through the in-between angles).
3. **Isometric projection** of every vertex (x, y, z):
   `X = (x − y) · cos 30°`, `Y = (x + y) · sin 30° − z`, then scaled to fit the screen.
4. **Visible faces.** For each cuboid: the top (lighter tone of the material colour) and the side faces
   whose turned normal points toward the viewer (`nx + ny > 0`) — at 0° these are the +x and +y faces,
   drawn darker (left side ×0.92, right side ×0.80) in the material colour.
5. **Painter's algorithm.** Solids are sorted by depth `x + y + z` of their centre (after rotation),
   farthest first. Draw order: floor (+ plank lines, slab section) → cut-away front walls as hatched
   footprints → soft shadows → the **2 back walls** (full height, hatched cut top) → furniture.
6. **Merge animation.** Every face polygon starts in the 2D view it belongs to — top faces in the
   Planta, +y faces in the Alzado frontal, +x faces in the Alzado lateral (back walls = the elevation
   backgrounds, floor = the plan) — and each vertex is **linearly interpolated** from its 2D-view position
   to its isometric position (eased, plan first, then front, then side).
7. **Output** is a clean SVG; PNG export rasterises the same SVG (1600×1200 sheet with a title block).

## Files

- `index.html`, `css/app.css` — shell, phone frame on desktop
- `js/data.js` — 3 Demo projects + validation of imported JSON
- `js/geometry.js` — items → solids, isometric camera, depth, shading
- `js/render.js` — the 3 view drawings (cards) and the isometric / merge frames
- `js/merge.js` — merge screen: animation, 90° turns, export, share (Demo)
- `js/share.js` — SVG/PNG export, view links (`#v=…` carries the project in the URL; nothing is uploaded)
- `js/editor.js` — edit dimensions, import JSON · `js/store.js` — localStorage · `js/i18n.js` — ES-MX / EN
- `sw.js`, `manifest.webmanifest` — offline PWA
