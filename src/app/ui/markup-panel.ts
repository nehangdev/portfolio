import { Component, input } from '@angular/core';

/**
 * Prose shown the way it would look in a code editor: a file tab, line numbers, and each
 * paragraph wrapped in syntax-coloured HTML tags. Only the paragraphs are real content;
 * the tags, gutter and tab are decoration and hidden from assistive technology.
 * Wrapped prose lines soft-wrap without new line numbers, as an editor does.
 */
@Component({
  selector: 'app-markup-panel',
  template: `
    <figure class="editor">
      <div class="editor-tab" aria-hidden="true">{{ file() }}</div>
      <div class="editor-body">
        <div class="editor-row" aria-hidden="true">
          <span class="editor-ln"></span>
          <span
            ><span class="syn-punct">&lt;</span><span class="syn-tag">{{ tag() }}</span>
            @for (a of attrs(); track a[0]) {
              <!-- Angular drops whitespace between elements, so the space is explicit. -->
              {{ ' ' }}<span class="syn-attr">{{ a[0] }}</span><span class="syn-punct">=</span
              ><span class="syn-string">"{{ a[1] }}"</span>
            }<span class="syn-punct">&gt;</span></span
          >
        </div>
        @for (p of paragraphs(); track $index) {
          <div class="editor-row" aria-hidden="true">
            <span class="editor-ln"></span>
            <span class="pl-[2ch]"
              ><span class="syn-punct">&lt;</span><span class="syn-tag">p</span><span class="syn-punct">&gt;</span></span
            >
          </div>
          <div class="editor-row">
            <span class="editor-ln" aria-hidden="true"></span>
            <p class="editor-text">{{ p }}</p>
          </div>
          <div class="editor-row" aria-hidden="true">
            <span class="editor-ln"></span>
            <span class="pl-[2ch]"
              ><span class="syn-punct">&lt;/</span><span class="syn-tag">p</span><span class="syn-punct">&gt;</span></span
            >
          </div>
        }
        <div class="editor-row" aria-hidden="true">
          <span class="editor-ln"></span>
          <span
            ><span class="syn-punct">&lt;/</span><span class="syn-tag">{{ tag() }}</span
            ><span class="syn-punct">&gt;</span></span
          >
        </div>
      </div>
    </figure>
  `,
})
export class MarkupPanel {
  readonly file = input.required<string>();
  readonly tag = input('section');
  readonly attrs = input<[string, string][]>([]);
  readonly paragraphs = input.required<string[]>();
}
