import { expect, Page, test } from '@playwright/test';

const studies = [
  { slug: 'event-driven', title: 'Event-driven document processing' },
  { slug: 'test-pipeline', title: 'Playwright tests from plain language' },
  { slug: 'live-chart', title: 'A real-time chart that runs anywhere' },
  { slug: 'identity', title: 'One sign-in across several apps' },
];

async function openDemo(page: Page, slug: string): Promise<void> {
  await page.goto(`/work/${slug}`);
  await page.locator('#h-demo').scrollIntoViewIfNeeded();
}

test('home rows link to every case study', async ({ page }) => {
  await page.goto('/');
  for (const s of studies) {
    await expect(page.getByRole('link', { name: s.title })).toHaveAttribute(
      'href',
      `/work/${s.slug}`,
    );
  }
  await page.getByRole('link', { name: studies[0].title }).click();
  await expect(page).toHaveURL(/\/work\/event-driven$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(studies[0].title);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  for (const s of studies) {
    test(`${s.slug} write-up and static demo fallback are readable`, async ({ page }) => {
      await page.goto(`/work/${s.slug}`);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(s.title);
      for (const h of ['Context', 'Problem', 'What I did', 'Result', 'Stack']) {
        await expect(page.getByRole('heading', { level: 2, name: h })).toBeVisible();
      }
      await expect(
        page.getByText('Static preview. The interactive version needs JavaScript.').first(),
      ).toBeVisible();
    });
  }
});

test.describe('event-driven simulator', () => {
  test('dead-letters failures when retries are off', async ({ page }) => {
    await openDemo(page, 'event-driven');
    const sim = page.locator('app-event-sim');
    await sim.getByRole('slider', { name: /Failure rate/ }).fill('40');
    await sim.getByLabel('Retry failed documents').uncheck();
    await sim.getByRole('slider', { name: /Consumers/ }).fill('6');
    await expect(sim.getByRole('img', { name: /6 consumers/ })).toBeVisible();
    const dead = sim.locator('dt', { hasText: 'Dead-lettered' }).locator('+ dd');
    await expect
      .poll(async () => Number(await dead.textContent()), { timeout: 10_000 })
      .toBeGreaterThan(0);
  });

  test('topic fans out and keeps publishing', async ({ page }) => {
    await openDemo(page, 'event-driven');
    const topic = page.locator('app-topic-fanout');
    const published = topic.getByText(/\d+ published/);
    const count = async () => Number((await published.textContent())!.split(' ')[0]);
    const first = await count();
    await expect.poll(count, { timeout: 5000 }).toBeGreaterThan(first);
    await expect(topic.getByText('Validation')).toBeVisible();
  });
});

test('test pipeline steps through all five phases', async ({ page }) => {
  await openDemo(page, 'test-pipeline');
  const demo = page.locator('app-test-pipeline');
  await expect(demo.getByRole('heading', { level: 3 })).toHaveText('Requirement analysis');
  await demo.getByRole('button', { name: 'Next phase' }).click();
  await expect(demo.getByRole('heading', { level: 3 })).toHaveText('Project mapping');
  await demo.getByRole('button', { name: /Automated script generation/ }).click();
  await expect(demo.locator('pre')).toContainText('TC-01');
  await expect(demo.getByRole('button', { name: 'Next phase' })).toBeDisabled();
});

test('SSO flow advances by click and restarts', async ({ page }) => {
  await openDemo(page, 'identity');
  const demo = page.locator('app-sequence-flow').first();
  await expect(demo.getByText('Step 1 of 8')).toBeVisible();
  for (let i = 0; i < 7; i++) await demo.getByRole('button', { name: 'Next step' }).click();
  await expect(demo.getByText('Signed in silently')).toBeVisible();
  await demo.getByRole('button', { name: 'Previous step' }).click();
  await expect(demo.getByText('Step 7 of 8')).toBeVisible();
  await demo.getByRole('button', { name: 'Next step' }).click();
  await demo.getByRole('button', { name: 'Start again' }).click();
  await expect(demo.getByText('Step 1 of 8')).toBeVisible();
});

test.describe('live chart element', () => {
  test('streams, and pauses from its own toolbar', async ({ page }) => {
    await openDemo(page, 'live-chart');
    const chart = page.locator('nehang-live-chart');
    await expect(chart.locator('canvas')).toBeVisible();
    const price = chart.locator('.price');
    const before = await price.textContent();
    await expect.poll(() => price.textContent(), { timeout: 5000 }).not.toBe(before);
    await chart.getByRole('button', { name: 'Pause' }).click();
    await expect(chart.getByRole('button', { name: 'Resume' })).toBeVisible();
    await expect(chart.locator('.change')).not.toHaveText(/^\+0\.00%/);
  });

  test('runs on a plain HTML page with no Angular app', async ({ page }) => {
    await page.goto('/work/live-chart/sandbox.html');
    // No Angular app on the page: the only Angular-rendered node is the element itself.
    await expect(page.locator('[ng-version]')).toHaveCount(1);
    await expect(page.locator('nehang-live-chart[ng-version]')).toHaveCount(1);
    const chart = page.locator('nehang-live-chart');
    await chart.getByRole('button', { name: 'Pause' }).click();
    await expect(page.locator('#log')).toHaveText('pausechange: paused is true');
  });

  test('SciChart panel reports a failed CDN load without breaking the page', async ({ page }) => {
    await page.route('https://cdn.jsdelivr.net/**', (route) => route.abort());
    await openDemo(page, 'live-chart');
    await page.getByRole('button', { name: 'Load high-performance demo' }).click();
    await expect(page.getByRole('alert')).toHaveText(/could not be loaded/);
    await expect(page.locator('nehang-live-chart canvas')).toBeVisible();
  });

  test('nothing is fetched from the SciChart CDN until asked', async ({ page }) => {
    const cdn: string[] = [];
    page.on('request', (r) => r.url().includes('cdn.jsdelivr.net') && cdn.push(r.url()));
    await openDemo(page, 'live-chart');
    await expect(page.locator('nehang-live-chart canvas')).toBeVisible();
    expect(cdn).toEqual([]);
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('simulators and the chart start paused', async ({ page }) => {
    await openDemo(page, 'event-driven');
    await expect(page.locator('app-event-sim').getByRole('button', { name: 'Play' })).toBeVisible();
    await expect(
      page.locator('app-topic-fanout').getByRole('button', { name: 'Play' }),
    ).toBeVisible();
    await openDemo(page, 'live-chart');
    await expect(
      page.locator('nehang-live-chart').getByRole('button', { name: 'Resume' }),
    ).toBeVisible();
  });
});

test('client credentials flow shows the real request, token and response at each step', async ({
  page,
}) => {
  await openDemo(page, 'identity');
  // The second diagram loads when it scrolls into view.
  await page
    .getByRole('heading', { name: 'Service to service: the client credentials flow' })
    .scrollIntoViewIfNeeded();
  const flow = page.locator('app-sequence-flow').nth(1);
  await expect(flow.getByText('Step 1 of 5')).toBeVisible();
  await expect(flow.locator('pre')).toContainText('grant_type=client_credentials');
  await flow.getByRole('button', { name: 'Next step' }).click();
  await expect(flow.locator('pre')).toContainText('"token_type": "Bearer"');
  for (let i = 0; i < 2; i++) await flow.getByRole('button', { name: 'Next step' }).click();
  await expect(flow.getByText('Check the signature')).toBeVisible();
  await expect(flow.locator('pre')).toContainText('"aud": "orders-api"');
  // The two diagrams on the page keep separate arrowheads.
  const markerIds = await page
    .locator('app-sequence-flow marker')
    .evaluateAll((ms) => ms.map((m) => m.id));
  expect(new Set(markerIds).size).toBe(markerIds.length);
});

test('about lists the résumé projects and links the ones with case studies', async ({ page }) => {
  await page.goto('/about');
  const section = page.locator('section', {
    has: page.getByRole('heading', { level: 2, name: 'Projects' }),
  });
  await expect(section.getByRole('heading', { level: 3 })).toHaveCount(9);
  await expect(section.getByText('Electronic document system')).toBeVisible();
  await section
    .getByRole('link', { name: 'Read the case study about Financial charts dashboard' })
    .click();
  await expect(page).toHaveURL(/\/work\/live-chart$/);
});
