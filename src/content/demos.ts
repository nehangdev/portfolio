/** Labels and copy for the interactive demos on the case-study pages. */

export const eventSimText = {
  controls: {
    arrival: 'Arrival rate',
    arrivalUnit: 'per second',
    consumers: 'Consumers',
    failure: 'Failure rate',
    retry: 'Retry failed documents (up to 3 attempts)',
    pause: 'Pause',
    play: 'Play',
    reset: 'Reset',
  },
  stats: {
    waiting: 'Waiting',
    processed: 'Processed',
    deadLettered: 'Dead-lettered',
    rate: 'Per second',
  },
  canvasText: {
    incoming: 'Incoming',
    workers: (n: number) => (n === 1 ? '1 consumer' : `${n} consumers`),
    done: (n: number) => `${n} done`,
    deadLetter: (n: number) => `${n} dead-lettered`,
  },
  canvasLabel: (consumers: number) =>
    `Animation: documents queue on the left and ${consumers} consumer${consumers === 1 ? '' : 's'} process them. Processed documents collect on the right, and dead-lettered ones below them.`,
};

export const topicText = {
  heading: 'One topic, three subscriptions',
  intro:
    'Every published document is copied to each subscription. Each one has its own consumers and works at its own pace, so a slow step builds its own backlog without holding up the others.',
  published: (n: number) => `${n} published`,
  waiting: 'waiting',
  done: 'done',
  consumers: (n: number) => (n === 1 ? '1 consumer' : `${n} consumers`),
  pause: 'Pause',
  play: 'Play',
  subscriptions: [
    { name: 'Validation', workers: 2, serviceTime: 1.0 },
    { name: 'Indexing', workers: 1, serviceTime: 0.4 },
    { name: 'Notification', workers: 1, serviceTime: 0.2 },
  ],
};

export const chartText = {
  usageHeading: 'Use it anywhere',
  usageIntro: 'Any page can use the element with a script tag and a tag. No framework required.',
  usage: `<script type="module" src="/elements/live-chart.js"></script>

<nehang-live-chart window-seconds="60" label="Synthetic price"></nehang-live-chart>`,
  sandbox: 'Open the element on a plain HTML page',
  apiHeading: 'API',
  apiColumns: ['Name', 'Kind', 'What it does'],
  api: [
    [
      'window-seconds',
      'Attribute',
      'Visible time window in seconds: 30, 60 or 300. Defaults to 60.',
    ],
    ['label', 'Attribute', 'Series name shown in the toolbar and read by screen readers.'],
    [
      'paused',
      'Attribute',
      'Present to start paused. The element starts paused anyway if the system asks for reduced motion.',
    ],
    [
      'seed',
      'Attribute',
      'Seed for the synthetic price walk, so a page looks the same on every load.',
    ],
    [
      'pausechange',
      'Event',
      'Fires when the chart is paused or resumed. event.detail is true when paused.',
    ],
    [
      '--nlc-bg, --nlc-fg, --nlc-muted, --nlc-line, --nlc-grid',
      'CSS property',
      'Colours. The element reads them from its host, so a page can theme it.',
    ],
    ['toolbar, plot', 'CSS part', 'Style the toolbar and plot area from outside with ::part().'],
  ],
  fallback: 'A live, streaming price chart appears here when JavaScript is on.',
};

export const sciChartText = {
  heading: 'At a different scale: SciChart',
  body: 'For real-time dashboards with very large data sets I have used SciChart, which renders with WebAssembly and WebGL. This panel streams five series with up to a million points in total.',
  note: 'It loads SciChart’s free community edition from the jsDelivr CDN only when you ask for it, so the rest of this page stays light. The community edition shows a SciChart watermark and sends SciChart anonymous usage data, including this page’s address.',
  load: 'Load high-performance demo',
  loading: 'Loading SciChart from jsDelivr…',
  failed: 'SciChart could not be loaded. The rest of this page still works.',
  points: (n: number) => `${n.toLocaleString('en')} points on screen`,
  stop: 'Stop',
};

/** One step of a sequence diagram: an arrow between two lifelines, plus an optional code sample. */
export interface SequenceStep {
  from: number;
  to: number;
  title: string;
  detail: string;
  artifact?: { language: string; label: string; code: string };
}

export interface SequenceFlowContent {
  figureLabel: string;
  lifelines: string[];
  steps: SequenceStep[];
}

