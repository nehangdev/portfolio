/** A paragraph, a bulleted list, or a code sample. */
export type Block = string | { list: string[] } | { code: string; lang: string; caption: string };

/** What the home page, routes and share images need. The article bodies live in case-study-bodies.ts. */
export interface CaseStudy {
  slug: 'event-driven' | 'test-pipeline' | 'live-chart' | 'identity';
  title: string;
  /** One sentence, used on the home page row and as the page lead. */
  outcome: string;
  description: string;
  stack: string[];
}

export interface CaseStudyBody {
  /** Context, Problem, What I did, Result. */
  sections: { heading: string; blocks: Block[] }[];
  demo: { heading: string; intro: string };
}

export const caseStudyText = {
  stackHeading: 'Stack',
  stackLabel: 'Stack',
  next: 'Next case study',
  all: 'All case studies',
  staticNote: 'Static preview. The interactive version needs JavaScript.',
};

export const caseStudies: CaseStudy[] = [
  {
    slug: 'event-driven',
    title: 'Event-driven document processing',
    outcome:
      'Replaced synchronous flows with Azure Service Bus topics and subscriptions. Throughput went up by about 40%.',
    description:
      'Case study: moving document processing from synchronous calls to Azure Service Bus topics and subscriptions, with an interactive queue simulator.',
    stack: ['Azure Service Bus', '.NET', 'CQRS', 'Angular'],
  },
  {
    slug: 'test-pipeline',
    title: 'Playwright tests from plain language',
    outcome:
      'An internal framework where a tester describes a scenario and a 10-phase pipeline writes the Playwright script.',
    description:
      'Case study: an AI-driven framework that turns a plain-language test scenario into a Playwright script, with a step-through recreation.',
    stack: ['Playwright', 'TypeScript', 'Page Object Model', 'AI skills'],
  },
  {
    slug: 'live-chart',
    title: 'A real-time chart that runs anywhere',
    outcome:
      'A streaming financial chart built in Angular 14, packaged as Web Components and reused inside a Blazor WebAssembly app.',
    description:
      'Case study: packaging Angular charting modules as Web Components for a Blazor WebAssembly app, with a live, framework-agnostic chart element.',
    stack: ['Angular', 'Angular Elements', 'RxJS', 'Web Components', 'Blazor WASM'],
  },
  {
    slug: 'identity',
    title: 'One sign-in across several apps',
    outcome:
      'Azure AD B2C single sign-on across several applications, including an Umbraco 7 to 13 upgrade with centralised SSO.',
    description:
      'Case study: single sign-on across several applications with Azure AD B2C and OpenID Connect, and an Umbraco 7 to 13 upgrade.',
    stack: ['Azure AD B2C', 'OpenID Connect', 'OAuth 2.0', '.NET', 'Umbraco'],
  },
];
