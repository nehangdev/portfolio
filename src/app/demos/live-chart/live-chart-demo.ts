import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  DOCUMENT,
  afterNextRender,
  inject,
} from '@angular/core';
import { SciChartPanel } from './scichart-panel';

export const ELEMENT_SRC = '/elements/live-chart.js';

/**
 * Uses the built <nehang-live-chart> element exactly as any other page would:
 * a module script and a tag. The Angular component behind it is never imported here.
 */
@Component({
  selector: 'app-live-chart-demo',
  imports: [SciChartPanel],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <nehang-live-chart
      class="live-chart"
      window-seconds="60"
      label="Synthetic price"
      seed="7"
    ></nehang-live-chart>
    <app-scichart-panel class="mt-12 block" />
  `,
})
export class LiveChartDemo {
  constructor() {
    const doc = inject(DOCUMENT);
    afterNextRender(() => {
      if (
        customElements.get('nehang-live-chart') ||
        doc.querySelector(`script[src="${ELEMENT_SRC}"]`)
      )
        return;
      const script = doc.createElement('script');
      script.type = 'module';
      script.src = ELEMENT_SRC;
      doc.head.appendChild(script);
    });
  }
}
