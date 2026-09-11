import { certifications, education, experience, hasProjectPage, projects, skills } from './content';
import { localePath, type L10n, type Locale } from './i18n';

/**
 * Everything on this site as one flat list of records.
 *
 * The site is about the person who runs Uzbekistan's statistical information
 * systems, so it is built the way one would be: content first becomes a
 * dataset, and every surface — the page, the background field, the query
 * console, /data.json — is a view over that same dataset.
 */
export type RecordType = 'role' | 'project' | 'skill' | 'certification' | 'post' | 'education';

export interface SiteRecord {
  id: string;
  type: RecordType;
  /** What the record is called. */
  label: L10n<string>;
  /** One line of context under the label. */
  sub: L10n<string>;
  /** Terms the query console matches against, lowercase. */
  tags: string[];
  /** Anchor or page this record lives at, per locale. */
  href: Record<Locale, string>;
  /** Section id on the homepage, for the background field to key off. */
  section: string;
  /** Year the record belongs to, where it has one. */
  year?: number;
  external?: boolean;
}

const anchor = (section: string): Record<Locale, string> => ({
  en: `${localePath('en')}#${section}`,
  uz: `${localePath('uz')}#${section}`,
  ru: `${localePath('ru')}#${section}`,
});

const words = (...parts: string[]) => [
  ...new Set(
    parts
      .join(' ')
      .toLowerCase()
      .split(/[^\p{L}\p{N}+#.]+/u)
      .filter(Boolean),
  ),
];

export function buildRecords(): SiteRecord[] {
  const records: SiteRecord[] = [];

  for (const entry of experience) {
    records.push({
      id: `role:${entry.id}`,
      type: 'role',
      label: entry.role,
      sub: entry.period,
      tags: words(entry.role.en, entry.summary.en, entry.period.en),
      href: anchor('work'),
      section: 'work',
      year: Number(entry.start.slice(0, 4)),
    });
  }

  for (const project of projects) {
    records.push({
      id: `project:${project.slug}`,
      type: 'project',
      label: { en: project.name, uz: project.name, ru: project.name },
      sub: project.description,
      tags: words(project.name, project.stack.join(' '), project.description.en),
      href: {
        en: hasProjectPage(project, 'en')
          ? localePath('en', `projects/${project.slug}`)
          : project.repo,
        uz: hasProjectPage(project, 'uz')
          ? localePath('uz', `projects/${project.slug}`)
          : project.repo,
        ru: hasProjectPage(project, 'ru')
          ? localePath('ru', `projects/${project.slug}`)
          : project.repo,
      },
      section: 'projects',
      external: !hasProjectPage(project, 'en'),
    });
  }

  for (const group of skills) {
    for (const item of group.items) {
      records.push({
        id: `skill:${group.id}:${item.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        type: 'skill',
        label: { en: item, uz: item, ru: item },
        sub: group.label,
        tags: words(item, group.label.en),
        href: anchor('skills'),
        section: 'skills',
      });
    }
  }

  for (const certification of certifications) {
    records.push({
      id: `cert:${certification.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      type: 'certification',
      label: { en: certification.name, uz: certification.name, ru: certification.name },
      sub: { en: certification.issuer, uz: certification.issuer, ru: certification.issuer },
      tags: words(certification.name, certification.issuer),
      href: anchor('education'),
      section: 'education',
      year: Number(certification.date.en.match(/\d{4}/)?.[0]),
    });
  }

  for (const entry of education) {
    records.push({
      id: `education:${entry.id}`,
      type: 'education',
      label: entry.degree,
      sub: entry.school,
      tags: words(entry.degree.en, entry.school.en),
      href: anchor('education'),
      section: 'education',
      year: Number(entry.period.en.match(/\d{4}/)?.[0]),
    });
  }

  return records;
}

/** Posts are async, so they are folded in where a page can await them. */
export function postRecords(
  posts: { id: string; data: { title: string; summary: string; date: Date; external?: string } }[],
  locale: Locale,
): SiteRecord[] {
  return posts.map((post) => {
    const slug = post.id.split('/').pop() ?? post.id;
    const href = post.data.external ?? localePath(locale, `blog/${slug}`);
    return {
      id: `post:${locale}:${slug}`,
      type: 'post' as const,
      label: { en: post.data.title, uz: post.data.title, ru: post.data.title },
      sub: { en: post.data.summary, uz: post.data.summary, ru: post.data.summary },
      tags: words(post.data.title, post.data.summary),
      href: { en: href, uz: href, ru: href },
      section: 'blog',
      year: post.data.date.getUTCFullYear(),
      external: Boolean(post.data.external),
    };
  });
}

export const RECORD_TYPES: RecordType[] = [
  'role',
  'project',
  'skill',
  'certification',
  'education',
  'post',
];
