import * as THREE from 'three';
import './z4-viewer.css';

type Vec2 = [number, number];
type Bbox = [number, number, number, number];

interface WalkableArea {
  id: string;
  source_room_id: string;
  label: string;
  polygon_m: Vec2[];
  centroid_m: Vec2;
  confidence: string;
  priority: number;
}

interface WallSegment {
  id: string;
  start_m: Vec2;
  end_m: Vec2;
  height_m: number;
  thickness_m: number;
  door_portal_ids_near_edge?: string[];
  confidence: string;
}

interface WallOpening {
  id: string;
  start_m: Vec2;
  end_m: Vec2;
  center_m: Vec2;
  width_m: number;
  door_portal_ids: string[];
  confidence: string;
}

interface DoorPortal {
  id: string;
  line_m: [Vec2, Vec2];
  center_m: Vec2;
  width_m: number;
  emergency_exit: boolean;
  confidence: string;
}

interface PropBox {
  id: string;
  bbox_m: Bbox;
  center_m: Vec2;
  size_m: Vec2;
  height_m: number;
  collider: boolean;
  type: string;
  label: string;
}

interface Z4GeometryExport {
  schema_version: string;
  world: {
    wall_height_m: number;
    wall_thickness_m: number;
    player_eye_height_m: number;
    player_radius_m: number;
  };
  player_spawn: {
    position_m: Vec2;
    eye_height_m: number;
    radius_m: number;
    yaw_degrees: number;
  };
  walkable_areas: WalkableArea[];
  wall_segments: WallSegment[];
  wall_openings?: WallOpening[];
  door_portals: DoorPortal[];
  props: PropBox[];
  build_notes: string[];
}

const app = document.querySelector<HTMLDivElement>('#z4-app');
if (!app) throw new Error('Missing #z4-app');

app.innerHTML = `
  <section class="hud">
    <div>
      <strong>Z4 First Person Prototype</strong>
      <span id="status">loading geometry...</span>
    </div>
    <div class="controls">
      <button id="start" type="button">Enter first person</button>
      <button id="reset" type="button">Reset spawn</button>
      <button id="toggle-minimap" type="button">Toggle minimap</button>
      <button id="toggle-openings" type="button">Toggle openings</button>
      <button id="toggle-collision" type="button">Toggle collision</button>
      <a href="/">Review UI</a>
    </div>
    <div class="runtime-info">
      <span>Room: <strong id="room-name">—</strong></span>
      <span>Position: <strong id="position-readout">—</strong></span>
      <span>Openings: <strong id="openings-readout">—</strong></span>
      <span>Collision: <strong id="collision-readout">—</strong></span>
    </div>
    <div class="material-legend" aria-label="Material categories">
      <span><i class="mat-floor-lab"></i> lab floor</span>
      <span><i class="mat-floor-support"></i> support/storage</span>
      <span><i class="mat-wall"></i> wall</span>
      <span><i class="mat-door"></i> door portal</span>
      <span><i class="mat-opening"></i> wall opening</span>
      <span><i class="mat-prop"></i> prop/collider</span>
      <span><i class="mat-collision"></i> collision debug</span>
    </div>
    <p>WASD = move · mouse = look · Shift = faster · R = reset · M = minimap · O = openings · C = collision · Esc = release mouse. Geometry is v0/v1 candidate data, not final CAD.</p>
  </section>
  <section id="viewport"></section>
  <aside id="minimap-panel" class="minimap-panel">
    <header>
      <strong>Z4 minimap</strong>
      <span>top-down debug</span>
    </header>
    <canvas id="minimap" width="360" height="260"></canvas>
  </aside>
`;

