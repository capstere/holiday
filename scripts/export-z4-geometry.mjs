import fs from 'node:fs';
import path from 'node:path';

const [, , planPathArg = 'public/data/plan5f.manual-v0.json', outPathArg = 'public/generated/z4.geometry-v0.json'] = process.argv;

const planPath = path.resolve(planPathArg);
const outPath = path.resolve(outPathArg);

const DEFAULT_WORLD = {
  source_note: 'Coarse v0 export. Uses normalized plan coordinates and an estimated 10 m scale reference. Replace with CAD/PDF-verified metric scale before production use.',
  plan_width_m: 62,
  plan_height_m: 46.5,
  wall_height_m: 2.7,
  wall_thickness_m: 0.16,
  player_eye_height_m: 1.65,
  player_radius_m: 0.28,
  door_default_width_m: 0.9,
  door_opening_clearance_m: 0.22,
};

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`Could not read JSON from ${filePath}: ${error.message}`);
    process.exit(1);
  }
}

function round(value, digits = 3) {
  return Number(value.toFixed(digits));
}

function pointToMeters([x, y], world = DEFAULT_WORLD) {
  return [round(x * world.plan_width_m), round(y * world.plan_height_m)];
}

function distance(a, b) {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

function midpoint(a, b) {
  return [round((a[0] + b[0]) / 2), round((a[1] + b[1]) / 2)];
}

function lerpPoint(a, b, t) {
  return [round(a[0] + (b[0] - a[0]) * t), round(a[1] + (b[1] - a[1]) * t)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function segmentProjectionT(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return 0;
  return ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / lengthSq;
}

function distancePointToSegment(point, start, end) {
  const t = clamp(segmentProjectionT(point, start, end), 0, 1);
  return distance(point, lerpPoint(start, end, t));
}

function polygonArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    area += current[0] * next[1] - next[0] * current[1];
  }
  return round(Math.abs(area / 2));
}

function polygonCentroid(points) {
  const sum = points.reduce(
    (acc, point) => {
      acc[0] += point[0];
      acc[1] += point[1];
      return acc;
    },
    [0, 0],
  );
  return [round(sum[0] / points.length), round(sum[1] / points.length)];
}

function doorGapForEdge(door, start, end, edgeLength) {
  if (edgeLength < 0.01) return null;
  const centerT = segmentProjectionT(door.center_m, start, end);
  const perpendicularDistance = distancePointToSegment(door.center_m, start, end);
  const width = Math.max(door.width_m ?? DEFAULT_WORLD.door_default_width_m, DEFAULT_WORLD.door_default_width_m);
  const maxDistance = Math.max(width * 1.15, 1.1);

  if (centerT < -0.05 || centerT > 1.05) return null;
  if (perpendicularDistance > maxDistance) return null;

  const halfGapT = (width / 2 + DEFAULT_WORLD.door_opening_clearance_m) / edgeLength;
  return {
    door_portal_id: door.id,
    start_t: clamp(centerT - halfGapT, 0, 1),
    end_t: clamp(centerT + halfGapT, 0, 1),
    center_t: clamp(centerT, 0, 1),
    perpendicular_distance_m: round(perpendicularDistance),
    opening_width_m: round(width + DEFAULT_WORLD.door_opening_clearance_m * 2),
  };
}

function mergeGaps(gaps) {
  const sorted = gaps
    .filter((gap) => gap.end_t > gap.start_t)
    .sort((a, b) => a.start_t - b.start_t);

  const merged = [];
  for (const gap of sorted) {
    const last = merged[merged.length - 1];
    if (!last || gap.start_t > last.end_t) {
      merged.push({ ...gap, door_portal_ids: [gap.door_portal_id] });
      continue;
    }

    last.end_t = Math.max(last.end_t, gap.end_t);
    last.opening_width_m = round(last.opening_width_m + gap.opening_width_m);
    last.door_portal_ids.push(gap.door_portal_id);
  }
  return merged;
}

function createWallSegment({ id, room, sourceEdgeIndex, start, end, cutByDoorPortalIds = [] }) {
  const length = distance(start, end);
  if (length < 0.12) return null;

  return {
    id,
    room_candidate_id: room.id,
    source_room_id: room.source_room_id,
    source_edge_index: sourceEdgeIndex,
    start_m: start,
    end_m: end,
    length_m: round(length),
    height_m: DEFAULT_WORLD.wall_height_m,
    thickness_m: DEFAULT_WORLD.wall_thickness_m,
    cut_by_door_portal_ids: cutByDoorPortalIds,
    door_portal_ids_near_edge: cutByDoorPortalIds,
    confidence: room.confidence,
  };
}

function wallSegmentsForPolygon(room, points, doorPortals) {
  const segments = [];
  const openings = [];

  for (let i = 0; i < points.length; i += 1) {
    const start = points[i];
    const end = points[(i + 1) % points.length];
    const edgeLength = distance(start, end);
    const edgeId = `WALL-${room.id}-${String(i + 1).padStart(2, '0')}`;
    const matchingDoors = doorPortals.filter((door) => (door.between_room_ids ?? []).includes(room.source_room_id));
    const gaps = mergeGaps(matchingDoors.map((door) => doorGapForEdge(door, start, end, edgeLength)).filter(Boolean));

    if (!gaps.length) {
      const wholeSegment = createWallSegment({ id: edgeId, room, sourceEdgeIndex: i, start, end });
      if (wholeSegment) segments.push(wholeSegment);
      continue;
    }

    let cursor = 0;
    let partIndex = 0;
    for (const gap of gaps) {
      const beforeStart = lerpPoint(start, end, cursor);
      const beforeEnd = lerpPoint(start, end, gap.start_t);
      const beforeSegment = createWallSegment({
        id: `${edgeId}-P${String(partIndex + 1).padStart(2, '0')}`,
        room,
        sourceEdgeIndex: i,
        start: beforeStart,
        end: beforeEnd,
        cutByDoorPortalIds: gap.door_portal_ids,
      });
      if (beforeSegment) {
        segments.push(beforeSegment);
        partIndex += 1;
      }

      openings.push({
        id: `OPENING-${edgeId}-${String(openings.length + 1).padStart(2, '0')}`,
        room_candidate_id: room.id,
        source_room_id: room.source_room_id,
        source_edge_index: i,
        start_m: lerpPoint(start, end, gap.start_t),
        end_m: lerpPoint(start, end, gap.end_t),
        center_m: lerpPoint(start, end, gap.center_t),
        width_m: round(distance(lerpPoint(start, end, gap.start_t), lerpPoint(start, end, gap.end_t))),
        door_portal_ids: gap.door_portal_ids,
        confidence: room.confidence,
      });

      cursor = gap.end_t;
    }

    const afterStart = lerpPoint(start, end, cursor);
    const afterEnd = end;
    const afterSegment = createWallSegment({
      id: `${edgeId}-P${String(partIndex + 1).padStart(2, '0')}`,
      room,
      sourceEdgeIndex: i,
      start: afterStart,
      end: afterEnd,
      cutByDoorPortalIds: gaps.flatMap((gap) => gap.door_portal_ids),
    });
    if (afterSegment) segments.push(afterSegment);
  }

  return { segments, openings };
}

function validatePlan(plan) {
  if (!Array.isArray(plan.room_polygon_candidates)) {
    throw new Error('plan.room_polygon_candidates missing or not an array');
  }
  if (!Array.isArray(plan.door_candidates)) {
    throw new Error('plan.door_candidates missing or not an array');
  }
}

function exportZ4(plan) {
  validatePlan(plan);

  const z4 = plan.zones?.find((zone) => zone.id === 'Z4');
  const roomCandidates = plan.room_polygon_candidates.filter((candidate) => candidate.zone === 'Z4');
  const doorCandidates = plan.door_candidates.filter((candidate) => candidate.zone === 'Z4');
  const equipmentCandidates = (plan.equipment_candidates ?? []).filter((candidate) => candidate.zone === 'Z4');

  const walkableAreas = roomCandidates.map((room) => {
    const polygon = room.normalized_polygon.map((point) => pointToMeters(point));
    return {
      id: `WA-${room.id}`,
      room_candidate_id: room.id,
      source_room_id: room.source_room_id,
      label: room.label,
      polygon_m: polygon,
      centroid_m: polygonCentroid(polygon),
      area_m2_estimate: polygonArea(polygon),
      confidence: room.confidence,
      priority: room.priority,
      notes: room.notes,
    };
  });

  const doorPortals = doorCandidates.map((door) => {
    const line = door.normalized_line.map((point) => pointToMeters(point));
    return {
      id: `PORTAL-${door.id}`,
      door_candidate_id: door.id,
      type: door.type,
      between_room_ids: door.between ?? [],
      line_m: line,
      center_m: midpoint(line[0], line[1]),
      width_m: round(door.width_m_estimate ?? distance(line[0], line[1]) ?? DEFAULT_WORLD.door_default_width_m),
      emergency_exit: Boolean(door.emergency_exit),
      confidence: door.confidence,
      priority: door.priority,
      notes: door.notes,
    };
  });

  const splitResults = walkableAreas.flatMap((walkable) => {
    const room = roomCandidates.find((candidate) => candidate.id === walkable.room_candidate_id);
    if (!room) return [];
    return [wallSegmentsForPolygon(room, walkable.polygon_m, doorPortals)];
  });
  const wallSegments = splitResults.flatMap((result) => result.segments);
  const wallOpenings = splitResults.flatMap((result) => result.openings);

  const props = equipmentCandidates.map((equipment) => {
    const [x1, y1, x2, y2] = equipment.normalized_bbox;
    const min = pointToMeters([x1, y1]);
    const max = pointToMeters([x2, y2]);
    return {
      id: `PROP-${equipment.id}`,
      equipment_candidate_id: equipment.id,
      room_id: equipment.room_id,
      type: equipment.type,
      label: equipment.label,
      bbox_m: [min[0], min[1], max[0], max[1]],
      center_m: midpoint(min, max),
      size_m: [round(Math.abs(max[0] - min[0])), round(Math.abs(max[1] - min[1]))],
      collider_mode: equipment.collider_mode,
      collider: equipment.collider_mode !== 'none',
      height_m: equipment.collider_mode === 'solid_high' ? 1.9 : equipment.collider_mode === 'solid_medium' ? 1.2 : 0.9,
      confidence: equipment.confidence,
      priority: equipment.priority,
      notes: equipment.notes,
    };
  });

  const navGraph = plan.navigation_graph
    ? {
        ...plan.navigation_graph,
        nodes: plan.navigation_graph.nodes.filter((node) => node.zone === 'Z4'),
        edges: plan.navigation_graph.edges.filter((edge) => {
          const nodes = new Set(plan.navigation_graph.nodes.filter((node) => node.zone === 'Z4').map((node) => node.id));
          return nodes.has(edge.from) && nodes.has(edge.to);
        }),
      }
    : null;

  return {
    schema_version: 'plan5f.z4_geometry_export.v1',
    generated_at: new Date().toISOString(),
    source_plan: path.relative(process.cwd(), planPath),
    source_schema_version: plan.schema_version,
    zone: {
      id: 'Z4',
      name: z4?.name ?? 'Z4',
      normalized_bbox: z4?.normalized_bbox,
    },
    units: 'meters',
    coordinate_system: {
      type: '2d_metric_plan_space',
      origin: 'top-left of rendered full plan image',
      axes: { x: 'right', y: 'down' },
      warning: DEFAULT_WORLD.source_note,
    },
    world: DEFAULT_WORLD,
    player_spawn: {
      room_id: 'R-CM',
      position_m: walkableAreas.find((area) => area.source_room_id === 'R-CM')?.centroid_m ?? [0, 0],
      eye_height_m: DEFAULT_WORLD.player_eye_height_m,
      radius_m: DEFAULT_WORLD.player_radius_m,
      yaw_degrees: 0,
    },
    walkable_areas: walkableAreas,
    wall_segments: wallSegments,
    wall_openings: wallOpenings,
    door_portals: doorPortals,
    props,
    navigation_graph: navGraph,
    build_notes: [
      'This export is a bridge format for the first Three.js prototype.',
      'wall_segments are split at nearby door_portals to create approximate openings before 3D generation.',
      'wall_openings documents the removed wall spans and which door_portals created them.',
      'Do not treat this as final CAD geometry. It is only as accurate as the current Z4 candidates.',
      `Room candidates exported: ${walkableAreas.length}`,
      `Door portals exported: ${doorPortals.length}`,
      `Wall segments exported after door splitting: ${wallSegments.length}`,
      `Wall openings created: ${wallOpenings.length}`,
      `Props exported: ${props.length}`,
    ],
  };
}

try {
  const plan = readJson(planPath);
  const geometry = exportZ4(plan);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(geometry, null, 2)}\n`, 'utf8');
  console.log(`Z4 geometry export written to ${path.relative(process.cwd(), outPath)}`);
  console.log(`walkable_areas=${geometry.walkable_areas.length} wall_segments=${geometry.wall_segments.length} wall_openings=${geometry.wall_openings.length} door_portals=${geometry.door_portals.length} props=${geometry.props.length}`);
} catch (error) {
  console.error(`Z4 geometry export failed: ${error.message}`);
  process.exit(1);
}
