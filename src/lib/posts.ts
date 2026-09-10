import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from './i18n';

export type Post = CollectionEntry<'posts'>;

/** Published posts for one language, newest first. Drafts never ship. */
export async function getPosts(locale: Locale): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => !data.draft && data.lang === locale);
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** The blog hides itself entirely when a language has nothing published (SPEC A3.8). */
export async function hasPosts(locale: Locale): Promise<boolean> {
  return (await getPosts(locale)).length > 0;
}