const viewport = document.querySelector<HTMLDivElement>('#viewport');
const status = document.querySelector<HTMLSpanElement>('#status');
const startButton = document.querySelector<HTMLButtonElement>('#start');
const resetButton = document.querySelector<HTMLButtonElement>('#reset');
const toggleMinimapButton = document.querySelector<HTMLButtonElement>('#toggle-minimap');
const toggleOpeningsButton = document.querySelector<HTMLButtonElement>('#toggle-openings');
const toggleCollisionButton = document.querySelector<HTMLButtonElement>('#toggle-collision');
const roomName = document.querySelector<HTMLElement>('#room-name');
const positionReadout = document.querySelector<HTMLElement>('#position-readout');
const openingsReadout = document.querySelector<HTMLElement>('#openings-readout');
const collisionReadout = document.querySelector<HTMLElement>('#collision-readout');
const minimapPanel = document.querySelector<HTMLElement>('#minimap-panel');
const minimapCanvas = document.querySelector<HTMLCanvasElement>('#minimap');

if (!viewport || !status || !startButton || !resetButton || !toggleMinimapButton || !toggleOpeningsButton || !toggleCollisionButton || !roomName || !positionReadout || !openingsReadout || !collisionReadout || !minimapPanel || !minimapCanvas) {
  throw new Error('Missing viewer controls');
}

const MATERIALS = {
  floorLab: new THREE.MeshStandardMaterial({ color: 0x2c465f, roughness: 0.96, metalness: 0.0 }),
  floorSupport: new THREE.MeshStandardMaterial({ color: 0x37402f, roughness: 0.96, metalness: 0.0 }),
  floorLowConfidence: new THREE.MeshStandardMaterial({ color: 0x4d3f42, roughness: 0.96, metalness: 0.0 }),
  wall: new THREE.MeshStandardMaterial({ color: 0xd6dde8, roughness: 0.82, metalness: 0.0 }),
  wallLowConfidence: new THREE.MeshStandardMaterial({ color: 0xb9a3a7, roughness: 0.86, metalness: 0.0 }),
  doorPortal: new THREE.MeshBasicMaterial({ color: 0xfff69a, transparent: true, opacity: 0.42 }),
  emergencyPortal: new THREE.MeshBasicMaterial({ color: 0xa6ffb8, transparent: true, opacity: 0.48 }),
  opening: new THREE.MeshBasicMaterial({ color: 0xff4fd8, transparent: true, opacity: 0.72 }),
  collisionWall: new THREE.MeshBasicMaterial({ color: 0xff3355, transparent: true, opacity: 0.18 }),
  collisionProp: new THREE.MeshBasicMaterial({ color: 0xff3355, transparent: true, opacity: 0.38, wireframe: true }),
  playerRadius: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.24, wireframe: true }),
  propBench: new THREE.MeshStandardMaterial({ color: 0x8b6f4d, roughness: 0.76, metalness: 0.04 }),
  propInstrument: new THREE.MeshStandardMaterial({ color: 0x4d6378, roughness: 0.65, metalness: 0.12 }),
  propFreezer: new THREE.MeshStandardMaterial({ color: 0x8fb4c8, roughness: 0.58, metalness: 0.18 }),
  propStorage: new THREE.MeshStandardMaterial({ color: 0x7b7567, roughness: 0.72, metalness: 0.03 }),
  propDefault: new THREE.MeshStandardMaterial({ color: 0xb88452, roughness: 0.72, metalness: 0.05 }),
  spawn: new THREE.MeshBasicMaterial({ color: 0xffffff }),
};

function floorMaterialFor(area: WalkableArea): THREE.Material {
  if (area.confidence === 'low') return MATERIALS.floorLowConfidence;
  const label = `${area.label} ${area.source_room_id}`.toLowerCase();
  if (label.includes('storage') || label.includes('printer') || label.includes('freezer')) return MATERIALS.floorSupport;
  return MATERIALS.floorLab;
}

function wallMaterialFor(segment: WallSegment): THREE.Material {
  return segment.confidence === 'low' ? MATERIALS.wallLowConfidence : MATERIALS.wall;
}

