import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { notFound } from '../../content/pages';
import { work } from '../../content/work';

@Component({
  imports: [RouterLink],
  template: `
    <div class="wrap py-14 sm:py-20">
      <h1 class="text-3xl sm:text-[3.5rem]">{{ notFound.heading }}</h1>
      <p class="measure mt-4 text-lg">{{ notFound.body }}</p>
      <ul class="mt-6 space-y-2">
        @for (w of work; track w.slug) {
          <li><a routerLink="/" fragment="work">{{ w.title }}</a></li>
        }
      </ul>
      <p class="mt-8"><a routerLink="/" class="btn">{{ notFound.home }}</a></p>
    </div>
  `,
})
export class NotFound {
  protected readonly notFound = notFound;
  protected readonly work = work;
}
