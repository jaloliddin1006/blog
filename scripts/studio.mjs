/**
 * The studio, bare and local: no login, bound to 127.0.0.1.
 *
 *   npm run studio        → http://localhost:4322
 *
 * The same handlers run behind a password and a one-time code in the container
 * (server/app.mjs, mounted at /studio/). This entry exists so that working on
 * your own machine costs nothing.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { handleStudio, STUDIO_UI } from '../server/studio-api.mjs';

const port = Number(process.env.STUDIO_PORT ?? 4322);

createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://localhost:${port}`);

  if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(await readFile(STUDIO_UI, 'utf8'));
    return;
  }

  if (await handleStudio(request, response, url)) return;

  response.writeHead(404, { 'content-type': 'application/json' });
  response.end(JSON.stringify({ error: 'Not found' }));
}).listen(port, '127.0.0.1', () => {
  console.log(`Studio on http://localhost:${port}  (local only — never deployed)`);
  console.log('Posts and projects go into data/site.db. Check with `npm run dev`, then commit.');
});
