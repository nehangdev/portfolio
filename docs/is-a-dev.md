# Registering nehang.is-a.dev

Checked on 2026-09-25: `domains/nehang.json` does not exist in [is-a-dev/register](https://github.com/is-a-dev/register) and no PR asks for it. (The name resolves in DNS, but so does any made-up name: is-a.dev has a wildcard.)

The site already uses `https://nehang.is-a.dev` for canonical URLs, the sitemap, `robots.txt` and the résumé, so nothing in the code changes when the domain goes live.

## 1. Add the domain in Vercel first

Vercel project → **Settings → Domains → Add** → `nehang.is-a.dev`.

Vercel will show it as "Invalid configuration" and list the records it wants. Because is-a.dev is a shared domain, it also asks for a **TXT record on `_vercel.nehang.is-a.dev`** to prove ownership. Copy both values exactly. is-a.dev's own Vercel guide warns they can differ per project.

## 2. Fork is-a-dev/register and add two files

Use the values Vercel showed you. The A record below is the one in is-a.dev's guide at the time of writing.

`domains/nehang.json`

```json
{
  "owner": {
    "username": "nehangdev",
    "email": "nehangshah.dev@outlook.com"
  },
  "records": {
    "A": ["216.198.79.1"]
  }
}
```

`domains/_vercel.nehang.json`

```json
{
  "owner": {
    "username": "nehangdev",
    "email": "nehangshah.dev@outlook.com"
  },
  "records": {
    "TXT": "vc-domain-verify=nehang.is-a.dev,PASTE-THE-VALUE-FROM-VERCEL"
  }
}
```

If Vercel offers a CNAME instead (`cname.vercel-dns.com` or a project-specific one), use `"CNAME": "<value>"` in place of the `A` array. A name can't have both.

## 3. Open the pull request

Open the PR from your fork (signed in as `nehangdev`). **Keep the template exactly as it is**, including its comments, or validation fails. Tick each box as `[x]` only when it's true:

- Terms of Service: read https://is-a.dev/terms first.
- Domain structure: two files in `domains/`, valid JSON.
- Website reachable and complete: it is.
- Software development related: a developer portfolio with case studies.
- Not commercial: no services, pricing or ads on the site.
- Contact info: the email in `owner`.
- Website link: below.

**Website preview**, between the markers: `https://portfolio-theta-peach-86.vercel.app/`

**Website purpose:** write one or two sentences in your own words. is-a.dev asks that requests are not written by AI, and reviewers reject ones that read that way.

Watch the PR. If a reviewer asks for changes, make them promptly, or the PR is closed.

## 4. After it's merged

- DNS goes live within minutes. Vercel verifies the domain on its own, and the Domains page turns green and issues the certificate.
- In Vercel → Domains, make `nehang.is-a.dev` the primary domain and set `portfolio-theta-peach-86.vercel.app` to **redirect** to it (308), so only one address is indexed.
- Open https://nehang.is-a.dev, check `/sitemap.xml` and a case study, and run `npm run links`.
