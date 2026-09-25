import { Component, ElementRef, afterRenderEffect, computed, inject, input, signal, viewChild } from '@angular/core';
import { animate } from 'motion';
import { Motion } from '../../core/media';
import { CodeBlock } from '../../ui/code-block';
import { SequenceFlowContent, sequenceControls } from '../../../content/demos';

const COL = 100;
const ROW = 26;
const TOP = 16;
const x = (lane: number) => COL / 2 + lane * COL;
const y = (step: number) => TOP + step * ROW;
let nextId = 0;

/**
 * Click- and keyboard-driven sequence diagram. Nothing plays on its own. Steps can carry a code
 * sample (an HTTP request, a token), shown under the diagram while that step is current.
 */
@Component({
  selector: 'app-sequence-flow',
  imports: [CodeBlock],
  template: `
    <figure [attr.aria-label]="flow().figureLabel" class="max-w-[40rem]">
      <div
        class="grid text-center text-sm font-semibold"
        [style.grid-template-columns]="'repeat(' + flow().lifelines.length + ', minmax(0, 1fr))'"
        aria-hidden="true"
      >
        @for (l of flow().lifelines; track l) {
          <p class="px-1">{{ l }}</p>
        }
      </div>
      <svg [attr.viewBox]="'0 0 ' + width() + ' ' + height()" class="mt-2 block h-auto w-full" aria-hidden="true">
        <defs>
          <marker [id]="uid + '-head'" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 10 5 0 10z" style="fill: var(--queue)" />
          </marker>
          <marker [id]="uid + '-past'" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 10 5 0 10z" style="fill: var(--ink-muted)" />
          </marker>
        </defs>
        @for (l of flow().lifelines; track l; let i = $index) {
          <line [attr.x1]="x(i)" [attr.x2]="x(i)" y1="0" [attr.y2]="height()" stroke-dasharray="4 4" vector-effect="non-scaling-stroke" style="stroke: var(--rule)" />
        }
        @for (s of arrows(); track $index; let i = $index) {
          <line
            [attr.x1]="x(s.from)"
            [attr.x2]="x(s.to) + (s.to > s.from ? -4 : 4)"
            [attr.y1]="y(i)"
            [attr.y2]="y(i)"
            vector-effect="non-scaling-stroke"
            [attr.stroke-width]="i === current() ? 2.5 : 1.5"
            [attr.marker-end]="'url(#' + uid + (i === current() ? '-head' : '-past') + ')'"
            [style.stroke]="i === current() ? 'var(--queue)' : 'var(--ink-muted)'"
          />
        }
        <circle #token r="5" cx="0" [attr.cy]="y(current())" [style.transform]="'translateX(' + x(step().to) + 'px)'" style="fill: var(--signal)" />
      </svg>
    </figure>

    <div class="mt-5 min-h-24">
      <p class="text-sm text-ink-muted" aria-live="polite">
        {{ c.stepOf(current() + 1, flow().steps.length) }}: <span class="font-semibold text-ink">{{ step().title }}</span>
      </p>
      <p class="measure mt-1">{{ step().detail }}</p>
    </div>

    @if (step().artifact; as a) {
      <div class="mt-4 max-w-[40rem]">
        <p class="mb-2 text-sm font-semibold">{{ a.label }}</p>
        <app-code-block [code]="a.code" [language]="a.language" [label]="a.label" />
      </div>
    }

    <div class="mt-4 flex flex-wrap gap-3">
      <button type="button" class="btn" [disabled]="current() === 0" (click)="current.set(current() - 1)">{{ c.prev }}</button>
      @if (current() < flow().steps.length - 1) {
        <button type="button" class="btn btn-primary" (click)="current.set(current() + 1)">{{ c.next }}</button>
      } @else {
        <button type="button" class="btn btn-primary" (click)="current.set(0)">{{ c.restart }}</button>
      }
    </div>
  `,
})
export class SequenceFlow {
  readonly flow = input.required<SequenceFlowContent>();

  protected readonly c = sequenceControls;
  protected readonly uid = `seq${nextId++}`;
  protected readonly x = x;
  protected readonly y = y;
  protected readonly width = computed(() => this.flow().lifelines.length * COL);
  protected readonly height = computed(() => y(this.flow().steps.length - 1) + TOP);
  protected readonly current = signal(0);
  protected readonly step = computed(() => this.flow().steps[this.current()]);
  /** Arrows up to and including the current step. */
  protected readonly arrows = computed(() => this.flow().steps.slice(0, this.current() + 1));

  private readonly token = viewChild.required<ElementRef<SVGCircleElement>>('token');
  private readonly reduced = inject(Motion).reduced;

  constructor() {
    afterRenderEffect(() => {
      const s = this.step();
      if (this.reduced()) return;
      animate(
        this.token().nativeElement,
        { transform: [`translateX(${x(s.from)}px)`, `translateX(${x(s.to)}px)`] },
        { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
      );
    });
  }
}
