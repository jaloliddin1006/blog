/**
 * SPEC A5: at most 8 KB of JavaScript on first load. Three.js is excluded
 * because it is dynamically imported and never fetched unless the WebGL
 * backdrop will actually run — but it must stay out of the entry chunk.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const BUDGET_KB = 8;
const dir = resolve(process.cwd(), 'dist/_astro');

const files = readdirSync(dir).filter((file) => file.endsWith('.js'));
const eager = files.filter((file) => !/three/i.test(file));
const lazy = files.filter((file) => /three/i.test(file));

let total = 0;
for (const file of eager) {
  const bytes = gzipSync(readFileSync(join(dir, file))).length;
  total += bytes;
  console.log(`  eager  ${(bytes / 1024).toFixed(2)} KB gz  ${file}`);
}
for (const file of lazy) {
  const raw = statSync(join(dir, file)).size;
  console.log(`  lazy   ${(raw / 1024).toFixed(0)} KB raw  ${file}  (loaded on demand)`);
}

const kb = total / 1024;
console.log(`\nFirst-load JavaScript: ${kb.toFixed(2)} KB gzipped (budget ${BUDGET_KB} KB)`);

if (kb > BUDGET_KB) {
  console.error(`Over budget by ${(kb - BUDGET_KB).toFixed(2)} KB.`);
  process.exit(1);
}
