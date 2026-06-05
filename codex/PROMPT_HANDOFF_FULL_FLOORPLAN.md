# Codex handoff prompt — rebuild Plan 5F into a real walkable first-person simulator

Use this prompt when handing the repository and the actual floorplan image/PDF to Codex.

---

## Prompt to Codex

You are taking over an existing prototype repository:

```text
https://github.com/capstere/holiday
```

The current repository contains an early scaffold for a Plan 5F first-person simulator. Treat it as a starting point only. The current geometry is rough and not good enough. Your task is to make this actually work as a realistic, walkable first-person simulator from the provided floorplan.

The user will provide the actual Plan 5F floorplan image/PDF. Use that file as the source of truth.

## High-level objective

Create a working first-person open-world indoor simulator of the full Plan 5F floorplan where the user can walk through corridors, rooms, slusses/airlocks, labs, offices and storage areas at realistic scale.

The result must be practical and testable, not just a visual mockup.

## Current repo state

Important existing files:

```text
README.md
bootstrap-mac.sh
bootstrap-windows.ps1
package.json
index.html
z4.html
src/main.ts
src/z4-viewer.ts
src/style.css
src/z4-viewer.css
public/data/plan5f.manual-v0.json
scripts/play.mjs
scripts/export-z4-geometry.mjs
scripts/apply-annotation-patch.mjs
docs/ZONE_BY_ZONE_REVIEW.md
codex/tasks/*.md
```

The current prototype has:

- Vite + TypeScript + Three.js
- a review/annotation UI
- a rough Z4 first-person prototype
- rough geometry candidates
- local bootstrap scripts

But the current geometry is not reliable enough. You may refactor or replace the geometry pipeline if needed.

## Non-negotiable requirements

1. Do not treat text, furniture, lab benches, equipment labels, door swing arcs, or symbols as walls.
2. Doors must become passable openings/portals, not walls.
3. Corridors must connect rooms correctly.
4. Rooms must be walkable unless they are clearly technical/blocked areas.
5. Lab equipment, benches, freezers, LAF benches, shelves and similar items should become props/colliders, not structural walls.
6. The simulator must run with one command:

```bash
npm run play
```

7. The app must have a first-person mode with WASD + mouse look.
8. The app must include a debug/minimap mode so the user can see extracted geometry.
9. The app must remain usable without committing the sensitive source floorplan to the public repository.
10. If something cannot be extracted confidently, mark it as low-confidence and expose it in debug UI rather than silently guessing.

## Recommended approach

### Phase 1 — Inspect and stabilize

- Clone/read the repo.
- Run:

```bash
npm install
npm run play
npm run build
```

- Fix any install/build/runtime errors first.
- Preserve or improve the one-command bootstrap flow.

### Phase 2 — Use the provided plan file as source of truth

The user will attach the real Plan 5F floorplan. Use it to rebuild geometry.

Extract or manually encode:

- global scale
- outer boundary
- corridor network
- room polygons
- wall segments
- door portals/openings
- emergency exits
- important props/colliders
- labels/room names

If automated extraction is unreliable, create a robust semi-manual pipeline: clean JSON + debug overlay + visible confidence levels.

### Phase 3 — Build full-plan geometry

Replace the current Z4-only assumption with a full-plan geometry model.

Suggested output format:

```text
public/generated/plan5f.geometry.json
```

It should include:

```json
{
  "schema_version": "plan5f.geometry.v1",
  "units": "meters",
  "world": {},
  "walkable_areas": [],
  "wall_segments": [],
  "door_portals": [],
  "wall_openings": [],
  "props": [],
  "labels": [],
  "navigation_graph": {},
  "player_spawns": []
}
```

### Phase 4 — Replace/extend the viewer

Create a full-plan first-person viewer, for example:

```text
play.html
src/play-viewer.ts
```

It should load the full-plan geometry, not only Z4.

Required features:

- first-person movement
- collision against walls and collidable props
- door openings are passable
- reset to spawn
- minimap
- room-name HUD
- debug toggles for walls, doors, openings, props, collision, confidence
- visible low-confidence geometry

### Phase 5 — Make it testable

Add or update scripts:

```json
{
  "play": "...",
  "build": "...",
  "validate:plan": "...",
  "export:geometry": "..."
}
```

`npm run play` should work on a fresh checkout after `npm install`.

`npm run build` should pass.

## Acceptance criteria

The task is successful when:

1. A fresh checkout can run:

```bash
npm install
npm run play
```

2. The browser opens a playable first-person Plan 5F prototype.
3. The user can walk through the main corridor network and enter multiple rooms across the plan.
4. Doors/openings are passable.
5. Walls block the player.
6. Major props/colliders are visible and block movement where appropriate.
7. The minimap/debug view makes it obvious what geometry was extracted.
8. The source floorplan is not committed if it is sensitive.
9. The repository includes clear instructions for Mac and Windows users.
10. The final response explains what was changed, how to run it, and what remains approximate.

## Constraints

- Use TypeScript and Three.js unless there is a strong reason to change.
- Keep the local bootstrap scripts working.
- Avoid adding heavy frameworks unless necessary.
- Keep geometry data human-readable JSON.
- Do not fake accuracy. Mark uncertain geometry as low confidence.
- Do not remove useful documentation unless replacing it with better documentation.

## Important note

The current Z4 implementation is allowed to be replaced. It is a rough prototype only. The priority is a correct, walkable full-plan experience based on the actual floorplan the user provides.