function propMaterialFor(prop: PropBox): THREE.Material {
  const key = `${prop.type} ${prop.label}`.toLowerCase();
  if (key.includes('freezer') || key.includes('frys')) return MATERIALS.propFreezer;
  if (key.includes('instrument') || key.includes('gx')) return MATERIALS.propInstrument;
  if (key.includes('bench') || key.includes('station') || key.includes('work')) return MATERIALS.propBench;
  if (key.includes('storage') || key.includes('shelving')) return MATERIALS.propStorage;
  return MATERIALS.propDefault;
}

function distancePointToSegment(point: Vec2, a: Vec2, b: Vec2): number {
  const px = point[0];
  const py = point[1];
  const ax = a[0];
  const ay = a[1];
  const bx = b[0];
  const by = b[1];
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq));
  const nearestX = ax + t * dx;
  const nearestY = ay + t * dy;
  return Math.hypot(px - nearestX, py - nearestY);
}

function pointInPolygon(point: Vec2, polygon: Vec2[]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function bboxContains(point: Vec2, bbox: Bbox, padding = 0): boolean {
  const [x, y] = point;
  const [x1, y1, x2, y2] = bbox;
  return x >= x1 - padding && x <= x2 + padding && y >= y1 - padding && y <= y2 + padding;
}

function currentRoom(point: Vec2, data: Z4GeometryExport): WalkableArea | undefined {
  return data.walkable_areas.find((area) => pointInPolygon(point, area.polygon_m));
}

function makeTextSprite(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');
  ctx.fillStyle = 'rgba(0,0,0,0.62)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  ctx.font = '36px sans-serif';
  ctx.fillText(text.slice(0, 34), 20, 78);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(3.2, 0.8, 1);
  return sprite;
}

function createFloor(area: WalkableArea): THREE.Mesh {
  const shape = new THREE.Shape();
  area.polygon_m.forEach(([x, y], index) => {
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape);
  geometry.rotateX(Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, floorMaterialFor(area));
  mesh.name = area.id;
  mesh.receiveShadow = true;
  return mesh;
}

function createWall(segment: WallSegment): THREE.Mesh {
  const [x1, y1] = segment.start_m;
  const [x2, y2] = segment.end_m;
  const length = Math.hypot(x2 - x1, y2 - y1);
  const height = segment.height_m;
  const thickness = segment.thickness_m;
  const geometry = new THREE.BoxGeometry(length, height, thickness);
  const mesh = new THREE.Mesh(geometry, wallMaterialFor(segment));
  mesh.position.set((x1 + x2) / 2, height / 2, (y1 + y2) / 2);
  mesh.rotation.y = -Math.atan2(y2 - y1, x2 - x1);
  mesh.name = segment.id;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createWallCollisionDebug(segment: WallSegment, playerRadius: number): THREE.Mesh {
  const [x1, y1] = segment.start_m;
  const [x2, y2] = segment.end_m;
  const length = Math.hypot(x2 - x1, y2 - y1);
  const debugThickness = segment.thickness_m * 2 + playerRadius * 2;
  const geometry = new THREE.BoxGeometry(length, 0.045, debugThickness);
  const mesh = new THREE.Mesh(geometry, MATERIALS.collisionWall);
  mesh.position.set((x1 + x2) / 2, 0.08, (y1 + y2) / 2);
  mesh.rotation.y = -Math.atan2(y2 - y1, x2 - x1);
  mesh.name = `COLLISION-${segment.id}`;
  return mesh;
}

function createPropCollisionDebug(prop: PropBox): THREE.Mesh | null {
  if (!prop.collider) return null;
  const width = Math.max(0.15, Math.abs(prop.size_m[0]));
  const depth = Math.max(0.15, Math.abs(prop.size_m[1]));
  const geometry = new THREE.BoxGeometry(width, prop.height_m + 0.04, depth);
  const mesh = new THREE.Mesh(geometry, MATERIALS.collisionProp);
  mesh.position.set(prop.center_m[0], prop.height_m / 2, prop.center_m[1]);
  mesh.name = `COLLISION-${prop.id}`;
  return mesh;
}

function createPlayerRadiusDebug(radius: number): THREE.Mesh {
  const geometry = new THREE.CylinderGeometry(radius, radius, 0.04, 48, 1, true);
  return new THREE.Mesh(geometry, MATERIALS.playerRadius);
}

function createDoorMarker(portal: DoorPortal): THREE.Group {
  const group = new THREE.Group();
  const [a, b] = portal.line_m;
  const center = portal.center_m;
  const length = Math.max(0.25, Math.hypot(b[0] - a[0], b[1] - a[1]));
  const geometry = new THREE.BoxGeometry(length, 2.05, 0.05);
  const mesh = new THREE.Mesh(geometry, portal.emergency_exit ? MATERIALS.emergencyPortal : MATERIALS.doorPortal);
  mesh.position.set(center[0], 1.05, center[1]);
  mesh.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
  group.add(mesh);
  const label = makeTextSprite(portal.emergency_exit ? 'EXIT' : 'DOOR');
  label.position.set(center[0], 2.35, center[1]);
  group.add(label);
  return group;
}

function createOpeningMarker(opening: WallOpening): THREE.Group {
  const group = new THREE.Group();
  const [a, b] = [opening.start_m, opening.end_m];
  const length = Math.max(0.12, Math.hypot(b[0] - a[0], b[1] - a[1]));
  const geometry = new THREE.BoxGeometry(length, 0.12, 0.38);
  const mesh = new THREE.Mesh(geometry, MATERIALS.opening);
  mesh.position.set(opening.center_m[0], 0.08, opening.center_m[1]);
  mesh.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
  mesh.name = opening.id;
  group.name = `GROUP-${opening.id}`;
  group.add(mesh);
  const label = makeTextSprite('OPENING');
  label.position.set(opening.center_m[0], 0.8, opening.center_m[1]);
  label.scale.set(2.1, 0.52, 1);
  group.add(label);
  return group;
}

function createProp(prop: PropBox): THREE.Mesh {
  const width = Math.max(0.15, Math.abs(prop.size_m[0]));
  const depth = Math.max(0.15, Math.abs(prop.size_m[1]));
  const geometry = new THREE.BoxGeometry(width, prop.height_m, depth);
  const mesh = new THREE.Mesh(geometry, propMaterialFor(prop));
  mesh.position.set(prop.center_m[0], prop.height_m / 2, prop.center_m[1]);
  mesh.name = prop.id;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function fitCameraToGeometry(camera: THREE.PerspectiveCamera, data: Z4GeometryExport): void {
  const points = data.walkable_areas.flatMap((area) => area.polygon_m);
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  camera.position.set((minX + maxX) / 2, 28, maxY + 12);
  camera.lookAt((minX + maxX) / 2, 0, (minY + maxY) / 2);
}

class Minimap {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly bounds: { minX: number; maxX: number; minY: number; maxY: number; pad: number };
  showOpenings = true;
  showCollision = false;

  constructor(private readonly canvas: HTMLCanvasElement, private readonly data: Z4GeometryExport) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Minimap canvas unavailable');
    this.ctx = ctx;
    const points = data.walkable_areas.flatMap((area) => area.polygon_m);
    const xs = points.map(([x]) => x);
    const ys = points.map(([, y]) => y);
    this.bounds = {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
      pad: 1.5,
    };
  }

  private map([x, y]: Vec2): Vec2 {
    const { minX, maxX, minY, maxY, pad } = this.bounds;
    const usableW = this.canvas.width - 24;
    const usableH = this.canvas.height - 24;
    const sx = usableW / (maxX - minX + pad * 2);
    const sy = usableH / (maxY - minY + pad * 2);
    const scale = Math.min(sx, sy);
    const offsetX = (this.canvas.width - (maxX - minX + pad * 2) * scale) / 2;
    const offsetY = (this.canvas.height - (maxY - minY + pad * 2) * scale) / 2;
    return [offsetX + (x - minX + pad) * scale, offsetY + (y - minY + pad) * scale];
  }

  private radiusPx(player: Vec2, radiusM: number): number {
    const [px] = this.map(player);
    const [rx] = this.map([player[0] + radiusM, player[1]]);
    return Math.abs(rx - px);
  }

  draw(player: Vec2, yaw: number, room?: WalkableArea): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = 'rgba(11, 13, 18, 0.92)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (const area of this.data.walkable_areas) {
      ctx.beginPath();
      area.polygon_m.forEach((point, index) => {
        const [x, y] = this.map(point);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      const isSupport = `${area.label} ${area.source_room_id}`.toLowerCase().match(/storage|printer|freezer/);
      ctx.fillStyle = area.id === room?.id ? 'rgba(125, 215, 255, 0.32)' : isSupport ? 'rgba(150, 180, 110, 0.16)' : 'rgba(120, 180, 255, 0.14)';
      ctx.strokeStyle = area.confidence === 'low' ? 'rgba(255, 170, 170, 0.72)' : 'rgba(205, 225, 255, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255, 246, 150, 0.95)';
    ctx.lineWidth = 3;
    for (const portal of this.data.door_portals) {
      const [a, b] = portal.line_m.map((point) => this.map(point));
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
    }

    if (this.showOpenings) {
      ctx.strokeStyle = 'rgba(255, 79, 216, 0.98)';
      ctx.lineWidth = 5;
      ctx.setLineDash([6, 4]);
      for (const opening of this.data.wall_openings ?? []) {
        const [a, b] = [this.map(opening.start_m), this.map(opening.end_m)];
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    if (this.showCollision) {
      ctx.strokeStyle = 'rgba(255, 51, 85, 0.88)';
      ctx.lineWidth = 2;
      for (const wall of this.data.wall_segments) {
        const [a, b] = [this.map(wall.start_m), this.map(wall.end_m)];
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
      }
    }

    for (const prop of this.data.props) {
      const [x1, y1] = this.map([prop.bbox_m[0], prop.bbox_m[1]]);
      const [x2, y2] = this.map([prop.bbox_m[2], prop.bbox_m[3]]);
      const key = `${prop.type} ${prop.label}`.toLowerCase();
      ctx.fillStyle = key.includes('freezer') || key.includes('frys') ? 'rgba(143, 180, 200, 0.78)' : key.includes('instrument') || key.includes('gx') ? 'rgba(95, 135, 170, 0.78)' : 'rgba(255, 155, 95, 0.68)';
      ctx.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
      if (this.showCollision && prop.collider) {
        ctx.strokeStyle = 'rgba(255, 51, 85, 0.95)';
        ctx.lineWidth = 2;
        ctx.strokeRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
      }
    }

    const [px, py] = this.map(player);
    if (this.showCollision) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px, py, this.radiusPx(player, this.data.player_spawn.radius_m), 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-yaw);
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(6, 7);
    ctx.lineTo(-6, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

class FirstPersonController {
  private readonly keys = new Set<string>();
  private yaw = 0;
  private pitch = 0;
  private velocity = new THREE.Vector3();
  showOpeningsCallback?: () => void;
  showCollisionCallback?: () => void;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly dom: HTMLElement,
    private readonly data: Z4GeometryExport,
  ) {
    this.reset();
    this.bind();
  }

  private bind(): void {
    window.addEventListener('keydown', (event) => {
      this.keys.add(event.code);
      if (event.code === 'KeyR') this.reset();
      if (event.code === 'KeyM') minimapPanel.classList.toggle('hidden');
      if (event.code === 'KeyO') this.showOpeningsCallback?.();
      if (event.code === 'KeyC') this.showCollisionCallback?.();
    });
    window.addEventListener('keyup', (event) => this.keys.delete(event.code));
    document.addEventListener('pointerlockchange', () => {
      status.textContent = document.pointerLockElement === this.dom ? 'first-person active' : 'paused / pointer unlocked';
    });
    document.addEventListener('mousemove', (event) => {
      if (document.pointerLockElement !== this.dom) return;
      this.yaw -= event.movementX * 0.0022;
      this.pitch -= event.movementY * 0.0022;
      this.pitch = THREE.MathUtils.clamp(this.pitch, -1.25, 1.25);
      this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    });
  }

  reset(): void {
    this.yaw = THREE.MathUtils.degToRad(this.data.player_spawn.yaw_degrees ?? 0);
    this.pitch = 0;
    const [x, z] = this.data.player_spawn.position_m;
    this.camera.position.set(x, this.data.player_spawn.eye_height_m, z);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }

  requestPointerLock(): void {
    this.dom.requestPointerLock();
  }

  position2d(): Vec2 {
    return [this.camera.position.x, this.camera.position.z];
  }

  yawRadians(): number {
    return this.yaw;
  }

  private canStandAt(next: Vec2): boolean {
    const radius = this.data.player_spawn.radius_m;
    const insideAnyRoom = this.data.walkable_areas.some((area) => pointInPolygon(next, area.polygon_m));
    if (!insideAnyRoom) return false;

    const hitsProp = this.data.props.some((prop) => prop.collider && bboxContains(next, prop.bbox_m, radius));
    if (hitsProp) return false;

    const hasSplitOpenings = (this.data.wall_openings?.length ?? 0) > 0;
    for (const wall of this.data.wall_segments) {
      const nearWall = distancePointToSegment(next, wall.start_m, wall.end_m) < radius + wall.thickness_m;
      if (!nearWall) continue;

      if (!hasSplitOpenings) {
        const nearDoor = (wall.door_portal_ids_near_edge ?? []).some((portalId) => {
          const portal = this.data.door_portals.find((candidate) => candidate.id === portalId);
          if (!portal) return false;
          return distancePointToSegment(next, portal.line_m[0], portal.line_m[1]) < Math.max(portal.width_m * 0.75, 0.75);
        });
        if (nearDoor) continue;
      }

      return false;
    }

    return true;
  }

  update(dt: number): void {
    const direction = new THREE.Vector3();
    if (this.keys.has('KeyW')) direction.z -= 1;
    if (this.keys.has('KeyS')) direction.z += 1;
    if (this.keys.has('KeyA')) direction.x -= 1;
    if (this.keys.has('KeyD')) direction.x += 1;
    if (direction.lengthSq() === 0) return;

    direction.normalize();
    const speed = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? 4.2 : 2.0;
    const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    this.velocity.copy(forward).multiplyScalar(-direction.z).addScaledVector(right, direction.x).normalize().multiplyScalar(speed * dt);

    const next = this.camera.position.clone().add(this.velocity);
    const next2d: Vec2 = [next.x, next.z];
    if (this.canStandAt(next2d)) {
      this.camera.position.x = next.x;
      this.camera.position.z = next.z;
    }
  }
}

async function loadGeometry(): Promise<Z4GeometryExport> {
  const response = await fetch('/generated/z4.geometry-v0.json');
  if (!response.ok) throw new Error('Missing /generated/z4.geometry-v0.json. Run npm run export:z4-geometry first.');
  return response.json();
}

function buildScene(data: Z4GeometryExport): void {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111318);
  scene.fog = new THREE.Fog(0x111318, 25, 90);

  const camera = new THREE.PerspectiveCamera(72, viewport.clientWidth / viewport.clientHeight, 0.05, 300);
  fitCameraToGeometry(camera, data);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(viewport.clientWidth, viewport.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  viewport.appendChild(renderer.domElement);

  const ambient = new THREE.HemisphereLight(0xffffff, 0x2a2a35, 1.55);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffffff, 1.95);
  sun.position.set(10, 22, 12);
  sun.castShadow = true;
  scene.add(sun);

  const grid = new THREE.GridHelper(80, 80, 0x3c4454, 0x242936);
  scene.add(grid);

  data.walkable_areas.forEach((area) => {
    const floor = createFloor(area);
    scene.add(floor);
    const label = makeTextSprite(area.label);
    label.position.set(area.centroid_m[0], 0.15, area.centroid_m[1]);
    label.scale.set(2.8, 0.7, 1);
    scene.add(label);
  });

  data.wall_segments.forEach((segment) => scene.add(createWall(segment)));
  data.door_portals.forEach((portal) => scene.add(createDoorMarker(portal)));
  data.props.forEach((prop) => scene.add(createProp(prop)));

  const openingDebugGroup = new THREE.Group();
  openingDebugGroup.name = 'wall-openings-debug';
  (data.wall_openings ?? []).forEach((opening) => openingDebugGroup.add(createOpeningMarker(opening)));
  scene.add(openingDebugGroup);

  const collisionDebugGroup = new THREE.Group();
  collisionDebugGroup.name = 'collision-debug';
  collisionDebugGroup.visible = false;
  data.wall_segments.forEach((segment) => collisionDebugGroup.add(createWallCollisionDebug(segment, data.player_spawn.radius_m)));
  data.props.forEach((prop) => {
    const debug = createPropCollisionDebug(prop);
    if (debug) collisionDebugGroup.add(debug);
  });
  const playerRadiusDebug = createPlayerRadiusDebug(data.player_spawn.radius_m);
  playerRadiusDebug.name = 'COLLISION-player-radius';
  collisionDebugGroup.add(playerRadiusDebug);
  scene.add(collisionDebugGroup);

  const spawn = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.04, 24), MATERIALS.spawn);
  spawn.position.set(data.player_spawn.position_m[0], 0.03, data.player_spawn.position_m[1]);
  scene.add(spawn);

  const controller = new FirstPersonController(camera, renderer.domElement, data);
  const minimap = new Minimap(minimapCanvas, data);

  const toggleOpenings = () => {
    openingDebugGroup.visible = !openingDebugGroup.visible;
    minimap.showOpenings = openingDebugGroup.visible;
    openingsReadout.textContent = `${data.wall_openings?.length ?? 0} ${openingDebugGroup.visible ? 'shown' : 'hidden'}`;
  };

  const toggleCollision = () => {
    collisionDebugGroup.visible = !collisionDebugGroup.visible;
    minimap.showCollision = collisionDebugGroup.visible;
    collisionReadout.textContent = `${collisionDebugGroup.visible ? 'shown' : 'hidden'}`;
  };

  controller.showOpeningsCallback = toggleOpenings;
  controller.showCollisionCallback = toggleCollision;

  startButton.addEventListener('click', () => controller.requestPointerLock());
  renderer.domElement.addEventListener('click', () => controller.requestPointerLock());
  resetButton.addEventListener('click', () => controller.reset());
  toggleMinimapButton.addEventListener('click', () => minimapPanel.classList.toggle('hidden'));
  toggleOpeningsButton.addEventListener('click', toggleOpenings);
  toggleCollisionButton.addEventListener('click', toggleCollision);

  const clock = new THREE.Clock();
  const resize = () => {
    camera.aspect = viewport.clientWidth / viewport.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
  };
  window.addEventListener('resize', resize);

  status.textContent = `loaded ${data.walkable_areas.length} rooms, ${data.wall_segments.length} walls, ${data.wall_openings?.length ?? 0} openings, ${data.door_portals.length} portals, ${data.props.length} props`;
  openingsReadout.textContent = `${data.wall_openings?.length ?? 0} shown`;
  collisionReadout.textContent = 'hidden';

  const animate = () => {
    requestAnimationFrame(animate);
    controller.update(Math.min(clock.getDelta(), 0.05));
    const position = controller.position2d();
    const room = currentRoom(position, data);
    roomName.textContent = room?.label ?? 'outside walkable area';
    positionReadout.textContent = `${position[0].toFixed(2)} m, ${position[1].toFixed(2)} m`;
    playerRadiusDebug.position.set(position[0], 0.1, position[1]);
    minimap.draw(position, controller.yawRadians(), room);
    renderer.render(scene, camera);
  };
  animate();
}

loadGeometry()
  .then(buildScene)
  .catch((error) => {
    status.textContent = String(error.message ?? error);
    app.classList.add('error');
  });