/** Controls shared by every sequence diagram. */
export const sequenceControls = {
  prev: 'Previous step',
  next: 'Next step',
  restart: 'Start again',
  stepOf: (i: number, n: number) => `Step ${i} of ${n}`,
};

export const ssoText: SequenceFlowContent = {
  lifelines: ['Browser', 'App A', 'Azure AD B2C', 'App B'],
  steps: [
    {
      from: 0,
      to: 1,
      title: 'Open App A',
      detail: 'Someone opens App A. It has no session for them yet.',
    },
    {
      from: 1,
      to: 2,
      title: 'Redirect to B2C',
      detail: 'App A redirects the browser to Azure AD B2C with an OpenID Connect sign-in request.',
    },
    {
      from: 0,
      to: 2,
      title: 'Sign in once',
      detail: 'They sign in on the B2C page. B2C starts its own session for them.',
    },
    {
      from: 2,
      to: 1,
      title: 'Code back to App A',
      detail: 'B2C redirects back to App A with an authorization code.',
    },
    {
      from: 1,
      to: 2,
      title: 'Exchange for tokens',
      detail:
        'App A exchanges the code with B2C for an ID token and an access token, and signs them in.',
    },
    {
      from: 0,
      to: 3,
      title: 'Open App B',
      detail: 'Later they open App B, which has no session for them either.',
    },
    {
      from: 3,
      to: 2,
      title: 'Redirect to B2C',
      detail: 'App B redirects to B2C the same way. B2C sees the session from step 3.',
    },
    {
      from: 2,
      to: 3,
      title: 'Signed in silently',
      detail:
        'B2C sends a code straight back without asking for a password. App B signs them in. That is single sign-on.',
    },
  ],
  figureLabel: 'Sequence diagram of single sign-on across two apps with Azure AD B2C',
};

/**
 * Service-to-service access with the OAuth 2.0 client credentials flow, as in the centralised
 * identity service (IdentityServer 4). Every name, host and value below is made up for the demo.
 */
export const clientCredentialsText: SequenceFlowContent & { heading: string; intro: string } = {
  heading: 'Service to service: the client credentials flow',
  intro:
    'No person is involved here: one backend service calls another. It proves who it is to the identity service, gets a short-lived token, and presents that token to the API. A recreation with made-up names and values.',
  figureLabel: 'Sequence diagram of the OAuth 2.0 client credentials flow between two services',
  lifelines: ['Billing service', 'Identity service', 'Orders API'],
  steps: [
    {
      from: 0,
      to: 1,
      title: 'Ask for a token',
      detail:
        'The billing service sends its client ID and secret to the identity service, and asks only for the scope it needs.',
      artifact: {
        language: 'http',
        label: 'Token request',
        code: `POST /connect/token HTTP/1.1
Host: identity.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_id=billing-service&client_secret=••••••&scope=orders.read`,
      },
    },
    {
      from: 1,
      to: 0,
      title: 'Receive a short-lived token',
      detail:
        'The identity service checks the client and its allowed scopes, then issues a signed access token that expires within the hour.',
      artifact: {
        language: 'json',
        label: 'Token response',
        code: `{
  "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFGM0Mi…",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "orders.read"
}`,
      },
    },
    {
      from: 0,
      to: 2,
      title: 'Call the API with the token',
      detail:
        'The billing service sends the token as a Bearer header. It reuses the same token until it expires.',
      artifact: {
        language: 'http',
        label: 'API request',
        code: `GET /orders/42 HTTP/1.1
Host: orders-api.example.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjFGM0Mi…`,
      },
    },
    {
      from: 2,
      to: 1,
      title: 'Check the signature',
      detail:
        'The API validates the token against the identity service’s public signing keys, fetched once and cached, then checks issuer, audience, expiry and scope. No round trip per request.',
      artifact: {
        language: 'json',
        label: 'Decoded token claims',
        code: `{
  "iss": "https://identity.example.com",
  "aud": "orders-api",
  "client_id": "billing-service",
  "scope": ["orders.read"],
  "exp": 1790003600
}`,
      },
    },
    {
      from: 2,
      to: 0,
      title: 'Return the data',
      detail:
        'The token is valid and carries the orders.read scope, so the API answers. A token without that scope would get 403 Forbidden.',
      artifact: {
        language: 'http',
        label: 'API response',
        code: `HTTP/1.1 200 OK
Content-Type: application/json

{ "id": 42, "status": "shipped" }`,
      },
    },
  ],
};
