import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { notFound } from '../../content/pages';
import { caseStudies } from '../../content/case-studies';

@Component({
  imports: [RouterLink],
  template: `
    <div class="wrap py-14 sm:py-20">
      <h1 class="text-3xl sm:text-[3.5rem]">{{ notFound.heading }}</h1>
      <p class="measure mt-4 text-lg">{{ notFound.body }}</p>

      <!-- A terminal session. The prompts are decoration; the listing is a real list of links. -->
      <figure class="editor mt-8 max-w-[44rem]">
        <div class="editor-tab" aria-hidden="true">{{ t.label }}</div>
        <div class="editor-body space-y-1 pl-4">
          <p aria-hidden="true">
            <span class="syn-string">{{ t.prompt }}</span> cd {{ path }}
          </p>
          <p class="text-fault">{{ t.error(path) }}</p>
          <p class="pt-2" aria-hidden="true">
            <span class="syn-string">{{ t.prompt }}</span> {{ t.listing }}
          </p>
          <ul [attr.aria-label]="t.pagesLabel" class="grid gap-y-1">
            @for (w of work; track w.slug) {
              <li class="flex flex-wrap gap-x-3">
                <a [routerLink]="'/work/' + w.slug">{{ w.slug }}/</a>
                <span class="text-ink-muted"><span aria-hidden="true"># </span>{{ w.title }}</span>
              </li>
            }
            <li><a routerLink="/about">about/</a></li>
            <li><a routerLink="/colophon">colophon/</a></li>
          </ul>
          <p class="pt-2">
            <span class="syn-string" aria-hidden="true">{{ t.prompt }}</span
            >{{ ' '
            }}<a routerLink="/"
              >{{ t.home }}<span class="sr-only"> ({{ t.homeHint }})</span></a
            ><span class="terminal-cursor" aria-hidden="true"></span>
          </p>
        </div>
      </figure>
    </div>
  `,
})
export class NotFound {
  protected readonly notFound = notFound;
  protected readonly t = notFound.terminal;
  /** The address that wasn't found; prerendered as /404, the real path once the app runs. */
  protected readonly path = decodeURI(inject(Router).url.split(/[?#]/)[0]);
  protected readonly work = caseStudies;
}
