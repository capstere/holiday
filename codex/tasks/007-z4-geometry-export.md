# Task 007 — Z4 geometry export

Status: implemented as first bridge exporter in `scripts/export-z4-geometry.mjs`.

## Goal

Convert the reviewed Z4 extraction candidates into a small metric bridge format that a Three.js first-person prototype can consume.

The exporter does **not** create final CAD geometry. It creates a first pass for:

- `walkable_areas`
- `wall_segments`
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

## Important limitations

- Scale is estimated, not CAD-locked.
- Wall segments are polygon edges from candidate room polygons.
- Door portals are exported separately and downstream 3D generation must cut/ignore wall collision at those portal locations.
- Equipment props are bbox-based approximations.
- Everything depends on the current annotation quality.

## Next acceptance criteria

- Build a Three.js scene loader that consumes `public/generated/z4.geometry-v0.json`.
- Generate floor mesh from `walkable_areas`.
- Generate wall meshes from `wall_segments`.
- Use `door_portals` to remove or skip wall collision near openings.
- Generate simple prop boxes from `props`.
- Spawn player at `player_spawn`.
- Add top-down debug overlay for geometry export.
