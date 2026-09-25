import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Lane } from '../ui/lane';
import { about } from '../../content/pages';
import { education } from '../../content/experience';
import { projects, projectsText } from '../../content/projects';

@Component({
  imports: [Lane, RouterLink],
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
      <section appLane [heading]="projectsText.heading">
        <p class="measure">{{ projectsText.intro }}</p>
        <ul class="mt-4 divide-y divide-rule">
          @for (p of projects; track p.name) {
            <li class="py-5">
              <h3 class="text-lg">{{ p.name }}</h3>
              <p class="measure mt-1">{{ p.summary }}</p>
              <p class="mt-2 text-sm text-ink-muted">
                <span class="font-semibold">{{ projectsText.roleLabel }}:</span> {{ p.role }}
              </p>
              <ul [attr.aria-label]="projectsText.stackLabel" class="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                @for (s of p.stack; track s) {
                  <li class="stack-tag">{{ s }}</li>
                }
              </ul>
              @if (p.caseStudy) {
                <p class="mt-3 text-sm">
                  <a [routerLink]="'/work/' + p.caseStudy">{{ projectsText.caseStudyLink }}<span class="sr-only">{{ projectsText.caseStudyAbout }} {{ p.name }}</span></a>
                </p>
              }
            </li>
          }
        </ul>
      </section>

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
  protected readonly projects = projects;
  protected readonly projectsText = projectsText;
}
