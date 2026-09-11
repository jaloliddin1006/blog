/**
 * Authentication for the studio: a password and a time-based one-time code.
 *
 * Everything here uses node:crypto — no dependency, and nothing about the
 * scheme is unusual: scrypt for the password, RFC 6238 for the codes, an
 * HMAC-signed cookie for the session.
 *
 * The secrets are generated on first run and kept in data/studio-secret.json,
 * so sessions survive a restart and the TOTP enrolment stays valid.
 */
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const SECRET_FILE =
  process.env.STUDIO_SECRET_FILE ?? resolve(process.cwd(), 'data/studio-secret.json');
const SESSION_HOURS = Number(process.env.STUDIO_SESSION_HOURS ?? 12);
const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/* ------------------------------------------------------------------ secrets */

function loadSecrets() {
  if (existsSync(SECRET_FILE)) return JSON.parse(readFileSync(SECRET_FILE, 'utf8'));

  const secrets = {
    session: randomBytes(32).toString('hex'),
    totp: process.env.STUDIO_TOTP_SECRET ?? base32Encode(randomBytes(20)),
    created: new Date().toISOString(),
  };
  mkdirSync(dirname(SECRET_FILE), { recursive: true });
  writeFileSync(SECRET_FILE, `${JSON.stringify(secrets, null, 2)}\n`, { mode: 0o600 });
  chmodSync(SECRET_FILE, 0o600);
  return secrets;
}

const secrets = loadSecrets();
export const TOTP_SECRET = process.env.STUDIO_TOTP_SECRET ?? secrets.totp;

export const USER = process.env.STUDIO_USER ?? 'defonic';
const PASSWORD = process.env.STUDIO_PASSWORD ?? '123';

/** The password is never held in plain text beyond this line. */
const PASSWORD_SALT = randomBytes(16);
const PASSWORD_HASH = scryptSync(PASSWORD, PASSWORD_SALT, 64);

export function otpauthUrl(account = USER, issuer = 'mamatmusayev.uz') {
  const label = encodeURIComponent(`${issuer}:${account}`);
  return `otpauth://totp/${label}?secret=${TOTP_SECRET}&issuer=${encodeURIComponent(issuer)}&digits=6&period=30`;
}

/* -------------------------------------------------------------------- totp */

function base32Encode(buffer) {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(input) {
  let bits = 0;
  let value = 0;
  const out = [];
  for (const char of input.replace(/=+$/, '').toUpperCase()) {
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

/** RFC 6238, SHA-1, 6 digits, 30-second steps — what authenticator apps expect. */
export function totp(atMs = Date.now(), secret = TOTP_SECRET) {
  const counter = Buffer.alloc(8);
  counter.writeBigInt64BE(BigInt(Math.floor(atMs / 1000 / 30)));
  const digest = createHmac('sha1', base32Decode(secret)).update(counter).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const code =
    ((digest[offset] & 0x7f) << 24) |
    (digest[offset + 1] << 16) |
    (digest[offset + 2] << 8) |
    digest[offset + 3];
  return String(code % 1_000_000).padStart(6, '0');
}

/** One step of clock drift either way, which is the usual allowance. */
export function verifyTotp(code, atMs = Date.now()) {
  const given = String(code ?? '').replace(/\D/g, '');
  if (given.length !== 6) return false;
  for (const drift of [-30_000, 0, 30_000]) {
    if (constantTimeEqual(given, totp(atMs + drift))) return true;
  }
  return false;
}

/* ---------------------------------------------------------------- password */

function constantTimeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function verifyPassword(user, password) {
  const userOk = constantTimeEqual(user ?? '', USER);
  const hash = scryptSync(String(password ?? ''), PASSWORD_SALT, 64);
  const passwordOk = timingSafeEqual(hash, PASSWORD_HASH);
  return userOk && passwordOk;
}

export const usingDefaultPassword = PASSWORD === '123';

/* ---------------------------------------------------------------- sessions */

const sign = (payload) => createHmac('sha256', secrets.session).update(payload).digest('base64url');

export function createSession(user = USER) {
  const payload = Buffer.from(
    JSON.stringify({ user, exp: Date.now() + SESSION_HOURS * 3600_000 }),
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function readSession(token) {
  if (!token || !token.includes('.')) return null;
  const [payload, signature] = token.split('.');
  if (!constantTimeEqual(signature, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = 'studio_session';
export const sessionCookie = (token, { secure }) =>
  `${SESSION_COOKIE}=${token}; Path=/studio; HttpOnly; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}${secure ? '; Secure' : ''}`;
export const clearCookie = `${SESSION_COOKIE}=; Path=/studio; HttpOnly; SameSite=Strict; Max-Age=0`;

export function parseCookies(header = '') {
  return Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim().split('='))
      .filter(([name]) => name)
      .map(([name, ...rest]) => [name, decodeURIComponent(rest.join('='))]),
  );
}
