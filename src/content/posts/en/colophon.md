---
title: 'Colophon: how this site is built'
date: 2026-09-10
lang: en
summary: 'A short note on the stack behind this site: Astro, self-hosted fonts, JSON content and static hosting.'
---

This site is deliberately small. It is a static build — no server, no database, no client-side framework — and everything it shows comes from a handful of files in the repository.

## The stack

- **Astro** builds the pages to plain HTML at deploy time. The only JavaScript that reaches the browser is a theme toggle, a language switch and a print button.
- **Tailwind CSS** styles it, but every colour comes from a small set of CSS custom properties so light and dark themes stay in sync.
- **IBM Plex** Serif, Sans and Mono are self-hosted and subset to Latin and Cyrillic. Nothing is requested from a font CDN.

## The content

Text lives in JSON files — profile, experience, projects, certifications, skills — each field carrying its English, Uzbek and Russian version. The CV page at `/cv/` is generated from exactly the same files as the homepage, so the two can never disagree with each other.

Posts like this one are Markdown files with a little frontmatter. Adding one is a file, a commit, and nothing else.

## Why it looks like this

Three languages, a portrait, a timeline, six repositories and a way to get in touch. Anything that would go stale — follower counts, star counts, progress bars — was left out on purpose.
