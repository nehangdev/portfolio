# Portfolio Build Plan: Nehang Shah

This is the full brief for the portfolio. Read it end to end before writing code. When something is ambiguous, ask instead of guessing.

**Revision 2 (2026-09-25).** Changes from revision 1:
- Repositioned from frontend to full stack.
- Opened the audience to global opportunities.
- Added the web component, SciChart and animation decisions.
- Added the Vercel Hobby (free tier) constraints.
- Resolved all open questions.
- Phases 1–3 are done.

---

## 1. Goal and audience

**Goal:** a fast, distinctive, statically hosted portfolio that proves senior full-stack skill by *being* a piece of engineering, not by listing skills. It will be served at `nehang.is-a.dev`.

**Audience:** hiring managers and senior engineers at product companies worldwide. The site isn't tied to one country. I'm open to relocating with visa sponsorship. They skim for 30–60 seconds, then open one or two case studies if something catches their eye.

**What they should conclude:** "This person designs and builds whole systems: .NET and Azure backends (event-driven, CQRS, SSO), serious Angular/TypeScript front ends, and the CI/CD and testing around them."

---

## 2. Source of truth: facts from my CV

Use **only** these facts. Do not invent metrics, clients, testimonials, or projects. If a section needs content that isn't here, leave a clearly marked `TODO(nehang)` placeholder.

- **Name:** Nehang Shah
- **Title:** Senior Full-Stack Engineer (.NET, Azure, Angular)
- **Location:** Ahmedabad, India. Open to relocating (visa sponsorship required). Don't name a specific country on the site.
- **Experience:** 8.5+ years designing, building and architecting enterprise web applications on .NET and Azure, with Angular, Blazor and React on the front end.
- **Angular:** v1.4 (AngularJS) through v16. Working knowledge of React and Next.js.

**Veloxcore Pvt. Ltd.: Senior Software Engineer (Nov 2021 – present)**
- Architects and leads end-to-end delivery of enterprise B2B platforms (.NET 6–9, Angular 14–16, Blazor, Azure PaaS) for insurance and digital-marketplace domains.
- Designed event-driven pipelines on Azure Service Bus (topics and subscriptions), replacing synchronous flows. Throughput improved by **about 40%**.
- Real-time financial charting dashboard in Angular 14. Modules were converted into reusable Web Components integrated with Blazor WebAssembly.
- Led the Umbraco 7 → 13 migration with centralised SSO, reducing maintenance overhead.
- Azure AD B2C SSO across several applications. Third-party payment and KYC integrations for a digital marketplace.
- Owns Azure DevOps CI/CD and introduced Docker-based builds to standardise deployments.
- Leads a sub-team of 3: sprint planning, code reviews, mentoring, client stakeholder communication.
- Internal AI-driven Playwright framework: reusable AI skills take a scenario description through a 10-phase pipeline. Named phases include requirement analysis, project mapping, manual test-case generation, POM/fixture discovery, and automated script generation.

**Sufalam Solutions Pvt. Ltd.: Software Developer (Jul 2020 – Apr 2021)**
- RESTful APIs in ASP.NET Core with Angular SPA front ends.
- Contributed to Azure cloud adoption, improving performance and deployment reliability.
- SQL Server design and optimisation, including a Laboratory Information Management System (sample tracking, test workflows, report generation).

**Soham ERP Solutions Pvt. Ltd.: Junior Software Developer (May 2018 – Jun 2020)**
- Full-stack ERP modules (HR, inventory, reporting) on .NET Framework Web API and Angular v1.4–v5, including an electronic document system for batch manufacturing records.
- Complex SQL Server queries, views and stored procedures.
- C# console utilities for data migration and batch processing.
- Selenium regression suites for core ERP workflows.

**Career break:** May 2021 – Oct 2021. Show it plainly on the timeline, without explanation.

**Projects:**
- Insurance and Agents B2B Platform: hierarchical uploads, multi-level validation workflows, parallel processing on Azure Service Bus for scalable, fault-tolerant ingestion.
- Digital Marketplace and LMS: NopCommerce marketplace with a custom plugin architecture, Azure AD B2C SSO, and KYC/payment integrations in onboarding.

**Education:** M.Sc. Information Technology (2019), B.Sc. Computer Science (2017), Sardar Patel University.

**Skills (reference only, not a skill-bar section):**
- **Backend:** C#, ASP.NET Core, ASP.NET MVC, Web API, VB.NET, Node.js, Entity Framework, repository and unit of work, SOLID, CQRS, microservices, REST
- **Frontend:** TypeScript, Angular, RxJS, React, Next.js, Blazor WASM/Server, Web Components, Tailwind, Bootstrap
- **Cloud and DevOps:** Azure App Services, Functions, Service Bus (topics and subscriptions), Key Vault, Cosmos DB, Azure DevOps, Docker
- **Data:** SQL Server, Elastic Search
- **Identity:** Azure AD / B2C, IdentityServer 4, OAuth 2.0, OIDC
- **Testing:** Playwright, Selenium, Page Object Model
- **Charts and UI kits:** SciChart (real-time dashboards), Syncfusion
- **Other:** Umbraco, NopCommerce, ABP Framework
- **AI tooling:** GitHub Copilot, Claude Code

