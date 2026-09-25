import { Component } from '@angular/core';
import { Lane } from '../ui/lane';
import { colophon } from '../../content/pages';
import { profile } from '../../content/profile';

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
}
