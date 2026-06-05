import fs from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/validate-plan.mjs public/data/plan5f.manual-v0.json');
  process.exit(1);
}

const plan = JSON.parse(fs.readFileSync(file, 'utf8'));
const requiredArrays = ['zones', 'rooms', 'doors', 'emergency_exits', 'equipment', 'labels', 'unresolved_questions'];
const errors = [];

for (const key of requiredArrays) {
  if (!Array.isArray(plan[key])) errors.push(`${key} must be an array`);
}

function checkUnique(key) {
  const seen = new Set();
  for (const item of plan[key] ?? []) {
    if (!item.id) errors.push(`${key} item missing id`);
    if (seen.has(item.id)) errors.push(`duplicate id in ${key}: ${item.id}`);
    seen.add(item.id);
  }
}

['zones', 'rooms', 'doors', 'emergency_exits', 'equipment', 'labels'].forEach(checkUnique);

const zones = new Set((plan.zones ?? []).map((z) => z.id));
for (const collection of ['rooms', 'doors', 'emergency_exits', 'equipment', 'labels']) {
  for (const item of plan[collection] ?? []) {
    if (item.zone && !zones.has(item.zone)) errors.push(`${collection}/${item.id} references unknown zone ${item.zone}`);
  }
}

const rooms = new Set((plan.rooms ?? []).map((r) => r.id));
for (const door of plan.doors ?? []) {
  for (const roomId of door.between ?? []) {
    if (!rooms.has(roomId)) errors.push(`door ${door.id} references unknown room ${roomId}`);
  }
}

if (errors.length) {
  console.error('Plan validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Plan validation OK: ${plan.rooms.length} rooms, ${plan.doors.length} doors, ${plan.emergency_exits.length} exits, ${plan.equipment.length} equipment objects.`);
