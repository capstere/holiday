import type { PlanModel } from './types';
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

function render(plan: PlanModel): void {
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `\n    <header class="hero">\n      <p class="eyebrow">Plan 5F Open World</p>\n      <h1>Extraction Review v0</h1>\n      <p>Detta är mellanmodellen mellan PDF-planritningen och 3D-simulatorn. Granska dörrar, rum, etiketter och utrustning innan 3D genereras.</p>\n    </header>\n\n    <section class="stats">\n      <div><strong>${plan.rooms.length}</strong><span>rum/zoner</span></div>\n      <div><strong>${plan.doors.length}</strong><span>dörrar</span></div>\n      <div><strong>${plan.emergency_exits.length}</strong><span>nödutgångar</span></div>\n      <div><strong>${plan.equipment.length}</strong><span>utrustningsobjekt</span></div>\n      <div><strong>${plan.labels.length}</strong><span>lästa labels</span></div>\n    </section>\n\n    ${renderZones(plan)}\n\n    ${renderTable('Rum', plan.rooms as unknown as Record<string, unknown>[], ['id', 'room_number', 'name', 'category', 'zone', 'confidence'])}\n    ${renderTable('Dörrar', plan.doors as unknown as Record<string, unknown>[], ['id', 'type', 'zone', 'between', 'swing_visible', 'confidence'])}\n    ${renderTable('Nödutgångar', plan.emergency_exits as unknown as Record<string, unknown>[], ['id', 'type', 'zone', 'label', 'confidence'])}\n    ${renderTable('Utrustning', plan.equipment as unknown as Record<string, unknown>[], ['id', 'type', 'label', 'zone', 'room_id', 'should_block_player', 'confidence'])}\n\n    <section class="card">\n      <h2>Unresolved questions</h2>\n      <ol>${plan.unresolved_questions.map((q) => `<li>${q}</li>`).join('')}</ol>\n    </section>\n\n    <footer>\n      <p>Confidence-markeringar finns i JSON. Nästa steg: manuella koordinater och maskerade lager för vägg/dörr/text/utrustning.</p>\n    </footer>\n  `;

  document.querySelectorAll('td').forEach((td) => {
    const text = td.textContent?.trim() ?? '';
    if (['high', 'medium', 'low', 'unknown'].includes(text)) td.classList.add(confidenceClass(text));
  });
}

loadPlan().then(render).catch((error) => {
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `<pre>${String(error)}</pre>`;
});
