import { Component, DOCUMENT, DestroyRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerArrowRight } from '@ng-icons/tabler-icons';
import { Lane } from '../../ui/lane';
import { CtaMotion } from '../../ui/cta-motion';
import { MarkupPanel } from '../../ui/markup-panel';
import { Contact } from './contact';
import { QueueSim } from '../../demos/queue-sim/queue-sim';
import { QueueDiagram } from '../../demos/queue-sim/queue-diagram';
import { hero, home } from '../../../content/pages';
import { profile } from '../../../content/profile';
import { timeline } from '../../../content/experience';
import { caseStudies } from '../../../content/case-studies';

/** FNV-1a, first 7 hex digits: stable, commit-looking, and meaningless on purpose. */
function shortHash(text: string): string {
  let h = 0x811c9dc5;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193) >>> 0;
  return h.toString(16).padStart(8, '0').slice(0, 7);
}

@Component({
  imports: [RouterLink, NgIcon, Lane, CtaMotion, MarkupPanel, Contact, QueueSim, QueueDiagram],
  viewProviders: [provideIcons({ tablerArrowRight })],
  template: `
    <div class="wrap">
      <section aria-labelledby="h-hero" class="pb-14 pt-8 sm:pt-14">
        <h1 id="h-hero" class="text-display font-bold leading-none tracking-[-0.03em]">
          {{ profile.name }}
        </h1>
        <p class="mt-4 text-lg text-ink-muted sm:text-xl">{{ profile.tagline }}</p>
        <div class="mt-8 flex flex-wrap gap-3">
          <a routerLink="/" fragment="work" class="btn btn-cta" appCta="arrow">
            <span>{{ home.actions.work }}</span>
            <span data-cta-icon class="inline-flex"
              ><ng-icon name="tablerArrowRight" size="1.2rem" aria-hidden="true"
            /></span>
          </a>
        </div>

        <div class="mt-12">
          @defer (on idle) {
            <app-queue-sim />
          } @placeholder {
            <app-queue-diagram />
          }
        </div>
        <div class="mt-5 grid gap-3 md:grid-cols-2 md:gap-12">
          <p class="measure text-lg font-medium">{{ hero.result }}</p>
          <p class="measure text-sm text-ink-muted">{{ hero.caption }}</p>
        </div>
      </section>

      <section appLane [heading]="home.intro.heading">
        <app-markup-panel
          [file]="home.intro.editor.file"
          [tag]="home.intro.editor.tag"
          [attrs]="home.intro.editor.attrs"
          [paragraphs]="home.intro.paragraphs"
        />
      </section>

      <section appLane id="work" [heading]="home.work.heading">
        <ul class="divide-y divide-rule">
          @for (w of work; track w.slug) {
            <li class="grid gap-3 py-6 first:pt-0 md:grid-cols-[minmax(0,1fr)_13rem] md:gap-8">
              <div>
                <h3 class="text-lg">
                  <a
                    [routerLink]="'/work/' + w.slug"
                    [style.view-transition-name]="'cs-' + w.slug"
                    >{{ w.title }}</a
                  >
                </h3>
                <p class="measure mt-1">{{ w.outcome }}</p>
              </div>
              <ul
                [attr.aria-label]="home.work.stackLabel"
                class="flex flex-wrap content-start gap-x-3 gap-y-2"
              >
                @for (t of w.stack; track t) {
                  <li class="stack-tag">{{ t }}</li>
                }
              </ul>
            </li>
          }
        </ul>
        <p class="mt-4 text-sm text-ink-muted">{{ home.work.note }}</p>
      </section>

      <section appLane [heading]="home.timeline.heading">
        <!-- Career history styled as \`git log --graph\`: newest first, one commit per role. -->
        <ol class="gitlog">
          @for (e of gitLog; track e.start; let first = $first) {
            <li class="gitlog-item" [class.gitlog-gap]="!e.org">
              <span class="gitlog-node" aria-hidden="true">{{ e.org ? '*' : '┊' }}</span>
              <div class="min-w-0">
                @if (e.org) {
                  <p class="text-sm" aria-hidden="true">
                    <span class="syn-type">{{ e.hash }}</span>
                    @if (first) {
                      {{ ' ' }}<span class="syn-punct">(</span
                      ><span class="syn-tag">HEAD -&gt; </span
                      ><span class="syn-string">{{ home.timeline.branch }}</span
                      ><span class="syn-punct">)</span>
                    }
                  </p>
                  <h3 class="text-lg">
                    {{ e.title }}<span class="font-normal text-ink-muted">, {{ e.org }}</span>
                  </h3>
                } @else {
                  <h3 class="text-lg font-normal italic text-ink-muted">
                    <span aria-hidden="true"># </span>{{ e.title }}
                  </h3>
                }
                <p class="text-sm text-ink-muted">
                  <span aria-hidden="true">{{ home.timeline.dateLabel }} </span
                  ><time [attr.datetime]="e.start">{{ e.period }}</time>
                </p>
                @for (line of e.lines; track $index) {
                  <p class="measure mt-2">{{ line }}</p>
                }
              </div>
            </li>
          }
        </ol>
      </section>

      <section appLane [heading]="home.howIWork.heading">
        <div class="measure">
          @for (p of home.howIWork.paragraphs; track $index) {
            <p>{{ p }}</p>
          }
        </div>
      </section>

      <section appLane [heading]="home.contact.heading">
        <app-contact />
      </section>
    </div>
  `,
})
export class Home {
  protected readonly profile = profile;
  protected readonly home = home;
  protected readonly hero = hero;
  protected readonly work = caseStudies;
  /** Newest first, like `git log`, each with a short hash derived from its dates. */
  protected readonly gitLog = [...timeline]
    .reverse()
    .map((e) => ({ ...e, hash: shortHash(e.start + e.title) }));

  constructor() {
    // JSON-LD Person schema, home page only.
    const doc = inject(DOCUMENT);
    let script = doc.getElementById('person-ld');
    if (!script) {
      script = doc.createElement('script');
      script.id = 'person-ld';
      script.setAttribute('type', 'application/ld+json');
      script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: profile.name,
        jobTitle: profile.role,
        url: profile.siteUrl,
        address: { '@type': 'PostalAddress', addressLocality: 'Ahmedabad', addressCountry: 'IN' },
        sameAs: [profile.links.linkedin, profile.links.github],
      });
      doc.head.appendChild(script);
    }
    inject(DestroyRef).onDestroy(() => script.remove());
  }
}
