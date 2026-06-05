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

function wallSegmentsForPolygon(room, points, doorPortals) {
  const segments = [];
  for (let i = 0; i < points.length; i += 1) {
    const start = points[i];
    const end = points[(i + 1) % points.length];
    const edgeMid = midpoint(start, end);
    const edgeLength = distance(start, end);
    const matchingDoors = doorPortals.filter((door) => {
      if (!(door.between_room_ids ?? []).includes(room.source_room_id)) return false;
      const d = distance(edgeMid, door.center_m);
      return d < Math.max(1.5, edgeLength * 0.35);
    });

    segments.push({
      id: `WALL-${room.id}-${String(i + 1).padStart(2, '0')}`,
      room_candidate_id: room.id,
      source_room_id: room.source_room_id,
      start_m: start,
      end_m: end,
      length_m: round(edgeLength),
      height_m: DEFAULT_WORLD.wall_height_m,
      thickness_m: DEFAULT_WORLD.wall_thickness_m,
      door_portal_ids_near_edge: matchingDoors.map((door) => door.id),
      confidence: room.confidence,
      note: matchingDoors.length ? 'Door candidate is near this edge; downstream generator should cut an opening here.' : undefined,
    });
  }
  return segments;
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

  const roomById = new Map(roomCandidates.map((room) => [room.source_room_id, room]));
  const wallSegments = walkableAreas.flatMap((walkable) => {
    const room = roomCandidates.find((candidate) => candidate.id === walkable.room_candidate_id);
    if (!room) return [];
    return wallSegmentsForPolygon(room, walkable.polygon_m, doorPortals);
  });

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
    schema_version: 'plan5f.z4_geometry_export.v0',
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
    door_portals: doorPortals,
    props,
    navigation_graph: navGraph,
    build_notes: [
      'This export is a bridge format for the first Three.js prototype.',
      'wall_segments are polygon edges; door_portals identify where openings should be cut or ignored by collision.',
      'Do not treat this as final CAD geometry. It is only as accurate as the current Z4 candidates.',
      `Room candidates exported: ${walkableAreas.length}`,
      `Door portals exported: ${doorPortals.length}`,
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
  console.log(`walkable_areas=${geometry.walkable_areas.length} wall_segments=${geometry.wall_segments.length} door_portals=${geometry.door_portals.length} props=${geometry.props.length}`);
} catch (error) {
  console.error(`Z4 geometry export failed: ${error.message}`);
  process.exit(1);
}
