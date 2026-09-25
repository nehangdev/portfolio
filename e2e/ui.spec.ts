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
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 375, height: 740 },
    });
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
  test('pressing a call to action draws a ripple', async ({ page, isMobile }) => {
    test.skip(isMobile, 'pointer press; the header icon button is checked on desktop');
    await page.goto('/');
    const cta = page.getByRole('link', { name: 'Read the case studies' });
    const box = (await cta.boundingBox())!;
    await page.mouse.move(box.x + 20, box.y + box.height / 2);
    await page.waitForTimeout(1500); // Motion loads after the page is interactive
    await page.mouse.down();
    await expect(page.locator('.cta-ripple')).toHaveCount(1);
    await page.mouse.up();
    await expect(page.locator('.cta-ripple')).toHaveCount(0, { timeout: 2000 });
  });

  test('the résumé is one click away in the header on every page', async ({ page }) => {
    await page.goto('/work/identity');
    const resume = page.locator('header').getByRole('link', { name: 'Download résumé' });
    await expect(resume).toBeVisible();
    await expect(resume).toHaveAttribute('href', '/resume.pdf');
    await expect(resume).toHaveAttribute('download', 'Nehang-Shah-Resume.pdf');
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

test('the email and its copy button share one line on a 360px phone', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 800 } });
  const page = await ctx.newPage();
  await page.goto('/');
  const email = page.locator('app-contact a[href^="mailto:"]');
  await email.scrollIntoViewIfNeeded();
  const copy = page.getByRole('button', { name: 'Copy address' });
  const [e, c] = [(await email.boundingBox())!, (await copy.boundingBox())!];
  expect(e.height).toBeLessThan(26); // one line of text
  expect(Math.abs(e.y + e.height / 2 - (c.y + c.height / 2))).toBeLessThan(6); // same row
  await ctx.close();
});

test('the command palette has one scrollbar: its list', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open command palette' }).click();
  const dialog = page.getByRole('dialog', { name: 'Command palette' });
  await expect(dialog).toBeVisible();
  const [scroll, client] = await dialog.evaluate((e) => [e.scrollHeight, e.clientHeight]);
  expect(scroll).toBeLessThanOrEqual(client);
});

test.describe('page transitions', () => {
  // Record how long each view transition takes, from start to finished.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __vt: number[]; __vtEnd: number[]; __vtStarted: boolean };
      w.__vt = [];
      w.__vtEnd = [];
      w.__vtStarted = false;
      const orig = document.startViewTransition?.bind(document);
      if (!orig) return;
      document.startViewTransition = ((arg: Parameters<typeof orig>[0]) => {
        const start = performance.now();
        w.__vtStarted = true;
        const vt = orig(arg);
        vt.finished.then(() => {
          w.__vt.push(performance.now() - start);
          w.__vtEnd.push(performance.now());
        });
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
    const pressedAt = await page.evaluate(() => performance.now());
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => durations(page).then((d) => d.length)).toBe(1);
    // Measured from the key press: the animation (about 220ms) must not run on after it.
    // Rendering the new page can't be skipped, so this excludes time spent before the press.
    const endedAt = await page.evaluate(
      () => (window as unknown as { __vtEnd: number[] }).__vtEnd[0],
    );
    expect(endedAt - pressedAt).toBeLessThan(150);
  });
});

test.describe('developer touches', () => {
  test('In short reads as an editor file but screen readers get just the paragraphs', async ({
    page,
  }) => {
    await page.goto('/');
    const panel = page.locator('app-markup-panel');
    await expect(panel.getByText('in-short.html')).toBeVisible();
    await expect(panel.locator('p')).toHaveCount(3);
    await expect(panel.locator('.editor-row[aria-hidden="true"]')).not.toHaveCount(0);
  });

  test('experience reads as git log: newest first, HEAD on the current role', async ({ page }) => {
    await page.goto('/');
    const titles = page.locator('.gitlog h3');
    await expect(titles.first()).toContainText('Senior Software Engineer');
    await expect(titles.last()).toContainText('Junior Software Developer');
    await expect(page.locator('.gitlog-item').first()).toContainText('HEAD');
    await expect(page.locator('.gitlog-gap h3')).toContainText('Career break');
  });

  test('the event-driven change is shown as a diff with +/- markers', async ({ page }) => {
    await page.goto('/work/event-driven');
    await expect(page.locator('.diff-del')).not.toHaveCount(0);
    await expect(page.locator('.diff-add')).not.toHaveCount(0);
    await expect(page.locator('.diff-add .diff-mark').first()).toHaveText('+');
    await expect(page.locator('.diff-del .diff-mark').first()).toHaveText('-');
  });

  test('case studies have a file-path breadcrumb', async ({ page }) => {
    await page.goto('/work/identity');
    const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(crumbs.locator('[aria-current="page"]')).toHaveText('identity.md');
    await crumbs.getByRole('link', { name: 'work' }).click();
    await expect(page).toHaveURL(/\/#work$/);
  });

  test('the 404 terminal echoes the missing path and lists real pages', async ({ page }) => {
    await page.goto('/nowhere/at-all');
    await expect(
      page.getByText('bash: cd: /nowhere/at-all: No such file or directory'),
    ).toBeVisible();
    const list = page.getByRole('list', { name: 'Pages you can open' });
    await list.getByRole('link', { name: 'live-chart/' }).click();
    await expect(page).toHaveURL(/\/work\/live-chart$/);
  });

  test('greets developers in the console', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', (m) => logs.push(m.text()));
    await page.goto('/');
    await expect.poll(() => logs.some((l) => l.includes('Hello, fellow developer.'))).toBe(true);
  });
});

