import { expect, test } from '@playwright/test';

// Screenshot comparisons of the first screen of each kind of page, in both themes, on desktop
// and mobile (the two Playwright projects). Font rendering differs between operating systems,
// so there is one set of baselines, made on Linux by the "Visual baselines" GitHub workflow,
// and these tests run in CI only. Reduced motion keeps every page still: the hero shows its
// static diagram, the chart starts paused, and the call-to-action cue does not play.

const pages = [
  { name: 'home', path: '/' },
  { name: 'case-study', path: '/work/event-driven' },
  { name: 'about', path: '/about' },
  { name: 'colophon', path: '/colophon' },
  { name: 'not-found', path: '/404' },
];

test.skip(!process.env['CI'], 'Visual baselines are Linux-only; these run in CI.');
test.use({ reducedMotion: 'reduce' });

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`visual, ${scheme}`, () => {
    test.use({ colorScheme: scheme });

    for (const { name, path } of pages) {
      test(`${name} matches its baseline`, async ({ page }) => {
        await page.goto(path);
        await page.evaluate(() => document.fonts.ready);
        await expect(page).toHaveScreenshot(`${name}-${scheme}.png`, {
          // Third-party images (the CI badge) can change without any change here.
          mask: [page.locator('img[src^="http"]')],
        });
      });
    }
  });
}
