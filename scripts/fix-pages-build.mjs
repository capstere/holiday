import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const pagesBase = '/holiday/';

if (!fs.existsSync(distDir)) {
  console.error('dist folder not found. Run vite build first.');
  process.exit(1);
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return [fullPath];
  });
}

let changed = 0;
for (const filePath of walk(distDir)) {
  if (!/\.(js|html|css)$/.test(filePath)) continue;
  const before = fs.readFileSync(filePath, 'utf8');
  let after = before;

  after = after.replaceAll('/generated/z4.geometry-v0.json', `${pagesBase}generated/z4.geometry-v0.json`);
  after = after.replaceAll('href="/"', `href="${pagesBase}"`);
  after = after.replaceAll("href='/'", `href='${pagesBase}'`);

  if (after !== before) {
    fs.writeFileSync(filePath, after, 'utf8');
    changed += 1;
  }
}

console.log(`GitHub Pages build fix complete. Files changed: ${changed}`);
