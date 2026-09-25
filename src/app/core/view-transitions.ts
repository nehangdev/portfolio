import { DOCUMENT, inject } from '@angular/core';
import { ViewTransitionInfo } from '@angular/router';

const INTERRUPTING = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;

/**
 * While a view transition animates, the browser shows snapshots, not the live page, so
 * scrolling looks frozen. End the animation the moment the visitor interacts, and skip it
 * entirely for reduced motion. Runs in an injection context (router's onViewTransitionCreated).
 */
export function interruptibleViewTransition({ transition }: ViewTransitionInfo): void {
  const win = inject(DOCUMENT).defaultView;
  if (!win) return;
  if (win.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    transition.skipTransition();
    return;
  }
  const skip = () => transition.skipTransition();
  for (const type of INTERRUPTING)
    win.addEventListener(type, skip, { capture: true, passive: true, once: true });
  transition.finished.finally(() => {
    for (const type of INTERRUPTING) win.removeEventListener(type, skip, { capture: true });
  });
}