**Public contact:** `nehangshah.dev@outlook.com` (obfuscated), `linkedin.com/in/nehangshah`, `github.com/nehangdev`. **Never** the phone number.

---

## 3. Hard constraints

### is-a.dev compatibility
- Software-development related and **non-commercial**. No services, no pricing, no "hire my company".
- Complete and reachable before the PR: no "coming soon", no lorem ipsum, no broken links.
- Custom domain on Vercel, so HTTPS is automatic.

### Vercel Hobby (free tier)
- **Static output only.** No serverless or edge functions, no middleware, no ISR, no image optimisation, no `@vercel/og`. OG images are generated at build time as static files.
- Stay well inside Hobby limits: keep total assets small, and heavy third-party code must not be served from Vercel (see SciChart, §7.3).
- Hobby is for personal, non-commercial use, which matches this site.
- The heavy CI work (Playwright, Lighthouse) runs in GitHub Actions, not in Vercel builds. Vercel runs only `npm run build`.

### Privacy and confidentiality
- Never publish the phone number.
- Obfuscate the email in the HTML (assembled at runtime, with a copy button).
- No client names, screenshots of client systems, or real data. All demos use synthetic data and are labelled "simulation" or "recreation".
- The public `resume.pdf` is a global version with no phone number and no country-specific relocation line.

### Quality floor
- Lighthouse ≥ 95 in all four categories (mobile), enforced in CI.
- WCAG 2.2 AA. `prefers-reduced-motion` respected everywhere: every animation has a static or paused state.
- Home initial JS ≤ 150 KB gzipped. Every demo is lazy-loaded.
- Responsive from 360px. Light and dark themes with a manual toggle.
- All content works without JavaScript. Only demos need JS, and each has a static fallback.

---

## 4. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Angular, latest stable (22.x at time of writing). Standalone components, signals, zoneless, `@if`/`@for`/`@defer` | Kept current from v1.4 to today |
| Rendering | Static prerendering via `@angular/ssr`, `outputMode: static` | Fits Vercel Hobby: plain files, no functions |
| Reactive streams | RxJS for simulations, bridged to signals with `toSignal` | RxJS depth plus signals interop |
| Web Components | Angular Elements: `<nehang-live-chart>`, used on this site only (not published to npm) | Mirrors the real Web Components → Blazor work |
| Styling | Tailwind CSS v4 with CSS custom-property tokens | |
| Charts | Hand-written canvas for the web component. SciChart.js only as an opt-in panel, loaded from a CDN on click (§7.3) | Fundamentals, plus a nod to real production tooling at zero bundle cost |
| Motion | Built-in first: router view transitions and Angular `animate.enter`/`animate.leave`. **Motion** (motion.dev, MIT) only inside demos, lazy-loaded | Meaningful animation without weight |
| Content | Typed TS data files (`src/content/*.ts`), plus Markdown for case-study prose | |
| Testing | Vitest unit tests; Playwright e2e with `@axe-core/playwright` and visual snapshots | |
| CI/CD | GitHub Actions: lint → unit → build → Playwright → Lighthouse CI | |
| Hosting | Vercel Hobby, static | |

No backend, database, API keys, or runtime LLM calls. The backend skill is shown through simulations, architecture diagrams and C# code samples in the case studies.

---

## 5. Concept: "The site is a message bus"

Unchanged. The hero queue simulation (synchronous vs event-driven) is the one memorable thing. It is also a backend story, which suits the full-stack positioning. Tokens and the reasoning behind them are in `docs/design.md`.

Motion principle, unchanged: animation exists to explain a system or answer a user action. No scroll-triggered entrance effects.

---

## 6. Information architecture

```
/                     Home: hero simulation, intro, selected work, timeline, how I work, contact
/work/event-driven    Case study: sync → Service Bus topics and subscriptions, CQRS (interactive simulator)
/work/test-pipeline   Case study: AI-assisted Playwright framework (step-through demo)
/work/live-chart      Case study: real-time chart → Web Component (live element, plus optional SciChart panel)
/work/identity        Case study: SSO with Azure AD B2C across apps, plus the Umbraco 7 → 13 migration
/work/live-chart/sandbox.html   The element on a plain HTML page, no Angular around it
/about                Background, architecture and leadership, Angular v1.4 → today
/colophon             How this site is built
/resume.pdf           Global CV without phone number (TODO(nehang))
/404                  Useful 404
```

---

