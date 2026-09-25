import { Component, input } from '@angular/core';

/** A scrollable, keyboard-focusable code sample. Monospace is used only here. */
@Component({
  selector: 'app-code-block',
  template: `
    <figure class="min-w-0">
      <pre
        tabindex="0"
        [attr.aria-label]="label() || language() + ' code'"
        class="overflow-x-auto rounded border border-rule bg-paper-raised p-4 font-mono text-sm leading-relaxed"
      ><code>{{ code() }}</code></pre>
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
}
