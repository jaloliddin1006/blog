# mamatmusayev.uz — Homepage Specification & Build Prompts

Owner: Jaloliddin Mamatmusayev · Prepared: 10 Sep 2026
Purpose: everything an engineer or an AI coding agent needs to build the homepage of a personal portfolio/profile site. Part A is the spec (what & why). Part B is a single master prompt. Part C splits the work into four agent prompts. Part D is the acceptance checklist.

---

## PART A — TECHNICAL SPECIFICATION

### A0. Blocker to fix first

`https://mamatmusayev.uz` currently returns a browser **privacy/SSL error**. LinkedIn cannot generate a link preview for it and visitors will bounce. Before any page is built: issue a valid certificate (Let's Encrypt via the host, or Cloudflare proxy with Full-strict SSL), redirect `http://` → `https://` and `www` → apex, and confirm with `curl -I https://mamatmusayev.uz` returning `200` and a valid chain.

### A1. Project brief

A one-page personal site for a technical leader in the public sector. It must do three jobs in this order:

1. Confirm identity and credibility within 5 seconds for someone arriving from LinkedIn, a conference badge, or a Google search of the name.
2. Show depth: the data-systems / AI path, real projects, real stack.
3. Make contact easy.

Audience: government and private-sector IT leaders in Uzbekistan and Central Asia, international partners (World Bank, UN agencies, statistical offices), recruiters, university students who follow the owner on LinkedIn.

Tone: calm, precise, institutional-modern. Not a startup landing page, not a developer "hacker" theme. Think "national data infrastructure" — the same world as the LinkedIn banner (deep navy, teal data lines, Uzbekistan map contour).

### A2. Fact sheet (single source of truth — use verbatim, do not invent)

**Identity**

- Name: Jaloliddin Mamatmusayev
- Title: Head of Information Systems Development and Implementation Department
- Organization: National Statistics Committee of the Republic of Uzbekistan
- Location: Tashkent, Uzbekistan
- Email: jmamatmusayev@gmail.com
- LinkedIn: https://www.linkedin.com/in/mamatmusayev (note: the GitHub profile currently links to a wrong slug `in/jaloliddinmamatmusayev` — fix it on GitHub)
- GitHub: https://github.com/jaloliddin1006 (repo and follower counts change constantly — they are context for you, never render them on the page)
- Telegram: https://t.me/mamatmusayev_uz
- Languages: Uzbek (native), Russian (full professional), English (professional working)

**One-line positioning**
"I build and run the information systems behind Uzbekistan's national statistics — from PostgreSQL data architecture to AI adoption."

**Career timeline — National Statistics Committee of Uzbekistan**
| Period | Role |
|---|---|
| Jul 2026 – present | Head of Information Systems Development and Implementation Department |
| Jun 2025 – Jul 2026 | Chief Specialist, Information Systems Development and Implementation Department |
| Mar 2025 – Jun 2025 | Chief Specialist, AI Technologies Implementation Department |
| Sep 2024 – Mar 2025 | Lead Database Engineer |

Earlier: Backend Developer, ICT Academy (part-time, Jun 2023 – Sep 2025) — REST APIs and Telegram-bot/LMS integrations with Python and Django.

**Role descriptions (already approved for LinkedIn; reuse)**

- Head of department: leads design, development and rollout of information systems supporting national statistical data collection, processing and reporting; manages the development team, sets technical standards, reviews architecture; coordinates cross-department and external integrations.
- Chief Specialist, IS: designed and developed internal information systems (Python, Django, PostgreSQL); led technical implementation across departments; integrated systems with internal databases and external sources via REST APIs.
- Chief Specialist, AI: evaluated and piloted AI/ML solutions for statistical data processing; built prototypes with Python, vector databases and LLM tooling (RAG, semantic search); prepared implementation plans for AI adoption.
- Lead Database Engineer: designed, maintained and optimized PostgreSQL databases for national statistical datasets; data models, migrations, indexing, query optimization; data integrity, backup, access control.

**Education**

- B.Sc. in Artificial Intelligence, Tashkent University of Information Technologies (TUIT), 2021–2025, GPA 4.0/5.0.

**Certifications (technical only, newest first)**

- Advanced Django: Building a Blog — Codio, Oct 2025
- Python Programming Fundamentals — Microsoft, Jul 2025
- Vector Database Fundamentals Specialization — IBM / SkillUp EdTech, May 2025
- Vector Search with Relational Databases using PostgreSQL — IBM, May 2025
- Introduction to Generative AI for Software Development — DeepLearning.AI, Mar 2025
- Learn to Program: The Fundamentals — University of Toronto, Mar 2025
- Computer Hardware and Software — UC Irvine, Feb 2025
- NLP: Twitter Sentiment Analysis — Coursera Project Network, Feb 2025

**Skills (grouped; this grouping is the display order)**

- Data & backend: Python, Django, Django REST Framework, PostgreSQL, SQL, Redis, REST API design, Docker, Git, Linux
- AI & data systems: vector databases (pgvector), RAG / LLM tooling, machine learning, NLP, generative AI
- Bots & integration: Telegram Bot API, aiogram 3, Tortoise ORM, LMS/payment integrations (Payme, Upay)
- Leadership: team leadership, software project management, system architecture, data architecture

**Selected projects (from GitHub; descriptions rewritten in English — repo descriptions are in Uzbek)**
| Repo | What it is | Stack | Notes |
|---|---|---|---|
| `chatbot-with-llm` | Chatbot built on a vector database + LLM (RAG) | Python | AI |
| `llama-3.2-1b-fine-tuned-model` | Llama 3.2 1B fine-tuned on Uzbek-language data | Python / notebooks | AI |
| `surdo-ai` | Real-time sign-language (surdo) translator | Python | AI · MIT |
| `real-time-translator` | Real-time speech-to-text → translate → text-to-speech | JavaScript, Python | AI · MIT |
| `Imlo-xato-tekshiruvchi-bot` | Uzbek spell-checker Telegram bot (Latin & Cyrillic) | Python | NLP |
| `tift_bot` | Telegram bot integrated with TIFT University LMS: courses, schedule, grades, library | Python | Integration |
| `insta-clone` | Instagram-style REST API | Python / DRF | Backend |
| `django-aiogram3-bot-template` | Template for Telegram bots on Django + aiogram 3 | Python | Backend · MIT |
| `aiogram3-bot-template` | Minimal aiogram 3 starter | Python | Backend |
| `resume-builder` | Web app to generate résumés / CVs | TypeScript | Web |
| `Urban.Tech_Uzbekistan` | AI market software (hackathon) | Python | AI |
| `LeetCodeSolves` | Algorithm solutions | Python | Algorithms |

Star counts and repo totals are deliberately absent: they go stale and would break the "every fact matches A2" rule. If the owner wants them, fetch them from the GitHub REST API at build time — never hard-code them.

Featured on the homepage (6): `chatbot-with-llm`, `llama-3.2-1b-fine-tuned-model`, `surdo-ai`, `real-time-translator`, `insta-clone`, `django-aiogram3-bot-template`. Work at the Committee is described in prose only — no internal system names, screenshots or figures.

### A3. Site structure

One page with anchored sections, plus two real routes: `/blog/` (with post pages) and `/cv/`. Order is fixed. Copy is final unless marked _(draft)_.

**0. Header** — wordmark "J. Mamatmusayev" (text, no logo), nav: About · Work · Projects · Blog · Contact, plus a `CV` link set apart from the nav; language switch EN | UZ | RU; theme toggle. Sticky, 56px, translucent on scroll.

**1. Hero** — height fits content, never 100vh.

- Eyebrow: `National Statistics Committee of Uzbekistan`
- H1: `Jaloliddin Mamatmusayev`
- Sub: `Head of Information Systems Development & Implementation`
- Lede (max 60 words): `I build and run the information systems behind Uzbekistan's national statistics — from PostgreSQL data architecture and backend services to piloting AI in statistical workflows. Previously Lead Database Engineer and AI implementation specialist at the Committee; B.Sc. in Artificial Intelligence, TUIT.`
- Two actions: primary `Get in touch` (mailto), secondary `LinkedIn ↗`.
- Right side: portrait photo (the current LinkedIn one — dark suit, neutral background) in a soft-cornered frame; on mobile the photo goes above the text at 96px round.
- Background: subtle abstract data motif matching the LinkedIn banner (thin teal network lines / dots on navy), ≤ 10% opacity in light theme, ≤ 25% in dark. Implemented as inline SVG or CSS, not a raster.

**2. Now** — a 3-column strip of facts, no icons:
`Leading · a department of engineers building statistical information systems` / `Stack · Python, Django, PostgreSQL, Redis, Docker` / `Exploring · pgvector, RAG and LLMs on official statistics`

**3. About** — the only prose block on the page: two paragraphs, ≤ 110 words total, one measure wide (≤ 68ch), no photo, no pull-quote, no callout box. Ends with a one-line `Languages · Uzbek (native) · Russian (full professional) · English (professional working)`. Draft copy:

> `I work at the National Statistics Committee of Uzbekistan, where I lead the team that designs, builds and rolls out the information systems behind national statistical data collection, processing and reporting. My path there went from database engineering to AI implementation to running the department.`
> `Day to day that means data architecture in PostgreSQL, backend services in Python and Django, integrations over REST APIs, and evaluating where AI genuinely helps official statistics — vector search, RAG and LLM tooling — rather than where it merely looks impressive.`

**4. Work** — a span chart on a real time axis (from the `start`/`end` months in `experience.json`) above a vertical timeline of the same five roles: period on the left, role on the right, 2-line description each; ICT Academy as a fifth, lighter entry. Hovering a span lights its entry and its record in the background field; below 768px the chart is dropped and the list carries it alone. A single caption above: `National Statistics Committee of the Republic of Uzbekistan · Sep 2024 – present`. A `Full CV →` link to `/cv/` sits under the timeline.

**5. Projects** — grid of 6 featured cards (3×2 desktop, 1 column mobile). Each card: a cover screenshot when there is one, name, one-line description, 2–3 stack chips, and links. No star counts, no repo totals — nothing that goes stale. Cards are equal height, same padding; a 1px border and a hover lift. Below the grid: `All projects →` (to `/projects/`) and `All repositories on GitHub ↗`.

- **`/projects/`** lists every repository in `projects.json`, split into _Featured_ and _Everything else_, using the same card.
- **`/projects/<slug>/`** is a project's own page: name, description, stack, licence, repository and demo links, the written details, and a screenshot gallery. **A project only gets a page once it has details or screenshots** — otherwise the card links straight to GitHub and the route is never built, which keeps empty pages out of the site and out of the sitemap.
- Screenshots live in `public/projects/<slug>/<file>.{avif,webp,jpg}`, each with `alt` in all three languages and an optional caption.

**6. Skills** — four labeled rows from A2, plain chips. No progress bars, no percentages.

**7. Education & certifications** — two columns: TUIT degree on the left; certifications list on the right with issuer and date, newest first, each linking to its Coursera credential where available.

**8. Blog** _(ships empty-safe)_ — a short, plain blog, not a publication.

- On the homepage: the three most recent published posts as cards — title, date, one-line summary, `Read →` to `/blog/<slug>/` — then `All posts →`. With zero published posts the section, the nav item and the `/blog/` route all hide themselves.
- Posts are Markdown files in `src/content/posts/`, frontmatter: `title`, `date`, `lang` (`en` | `uz` | `ru`), `summary` (≤ 155 chars), `draft` (default false). A post is listed only under its own language.
- `/blog/` lists every published post for the current language, newest first, one column, date + title + summary. No pagination, no tag cloud, no categories, no archive by year, no author box, no cover images.
- `/blog/<slug>/` renders title, date, prose (≤ 68ch measure), and a `← Blog` link. No comments, no share buttons, no reaction counts, no "related posts", no newsletter box.
- A LinkedIn post the owner does not want to rewrite is a Markdown stub with a summary and a `Read on LinkedIn ↗` link — same card, no special case.

**9. Contact** — one sentence + three links: Email, LinkedIn, Telegram. The address is HTML-entity-encoded in the `mailto:` href and the label (JS-free anti-scraping); it renders normally and stays copyable. Optional form only if a backend exists; otherwise mailto. No phone number on the site.

**10. Footer** — `© 2026 Jaloliddin Mamatmusayev · Tashkent` · GitHub · LinkedIn · `Source on GitHub` (if the site repo is public).

**R. `/cv/` — the resume** — one printable page assembled from the same JSON as the homepage, so it can never drift from it. Per language: `/cv/`, `/uz/cv/`, `/ru/cv/`.

- Order: name + title + contact line · summary (the hero lede) · Experience (all five roles, 2–3 bullets each) · Education · Certifications · Skills · Selected projects (six, with URLs).
- A `Download PDF` button calls `window.print()` — the only scripted control on the page.
- Print stylesheet: A4, black on white, header/nav/footer/theme toggle/button all `display: none`, links printed as `text (url)`, no page-break inside an entry, target 2 pages.
- No photo on the CV, no skill bars, no "references available on request", no icons.

### A4. Design direction — "The dataset is the interface"

_Revised 10 Sep 2026, at the owner's request: the original brief called for a flat, institutional page with no motion. The owner asked instead for an unusual, glass-led interface with Three.js and scroll animation. That direction is recorded here and supersedes the earlier one; the trade-offs it forces are stated in A5._

- **The idea**: the subject runs the information systems behind a national statistics office, so the site is built the way one would be. Content becomes a dataset first, and the page, the background field, the query console and `/data.json` are four views over that same dataset.
  - **The background is not decoration.** Every bright node in the WebGL field is one record — a role, a project, a skill, a certificate, a post — laid out in type order so each type owns a band of the sphere. The dim nodes are the lattice they sit in. Scrolling a section lights that section's records; hovering a node names it; clicking one goes to it.
  - **The site answers queries about itself.** ⌘K, Ctrl+K or `/` opens a console over the dataset: free text plus `type:`, `stack:` and `year:`. It reports its result the way a query would — `12 records · 0.3 ms` — and the field filters to the same rows as you type. Rows are rendered at build time and merely shown or hidden, so the list is real HTML and nothing is built from strings at runtime.
  - **The dataset is published.** `/data.json` carries the subject, the counts and every record. A line under the hero states it plainly — `this page is a view over a dataset · 52 records · 6 types · 3 languages · generated <date> · data.json` — and the record count is the button that opens the console.
  - **The work history is a chart, not a list.** Roles are drawn as spans on a real time axis built from their start and end months, so duration and overlap are visible: the part-time ICT Academy work running alongside the first Committee roles is a fact the page can show rather than state. The written entries stay below it as the accessible source of truth.
- **Palette (light)**: ground `#EEF3F8` → `#DFE9F1` with teal and blue glow blobs; glass `rgba(255,255,255,.58)`; border `rgba(20,37,59,.12)`; ink `#14253B`; ink-2 `#4A5D74`; accent `#10707F`. **Dark**: ground `#060C14` → `#0D1826`; glass `rgba(255,255,255,.055)`; border `rgba(255,255,255,.11)`; ink `#EAF0F7`; ink-2 `#9DB0C6`; accent `#5FC0D2`. Every text/background pair in both themes is verified ≥ 4.5:1.
- **Material**: `backdrop-filter: blur(18px) saturate(150%)`, a 1px border, a soft drop shadow, and a hairline of light along the top edge. Radius 20px on panels, 999px on the header bar, rail, chips and buttons.
- **Type**: IBM Plex Serif 600 for the name and section titles; IBM Plex Sans for body; IBM Plex Mono for indices, labels, dates and chips — uppercase, wide tracking. Self-hosted, Latin + Cyrillic subsets only, no font CDN. Body 16–17px, line-height 1.6, measure ≤ 66ch.
- **Navigation**: no menu bar. A floating glass pill carries the wordmark, Blog, CV, the language switch and the theme toggle. Section navigation is a **rail** — a column of nodes down the right edge on desktop that lights up as you pass each section and opens its labels on hover; below 1180px the same rail lies down as a compact bar at the bottom of the screen.
- **Sections**: each is a glass panel with a mono index (`01`, `02`, …), a hairline rule fading to the right, and a serif title, all left-aligned above the content.
- **Motion** — simple, and driven by scroll rather than by timers:
  - a 2px teal progress line across the top, tied to scroll position;
  - panels rise 30px and fade in as they enter; cards carry their own timelines so grids stagger themselves;
  - the hero lifts, softens and fades as it hands the page over;
  - the portrait drifts slightly slower than the text beside it;
  - the globe turns slowly, leans toward the pointer, and tilts with scroll depth.
    All of it uses CSS scroll-driven animations (`animation-timeline: view() / scroll()`) where available, with an IntersectionObserver fallback. `prefers-reduced-motion: reduce` disables every effect and skips the WebGL download entirely.
- **Do not**: emoji as icons, animated counters, skill percentage bars, stock illustration, a terminal/"hacker" theme, carousels, parallax on body text, or anything that moves without the user scrolling.

### A5. Technical requirements

- **Stack (default)**: Astro (latest stable) + TypeScript + Tailwind CSS (latest stable), content in `src/content/*.json|md`, deployed as static HTML. Rationale: fastest path to Lighthouse 100, trivial hosting, zero server to maintain. Acceptable alternative if the owner prefers his own stack: Django with a single template and WhiteNoise — but rendering must still be cached/static. No React/Next unless a real app feature appears later.
- **Hosting**: two shapes, same output.
  - **Static host** — Cloudflare Pages or Vercel (free tier), domain via Cloudflare DNS with proxied A/CNAME and Full (strict) SSL, which also resolves A0.
  - **One container** — `docker compose up`, serving the built site at `/` and the studio at `/studio/` from the same port. The studio is behind a username, a password and a TOTP code; the container rebuilds the site itself after every content change. Defaults are `defonic` / `123`, which must be overridden before the container is reachable from anywhere but localhost.
- **i18n**: EN default at `/`, UZ at `/uz/`, RU at `/ru/`. All strings in `src/i18n/{en,uz,ru}.json`. `hreflang` tags on every page, including `x-default` → EN. Language switch preserves the section anchor.
  - Uzbek Latin orthography: `o‘` and `g‘` use U+2018, and the tutuq belgisi uses U+2019 — never the ASCII apostrophe. _The strictly correct code points are U+02BB/U+02BC, but IBM Plex draws both with a full letter-width advance, which visibly spaces Uzbek words out ("yig ʻ iladi"); U+2018/U+2019 carry the same shapes with correct metrics in this typeface._ `npm run lint` fails the build on any of the three wrong characters in Uzbek content.
- **Theme**: light/dark via `prefers-color-scheme` plus a manual toggle stored in `localStorage`; all colors via CSS custom properties; no flash of wrong theme (inline script sets `data-theme` before paint).
- **SEO / sharing**: unique `<title>` and meta description per language; Open Graph + Twitter card with a 1200×630 image (name, title, navy ground); JSON-LD `Person` schema (name, jobTitle, worksFor, alumniOf, sameAs → LinkedIn, GitHub); `sitemap.xml`, `robots.txt`, canonical URLs, `x-default` hreflang, a favicon set (SVG + 180px apple-touch-icon) and a styled 404 page that keeps the header and footer.
- **Performance**: Portrait ≤ 60 KB (AVIF/WebP with fallback), fonts self-hosted and subset to Latin + Cyrillic, no third-party scripts except optional privacy-friendly analytics (Plausible or Umami) — no Google Analytics.
  - **JS budget, revised**: the WebGL backdrop in A4 costs ~120 KB gzipped for Three.js, so the original 30 KB ceiling cannot hold. The rule is now **≤ 8 KB of JavaScript on first load**, with Three.js fetched lazily and only once the page has decided the scene will actually run — never under `prefers-reduced-motion`, never on `Save-Data`, never without WebGL. Those visitors get the static glass design within the original budget.
  - **Lighthouse**: ≥ 95 for Accessibility, Best Practices and SEO on mobile. Performance is measured but not gated: the backdrop is a deliberate choice, and the lazy load keeps it off the critical path.
- **Accessibility**: semantic landmarks, one `h1`, visible focus rings, color contrast ≥ 4.5:1 in both themes, all images with `alt`, keyboard-operable nav and toggles, `lang` attribute per page.
- **Content model** (so the owner can edit without touching layout):
  - `content/profile.json` — identity, links, lede, "Now" strip
  - `content/experience.json` — timeline entries
  - `content/certifications.json`
  - `data/site.db` — posts, projects and screenshots (SQLite; these keep being added)
- **Quality gates**: `npm run build` with zero warnings, `npm run lint`, an HTML validator pass, a Playwright smoke test that loads `/`, `/uz/`, `/ru/`, toggles theme, and asserts every external link has `rel="noopener"`.
- **Routes**: `/`, `/blog/`, `/blog/<slug>/`, `/projects/`, `/projects/<slug>/`, `/cv/`, `/404`, each mirrored under `/uz/` and `/ru/`, plus `/data.json`. All static — no server, no runtime rendering.
- **Authoring**: a local studio (`npm run studio`) — one page, posts on the left and projects on the right — writes into `data/site.db` and `public/projects/`. It binds to `127.0.0.1`, is never part of the build, and adds no runtime surface to the deployed site — the repository stays the source of truth, and `npm run build` still validates everything it wrote. Screenshots are resized to 1600px and written as AVIF, WebP and JPEG.
- **Out of scope for v1**: a hosted CMS, contact form backend, comments, blog tags/categories/pagination/RSS-beyond-a-single-feed, search.

---

## PART B — MASTER PROMPT (single agent)

This file lives at the repository root as `SPEC.md`. Paste the prompt below into Claude Code, Cursor, or any coding agent and let it read `SPEC.md` itself.

```
You are a senior front-end engineer building a personal portfolio homepage for Jaloliddin Mamatmusayev at mamatmusayev.uz. The full specification is in SPEC.md in this repository. Read it completely before writing any code. Treat Part A2 (fact sheet) as the only source of truth for names, dates, roles, projects and links — never invent, embellish, or "improve" biographical facts, and never add internal details about his employer's systems.

Deliverables:
1. An Astro (latest stable) + TypeScript + Tailwind (latest stable) project that builds to static HTML, with the content model from A5 (JSON files under src/content/) already filled with the data from A2.
2. The homepage exactly as structured in A3, plus the `/blog/`, `/blog/<slug>/` and `/cv/` routes, in three languages (EN at /, UZ at /uz/, RU at /ru/). Write the UZ and RU translations yourself; keep them faithful to the English copy; use Uzbek Latin script.
3. Light and dark themes per A4, with no flash of incorrect theme.
4. SEO, Open Graph image, JSON-LD Person schema, sitemap, robots, hreflang per A5.
5. A Playwright smoke test and a GitHub Actions workflow that runs lint, build and the test on every push.
6. A README with: how to edit content JSON, how to add a post, how to deploy to Cloudflare Pages, and the DNS/SSL steps from A0.

Constraints:
- Follow the design direction in A4 literally: palette, typefaces, left alignment, no gradients, no emoji icons, no skill bars, no load animations.
- Total shipped JavaScript ≤ 30 KB. No React. No UI component libraries. No third-party scripts.
- Every color comes from a CSS custom property defined in :root and redefined for dark mode; no hard-coded colors in components.
- Mobile first; verify at 360px, 768px, 1280px.
- Accessibility per A5 is a requirement, not a nice-to-have.

Process:
- Start by printing a short plan (files you will create, in order). Then build section by section in the order of A3, committing after each section with a descriptive message.
- After the build, run Lighthouse (or an equivalent) in mobile mode and report the four scores. If any is below 95, fix it before finishing.
- Finish with a checklist mapping every item in SPEC.md Part D to a ✅ or a short reason it was not met.

If anything in the spec is ambiguous, choose the simpler option and note the assumption in the README under "Assumptions". Do not ask questions unless a decision would be irreversible.
```

---

## PART C — MULTI-AGENT PROMPTS (four roles, sequential hand-off)

Use when you want parallel or specialized agents (e.g. Claude Code sub-agents, a Cursor "team", or separate chats). Each agent receives SPEC.md plus its own prompt below. Hand-off artifacts are files in the repo, so the chain works with any tooling.

### Agent 1 — Architect

```
Role: Architect. Input: SPEC.md. Output: ARCHITECTURE.md and the repository skeleton.

Tasks:
1. Initialize an Astro (latest stable) + TypeScript + Tailwind (latest stable) project. Pin exact versions in `package.json`; record the versions you used in ARCHITECTURE.md. Configure i18n routing (/ , /uz/, /ru/), sitemap integration, and image optimization.
2. Define the content schema for src/content/ (profile, experience, projects, certifications, and a Markdown posts collection) using Astro content collections with zod validation. Field names must match SPEC.md A5.
3. Create the design tokens as CSS custom properties in src/styles/tokens.css exactly from A4 (light in :root, dark under [data-theme="dark"] and prefers-color-scheme with the :root:not([data-theme="light"]) guard). Expose the tokens to Tailwind with the CSS-first `@theme` block — Tailwind 4 has no JS config file by default, so do not invent one; on Tailwind 3 use `tailwind.config` mapped to `var(--token)`. No raw hex anywhere outside `tokens.css`.
4. Create empty component files for each A3 section with a one-line comment describing props.
5. Write ARCHITECTURE.md: folder layout, how i18n strings flow, how theme switching works without flash, how to add a language, and the deployment target (Cloudflare Pages) including the DNS/SSL fix from A0.
6. Add lint (ESLint + Prettier), a Playwright config, and a GitHub Actions workflow (lint → build → test).

Do not write any page content or component markup beyond stubs. Stop when `npm run build` passes on the empty skeleton.
```

### Agent 2 — Content & Localization

```
Role: Content editor and translator. Input: SPEC.md A2–A3, the content schema from ARCHITECTURE.md. Output: filled JSON under src/content/ and src/i18n/{en,uz,ru}.json.

Tasks:
1. Populate every content collection strictly from SPEC.md A2. Copy dates, role titles, repo names and URLs character-for-character. Rewrite nothing factual.
2. Write the UI string files for EN, UZ (Latin script) and RU: nav labels, section titles, button labels, the hero lede, the "Now" strip, the contact sentence, footer, and all aria-labels. Keep UZ and RU faithful to EN; prefer plain professional register; avoid literal calques (e.g. UZ "Bog‘lanish" for Contact, RU "Связаться"). In UZ always write `o‘`/`g‘` with U+2018 and the tutuq belgisi with U+2019 — never the ASCII apostrophe, never U+02BB/U+02BC (see A5).
3. Translate the six featured project descriptions and the four role descriptions into UZ and RU; keep technical terms (PostgreSQL, Django, RAG, pgvector) untranslated.
4. Write meta titles (≤ 60 chars) and descriptions (≤ 155 chars) for each language.
5. Produce CONTENT-REVIEW.md listing every fact you used and its source line in SPEC.md, plus any field you left empty and why.

Validation: `npm run build` must pass zod validation with zero errors. Do not touch components or styles.
```

### Agent 3 — Front-end Builder

```
Role: Front-end engineer. Input: SPEC.md A3–A5, ARCHITECTURE.md, filled content from Agent 2. Output: the finished homepage in three languages.

Tasks:
1. Implement each section component in A3 order: Header, Hero, Now, About, Work timeline, Projects grid, Skills, Education & Certifications, Blog (self-hiding when no posts are published), Contact, Footer. Then the /blog/, /blog/<slug>/ and /cv/ routes, including the print stylesheet.
2. Use only the design tokens; typographic scale: 64/44/32/22/17/14 px desktop, 40/32/26/20/16/13 mobile; IBM Plex Serif/Sans/Mono self-hosted (Latin + Cyrillic subsets), font-display: swap, real fallback stacks. No font CDN.
3. Background: the WebGL point-globe from A4, fixed behind the whole document, theme-aware, pointer- and scroll-reactive, lazily loaded, and skipped entirely under reduced motion / Save-Data / no WebGL. It must never reduce text contrast below 4.5:1.
4. Build the theme toggle with an inline pre-paint script; the language switch must keep the current #anchor.
5. Generate the Open Graph image (1200×630) at build time from profile.json (name, title, navy ground, teal rule) — use satori or a static SVG→PNG step with the self-hosted font files from step 2; no external service.
6. Add JSON-LD Person schema, hreflang, canonical, sitemap and robots.
7. Keep shipped JS ≤ 30 KB and verify with the build output.
8. Check at 360, 768, 1280 px; fix any horizontal scroll, clipped text, or uneven card heights.

Commit after each section. Do not change content JSON; if content needs a fix, write it to CONTENT-ISSUES.md for Agent 2.
```

### Agent 4 — QA & Reviewer

```
Role: QA engineer and accessibility reviewer. Input: the built site and SPEC.md Part D. Output: QA-REPORT.md and fixes for anything blocking.

Tasks:
1. Run Lighthouse (mobile) on /, /uz/, /ru/. Record all four scores per page. Anything below 95 is a blocker.
2. Run axe (or equivalent) on all three pages; fix every serious/critical issue; list moderate ones.
3. Keyboard-only pass: tab through nav, theme toggle, language switch, all cards and links; confirm visible focus and logical order.
4. Verify every fact on the page against SPEC.md A2 — dates, titles, repo names, links. Open every external link and confirm it resolves (LinkedIn slug must be /in/mamatmusayev; GitHub repos must exist).
5. Validate HTML (W3C) and structured data (Google Rich Results test or schema validator).
6. Confirm the theme does not flash on reload in either mode, and that the OG image renders in a LinkedIn/Telegram preview simulator.
7. Confirm A0: HTTPS valid, HTTP→HTTPS and www→apex redirects, HSTS header present.
8. Write QA-REPORT.md as the Part D checklist with ✅/❌ and evidence (scores, screenshots paths). Fix ❌ items you can fix in under 30 minutes; escalate the rest with a clear reproduction.
```

---

## PART D — ACCEPTANCE CHECKLIST

- [ ] `https://mamatmusayev.uz` loads with a valid certificate; HTTP and www redirect to it; HSTS set.
- [ ] Homepage renders all sections from A3 in EN, UZ, RU; language switch keeps the anchor.
- [ ] Every fact matches A2; no invented projects, dates or employer details; no phone number on the site.
- [ ] Light and dark themes both meet 4.5:1 contrast; no theme flash on reload.
- [ ] Lighthouse mobile ≥ 95 in Accessibility, Best Practices and SEO on all three pages; Performance recorded, not gated.
- [ ] First-load JS ≤ 8 KB; Three.js lazy and never fetched under reduced motion or Save-Data; no third-party scripts except optional Plausible/Umami.
- [ ] OG image, JSON-LD Person, hreflang, canonical, sitemap, robots present and valid.
- [ ] LinkedIn link preview shows title, description and image (test with LinkedIn Post Inspector).
- [ ] All external links open correctly with `rel="noopener"`; GitHub profile link fixed to `/in/mamatmusayev`.
- [ ] Posts and projects editable from the studio without touching a file; the settled content stays editable as JSON; README explains both; CI runs lint, build and test on push.
- [ ] No horizontal scroll at 360px; cards equal height; no clipped text at any breakpoint.
- [ ] Blog section, nav item and `/blog/` hide themselves when there are no published posts; a post added as Markdown appears with no code change.
- [ ] `/projects/` lists every repository; `/projects/<slug>/` exists only for projects with details or screenshots, in each language.
- [ ] `npm run studio` writes a post, a project and a screenshot that all survive `npm run build`; the studio never appears in `dist/`.
- [ ] ⌘K opens the console; `type:`, `stack:` and `year:` narrow the rows, and the background field follows the same query.
- [ ] `/data.json` is served, names the subject, and carries every record the console lists.
- [ ] The work chart draws one span per role on a real axis and shows the overlap; the written timeline reads on its own.
- [ ] `/cv/` renders in all three languages, prints to ≤ 2 A4 pages with no nav/footer/button, and every fact on it matches the homepage.
- [ ] `npm run build` and `npm run lint` pass with zero warnings; W3C HTML validator clean on all three pages.
- [ ] No hard-coded GitHub star counts or repo totals anywhere in content or markup.
- [ ] All UZ copy uses U+2018/U+2019 (`o‘`, `g‘`, `ma’lumot`); zero ASCII apostrophes and zero U+02BB/U+02BC in Uzbek content.
- [ ] Fonts are self-hosted — no request to `fonts.googleapis.com` or `fonts.gstatic.com` in the network log.
- [ ] `x-default` hreflang present; favicon set and 404 page ship.

---

### Notes for the owner

- The site should look like the LinkedIn profile's sibling, not a separate brand — same navy/teal, same portrait, same one-line positioning. When the LinkedIn headline changes, change `profile.json`.
- v2 candidates once v1 ships: an RSS feed and a `/talks` page if you start speaking at events. The blog and the CV are in v1.
