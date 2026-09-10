/**
 * Uzbek Latin needs oʻ / gʻ and the tutuq belgisi — never the ASCII apostrophe.
 *
 * The strictly correct code points are U+02BB and U+02BC, but IBM Plex draws
 * both with a full letter-width advance, which spaces Uzbek words out
 * visibly ("yig ʻ iladi"). This site therefore uses U+2018 (‘) and U+2019 (’),
 * which carry the same shapes with correct metrics in this typeface.
 * This check enforces that choice and rejects the ASCII apostrophe outright.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const BANNED = [
  { char: "'", code: "ASCII '", hint: 'use ‘ (U+2018) or ’ (U+2019)' },
  { char: 'ʻ', code: 'U+02BB', hint: 'use ‘ (U+2018) — U+02BB is drawn full-width by IBM Plex' },
  { char: 'ʼ', code: 'U+02BC', hint: 'use ’ (U+2019) — U+02BC is drawn full-width by IBM Plex' },
];

const offenders = [];

/** A word-internal mark; YAML quoting is not one. */
const hits = (text) =>
  BANNED.filter(({ char }) => new RegExp(`\\p{L}${char === "'" ? "'" : char}`, 'u').test(text));

/** Strips the delimiters of a YAML single-quoted scalar so they are not read as text. */
function unquote(line) {
  const match = /^(\s*[\w.-]+:\s*)'(.*)'\s*$/.exec(line);
  return match ? match[2].replace(/''/g, '') : line;
}

function checkFile(file) {
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, index) => {
      for (const { code, hint } of hits(unquote(line))) {
        offenders.push(`${file}:${index + 1}  ${code} — ${hint}\n    ${line.trim()}`);
      }
    });
}

function walk(path) {
  const stats = statSync(path, { throwIfNoEntry: false });
  if (!stats) return;
  if (stats.isDirectory()) {
    for (const entry of readdirSync(path)) walk(join(path, entry));
  } else if (/\.(json|md)$/.test(path)) {
    checkFile(path);
  }
}

for (const target of ['src/i18n/uz.json', 'src/content/posts/uz']) {
  walk(resolve(process.cwd(), target));
}

/** Uzbek values inside the shared, multi-language content files. */
function checkLocalized(file) {
  const data = JSON.parse(readFileSync(resolve(process.cwd(), file), 'utf8'));
  const visit = (node, path) => {
    if (typeof node === 'string') {
      if (path.endsWith('.uz')) {
        for (const { code, hint } of hits(node)) {
          offenders.push(`${file} → ${path}  ${code} — ${hint}\n    ${node}`);
        }
      }
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((item, index) => visit(item, `${path}[${index}]`));
      return;
    }
    if (node && typeof node === 'object') {
      for (const [key, value] of Object.entries(node)) {
        visit(value, path ? `${path}.${key}` : key);
      }
    }
  };
  visit(data, '');
}

for (const file of [
  'src/content/profile.json',
  'src/content/experience.json',
  'src/content/projects.json',
  'src/content/skills.json',
  'src/content/education.json',
  'src/content/certifications.json',
]) {
  checkLocalized(file);
}

if (offenders.length > 0) {
  console.error('Wrong apostrophe in Uzbek content:');
  for (const offender of offenders) console.error(`  ${offender}`);
  process.exit(1);
}

console.log('Uzbek apostrophes OK');