test.describe('command palette', () => {
  test('opens with Ctrl+K, filters, and navigates with the keyboard', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'keyboard shortcut; the header button is tested below');
    await page.goto('/');
    await page.locator('body').press('Control+k');
    const dialog = page.getByRole('dialog', { name: 'Command palette' });
    await expect(dialog).toBeVisible();
    const input = dialog.getByRole('combobox', { name: 'Search pages and actions' });
    await expect(input).toBeFocused();
    await input.fill('chart');
    await expect(dialog.getByRole('option').first()).toHaveText(
      /A real-time chart that runs anywhere/,
    );
    await expect(dialog.getByRole('option').first()).toHaveAttribute('aria-selected', 'true');
    await input.press('Enter');
    await expect(page).toHaveURL(/\/work\/live-chart$/);
    await expect(dialog).toBeHidden();
  });

  test('arrow keys move the active option and Escape closes', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard');
    await page.goto('/about');
    await page.locator('body').press('Control+k');
    const dialog = page.getByRole('dialog', { name: 'Command palette' });
    const input = dialog.getByRole('combobox');
    await input.press('ArrowDown');
    await expect(dialog.getByRole('option').nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(input).toHaveAttribute('aria-activedescendant', /^cmd-/);
    await input.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('the header button opens it and actions run from it', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open command palette' }).click();
    const dialog = page.getByRole('dialog', { name: 'Command palette' });
    await dialog.getByRole('combobox').fill('dark');
    await dialog.getByRole('option', { name: /Switch to dark theme/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(dialog).toBeHidden();
  });

  test('says so when nothing matches', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open command palette' }).click();
    const dialog = page.getByRole('dialog', { name: 'Command palette' });
    await dialog.getByRole('combobox').fill('zzzz');
    await expect(dialog.getByRole('option')).toHaveCount(0);
    await expect(dialog.getByText('Nothing matches.')).toBeVisible();
  });

  test('its code is not downloaded until it is opened', async ({ page }) => {
    const loaded: string[] = [];
    page.on('response', (r) => loaded.push(r.url()));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const before = loaded.length;
    await page.getByRole('button', { name: 'Open command palette' }).click();
    await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible();
    expect(loaded.length).toBeGreaterThan(before);
  });
});

test('the colophon shows the build log with sizes, tests and Lighthouse scores', async ({
  page,
}) => {
  await page.goto('/colophon');
  await expect(page.getByRole('heading', { level: 2, name: 'Build log' })).toBeVisible();
  await expect(page.getByText(/pages prerendered to static HTML/)).toBeVisible();
  await expect(page.getByText('Home page, all JavaScript once idle')).toBeVisible();
  const table = page.getByRole('table', { name: 'Lighthouse scores, mobile' });
  await expect(table.getByRole('columnheader', { name: 'Accessibility' })).toBeVisible();
  await expect(table.getByRole('rowheader', { name: '/', exact: true })).toBeVisible();
});

test.describe('back to top', () => {
  test('is hidden at the top, appears after scrolling, and returns to the top', async ({
    page,
  }) => {
    await page.goto('/about');
    const button = page.getByRole('link', { name: 'Back to top' });
    await expect(button).toBeHidden();
    await page.mouse.wheel(0, 2500);
    await expect(button).toBeVisible();
    await button.click();
    await expect.poll(() => page.evaluate(() => scrollY), { timeout: 5000 }).toBe(0);
    await expect(page.locator('main')).toBeFocused();
  });

  test('rests just above the footer at the end of the page', async ({ page }) => {
    await page.goto('/about');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const button = page.getByRole('link', { name: 'Back to top' });
    await expect(button).toBeVisible();
    const b = (await button.boundingBox())!;
    const footer = (await page.locator('footer').boundingBox())!;
    expect(b.y + b.height).toBeLessThanOrEqual(footer.y + 1);
  });
});

