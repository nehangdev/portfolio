import { Component, computed, input } from '@angular/core';

/** A page section on the lane grid: heading in the narrow lane, content in the wide one. */
@Component({
  selector: 'section[appLane]',
  host: { class: 'lanes', '[attr.aria-labelledby]': 'headingId()' },
  template: `
    <h2 [id]="headingId()" class="text-xl">{{ heading() }}</h2>
    <div class="min-w-0"><ng-content /></div>
  `,
})
export class Lane {
  readonly heading = input.required<string>();
  protected readonly headingId = computed(
    () => 'h-' + this.heading().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  );
}
