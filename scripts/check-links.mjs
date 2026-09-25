// Checks every link in the static build.
//
//   npm run links            internal links and #anchors must resolve (fails the run if not);
//                            external links are fetched and reported as warnings
//
// Internal: "/about", "/work/x", "/#work", "resume.pdf" must map to a file in dist (the path,
// path/index.html, or path.html), and a #fragment must exist as an id on the target page.
// External: requested once each. Failures are warnings only, because sites such as LinkedIn
// refuse automated requests and a flaky network should not fail CI.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, posix } from 'node:path';

const DIST = 'dist/portfolio/browser';

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    return name.endsWith('.html') ? [full] : [];
  });
}

/** The file a URL path is served from, following the static host's clean-URL rules. */
function resolveFile(path) {
  const clean = decodeURIComponent(path).replace(/\/$/, '');
  for (const candidate of [clean, `${clean}/index.html`, `${clean}.html`]) {
    const full = join(DIST, candidate || 'index.html');
    if (existsSync(full) && statSync(full).isFile()) return full;
  }
  return null;
}

const idCache = new Map();
function idsIn(file) {
  if (!idCache.has(file)) {
    const html = readFileSync(file, 'utf8');
    idCache.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return idCache.get(file);
}

const errors = [];
const external = new Map(); // url -> first page that links to it
let checked = 0;

for (const file of htmlFiles(DIST)) {
  const page = '/' + file.slice(DIST.length + 1).replace(/\\/g, '/');
  const html = readFileSync(file, 'utf8');
  const base = /<base href="([^"]+)"/.exec(html)?.[1] ?? posix.dirname(page) + '/';
  for (const [, attr, raw] of html.matchAll(/\s(href|src)="([^"]*)"/g)) {
    const url = raw.replace(/&amp;/g, '&');
    if (!url || /^(mailto:|tel:|data:|javascript:)/.test(url)) continue;
    if (/^https?:\/\//.test(url)) {
      if (!external.has(url)) external.set(url, page);
      continue;
    }
    checked++;
    const [pathPart, fragment] = url.split('#');
    const target = pathPart ? posix.resolve(base, pathPart.split('?')[0]) : page;
    const targetFile = pathPart ? resolveFile(target) : file;
    if (!targetFile) {
      errors.push(`${page}: ${attr}="${url}" does not resolve to a file`);
      continue;
    }
    if (fragment && targetFile.endsWith('.html') && !idsIn(targetFile).has(fragment)) {
      errors.push(`${page}: ${attr}="${url}" points to #${fragment}, which is not on ${target}`);
    }
  }
}

console.log(`Checked ${checked} internal links across ${htmlFiles(DIST).length} pages.`);
if (errors.length) {
  console.error(`\n${errors.length} broken internal link(s):\n  ${errors.join('\n  ')}`);
}

// External links: report, don't fail.
const warnings = [];
await Promise.all(
  [...external].map(async ([url, page]) => {
    try {
      const res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(15_000),
        headers: { 'user-agent': 'Mozilla/5.0 (link check for nehang.is-a.dev)' },
      });
      if (!res.ok) warnings.push(`${url} (on ${page}) answered ${res.status}`);
    } catch (err) {
      warnings.push(`${url} (on ${page}) could not be reached: ${err.cause?.code ?? err.name}`);
    }
  }),
);
console.log(`Checked ${external.size} external links.`);
if (warnings.length) {
  console.warn(
    `\n${warnings.length} external link warning(s), not failing the run:\n  ${warnings.join('\n  ')}`,
  );
}

process.exit(errors.length ? 1 : 0);
