/**
 * The studio's data layer and HTTP handlers.
 *
 * Two entry points mount this: `npm run studio` for a bare local server, and
 * server/app.mjs, which serves the built site and puts the studio behind a
 * password and a one-time code at /studio/.
 *
 * Every write is logged to data/studio.log and mirrored to data/export/*.json,
 * so a content change always leaves a readable trail next to the database.
 */
import { appendFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import sharp from 'sharp';
import { LOCALES, openDb, readPosts, readProjects, ROOT } from '../src/lib/db.mjs';

const SHOTS = resolve(ROOT, 'public/projects');
const UI = resolve(ROOT, 'scripts/studio/index.html');
const LOG = resolve(ROOT, 'data/studio.log');
const EXPORT = resolve(ROOT, 'data/export');

export { UI as STUDIO_UI };

/** A content change should never be silent: log it, then mirror it. */
async function record(action, detail) {
  const line = `${new Date().toISOString()}  ${action}  ${detail}\n`;
  await mkdir(resolve(ROOT, 'data'), { recursive: true });
  await appendFile(LOG, line, 'utf8');
  process.stdout.write(`studio  ${action}  ${detail}\n`);
}

/** Keeps data/export/*.json current, so `git diff` shows what changed. */
async function mirror() {
  const db = openDb({ readonly: true });
  try {
    await mkdir(EXPORT, { recursive: true });
    const posts = readPosts(db, { includeDrafts: true });
    const projects = readProjects(db);
    await writeFile(join(EXPORT, 'posts.json'), `${JSON.stringify(posts, null, 2)}\n`, 'utf8');
    await writeFile(
      join(EXPORT, 'projects.json'),
      `${JSON.stringify(projects, null, 2)}\n`,
      'utf8',
    );
  } finally {
    db.close();
  }
}

/** A copy of the database before anything is removed from it. */
async function backup(reason) {
  const dir = resolve(ROOT, 'data/backups');
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  await writeFile(join(dir, `site-${stamp}.db`), await readFile(resolve(ROOT, 'data/site.db')));
  await record('backup', `${reason} → data/backups/site-${stamp}.db`);
}

/* ------------------------------------------------------------------ helpers */

const CYRILLIC = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'yo',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

export function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[‘’ʻʼ']/g, '')
    .split('')
    .map((char) => CYRILLIC[char] ?? char)
    .join('')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/**
 * Uzbek orthography, the same rule `npm run lint` enforces: U+02BB/U+02BC are
 * swapped for the correctly-metered U+2018/U+2019, and a word-internal ASCII
 * apostrophe is rejected — only the author knows which of the two it should be.
 */
function uzbek(value, field) {
  const fixed = String(value ?? '')
    .replace(/ʻ/g, '‘')
    .replace(/ʼ/g, '’');
  if (/\p{L}'/u.test(fixed)) {
    throw new Error(
      `${field}: replace the ASCII apostrophe with ‘ (as in o‘, g‘) or ’ (as in ma’lumot)`,
    );
  }
  return fixed;
}

async function readBody(request, limit = 25 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) throw new Error('That file is larger than 25 MB');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

const readJsonBody = async (request) => JSON.parse((await readBody(request)).toString('utf8'));

const localized = (source, field, { required = true } = {}) =>
  Object.fromEntries(
    LOCALES.map((locale) => {
      const value = String(source?.[locale] ?? '').trim();
      if (required && !value) throw new Error(`${field} · ${locale.toUpperCase()} is empty`);
      return [locale, locale === 'uz' ? uzbek(value, `${field} · UZ`) : value];
    }),
  );

const paragraphs = (source, field) =>
  Object.fromEntries(
    LOCALES.map((locale) => {
      const raw =
        locale === 'uz'
          ? uzbek(source?.[locale] ?? '', `${field} · UZ`)
          : String(source?.[locale] ?? '');
      return [
        locale,
        raw
          .split(/\n{2,}/)
          .map((part) => part.trim())
          .filter(Boolean),
      ];
    }),
  );

/* ------------------------------------------------------------------ actions */

export function savePost(db, input) {
  const { locale, date, draft, external } = input;
  if (!LOCALES.includes(locale)) throw new Error(`Unknown language: ${locale}`);

  let { title, summary, body } = input;
  if (locale === 'uz') {
    title = uzbek(title, 'Title');
    summary = uzbek(summary, 'Summary');
    body = uzbek(body ?? '', 'Body');
  }
  if (!title?.trim()) throw new Error('A title is required');
  if (!summary?.trim()) throw new Error('A summary is required');
  if (summary.length > 155) {
    throw new Error(`The summary is ${summary.length} characters; the limit is 155`);
  }

  const slug = slugify(input.slug?.trim() || title);
  if (!slug) throw new Error('Could not derive a slug — type one in');

  db.prepare(
    `INSERT INTO posts (slug, lang, title, summary, body, date, draft, external, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(slug, lang) DO UPDATE SET
       title = excluded.title, summary = excluded.summary, body = excluded.body,
       date = excluded.date, draft = excluded.draft, external = excluded.external,
       updated_at = datetime('now')`,
  ).run(
    slug,
    locale,
    title.trim(),
    summary.trim(),
    (body ?? '').trim(),
    (date || new Date().toISOString().slice(0, 10)).slice(0, 10),
    draft ? 1 : 0,
    external?.trim() || null,
  );

  return { slug, locale };
}

export function saveProject(db, incoming) {
  const slug = slugify(incoming.slug || incoming.name);
  if (!slug) throw new Error('A slug is required');
  if (!incoming.name?.trim()) throw new Error('A name is required');
  if (!incoming.repo?.trim()) throw new Error('A repository URL is required');

  const stack = (incoming.stack ?? [])
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 3);
  if (stack.length === 0) throw new Error('At least one stack chip is required');

  const existing = db.prepare('SELECT position FROM projects WHERE slug = ?').get(slug);
  const next = db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS p FROM projects').get().p;

  db.prepare(
    `INSERT INTO projects (slug, name, repo, demo, license, featured, position, stack, description, details, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(slug) DO UPDATE SET
       name = excluded.name, repo = excluded.repo, demo = excluded.demo,
       license = excluded.license, featured = excluded.featured,
       stack = excluded.stack, description = excluded.description,
       details = excluded.details, updated_at = datetime('now')`,
  ).run(
    slug,
    incoming.name.trim(),
    incoming.repo.trim(),
    incoming.demo?.trim() || null,
    incoming.license?.trim() || null,
    incoming.featured ? 1 : 0,
    existing?.position ?? next,
    JSON.stringify(stack),
    JSON.stringify(localized(incoming.description, 'Description')),
    JSON.stringify(paragraphs(incoming.details, 'Details')),
  );

  // Alt text and captions travel with the project form.
  for (const [index, shot] of (incoming.screenshots ?? []).entries()) {
    const caption = localized(shot.caption ?? {}, 'Caption', { required: false });
    const hasCaption = LOCALES.some((locale) => caption[locale]);
    db.prepare(
      `UPDATE screenshots SET alt = ?, caption = ?, position = ? WHERE project = ? AND file = ?`,
    ).run(
      JSON.stringify(localized(shot.alt ?? {}, 'Alt text')),
      hasCaption ? JSON.stringify(caption) : null,
      index,
      slug,
      shot.file,
    );
  }

  return { slug };
}

export async function addScreenshot(db, { slug, name, buffer }) {
  const project = db.prepare('SELECT slug, name FROM projects WHERE slug = ?').get(slug);
  if (!project) throw new Error(`No project with slug "${slug}" — save the project first`);

  const base = slugify(basename(name, extname(name))) || `shot-${Date.now()}`;
  const dir = join(SHOTS, slug);
  await mkdir(dir, { recursive: true });

  const image = sharp(buffer).rotate();
  const { width } = await image.metadata();
  const resized = image.resize({ width: Math.min(width ?? 1600, 1600), withoutEnlargement: true });

  for (const [ext, encode] of [
    ['avif', (pipe) => pipe.avif({ quality: 55, effort: 5 })],
    ['webp', (pipe) => pipe.webp({ quality: 78 })],
    ['jpg', (pipe) => pipe.jpeg({ quality: 80, mozjpeg: true, progressive: true })],
  ]) {
    await encode(resized.clone()).toFile(join(dir, `${base}.${ext}`));
  }

  const position = db
    .prepare('SELECT COALESCE(MAX(position), -1) + 1 AS p FROM screenshots WHERE project = ?')
    .get(slug).p;

  db.prepare(
    `INSERT INTO screenshots (project, file, alt, caption, position) VALUES (?, ?, ?, NULL, ?)
     ON CONFLICT(project, file) DO NOTHING`,
  ).run(
    slug,
    base,
    JSON.stringify(Object.fromEntries(LOCALES.map((l) => [l, `${project.name} — screenshot`]))),
    position,
  );

  return { file: base };
}

async function removeScreenshotFiles(slug, file) {
  for (const ext of ['avif', 'webp', 'jpg']) {
    await rm(join(SHOTS, slug, `${file}.${ext}`), { force: true });
  }
}

/* ----------------------------------------------------------------- routing */

const json = (response, status, body) => {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
};

/**
 * Handles one studio request. `url.pathname` must already have the mount
 * prefix stripped, so the same handlers serve /api/... locally and
 * /studio/api/... behind the login.
 *
 * Returns false when the path is not ours, so a host can fall through.
 */
export async function handleStudio(request, response, url, { onChange } = {}) {
  let db;
  let changed = false;

  try {
    if (request.method === 'GET' && url.pathname.startsWith('/projects/')) {
      const file = join(SHOTS, url.pathname.replace('/projects/', ''));
      if (file.startsWith(SHOTS) && existsSync(file)) {
        response.writeHead(200, { 'content-type': 'image/jpeg', 'cache-control': 'no-store' });
        response.end(await readFile(file));
        return true;
      }
      json(response, 404, { error: 'Not found' });
      return true;
    }

    if (!url.pathname.startsWith('/api/')) return false;

    db = openDb();

    if (request.method === 'GET' && url.pathname === '/api/state') {
      json(response, 200, {
        locales: LOCALES,
        posts: readPosts(db, { includeDrafts: true }),
        projects: readProjects(db),
      });
      return true;
    }

    if (request.method === 'POST' && url.pathname === '/api/post') {
      const saved = savePost(db, await readJsonBody(request));
      changed = true;
      await record('post.save', `${saved.locale}/${saved.slug}`);
      json(response, 200, saved);
      return true;
    }

    if (request.method === 'POST' && url.pathname === '/api/post/delete') {
      const { slug, lang } = await readJsonBody(request);
      await backup(`post.delete ${lang}/${slug}`);
      db.prepare('DELETE FROM posts WHERE slug = ? AND lang = ?').run(slug, lang);
      changed = true;
      await record('post.delete', `${lang}/${slug}`);
      json(response, 200, { deleted: `${lang}/${slug}` });
      return true;
    }

    if (request.method === 'POST' && url.pathname === '/api/project') {
      const saved = saveProject(db, await readJsonBody(request));
      changed = true;
      await record('project.save', saved.slug);
      json(response, 200, saved);
      return true;
    }

    if (request.method === 'POST' && url.pathname === '/api/project/delete') {
      const { slug } = await readJsonBody(request);
      await backup(`project.delete ${slug}`);
      for (const shot of db.prepare('SELECT file FROM screenshots WHERE project = ?').all(slug)) {
        await removeScreenshotFiles(slug, shot.file);
      }
      await rm(join(SHOTS, slug), { recursive: true, force: true });
      db.prepare('DELETE FROM projects WHERE slug = ?').run(slug);
      changed = true;
      await record('project.delete', slug);
      json(response, 200, { deleted: slug });
      return true;
    }

    if (request.method === 'POST' && url.pathname === '/api/screenshot') {
      const slug = url.searchParams.get('slug');
      const name = url.searchParams.get('name') ?? 'screenshot.png';
      if (!slug) throw new Error('slug is required');
      const added = await addScreenshot(db, { slug, name, buffer: await readBody(request) });
      changed = true;
      await record('screenshot.add', `${slug}/${added.file}`);
      json(response, 200, added);
      return true;
    }

    if (request.method === 'POST' && url.pathname === '/api/screenshot/delete') {
      const { slug, file } = await readJsonBody(request);
      await backup(`screenshot.delete ${slug}/${file}`);
      db.prepare('DELETE FROM screenshots WHERE project = ? AND file = ?').run(slug, file);
      await removeScreenshotFiles(slug, file);
      changed = true;
      await record('screenshot.delete', `${slug}/${file}`);
      json(response, 200, { deleted: file });
      return true;
    }

    json(response, 404, { error: 'Not found' });
    return true;
  } catch (error) {
    json(response, 400, { error: error instanceof Error ? error.message : String(error) });
    return true;
  } finally {
    db?.close();
    if (changed) {
      await mirror();
      onChange?.();
    }
  }
}