test.describe('motion polish', () => {
  /**
   * How long the scroll takes to travel, in ms: from the first frame that moved to the first
   * frame at its final position. A jump is one frame; a glide takes hundreds of ms. Measured in
   * time, not frame counts, so a busy machine dropping frames doesn't make it flaky.
   */
  async function travelTime(
    page: import('@playwright/test').Page,
    action: () => Promise<void>,
    ms = 2500,
  ) {
    await page.evaluate((ms) => {
      const w = window as unknown as { __trace: [number, number][] };
      w.__trace = [];
      const t0 = performance.now();
      const tick = () => {
        const t = performance.now() - t0;
        w.__trace.push([t, scrollY]);
        if (t < ms) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, ms);
    await action();
    await page.waitForTimeout(ms + 100);
    const trace = await page.evaluate(
      () => (window as unknown as { __trace: [number, number][] }).__trace,
    );
    const [, startY] = trace[0];
    const endY = trace.at(-1)![1];
    const moved = trace.find(([, y]) => y !== startY)?.[0] ?? 0;
    const arrived = trace.find(([, y]) => y === endY)?.[0] ?? 0;
    return { endY, duration: arrived - moved };
  }

  test('back to top glides instead of jumping', async ({ page }) => {
    await page.goto('/about');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const { endY, duration } = await travelTime(page, () =>
      page.getByRole('link', { name: 'Back to top' }).click(),
    );
    expect(endY).toBe(0);
    expect(duration).toBeGreaterThan(400);
  });

  test('same-page #links glide to their section, below the sticky header', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'the Work link is in the phone menu; same code path');
    await page.goto('/');
    const { duration } = await travelTime(page, () =>
      page.locator('header').getByRole('link', { name: 'Work', exact: true }).click(),
    );
    expect(duration).toBeGreaterThan(300);
    const top = await page.locator('#work').evaluate((el) => el.getBoundingClientRect().top);
    expect(Math.round(top)).toBe(80);
  });

  test('normal navigation still starts at the top, instantly', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, 1500));
    await page.goto('/about');
    await page.locator('footer').getByRole('link', { name: 'GitHub profile' }).waitFor();
    expect(await page.evaluate(() => scrollY)).toBe(0);
  });

  test('hovers ease with the shared timing token', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop nav');
    await page.goto('/');
    const link = page.locator('header nav').getByRole('link', { name: 'About' });
    const duration = await link.evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(duration.split(', ')[0]).toBe('0.15s');
  });

  test('the palette highlight glides to the active option', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard');
    await page.goto('/');
    await page.locator('body').press('Control+k');
    const dialog = page.getByRole('dialog', { name: 'Command palette' });
    await dialog.getByRole('combobox').press('ArrowDown');
    await expect
      .poll(async () => {
        const bar = await dialog.locator('.palette-indicator').evaluate((el) => el.style.translate);
        const option = await dialog
          .getByRole('option')
          .nth(1)
          .evaluate((el) => el.offsetTop);
        return bar === `0px ${option}px`;
      })
      .toBe(true);
  });

  test('the whole selected-work row opens its case study', async ({ page }) => {
    await page.goto('/');
    // Click the outcome text by position, as a person would: the title's link covers the row.
    const outcome = page.getByText('Replaced synchronous flows with Azure Service Bus', {
      exact: false,
    });
    await outcome.scrollIntoViewIfNeeded();
    const box = (await outcome.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page).toHaveURL(/\/work\/event-driven$/);
  });

  test('blocks below the fold reveal when reached, and a jump never leaves them hidden', async ({
    page,
  }) => {
    await page.goto('/about');
    const pending = page.locator('.reveal-pending');
    await expect.poll(() => pending.count()).toBeGreaterThan(0);
    await page.keyboard.press('End');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(pending).toHaveCount(0);
  });

  test('build-log numbers count up to their real values', async ({ page }) => {
    await page.goto('/colophon');
    const first = page.locator('[appcountup]').first();
    const final = (await first.textContent())!.trim();
    await first.scrollIntoViewIfNeeded();
    await expect(first).toHaveText(final, { timeout: 3000 });
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('nothing is hidden for a reveal and back to top jumps', async ({ page }) => {
      await page.goto('/about');
      await expect(page.locator('.reveal-pending')).toHaveCount(0);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.getByRole('link', { name: 'Back to top' }).click();
      await expect.poll(() => page.evaluate(() => scrollY), { timeout: 500 }).toBe(0);
    });
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('no content waits for a reveal', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('.reveal-pending')).toHaveCount(0);
  });
});
