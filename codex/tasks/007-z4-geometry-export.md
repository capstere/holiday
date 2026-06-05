# Task 007 — Z4 geometry export

Status: implemented as bridge exporter v1 in `scripts/export-z4-geometry.mjs`.

## Goal

Convert the reviewed Z4 extraction candidates into a small metric bridge format that a Three.js first-person prototype can consume.

The exporter does **not** create final CAD geometry. It creates a first pass for:

- `walkable_areas`
- `wall_segments`
- `wall_openings`
- `door_portals`
- `props`
- `navigation_graph`
- `player_spawn`

## Command

```bash
npm run export:z4-geometry
```

Default output:

```text
public/generated/z4.geometry-v0.json
```

Custom command:

```bash
node scripts/export-z4-geometry.mjs public/data/plan5f.manual-v0.json public/generated/z4.geometry-v0.json
```

## Implemented now

- Converts Z4 room candidate polygons into metric `walkable_areas`.
- Converts Z4 door candidates into metric `door_portals`.
- Converts Z4 equipment candidates into metric `props`.
- Exports player spawn from the CM room centroid.
- Exports the Z4 navigation graph.
- Splits room polygon edges into `wall_segments`.
- Cuts approximate openings at nearby `door_portals`.
- Documents removed spans as `wall_openings`.

## Door splitting behavior

The exporter projects each door portal center onto each candidate wall edge for rooms listed in `between_room_ids`. If the portal is close enough to the edge, the wall is split into before/after wall segments and the removed span is stored in `wall_openings`.

This is still approximate because the current room polygons and door lines are visual candidates, not CAD geometry.

## Important limitations

- Scale is estimated, not CAD-locked.
- Wall segments are polygon edges from candidate room polygons.
- Door openings are approximate and depend on current door candidate position.
- Equipment props are bbox-based approximations.
- Everything depends on the current annotation quality.

## Next acceptance criteria

- Generate a small checked-in demo geometry fixture, or generate geometry as part of dev/build flow.
- Add validation for `wall_openings` and door/edge consistency.
- Add visual wall-opening debug overlay to the review UI.
- Add wall-opening debug rendering to the Three.js minimap.
- Add material categories for labs, corridors, doors and props.
