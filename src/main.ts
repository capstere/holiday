import type {
  DoorCandidate,
  EquipmentCandidate,
  NormalizedBbox,
  NormalizedPoint,
  PlanModel,
  RoomPolygonCandidate,
} from './types';
import './style.css';

const LOCAL_PLAN_IMAGE_PATH = '/source/plan5f.png';
const CONFIDENCE_VALUES = ['high', 'medium', 'low', 'unknown'];

async function loadPlan(): Promise<PlanModel> {
  const response = await fetch('/data/plan5f.manual-v0.json');
  if (!response.ok) throw new Error(`Could not load plan model: ${response.status}`);
  return response.json();
}

function confidenceClass(value: string): string {
  return `confidence-${value}`;
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (value === undefined || value === null || value === '') return '—';
  return String(value);
}

function pct(value: number): string {
  return `${value * 100}%`;
}

function round(value: number): number {
  return Number(value.toFixed(4));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function toCanvasPoint([x, y]: NormalizedPoint, bbox?: NormalizedBbox): [number, number] {
  if (!bbox) return [x * 100, y * 100];
  const [x1, y1, x2, y2] = bbox;
  return [((x - x1) / (x2 - x1)) * 100, ((y - y1) / (y2 - y1)) * 100];
}

function pointsToSvg(points: NormalizedPoint[], bbox?: NormalizedBbox): string {
  return points
    .map((point) => {
      const [x, y] = toCanvasPoint(point, bbox);
      return `${round(x)},${round(y)}`;
    })
    .join(' ');
}

function bboxStyle(bbox: NormalizedBbox, parent?: NormalizedBbox): string {
  const [x1, y1, x2, y2] = bbox;
  if (!parent) {
    return `left:${pct(x1)};top:${pct(y1)};width:${pct(x2 - x1)};height:${pct(y2 - y1)};`;
  }
  const [px1, py1, px2, py2] = parent;
  return [
    `left:${pct((x1 - px1) / (px2 - px1))}`,
    `top:${pct((y1 - py1) / (py2 - py1))}`,
    `width:${pct((x2 - x1) / (px2 - px1))}`,
    `height:${pct((y2 - y1) / (py2 - py1))}`,
  ].join(';');
}

function cropImageStyle(bbox?: NormalizedBbox): string {
  if (!bbox) return 'left:0;top:0;width:100%;height:100%;';
  const [x1, y1, x2, y2] = bbox;
  return [
    `left:${pct(-x1 / (x2 - x1))}`,
    `top:${pct(-y1 / (y2 - y1))}`,
    `width:${pct(1 / (x2 - x1))}`,
    `height:${pct(1 / (y2 - y1))}`,
  ].join(';');
}

function candidateClassNames(candidate: { confidence: string; priority: number }): string {
  return [
    'candidate-root',
    'candidate',
    `candidate-confidence-${candidate.confidence}`,
    `candidate-priority-${candidate.priority}`,
  ].join(' ');
}

function candidateDataAttrs(candidate: { id: string; confidence: string; priority: number }): string {
  return `data-candidate-id="${candidate.id}" data-confidence="${candidate.confidence}" data-priority="${candidate.priority}"`;
}

function renderTable<T extends Record<string, unknown>>(title: string, rows: T[], columns: Array<keyof T>): string {
  const body = rows
    .map((row) => `\n      <tr>${columns.map((column) => `<td>${formatValue(row[column])}</td>`).join('')}</tr>\n    `)
    .join('');

  return `\n    <section class="card">\n      <h2>${title} <span>${rows.length}</span></h2>\n      <div class="table-wrap">\n        <table>\n          <thead><tr>${columns.map((column) => `<th>${String(column)}</th>`).join('')}</tr></thead>\n          <tbody>${body}</tbody>\n        </table>\n      </div>\n    </section>\n  `;
}

function renderZones(plan: PlanModel): string {
  return `\n    <section class="card zones-card">\n      <h2>Zoner</h2>\n      <div class="zone-grid">\n        ${plan.zones
          .map(
            (zone) => `\n              <article class="zone-tile">\n                <strong>${zone.id}: ${zone.name}</strong>\n                <p>${zone.description}</p>\n                ${zone.normalized_bbox ? `<small>bbox: ${zone.normalized_bbox.join(', ')}</small>` : ''}\n              </article>\n            `,
          )
          .join('')}\n      </div>\n    </section>\n  `;
}

function renderImageLayer(bbox?: NormalizedBbox, alt = 'Local floorplan background'): string {
  return `<img class="floorplan-bg" src="${LOCAL_PLAN_IMAGE_PATH}" alt="${alt}" style="${cropImageStyle(bbox)}" />`;
}

function renderPlanOverview(plan: PlanModel): string {
  return `\n    <section class="card overlay-card">\n      <h2>Plan overview <span>zon-bboxar</span></h2>\n      <p class="muted">Detta är en normaliserad arbetsyta. Lägg en lokal ritningsbild i <code>public/source/plan5f.png</code> för att se den under overlayn. Bilden är inte committad eftersom repot är publikt.</p>\n      <div class="plan-canvas full-plan" data-background="optional">\n        ${renderImageLayer(undefined, 'Full Plan 5F background')}\n        <div class="missing-background">Local background image placeholder</div>\n        ${plan.zones
          .filter((zone) => zone.normalized_bbox)
          .map(
            (zone) => `\n              <div class="zone-box" style="${bboxStyle(zone.normalized_bbox!)}">\n                <span>${zone.id}</span>\n              </div>\n            `,
          )
          .join('')}\n      </div>\n    </section>\n  `;
}

function renderRoomHandles(candidate: RoomPolygonCandidate, z4bbox: NormalizedBbox): string {
  return candidate.normalized_polygon
    .map((point, index) => {
      const [x, y] = toCanvasPoint(point, z4bbox);
      return `<circle class="drag-handle room-handle" cx="${round(x)}" cy="${round(y)}" r="1.35" data-edit-kind="room" data-candidate-id="${candidate.id}" data-point-index="${index}"><title>${candidate.id} point ${index}</title></circle>`;
    })
    .join('');
}

function renderRoomPolygon(candidate: RoomPolygonCandidate, z4bbox: NormalizedBbox): string {
  return `\n    <g class="${candidateClassNames(candidate)}" ${candidateDataAttrs(candidate)} data-kind="room-polygon">\n      <polygon class="room-poly confidence-stroke-${candidate.confidence}" points="${pointsToSvg(candidate.normalized_polygon, z4bbox)}">\n        <title>${candidate.id}: ${candidate.label}</title>\n      </polygon>\n      ${renderRoomHandles(candidate, z4bbox)}\n    </g>\n  `;
}

function renderDoorHandles(candidate: DoorCandidate, z4bbox: NormalizedBbox): string {
  return candidate.normalized_line
    .map((point, index) => {
      const [x, y] = toCanvasPoint(point, z4bbox);
      return `<circle class="drag-handle door-handle" cx="${round(x)}" cy="${round(y)}" r="1.6" data-edit-kind="door" data-candidate-id="${candidate.id}" data-point-index="${index}"><title>${candidate.id} endpoint ${index}</title></circle>`;
    })
    .join('');
}

function renderDoorCandidate(candidate: DoorCandidate, z4bbox: NormalizedBbox): string {
  const [[x1, y1], [x2, y2]] = candidate.normalized_line.map((point) => toCanvasPoint(point, z4bbox));
  return `\n    <g class="${candidateClassNames(candidate)}" ${candidateDataAttrs(candidate)} data-kind="door-candidate">\n      <line class="door-line confidence-stroke-${candidate.confidence}" x1="${round(x1)}" y1="${round(y1)}" x2="${round(x2)}" y2="${round(y2)}">\n        <title>${candidate.id}: ${candidate.between?.join(' ↔ ') ?? 'unknown'}</title>\n      </line>\n      ${renderDoorHandles(candidate, z4bbox)}\n    </g>\n  `;
}

function renderEquipmentCandidate(candidate: EquipmentCandidate, z4bbox: NormalizedBbox): string {
  return `\n    <button type="button" class="equipment-box ${candidateClassNames(candidate)} confidence-bg-${candidate.confidence}" ${candidateDataAttrs(candidate)} style="${bboxStyle(candidate.normalized_bbox, z4bbox)}" title="${candidate.id}: ${candidate.label}">\n      <span>${candidate.type}</span>\n    </button>\n  `;
}

function renderReviewControls(): string {
  return `\n    <div class="review-controls" aria-label="Overlay filters">\n      <label><input id="toggle-background" type="checkbox" checked /> visa lokal ritningsbild</label>\n      <label><input class="confidence-filter" type="checkbox" value="high" checked /> high</label>\n      <label><input class="confidence-filter" type="checkbox" value="medium" checked /> medium</label>\n      <label><input class="confidence-filter" type="checkbox" value="low" checked /> low</label>\n      <label><input class="confidence-filter" type="checkbox" value="unknown" checked /> unknown</label>\n      <label>priority ≤\n        <select id="priority-filter">\n          <option value="1">1</option>\n          <option value="2">2</option>\n          <option value="3" selected>3</option>\n          <option value="99">all</option>\n        </select>\n      </label>\n      <label class="annotation-toggle"><input id="annotation-mode" type="checkbox" /> annotation mode</label>\n      <button type="button" id="export-annotation-patch">export JSON patch</button>\n      <button type="button" id="copy-annotation-patch">copy patch</button>\n      <span id="filter-status" class="control-status"></span>\n      <span id="copy-status" class="control-status"></span>\n    </div>\n    <textarea id="annotation-output" class="annotation-output" readonly placeholder="Exporterad annotation patch visas här..."></textarea>\n  `;
}

function renderZ4Overlay(plan: PlanModel): string {
  const z4 = plan.zones.find((zone) => zone.id === 'Z4');
  const z4bbox = z4?.normalized_bbox;
  if (!z4 || !z4bbox) return '';

  const rooms = (plan.room_polygon_candidates ?? []).filter((candidate) => candidate.zone === 'Z4');
  const doors = (plan.door_candidates ?? []).filter((candidate) => candidate.zone === 'Z4');
  const equipment = (plan.equipment_candidates ?? []).filter((candidate) => candidate.zone === 'Z4');
  const graph = plan.navigation_graph;
  const z4Nodes = graph?.nodes.filter((node) => node.zone === 'Z4') ?? [];
  const z4Edges = graph?.edges ?? [];

  return `\n    <section class="card overlay-card">\n      <h2>Z4 overlay <span>room/door/equipment candidates</span></h2>\n      <p class="muted">Overlayn visar grova normaliserade Z4-kandidater. Rumsytor = polygoner, dörrar = linjer, utrustning = fyllda boxar. Detta är en granskningsvy, inte slutlig 3D-geometri.</p>\n      ${renderReviewControls()}\n      <div class="legend">\n        <span><i class="legend-room"></i> rumspolygon</span>\n        <span><i class="legend-door"></i> dörrlinje</span>\n        <span><i class="legend-equipment"></i> utrustning</span>\n        <span><i class="legend-handle"></i> drag point</span>\n        <span class="legend-hint">Klicka på kandidat för att kopiera ID. Slå på annotation mode för att dra punkter.</span>\n      </div>\n      <div class="z4-grid">\n        <div class="plan-canvas z4-canvas" data-background="optional">\n          ${renderImageLayer(z4bbox, 'Z4 crop background')}\n          <div class="missing-background">Z4 crop placeholder</div>\n          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Z4 candidate overlay">\n            ${rooms.map((candidate) => renderRoomPolygon(candidate, z4bbox)).join('')}\n            ${doors.map((candidate) => renderDoorCandidate(candidate, z4bbox)).join('')}\n          </svg>\n          ${equipment.map((candidate) => renderEquipmentCandidate(candidate, z4bbox)).join('')}\n        </div>\n        <aside class="graph-panel">\n          <h3>Navigation graph</h3>\n          <p>${z4Nodes.length} noder, ${z4Edges.length} edges</p>\n          <ol>\n            ${z4Edges
              .map((edge) => `<li><strong>${edge.from}</strong> → <strong>${edge.to}</strong><br><small>${edge.door_candidate_id ?? 'no door candidate'} · ${edge.confidence}</small></li>`)
              .join('')}\n          </ol>\n        </aside>\n      </div>\n    </section>\n\n    ${renderTable('Z4 room_polygon_candidates', rooms as unknown as Record<string, unknown>[], ['id', 'source_room_id', 'label', 'confidence', 'priority'])}\n    ${renderTable('Z4 door_candidates', doors as unknown as Record<string, unknown>[], ['id', 'type', 'between', 'width_m_estimate', 'confidence', 'priority'])}\n    ${renderTable('Z4 equipment_candidates', equipment as unknown as Record<string, unknown>[], ['id', 'room_id', 'type', 'collider_mode', 'confidence', 'priority'])}\n  `;
}

function applyConfidenceClasses(): void {
  document.querySelectorAll('td').forEach((td) => {
    const text = td.textContent?.trim() ?? '';
    if (CONFIDENCE_VALUES.includes(text)) td.classList.add(confidenceClass(text));
  });
}

function setupOptionalBackgroundImages(): void {
  document.querySelectorAll<HTMLImageElement>('.floorplan-bg').forEach((image) => {
    image.addEventListener('load', () => image.closest('.plan-canvas')?.classList.add('has-background'));
    image.addEventListener('error', () => image.closest('.plan-canvas')?.classList.add('missing-local-image'));
  });
}

function setupOverlayControls(): void {
  const backgroundToggle = document.querySelector<HTMLInputElement>('#toggle-background');
  const confidenceFilters = Array.from(document.querySelectorAll<HTMLInputElement>('.confidence-filter'));
  const priorityFilter = document.querySelector<HTMLSelectElement>('#priority-filter');
  const filterStatus = document.querySelector<HTMLElement>('#filter-status');
  const copyStatus = document.querySelector<HTMLElement>('#copy-status');
  const candidates = Array.from(document.querySelectorAll<HTMLElement | SVGGElement>('.candidate-root'));

  const updateFilters = () => {
    const enabledConfidence = new Set(confidenceFilters.filter((input) => input.checked).map((input) => input.value));
    const maxPriority = Number(priorityFilter?.value ?? 99);
    let visible = 0;

    candidates.forEach((candidate) => {
      const confidence = candidate.getAttribute('data-confidence') ?? 'unknown';
      const priority = Number(candidate.getAttribute('data-priority') ?? 99);
      const shouldShow = enabledConfidence.has(confidence) && priority <= maxPriority;
      candidate.classList.toggle('candidate-hidden', !shouldShow);
      if (shouldShow) visible += 1;
    });

    document.body.classList.toggle('hide-floorplan-bg', backgroundToggle?.checked === false);
    if (filterStatus) filterStatus.textContent = `${visible}/${candidates.length} kandidater visas`;
  };

  backgroundToggle?.addEventListener('change', updateFilters);
  confidenceFilters.forEach((input) => input.addEventListener('change', updateFilters));
  priorityFilter?.addEventListener('change', updateFilters);

  candidates.forEach((candidate) => {
    candidate.addEventListener('click', async () => {
      const id = candidate.getAttribute('data-candidate-id') ?? '';
      try {
        await navigator.clipboard?.writeText(id);
        if (copyStatus) copyStatus.textContent = `kopierade ${id}`;
      } catch {
        if (copyStatus) copyStatus.textContent = id;
      }
    });
  });

  updateFilters();
}

function setupAnnotationMode(plan: PlanModel): void {
  const z4bbox = plan.zones.find((zone) => zone.id === 'Z4')?.normalized_bbox;
  const svg = document.querySelector<SVGSVGElement>('.z4-canvas svg');
  const annotationToggle = document.querySelector<HTMLInputElement>('#annotation-mode');
  const output = document.querySelector<HTMLTextAreaElement>('#annotation-output');
  const exportButton = document.querySelector<HTMLButtonElement>('#export-annotation-patch');
  const copyButton = document.querySelector<HTMLButtonElement>('#copy-annotation-patch');
  const copyStatus = document.querySelector<HTMLElement>('#copy-status');

  if (!z4bbox || !svg) return;

  const roomMap = new Map((plan.room_polygon_candidates ?? []).filter((candidate) => candidate.zone === 'Z4').map((candidate) => [candidate.id, candidate]));
  const doorMap = new Map((plan.door_candidates ?? []).filter((candidate) => candidate.zone === 'Z4').map((candidate) => [candidate.id, candidate]));
  let active: null | { kind: 'room' | 'door'; id: string; index: number; handle: SVGCircleElement } = null;

  const clientToGlobalPoint = (event: PointerEvent): NormalizedPoint => {
    const rect = svg.getBoundingClientRect();
    const localX = clamp01((event.clientX - rect.left) / rect.width);
    const localY = clamp01((event.clientY - rect.top) / rect.height);
    const [x1, y1, x2, y2] = z4bbox;
    return [round(x1 + localX * (x2 - x1)), round(y1 + localY * (y2 - y1))];
  };

  const updateHandle = (handle: SVGCircleElement, point: NormalizedPoint) => {
    const [x, y] = toCanvasPoint(point, z4bbox);
    handle.setAttribute('cx', String(round(x)));
    handle.setAttribute('cy', String(round(y)));
  };

  const updateRoomDom = (id: string) => {
    const candidate = roomMap.get(id);
    const group = document.querySelector<SVGGElement>(`g[data-candidate-id="${id}"]`);
    const polygon = group?.querySelector<SVGPolygonElement>('polygon');
    if (!candidate || !polygon) return;
    polygon.setAttribute('points', pointsToSvg(candidate.normalized_polygon, z4bbox));
  };

  const updateDoorDom = (id: string) => {
    const candidate = doorMap.get(id);
    const group = document.querySelector<SVGGElement>(`g[data-candidate-id="${id}"]`);
    const line = group?.querySelector<SVGLineElement>('line');
    if (!candidate || !line) return;
    const [[x1, y1], [x2, y2]] = candidate.normalized_line.map((point) => toCanvasPoint(point, z4bbox));
    line.setAttribute('x1', String(round(x1)));
    line.setAttribute('y1', String(round(y1)));
    line.setAttribute('x2', String(round(x2)));
    line.setAttribute('y2', String(round(y2)));
  };

  const buildPatch = () => ({
    schema_version: 'plan5f.annotation_patch.v1',
    zone: 'Z4',
    coordinate_system: 'normalized_image_coordinates',
    generated_at: new Date().toISOString(),
    room_polygon_candidates: Array.from(roomMap.values()).map((candidate) => ({
      id: candidate.id,
      normalized_polygon: candidate.normalized_polygon,
    })),
    door_candidates: Array.from(doorMap.values()).map((candidate) => ({
      id: candidate.id,
      normalized_line: candidate.normalized_line,
      width_m_estimate: candidate.width_m_estimate,
    })),
  });

  const refreshOutput = () => {
    if (!output) return;
    output.value = JSON.stringify(buildPatch(), null, 2);
  };

  annotationToggle?.addEventListener('change', () => {
    document.body.classList.toggle('annotation-mode', annotationToggle.checked);
    refreshOutput();
  });

  document.querySelectorAll<SVGCircleElement>('.drag-handle').forEach((handle) => {
    handle.addEventListener('pointerdown', (event) => {
      if (!annotationToggle?.checked) return;
      event.preventDefault();
      event.stopPropagation();
      const kind = handle.dataset.editKind === 'door' ? 'door' : 'room';
      const id = handle.dataset.candidateId ?? '';
      const index = Number(handle.dataset.pointIndex ?? 0);
      active = { kind, id, index, handle };
      handle.classList.add('dragging');
      handle.setPointerCapture?.(event.pointerId);
    });
  });

  window.addEventListener('pointermove', (event) => {
    if (!active) return;
    const point = clientToGlobalPoint(event);

    if (active.kind === 'room') {
      const candidate = roomMap.get(active.id);
      if (!candidate) return;
      candidate.normalized_polygon[active.index] = point;
      updateHandle(active.handle, point);
      updateRoomDom(active.id);
    } else {
      const candidate = doorMap.get(active.id);
      if (!candidate) return;
      candidate.normalized_line[active.index] = point;
      updateHandle(active.handle, point);
      updateDoorDom(active.id);
    }

    refreshOutput();
  });

  window.addEventListener('pointerup', () => {
    active?.handle.classList.remove('dragging');
    active = null;
  });

  exportButton?.addEventListener('click', refreshOutput);
  copyButton?.addEventListener('click', async () => {
    refreshOutput();
    try {
      await navigator.clipboard?.writeText(output?.value ?? '');
      if (copyStatus) copyStatus.textContent = 'patch kopierad';
    } catch {
      if (copyStatus) copyStatus.textContent = 'kopiering misslyckades';
    }
  });

  refreshOutput();
}

function render(plan: PlanModel): void {
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `\n    <header class="hero">\n      <p class="eyebrow">Plan 5F Open World</p>\n      <h1>Extraction Review v0.4</h1>\n      <p>Detta är mellanmodellen mellan PDF-planritningen och 3D-simulatorn. Granska dörrar, rum, etiketter och utrustning innan 3D genereras.</p>\n    </header>\n\n    <section class="stats">\n      <div><strong>${plan.rooms.length}</strong><span>rum/zoner</span></div>\n      <div><strong>${plan.doors.length}</strong><span>dörrar</span></div>\n      <div><strong>${plan.emergency_exits.length}</strong><span>nödutgångar</span></div>\n      <div><strong>${plan.equipment.length}</strong><span>utrustningsobjekt</span></div>\n      <div><strong>${plan.room_polygon_candidates?.length ?? 0}</strong><span>room candidates</span></div>\n      <div><strong>${plan.door_candidates?.length ?? 0}</strong><span>door candidates</span></div>\n    </section>\n\n    ${renderPlanOverview(plan)}\n    ${renderZ4Overlay(plan)}\n    ${renderZones(plan)}\n\n    ${renderTable('Rum', plan.rooms as unknown as Record<string, unknown>[], ['id', 'room_number', 'name', 'category', 'zone', 'confidence'])}\n    ${renderTable('Dörrar', plan.doors as unknown as Record<string, unknown>[], ['id', 'type', 'zone', 'between', 'swing_visible', 'confidence'])}\n    ${renderTable('Nödutgångar', plan.emergency_exits as unknown as Record<string, unknown>[], ['id', 'type', 'zone', 'label', 'confidence'])}\n    ${renderTable('Utrustning', plan.equipment as unknown as Record<string, unknown>[], ['id', 'type', 'label', 'zone', 'room_id', 'should_block_player', 'confidence'])}\n\n    <section class="card">\n      <h2>Unresolved questions</h2>\n      <ol>${plan.unresolved_questions.map((q) => `<li>${q}</li>`).join('')}</ol>\n    </section>\n\n    <footer>\n      <p>Confidence-markeringar finns i JSON. Nästa steg: verifiera Z4-koordinater i annotation UI och bygg sedan första 3D-walkable loop.</p>\n    </footer>\n  `;

  applyConfidenceClasses();
  setupOptionalBackgroundImages();
  setupOverlayControls();
  setupAnnotationMode(plan);
}

loadPlan().then(render).catch((error) => {
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `<pre>${String(error)}</pre>`;
});
