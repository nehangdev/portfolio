// Measures the built site and writes src/content/build-report.ts, which the Colophon shows as a
// build log. Every number is measured here, none are typed in by hand.
//
//   npm run report
//
// Steps: build, serve the static output, measure JS/CSS/font sizes, run the unit and e2e tests,
// run Lighthouse (mobile, median of 3) on two pages, write the report, then rebuild so the
// Colophon includes it. Refuses to write a report if any test fails.
//
// Quality gates (checked after the report is written; the run exits non-zero if any fails):
//   - every Lighthouse category's median score is at least 95
//   - the home page's JavaScript, all of it once idle, stays within the budget
// Full Lighthouse reports are saved to reports/lighthouse/ (CI uploads them).
import { execSync, spawn } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { chromium } from '@playwright/test';

const DIST = 'dist/portfolio/browser';
const PORT = 4300;
const ORIGIN = `http://localhost:${PORT}`;
const LIGHTHOUSE_PAGES = ['/', '/work/event-driven'];
const RUNS = 3;
const LIGHTHOUSE_FLOOR = 95;
const HOME_JS_BUDGET_KB = 150;
const LIGHTHOUSE_DIR = 'reports/lighthouse';

const sh = (cmd) =>
  execSync(cmd, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
const strip = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');
const kb = (bytes) => Math.round((bytes / 1024) * 10) / 10;
const gz = (path) => gzipSync(readFileSync(path)).length;
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const log = (msg) => console.log(`[report] ${msg}`);

/** Titles of failing specs in a Playwright JSON report. */
function failedSpecs(suite, trail = []) {
  const here = (suite.specs ?? [])
    .filter((spec) => !spec.ok)
    .map((spec) => [...trail, spec.title].filter(Boolean).join(' › '));
  return here.concat((suite.suites ?? []).flatMap((s) => failedSpecs(s, [...trail, s.title])));
}

// 1. Build
log('building');
const buildOut = strip(sh('npm run build'));
const routes = Number(/Prerendered (\d+) static routes/.exec(buildOut)?.[1] ?? 0);

// 2. Serve the static output
// One fixed command string (no outside input), so running it through the shell is safe.
const server = spawn(`npx serve ${DIST} -l ${PORT}`, { stdio: 'ignore', shell: true });
const stopServer = () => {
  if (process.platform === 'win32') {
    try {
      execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: 'ignore' });
    } catch {}
  } else server.kill();
};
process.on('exit', stopServer);
for (let i = 0; i < 60; i++) {
  try {
    await fetch(ORIGIN);
    break;
  } catch {
    await new Promise((r) => setTimeout(r, 500));
  }
}