## 7. Case studies

Structure: **Context → Problem → What I did → Result → Stack → Interactive demo**, 400–700 words each. Demos use `@defer (on viewport)` and have static fallbacks.

### 7.1 Event-driven document processing (the backend showcase)
- The full simulator, with controls for message rate, consumers, failure rate, the retry toggle and a dead-letter queue.
- **Topics and subscriptions view:** one document published to a topic fans out to several subscriptions (for example validation, indexing, notification), each with its own consumers.
- The idea behind hierarchical uploads with multi-level validation, using synthetic document types.
- A short **C# sample**, written fresh and generic (not client code), showing a Service Bus processor with retries and dead-lettering. Include a CQRS note on the command/query split.
- Result: throughput about 40% higher.

### 7.2 AI-assisted Playwright test generation
- A step-through visualiser. A plain-language scenario goes in, and artefacts come out.
- Build it on the **five named phases**: requirement analysis → project mapping → manual test-case generation → POM/fixture discovery → automated script generation. All step data lives in `src/content/pipeline-steps.ts`, so the other five phases can be added later.
- Pre-computed, hand-written example against a fictional app, labelled as a recreation.
- Motion animates each artefact's transition between steps.

### 7.3 Real-time chart → Web Component
- `<nehang-live-chart>` via Angular Elements.
  - Hand-written canvas streaming line chart fed by an RxJS stream of synthetic ticks.
  - Pause/resume, time-window selection, crosshair tooltip.
  - A documented API: attributes and properties in, DOM events out, theming through CSS custom properties and `::part`.
- It's built as a separate bundle. The case-study page uses **the element**, not the Angular component. `sandbox.html` loads it with no Angular app.
- Show the 3-line usage snippet and the API table.
- **Optional SciChart panel ("Load high-performance demo"):**
  - Loaded only on click, from jsDelivr (`scichart@6`, WASM via `loadWasmFromCDN`). No npm dependency, zero bundle impact, and no Vercel bandwidth used.
  - Uses the community licence (non-commercial, personal). The watermark stays. Telemetry is disclosed on the Colophon.
  - The major-version CDN pin picks up fresh builds, which avoids the community build's 6-month expiry. If the load fails, the panel says so and the rest of the page is unaffected.
  - Shows something the hand-written chart deliberately doesn't try to do, such as many series or very high point counts.
  - The copy states that SciChart was used in real-time production dashboards.
  - `TODO(nehang)`: optionally confirm with SciChart that portfolio use fits the community licence.

### 7.4 SSO across applications (Azure AD B2C)
- A step-by-step sequence diagram in inline SVG: user → app A → B2C → token → app B signs in silently. It includes the Umbraco 7 → 13 migration with centralised SSO.
- Steps advance on click or keyboard. Motion animates the token moving along each arrow. With reduced motion, the step changes instantly.

### Site-wide motion
- The router's view transitions, including a shared-element morph from a Selected-work row title to the case-study heading. It's built in, adds no extra download, and is skipped under reduced motion.
- Angular `animate.enter`/`animate.leave` for demo panels opening and closing.

---

## 8. Repository structure

```
src/app/{core,ui,pages,demos}   src/content   src/elements (Angular Elements entry)   src/styles
public/   e2e/   docs/{design.md,portfolio-plan.md}   .github/workflows/ci.yml   README.md
```

---

## 9. SEO and sharing
- A unique title and description per route. Canonical URLs on `nehang.is-a.dev`.
- OG and Twitter cards, with a **build-time static** OG image per case study.
- JSON-LD `Person` on home: name, jobTitle "Senior Full-Stack Engineer", url, sameAs LinkedIn and GitHub.
- `sitemap.xml` and `robots.txt`.

---

## 10. Build phases

**Phase 1: Foundation** ✅ done
**Phase 2: Home + content pages** ✅ done (content updated to full stack in revision 2)
**Phase 3: Hero queue simulation** ✅ done

**Phase 4: Case studies + demos** ✅ done
- The four case-study pages and demos (§7), lazy-loaded with static fallbacks.
- The Angular Elements build and `sandbox.html`.
- Motion is added as a dependency and used only inside demo chunks.
- View transitions.
- ✅ Home JS still ≤ 150 KB gzipped, and each case-study route passes Lighthouse ≥ 95 with the SciChart panel not loaded. Each demo has a Playwright test.

