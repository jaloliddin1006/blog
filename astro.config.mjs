// @ts-check
import { resolve } from 'node:path';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwind from '@tailwindcss/vite';

/**
 * Content lives in data/site.db, which the build reads through a plain module
 * import. Vite caches that module, so a save in the studio would otherwise not
 * show up until the dev server was restarted by hand. This watches the file and
 * restarts the server itself — content edits are rare enough that the second it
 * costs is cheaper than wondering why the page did not change.
 */
function contentDatabase() {
  const file = resolve('data/site.db');
  return {
    name: 'site-db-watcher',
    apply: 'serve',
    configureServer(server) {
      server.watcher.add(file);
      let pending;
      const changed = (path) => {
        if (resolve(path) !== file) return;
        // SQLite touches the file more than once per write; settle first.
        clearTimeout(pending);
        pending = setTimeout(() => {
          server.config.logger.info('content database changed — reloading');
          server.restart();
        }, 250);
      };
      server.watcher.on('change', changed);
      server.watcher.on('add', changed);
    },
  };
}

export default defineConfig({
  site: 'https://mamatmusayev.uz',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', uz: 'uz-UZ', ru: 'ru-RU' },
      },
    }),
  ],
  vite: { plugins: [tailwind(), contentDatabase()] },
});
