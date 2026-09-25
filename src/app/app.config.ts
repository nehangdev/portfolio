import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  TitleStrategy,
  provideRouter,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { routes } from './app.routes';
import { SeoTitleStrategy } from './core/seo';
import { provideScrolling } from './core/scrolling';
import { interruptibleViewTransition } from './core/view-transitions';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // Keeps the router's scroll events, but its own scrolling can only jump, so
      // provideScrolling() handles them instead (gliding to anchors on the same page).
      withInMemoryScrolling({ anchorScrolling: 'disabled', scrollPositionRestoration: 'disabled' }),
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: interruptibleViewTransition,
      }),
    ),
    provideClientHydration(),
    { provide: TitleStrategy, useClass: SeoTitleStrategy },
    provideScrolling(),
  ],
};
