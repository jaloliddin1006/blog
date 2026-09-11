# mamatmusayev.uz

A one-page personal site for **Jaloliddin Mamatmusayev**, Head of Information Systems
Development and Implementation at the National Statistics Committee of Uzbekistan —
with a CV page and a short blog, in English, Uzbek and Russian.

Built with Astro, Tailwind and a Three.js backdrop. Everything ships as static HTML.
The full brief lives in [`SPEC.md`](./SPEC.md); the code map is in
[`ARCHITECTURE.md`](./ARCHITECTURE.md).

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # type check + static build into dist/
npm run lint     # formatting + Uzbek orthography
npm test         # Playwright, desktop and mobile
```

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

## The studio — writing without touching files

```bash
npm run studio      # http://localhost:4322
```

A small authoring tool that runs **only on your machine**. It has two tabs:

- **Posts** — language, title, date, summary (with the 155-character limit enforced),
  an optional "link out to LinkedIn instead" URL, a draft switch, and a Markdown body.
  Save writes `src/content/posts/<lang>/<slug>.md`.
- **Projects** — pick an existing project or start a new one: name, slug, repository,
  demo, stack chips, licence, the featured switch, one-line descriptions in all three
  languages, and the longer details that fill the project page. Save writes
  `src/content/projects.json`.
- **Screenshots** — drag an image onto the drop zone (or click to choose). It is resized
  to 1600px and written as AVIF, WebP and JPEG into `public/projects/<slug>/`, then listed
  with `alt` and caption fields for each language. Fill the alt text in — it is the one
  field a screenshot must have.

The studio binds to `127.0.0.1`, is never built into the site, and adds nothing to what
gets deployed. It writes plain files; review them with `npm run dev`, then commit. If it
writes something malformed, `npm run build` refuses it — the zod schemas still apply.

Everything it does can also be done by editing the files by hand; the sections below
describe that.

## Adding a blog post

Create a Markdown file under `src/content/posts/<lang>/`:

```markdown
---
title: 'What I changed about our ETL'
date: 2026-10-02
lang: uz
summary: 'One sentence, 155 characters or fewer — it becomes the card and the meta description.'
---

Your text. Headings, lists, links, code — all standard Markdown.
```

- `draft: true` keeps it out of the build.
- `external: 'https://www.linkedin.com/…'` turns the post into a card that links to
  LinkedIn instead of getting its own page — useful for a post you do not want to rewrite.
- A post is listed only under its own language. With no published posts in a language,
  the blog section, the nav item and the `/blog/` route all disappear by themselves.

## Adding a project

Either use the studio, or add an entry to `src/content/projects.json`:

```jsonc
{
  "slug": "surdo-ai", // the URL segment: lowercase words joined by hyphens
  "name": "surdo-ai",
  "repo": "https://github.com/jaloliddin1006/surdo-ai",
  "demo": null, // or a URL
  "featured": true, // true puts it on the homepage
  "license": "MIT", // optional
  "stack": ["Python", "AI"], // up to three chips
  "description": { "en": "…", "uz": "…", "ru": "…" }, // one line, shown on the card
  "details": { "en": [], "uz": [], "ru": [] }, // paragraphs for the project page
  "screenshots": [],
}
```

**A project gets a page of its own — `/projects/<slug>/` — as soon as it has details or
screenshots.** Until then the card links straight to GitHub and no empty page is built.
`/projects/` always lists everything, split into featured and the rest.

### Screenshots by hand

Put `<name>.avif`, `<name>.webp` and `<name>.jpg` in `public/projects/<slug>/` and add:

```jsonc
"screenshots": [
  {
    "file": "dashboard",                                  // the base name, no extension
    "alt": { "en": "…", "uz": "…", "ru": "…" },           // required — describe the image
    "caption": { "en": "…", "uz": "…", "ru": "…" }        // optional
  }
]
```

The studio does the three conversions for you; by hand, `scripts/process-portrait.mjs` is
a working example of the same sharp pipeline.

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
