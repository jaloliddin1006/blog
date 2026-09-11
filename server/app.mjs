/**
 * One server, one container: the built site at /, the studio at /studio/.
 *
 * The site stays static — this only hands out files from dist/. The studio sits
 * behind a password and a one-time code, and whenever it changes something the
 * site is rebuilt in the background, so an edit shows up a few seconds later
 * without anyone touching the container.
 */
import { spawn } from 'node:child_process';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import {
  clearCookie,
  createSession,
  otpauthUrl,
  parseCookies,
  readSession,
  SESSION_COOKIE,
  sessionCookie,
  TOTP_SECRET,
  USER,
  usingDefaultPassword,
  verifyPassword,
  verifyTotp,
} from './auth.mjs';
import { handleStudio, STUDIO_UI } from './studio-api.mjs';

const ROOT = process.cwd();
const DIST = resolve(ROOT, 'dist');
const PORT = Number(process.env.PORT ?? 8080);
const MOUNT = '/studio';
const BEHIND_TLS = process.env.STUDIO_SECURE_COOKIE === 'true';

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

/* ------------------------------------------------------------------ rebuild */

const build = { running: false, queued: false, ok: true, finishedAt: null, log: '' };
let debounce;

function rebuild() {
  if (build.running) {
    build.queued = true;
    return;
  }
  build.running = true;
  build.log = '';

  const child = spawn('npx', ['astro', 'build'], { cwd: ROOT, env: process.env });
  const collect = (chunk) => {
    build.log = (build.log + chunk.toString()).slice(-4000);
  };
  child.stdout.on('data', collect);
  child.stderr.on('data', collect);

  child.on('close', (code) => {
    build.running = false;
    build.ok = code === 0;
    build.finishedAt = new Date().toISOString();
    console.log(`rebuild ${build.ok ? 'ok' : `failed (exit ${code})`}`);
    if (build.queued) {
      build.queued = false;
      rebuild();
    }
  });
}

const scheduleRebuild = () => {
  clearTimeout(debounce);
  debounce = setTimeout(rebuild, 1500);
};

/* -------------------------------------------------------------------- login */

const LOGIN_PAGE = (message = '') => `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Studio — sign in</title>
<style>
  :root { color-scheme: dark }
  body { margin:0; min-height:100vh; display:grid; place-items:center; padding:1.5rem;
    font:15px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; color:#eaf0f7;
    background: radial-gradient(120% 90% at 12% 8%, rgba(95,192,210,.18), transparent 55%),
      linear-gradient(170deg,#060c14,#0d1826); background-attachment:fixed }
  form { width:min(360px,100%); padding:1.75rem; border:1px solid rgba(255,255,255,.12);
    border-radius:18px; background:rgba(12,22,35,.95); backdrop-filter:blur(16px) }
  h1 { margin:0 0 1.25rem; font-size:.72rem; font-family:ui-monospace,Menlo,monospace;
    letter-spacing:.14em; text-transform:uppercase; color:#5fc0d2 }
  label { display:block; margin-bottom:.9rem; font-size:.78rem; color:#9db0c6 }
  label span { display:block; margin-bottom:.3rem }
  input { width:100%; box-sizing:border-box; padding:.55rem .7rem; font:inherit; color:#eaf0f7;
    background:rgba(0,0,0,.3); border:1px solid rgba(255,255,255,.12); border-radius:9px }
  input:focus { outline:2px solid #5fc0d2; outline-offset:1px }
  button { width:100%; margin-top:.5rem; padding:.7rem; border:0; border-radius:999px;
    background:#5fc0d2; color:#05131a; font-family:ui-monospace,Menlo,monospace; font-size:.72rem;
    letter-spacing:.1em; text-transform:uppercase; cursor:pointer }
  .msg { margin:0 0 1rem; font-size:.8rem; color:#e88b8b }
  .note { margin:1rem 0 0; font-size:.72rem; color:#9db0c6 }
</style></head>
<body>
  <form method="post" action="${MOUNT}/login">
    <h1>Studio · sign in</h1>
    ${message ? `<p class="msg">${message}</p>` : ''}
    <label><span>Username</span><input name="user" autocomplete="username" autofocus required /></label>
    <label><span>Password</span><input name="password" type="password" autocomplete="current-password" required /></label>
    <label><span>One-time code</span>
      <input name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6"
        autocomplete="one-time-code" placeholder="123456" required /></label>
    <button type="submit">Sign in</button>
    <p class="note">Six digits from your authenticator app.</p>
  </form>
</body></html>`;

/** Five failures from one address buys a minute of silence. */
const attempts = new Map();

function throttled(ip) {
  const record = attempts.get(ip);
  if (!record) return false;
  if (Date.now() - record.at > 60_000) {
    attempts.delete(ip);
    return false;
  }
  return record.count >= 5;
}

function failed(ip) {
  const record = attempts.get(ip) ?? { count: 0, at: Date.now() };
  record.count += 1;
  record.at = Date.now();
  attempts.set(ip, record);
}

const readForm = async (request) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Object.fromEntries(new URLSearchParams(Buffer.concat(chunks).toString('utf8')));
};

/* ------------------------------------------------------------------- static */

