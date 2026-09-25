import { Component, DOCUMENT, afterNextRender, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  tablerBrandGithub,
  tablerBrandLinkedin,
  tablerCode,
  tablerCommand,
  tablerDownload,
  tablerMapPin,
  tablerMenu2,
  tablerMoon,
  tablerSun,
  tablerX,
} from '@ng-icons/tabler-icons';
import { Theme } from './core/theme';
import { CommandPalette } from './ui/command-palette';
import { CtaMotion } from './ui/cta-motion';
import { consoleGreeting, footer, nav, palette } from '../content/pages';
import { profile } from '../content/profile';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIcon, CommandPalette, CtaMotion],
  host: { '(document:keydown)': 'onShortcut($event)' },
  viewProviders: [
    provideIcons({
      tablerBrandGithub,
      tablerBrandLinkedin,
      tablerCode,
      tablerCommand,
      tablerDownload,
      tablerMapPin,
      tablerMenu2,
      tablerMoon,
      tablerSun,
      tablerX,
    }),
  ],
  template: `
    <a
      [routerLink]="[]"
      fragment="main"
      (click)="focusMain()"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-paper focus:p-3"
      >{{ nav.skip }}</a
    >

    <header class="site-header sticky top-0 z-40 border-b border-transparent">
      <div class="wrap flex h-16 items-center gap-x-6">
        <a routerLink="/" class="mr-auto font-bold text-ink no-underline">{{ profile.name }}</a>

        <nav [attr.aria-label]="nav.label" class="hidden sm:block">
          <ul class="flex gap-6">
            @for (link of nav.links; track link.label) {
              <li>
                <a
                  [routerLink]="link.path"
                  [fragment]="link.fragment"
                  routerLinkActive="nav-active"
                  [routerLinkActiveOptions]="activeMatch"
                  ariaCurrentWhenActive="page"
                  class="nav-link"
                  >{{ link.label }}</a
                >
              </li>
            }
          </ul>
        </nav>

        <div class="flex items-center gap-1">
          <!-- Résumé: a labelled outlined button from md up, an icon button on phones. -->
          <a
            [href]="profile.resumeUrl"
            [attr.download]="profile.resumeFileName"
            [attr.aria-label]="nav.resumeLabel"
            class="btn btn-cta mr-2 hidden min-h-9 px-3 py-1 text-sm md:inline-flex"
            appCta="download"
          >
            <span data-cta-icon class="inline-flex"
              ><ng-icon name="tablerDownload" size="1.1rem" aria-hidden="true"
            /></span>
            <span>{{ nav.resume }}</span>
          </a>
          <a
            [href]="profile.resumeUrl"
            [attr.download]="profile.resumeFileName"
            [attr.aria-label]="nav.resumeLabel"
            [title]="nav.resumeLabel"
            class="icon-btn relative overflow-hidden md:hidden"
            appCta="download"
          >
            <span data-cta-icon class="inline-flex"
              ><ng-icon name="tablerDownload" size="1.35rem" aria-hidden="true"
            /></span>
          </a>
          <button
            type="button"
            (click)="openPalette()"
            [attr.aria-label]="palette.open"
            [title]="palette.open + ' (' + palette.shortcutHint + ')'"
            aria-keyshortcuts="Control+K Meta+K"
            class="icon-btn invisible in-[.js]:visible"
          >
            <ng-icon name="tablerCommand" size="1.3rem" aria-hidden="true" />
          </button>
          <button
            type="button"
            (click)="theme.toggle()"
            [attr.aria-label]="theme.current() === 'dark' ? nav.themeToLight : nav.themeToDark"
            class="icon-btn invisible in-[.js]:visible"
          >
            <ng-icon
              [name]="theme.current() === 'dark' ? 'tablerSun' : 'tablerMoon'"
              size="1.35rem"
              aria-hidden="true"
            />
          </button>
          <!-- Native popover: opens and light-dismisses without any JavaScript. -->
          <button
            type="button"
            popovertarget="mobile-nav"
            [attr.aria-label]="nav.openMenu"
            class="icon-btn sm:hidden"
          >
            <ng-icon name="tablerMenu2" size="1.35rem" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div class="scroll-progress" aria-hidden="true"></div>
    </header>

    <nav id="mobile-nav" #menu popover [attr.aria-label]="nav.label" class="mobile-nav">
      <div class="flex items-center justify-between">
        <span class="font-bold">{{ profile.name }}</span>
        <button
          type="button"
          popovertarget="mobile-nav"
          popovertargetaction="hide"
          [attr.aria-label]="nav.closeMenu"
          class="icon-btn"
        >
          <ng-icon name="tablerX" size="1.35rem" aria-hidden="true" />
        </button>
      </div>
      <ul class="mt-4 grid">
        @for (link of nav.links; track link.label) {
          <li>
            <a
              [routerLink]="link.path"
              [fragment]="link.fragment"
              (click)="menu.hidePopover()"
              routerLinkActive="nav-active"
              [routerLinkActiveOptions]="activeMatch"
              ariaCurrentWhenActive="page"
              class="nav-link block py-3 text-lg"
              >{{ link.label }}</a
            >
          </li>
        }
      </ul>
    </nav>

    <!-- The palette's code downloads the first time someone opens it. -->
    @defer (when paletteRequested()) {
      <app-command-palette [(open)]="paletteOpen" />
    }

    <main id="main" tabindex="-1" class="outline-none">
      <router-outlet />
    </main>

    <footer class="wrap mt-8">
      <div
        class="flex flex-wrap items-center justify-between gap-4 border-t border-rule py-8 text-sm text-ink-muted"
      >
        <p class="inline-flex items-center gap-2">
          <ng-icon name="tablerMapPin" size="1.1rem" aria-hidden="true" />
          <span
            ><span class="sr-only">{{ footer.location }}: </span>{{ profile.location }}</span
          >
        </p>
        <ul class="flex items-center gap-1">
          <li>
            <a
              [href]="profile.links.github"
              class="icon-btn"
              [attr.aria-label]="footer.github"
              [title]="footer.github"
            >
              <ng-icon name="tablerBrandGithub" size="1.35rem" aria-hidden="true" />
            </a>
          </li>
          <li>
            <a
              [href]="profile.links.linkedin"
              class="icon-btn"
              [attr.aria-label]="footer.linkedin"
              [title]="footer.linkedin"
            >
              <ng-icon name="tablerBrandLinkedin" size="1.35rem" aria-hidden="true" />
            </a>
          </li>
          <li>
            <a
              [href]="profile.repoUrl"
              class="icon-btn"
              [attr.aria-label]="footer.source"
              [title]="footer.source"
            >
              <ng-icon name="tablerCode" size="1.35rem" aria-hidden="true" />
            </a>
          </li>
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
  protected readonly palette = palette;
  protected readonly paletteRequested = signal(false);
  protected readonly paletteOpen = signal(false);
  protected readonly footer = footer;
  protected readonly profile = profile;
  private readonly doc = inject(DOCUMENT);

  constructor() {
    afterNextRender(() =>
      console.log(
        `%c${consoleGreeting.title}%c\n${consoleGreeting.body}\n${profile.repoUrl}`,
        'font: 700 15px "Fira Code", monospace; color: #5fb3bc',
        'font: 13px "Fira Code", monospace',
      ),
    );
  }

  protected openPalette(): void {
    this.paletteRequested.set(true);
    this.paletteOpen.set(true);
  }

  /** Ctrl+K on Windows/Linux, Cmd+K on macOS, like most developer tools. */
  protected onShortcut(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (this.paletteOpen()) this.paletteOpen.set(false);
      else this.openPalette();
    }
  }

  protected focusMain(): void {
    this.doc.getElementById('main')?.focus();
  }
}
