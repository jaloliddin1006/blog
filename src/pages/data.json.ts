import type { APIRoute } from 'astro';
import { certifications, education, experience, profile, projects, skills } from '../lib/content';
import { buildRecords, postRecords } from '../lib/dataset';
import { getPosts } from '../lib/posts';
import { LOCALES } from '../lib/i18n';

/**
 * The site publishes the dataset it is generated from. It is what the query
 * console reads, and it is a real, citable endpoint — a person who runs
 * statistical information systems should not ask anyone to scrape his page.
 */
export const GET: APIRoute = async () => {
  const records = buildRecords();
  for (const locale of LOCALES) {
    records.push(...postRecords(await getPosts(locale), locale));
  }

  const body = {
    $schema: 'https://mamatmusayev.uz/data.json',
    generated: new Date().toISOString().slice(0, 10),
    locales: LOCALES,
    subject: {
      name: profile.name,
      title: profile.title,
      org: profile.orgFull,
      location: profile.location,
      links: profile.links,
    },
    counts: {
      records: records.length,
      roles: experience.length,
      projects: projects.length,
      skills: skills.reduce((total, group) => total + group.items.length, 0),
      certifications: certifications.length,
      education: education.length,
    },
    experience: experience.map(({ id, start, end, role, period, summary }) => ({
      id,
      start,
      end,
      role,
      period,
      summary,
    })),
    projects: projects.map(({ slug, name, repo, demo, stack, featured, description }) => ({
      slug,
      name,
      repo,
      demo,
      stack,
      featured,
      description,
    })),
    skills,
    certifications,
    education,
    records,
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
};
