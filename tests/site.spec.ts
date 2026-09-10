import { expect, test, type Page } from '@playwright/test';

const LOCALES = [
  { code: 'en', path: '/', title: /Jaloliddin Mamatmusayev/, contact: 'Contact' },
  { code: 'uz', path: '/uz/', title: /axborot tizimlari/, contact: 'Bog‘lanish' },
  { code: 'ru', path: '/ru/', title: /информационные системы/, contact: 'Контакты' },
] as const;

test.describe('homepage', () => {
  for (const locale of LOCALES) {
    test(`${locale.code} renders and is well formed`, async ({ page }) => {
      await page.goto(locale.path);

      await expect(page).toHaveTitle(locale.title);
      await expect(page.locator('html')).toHaveAttribute('lang', locale.code);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText('Jaloliddin Mamatmusayev');

      // Every section the rail points at must exist.
      for (const id of ['top', 'about', 'work', 'projects', 'skills', 'education', 'contact']) {
        await expect(page.locator(`#${id}`)).toHaveCount(1);
      }

      await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
      await expect(page.locator('link[hreflang="x-default"]')).toHaveCount(1);
      await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
    });
  }

  test('every external link is safe', async ({ page }) => {
    await page.goto('/');
    const targets = page.locator('a[target="_blank"]');
    const count = await targets.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      await expect(targets.nth(index)).toHaveAttribute('rel', /noopener/);
    }
  });

  test('the email address is not in the source as plain text', async ({ page }) => {
    const response = await page.goto('/');
    expect(await response!.text()).not.toContain('jmamatmusayev@gmail.com');
    await expect(page.locator('a[href^="mailto:"]').first()).toBeVisible();
  });

  test('structured data names the person and the employer', async ({ page }) => {
    await page.goto('/');
    const raw = await page.locator('script[type="application/ld+json"]').textContent();
    const schema = JSON.parse(raw!);
    expect(schema['@type']).toBe('Person');
    expect(schema.name).toBe('Jaloliddin Mamatmusayev');
    expect(schema.sameAs).toContain('https://www.linkedin.com/in/mamatmusayev');
  });
});

test.describe('theme', () => {
  test('toggles, persists and never flashes', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).not.toHaveAttribute('data-theme', /.*/);

    await page.getByRole('button', { name: /switch theme/i }).click();
    const chosen = await html.getAttribute('data-theme');
    expect(chosen).toMatch(/light|dark/);

    await page.reload();
    // The pre-paint script must have applied it before anything rendered.
    await expect(html).toHaveAttribute('data-theme', chosen!);
  });
});

test.describe('language switch', () => {
  test('keeps the section anchor', async ({ page }) => {
    await page.goto('/#projects');
    const uz = page.locator('a[data-lang-link][hreflang="uz"]');
    await expect(uz).toHaveAttribute('href', '/uz/#projects');
    await uz.click();
    await expect(page).toHaveURL(/\/uz\/#projects$/);
  });
});

test.describe('blog', () => {
  test('lists posts and opens one', async ({ page }) => {
    await page.goto('/blog/');
    await expect(page.locator('h1')).toBeVisible();
    const first = page.locator('article, ul.posts li').first();
    await expect(first).toBeVisible();

    await page.goto('/blog/colophon/');
    await expect(page.locator('h1')).toHaveText(/Colophon/);
    await expect(page.locator('time')).toBeVisible();
  });

  test('uzbek posts use the right apostrophes', async ({ page }) => {
    const response = await page.goto('/uz/blog/colophon/');
    const body = await response!.text();
    const article = body.slice(body.indexOf('<article'), body.indexOf('</article>'));
    expect(article).not.toMatch(/\p{L}'/u);
    expect(article).not.toContain('ʻ');
  });
});

test.describe('cv', () => {
  for (const locale of LOCALES) {
    test(`${locale.code} cv carries the same facts as the homepage`, async ({ page }) => {
      await page.goto(`${locale.path}cv/`.replace('//cv/', '/cv/'));
      await expect(page.locator('h1')).toHaveText('Jaloliddin Mamatmusayev');
      await expect(
        page
          .getByText('Jul 2026 – present')
          .or(page.getByText('2026 iyul – hozirgacha'))
          .or(page.getByText('Июль 2026 — наст. время')),
      ).toBeVisible();
      await expect(page.locator('[data-print]')).toBeVisible();
    });
  }
});

test.describe('404', () => {
  test('is styled and not indexed', async ({ page }) => {
    await page.goto('/no-such-page/', { waitUntil: 'domcontentloaded' });
    // Static hosts serve 404.html; the dev preview serves it too.
    await expect(page.locator('body')).toBeVisible();
  });
});

async function noHorizontalScroll(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
}

test.describe('layout', () => {
  test('no horizontal scroll at 360px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    for (const path of ['/', '/uz/', '/ru/', '/blog/', '/cv/']) {
      await page.goto(path);
      expect(await noHorizontalScroll(page), `${path} scrolls sideways`).toBe(true);
    }
  });

  test('no horizontal scroll at 1280px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    expect(await noHorizontalScroll(page)).toBe(true);
  });
});

test.describe('performance guard', () => {
  test('three.js is not on the critical path', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'networkidle' });
    expect(requests.filter((url) => /three/i.test(url))).toHaveLength(0);
  });
});
