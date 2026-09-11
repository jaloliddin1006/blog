/**
 * Writes the database out as plain JSON under data/export/.
 *
 * The database is the source of truth, but a binary file does not review well.
 * This gives a diffable snapshot to commit alongside it — and a way back if the
 * file is ever lost: `node scripts/db-migrate.mjs` reads the same shapes.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { openDb, readPosts, readProjects, ROOT } from '../src/lib/db.mjs';

const db = openDb({ readonly: true });
const out = resolve(ROOT, 'data/export');
mkdirSync(out, { recursive: true });

const posts = readPosts(db, { includeDrafts: true });
const projects = readProjects(db);
db.close();

writeFileSync(resolve(out, 'posts.json'), `${JSON.stringify(posts, null, 2)}\n`, 'utf8');
writeFileSync(resolve(out, 'projects.json'), `${JSON.stringify(projects, null, 2)}\n`, 'utf8');

console.log(`data/export/posts.json — ${posts.length} post(s)`);
console.log(`data/export/projects.json — ${projects.length} project(s)`);
