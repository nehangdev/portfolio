import { VERSION } from '@angular/core';

/** Per-route <title> and meta description. Home has no title prefix. */
export const seo = {
  home: {
    description:
      'Nehang Shah is a senior full-stack engineer in Ahmedabad, India, building .NET and Azure backends and Angular, React and Blazor front ends for B2B platforms. Open to relocation.',
  },
  about: {
    title: 'About',
    description:
      'Background, backend architecture, team leadership, and working with Angular from AngularJS 1.4 to Angular 16.',
  },
  colophon: {
    title: 'Colophon',
    description: 'How this site is built: Angular, static prerendering, signals, and tests.',
  },
  notFound: {
    title: 'Page not found',
    description: 'This page does not exist. The case studies and home page are linked from here.',
  },
};

export const nav = {
  skip: 'Skip to content',
  label: 'Main',
  links: [
    { label: 'Work', path: '/', fragment: 'work' },
    { label: 'About', path: '/about' },
    { label: 'Colophon', path: '/colophon' },
  ],
  themeToDark: 'Use dark theme',
  themeToLight: 'Use light theme',
  openMenu: 'Open menu',
  closeMenu: 'Close menu',
};

/** Logged once for anyone who opens the browser console. */
export const consoleGreeting = {
  title: 'Hello, fellow developer.',
  body: 'You opened the console, so you might like the source: every line of this site is public.',
};

export const footer = {
  github: 'GitHub profile',
  linkedin: 'LinkedIn profile',
  source: 'Source code of this site',
  location: 'Location',
};

export const home = {
  actions: { work: 'Read the case studies', resume: 'Download résumé' },
  intro: {
    heading: 'In short',
    /** The intro is shown as an editor file. See ui/markup-panel.ts. */
    editor: { file: 'in-short.html', tag: 'section', attrs: [['class', 'intro'], ['lang', 'en']] as [string, string][] },
    paragraphs: [
      'I have spent 8.5 years designing and building enterprise web applications end to end. On the backend that means .NET and Azure. On the front, Angular is my main tool, alongside React and Blazor WebAssembly and Server, with Umbraco and NopCommerce when a project needs a CMS or a commerce platform.',
      'Most of my recent work is on insurance and digital-marketplace platforms: event-driven processing on Azure Service Bus, single sign-on with Azure AD B2C, real-time dashboards, and test automation.',
      'I live in Ahmedabad, India, and I am open to relocating, with visa sponsorship.',
    ],
  },
  work: {
    heading: 'Selected work',
    stackLabel: 'Stack',
    note: 'Client work is described by domain. Every demo on this site uses synthetic data.',
  },
  timeline: { heading: 'Experience', branch: 'main', dateLabel: 'Date:' },
  howIWork: {
    heading: 'How I work',
    paragraphs: [
      'At Veloxcore I architect and lead end-to-end delivery, and I lead a sub-team of three. I run sprint planning, review code, mentor the developers on the team, and talk with client stakeholders directly.',
      'I own our Azure DevOps CI/CD, and introduced Docker-based builds so that every project deploys the same way.',
      'Testing is a large part of how I work. I wrote Selenium regression suites early on, and more recently built an internal framework that generates Playwright tests from plain-language scenarios.',
      'Day to day I work with AI tools such as GitHub Copilot and Claude Code, and pick the model to fit the task.',
    ],
  },
  contact: {
    heading: 'Contact',
    lead: 'Email is the quickest way to reach me.',
    emailLabel: 'Email',
    copy: 'Copy address',
    copied: 'Address copied',
    copyFailed: 'Could not copy. Select the address instead.',
    noScript: 'The email address is added by JavaScript to keep it away from scrapers. LinkedIn and GitHub work without it.',
    linkedin: 'LinkedIn',
    github: 'GitHub',
  },
};

export const hero = {
  result:
    'I moved a document pipeline from synchronous calls to Azure Service Bus. Throughput went up by about 40%.',
  caption:
    'Illustrative simulation with synthetic documents. It shows the idea, not the real system or its numbers.',
  modeGroup: 'Processing mode',
  modes: { sync: 'Synchronous', event: 'Event-driven' },
  pause: 'Pause',
  play: 'Play',
  rateUnit: 'documents per second',
  /** Short labels drawn inside the canvas. */
  canvasText: {
    incoming: 'Incoming',
    workers: (n: number) => (n === 1 ? '1 worker' : `${n} workers`),
    done: (n: number) => `${n} done`,
  },
  canvasLabel: {
    sync: 'Animation: documents arrive from the left and wait for a single worker, which handles one at a time. The queue keeps growing.',
    event:
      'Animation: documents arrive from the left into a queue that three workers consume in parallel. Failed documents are retried from the back of the queue.',
  },
  diagram: {
    label: 'Synchronous processing compared with event-driven processing',
    syncTitle: 'Synchronous',
    syncBody: 'One worker handles one document at a time. The rest wait.',
    eventTitle: 'Event-driven',
    eventBody: 'A queue feeds three workers in parallel. Failures go back on the queue and are retried.',
  },
};

