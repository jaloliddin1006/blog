import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { DB_PATH, openDb, readPosts } from './lib/db.mjs';

/**
 * Posts come from the content database rather than from files: they keep being
 * added, and the studio writes them there. The loader renders the Markdown body
 * at build time, so pages, feeds and the query console all read the same store.
 * In dev the database file is watched, so saving in the studio reloads the site.
 */
const posts = defineCollection({
  loader: {
    name: 'sqlite-posts',
    load: async ({ store, parseData, renderMarkdown, generateDigest, watcher, logger }) => {
      store.clear();

      const db = openDb({ readonly: true });
      const rows = readPosts(db, { includeDrafts: true });
      db.close();

      for (const row of rows) {
        const id = `${row.lang}/${row.slug}`;
        const data = await parseData({
          id,
          data: {
            title: row.title,
            date: row.date,
            lang: row.lang,
            summary: row.summary,
            draft: row.draft,
            ...(row.external ? { external: row.external } : {}),
          },
        });
        store.set({
          id,
          data,
          rendered: await renderMarkdown(row.body),
          digest: generateDigest(row),
        });
      }

      logger.info(`${rows.length} post(s) from the content database`);
      watcher?.add(DB_PATH);
    },
  },
  schema: z.object({
    title: z.string().min(1),
    date: z.coerce.date(),
    lang: z.enum(['en', 'uz', 'ru']),
    summary: z.string().max(155),
    draft: z.boolean().default(false),
    /** Set when the post is a stub pointing at the original on LinkedIn. */
    external: z.url().optional(),
  }),
});

export const collections = { posts };
