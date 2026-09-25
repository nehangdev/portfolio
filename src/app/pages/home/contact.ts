import { Component, afterNextRender, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  tablerBrandGithub,
  tablerBrandLinkedin,
  tablerCheck,
  tablerCopy,
  tablerMail,
} from '@ng-icons/tabler-icons';
import { home } from '../../../content/pages';
import { profile } from '../../../content/profile';

@Component({
  selector: 'app-contact',
  imports: [NgIcon],
  viewProviders: [
    provideIcons({ tablerBrandGithub, tablerBrandLinkedin, tablerCheck, tablerCopy, tablerMail }),
  ],
  template: `
    <p class="measure text-lg">{{ c.lead }}</p>
    <ul class="mt-6 grid gap-4">
      <li class="flex flex-wrap items-center gap-x-3 gap-y-2">
        <ng-icon name="tablerMail" size="1.5rem" class="flex-none text-queue" aria-hidden="true" />
        <span class="sr-only">{{ c.emailLabel }}:</span>
        @if (email(); as address) {
          <a [href]="'mailto:' + address" class="break-all">{{ address }}</a>
          <button
            type="button"
            class="icon-btn border-[1.5px] border-rule"
            (click)="copy(address)"
            [attr.aria-label]="c.copy"
            [title]="c.copy"
          >
            <ng-icon
              [name]="copied() ? 'tablerCheck' : 'tablerCopy'"
              size="1.2rem"
              aria-hidden="true"
            />
          </button>
          <span role="status" class="text-sm text-ink-muted">{{ status() }}</span>
        } @else {
          <span class="text-sm text-ink-muted">{{ c.noScript }}</span>
        }
      </li>
      <li class="flex items-center gap-3">
        <ng-icon
          name="tablerBrandLinkedin"
          size="1.5rem"
          class="flex-none text-queue"
          aria-hidden="true"
        />
        <span class="sr-only">{{ c.linkedin }}:</span>
        <a [href]="profile.links.linkedin" class="break-all">{{
          display(profile.links.linkedin)
        }}</a>
      </li>
      <li class="flex items-center gap-3">
        <ng-icon
          name="tablerBrandGithub"
          size="1.5rem"
          class="flex-none text-queue"
          aria-hidden="true"
        />
        <span class="sr-only">{{ c.github }}:</span>
        <a [href]="profile.links.github" class="break-all">{{ display(profile.links.github) }}</a>
      </li>
    </ul>
  `,
})
export class Contact {
  protected readonly c = home.contact;
  protected readonly profile = profile;
  protected readonly email = signal<string | null>(null);
  protected readonly status = signal('');
  protected readonly copied = signal(false);

  constructor() {
    // Browser only: the address never exists in the prerendered HTML.
    afterNextRender(() => this.email.set([...profile.emailReversed].reverse().join('')));
  }

  /** Show links without the protocol and "www." noise. */
  protected display(url: string): string {
    return url.replace(/^https?:\/\/(www\.)?/, '');
  }

  protected async copy(address: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(address);
      this.copied.set(true);
      this.status.set(this.c.copied);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      this.status.set(this.c.copyFailed);
    }
  }
}
