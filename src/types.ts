export type Confidence = 'high' | 'medium' | 'low' | 'unknown';

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
  normalized_bbox?: [number, number, number, number];
}

export interface PlanModel {
  schema_version: string;
  source: {
    filename: string;
    page_count: number;
    scale_note: string;
  };
  extraction_policy: string[];
  zones: PlanZone[];
  rooms: PlanRoom[];
  doors: PlanDoor[];
  emergency_exits: PlanDoor[];
  equipment: PlanEquipment[];
  labels: PlanLabel[];
  unresolved_questions: string[];
}