function serveStatic(response, path) {
  let file = join(DIST, normalize(decodeURIComponent(path)).replace(/^(\.\.[/\\])+/, ''));
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file) && existsSync(`${file}.html`)) file = `${file}.html`;

  if (!file.startsWith(DIST) || !existsSync(file)) {
    const notFound = join(DIST, '404.html');
    if (existsSync(notFound)) {
      response.writeHead(404, { 'content-type': TYPES['.html'] });
      createReadStream(notFound).pipe(response);
      return;
    }
    response.writeHead(404).end('Not found');
    return;
  }

  const immutable = file.includes('/_astro/') || file.includes('/fonts/');
  response.writeHead(200, {
    'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
    'cache-control': immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=300',
  });
  createReadStream(file).pipe(response);
}

/** A thin strip in the studio: who you are, build status, sign out. */
const STUDIO_CHROME = `
<div id="chrome" style="position:fixed;left:50%;bottom:1rem;transform:translateX(-50%);z-index:20;
  display:flex;align-items:center;gap:.75rem;padding:.5rem .9rem;border-radius:999px;
  background:rgba(12,22,35,.95);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(14px);
  font:12px ui-monospace,Menlo,monospace;color:#9db0c6">
  <span id="build-state">idle</span>
  <a href="${MOUNT}/logout" style="color:#5fc0d2;text-decoration:none">sign out</a>
</div>
<script type="module">
  const state = document.getElementById('build-state');
  const tick = async () => {
    try {
      const build = await (await fetch('${MOUNT}/api/build')).json();
      state.textContent = build.running
        ? 'rebuilding the site…'
        : build.ok
          ? \`site built \${build.finishedAt ? new Date(build.finishedAt).toLocaleTimeString() : ''}\`
          : 'build failed — check the container log';
      state.style.color = build.running ? '#5fc0d2' : build.ok ? '#9db0c6' : '#e88b8b';
    } catch {
      /* the page is fine without it */
    }
  };
  tick();
  setInterval(tick, 3000);
</script>`;

/* ------------------------------------------------------------------- server */

createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  const ip = request.socket.remoteAddress ?? 'unknown';

  try {
    if (!url.pathname.startsWith(MOUNT)) {
      serveStatic(response, url.pathname);
      return;
    }

    const session = readSession(parseCookies(request.headers.cookie)[SESSION_COOKIE]);

    if (url.pathname === `${MOUNT}/login`) {
      if (request.method === 'GET') {
        response.writeHead(200, { 'content-type': TYPES['.html'] });
        response.end(LOGIN_PAGE());
        return;
      }
      if (request.method === 'POST') {
        if (throttled(ip)) {
          response.writeHead(429, { 'content-type': TYPES['.html'] });
          response.end(LOGIN_PAGE('Too many attempts — wait a minute.'));
          return;
        }
        const form = await readForm(request);
        if (verifyPassword(form.user, form.password) && verifyTotp(form.code)) {
          attempts.delete(ip);
          console.log(`studio  login  ${form.user} from ${ip}`);
          response.writeHead(302, {
            location: `${MOUNT}/`,
            'set-cookie': sessionCookie(createSession(form.user), { secure: BEHIND_TLS }),
          });
          response.end();
          return;
        }
        failed(ip);
        console.log(`studio  login-failed  ${form.user ?? '?'} from ${ip}`);
        response.writeHead(401, { 'content-type': TYPES['.html'] });
        response.end(LOGIN_PAGE('That did not work. Check the password and the code.'));
        return;
      }
    }

    if (url.pathname === `${MOUNT}/logout`) {
      response.writeHead(302, { location: `${MOUNT}/login`, 'set-cookie': clearCookie });
      response.end();
      return;
    }

    if (!session) {
      if (request.method === 'GET') {
        response.writeHead(302, { location: `${MOUNT}/login` });
        response.end();
      } else {
        response.writeHead(401, { 'content-type': TYPES['.json'] });
        response.end(JSON.stringify({ error: 'Sign in again' }));
      }
      return;
    }

    if (url.pathname === MOUNT || url.pathname === `${MOUNT}/`) {
      const html = (await readFile(STUDIO_UI, 'utf8')).replace(
        '</body>',
        `<script>window.STUDIO_PREFIX = ${JSON.stringify(MOUNT)}</script>${STUDIO_CHROME}</body>`,
      );
      response.writeHead(200, { 'content-type': TYPES['.html'] });
      response.end(html);
      return;
    }

    if (url.pathname === `${MOUNT}/api/build`) {
      response.writeHead(200, { 'content-type': TYPES['.json'] });
      response.end(JSON.stringify({ ...build, log: build.log.slice(-600) }));
      return;
    }

    const inner = new URL(url.href);
    inner.pathname = url.pathname.slice(MOUNT.length) || '/';
    if (await handleStudio(request, response, inner, { onChange: scheduleRebuild })) return;

    response.writeHead(404, { 'content-type': TYPES['.json'] });
    response.end(JSON.stringify({ error: 'Not found' }));
  } catch (error) {
    console.error('request failed', error);
    if (!response.headersSent) response.writeHead(500, { 'content-type': TYPES['.json'] });
    response.end(JSON.stringify({ error: 'Something went wrong' }));
  }
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Site   http://localhost:${PORT}/`);
  console.log(`Studio http://localhost:${PORT}${MOUNT}/   user: ${USER}`);
  console.log(`TOTP   ${otpauthUrl()}`);
  console.log(`       secret: ${TOTP_SECRET}  — add it to your authenticator app`);
  if (usingDefaultPassword) {
    console.warn(
      'WARNING  the studio password is still the default. Set STUDIO_PASSWORD before exposing this.',
    );
  }
});
