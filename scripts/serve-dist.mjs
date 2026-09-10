/**
 * A foreground static server for dist/, used by Playwright.
 * `astro preview` daemonises itself in some environments, which the test
 * runner cannot supervise, so tests get their own tiny server instead.
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.cwd(), 'dist');
const port = Number(process.env.PORT ?? 4321);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

const send = (response, status, file) => {
  response.writeHead(status, {
    'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(response);
};

createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  const path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = join(root, path);

  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file) && existsSync(`${file}.html`)) file = `${file}.html`;

  if (!file.startsWith(root) || !existsSync(file)) {
    const notFound = join(root, '404.html');
    if (existsSync(notFound)) return send(response, 404, notFound);
    response.writeHead(404).end('Not found');
    return;
  }

  send(response, 200, file);
}).listen(port, () => {
  console.log(`dist/ served on http://localhost:${port}`);
});
