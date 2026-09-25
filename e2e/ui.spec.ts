import { expect, test } from '@playwright/test';

test('header stays pinned while scrolling', async ({ page }) => {
  await page.goto('/about');
  await page.mouse.wheel(0, 1500);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(500);
  const box = await page.locator('header.site-header').boundingBox();
  expect(box?.y).toBe(0);
});

test('anchor links land below the sticky header', async ({ page, isMobile }) => {
  await page.goto('/about');
  if (isMobile) {
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.locator('#mobile-nav').getByRole('link', { name: 'Work' }).click();
  } else {
    await page.locator('header').getByRole('link', { name: 'Work', exact: true }).click();
  }
  await expect(page).toHaveURL(/\/#work$/);
  const heading = page.getByRole('heading', { level: 2, name: 'Selected work' });
  await expect(heading).toBeInViewport();
  await expect
    .poll(async () => {
      const header = await page.locator('header.site-header').boundingBox();
      const h = await heading.boundingBox();
      return (h?.y ?? 0) - ((header?.y ?? 0) + (header?.height ?? 0));
    })
    .toBeGreaterThanOrEqual(0);
});

test.describe('phone menu', () => {
  test.use({ viewport: { width: 375, height: 740 } });

  test('opens, navigates and closes', async ({ page }) => {
    await page.goto('/');
    const menu = page.locator('#mobile-nav');
    await expect(menu).toBeHidden();
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(menu).toBeVisible();
    await menu.getByRole('link', { name: 'About' }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(menu).toBeHidden();
  });

  test('works without JavaScript (native popover)', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 740 } });
    const page = await context.newPage();
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(page.locator('#mobile-nav')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#mobile-nav')).toBeHidden();
    await context.close();
  });
});

test('icon-only controls all have accessible names', async ({ page }) => {
  await page.goto('/');
  for (const name of ['GitHub profile', 'LinkedIn profile', 'Source code of this site']) {
    await expect(page.getByRole('link', { name })).toBeVisible();
  }
  await expect(page.getByRole('button', { name: 'Copy address' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Use (dark|light) theme/ })).toBeVisible();
});

test('theme toggle switches to dark and remembers it', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Use dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('button', { name: 'Use light theme' })).toBeVisible();
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(0, 0, 0)');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('site text is set in Fira Code', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const family = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  expect(family).toMatch(/^"?Fira Code"?/);
  expect(await page.evaluate(() => document.fonts.check('16px "Fira Code"'))).toBe(true);
});

test.describe('call-to-action motion', () => {
  test('plays the one-time attention cue on the primary button', async ({ page, isMobile }) => {
    test.skip(isMobile, 'cue is the same on mobile; checked once');
    await page.goto('/');
    const cta = page.getByRole('link', { name: 'Read the case studies' });
    // Motion writes an inline transform while the cue plays.
    await expect.poll(() => cta.evaluate((el) => (el as HTMLElement).style.transform), { timeout: 4000 }).toMatch(/scale/);
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('stays still', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(2500);
      const cta = page.getByRole('link', { name: 'Read the case studies' });
      expect(await cta.evaluate((el) => (el as HTMLElement).style.transform)).toBe('');
    });
  });
});

test.describe('page transitions', () => {
  // Record how long each view transition takes, from start to finished.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __vt: number[]; __vtStarted: boolean };
      w.__vt = [];
      w.__vtStarted = false;
      const orig = document.startViewTransition?.bind(document);
      if (!orig) return;
      document.startViewTransition = ((arg: Parameters<typeof orig>[0]) => {
        const start = performance.now();
        w.__vtStarted = true;
        const vt = orig(arg);
        vt.finished.then(() => w.__vt.push(performance.now() - start));
        return vt;
      }) as typeof document.startViewTransition;
    });
  });

  const durations = (page: import('@playwright/test').Page) =>
    page.evaluate(() => (window as unknown as { __vt: number[] }).__vt);

  test('finish on their own in well under half a second', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Event-driven document processing' }).click();
    await expect.poll(() => durations(page).then((d) => d.length)).toBe(1);
    expect((await durations(page))[0]).toBeLessThan(400);
  });

  test('end as soon as the visitor interacts', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Event-driven document processing' }).click();
    await page.waitForFunction(() => (window as unknown as { __vtStarted: boolean }).__vtStarted);
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => durations(page).then((d) => d.length)).toBe(1);
    // The un-interrupted transition runs about 220ms; interrupted, it ends almost at once.
    expect((await durations(page))[0]).toBeLessThan(150);
  });
});
