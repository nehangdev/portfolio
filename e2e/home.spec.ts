import { expect, test } from '@playwright/test';

test.describe('hero simulation', () => {
  test('loads, switches mode and pauses from the keyboard', async ({ page }) => {
    await page.goto('/');
    const sync = page.getByRole('button', { name: 'Synchronous' });
    const event = page.getByRole('button', { name: 'Event-driven' });
    await expect(sync).toHaveAttribute('aria-pressed', 'true');

    await event.focus();
    await page.keyboard.press('Enter');
    await expect(event).toHaveAttribute('aria-pressed', 'true');
    await expect(sync).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByRole('img', { name: /three workers/ })).toBeVisible();

    const pause = page.getByRole('button', { name: 'Pause' });
    await pause.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();

    // Paused: the counter stops changing.
    const rate = page.locator('output');
    const before = await rate.textContent();
    await page.waitForTimeout(600);
    expect(await rate.textContent()).toBe(before);
  });

  test('counter moves while running', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('output')).not.toHaveText('0.0', { timeout: 5000 });
  });

  test('does not shift the layout when the simulation replaces the placeholder', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Synchronous' }).waitFor();
    const cls = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let total = 0;
          new PerformanceObserver((list) => {
            for (const e of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
              if (!e.hadRecentInput) total += e.value;
            }
          }).observe({ type: 'layout-shift', buffered: true });
          setTimeout(() => resolve(total), 500);
        }),
    );
    expect(cls).toBeLessThan(0.02);
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('shows the static diagram instead of the animation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Synchronous processing compared with event-driven processing')).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(0);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('all home content is readable', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Nehang Shah' })).toBeVisible();
    for (const heading of ['In short', 'Selected work', 'Experience', 'How I work', 'Contact']) {
      await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible();
    }
    await expect(page.getByText('Career break')).toBeVisible();
    await expect(page.getByText('Synchronous processing compared with event-driven processing')).toBeVisible();
  });
});

test('email is assembled in the browser, not present in the HTML', async ({ page, request }) => {
  const html = await (await request.get('/')).text();
  expect(html).not.toContain('mailto:');
  await page.goto('/');
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(1);
});

test('no phone number in any page', async ({ request }) => {
  for (const route of ['/', '/about', '/colophon', '/404']) {
    const html = await (await request.get(route)).text();
    expect(html).not.toMatch(/\+91|tel:|\b\d{5}[\s-]?\d{5}\b/);
  }
});

test('the résumé is published, is a PDF, and downloads with a clear filename', async ({ page, request }) => {
  const res = await request.get('/resume.pdf');
  expect(res.status()).toBe(200);
  expect((await res.body()).subarray(0, 5).toString()).toBe('%PDF-');
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Download résumé' })).toHaveAttribute('download', 'Nehang-Shah-Resume.pdf');
});
