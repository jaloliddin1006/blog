# mamatmusayev.uz

A one-page personal site for **Jaloliddin Mamatmusayev**, Head of Information Systems
Development and Implementation at the National Statistics Committee of Uzbekistan —
with a CV page and a short blog, in English, Uzbek and Russian.

Built with Astro, Tailwind and a Three.js backdrop. Everything ships as static HTML.
The full brief lives in [`SPEC.md`](./SPEC.md); the code map is in
[`ARCHITECTURE.md`](./ARCHITECTURE.md).

```bash
npm install
npm run dev        # http://localhost:4321
npm run studio     # http://localhost:4322 — add posts and projects (no login, local only)
npm run build      # type check + static build into dist/
npm run lint       # formatting + Uzbek orthography
npm test           # Playwright, desktop and mobile
```

## Where the content lives

| Content                                         | Stored in                  | Edited with      |
| ----------------------------------------------- | -------------------------- | ---------------- |
| Blog posts, projects, screenshots               | `data/site.db` (SQLite)    | `npm run studio` |
| Profile, roles, skills, certificates, education | `src/content/*.json`       | a text editor    |
| Interface strings                               | `src/i18n/{en,uz,ru}.json` | a text editor    |

Posts and projects keep being added, so they live in a database. Everything else is settled
and reads better as a diff, so it stays in JSON. The database is committed with the
repository — the site is still built statically, with no server anywhere near production.

`npm run db:export` writes `data/export/{posts,projects}.json`, a diffable snapshot to commit
next to the binary; `npm run db:migrate` reads those same shapes back in.

## Editing the content

Nothing on the site is written in a component. All of it lives in JSON, and every
translatable field carries its three languages together:

| File                              | What it holds                                         |
| --------------------------------- | ----------------------------------------------------- |
| `src/content/profile.json`        | name, links, title, lede, About paragraphs, Now strip |
| `src/content/experience.json`     | the work timeline and the CV bullets                  |
| `src/content/projects.json`       | repositories — `featured: true` puts one on the home  |
| `src/content/skills.json`         | the four skill rows                                   |
| `src/content/education.json`      | degrees                                               |
| `src/content/certifications.json` | certificates; set `url` to link a credential          |
| `src/i18n/{en,uz,ru}.json`        | interface strings: nav, buttons, labels, meta tags    |

A field shaped `{ "en": …, "uz": …, "ru": … }` must have all three. `npm run build`
validates every file against a zod schema and fails on a missing or malformed field,
so a typo never reaches the site.

**Changing the headline?** Edit `profile.title` and `profile.lede`. The homepage, the
CV, the `<title>`, the Open Graph card and the JSON-LD all read from there.

### Uzbek apostrophes

Write `o‘`/`g‘` with U+2018 and the tutuq belgisi with U+2019 (`ma’lumot`). The ASCII
`'` and the technically-correct U+02BB/U+02BC are rejected by `npm run lint` — IBM Plex
draws the latter two full-width, which visibly breaks up Uzbek words. macOS: `⌥]` and
`⌥⇧]`. Linux: `Ctrl+Shift+U 2018`.

## What is unusual about this site

Three things, all built on the same idea — the content is a dataset, and the page is one
view over it:

- **Press ⌘K, Ctrl+K or `/`.** The site answers queries about itself: free text, or
  `type:project`, `stack:python`, `year:2025`. It reports the result the way a query would,
  and the background field filters to the same records as you type.
- **The background is the dataset.** Every bright node behind the page is one record.
  Scrolling a section lights its records; hovering a node names it; clicking one goes to it.
- **`/data.json`** is the dataset itself — subject, counts and every record — so nobody has
  to scrape the page to cite it.

The work history is drawn on a real time axis, from the start and end months in
`experience.json`, so duration and overlap are visible rather than merely stated.

## The studio — one page for posts and projects

```bash
npm run studio      # http://localhost:4322
```

Everything on one page, side by side:

- **Post** — language, title, date, summary (with the 155-character limit enforced), an
  optional "link out to LinkedIn instead" URL, a draft switch, and a Markdown body. The
  list below it holds every post in the database: click a title to edit it, `delete` to
  remove it.
- **Project** — pick an existing project or start a new one: name, slug, repository, demo,
  stack chips, licence, the featured switch, one-line descriptions in all three languages,
  and the longer details that fill the project page. Delete removes the project and its
  screenshots.
