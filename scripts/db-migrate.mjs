/**
 * Seeds the content database from the files it replaces, once.
 *
 *   node scripts/db-migrate.mjs          — import and report
 *   node scripts/db-migrate.mjs --prune  — import, then delete the old files
 *
 * Safe to run again: every write is an upsert keyed by slug.
 */
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { openDb, ROOT, LOCALES } from '../src/lib/db.mjs';

const prune = process.argv.includes('--prune');
const db = openDb();

/* ------------------------------------------------------------------ posts */

/** The frontmatter this project writes: flat keys, single-quoted scalars. */
function frontmatter(text) {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  if (!match) return { data: {}, body: text.trim() };
  const data = {};
  for (const line of match[1].split('\n')) {
    const pair = /^([\w.-]+):\s*(.*)$/.exec(line.trim());
    if (!pair) continue;
    let value = pair[2].trim();
    if (/^'.*'$/.test(value)) value = value.slice(1, -1).replace(/''/g, "'");
    data[pair[1]] = value;
  }
  return { data, body: text.slice(match[0].length).trim() };
}

const upsertPost = db.prepare(`
  INSERT INTO posts (slug, lang, title, summary, body, date, draft, external, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  ON CONFLICT(slug, lang) DO UPDATE SET
    title = excluded.title, summary = excluded.summary, body = excluded.body,
    date = excluded.date, draft = excluded.draft, external = excluded.external,
    updated_at = datetime('now')
`);

let posts = 0;
for (const lang of LOCALES) {
  const dir = resolve(ROOT, 'src/content/posts', lang);
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.md'))) {
    const { data, body } = frontmatter(readFileSync(join(dir, file), 'utf8'));
    upsertPost.run(
      file.replace(/\.md$/, ''),
      data.lang ?? lang,
      data.title ?? file,
      data.summary ?? '',
      body,
      String(data.date ?? '').slice(0, 10),
      data.draft === 'true' ? 1 : 0,
      data.external ?? null,
    );
    posts += 1;
  }
}

/* --------------------------------------------------------------- projects */

const upsertProject = db.prepare(`
  INSERT INTO projects (slug, name, repo, demo, license, featured, position, stack, description, details, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  ON CONFLICT(slug) DO UPDATE SET
    name = excluded.name, repo = excluded.repo, demo = excluded.demo,
    license = excluded.license, featured = excluded.featured, position = excluded.position,
    stack = excluded.stack, description = excluded.description, details = excluded.details,
    updated_at = datetime('now')
`);
const upsertShot = db.prepare(`
  INSERT INTO screenshots (project, file, alt, caption, position)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(project, file) DO UPDATE SET
    alt = excluded.alt, caption = excluded.caption, position = excluded.position
`);

let projects = 0;
let shots = 0;
const source = resolve(ROOT, 'src/content/projects.json');
if (existsSync(source)) {
  const list = JSON.parse(readFileSync(source, 'utf8'));
  list.forEach((project, index) => {
    upsertProject.run(
      project.slug,
      project.name,
      project.repo,
      project.demo ?? null,
      project.license ?? null,
      project.featured ? 1 : 0,
      index,
      JSON.stringify(project.stack),
      JSON.stringify(project.description),
      JSON.stringify(project.details ?? { en: [], uz: [], ru: [] }),
    );
    projects += 1;
    (project.screenshots ?? []).forEach((shot, order) => {
      upsertShot.run(
        project.slug,
        shot.file,
        JSON.stringify(shot.alt),
        shot.caption ? JSON.stringify(shot.caption) : null,
        order,
      );
      shots += 1;
    });
  });
}

console.log(`posts: ${posts}  projects: ${projects}  screenshots: ${shots}`);

if (prune) {
  for (const path of ['src/content/projects.json', 'src/content/posts']) {
    const target = resolve(ROOT, path);
    if (existsSync(target)) {
      rmSync(target, { recursive: true, force: true });
      console.log(`removed ${path}`);
    }
  }
}

db.close();
