import { DOCUMENT, Injectable, computed, inject, signal } from '@angular/core';
import { mediaQuery } from './media';

type ThemeName = 'light' | 'dark';

/**
 * Follows prefers-color-scheme until the visitor picks a theme, then remembers the pick.
 * The inline script in index.html applies the saved choice before first paint.
 */
@Injectable({ providedIn: 'root' })
export class Theme {
  private readonly root = inject(DOCUMENT).documentElement;
  private readonly systemDark = mediaQuery('(prefers-color-scheme: dark)');
  private readonly chosen = signal<ThemeName | null>(
    this.root.getAttribute('data-theme') as ThemeName | null,
  );

  readonly current = computed<ThemeName>(
    () => this.chosen() ?? (this.systemDark() ? 'dark' : 'light'),
  );

  toggle(): void {
    const next: ThemeName = this.current() === 'dark' ? 'light' : 'dark';
    this.chosen.set(next);
    this.root.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Storage blocked (private mode): the choice lasts for this page view only.
    }
  }
}
