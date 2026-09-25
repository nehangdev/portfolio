import { Component, DOCUMENT, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Theme } from './core/theme';
import { footer, nav } from '../content/pages';
import { profile } from '../content/profile';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <a
      [routerLink]="[]"
      fragment="main"
      (click)="focusMain()"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:bg-paper focus:p-3"
      >{{ nav.skip }}</a
    >

    <header class="wrap flex flex-wrap items-center gap-x-8 gap-y-1 py-4 sm:py-5">
      <a routerLink="/" class="mr-auto text-lg font-bold text-ink no-underline">{{ profile.name }}</a>
      <nav [attr.aria-label]="nav.label" class="order-last w-full sm:order-none sm:w-auto">
        <ul class="flex gap-5">
          @for (link of nav.links; track link.label) {
            <li>
              <a
                [routerLink]="link.path"
                [fragment]="link.fragment"
                routerLinkActive="font-semibold"
                [routerLinkActiveOptions]="activeMatch"
                ariaCurrentWhenActive="page"
                class="text-ink"
                >{{ link.label }}</a
              >
            </li>
          }
        </ul>
      </nav>
      <button
        type="button"
        (click)="theme.toggle()"
        [attr.aria-label]="theme.current() === 'dark' ? nav.themeToLight : nav.themeToDark"
        class="invisible inline-flex size-11 cursor-pointer items-center justify-center rounded-full text-ink hover:bg-paper-raised [.js_&]:visible"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2" />
          <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
        </svg>
      </button>
    </header>

    <main id="main" tabindex="-1" class="outline-none">
      <router-outlet />
    </main>

    <footer class="wrap mt-8">
      <div class="flex flex-wrap justify-between gap-4 border-t border-rule py-8 text-sm text-ink-muted">
        <p>{{ profile.name }}, {{ profile.location }}</p>
        <ul class="flex flex-wrap gap-5">
          <li><a [href]="profile.links.github">GitHub</a></li>
          <li><a [href]="profile.links.linkedin">LinkedIn</a></li>
          <li><a [href]="profile.repoUrl">{{ footer.source }}</a></li>
        </ul>
      </div>
    </footer>
  `,
})
export class App {
  protected readonly theme = inject(Theme);
  protected readonly activeMatch = {
    paths: 'exact',
    fragment: 'exact',
    queryParams: 'ignored',
    matrixParams: 'ignored',
  } as const;
  protected readonly nav = nav;
  protected readonly footer = footer;
  protected readonly profile = profile;
  private readonly doc = inject(DOCUMENT);

  protected focusMain(): void {
    this.doc.getElementById('main')?.focus();
  }
}
