import { Component } from '@angular/core';
import { Lane } from '../ui/lane';
import { about } from '../../content/pages';
import { education } from '../../content/experience';

@Component({
  imports: [Lane],
  template: `
    <div class="wrap">
      <h1 class="py-10 text-3xl sm:py-14 sm:text-[3.5rem]">{{ about.heading }}</h1>
      @for (section of about.sections; track section.heading) {
        <section appLane [heading]="section.heading">
          <div class="measure">
            @for (p of section.paragraphs; track $index) {
              <p>{{ p }}</p>
            }
          </div>
        </section>
      }
      <section appLane [heading]="about.education.heading">
        <ul class="space-y-2">
          @for (e of education; track e.degree) {
            <li>
              <span class="font-semibold">{{ e.degree }}</span>, {{ e.school }},
              <time [attr.datetime]="e.year">{{ e.year }}</time>
            </li>
          }
        </ul>
      </section>
    </div>
  `,
})
export class About {
  protected readonly about = about;
  protected readonly education = education;
}
