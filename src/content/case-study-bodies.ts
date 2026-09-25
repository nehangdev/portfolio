import { CaseStudy, CaseStudyBody } from './case-studies';

/** Article bodies, loaded only with the case-study page. */
export const caseStudyBodies: Record<CaseStudy['slug'], CaseStudyBody> = {
  'event-driven': {
    sections: [
      {
        heading: 'Context',
        blocks: [
          'An insurance and agents B2B platform takes in documents in bulk. Uploads arrive as a hierarchy, and each document passes through several levels of validation before the platform can use it.',
          'The platform runs on .NET and Azure, with an Angular front end.',
        ],
      },
      {
        heading: 'Problem',
        blocks: [
          'Document processing ran as synchronous calls. With synchronous calls, the request that receives a document also does the work on it. Every slow step makes the caller wait, and a burst of uploads lines up behind whatever is already running.',
          'There is also no natural place to retry. If one step fails part-way through, the whole request fails with it.',
        ],
      },
      {
        heading: 'What I did',
        blocks: [
          'I moved the processing onto Azure Service Bus. Receiving a document now means publishing a message and returning. The work happens in consumers that read from the bus.',
          {
            lang: 'diff-csharp',
            caption: 'The shape of the change, simplified and written for this page. Not client code.',
            code: ` [HttpPost("documents")]
 public async Task<IActionResult> Upload(DocumentUploaded document)
 {
-    // The caller waits while every step runs, one after another.
-    await validator.ValidateAsync(document);
-    await indexer.IndexAsync(document);
-    await notifier.NotifyAsync(document);
-    return Ok();
+    // Publish once and return. Each subscription on the topic does its part in parallel.
+    await sender.SendMessageAsync(new ServiceBusMessage(BinaryData.FromObjectAsJson(document)));
+    return Accepted();
 }`,
          },
          'Topics and subscriptions let one uploaded document feed several independent steps. Each subscription gets its own copy of the message and its own consumers, so a slow step does not hold up a fast one.',
          'Consumers run in parallel, so throughput grows with the number of consumers. Service Bus redelivers a message that fails. One that keeps failing moves to the dead-letter queue, where it can be inspected instead of lost.',
          'On the .NET side the design follows CQRS. Commands that change state go through the bus, and queries read along their own path.',
          {
            lang: 'csharp',
            caption: 'A simplified subscription consumer, written for this page. Not client code.',
            code: `await using var client = new ServiceBusClient(connectionString);

var processor = client.CreateProcessor("documents", "validation", new ServiceBusProcessorOptions
{
    MaxConcurrentCalls = 4,
    AutoCompleteMessages = false,
});

processor.ProcessMessageAsync += async args =>
{
    var document = args.Message.Body.ToObjectFromJson<DocumentUploaded>();
    try
    {
        await validator.ValidateAsync(document, args.CancellationToken);
        await args.CompleteMessageAsync(args.Message);
    }
    catch (ValidationException ex)
    {
        // A document that fails validation will never pass: set it aside with the reason.
        await args.DeadLetterMessageAsync(args.Message, "ValidationFailed", ex.Message);
    }
    catch (Exception)
    {
        // Anything else may be transient: release it so Service Bus redelivers it.
        // After MaxDeliveryCount attempts it moves to the dead-letter queue.
        await args.AbandonMessageAsync(args.Message);
        throw;
    }
};

processor.ProcessErrorAsync += args =>
{
    logger.LogError(args.Exception, "Service Bus error on {Entity}", args.EntityPath);
    return Task.CompletedTask;
};

await processor.StartProcessingAsync();`,
          },
        ],
      },
      {
        heading: 'Result',
        blocks: [
          'Throughput went up by about 40%. Ingestion now scales by adding consumers. A failing document is retried or set aside, instead of failing the upload.',
        ],
      },
    ],
    demo: {
      heading: 'Try it',
      intro:
        'A recreation with synthetic documents. Change the arrival rate, the number of consumers and the failure rate. Switch retries off to send failures straight to the dead-letter queue. Below the simulator, one topic fans out to three subscriptions.',
    },
  },
  'test-pipeline': {
    sections: [
      {
        heading: 'Context',
        blocks: [
          'At Veloxcore, testers describe what needs checking in plain language. Turning that into Playwright tests takes time. A useful test has to fit the codebase it runs against: it must reuse the project’s page objects and fixtures, not invent new ones.',
        ],
      },
      {
        heading: 'Problem',
        blocks: [
          'Generated test code is easy to produce and hard to trust. A script that ignores the existing page objects, fixtures and conventions adds maintenance work instead of removing it.',
        ],
      },
      {
        heading: 'What I did',
        blocks: [
          'I built an internal framework out of reusable AI skills. A tester writes a scenario, and a 10-phase pipeline takes it the rest of the way. Five of those phases are:',
          {
            list: [
              'Requirement analysis',
              'Project mapping',
              'Manual test-case generation',
              'Page-object and fixture discovery',
              'Automated script generation',
            ],
          },
          'Each phase produces an artefact the next one builds on, so the output of every step can be read and checked. Mapping the project and discovering its page objects and fixtures are what keep the final script inside the existing structure.',
        ],
      },
      {
        heading: 'Result',
        blocks: [
          'A tester can go from a written scenario to a Playwright script that uses the project’s own page objects and fixtures.',
        ],
      },
    ],
    demo: {
      heading: 'Step through it',
      intro:
        'A recreation of the approach against a fictional shop app. Every artefact was written by hand in advance, and nothing here calls a language model.',
    },
  },
  'live-chart': {
    sections: [
      {
        heading: 'Context',
        blocks: [
          'I built a real-time financial charting dashboard in Angular 14. Prices stream in continuously, and the charts redraw as they arrive.',
        ],
      },
      {
        heading: 'Problem',
        blocks: [
          'The same charts were needed inside a Blazor WebAssembly app. Rewriting them in Blazor would have meant two implementations of the same behaviour to keep in step.',
        ],
      },
      {
        heading: 'What I did',
        blocks: [
          'I turned the dashboard’s modules into reusable Web Components. A Web Component is a custom HTML element. The Blazor app uses it like any other tag, without knowing Angular is inside.',
          'Angular Elements does the packaging. Each component becomes a custom element, its inputs become attributes and properties, and its outputs become DOM events.',
          'For real-time dashboards I have also used SciChart, a WebAssembly charting library built for very large, fast-moving data sets.',
        ],
      },
      {
        heading: 'Result',
        blocks: [
          'The charting modules run inside the Blazor WebAssembly app, from one codebase.',
        ],
      },
    ],
    demo: {
      heading: 'The element',
      intro:
        'The chart below is <nehang-live-chart>, a Web Component built for this page. The page loads it the way any other site would, with a script tag and an HTML element. It draws synthetic prices on a canvas by hand, with no chart library.',
    },
  },
  'identity': {
    sections: [
      {
        heading: 'Context',
        blocks: [
          'The platforms I work on are made of several applications. Without shared sign-in, each one asks people to log in separately, with its own account and its own password reset.',
        ],
      },
      {
        heading: 'Problem',
        blocks: [
          'Separate sign-ins mean separate user stores and a worse experience for anyone who uses more than one app. An older Umbraco 7 site added its own maintenance work on top.',
        ],
      },
      {
        heading: 'What I did',
        blocks: [
          'I set up Azure AD B2C as the identity provider for several applications. Each app sends people to B2C with OpenID Connect. Once someone has signed in to one app, B2C recognises their session, and the next app signs them in without asking again.',
          'I led the upgrade of the Umbraco site from version 7 to 13, and moved it onto the same centralised sign-in.',
          'For a digital marketplace, the same B2C sign-in leads into an onboarding flow with KYC and payment steps.',
        ],
      },
      {
        heading: 'Result',
        blocks: [
          'One sign-in covers several applications, and the Umbraco upgrade reduced maintenance work.',
        ],
      },
    ],
    demo: {
      heading: 'Step through it',
      intro:
        'A simplified sequence of single sign-on with Azure AD B2C and OpenID Connect. Move through it at your own pace.',
    },
  },
};
