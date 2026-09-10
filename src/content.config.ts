import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

// SPEC A3.8 — a short blog: Markdown in, page out. No taxonomy, no pagination.
const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
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
