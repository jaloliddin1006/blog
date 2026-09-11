import { expect, test } from '@playwright/test';
import { createHmac } from 'node:crypto';

/**
 * The studio is the only writable surface on the deployed container, so the
 * gate in front of it is worth testing: password and one-time code together,
 * nothing readable or writable without a session, and a limit on guessing.
 */

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';

function decode(secret: string) {
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const char of secret.toUpperCase()) {
    const index = BASE32.indexOf(char);
    if (index === -1) continue;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** RFC 6238, computed here independently of the server's implementation. */
function code(at = Date.now()) {
  const counter = Buffer.alloc(8);
  counter.writeBigInt64BE(BigInt(Math.floor(at / 1000 / 30)));
  const digest = createHmac('sha1', decode(SECRET)).update(counter).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const value =
    ((digest[offset] & 0x7f) << 24) |
    (digest[offset + 1] << 16) |
    (digest[offset + 2] << 8) |
    digest[offset + 3];
  return String(value % 1_000_000).padStart(6, '0');
}

const APP = 'http://localhost:4324';

// These share one server's rate-limit state, so they run in order, not at once.
test.describe.configure({ mode: 'serial' });

test.describe('studio gate', () => {
  test('the site is public and the studio is not', async ({ request }) => {
    expect((await request.get(`${APP}/`)).status()).toBe(200);
    expect((await request.get(`${APP}/data.json`)).status()).toBe(200);

    const studio = await request.get(`${APP}/studio/`, { maxRedirects: 0 });
    expect(studio.status()).toBe(302);
    expect(studio.headers().location).toBe('/studio/login');

    const api = await request.get(`${APP}/studio/api/state`, { maxRedirects: 0 });
    expect(api.status()).toBe(302);
  });

  test('a write without a session is refused', async ({ request }) => {
    const response = await request.post(`${APP}/studio/api/post`, {
      data: { locale: 'en', title: 'Nope', summary: 'Should never be written.' },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(401);
  });

  test('the password alone is not enough', async ({ request }) => {
    const response = await request.post(`${APP}/studio/login`, {
      form: { user: 'defonic', password: '123', code: '000000' },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(401);
  });

  test('the code alone is not enough', async ({ request }) => {
    const response = await request.post(`${APP}/studio/login`, {
      form: { user: 'defonic', password: 'wrong', code: code() },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(401);
  });

  test('both together let you in, and the session opens the studio', async ({ request }) => {
    const login = await request.post(`${APP}/studio/login`, {
      form: { user: 'defonic', password: '123', code: code() },
      maxRedirects: 0,
    });
    expect(login.status()).toBe(302);

    const cookie = login.headers()['set-cookie'] ?? '';
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');

    const session = cookie.split(';')[0];
    const page = await request.get(`${APP}/studio/`, { headers: { cookie: session } });
    expect(page.status()).toBe(200);
    expect(await page.text()).toContain('STUDIO_PREFIX');

    const state = await request.get(`${APP}/studio/api/state`, { headers: { cookie: session } });
    expect(state.status()).toBe(200);
    const body = await state.json();
    expect(body.projects.length).toBeGreaterThan(0);
  });

  test('a forged session is rejected', async ({ request }) => {
    const forged = Buffer.from(
      JSON.stringify({ user: 'defonic', exp: Date.now() + 3600_000 }),
    ).toString('base64url');
    const response = await request.get(`${APP}/studio/api/state`, {
      headers: { cookie: `studio_session=${forged}.notasignature` },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(302);
  });

  test('guessing is rate limited', async ({ request }) => {
    const seen: number[] = [];
    for (let attempt = 0; attempt < 10 && !seen.includes(429); attempt += 1) {
      const response = await request.post(`${APP}/studio/login`, {
        form: { user: 'defonic', password: 'wrong', code: '000000' },
        maxRedirects: 0,
      });
      seen.push(response.status());
    }
    expect(seen).toContain(429);
    // It must have let a few through first, not blocked from the very start.
    expect(seen.filter((status) => status === 401).length).toBeGreaterThan(0);
  });
});
