import { Injectable, Signal, signal } from '@angular/core';

/** A signal that tracks a media query. Always false during prerendering. */
export function mediaQuery(query: string): Signal<boolean> {
  if (typeof matchMedia === 'undefined') return signal(false);
  const mql = matchMedia(query);
  const matches = signal(mql.matches);
  mql.addEventListener('change', (e) => matches.set(e.matches));
  return matches.asReadonly();
}

@Injectable({ providedIn: 'root' })
export class Motion {
  readonly reduced = mediaQuery('(prefers-reduced-motion: reduce)');
}