export const about = {
  heading: 'About',
  sections: [
    {
      heading: 'Background',
      paragraphs: [
        'I am a senior full-stack engineer in Ahmedabad, India. For 8.5 years I have designed, built and architected enterprise web applications on .NET and Azure, with Angular, Blazor and React on the front end.',
        'Today I work at Veloxcore, where I architect and lead delivery of B2B platforms for insurance and digital-marketplace clients, using .NET 6–9, Angular 14–16, Blazor and Azure PaaS. I am open to relocating, with visa sponsorship.',
      ],
    },
    {
      heading: 'Backend and architecture',
      paragraphs: [
        'I designed event-driven processing pipelines on Azure Service Bus topics and subscriptions to replace synchronous flows, which improved throughput by about 40%. The same approach runs document ingestion for an insurance platform: hierarchical uploads, multi-level validation, and parallel processing that recovers from failures.',
        'My .NET work leans on CQRS, microservices, Entity Framework with the repository and unit-of-work patterns, and SQL Server, with Cosmos DB and Elastic Search where they fit.',
        'On identity, I set up Azure AD B2C single sign-on across several applications, and I have worked with IdentityServer 4, OAuth 2.0 and OpenID Connect. I also led an Umbraco 7 to 13 migration with centralised SSO, which reduced maintenance overhead.',
        'For a digital marketplace I led NopCommerce development with a custom plugin architecture, and integrated third-party payment and KYC services into onboarding.',
      ],
    },
    {
      heading: 'Angular, from v1.4 to today',
      paragraphs: [
        'I started with AngularJS 1.4 at Soham ERP Solutions, building full-stack HR, inventory and reporting modules, and carried that work forward to Angular 5.',
        'At Sufalam Solutions I built Angular single-page apps on ASP.NET Core APIs, including a laboratory information management system, and contributed to moving applications to Azure.',
        'At Veloxcore I have worked across Angular 14, 15 and 16. One project was a real-time financial charting dashboard whose modules we turned into Web Components, so a Blazor WebAssembly app could use them directly. I have used SciChart for real-time charting dashboards and Syncfusion components across projects.',
        'Angular is where I have gone deepest, but it is not the only front end I work in. I have also worked with React and Next.js, Blazor WebAssembly and Blazor Server, and Umbraco CMS.',
        `This site runs on Angular ${VERSION.major} with standalone components, signals, zoneless change detection and static prerendering. I built it that way on purpose, to show the framework as it is now rather than as it was when I started.`,
      ],
    },
    {
      heading: 'Leading a team',
      // TODO(nehang): add a sentence or two in your own words about how you run reviews or mentor.
      paragraphs: [
        'I lead a sub-team of three engineers. That covers sprint planning, code reviews, mentoring, and communication with client stakeholders.',
        'I own the Azure DevOps CI/CD pipelines and introduced Docker-based builds so every project deploys the same way.',
      ],
    },
    {
      heading: 'Testing and tooling',
      paragraphs: [
        'Early on I wrote Selenium regression suites for core ERP workflows, and C# console utilities for data migration and batch processing.',
        'More recently I built an AI-driven Playwright framework: reusable AI skills take a scenario description through a 10-phase pipeline, from requirement analysis and project mapping to test cases, page-object discovery and a generated script.',
      ],
    },
  ],
  education: { heading: 'Education' },
};

export const colophon = {
  heading: 'Colophon',
  lead: 'How this site is built, for anyone who wants to check the work.',
  sections: [
    {
      heading: 'Stack',
      items: [
        `Angular ${VERSION.full}, using standalone components, signals, and zoneless change detection.`,
        'Static prerendering with @angular/ssr. Every page is plain HTML at build time, and there is no server at runtime.',
        'RxJS drives the simulation on the home page, bridged to signals with toSignal.',
        'The simulations and the live chart are drawn by hand on a canvas, with no chart library.',
        'The live chart is a Web Component built with Angular Elements. The case study loads it the way any other site would, and a plain HTML sandbox page proves it needs no framework around it.',
        'Page changes use the browser’s View Transitions API through the Angular router. Motion animates steps inside two demos and is only downloaded with them.',
        'The SciChart panel loads SciChart’s free community edition from jsDelivr only when you press its button. That edition shows a watermark and sends SciChart anonymous usage data, including the page address.',
        'Tailwind CSS v4, with colours and type sizes defined as CSS custom properties.',
        'Fira Code for everything, self-hosted and limited to the Latin character set (36 KB). Icons are Tabler icons through ng-icons, and only the ones used are bundled.',
      ],
    },
    {
      heading: 'Quality',
      items: [
        'Pages work without JavaScript. Only interactive demos need it, and each has a static fallback.',
        'Every demo is downloaded only when it scrolls into view, so the home page stays small.',
        'Animation stops when your system asks for reduced motion, and the simulation pauses when the tab is hidden.',
        'Unit tests run on Vitest. End-to-end and accessibility checks run on Playwright with axe.',
        // TODO(phase 5): add Lighthouse CI scores and the CI badge here.
      ],
    },
    {
      heading: 'Design',
      items: [
        'The colours come from control-room consoles: a cool grey-blue ground, teal for messages in flight, amber for work done, and red only for failures.',
        'The page layout borrows its lanes from queue diagrams. Section headings sit in a narrow lane and content in a wide one.',
      ],
    },
  ],
  source: { heading: 'Source', text: 'The full source is public on GitHub.', link: 'View the repository' },
};

export const notFound = {
  heading: 'This page does not exist',
  body: 'The address may be mistyped, or the page may have moved. These might be what you were after:',
  terminal: {
    label: 'Terminal',
    prompt: 'nehang@portfolio:~$',
    error: (path: string) => `bash: cd: ${path}: No such file or directory`,
    listing: 'ls ~/work',
    pagesLabel: 'Pages you can open',
    home: 'cd ~',
    homeHint: 'home page',
  },
};
