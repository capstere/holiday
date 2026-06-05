# Task 002 — Room polygon annotation

Create a lightweight annotation mode for room polygons.

## Requirements

- Click to add polygon points.
- Assign polygon to an existing room id.
- Save/export JSON patch.
- Do not mutate source data silently.

## Acceptance criteria

- A user can annotate one room and export polygon points.
- Coordinates are normalized `[0..1]`.
- Export validates against the plan model extension.