**Phase 4.5: UI refinements** ✅ done (requested after Phase 4)
- Sticky header. On phones, the links move into a native `popover` menu that works without JavaScript. Anchor links land below the header.
- Fira Code for all text, self-hosted, with the type scale retuned for a monospace face. This replaces Schibsted Grotesk.
- Tabler icons via `@ng-icons` (tree-shaken) replace text labels for email, copy, LinkedIn, GitHub, source, location, theme, menu and play/pause. Every icon-only control has an accessible name.
- Motion on the hero buttons: one attention cue after load, a magnetic hover, a press spring and icon nudges. Motion is lazy-loaded, and all of it is skipped under reduced motion.
- True-black OLED dark theme.
- Extras: a scroll-driven header divider and reading-progress line, a header that stays put during view transitions, and `theme-color` metadata.
- ✅ Home JS is 99 KB gzipped initially and 134 KB once everything has loaded at idle (limit 150). Lighthouse is ≥ 96 on mobile. 98 e2e tests pass.

**Phase 4.6: Developer touches** ✅ done
- "In short" as an editor file; Prism syntax colouring on code samples; the career timeline as `git log`; a before/after diff on the event-driven study; a file-path breadcrumb on case studies; a terminal-style 404; a console greeting.
- Also added afterwards:
  - **Ctrl+K / Cmd+K command palette**: a native `<dialog>` with the combobox/listbox pattern, lazy-loaded (2 KB) and reachable from a header button on phones.
  - **The Colophon's build log**: real sizes, test counts and Lighthouse medians, written by `npm run report`, stamped with the date and commit, and readable without JavaScript. Phase 5 CI should regenerate or verify it.
- Declined: a VS Code-style status bar (permanent chrome).
- From the global résumé (2026-09-25):
  - a Projects section on About listing all nine key projects, in the résumé's wording, linked to their case studies;
  - a client-credentials sequence demo on the identity case study (the IdentityServer 4 service-to-service work), with the HTTP requests and decoded token at each step;
  - the crypto trading dashboards added to the live-chart case study;
  - WCF, Microsoft Copilot, MCP and agentic AI added to About.
  - No demos for projects where the role was project management, or where a demo would need invented details.
- ✅ 114 e2e tests pass. Lighthouse on mobile scores ≥ 95 (home at 95–96, the thinnest margin).

**Phase 5: Quality + CI** ✅ done
- Built:
  - GitHub Actions CI on every push and pull request: formatting (Prettier), `npm run report` (build, unit, e2e, axe, screenshot tests, Lighthouse median of 3, JavaScript budget), and `npm run links`;
  - a CI badge on the Colophon.
- Decisions, made with Nehang after the first CI runs:
  - **Lighthouse performance is a warning in CI, not a gate.** GitHub's shared runners score the same commit 93–96; paint times match, only CPU-bound blocking time moves. Accessibility, best practices and SEO stay hard gates at 95, and performance is still a hard gate for local `npm run report` (96–98 there).
  - **Screenshot baselines are Linux-only,** made by the "Visual baselines" workflow; visual tests run in CI only.
  - **Vercel deploys `main` by itself,** independent of CI. `vercel.json` serves the site as static files with real 404s: the Angular preset had been answering unknown paths with the home page and a 200.
- Playwright e2e, axe on every route, visual snapshots (light/dark, mobile/desktop), Lighthouse CI and a link checker in GitHub Actions.
- ✅ CI is green, and the README explains everything.

**Phase 6: Deploy + domain**
- Deploy to Vercel Hobby as a static site (framework preset: Angular; output `dist/portfolio/browser`). Verify the `*.vercel.app` URL.
- Prepare `docs/is-a-dev.md`.
- ✅ The pre-launch checklist passes.

---

## 11. is-a.dev registration (prepare, I'll submit)

`domains/nehang.json`:

```json
{
  "owner": { "username": "nehangdev", "email": "nehangshah.dev@outlook.com" },
  "records": { "CNAME": "cname.vercel-dns.com" }
}
```

Check first that `nehang` is free. Fill in the PR template honestly, with the `*.vercel.app` preview URL. After merge, add the custom domain in Vercel and redeploy.

---

## 12. Pre-launch checklist
- [ ] No phone number anywhere (grep the build output)
- [ ] No client names, no services or pricing
- [ ] Every fact traceable to §2
- [ ] All links work
- [ ] Lighthouse ≥ 95 in all four categories on mobile (home and one case study)
- [ ] Keyboard-only walkthrough of every page and demo
- [ ] Reduced motion: every animation stops or shows its fallback
- [ ] JS disabled: all text is readable
- [ ] `resume.pdf` is the global version without a phone number
- [ ] SciChart panel: the watermark is visible, and a failed CDN load is handled

---

## 13. Optional later
- Japanese language toggle (review by a fluent speaker required).
- A "Notes" section for technical write-ups.
- Publishing `<nehang-live-chart>` to npm (decided against for now: site only).

## Resolved questions
1. GitHub `nehangdev`; subdomain `nehang`.
2. Pipeline: build on the five named phases; add the rest later.
3. Photo: none.
4. Repo public, linked from the Colophon.
5. Positioning: Senior Full-Stack Engineer, open to relocation globally.
6. SciChart: used in real-time dashboards; Syncfusion used across projects.