let report;
try {
  // 3. Sizes (gzipped)
  log('measuring sizes');
  const indexHtml = readFileSync(`${DIST}/index.html`, 'utf8');
  const initialJs = [...indexHtml.matchAll(/(?:src|href)="([^"]+\.js)"/g)].map((m) => m[1]);
  const homeInitialJs = kb(initialJs.reduce((n, f) => n + gz(`${DIST}/${f}`), 0));
  const css = kb(
    readdirSync(DIST)
      .filter((f) => f.endsWith('.css'))
      .reduce((n, f) => n + gz(`${DIST}/${f}`), 0),
  );
  const font = kb(statSync('public/fonts/fira-code-latin.woff2').size);
  const elementJs = kb(gz('public/elements/live-chart.js'));

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const loaded = new Set();
  page.on('response', (r) => r.url().endsWith('.js') && loaded.add(new URL(r.url()).pathname));
  await page.goto(`${ORIGIN}/`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2500);
  await browser.close();
  const homeAllJs = kb([...loaded].reduce((n, f) => n + gz(`${DIST}${f}`), 0));

  // 4. Unit tests
  log('running unit tests');
  const unitOut = strip(sh('npx ng test portfolio --watch=false'));
  const unitPassed = Number(/Tests\s+(\d+) passed/.exec(unitOut)?.[1] ?? 0);
  if (/failed/.test(/Tests\s+[^\n]*/.exec(unitOut)?.[0] ?? '')) {
    throw new Error('unit tests failed');
  }

  // 5. End-to-end tests (reuses the server above)
  log('running end-to-end tests');
  let e2eJson;
  try {
    e2eJson = sh('npx playwright test --reporter=json');
  } catch (err) {
    let failed = [];
    try {
      failed = failedSpecs(JSON.parse(err.stdout));
    } catch {}
    const detail = failed.join('\n  ') || strip(String(err.stdout ?? err)).slice(0, 2000);
    throw new Error(`e2e tests failed:\n  ${detail}`);
  }
  const stats = JSON.parse(e2eJson).stats;
  if (stats.unexpected > 0) throw new Error(`${stats.unexpected} e2e tests failed`);

  // 6. Lighthouse, mobile, median of 3 runs per page
  // Lighthouse drives the same Chromium that Playwright installed.
  process.env.CHROME_PATH = chromium.executablePath();
  mkdirSync(LIGHTHOUSE_DIR, { recursive: true });
  const lighthouse = [];
  for (const path of LIGHTHOUSE_PAGES) {
    const runs = [];
    const slug = path === '/' ? 'home' : path.slice(1).replaceAll('/', '-');
    for (let i = 0; i < RUNS; i++) {
      log(`lighthouse ${path} run ${i + 1}/${RUNS}`);
      const name = `${LIGHTHOUSE_DIR}/${slug}-run${i + 1}`;
      sh(
        `npx lighthouse "${ORIGIN}${path}" --quiet --output=json --output=html ` +
          `--output-path=${name} --only-categories=performance,accessibility,best-practices,seo ` +
          `--chrome-flags="--headless=new"`,
      );
      const c = JSON.parse(readFileSync(`${name}.report.json`, 'utf8')).categories;
      runs.push({
        performance: Math.round(c.performance.score * 100),
        accessibility: Math.round(c.accessibility.score * 100),
        bestPractices: Math.round(c['best-practices'].score * 100),
        seo: Math.round(c.seo.score * 100),
      });
    }
    lighthouse.push({
      path,
      performance: median(runs.map((r) => r.performance)),
      accessibility: median(runs.map((r) => r.accessibility)),
      bestPractices: median(runs.map((r) => r.bestPractices)),
      seo: median(runs.map((r) => r.seo)),
    });
  }

  // 7. Write the report
  report = {
    measuredOn: new Date().toISOString().slice(0, 10),
    commit: sh('git rev-parse --short HEAD').trim(),
    routes,
    sizes: { homeInitialJs, homeAllJs, budget: HOME_JS_BUDGET_KB, elementJs, css, font },
    unit: { passed: unitPassed },
    e2e: { passed: stats.expected, skipped: stats.skipped, flaky: stats.flaky },
    lighthouse,
  };
  writeFileSync(
    'src/content/build-report.ts',
    `// Generated by \`npm run report\` (scripts/build-report.mjs). Do not edit by hand.\n` +
      `// Sizes are KB gzipped (the font is already compressed).\n` +
      `export const buildReport = ${JSON.stringify(report, null, 2)};\n`,
  );
  log('wrote src/content/build-report.ts');
  console.log(report);
} finally {
  stopServer();
}

// 8. Rebuild so the Colophon includes the new numbers
log('rebuilding with the report');
sh('npm run build');

// 9. Quality gates
const failures = [];
for (const { path, ...scores } of report.lighthouse) {
  for (const [category, score] of Object.entries(scores)) {
    if (score < LIGHTHOUSE_FLOOR) {
      failures.push(`Lighthouse ${category} on ${path} is ${score}, below ${LIGHTHOUSE_FLOOR}`);
    }
  }
}
if (report.sizes.homeAllJs > HOME_JS_BUDGET_KB) {
  failures.push(
    `Home JavaScript is ${report.sizes.homeAllJs} KB, over the ${HOME_JS_BUDGET_KB} KB budget`,
  );
}
if (failures.length) {
  console.error(`\n[report] quality gates failed:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
log('all quality gates passed');
log('done');
