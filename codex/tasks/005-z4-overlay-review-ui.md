# Task 005 — Z4 overlay review UI

Status: implemented as first pass in `src/main.ts` and `src/style.css`.

## Goal

Render the Z4 extraction candidates visually so humans can quickly see whether room polygons, door portals, equipment boxes and graph edges look plausible before Codex generates 3D geometry.

## Implemented now

- Full-plan normalized zone bbox view.
- Z4 candidate overlay canvas.
- Room polygon candidates as SVG polygons.
- Door candidates as SVG lines.
- Equipment candidates as HTML overlay boxes.
- Navigation graph side panel.
- Tables for Z4 room, door and equipment candidate data.

## Background image handling

The repo is public, so no sensitive floorplan image is committed. The overlay currently shows a grid placeholder. For local work, add a rendered floorplan image under:

```text
public/source/plan5f.png
```

Then wire it into the canvas background in a later task.

## Next acceptance criteria

- Add a toggle for showing/hiding the local image background.
- Add click-to-copy candidate id.
- Add candidate filtering by confidence and priority.
- Add export of corrected coordinates from annotation mode.
