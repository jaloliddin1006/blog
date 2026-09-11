/**
 * The content database.
 *
 * Posts and projects live here because they keep being added; everything else
 * — the profile, the roles, the skills, the certificates — is settled, so it
 * stays in src/content/*.json where it can be reviewed as a diff.
 *
 * SQLite is Node's own module, so this costs no dependency. The file is small
 * and committed: the repository is still the source of truth, and the build
 * reads the database rather than a server.
 */
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/*
 * `node:sqlite` is flagged experimental and prints a warning on import, which
 * would appear on every build. A listener of our own replaces Node's default
 * printing, so the notice is dropped and every other warning still shows. It
 * has to be installed before the module loads, hence the dynamic import.
 */
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning.message?.includes('SQLite is an experimental feature')) return;
  console.warn(warning.stack ?? warning.message);
});

const { DatabaseSync } = await import('node:sqlite');

/*
 * Resolved from the working directory rather than from import.meta.url: this
 * module is bundled into dist/ during the build, where a relative path would
 * point at the output instead of the repository.
 */
export const ROOT = process.env.SITE_ROOT ?? process.cwd();
export const DB_PATH = process.env.SITE_DB ?? resolve(ROOT, 'data/site.db');
export const LOCALES = ['en', 'uz', 'ru'];

const SCHEMA = `
CREATE TABLE IF NOT EXISTS posts (
  slug       TEXT NOT NULL,
  lang       TEXT NOT NULL CHECK (lang IN ('en', 'uz', 'ru')),
  title      TEXT NOT NULL,
  summary    TEXT NOT NULL,
  body       TEXT NOT NULL DEFAULT '',
  date       TEXT NOT NULL,
  draft      INTEGER NOT NULL DEFAULT 0,
  external   TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (slug, lang)
);

CREATE TABLE IF NOT EXISTS projects (
  slug        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  repo        TEXT NOT NULL,
  demo        TEXT,
  license     TEXT,
  featured    INTEGER NOT NULL DEFAULT 0,
  position    INTEGER NOT NULL DEFAULT 0,
  stack       TEXT NOT NULL,          -- JSON array of up to three chips
  description TEXT NOT NULL,          -- JSON { en, uz, ru }
  details     TEXT NOT NULL,          -- JSON { en: string[], uz: [], ru: [] }
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS screenshots (
  project  TEXT NOT NULL REFERENCES projects(slug) ON DELETE CASCADE,
  file     TEXT NOT NULL,
  alt      TEXT NOT NULL,             -- JSON { en, uz, ru }
  caption  TEXT,                      -- JSON { en, uz, ru } or NULL
  position INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (project, file)
);

CREATE INDEX IF NOT EXISTS posts_by_date ON posts (lang, draft, date DESC);
CREATE INDEX IF NOT EXISTS projects_by_position ON projects (featured DESC, position);
`;

export function openDb({ readonly = false } = {}) {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH, { readOnly: readonly });
  db.exec('PRAGMA foreign_keys = ON');
  if (!readonly) db.exec(SCHEMA);
  return db;
}

/** Rows come back with JSON columns already parsed. */
export function readProjects(db) {
  const rows = db.prepare('SELECT * FROM projects ORDER BY featured DESC, position, slug').all();
  const shots = db.prepare('SELECT * FROM screenshots WHERE project = ? ORDER BY position, file');
  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    repo: row.repo,
    demo: row.demo ?? null,
    ...(row.license ? { license: row.license } : {}),
    featured: Boolean(row.featured),
    stack: JSON.parse(row.stack),
    description: JSON.parse(row.description),
    details: JSON.parse(row.details),
    screenshots: shots.all(row.slug).map((shot) => ({
      file: shot.file,
      alt: JSON.parse(shot.alt),
      ...(shot.caption ? { caption: JSON.parse(shot.caption) } : {}),
    })),
  }));
}

export function readPosts(db, { includeDrafts = false } = {}) {
  const sql = includeDrafts
    ? 'SELECT * FROM posts ORDER BY date DESC, slug'
    : 'SELECT * FROM posts WHERE draft = 0 ORDER BY date DESC, slug';
  return db
    .prepare(sql)
    .all()
    .map((row) => ({
      slug: row.slug,
      lang: row.lang,
      title: row.title,
      summary: row.summary,
      body: row.body,
      date: row.date,
      draft: Boolean(row.draft),
      external: row.external ?? undefined,
    }));
}
