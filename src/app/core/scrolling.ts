import { ViewportScroller } from '@angular/common';
import { DOCUMENT, inject, provideAppInitializer } from '@angular/core';
import { NavigationEnd, NavigationSkipped, Router, Scroll } from '@angular/router';
import { SmoothScroll } from './smooth-scroll';

/**
 * Scroll handling after navigation. The router's own anchor and restore scrolling are switched
 * off (app.config.ts) because it can only jump; this takes over:
 * - back/forward: restore the saved position instantly;
 * - a #fragment on the page you are already on ("Work", the breadcrumb): glide to it;
 *   the skip link's #main still jumps, as keyboard users expect;
 * - a #fragment on another page: jump straight there once it renders;
 * - any other navigation: start at the top, instantly.
 */
export function provideScrolling() {
  return provideAppInitializer(() => {
    const router = inject(Router);
    const viewport = inject(ViewportScroller);
    const smooth = inject(SmoothScroll);
    const doc = inject(DOCUMENT);
    viewport.setOffset([0, smooth.offset]);
    viewport.setHistoryScrollRestoration('manual');

    const pathOf = (url: string) => url.split(/[?#]/)[0];
    let currentPath = pathOf(router.url);
    const cameFrom = new Map<number, string>();

    router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        cameFrom.set(e.id, currentPath);
        currentPath = pathOf(e.urlAfterRedirects);
        return;
      }
      if (!(e instanceof Scroll)) return;
      if (e.position) {
        viewport.scrollToPosition(e.position, { behavior: 'instant' });
        return;
      }
      if (!e.anchor) {
        viewport.scrollToPosition([0, 0], { behavior: 'instant' });
        return;
      }
      const target = doc.getElementById(e.anchor);
      const samePage =
        e.routerEvent instanceof NavigationSkipped ||
        cameFrom.get(e.routerEvent.id) === currentPath;
      if (target && samePage && e.anchor !== 'main') void smooth.toElement(target);
      else viewport.scrollToAnchor(e.anchor, { behavior: 'instant' });
    });
  });
}
