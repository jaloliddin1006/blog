# Content review

Every fact on the site, and where it came from. The rule from SPEC A2 was that the fact
sheet is the only source of truth: nothing here was invented, embellished or inferred.

## Used verbatim from SPEC A2

| Field                                       | Source                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------- |
| Name, title, organisation                   | A2 → Identity                                                             |
| Location, email, LinkedIn, GitHub, Telegram | A2 → Identity                                                             |
| Languages                                   | A2 → Identity                                                             |
| Hero lede                                   | A3.1 (the approved 60-word lede)                                          |
| "Now" strip                                 | A3.2, word for word                                                       |
| Five roles: periods and titles              | A2 → Career timeline, character for character                             |
| Role descriptions and CV bullets            | A2 → Role descriptions (split into bullets, not reworded)                 |
| Education                                   | A2 → Education                                                            |
| Eight certifications                        | A2 → Certifications, newest first                                         |
| Four skill groups                           | A2 → Skills, in the given display order                                   |
| Twelve repositories                         | A2 → Selected projects; the six marked `featured` are the six named in A2 |

## Written for this build

- **The About paragraphs** (`profile.about`). Drafted in A3.3 during the review and
  approved with the spec revision. They restate the career path and the day-to-day stack
  already in A2; they add no new claim.
- **Uzbek and Russian translations** of every field above. Technical terms — PostgreSQL,
  Django, RAG, pgvector, REST API, LLM — are left untranslated. Job titles follow the
  Uzbek and Russian conventions for a department head at a state committee.
- **Meta titles and descriptions** for each language: titles ≤ 60 characters,
  descriptions ≤ 155, checked.
- **One blog post**, "Colophon: how this site is built", in all three languages. It
  describes this repository and nothing else — no claim about the owner's work. Delete
  the three files if it is not wanted; the blog then hides itself.

## Deliberately left empty or absent

| Item                                      | Why                                                                                                                                          |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `certifications[].url`                    | A2 says to link each credential "where available"; no URLs were supplied. All are `null`, so no link renders. Fill them in and links appear. |
| `profile.links.source`                    | The site repository is not public yet, so the footer's "Source on GitHub" link is not rendered.                                              |
| GitHub star counts, "81 repositories"     | Removed during the spec review: they go stale and would break the fact-accuracy rule. Fetch them at build time if they are ever wanted.      |
| Phone number                              | A3.9 forbids it.                                                                                                                             |
| Anything about internal Committee systems | A2 forbids naming them; the work is described in prose only.                                                                                 |

## Things for the owner to fix outside this repository

- **The certificate on `mamatmusayev.uz`** — the site still serves a privacy/SSL warning,
  which is why LinkedIn cannot build a preview. Steps are in the README.
- **The LinkedIn link on the GitHub profile** points at `in/jaloliddinmamatmusayev`,
  which does not resolve. The correct slug is `in/mamatmusayev`.
- **Certification credential URLs**, if the certificates should link to Coursera.