- **Screenshots** — drag images onto the drop zone (or click to choose). Each is resized
  to 1600px and written as AVIF, WebP and JPEG into `public/projects/<slug>/`, then listed
  with `alt` and caption fields per language. Fill the alt text in — it is the one field a
  screenshot must have, and it saves with the project.

Drafts stay out of the build. Publish one by unticking **Draft** and saving; it appears on
the next build.

It keeps the Uzbek orthography rule for you: `ʻ`/`ʼ` are swapped for `‘`/`’` as you save,
and an ASCII apostrophe inside an Uzbek word is refused with a note about which of the two
it should be. English and Russian keep their own punctuation.

The studio binds to `127.0.0.1`, is never built into the site, and adds nothing to what gets
deployed. It writes to `data/site.db`; check the result with `npm run dev`, then commit the
database. If it writes something malformed, `npm run build` refuses it — the zod schemas
still apply on the way out.

## Adding a blog post by hand

The studio is the easy way, but the database is plain SQLite, so this works too:

```sql
INSERT INTO posts (slug, lang, title, summary, body, date, draft)
VALUES ('etl-notes', 'uz', 'ETL haqida', 'Bir jumlalik xulosa.', '## Sarlavha\n\nMatn.', '2026-10-02', 0);
```

- `draft = 1` keeps it out of the build.
- `external` turns the post into a card that links to LinkedIn instead of getting its own
  page — useful for a post you do not want to rewrite.
- A post is listed only under its own language. With no published posts in a language, the
  blog section, the nav item and the `/blog/` route all disappear by themselves.

### Uzbek apostrophes

Write `o‘`/`g‘` with U+2018 and the tutuq belgisi with U+2019 (`ma’lumot`). The ASCII `'` and
the technically-correct U+02BB/U+02BC are rejected by `npm run lint` — IBM Plex draws the
latter two full-width, which visibly breaks up Uzbek words. The studio fixes `ʻ`/`ʼ` for you
and refuses the ASCII one. macOS: `⌥]` and `⌥⇧]`. Linux: `Ctrl+Shift+U 2018`.

## Adding a project by hand

```sql
INSERT INTO projects (slug, name, repo, featured, stack, description, details)
VALUES (
  'surdo-ai', 'surdo-ai', 'https://github.com/jaloliddin1006/surdo-ai', 1,
  '["Python","AI"]',
  '{"en":"…","uz":"…","ru":"…"}',
  '{"en":[],"uz":[],"ru":[]}'
);
```

**A project gets a page of its own — `/projects/<slug>/` — as soon as it has details or
screenshots.** Until then the card links straight to GitHub and no empty page is built.
`/projects/` always lists everything, split into featured and the rest.

### Screenshots by hand

Put `<name>.avif`, `<name>.webp` and `<name>.jpg` in `public/projects/<slug>/`, then:

```sql
INSERT INTO screenshots (project, file, alt, position)
VALUES ('surdo-ai', 'dashboard', '{"en":"…","uz":"…","ru":"…"}', 0);
```

The studio does the three conversions for you; by hand, `scripts/process-portrait.mjs` is a
working example of the same sharp pipeline.

## Replacing the portrait

Drop a new photo at `assets/portrait-source.jpg` and run:

```bash
node scripts/process-portrait.mjs
```

It crops to 4:5 from the top and writes `public/portrait.avif|webp|jpg`, reporting the
size of each — the budget is 60 KB. With no portrait present the hero falls back to a
monogram rather than a stand-in face.

The Open Graph cards and the touch icon are generated the same way:

```bash
node scripts/generate-og.mjs
```

## Running it as one container

```bash
docker compose up --build
```

- **Site** — http://localhost:8080/
- **Studio** — http://localhost:8080/studio/

One image serves both. The site is still static files out of `dist/`; the studio sits behind
a login at `/studio/`, and whenever it changes a post or a project the container rebuilds
`dist/` itself, so the edit is live a few seconds later. Nothing needs restarting.

### Signing in

|               |                                             |
| ------------- | ------------------------------------------- |
| Username      | `defonic` — override with `STUDIO_USER`     |
| Password      | `123` — **override with `STUDIO_PASSWORD`** |
| One-time code | six digits from an authenticator app        |

