# Task 005 — Z4 overlay review UI

Status: implemented as interactive review pass in `src/main.ts` and `src/style.css`.

## Goal

Render the Z4 extraction candidates visually so humans can quickly see whether room polygons, door portals, equipment boxes and graph edges look plausible before Codex generates 3D geometry.

## Implemented now

- Full-plan normalized zone bbox view.
- Optional local image layer for full plan and Z4 crop.
- Z4 candidate overlay canvas.
- Room polygon candidates as SVG polygons.
- Door candidates as SVG lines.
- Equipment candidates as HTML overlay boxes.
- Navigation graph side panel.
- Tables for Z4 room, door and equipment candidate data.
- Confidence filters: high, medium, low, unknown.
- Priority filter: show priority <= 1/2/3/all.
- Background image toggle.
- Click candidate to copy id.

## Background image handling

The repo is public, so no sensitive floorplan image is committed. The overlay will try to load:

```text
public/source/plan5f.png
```

The app uses it as a full-plan background and crops it to Z4 using the Z4 normalized bbox. If the file is missing, the UI keeps the grid placeholder.

## How to test locally

```bash
git pull
npm install
npm run dev
```

Optional local-only step:

```bash
mkdir -p public/source
cp /path/to/rendered-plan5f.png public/source/plan5f.png
```

## Next acceptance criteria

- Add an annotation mode for moving polygon points and door endpoints.
- Add JSON patch export for corrected coordinates.
- Add a visual warning when local image aspect ratio does not match source expectations.
- Add a keyboard shortcut to hide low-confidence candidates.
