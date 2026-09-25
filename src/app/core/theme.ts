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
    const apply = () => {
      this.chosen.set(next);
      this.root.setAttribute('data-theme', next);
      try {
        localStorage.setItem('theme', next);
      } catch {
        // Storage blocked (private mode): the choice lasts for this page view only.
      }
    };
    // Cross-fade every colour at once (canvas included) with a view transition; the
    // `theme-switching` class gives it its own, slightly longer timing (base.css).
    const doc = this.root.ownerDocument;
    const reduced = doc.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!doc.startViewTransition || reduced) {
      apply();
      return;
    }
    this.root.classList.add('theme-switching');
    doc
      .startViewTransition(apply)
      .finished.finally(() => this.root.classList.remove('theme-switching'));
  }
}
