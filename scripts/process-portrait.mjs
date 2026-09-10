/**
 * Builds the shipped portrait from assets/portrait-source.jpg.
 * SPEC A5 caps the portrait at 60 KB, so AVIF leads, WebP follows and JPEG
 * is the floor. Run it again after replacing the source.
 */
import { statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'assets/portrait-source.jpg');

const { width, height } = await sharp(source).metadata();
// Crop to 4:5 from the top so the head keeps its air.
const cropHeight = Math.min(height, Math.round(width / 0.8));
const base = sharp(source)
  .extract({ left: 0, top: 0, width, height: cropHeight })
  .resize(560, 700, {
    fit: 'cover',
    position: 'top',
  });

const outputs = [
  ['portrait.avif', (pipe) => pipe.avif({ quality: 52, effort: 6 })],
  ['portrait.webp', (pipe) => pipe.webp({ quality: 74, effort: 6 })],
  ['portrait.jpg', (pipe) => pipe.jpeg({ quality: 78, mozjpeg: true, progressive: true })],
];

for (const [name, encode] of outputs) {
  const file = resolve(root, 'public', name);
  await encode(base.clone()).toFile(file);
  const kb = statSync(file).size / 1024;
  console.log(`${name} — ${kb.toFixed(1)} KB${kb > 60 ? '  ⚠ over the 60 KB budget' : ''}`);
}
