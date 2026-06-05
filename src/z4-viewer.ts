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
      <button id="start">Click to enter first person</button>
      <a href="/">Review UI</a>
    </div>
    <p>WASD = move · mouse = look · Shift = faster · Esc = release mouse. Geometry is v0 candidate data, not final CAD.</p>
  </section>
  <section id="viewport"></section>
`;

const viewport = document.querySelector<HTMLDivElement>('#viewport');
const status = document.querySelector<HTMLSpanElement>('#status');
const startButton = document.querySelector<HTMLButtonElement>('#start');
if (!viewport || !status || !startButton) throw new Error('Missing viewer controls');

function xz([x, y]: Vec2): THREE.Vector3 {
  return new THREE.Vector3(x, 0, y);
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
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0.0 });
  const mesh = new THREE.Mesh(geometry, material);
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
  const material = new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0.0 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set((x1 + x2) / 2, height / 2, (y1 + y2) / 2);
  mesh.rotation.y = -Math.atan2(y2 - y1, x2 - x1);
  mesh.name = segment.id;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createDoorMarker(portal: DoorPortal): THREE.Group {
  const group = new THREE.Group();
  const [a, b] = portal.line_m;
  const center = portal.center_m;
  const length = Math.max(0.25, Math.hypot(b[0] - a[0], b[1] - a[1]));
  const geometry = new THREE.BoxGeometry(length, 2.05, 0.05);
  const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.35 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(center[0], 1.05, center[1]);
  mesh.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
  group.add(mesh);
  const label = makeTextSprite(portal.emergency_exit ? 'EXIT' : 'DOOR');
  label.position.set(center[0], 2.35, center[1]);
  group.add(label);
  return group;
}

function createProp(prop: PropBox): THREE.Mesh {
  const width = Math.max(0.15, Math.abs(prop.size_m[0]));
  const depth = Math.max(0.15, Math.abs(prop.size_m[1]));
  const geometry = new THREE.BoxGeometry(width, prop.height_m, depth);
  const material = new THREE.MeshStandardMaterial({ roughness: 0.72, metalness: 0.05 });
  const mesh = new THREE.Mesh(geometry, material);
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

class FirstPersonController {
  private readonly keys = new Set<string>();
  private yaw = 0;
  private pitch = 0;
  private velocity = new THREE.Vector3();

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly dom: HTMLElement,
    private readonly data: Z4GeometryExport,
  ) {
    this.yaw = THREE.MathUtils.degToRad(data.player_spawn.yaw_degrees ?? 0);
    const [x, z] = data.player_spawn.position_m;
    this.camera.position.set(x, data.player_spawn.eye_height_m, z);
    this.bind();
  }

  private bind(): void {
    window.addEventListener('keydown', (event) => this.keys.add(event.code));
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

  requestPointerLock(): void {
    this.dom.requestPointerLock();
  }

  private canStandAt(next: Vec2): boolean {
    const radius = this.data.player_spawn.radius_m;
    const insideAnyRoom = this.data.walkable_areas.some((area) => pointInPolygon(next, area.polygon_m));
    if (!insideAnyRoom) return false;

    const hitsProp = this.data.props.some((prop) => prop.collider && bboxContains(next, prop.bbox_m, radius));
    if (hitsProp) return false;

    for (const wall of this.data.wall_segments) {
      const nearWall = distancePointToSegment(next, wall.start_m, wall.end_m) < radius + wall.thickness_m;
      if (!nearWall) continue;

      const nearDoor = (wall.door_portal_ids_near_edge ?? []).some((portalId) => {
        const portal = this.data.door_portals.find((candidate) => candidate.id === portalId);
        if (!portal) return false;
        return distancePointToSegment(next, portal.line_m[0], portal.line_m[1]) < Math.max(portal.width_m * 0.75, 0.75);
      });

      if (!nearDoor) return false;
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
  let response = await fetch('/generated/z4.geometry-v0.json');
  if (!response.ok) {
    status.textContent = 'geometry export missing — using live generated fallback from source data';
    response = await fetch('/data/plan5f.manual-v0.json');
    if (!response.ok) throw new Error('Missing both generated geometry and source plan data. Run npm run export:z4-geometry.');
    throw new Error('Missing /generated/z4.geometry-v0.json. Run npm run export:z4-geometry first.');
  }
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

  const ambient = new THREE.HemisphereLight(0xffffff, 0x2a2a35, 1.4);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffffff, 1.8);
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

  const spawn = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.04, 24), new THREE.MeshBasicMaterial());
  spawn.position.set(data.player_spawn.position_m[0], 0.03, data.player_spawn.position_m[1]);
  scene.add(spawn);

  const controller = new FirstPersonController(camera, renderer.domElement, data);
  startButton.addEventListener('click', () => controller.requestPointerLock());
  renderer.domElement.addEventListener('click', () => controller.requestPointerLock());

  const clock = new THREE.Clock();
  const resize = () => {
    camera.aspect = viewport.clientWidth / viewport.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
  };
  window.addEventListener('resize', resize);

  status.textContent = `loaded ${data.walkable_areas.length} rooms, ${data.wall_segments.length} walls, ${data.door_portals.length} portals, ${data.props.length} props`;

  const animate = () => {
    requestAnimationFrame(animate);
    controller.update(Math.min(clock.getDelta(), 0.05));
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
