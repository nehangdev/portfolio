export interface WorkSummary {
  slug: string;
  title: string;
  outcome: string;
  stack: string[];
}

// TODO(phase 4): link each row to /work/<slug> once the case-study pages exist.
export const work: WorkSummary[] = [
  {
    slug: 'event-driven',
    title: 'Event-driven document processing',
    outcome:
      'Replaced synchronous flows with Azure Service Bus topics and subscriptions. Throughput went up by about 40%.',
    stack: ['Azure Service Bus', '.NET', 'CQRS'],
  },
  {
    slug: 'test-pipeline',
    title: 'Playwright tests from plain language',
    outcome:
      'An internal framework where a tester describes a scenario and a 10-phase pipeline writes the Playwright script.',
    stack: ['Playwright', 'TypeScript', 'Page Object Model'],
  },
  {
    slug: 'live-chart',
    title: 'A real-time chart that runs anywhere',
    outcome:
      'A streaming financial chart built in Angular 14, packaged as Web Components and reused inside a Blazor WebAssembly app.',
    stack: ['Angular', 'RxJS', 'Web Components', 'Blazor WASM'],
  },
  {
    slug: 'identity',
    title: 'One sign-in across several apps',
    outcome:
      'Azure AD B2C single sign-on across several applications, including an Umbraco 7 to 13 upgrade with centralised SSO.',
    stack: ['Azure AD B2C', 'OIDC', '.NET', 'Umbraco'],
  },
];
