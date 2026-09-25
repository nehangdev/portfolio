import { Component, afterNextRender, signal } from '@angular/core';
import { home } from '../../../content/pages';
import { profile } from '../../../content/profile';

@Component({
  selector: 'app-contact',
  template: `
    <p class="measure text-lg">{{ c.lead }}</p>
    <dl class="mt-6 grid grid-cols-[6rem_minmax(0,1fr)] gap-y-4">
      <dt class="font-semibold">{{ c.emailLabel }}</dt>
      <dd class="flex flex-wrap items-center gap-x-4 gap-y-2">
        @if (email(); as address) {
          <a [href]="'mailto:' + address" class="break-all">{{ address }}</a>
          <button type="button" class="btn text-sm" (click)="copy(address)">{{ c.copy }}</button>
          <span role="status" class="text-sm text-ink-muted">{{ status() }}</span>
        } @else {
          <span class="text-sm text-ink-muted">{{ c.noScript }}</span>
        }
      </dd>
      <dt class="font-semibold">{{ c.linkedin }}</dt>
      <dd><a [href]="profile.links.linkedin" class="break-all">{{ profile.links.linkedin }}</a></dd>
      <dt class="font-semibold">{{ c.github }}</dt>
      <dd><a [href]="profile.links.github" class="break-all">{{ profile.links.github }}</a></dd>
    </dl>
  `,
})
export class Contact {
  protected readonly c = home.contact;
  protected readonly profile = profile;
  protected readonly email = signal<string | null>(null);
  protected readonly status = signal('');

  constructor() {
    // Browser only: the address never exists in the prerendered HTML.
    afterNextRender(() => this.email.set([...profile.emailReversed].reverse().join('')));
  }

  protected async copy(address: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(address);
      this.status.set(this.c.copied);
    } catch {
      this.status.set(this.c.copyFailed);
    }
  }
}
