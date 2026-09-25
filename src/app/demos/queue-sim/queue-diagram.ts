import { Component } from '@angular/core';
import { hero } from '../../../content/pages';

/**
 * Static before/after picture of the simulation. Used as the prerendered placeholder,
 * the no-JavaScript view, and the reduced-motion view. Same outer size as the live
 * simulation so swapping one for the other causes no layout shift.
 */
@Component({
  selector: 'app-queue-diagram',
  template: `
    <figure class="sim-frame">
      <figcaption class="flex min-h-10 items-center font-semibold">{{ d.label }}</figcaption>
      <div class="sim-stage grid content-center gap-6 p-4 sm:grid-cols-2 sm:gap-10 sm:p-6">
        <div>
          <p class="font-semibold">{{ d.syncTitle }}</p>
          <p class="text-sm text-ink-muted">{{ d.syncBody }}</p>
          <div aria-hidden="true" class="mt-3 flex items-center gap-1.5">
            @for (i of pile; track i) {
              <span class="h-4 w-8 rounded-full bg-queue"></span>
            }
            <span class="h-px w-4 flex-none bg-rule"></span>
            <span class="rounded-md border-[1.5px] border-ink-muted p-1.5"
              ><span class="block h-4 w-8 rounded-full bg-queue"></span
            ></span>
          </div>
        </div>
        <div>
          <p class="font-semibold">{{ d.eventTitle }}</p>
          <p class="text-sm text-ink-muted">{{ d.eventBody }}</p>
          <div aria-hidden="true" class="mt-3 flex items-center gap-1.5">
            <span class="h-4 w-8 rounded-full bg-queue"></span>
            <span class="h-4 w-8 rounded-full bg-queue outline-2 outline-fault"></span>
            <span class="h-px w-4 flex-none bg-rule"></span>
            @for (i of workers; track i) {
              <span class="rounded-md border-[1.5px] border-ink-muted p-1.5"
                ><span
                  class="block h-4 w-8 rounded-full"
                  [class]="i === 2 ? 'bg-signal' : 'bg-queue'"
                ></span
              ></span>
            }
          </div>
        </div>
      </div>
    </figure>
  `,
})
export class QueueDiagram {
  protected readonly d = hero.diagram;
  protected readonly pile = [1, 2, 3, 4, 5];
  protected readonly workers = [1, 2, 3];
}
