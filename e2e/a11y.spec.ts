import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = [
  '/',
  '/work/event-driven',
  '/work/test-pipeline',
  '/work/live-chart',
  '/work/identity',
  '/work/live-chart/sandbox.html',
  '/about',
  '/colophon',
  '/404',
];

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} theme`, () => {
    test.use({ colorScheme: scheme });

    for (const route of routes) {
      test(`${route} has no axe violations`, async ({ page }) => {
        await page.goto(route);
        // Scroll through so every deferred demo loads and is checked too.
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(300);
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze();
        expect(
          results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`),
        ).toEqual([]);
      });
    }
  });
}

test('every route has one h1, a main landmark and a unique title', async ({ page }) => {
  const titles = new Set<string>();
  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    titles.add(await page.title());
  }
  expect(titles.size).toBe(routes.length);
});

test('skip link moves focus to main content', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard test');
  await page.goto('/about');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await expect(page).toHaveURL(/\/about#main$/);
});
