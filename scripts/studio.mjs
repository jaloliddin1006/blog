/**
 * The studio: a local authoring tool for posts, projects and screenshots.
 *
 * It runs only on your machine (127.0.0.1), writes straight into src/content/
 * and public/projects/, and is never part of the built site. Author here, then
 * review with `npm run dev` and commit — the repository stays the source of
 * truth and `npm run build` still validates everything.
 *
 *   npm run studio        → http://localhost:4322
 */
import { createServer } from 'node:http';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.STUDIO_PORT ?? 4322);
const LOCALES = ['en', 'uz', 'ru'];

const paths = {
  projects: join(root, 'src/content/projects.json'),
  posts: join(root, 'src/content/posts'),
  shots: join(root, 'public/projects'),
  ui: join(root, 'scripts/studio/index.html'),
};

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
  return value
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

const json = (response, status, body) => {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
};

async function readBody(request, limit = 25 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) throw new Error('Body too large');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

const readJsonBody = async (request) => JSON.parse((await readBody(request)).toString('utf8'));

const loadProjects = async () => JSON.parse(await readFile(paths.projects, 'utf8'));
const saveProjects = (projects) =>
  writeFile(paths.projects, `${JSON.stringify(projects, null, 2)}\n`, 'utf8');

/** YAML-safe single-quoted scalar. */
const quote = (value) => `'${String(value).replace(/'/g, "''")}'`;

