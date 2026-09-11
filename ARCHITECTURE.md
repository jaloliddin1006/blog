# Architecture

Static site, no server, no client framework. Astro renders everything to HTML at build
time; what reaches the browser is markup, one stylesheet, and about 2 KB of JavaScript.

## Layout

```
src/
  content/            the site's facts, as JSON — one file per kind
    posts/{en,uz,ru}/ blog posts as Markdown + frontmatter
  content.config.ts   the posts collection (glob loader + zod schema)
  i18n/{en,uz,ru}.json interface strings
  lib/
    content.ts        loads and validates the JSON; throws at build time on bad data
    i18n.ts           locales, translation lookup, URL and date helpers
    posts.ts          published posts per language
  styles/
    tokens.css        every colour in the project, per theme
    fonts.css         self-hosted IBM Plex, Latin + Cyrillic
    motion.css        scroll-driven animation
    global.css        Tailwind, base rules, the glass utilities
  components/         one per section, plus Header, RailNav, Atlas, BlogView, CvView
  layouts/Base.astro  <head>, theme script, backdrop, header, rail, footer
  pages/              routes only; every page is a few lines over a component
scripts/              portrait, OG cards, orthography check, JS budget, test server
```

## Routing and i18n

English lives at the root, the other two behind a prefix:

| Route      | English             | Uzbek / Russian        |
| ---------- | ------------------- | ---------------------- |
| home       | `/`                 | `/uz/`, `/ru/`         |
| blog index | `/blog/`            | `/uz/blog/`            |
| post       | `/blog/<slug>/`     | `/uz/blog/<slug>/`     |
| projects   | `/projects/`        | `/uz/projects/`        |
| project    | `/projects/<slug>/` | `/uz/projects/<slug>/` |
| CV         | `/cv/`              | `/uz/cv/`              |
| not found  | `/404`              | shared                 |

English pages are ordinary files; `src/pages/[lang]/…` generates the other two from
`PREFIXED_LOCALES`. Each route is a thin wrapper over a shared view component, so the
three languages can never drift apart in markup.

`localePath(locale, route)` builds every internal link, and `<head>` carries `hreflang`
for all three plus `x-default` → English. The language switch keeps the current `#anchor`:
a five-line inline script rewrites the three hrefs on load and on `hashchange`.

Blog routes are `[...slug].astro`, where `slug: undefined` is the index. When a language
has no published posts, `getStaticPaths` returns nothing, so `/blog/` does not exist for
that language and the nav item and homepage section hide themselves.

## Content and validation

Structured content is plain JSON, imported and parsed through zod in `lib/content.ts`.
A missing field or a malformed URL throws during `npm run build` with the file name and
the path to the bad field. Blog posts use an Astro content collection because they need
Markdown rendering; their frontmatter is validated the same way.

Translatable fields are `{ en, uz, ru }` objects and are read with `pick(field, locale)`.

## The dataset layer

`src/lib/dataset.ts` flattens the content files into one list of records — roles, projects,
skills, certificates, education, posts — each with a label, a sub-line, match tags, a year
where it has one, and an href per locale. Three surfaces read it and nothing else:

- **`/data.json`** (`src/pages/data.json.ts`) publishes the subject, the counts and every
  record as a static file.
- **The query console** renders one `<li>` per record at build time. Typing shows and hides
  rows; nothing is built from strings at runtime, so scoped styles apply, screen readers see
  a real list, and there is no injection surface.
- **The background field** reads those same rows out of the DOM rather than carrying a
  second copy, which keeps the records in the page exactly once (~14 KB gzipped for the
  whole homepage).

The field exposes `window.atlas` — `records`, `highlight(ids)` and `section(id)` — which is
how the console, the time-axis chart and the scroll observer all drive the same visual.
`atlas.highlight` is a no-op when WebGL never starts, so every caller can be unconditional.

## Theme

Three states: system, explicit light, explicit dark. Tokens are defined three times in
`tokens.css` — on bare `:root`, under `@media (prefers-color-scheme: dark)` guarded by
`:root:not([data-theme='light'])`, and under `:root[data-theme='dark']`, so an explicit
choice always wins in both directions.

