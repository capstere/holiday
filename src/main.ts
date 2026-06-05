import type {
  DoorCandidate,
  EquipmentCandidate,
  NormalizedBbox,
  NormalizedPoint,
  PlanModel,
  RoomPolygonCandidate,
} from './types';
import './style.css';

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

function pointsToSvg(points: NormalizedPoint[], bbox?: NormalizedBbox): string {
  return points
    .map(([x, y]) => {
      if (!bbox) return `${pct(x)},${pct(y)}`;
      const [x1, y1, x2, y2] = bbox;
      return `${pct((x - x1) / (x2 - x1))},${pct((y - y1) / (y2 - y1))}`;
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

function renderPlanOverview(plan: PlanModel): string {
  return `\n    <section class="card overlay-card">\n      <h2>Plan overview <span>zon-bboxar</span></h2>\n      <p class="muted">Detta är en normaliserad arbetsyta. Lägg en lokal ritningsbild i <code>public/source/plan5f.png</code> för att se den under overlayn. Bilden är inte committad eftersom repot är publikt.</p>\n      <div class="plan-canvas full-plan" data-background="missing">\n        <div class="missing-background">Local background image placeholder</div>\n        ${plan.zones
          .filter((zone) => zone.normalized_bbox)
          .map(
            (zone) => `\n              <div class="zone-box" style="${bboxStyle(zone.normalized_bbox!)}">\n                <span>${zone.id}</span>\n              </div>\n            `,
          )
          .join('')}\n      </div>\n    </section>\n  `;
}

function renderRoomPolygon(candidate: RoomPolygonCandidate, z4bbox: NormalizedBbox): string {
  return `\n    <polygon class="room-poly confidence-stroke-${candidate.confidence}" points="${pointsToSvg(candidate.normalized_polygon, z4bbox)}">\n      <title>${candidate.id}: ${candidate.label}</title>\n    </polygon>\n  `;
}

function renderDoorCandidate(candidate: DoorCandidate, z4bbox: NormalizedBbox): string {
  return `\n    <line class="door-line confidence-stroke-${candidate.confidence}" x1="${pointsToSvg([candidate.normalized_line[0]], z4bbox).split(',')[0]}" y1="${pointsToSvg([candidate.normalized_line[0]], z4bbox).split(',')[1]}" x2="${pointsToSvg([candidate.normalized_line[1]], z4bbox).split(',')[0]}" y2="${pointsToSvg([candidate.normalized_line[1]], z4bbox).split(',')[1]}">\n      <title>${candidate.id}: ${candidate.between?.join(' ↔ ') ?? 'unknown'}</title>\n    </line>\n  `;
}

function renderEquipmentCandidate(candidate: EquipmentCandidate, z4bbox: NormalizedBbox): string {
  return `\n    <div class="equipment-box confidence-bg-${candidate.confidence}" style="${bboxStyle(candidate.normalized_bbox, z4bbox)}" title="${candidate.id}: ${candidate.label}">\n      <span>${candidate.type}</span>\n    </div>\n  `;
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

  return `\n    <section class="card overlay-card">\n      <h2>Z4 overlay <span>room/door/equipment candidates</span></h2>\n      <p class="muted">Overlayn visar grova normaliserade Z4-kandidater. Rumsytor = polygoner, dörrar = linjer, utrustning = fyllda boxar. Detta är en granskningsvy, inte slutlig 3D-geometri.</p>\n      <div class="legend">\n        <span><i class="legend-room"></i> rumspolygon</span>\n        <span><i class="legend-door"></i> dörrlinje</span>\n        <span><i class="legend-equipment"></i> utrustning</span>\n      </div>\n      <div class="z4-grid">\n        <div class="plan-canvas z4-canvas" data-background="missing">\n          <div class="missing-background">Z4 crop placeholder</div>\n          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Z4 candidate overlay">\n            ${rooms.map((candidate) => renderRoomPolygon(candidate, z4bbox)).join('')}\n            ${doors.map((candidate) => renderDoorCandidate(candidate, z4bbox)).join('')}\n          </svg>\n          ${equipment.map((candidate) => renderEquipmentCandidate(candidate, z4bbox)).join('')}\n        </div>\n        <aside class="graph-panel">\n          <h3>Navigation graph</h3>\n          <p>${z4Nodes.length} noder, ${z4Edges.length} edges</p>\n          <ol>\n            ${z4Edges
              .map((edge) => `<li><strong>${edge.from}</strong> → <strong>${edge.to}</strong><br><small>${edge.door_candidate_id ?? 'no door candidate'} · ${edge.confidence}</small></li>`)
              .join('')}\n          </ol>\n        </aside>\n      </div>\n    </section>\n\n    ${renderTable('Z4 room_polygon_candidates', rooms as unknown as Record<string, unknown>[], ['id', 'source_room_id', 'label', 'confidence', 'priority'])}\n    ${renderTable('Z4 door_candidates', doors as unknown as Record<string, unknown>[], ['id', 'type', 'between', 'width_m_estimate', 'confidence', 'priority'])}\n    ${renderTable('Z4 equipment_candidates', equipment as unknown as Record<string, unknown>[], ['id', 'room_id', 'type', 'collider_mode', 'confidence', 'priority'])}\n  `;
}

function applyConfidenceClasses(): void {
  document.querySelectorAll('td').forEach((td) => {
    const text = td.textContent?.trim() ?? '';
    if (['high', 'medium', 'low', 'unknown'].includes(text)) td.classList.add(confidenceClass(text));
  });
}

function render(plan: PlanModel): void {
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `\n    <header class="hero">\n      <p class="eyebrow">Plan 5F Open World</p>\n      <h1>Extraction Review v0.2</h1>\n      <p>Detta är mellanmodellen mellan PDF-planritningen och 3D-simulatorn. Granska dörrar, rum, etiketter och utrustning innan 3D genereras.</p>\n    </header>\n\n    <section class="stats">\n      <div><strong>${plan.rooms.length}</strong><span>rum/zoner</span></div>\n      <div><strong>${plan.doors.length}</strong><span>dörrar</span></div>\n      <div><strong>${plan.emergency_exits.length}</strong><span>nödutgångar</span></div>\n      <div><strong>${plan.equipment.length}</strong><span>utrustningsobjekt</span></div>\n      <div><strong>${plan.room_polygon_candidates?.length ?? 0}</strong><span>room candidates</span></div>\n      <div><strong>${plan.door_candidates?.length ?? 0}</strong><span>door candidates</span></div>\n    </section>\n\n    ${renderPlanOverview(plan)}\n    ${renderZ4Overlay(plan)}\n    ${renderZones(plan)}\n\n    ${renderTable('Rum', plan.rooms as unknown as Record<string, unknown>[], ['id', 'room_number', 'name', 'category', 'zone', 'confidence'])}\n    ${renderTable('Dörrar', plan.doors as unknown as Record<string, unknown>[], ['id', 'type', 'zone', 'between', 'swing_visible', 'confidence'])}\n    ${renderTable('Nödutgångar', plan.emergency_exits as unknown as Record<string, unknown>[], ['id', 'type', 'zone', 'label', 'confidence'])}\n    ${renderTable('Utrustning', plan.equipment as unknown as Record<string, unknown>[], ['id', 'type', 'label', 'zone', 'room_id', 'should_block_player', 'confidence'])}\n\n    <section class="card">\n      <h2>Unresolved questions</h2>\n      <ol>${plan.unresolved_questions.map((q) => `<li>${q}</li>`).join('')}</ol>\n    </section>\n\n    <footer>\n      <p>Confidence-markeringar finns i JSON. Nästa steg: verifiera Z4-koordinater i annotation UI och bygg sedan första 3D-walkable loop.</p>\n    </footer>\n  `;

  applyConfidenceClasses();
}

loadPlan().then(render).catch((error) => {
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `<pre>${String(error)}</pre>`;
});
