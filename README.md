# nehang.is-a.dev

Personal portfolio of Nehang Shah. Angular 22 (standalone, signals, zoneless), prerendered to static HTML with no runtime server.

## Requirements

Node 24.15 or newer (see `.nvmrc`). Angular 22 refuses to run on older versions.

## Commands

| Command | What it does |
|---|---|
| `npm start` | Dev server at http://localhost:4200 |
| `npm run build` | Static build into `dist/portfolio/browser` (also writes `404.html`) |
| `npm test` | Unit tests (Vitest) |
| `npx playwright install chromium` | One-time browser download for e2e |
| `npm run e2e` | Playwright + axe against the static build. Run `npm run build` first |
| `npm run serve:dist` | Serve the static build at http://localhost:4300 |

## Updating content

All copy lives in `src/content/`. Components hold no copy.

- `profile.ts`: name, links, email (stored reversed), résumé path
- `experience.ts`: timeline and education
- `work.ts`: the selected-work rows
- `pages.ts`: page copy, SEO titles and descriptions, and simulation labels

Search for `TODO(nehang)` to find what still needs your input.

## Layout

```
src/app/core     theme, media-query signals, SEO title strategy
src/app/ui       lane (section) primitive
src/app/pages    home, about, colophon, not-found
src/app/demos    queue-sim (model, canvas renderer, component, static diagram)
src/content      all copy
src/styles       tokens.css, base.css
e2e              Playwright specs
docs/design.md   design tokens and the reasoning behind them
```
