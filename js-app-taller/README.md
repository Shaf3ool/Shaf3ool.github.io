# Taller · Js Interiorismo (app prototype, idea 3)

Live: https://shaf3ool.github.io/js-app-taller/

This is an installable **web prototype (PWA)**, not an App Store app. The client sets the room size,
places products from Jorge's catalogue and works in **three linked 2D orthographic projections**:
**Planta** (plan), **Alzado frontal** (front elevation) and **Alzado lateral** (side elevation).
When he's done, he saves the projections to "Mis proyectos" and sends them to Jorge.
All data is **Demo**: the catalogue sizes are typical market sizes, not Jorge's stock, and Jorge's
contact is a placeholder. "Enviar a Jorge" sends nothing; the app says so.
No 3D rendering and no WebGL: everything is flat SVG line drawing.

Concept by Shaf3ool · Renders © Jorge Santana / Js Interiorismo

## Saved-project JSON (shared with js-app-combinar)

All values are in **centimetres**.

```json
{
  "room":  { "w": 480, "l": 620, "h": 270 },
  "items": [
    { "name": "Sofá 3 plazas", "x": 130, "y": 250, "w": 220, "d": 95, "h": 85,
      "rot": 180, "color": "#E4D9C6", "z": 0, "type": "sofa" }
  ]
}
```

The app also writes these optional extra keys, which an importer can ignore:
`version`, `app: "js-app-taller"`, `demo: true`, `name`, `savedAt`.

| Field | Meaning |
|---|---|
| `room.w` | inner width, along x (plan: to the right) |
| `room.l` | inner length, along y (plan: downward) |
| `room.h` | floor-to-ceiling height, along z |
| `x, y` | top-left corner of the item's footprint at `rot = 0`, so the rectangle runs `x..x+w`, `y..y+d`. The origin (0,0) is the inner top-left corner of the room. The back wall is at y=0, the front at y=l, the left wall at x=0 and the right at x=w. |
| `w, d, h` | the item's width, depth and height (taken from the product) |
| `rot` | degrees, clockwise in the plan, about the footprint centre `(x+w/2, y+d/2)`. At 0° the item's front faces +y. |
| `color` | hex fill of the main material |
| `z` *(optional)* | the height of the item's base above the floor; 0 for floor pieces. It's used for wall shelves, art and pendant lamps. |
| `type` *(optional)* | the catalogue symbol key: `sofa, sillon, mesac, tapete, cama, buro, mesa, silla, closet, isla, banco, librero, mueblet, planta, repisa, cuadro, lampara` |

Where the views are seen from:
- **Alzado frontal (A)**: the viewer stands at y=l and looks toward the y=0 wall. Horizontal = x (left to right); vertical = z.
- **Alzado lateral (B)**: the viewer stands at x=w and looks toward the x=0 wall. Horizontal = u = l − y, so y=l is on the left and y=0 on the right; vertical = z.

In the plan, markers **A** and **B** show where each viewer stands.

Storage: `localStorage["taller.projects.v1"]` holds `[{ id, savedAt, data }]` (data is the JSON above).
`localStorage["taller.draft.v1"]` holds the working draft.

## How the projections are computed (exactly as implemented)

1. **One source of truth.** `state.js` holds `{room, items}`. Every change calls `emit()`, and
   `draw.js` re-renders **all** projections from that same data on the next animation frame. The phone
   draws the active view; wide screens draw the full sheet with the 3 views.
2. **Planta** draws `(x, y)` from above. Each item is an SVG group with
   `translate(cx, cy) rotate(rot)` and a top-view symbol (`symbols.js · planSymbol`). Walls are a
   15 cm solid poché ring. The floor has a plank pattern, and there are overall dimension lines with
   45° ticks. The selected item shows live distances to the 4 walls. Wall and ceiling pieces (shelf,
   art, lamp) are dashed, because they sit above the plan's cut plane.
3. **Rotation in the elevations.** A rotated item is projected through its **rotated bounding box**:
   `extentX = w·|cos θ| + d·|sin θ|` and `extentY = w·|sin θ| + d·|cos θ|` around the centre
   (`geometry.js · bbox`).
4. **Alzado frontal** projects onto `(x, z)`: `u0..u1 = bbox.x0..bbox.x1` and `z0..z1 = z..z+h`.
   **Alzado lateral** projects onto `(y, z)` as seen from the right: `u0..u1 = (l − bbox.y1)..(l − bbox.y0)`.
5. **Painter's order.** In each elevation the items are sorted by depth, **farthest first**: the
   front view uses the bbox-centre y ascending, the side view uses the bbox-centre x ascending.
   Nearer pieces are drawn over farther ones, so opaque fills hide what's behind them.
6. **Profiles.** The item's facing vector `(−sin θ, cos θ)` decides whether a view sees its front,
   its back or its flank. `elevSymbol` then draws the matching profile: sofa seat, backrest and arms;
   bed headboard and mattress; table top and legs; closet doors; shelves; a pendant on its cable from
   the ceiling; and so on.
7. **Dragging.** On every pointer move, the pointer's screen pixels are converted to cm through the
   inverse screen matrix of that view's SVG group (`getScreenCTM().inverse()`), which is the scale
   factor. Positions **snap to 5 cm** and are **clamped inside the room** using the rotated bounding
   box (`clampItem`).
   - Plan: drag moves x and y. The round handle rotates the item (snaps to 15°), and "Girar" rotates it 90°.
   - Front elevation: horizontal drag moves x. Side elevation: horizontal drag moves y (inverted, since u = l − y).
   - Vertical drag in an elevation changes `z`, but only for wall or ceiling pieces. Floor pieces stay on the floor, and the app says so.
   - Because the 3 views share one state, moving an object in any view updates the other two at once.
8. **Room size.** Sliders and number inputs set the width (200–1200), length (200–1500) and height
   (220–400 cm). Every item is re-clamped when the room changes.
9. **Guardar** stores the JSON in localStorage ("Mis proyectos", with a plan thumbnail).
   **Exportar** offers: the full sheet as SVG (fonts embedded), the full sheet as PNG (3000 px), the
   3 views as separate PNGs, and the project JSON.
10. **Enviar a Jorge (Demo)** shows the 3 views and a message field. On send it saves locally and
    states clearly that nothing was sent.

## Files

`index.html`, `css/app.css`, and these modules in `js/`:
- `app.js`: UI glue
- `state.js`: state, persistence
- `geometry.js`: projection maths
- `draw.js`: the SVG views and the sheet
- `symbols.js`: plan and elevation symbols
- `interact.js`: dragging
- `export.js`: SVG, PNG and JSON export
- `catalog.js`: the Demo products and finishes
- `i18n.js`: ES-MX and EN text
- `ui.js`: sheets and toast

Also `sw.js` (offline), `manifest.webmanifest`, and `img/loft-1-sm.webp` (Jorge's render, credited).
