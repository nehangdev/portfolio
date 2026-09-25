import { provideZonelessChangeDetection } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { LiveChart } from './live-chart';

// Registers <nehang-live-chart>. Safe to load more than once.
createApplication({ providers: [provideZonelessChangeDetection()] })
  .then((app) => {
    if (!customElements.get('nehang-live-chart')) {
      customElements.define('nehang-live-chart', createCustomElement(LiveChart, { injector: app.injector }));
    }
  })
  .catch((err) => console.error(err));
