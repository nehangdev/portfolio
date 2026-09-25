import { Component } from '@angular/core';
import { CodeBlock } from '../../ui/code-block';
import { chartText } from '../../../content/demos';

/** Usage snippet and API table for <nehang-live-chart>. Static, so it works without JavaScript. */
@Component({
  selector: 'app-live-chart-docs',
  imports: [CodeBlock],
  template: `
    <h3 class="text-lg">{{ t.usageHeading }}</h3>
    <p class="measure mt-1">{{ t.usageIntro }}</p>
    <div class="mt-3"><app-code-block [code]="t.usage" language="html" /></div>
    <p class="mt-3"><a href="/work/live-chart/sandbox.html">{{ t.sandbox }}</a></p>

    <h3 class="mt-10 text-lg">{{ t.apiHeading }}</h3>
    <div class="mt-3 overflow-x-auto" tabindex="0" [attr.aria-label]="t.apiHeading">
      <table class="w-full min-w-[36rem] border-collapse text-left">
        <thead>
          <tr class="border-b border-rule text-sm text-ink-muted">
            @for (c of t.apiColumns; track c) {
              <th scope="col" class="py-2 pr-4 font-semibold">{{ c }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of t.api; track row[0]) {
            <tr class="border-b border-rule align-top">
              <td class="py-2 pr-4 font-mono text-sm">{{ row[0] }}</td>
              <td class="py-2 pr-4 text-sm text-ink-muted">{{ row[1] }}</td>
              <td class="py-2 pr-4">{{ row[2] }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class LiveChartDocs {
  protected readonly t = chartText;
}
