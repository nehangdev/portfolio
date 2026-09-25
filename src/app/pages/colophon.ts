import { Component } from '@angular/core';
import { Lane } from '../ui/lane';
import { colophon } from '../../content/pages';
import { profile } from '../../content/profile';
import { buildReport } from '../../content/build-report';

@Component({
  imports: [Lane],
  template: `
    <div class="wrap">
      <header class="py-10 sm:py-14">
        <h1 class="text-3xl sm:text-[3.5rem]">{{ colophon.heading }}</h1>
        <p class="mt-4 text-lg text-ink-muted">{{ colophon.lead }}</p>
      </header>
      @for (section of colophon.sections; track section.heading) {
        <section appLane [heading]="section.heading">
          <ul class="measure list-disc space-y-2 pl-5 marker:text-queue">
            @for (item of section.items; track $index) {
              <li>{{ item }}</li>
            }
          </ul>
        </section>
      }
      <section appLane [heading]="log.heading">
        <p class="measure">{{ log.intro }}</p>
        <figure class="editor mt-5 max-w-none">
          <div class="editor-tab" aria-hidden="true">{{ log.file }}</div>
          <div class="editor-body space-y-1 px-4 text-sm">
            <p><span class="syn-string" aria-hidden="true">$ </span>{{ log.build }}</p>
            <p class="syn-string">
              <span aria-hidden="true">✓ </span>{{ log.prerendered(report.routes) }}
            </p>
            <dl class="grid gap-x-6 sm:grid-cols-[minmax(0,1fr)_auto]">
              @for (row of log.sizes; track row.key) {
                <dt class="text-ink-muted">{{ row.label }}</dt>
                <dd class="mb-1 sm:mb-0 sm:text-right">
                  <span class="syn-type">{{ report.sizes[row.key] }} KB</span>
                  @if (row.key === 'homeAllJs') {
                    <span class="text-ink-muted"> / {{ log.budget(report.sizes.budget) }}</span>
                  }
                </dd>
              }
            </dl>

            <p class="pt-3">
              <span class="syn-string" aria-hidden="true">$ </span>{{ log.unitCmd }}
            </p>
            <p class="syn-string">
              <span aria-hidden="true">✓ </span>{{ log.unit(report.unit.passed) }}
            </p>

            <p class="pt-3">
              <span class="syn-string" aria-hidden="true">$ </span>{{ log.e2eCmd }}
            </p>
            <p class="syn-string">
              <span aria-hidden="true">✓ </span>{{ log.e2e(report.e2e.passed, report.e2e.skipped) }}
            </p>

            <p class="pt-3">
              <span class="syn-string" aria-hidden="true">$ </span>{{ log.lighthouseCmd }}
            </p>
            <div class="overflow-x-auto" tabindex="0" [attr.aria-label]="log.lighthouseLabel">
              <table class="w-full min-w-[34rem] text-left">
                <caption class="sr-only">
                  {{
                    log.lighthouseLabel
                  }}
                </caption>
                <thead>
                  <tr class="text-ink-muted">
                    @for (c of log.columns; track c) {
                      <th scope="col" class="py-1 pr-4 font-normal">{{ c }}</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (row of report.lighthouse; track row.path) {
                    <tr>
                      <th scope="row" class="py-1 pr-4 font-normal">{{ row.path }}</th>
                      <td class="py-1 pr-4 syn-type">{{ row.performance }}</td>
                      <td class="py-1 pr-4 syn-type">{{ row.accessibility }}</td>
                      <td class="py-1 pr-4 syn-type">{{ row.bestPractices }}</td>
                      <td class="py-1 pr-4 syn-type">{{ row.seo }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <p class="pt-3 italic text-ink-muted">
              {{ log.footer(report.measuredOn, report.commit) }}
            </p>
          </div>
        </figure>
      </section>

      <section appLane [heading]="colophon.source.heading">
        <p>
          {{ colophon.source.text }} <a [href]="profile.repoUrl">{{ colophon.source.link }}</a>
        </p>
      </section>
    </div>
  `,
})
export class Colophon {
  protected readonly colophon = colophon;
  protected readonly profile = profile;
  protected readonly log = colophon.buildLog;
  protected readonly report = buildReport;
}
