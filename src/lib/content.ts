import { z } from 'astro/zod';
import type { Locale } from './i18n';
import certificationsRaw from '../content/certifications.json';
import educationRaw from '../content/education.json';
import experienceRaw from '../content/experience.json';
import profileRaw from '../content/profile.json';
import projectsRaw from '../content/projects.json';
import skillsRaw from '../content/skills.json';

/**
 * Content lives in plain JSON so the owner can edit it without touching layout
 * (SPEC A5). It is validated here with zod, so a typo fails `npm run build`
 * instead of shipping. Markdown blog posts use an Astro content collection
 * (src/content.config.ts) because they need rendering.
 */
const l10n = <T extends z.ZodType>(inner: T) => z.object({ en: inner, uz: inner, ru: inner });
const text = z.string().min(1);
const l10nText = l10n(text);

const profileSchema = z.object({
  name: text,
  wordmark: text,
  photo: text,
  email: z.email(),
  links: z.object({
    linkedin: z.url(),
    github: z.url(),
    telegram: z.url(),
    source: z.url().nullable(),
  }),
  title: l10nText,
  org: l10nText,
  orgFull: l10nText,
  location: l10nText,
  lede: l10nText,
  about: l10n(z.array(text).min(1)),
  languages: l10nText,
  now: l10n(z.array(z.object({ label: text, value: text })).length(3)),
});

const experienceSchema = z.array(
  z.object({
    id: text,
    /** Real dates, so the work history can be drawn on a time axis. */
    start: z.string().regex(/^\d{4}-\d{2}$/, 'YYYY-MM'),
    end: z
      .string()
      .regex(/^\d{4}-\d{2}$/, 'YYYY-MM')
      .nullable(),
    current: z.boolean().optional(),
    secondary: z.boolean().optional(),
    org: l10nText.optional(),
    period: l10nText,
    role: l10nText,
    summary: l10nText,
    bullets: l10n(z.array(text).min(1)),
  }),
);

const projectsSchema = z.array(
  z.object({
    /** URL segment for /projects/<slug>/ — must be unique. */
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'lowercase words joined by hyphens'),
    name: text,
    repo: z.url(),
    demo: z.url().nullable().optional(),
    featured: z.boolean(),
    license: text.optional(),
    stack: z.array(text).min(1).max(3),
    /** One line for the card. */
    description: l10nText,
    /** Paragraphs for the detail page; empty until they are written. */
    details: l10n(z.array(text)),
    screenshots: z.array(
      z.object({
        /** Base name under public/projects/<slug>/, without extension. */
        file: text,
        alt: l10nText,
        caption: l10nText.optional(),
      }),
    ),
  }),
);

const skillsSchema = z.array(z.object({ id: text, label: l10nText, items: z.array(text).min(1) }));

const educationSchema = z.array(
  z.object({
    id: text,
    period: l10nText,
    degree: l10nText,
    school: l10nText,
    note: l10nText.optional(),
  }),
);

const certificationsSchema = z.array(
  z.object({
    name: text,
    issuer: text,
    date: l10nText,
    url: z.url().nullable(),
  }),
);

function parse<T extends z.ZodType>(schema: T, data: unknown, file: string): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid content in ${file}:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export const profile = parse(profileSchema, profileRaw, 'content/profile.json');
export const experience = parse(experienceSchema, experienceRaw, 'content/experience.json');
export const projects = parse(projectsSchema, projectsRaw, 'content/projects.json');
export const skills = parse(skillsSchema, skillsRaw, 'content/skills.json');
export const education = parse(educationSchema, educationRaw, 'content/education.json');
export const certifications = parse(
  certificationsSchema,
  certificationsRaw,
  'content/certifications.json',
);

export const featuredProjects = projects.filter((project) => project.featured);

const duplicateSlug = projects
  .map((project) => project.slug)
  .find((slug, index, all) => all.indexOf(slug) !== index);
if (duplicateSlug) {
  throw new Error(`Duplicate project slug in content/projects.json: ${duplicateSlug}`);
}

export type Project = (typeof projects)[number];
export type ExperienceEntry = (typeof experience)[number];

/** A project earns a page of its own once there is something to put on it. */
export function hasProjectPage(project: Project, locale: Locale): boolean {
  return project.details[locale].length > 0 || project.screenshots.length > 0;
}
