# Task 001 — Add floorplan background to review UI

Add support for showing the rendered floorplan image behind zone overlays.

## Requirements

- Put source image under `public/source/` locally; do not commit sensitive source if repo is public.
- Add a toggle to show/hide background image.
- Draw normalized zone bounding boxes from `plan5f.manual-v0.json` on top.
- Keep all code typed.

## Acceptance criteria

- `npm run dev` shows the plan background.
- Each zone bbox appears in approximately the right place.
- No image path is hardcoded outside config/data.
