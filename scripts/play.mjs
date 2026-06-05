import { spawn, spawnSync } from 'node:child_process';
import process from 'node:process';

const planPath = 'public/data/plan5f.manual-v0.json';
const geometryPath = 'public/generated/z4.geometry-v0.json';

function runStep(command, args, label) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    console.error(`\n✖ Failed: ${label}`);
    process.exit(result.status ?? 1);
  }
}

runStep(process.execPath, ['scripts/export-z4-geometry.mjs', planPath, geometryPath], 'Generating Z4 geometry');

console.log('\n✅ Z4 geometry is ready.');
console.log('\nStarting local game server...');
console.log('\nOpen this in your browser if it does not open automatically:');
console.log('  http://localhost:5173/z4.html\n');
console.log('Controls: WASD move · mouse look · Shift faster · R reset · M minimap · O openings · C collision · Esc release mouse\n');

const vite = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['vite', '--host', '0.0.0.0', '--open', '/z4.html'],
  {
    stdio: 'inherit',
    shell: false,
  },
);

vite.on('exit', (code) => {
  process.exit(code ?? 0);
});
