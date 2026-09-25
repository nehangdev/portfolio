import { Component, computed, input } from '@angular/core';
import { highlight } from './highlight';

/** A scrollable, keyboard-focusable code sample, syntax-coloured with Prism. */
@Component({
  selector: 'app-code-block',
  template: `
    <figure class="min-w-0">
      <pre
        tabindex="0"
        [attr.aria-label]="label() || language() + ' code'"
        class="code overflow-x-auto rounded border border-rule bg-paper-raised p-4 font-mono text-sm leading-relaxed"
      ><code [innerHTML]="highlighted()"></code></pre>
      @if (caption()) {
        <figcaption class="mt-2 text-sm text-ink-muted">{{ caption() }}</figcaption>
      }
    </figure>
  `,
})
export class CodeBlock {
  readonly code = input.required<string>();
  readonly language = input('');
  readonly caption = input('');
  readonly label = input('');
  protected readonly highlighted = computed(() => highlight(this.code(), this.language()));
}
