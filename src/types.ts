export type Confidence = 'high' | 'medium' | 'low' | 'unknown';
export type NormalizedPoint = [number, number];
export type NormalizedBbox = [number, number, number, number];

export interface PlanLabel {
  id: string;
  text: string;
  zone?: string;
  room_id?: string;
  category: 'room_name' | 'room_number' | 'equipment_label' | 'safety_label' | 'note' | 'unknown';
  confidence: Confidence;
}

export interface PlanRoom {
  id: string;
  name: string;
  room_number?: string;
  category: 'lab' | 'office' | 'corridor' | 'storage' | 'airlock' | 'technical' | 'unknown';
  zone: string;
  readable_labels: string[];
  needs_verification?: boolean;
  confidence: Confidence;
}

export interface PlanDoor {
  id: string;
  type: 'hinged' | 'double' | 'sliding_or_unknown' | 'emergency_exit' | 'opening';
  zone: string;
  between?: string[];
  label?: string;
  swing_visible: boolean;
  emergency_exit: boolean;
  confidence: Confidence;
}

export interface PlanEquipment {
  id: string;
  type: string;
  label: string;
  zone: string;
  room_id?: string;
  should_block_player?: boolean;
  confidence: Confidence;
}

export interface PlanZone {
  id: string;
  name: string;
  description: string;
  normalized_bbox?: NormalizedBbox;
}

export interface CoordinateSystem {
  type: string;
  origin: string;
  range: string;
  note: string;
}

export interface ZoneReviewStatus {
  status: string;
  priority: number;
  recommended_first_walkable_loop?: string[];
  rationale?: string;
  needs_human_verification?: boolean;
}

export interface RoomPolygonCandidate {
  id: string;
  source_room_id: string;
  zone: string;
  label: string;
  normalized_polygon: NormalizedPoint[];
  confidence: Confidence;
  priority: number;
  notes?: string;
}

export interface DoorCandidate {
  id: string;
  linked_door_id?: string;
  zone: string;
  type: PlanDoor['type'];
  between?: string[];
  normalized_line: [NormalizedPoint, NormalizedPoint];
  width_m_estimate?: number;
  swing_visible: boolean;
  emergency_exit?: boolean;
  confidence: Confidence;
  priority: number;
  notes?: string;
}

export interface EquipmentCandidate {
  id: string;
  zone: string;
  room_id?: string;
  type: string;
  label: string;
  normalized_bbox: NormalizedBbox;
  collider_mode: 'none' | 'solid_low' | 'solid_medium' | 'solid_high' | string;
  confidence: Confidence;
  priority: number;
  notes?: string;
}

export interface NavigationNode {
  id: string;
  room_id?: string;
  zone: string;
  kind: 'room' | 'junction' | 'corridor' | 'exit' | string;
  label?: string;
  confidence: Confidence;
}

export interface NavigationEdge {
  id: string;
  from: string;
  to: string;
  door_candidate_id?: string;
  confidence: Confidence;
  priority: number;
}

export interface NavigationGraph {
  version: string;
  status: string;
  nodes: NavigationNode[];
  edges: NavigationEdge[];
}

export interface PlanModel {
  schema_version: string;
  source: {
    filename: string;
    page_count: number;
    scale_note: string;
    local_background_image_path?: string;
  };
  coordinate_system?: CoordinateSystem;
  extraction_policy: string[];
  zones: PlanZone[];
  rooms: PlanRoom[];
  doors: PlanDoor[];
  emergency_exits: PlanDoor[];
  equipment: PlanEquipment[];
  labels: PlanLabel[];
  zone_review_status?: Record<string, ZoneReviewStatus>;
  room_polygon_candidates?: RoomPolygonCandidate[];
  door_candidates?: DoorCandidate[];
  equipment_candidates?: EquipmentCandidate[];
  navigation_graph?: NavigationGraph;
  unresolved_questions: string[];
}
