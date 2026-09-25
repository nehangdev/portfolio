// Renders the Open Graph images into public/og/ with Playwright.
// Run with `npm run og` after changing titles or outcomes, then commit the PNGs.
// Node 24 strips TypeScript types, so the content files are imported directly.
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { caseStudies } from '../src/content/case-studies.ts';
import { profile } from '../src/content/profile.ts';

const font =
  'data:font/woff2;base64,' + readFileSync('public/fonts/fira-code-latin.woff2').toString('base64');
const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const page = (title, lead) => `<!doctype html><html><head><style>
  @font-face { font-family: S; src: url('${font}') format('woff2'); font-weight: 300 700; }
  body { margin: 0; width: 1200px; height: 630px; background: #e7ecef; color: #16202e;
    font-family: S, sans-serif; display: flex; flex-direction: column; padding: 72px 80px; box-sizing: border-box; }
  .who { font-size: 24px; font-weight: 700; }
  .who span { font-weight: 400; color: #4a5868; }
  h1 { font-size: ${title.length > 30 ? 60 : 72}px; line-height: 1.05; letter-spacing: -0.02em; margin: auto 0 24px; font-weight: 700; max-width: 1000px; }
  p { font-size: 26px; line-height: 1.35; color: #4a5868; margin: 0; max-width: 960px; }
  .lane { display: flex; align-items: center; gap: 12px; margin-top: 48px; }
  .lane i { display: block; width: 56px; height: 26px; border-radius: 13px; background: #1f6f78; }
  .lane i.done { background: #d99a1e; }
  .lane b { flex: 1; height: 2px; background: #b9c3ca; }
</style></head><body>
  <div class="who">${escape(profile.name)} <span>${escape(profile.role)}</span></div>
  <h1>${escape(title)}</h1>
  <p>${escape(lead)}</p>
  <div class="lane"><i></i><i></i><i></i><i></i><b></b><i class="done"></i><i class="done"></i></div>
</body></html>`;

const images = [
  { name: 'default', title: profile.name, lead: profile.tagline },
  ...caseStudies.map((cs) => ({ name: cs.slug, title: cs.title, lead: cs.outcome })),
];

mkdirSync('public/og', { recursive: true });
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const img of images) {
  await tab.setContent(page(img.title, img.lead), { waitUntil: 'load' });
  await tab.evaluate(() => document.fonts.ready);
  await tab.screenshot({ path: `public/og/${img.name}.png` });
  console.log(`public/og/${img.name}.png`);
}
await browser.close();
