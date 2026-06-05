# Task 006 — Z4 annotation mode

Status: implemented as first interactive pass in `src/main.ts` and `src/style.css`.

## Goal

Allow a human reviewer to correct Z4 room polygon points and door endpoints directly in the browser before the data is used to generate first-person 3D geometry.

## Implemented now

- `annotation mode` toggle.
- Draggable room polygon handles.
- Draggable door endpoint handles.
- Live JSON patch textarea.
- `export JSON patch` button.
- `copy patch` button.
- Patch format keeps normalized image coordinates.

## Current patch format

```json
{
  "schema_version": "plan5f.annotation_patch.v1",
  "zone": "Z4",
  "coordinate_system": "normalized_image_coordinates",
  "room_polygon_candidates": [],
  "door_candidates": []
}
```

## How to test locally

```bash
git pull
npm install
npm run dev
```

Optional local-only background image:

```bash
mkdir -p public/source
cp /path/to/rendered-plan5f.png public/source/plan5f.png
```

Then open the app, enable `annotation mode`, drag room/door handles, and press `copy patch`.

## Next acceptance criteria

- Add apply-patch script that merges exported patch into `public/data/plan5f.manual-v0.json`.
- Add visual labels for each candidate id in overlay.
- Add undo/reset for the current annotation session.
- Add equipment bbox editing.
- Add validation of patch coordinate ranges.
