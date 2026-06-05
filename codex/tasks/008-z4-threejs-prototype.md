# Task 008 — Z4 Three.js first-person prototype

Status: implemented as first prototype in `z4.html`, `src/z4-viewer.ts`, and `src/z4-viewer.css`.

## Goal

Load the Z4 geometry bridge export and render a first-person prototype using Three.js.

## Implemented now

- New page: `z4.html`.
- Loads `public/generated/z4.geometry-v0.json`.
- Generates floor meshes from `walkable_areas`.
- Generates wall meshes from `wall_segments`.
- Shows translucent door portal markers from `door_portals`.
- Generates simple prop boxes from `props`.
- Spawns player from `player_spawn`.
- Basic WASD + mouse pointer-lock movement.
- Basic collision against walkable polygons, wall segments and prop bboxes.
- Door portals can suppress nearby wall collision.

## How to run

```bash
npm install
npm run export:z4-geometry
npm run dev
```

Open:

```text
http://localhost:5173/z4.html
```

## Controls

- Click the canvas or button to enter first-person mode.
- `WASD` move.
- Mouse look.
- `Shift` faster movement.
- `Esc` releases pointer lock.

## Current limitations

- Geometry is based on candidate polygons, not final CAD.
- Wall openings are approximate.
- The first collision system is intentionally simple.
- Props are simple boxes.
- No ceiling, doors, materials or lab-specific 3D models yet.
- Generated geometry file must be created locally with `npm run export:z4-geometry` before opening the page.

## Next acceptance criteria

- Generate and commit a small demo geometry fixture for CI/dev convenience, or auto-generate before dev preview.
- Add minimap/debug top-down overlay to the 3D prototype.
- Split wall segments at door portals instead of relying only on collision suppression.
- Add room-name HUD based on current polygon containment.
- Add reset-to-spawn button.
- Add separate first-person and top-down debug cameras.
