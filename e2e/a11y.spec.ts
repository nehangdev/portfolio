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

test('keyboard: every page can be tabbed through, and every stop shows a focus ring', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'keyboard test');
  test.setTimeout(120_000);
  const problems: string[] = [];
  for (const route of routes) {
    await page.goto(route);
    // Load every deferred demo so its controls are walked too.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => window.scrollTo(0, 0));

    const seen = new Set<string>();
    for (let i = 0; i < 250; i++) {
      await page.keyboard.press('Tab');
      const stop = await page.evaluate(() => {
        // Look inside Web Components' shadow roots for the element that really has focus.
        let el = document.activeElement as HTMLElement | null;
        while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement as HTMLElement;
        if (!el || el === document.body) return null;
        const hasRing = (n: Element) => {
          const s = getComputedStyle(n);
          return (
            (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== 'none'
          );
        };
        // Selected-work rows draw the ring around the whole row, not the link inside it.
        const row = el.closest('.work-row');
        const ring = hasRing(el) || (row !== null && hasRing(row));
        const id = `${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 40)}"`;
        return { key: el.outerHTML.slice(0, 200), id, ring };
      });
      // Back at the start (or out of the page): the whole page has been walked.
      if (!stop || seen.has(stop.key)) break;
      seen.add(stop.key);
      if (!stop.ring) problems.push(`${route}: ${stop.id} has no visible focus`);
    }
    if (seen.size < 3) problems.push(`${route}: only ${seen.size} tab stops`);
  }
  expect(problems).toEqual([]);
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
