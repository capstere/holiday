import fs from 'node:fs';
import path from 'node:path';

const [, , planPathArg, patchPathArg] = process.argv;

if (!planPathArg || !patchPathArg) {
  console.error('Usage: node scripts/apply-annotation-patch.mjs public/data/plan5f.manual-v0.json path/to/annotation-patch.json');
  process.exit(1);
}

const planPath = path.resolve(planPathArg);
const patchPath = path.resolve(patchPathArg);

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`Could not read JSON from ${filePath}: ${error.message}`);
    process.exit(1);
  }
}

function assertCoordinate(value, context) {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0 || value > 1) {
    throw new Error(`${context} must be a number in the normalized range 0..1. Got ${JSON.stringify(value)}`);
  }
}

function assertPoint(point, context) {
  if (!Array.isArray(point) || point.length !== 2) {
    throw new Error(`${context} must be a [x, y] point.`);
  }
  assertCoordinate(point[0], `${context}[0]`);
  assertCoordinate(point[1], `${context}[1]`);
}

function assertPolygon(points, context) {
  if (!Array.isArray(points) || points.length < 3) {
    throw new Error(`${context} must contain at least 3 points.`);
  }
  points.forEach((point, index) => assertPoint(point, `${context}[${index}]`));
}

function assertLine(line, context) {
  if (!Array.isArray(line) || line.length !== 2) {
    throw new Error(`${context} must contain exactly 2 points.`);
  }
  line.forEach((point, index) => assertPoint(point, `${context}[${index}]`));
}

function validatePatch(patch) {
  if (patch.schema_version !== 'plan5f.annotation_patch.v1') {
    throw new Error(`Unsupported patch schema_version: ${patch.schema_version}`);
  }

  if (patch.zone !== 'Z4') {
    throw new Error(`This first merge script only accepts Z4 patches. Got ${patch.zone}`);
  }

  for (const room of patch.room_polygon_candidates ?? []) {
    if (!room.id) throw new Error('room_polygon_candidates item missing id');
    assertPolygon(room.normalized_polygon, `room_polygon_candidates/${room.id}/normalized_polygon`);
  }

  for (const door of patch.door_candidates ?? []) {
    if (!door.id) throw new Error('door_candidates item missing id');
    assertLine(door.normalized_line, `door_candidates/${door.id}/normalized_line`);
    if (door.width_m_estimate !== undefined && (typeof door.width_m_estimate !== 'number' || door.width_m_estimate <= 0)) {
      throw new Error(`door_candidates/${door.id}/width_m_estimate must be a positive number when provided.`);
    }
  }
}

function mergeById(targetItems, patchItems, mergeFields) {
  const targetById = new Map(targetItems.map((item) => [item.id, item]));
  const changed = [];
  const missing = [];

  for (const patchItem of patchItems ?? []) {
    const target = targetById.get(patchItem.id);
    if (!target) {
      missing.push(patchItem.id);
      continue;
    }

    for (const field of mergeFields) {
      if (patchItem[field] !== undefined) {
        target[field] = patchItem[field];
      }
    }
    target.last_annotation_patch_applied_at = new Date().toISOString();
    target.confidence = target.confidence === 'low' ? 'medium' : target.confidence;
    changed.push(patchItem.id);
  }

  return { changed, missing };
}

const plan = readJson(planPath);
const patch = readJson(patchPath);

try {
  validatePatch(patch);

  const roomResult = mergeById(
    plan.room_polygon_candidates ?? [],
    patch.room_polygon_candidates ?? [],
    ['normalized_polygon'],
  );

  const doorResult = mergeById(
    plan.door_candidates ?? [],
    patch.door_candidates ?? [],
    ['normalized_line', 'width_m_estimate'],
  );

  plan.schema_version = '0.2.1';
  plan.annotation_history = Array.isArray(plan.annotation_history) ? plan.annotation_history : [];
  plan.annotation_history.push({
    applied_at: new Date().toISOString(),
    patch_file: path.relative(process.cwd(), patchPath),
    zone: patch.zone,
    room_polygon_candidates_changed: roomResult.changed,
    door_candidates_changed: doorResult.changed,
    missing_room_polygon_candidates: roomResult.missing,
    missing_door_candidates: doorResult.missing,
  });

  fs.writeFileSync(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');

  console.log('Annotation patch applied.');
  console.log(`Rooms changed: ${roomResult.changed.length}`);
  console.log(`Doors changed: ${doorResult.changed.length}`);

  if (roomResult.missing.length || doorResult.missing.length) {
    console.warn('Some patch ids were not found in the plan model:');
    for (const id of roomResult.missing) console.warn(`- missing room candidate: ${id}`);
    for (const id of doorResult.missing) console.warn(`- missing door candidate: ${id}`);
  }
} catch (error) {
  console.error(`Patch validation/merge failed: ${error.message}`);
  process.exit(1);
}