No flash: a blocking inline script in `<head>` reads `localStorage.theme` and stamps
`data-theme` on `<html>` before the first paint. It is wrapped in try/catch because
private mode can throw on access.

## Motion

Two mechanisms, one behaviour:

- **CSS scroll-driven animations** (`animation-timeline: view()` / `scroll()`) do the work
  where the browser supports them. Panels rise as they enter, cards carry their own
  timelines so grids stagger themselves, the hero fades as it leaves, and a progress line
  tracks the scroll. All of it runs off the main thread and scrubs backwards on scroll up.
- **An IntersectionObserver fallback** adds `.is-visible` for browsers without them. It
  bails out immediately via `CSS.supports('animation-timeline: view()')`, so the two never
  both run.

`prefers-reduced-motion: reduce` disables every effect, in CSS and in both scripts.

## The backdrop

`components/Atlas.astro` draws a Fibonacci-distributed point sphere wired to its nearest
neighbours, rotating slowly, leaning toward the pointer and tilting with scroll depth. It
reads `--particle*` from the theme tokens and re-reads them through a `MutationObserver`
when the theme changes.

Three.js is ~120 KB gzipped, so it is behind a dynamic `import('three')` guarded by three
checks: reduced motion, `navigator.connection.saveData`, and WebGL support. Fail any one
and the module is never requested — the page is then the static glass design at ~2 KB of
JavaScript. `scripts/check-js-budget.mjs` fails CI if the eager chunk grows past 8 KB.

## Fonts

IBM Plex Serif 600, Sans 400/600 and Mono 400, self-hosted from `public/fonts/`, split
into Latin and Cyrillic faces with explicit `unicode-range`, so a Latin-only page never
downloads Cyrillic. No request leaves the origin. The two faces used above the fold are
preloaded.

## Build outputs

`npm run build` runs `astro check` then the static build. Two generators are run by hand
when their inputs change, and their outputs are committed:

- `scripts/process-portrait.mjs` — AVIF/WebP/JPEG from `assets/portrait-source.jpg`
- `scripts/generate-og.mjs` — three 1200×630 Open Graph cards and the touch icon,
  rasterised from an SVG with resvg using the site's own font files

## Adding a language

1. Copy `src/i18n/en.json` to `src/i18n/<code>.json` and translate it.
2. Add the code to `LOCALES` in `src/lib/i18n.ts` and a date locale to `DATE_LOCALES`.
3. Add the `<code>` key to every `{ en, uz, ru }` object in `src/content/*.json` — zod
   will list what you missed.
4. Add it to the sitemap locales in `astro.config.mjs` and to `OG_LOCALE` in `Base.astro`.
5. `mkdir src/content/posts/<code>` and run `node scripts/generate-og.mjs`.

Routes, hreflang, the switch and the CV follow automatically.

## The studio

`scripts/studio.mjs` is a plain Node server — no Astro, no adapter, no framework — that
serves `scripts/studio/index.html` and a handful of JSON endpoints. It writes Markdown
posts, upserts `projects.json`, and runs uploaded screenshots through sharp into AVIF,
WebP and JPEG under `public/projects/<slug>/`.

It binds to `127.0.0.1` and is deliberately outside the Astro app. Astro builds static
output with no adapter, so an on-demand route would need one, and adding one would put a
writable surface on the deployed site. Keeping the studio separate means what gets
deployed stays exactly what it was — static files.

The studio validates only enough to fail fast: required fields, the 155-character summary
limit, at least one stack chip. Real validation stays where it belongs, in the zod schemas
that run on every `npm run build`.

Screenshot uploads skip multipart entirely — the browser posts the raw file as the request
body with the slug and filename in the query string, which is why the server needs no
parser dependency.

## Deployment

Cloudflare Pages, `npm run build` → `dist/`. See the README for DNS, SSL and the redirect
rules that clear the certificate warning described in SPEC A0.
