import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Lane } from '../ui/lane';
import { CodeBlock } from '../ui/code-block';
import { QueueDiagram } from '../demos/queue-sim/queue-diagram';
import { EventSim } from '../demos/event-sim/event-sim';
import { TopicFanout } from '../demos/event-sim/topic-fanout';
import { TestPipeline } from '../demos/test-pipeline/test-pipeline';
import { LiveChartDemo } from '../demos/live-chart/live-chart-demo';
import { LiveChartDocs } from '../demos/live-chart/live-chart-docs';
import { SsoFlow } from '../demos/sso-flow/sso-flow';
import { Block, CaseStudy, CaseStudyBody, caseStudies, caseStudyText } from '../../content/case-studies';
import { caseStudyBodies } from '../../content/case-study-bodies';
import { pipelineSteps } from '../../content/pipeline-steps';
import { ssoText } from '../../content/demos';

/** One shape for every block type, so the template needs no type narrowing. */
interface FlatBlock {
  type: 'p' | 'list' | 'code';
  text: string;
  items: string[];
  lang: string;
  caption: string;
}

function flatten(b: Block): FlatBlock {
  if (typeof b === 'string') return { type: 'p', text: b, items: [], lang: '', caption: '' };
  if ('list' in b) return { type: 'list', text: '', items: b.list, lang: '', caption: '' };
  return { type: 'code', text: b.code, items: [], lang: b.lang, caption: b.caption };
}

@Component({
  imports: [
    RouterLink,
    Lane,
    CodeBlock,
    QueueDiagram,
    EventSim,
    TopicFanout,
    TestPipeline,
    LiveChartDemo,
    LiveChartDocs,
    SsoFlow,
  ],
  template: `
    <article class="wrap">
      <header class="py-10 sm:py-14">
        <a routerLink="/" fragment="work" class="text-sm">{{ text.all }}</a>
        <h1 class="mt-3 text-3xl sm:text-[3.5rem]" [style.view-transition-name]="'cs-' + cs.slug">{{ cs.title }}</h1>
        <p class="measure mt-4 text-lg">{{ cs.outcome }}</p>
      </header>

      @for (section of sections; track section.heading) {
        <section appLane [heading]="section.heading">
          <div class="measure">
            @for (b of section.blocks; track $index) {
              @switch (b.type) {
                @case ('p') {
                  <p>{{ b.text }}</p>
                }
                @case ('list') {
                  <ol class="list-decimal space-y-1 pl-6 marker:text-ink-muted">
                    @for (item of b.items; track item) {
                      <li>{{ item }}</li>
                    }
                  </ol>
                }
                @case ('code') {
                  <app-code-block [code]="b.text" [language]="b.lang" [caption]="b.caption" />
                }
              }
            }
          </div>
        </section>
      }

      <section appLane [heading]="text.stackHeading">
        <ul [attr.aria-label]="text.stackLabel" class="flex flex-wrap gap-x-4 gap-y-2">
          @for (s of cs.stack; track s) {
            <li class="tag">{{ s }}</li>
          }
        </ul>
      </section>

      <section aria-labelledby="h-demo" class="border-t border-rule py-12 sm:py-16">
        <h2 id="h-demo" class="text-xl">{{ body.demo.heading }}</h2>
        <p class="measure mt-2">{{ body.demo.intro }}</p>
        <div class="mt-8">
          @switch (cs.slug) {
            @case ('event-driven') {
              @defer (on viewport) {
                <app-event-sim />
                <app-topic-fanout class="mt-14 block" />
              } @placeholder {
                <div>
                  <app-queue-diagram />
                  <p class="mt-3 text-sm text-ink-muted">{{ text.staticNote }}</p>
                </div>
              }
            }
            @case ('test-pipeline') {
              @defer (on viewport) {
                <app-test-pipeline />
              } @placeholder {
                <div>
                  <ol class="measure list-decimal space-y-3 pl-6">
                    @for (s of pipelineSteps; track s.title) {
                      <li><span class="font-semibold">{{ s.title }}.</span> {{ s.summary }}</li>
                    }
                  </ol>
                  <p class="mt-3 text-sm text-ink-muted">{{ text.staticNote }}</p>
                </div>
              }
            }
            @case ('live-chart') {
              @defer (on viewport) {
                <app-live-chart-demo />
              } @placeholder {
                <div class="live-chart grid place-items-center rounded border border-rule bg-paper-raised p-6">
                  <p class="text-ink-muted">{{ text.staticNote }}</p>
                </div>
              }
              <app-live-chart-docs class="mt-12 block" />
            }
            @case ('identity') {
              @defer (on viewport) {
                <app-sso-flow />
              } @placeholder {
                <div>
                  <ol class="measure list-decimal space-y-3 pl-6">
                    @for (s of ssoSteps; track $index) {
                      <li><span class="font-semibold">{{ s.title }}.</span> {{ s.detail }}</li>
                    }
                  </ol>
                  <p class="mt-3 text-sm text-ink-muted">{{ text.staticNote }}</p>
                </div>
              }
            }
          }
        </div>
      </section>

      <nav [attr.aria-label]="text.next" class="border-t border-rule py-10">
        <p class="text-sm text-ink-muted">{{ text.next }}</p>
        <a [routerLink]="'/work/' + next.slug" class="mt-1 inline-block text-xl font-semibold">{{ next.title }}</a>
      </nav>
    </article>
  `,
})
export class CaseStudyPage {
  protected readonly text = caseStudyText;
  protected readonly pipelineSteps = pipelineSteps;
  protected readonly ssoSteps = ssoText.steps;
  protected readonly cs: CaseStudy;
  protected readonly body: CaseStudyBody;
  protected readonly next: CaseStudy;
  protected readonly sections: { heading: string; blocks: FlatBlock[] }[];

  constructor() {
    const slug = inject(ActivatedRoute).snapshot.data['slug'] as string;
    const i = caseStudies.findIndex((c) => c.slug === slug);
    this.cs = caseStudies[i];
    this.next = caseStudies[(i + 1) % caseStudies.length];
    this.body = caseStudyBodies[this.cs.slug];
    this.sections = this.body.sections.map((s) => ({ heading: s.heading, blocks: s.blocks.map(flatten) }));
  }
}
