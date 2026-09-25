# nehang.is-a.dev

Personal portfolio of Nehang Shah. Angular 22 (standalone, signals, zoneless), prerendered to static HTML with no runtime server.

## Requirements

Node 24.15 or newer (see `.nvmrc`). Angular 22 refuses to run on older versions.

## Commands

| Command | What it does |
|---|---|
| `npm start` | Dev server at http://localhost:4200 (builds the chart element first) |
| `npm run build` | Builds the `<nehang-live-chart>` element into `public/elements`, then the static site into `dist/portfolio/browser` (also writes `404.html`) |
| `npm run build:element` | Builds only the Web Component |
| `npm run og` | Regenerates the share images in `public/og` after titles change. Commit the PNGs |
| `npm run report` | Builds, measures sizes, runs unit and e2e tests and Lighthouse, then writes `src/content/build-report.ts` for the Colophon's build log. Commit the result |
| `npm test` | Unit tests (Vitest) |
| `npx playwright install chromium` | One-time browser download for e2e |
| `npm run e2e` | Playwright + axe against the static build. Run `npm run build` first |
| `npm run serve:dist` | Serve the static build at http://localhost:4300 |
| `npm run links` | Checks every internal link and `#anchor` in the build (fails on broken ones) and reports external links |
| `npm run format` / `npm run format:check` | Prettier: fix or check formatting |

## Continuous integration

Every push to `main` and every pull request runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

1. `npm run format:check`
2. `npm run report`:
   - build;
   - unit tests;
   - end-to-end, accessibility (axe) and screenshot tests on desktop and mobile;
   - Lighthouse on mobile (median of 3 runs; every category must be at least 95);
   - the home-page JavaScript budget (150 KB gzipped).
3. `npm run links`

The Lighthouse reports are uploaded as artifacts. Failed tests also upload their screenshots and diffs.

- **Lighthouse:** accessibility, best practices and SEO below 95 fail the run. In CI, performance below 95 is a warning only, because GitHub's shared runners score the same commit anywhere from 93 to 96. Locally it's still a hard gate.
- **Deployment:** Vercel deploys every push to `main` by itself, whether or not CI passes.

**Screenshot baselines** live in `e2e/visual.spec.ts-snapshots/`. They are Linux-only, so the visual tests run in CI and are skipped locally. After an intended visual change, run **Actions > Visual baselines > Run workflow** on GitHub; it regenerates the screenshots and commits them.

## Updating content

All copy lives in `src/content/`. Components hold no copy.

- `profile.ts`: name, links, email (stored reversed), résumé path
- `experience.ts`: timeline and education
- `pages.ts`: page copy, SEO titles and descriptions, and hero simulation labels
- `case-studies.ts`: titles, outcomes and stack tags (home rows, routes, share images)
- `case-study-bodies.ts`: the Context / Problem / What I did / Result write-ups
- `demos.ts`: labels and copy for the case-study demos
- `pipeline-steps.ts`: the test-pipeline recreation (five phases so far)

Search for `TODO(nehang)` to find what still needs your input.

## Layout

```
src/app/core     theme, media-query signals, SEO title strategy
src/app/ui       lane (section) primitive
src/app/pages    home, case-study, about, colophon, not-found
src/app/demos    queue-sim, event-sim (+ topic fan-out), test-pipeline, live-chart host + SciChart panel, sso-flow
src/elements     <nehang-live-chart>: Angular Elements Web Component, built separately
scripts/og.mjs   build-time Open Graph images
src/content      all copy
src/styles       tokens.css, base.css
e2e              Playwright specs
docs/design.md   design tokens and the reasoning behind them
```