async function listPosts() {
  const out = [];
  for (const locale of LOCALES) {
    const dir = join(paths.posts, locale);
    if (!existsSync(dir)) continue;
    for (const file of await readdir(dir)) {
      if (!file.endsWith('.md')) continue;
      const raw = await readFile(join(dir, file), 'utf8');
      const title = /^title:\s*'?(.*?)'?\s*$/m.exec(raw)?.[1] ?? file;
      const date = /^date:\s*(.*)$/m.exec(raw)?.[1]?.trim() ?? '';
      const draft = /^draft:\s*true\s*$/m.test(raw);
      out.push({ locale, file, slug: file.replace(/\.md$/, ''), title, date, draft });
    }
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

/* ------------------------------------------------------------------ actions */

async function writePost({ locale, slug, title, date, summary, body, draft, external }) {
  if (!LOCALES.includes(locale)) throw new Error(`Unknown language: ${locale}`);
  if (!title?.trim()) throw new Error('A title is required');
  if (!summary?.trim()) throw new Error('A summary is required');
  if (summary.length > 155)
    throw new Error(`Summary is ${summary.length} characters; the limit is 155`);

  const name = slugify(slug?.trim() || title);
  if (!name) throw new Error('Could not derive a slug — type one in');

  const frontmatter = [
    '---',
    `title: ${quote(title.trim())}`,
    `date: ${date || new Date().toISOString().slice(0, 10)}`,
    `lang: ${locale}`,
    `summary: ${quote(summary.trim())}`,
    ...(draft ? ['draft: true'] : []),
    ...(external?.trim() ? [`external: ${quote(external.trim())}`] : []),
    '---',
    '',
  ].join('\n');

  const dir = join(paths.posts, locale);
  await mkdir(dir, { recursive: true });
  const file = join(dir, `${name}.md`);
  await writeFile(file, `${frontmatter}${(body ?? '').trim()}\n`, 'utf8');
  return { file: file.replace(`${root}/`, ''), slug: name, locale };
}

async function upsertProject(incoming) {
  const projects = await loadProjects();
  const slug = slugify(incoming.slug || incoming.name);
  if (!slug) throw new Error('A slug is required');
  if (!incoming.name?.trim()) throw new Error('A name is required');
  if (!incoming.repo?.trim()) throw new Error('A repository URL is required');

  const stack = (incoming.stack ?? [])
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
  if (stack.length === 0) throw new Error('At least one stack chip is required');

  const localized = (source) =>
    Object.fromEntries(LOCALES.map((locale) => [locale, (source?.[locale] ?? '').trim()]));
  const paragraphs = (source) =>
    Object.fromEntries(
      LOCALES.map((locale) => [
        locale,
        (source?.[locale] ?? '')
          .split(/\n{2,}/)
          .map((part) => part.trim())
          .filter(Boolean),
      ]),
    );

  const description = localized(incoming.description);
  for (const locale of LOCALES) {
    if (!description[locale]) throw new Error(`The ${locale.toUpperCase()} description is empty`);
  }

  const existing = projects.find((project) => project.slug === slug);
  const next = {
    slug,
    name: incoming.name.trim(),
    repo: incoming.repo.trim(),
    demo: incoming.demo?.trim() ? incoming.demo.trim() : null,
    featured: Boolean(incoming.featured),
    ...(incoming.license?.trim() ? { license: incoming.license.trim() } : {}),
    stack,
    description,
    details: paragraphs(incoming.details),
    screenshots: incoming.screenshots ?? existing?.screenshots ?? [],
  };

  if (existing) Object.assign(existing, next);
  else projects.push(next);

  await saveProjects(projects);
  return next;
}

async function addScreenshot({ slug, name, buffer }) {
  const projects = await loadProjects();
  const project = projects.find((entry) => entry.slug === slug);
  if (!project) throw new Error(`No project with slug "${slug}" — save the project first`);

  const base = slugify(name.replace(extname(name), '')) || `shot-${Date.now()}`;
  const dir = join(paths.shots, slug);
  await mkdir(dir, { recursive: true });

  const image = sharp(buffer).rotate();
  const { width } = await image.metadata();
  const resized = image.resize({ width: Math.min(width ?? 1600, 1600), withoutEnlargement: true });

  const written = [];
  for (const [ext, encode] of [
    ['avif', (pipe) => pipe.avif({ quality: 55, effort: 5 })],
    ['webp', (pipe) => pipe.webp({ quality: 78 })],
    ['jpg', (pipe) => pipe.jpeg({ quality: 80, mozjpeg: true, progressive: true })],
  ]) {
    const file = join(dir, `${base}.${ext}`);
    await encode(resized.clone()).toFile(file);
    written.push(file.replace(`${root}/`, ''));
  }

  if (!project.screenshots.some((shot) => shot.file === base)) {
    project.screenshots.push({
      file: base,
      alt: Object.fromEntries(LOCALES.map((locale) => [locale, `${project.name} — screenshot`])),
    });
    await saveProjects(projects);
  }

  return { file: base, written, screenshots: project.screenshots };
}

async function removeScreenshot({ slug, file }) {
  const projects = await loadProjects();
  const project = projects.find((entry) => entry.slug === slug);
  if (!project) throw new Error(`No project with slug "${slug}"`);
  project.screenshots = project.screenshots.filter((shot) => shot.file !== file);
  await saveProjects(projects);
  for (const ext of ['avif', 'webp', 'jpg']) {
    await rm(join(paths.shots, slug, `${file}.${ext}`), { force: true });
  }
  return { screenshots: project.screenshots };
}

/* ------------------------------------------------------------------- server */

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://localhost:${port}`);

  try {
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      const html = await readFile(paths.ui, 'utf8');
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(html);
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/state') {
      json(response, 200, {
        projects: await loadProjects(),
        posts: await listPosts(),
        locales: LOCALES,
      });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/post') {
      json(response, 200, await writePost(await readJsonBody(request)));
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/project') {
      json(response, 200, await upsertProject(await readJsonBody(request)));
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/screenshot') {
      const slug = url.searchParams.get('slug');
      const name = url.searchParams.get('name') ?? 'screenshot.png';
      if (!slug) throw new Error('slug is required');
      json(response, 200, await addScreenshot({ slug, name, buffer: await readBody(request) }));
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/screenshot/delete') {
      json(response, 200, await removeScreenshot(await readJsonBody(request)));
      return;
    }

    // Screenshot previews come straight from public/.
    if (request.method === 'GET' && url.pathname.startsWith('/projects/')) {
      const file = join(paths.shots, url.pathname.replace('/projects/', ''));
      if (file.startsWith(paths.shots) && existsSync(file)) {
        response.writeHead(200, { 'content-type': 'image/jpeg', 'cache-control': 'no-store' });
        response.end(await readFile(file));
        return;
      }
    }

    json(response, 404, { error: 'Not found' });
  } catch (error) {
    json(response, 400, { error: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Studio on http://localhost:${port}  (local only — never deployed)`);
  console.log('Write here, check with `npm run dev`, then commit.');
});
