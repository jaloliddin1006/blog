/**
 * Builds the 1200×630 Open Graph card for each language, plus the
 * apple-touch-icon, from profile.json and the self-hosted fonts.
 * No external service, no runtime dependency (SPEC A5 / C-Agent3.5).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { decompress } from 'wawoff2';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const profile = JSON.parse(readFileSync(resolve(root, 'src/content/profile.json'), 'utf8'));

/**
 * resvg reads TTF/OTF, not woff2, so the shipped web fonts are decompressed
 * into a temp directory first. Without this the cards render with no text.
 */
/**
 * Font loading for the cards.
 *
 * resvg picks one face per family and then falls back across every loaded font
 * for any glyph that face lacks. The shipped web fonts are split into Latin and
 * Cyrillic files, so a mixed-script card (Latin name, Cyrillic title) would fall
 * back unpredictably — Cyrillic sans text landing in the serif, for instance.
 *
 * The fix is to load exactly one Cyrillic-capable face: the sans. Every Cyrillic
 * glyph then has one possible home. The Latin faces cover the rest, and the
 * regular-weight serif is loaded because fontsource names the 600 face
 * "IBM Plex Serif SemiBold", which resvg will not match on its own.
 */
const SOURCES = [
  resolve(root, 'public/fonts/ibm-plex-serif-latin-600-normal.woff2'),
  resolve(root, 'public/fonts/ibm-plex-sans-latin-400-normal.woff2'),
  resolve(root, 'public/fonts/ibm-plex-sans-cyrillic-400-normal.woff2'),
  resolve(root, 'public/fonts/ibm-plex-mono-latin-400-normal.woff2'),
  // build-time only, never shipped: gives "IBM Plex Serif" a name resvg matches
  resolve(
    root,
    'node_modules/@fontsource/ibm-plex-serif/files/ibm-plex-serif-latin-400-normal.woff2',
  ),
];

const fontDir = resolve(tmpdir(), 'mamatmusayev-og-fonts');
mkdirSync(fontDir, { recursive: true });

const FONTS = [];
for (const source of SOURCES) {
  const ttf = resolve(fontDir, basename(source).replace(/\.woff2$/, '.ttf'));
  writeFileSync(ttf, await decompress(readFileSync(source)));
  FONTS.push(ttf);
}

const INK = '#EAF0F7';
const MUTED = '#9DB0C6';
const GROUND = '#0F1722';
const ACCENT = '#5FC0D2';

const escape = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Rough width metric; good enough to wrap a two-line title inside 1000px. */
function wrap(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// The same node/edge motif as the hero, placed in the lower right.
const NODES = [
  [820, 470],
  [900, 400],
  [990, 470],
  [1075, 405],
  [860, 555],
  [960, 560],
  [1060, 545],
];
const EDGES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [0, 4],
  [4, 5],
  [5, 2],
  [5, 6],
  [6, 3],
];

function card(locale) {
  const title = profile.title[locale];
  const org = profile.org[locale];
  const lines = wrap(title, 40).slice(0, 2);

  const motif = [
    EDGES.map(
      ([a, b]) =>
        `<line x1="${NODES[a][0]}" y1="${NODES[a][1]}" x2="${NODES[b][0]}" y2="${NODES[b][1]}" stroke="${ACCENT}" stroke-width="1.5" opacity="0.35"/>`,
    ).join(''),
    NODES.map(
      ([cx, cy], index) =>
        `<circle cx="${cx}" cy="${cy}" r="${index % 3 === 0 ? 5 : 3.5}" fill="${ACCENT}" opacity="0.5"/>`,
    ).join(''),
  ].join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${GROUND}"/>
  ${motif}
  <rect x="80" y="150" width="72" height="4" fill="${ACCENT}"/>
  <text x="80" y="120" font-family="IBM Plex Mono" font-size="24" fill="${MUTED}" letter-spacing="1.5">${escape(org)}</text>
  <text x="80" y="250" font-family="IBM Plex Serif SemiBold, IBM Plex Serif" font-size="66" fill="${INK}">${escape(profile.name)}</text>
  ${lines
    .map(
      (line, index) =>
        `<text x="80" y="${330 + index * 46}" font-family="IBM Plex Sans" font-size="34" fill="${MUTED}">${escape(line)}</text>`,
    )
    .join('\n  ')}
  <text x="80" y="560" font-family="IBM Plex Mono" font-size="24" fill="${ACCENT}">mamatmusayev.uz</text>
</svg>`;
}

function render(svg, width) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'IBM Plex Sans' },
  });
  return resvg.render().asPng();
}

const outDir = resolve(root, 'public/og');
mkdirSync(outDir, { recursive: true });

for (const locale of ['en', 'uz', 'ru']) {
  const png = render(card(locale), 1200);
  writeFileSync(resolve(outDir, `og-${locale}.png`), png);
  console.log(`og-${locale}.png — ${(png.length / 1024).toFixed(1)} KB`);
}

const icon = readFileSync(resolve(root, 'public/favicon.svg'), 'utf8').replace(
  "Georgia, 'Times New Roman', serif",
  'IBM Plex Serif',
);
const iconPng = render(icon, 180);
writeFileSync(resolve(root, 'public/apple-touch-icon.png'), iconPng);
console.log(`apple-touch-icon.png — ${(iconPng.length / 1024).toFixed(1)} KB`);