On first run the container generates a TOTP secret, prints it, and keeps it in
`data/studio-secret.json` so it survives restarts:

```
TOTP   otpauth://totp/mamatmusayev.uz:defonic?secret=…&issuer=mamatmusayev.uz&digits=6&period=30
       secret: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX  — add it to your authenticator app
```

Read it with `docker compose logs site`, then add it to Google Authenticator, Aegis, 1Password
or any other TOTP app — either by pasting the secret or by turning the `otpauth://` line into a
QR code. To pin your own secret instead, set `STUDIO_TOTP_SECRET` (base32) before the first run.

> **The default password is `123`.** It exists so the container runs out of the box on your own
> machine. Set `STUDIO_PASSWORD` — and put TLS in front with `STUDIO_SECURE_COOKIE=true` — before
> this is reachable from anywhere but localhost. Passwords are never stored in plain text
> (scrypt), sessions are HMAC-signed HttpOnly cookies, and five wrong attempts from one address
> buy a minute of silence.

### What persists

Two volumes, both owned by your user — the container runs unprivileged:

| Volume              | Holds                                                                        |
| ------------------- | ---------------------------------------------------------------------------- |
| `./data`            | the database, the generated secrets, the write log, backups, the JSON export |
| `./public/projects` | screenshots uploaded through the studio                                      |

Every write is appended to `data/studio.log` and mirrored into `data/export/*.json`, and the
database is copied into `data/backups/` before anything is deleted.

### Environment

| Variable               | Default   |                                                   |
| ---------------------- | --------- | ------------------------------------------------- |
| `PORT`                 | `8080`    |                                                   |
| `STUDIO_USER`          | `defonic` |                                                   |
| `STUDIO_PASSWORD`      | `123`     | change it                                         |
| `STUDIO_TOTP_SECRET`   | generated | base32; pin it to keep one secret across rebuilds |
| `STUDIO_SECURE_COOKIE` | `false`   | `true` behind TLS                                 |
| `STUDIO_SESSION_HOURS` | `12`      | how long a sign-in lasts                          |

## Deploying to Cloudflare Pages

1. Push the repository to GitHub.
2. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → connect the repo.
3. Build command `npm run build`, output directory `dist`, Node version `22`.
4. **Custom domains** → add `mamatmusayev.uz` and `www.mamatmusayev.uz`.

### Fixing the certificate (SPEC A0)

`https://mamatmusayev.uz` currently serves a browser privacy/SSL warning, which is why
LinkedIn cannot generate a preview for it. To clear it:

1. Point the domain's nameservers at Cloudflare.
2. DNS: `A`/`CNAME` for the apex → Pages, proxied (orange cloud). Same for `www`.
3. SSL/TLS → **Full (strict)**. Edge Certificates → **Always Use HTTPS** on,
   **Automatic HTTPS Rewrites** on, HSTS on (start with a short max-age).
4. Rules → Redirect `www.mamatmusayev.uz/*` → `https://mamatmusayev.uz/$1`, 301.
5. Verify:

   ```bash
   curl -I https://mamatmusayev.uz          # 200, valid chain
   curl -I http://mamatmusayev.uz           # 301 → https
   curl -I https://www.mamatmusayev.uz      # 301 → apex
   ```

6. Re-run the LinkedIn Post Inspector so the preview is regenerated.

Then set `profile.links.source` in `profile.json` to the repository URL if you want the
"Source on GitHub" link in the footer, and fix the LinkedIn URL on your GitHub profile —
it currently points at a slug that does not exist.

## Assumptions

- **Content model.** SPEC A5 puts the lede and the "Now" strip in `profile.json`; since
  both need translating, every translatable field is stored as `{ en, uz, ru }` in the
  same file rather than split across `src/i18n/`. Interface chrome stays in `src/i18n/`.
- **Certification links.** The brief says to link each certificate "where available".
  No credential URLs were supplied, so every `url` is `null` and no link is rendered.
  Fill them in and the links appear.
- **Star counts and repo totals** are deliberately absent — see `SPEC.md` A2.
- **Design direction.** The palette, motion and navigation follow the revised A4
  ("Glass Atlas"), which replaced the original flat institutional direction at the
  owner's request. The revised JavaScript budget in A5 comes with it.
