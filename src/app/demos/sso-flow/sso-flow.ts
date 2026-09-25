import { Component, ElementRef, afterRenderEffect, computed, inject, signal, viewChild } from '@angular/core';
import { animate } from 'motion';
import { Motion } from '../../core/media';
import { ssoText } from '../../../content/demos';

const COL = 100;
const ROW = 26;
const TOP = 16;
const x = (lane: number) => COL / 2 + lane * COL;
const y = (step: number) => TOP + step * ROW;

/** Click- and keyboard-driven sequence diagram. Nothing plays on its own. */
@Component({
  selector: 'app-sso-flow',
  template: `
    <figure [attr.aria-label]="t.figureLabel" class="max-w-[40rem]">
      <div class="grid grid-cols-4 text-center text-sm font-semibold" aria-hidden="true">
        @for (l of t.lifelines; track l) {
          <p class="px-1">{{ l }}</p>
        }
      </div>
      <svg [attr.viewBox]="'0 0 400 ' + height" class="mt-2 block h-auto w-full" aria-hidden="true">
        <defs>
          <marker id="sso-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 10 5 0 10z" style="fill: var(--queue)" />
          </marker>
          <marker id="sso-head-past" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 10 5 0 10z" style="fill: var(--ink-muted)" />
          </marker>
        </defs>
        @for (l of t.lifelines; track l; let i = $index) {
          <line [attr.x1]="x(i)" [attr.x2]="x(i)" y1="0" [attr.y2]="height" stroke-dasharray="4 4" vector-effect="non-scaling-stroke" style="stroke: var(--rule)" />
        }
        @for (s of arrows(); track $index; let i = $index) {
          <line
            [attr.x1]="x(s.from)"
            [attr.x2]="x(s.to) + (s.to > s.from ? -4 : 4)"
            [attr.y1]="y(i)"
            [attr.y2]="y(i)"
            vector-effect="non-scaling-stroke"
            [attr.stroke-width]="i === current() ? 2.5 : 1.5"
            [attr.marker-end]="i === current() ? 'url(#sso-head)' : 'url(#sso-head-past)'"
            [style.stroke]="i === current() ? 'var(--queue)' : 'var(--ink-muted)'"
          />
        }
        <circle #token r="5" cx="0" [attr.cy]="y(current())" [style.transform]="'translateX(' + x(step().to) + 'px)'" style="fill: var(--signal)" />
      </svg>
    </figure>

    <div class="mt-5 min-h-24">
      <p class="text-sm text-ink-muted" aria-live="polite">
        {{ t.stepOf(current() + 1, t.steps.length) }}: <span class="font-semibold text-ink">{{ step().title }}</span>
      </p>
      <p class="measure mt-1">{{ step().detail }}</p>
    </div>

    <div class="mt-4 flex flex-wrap gap-3">
      <button type="button" class="btn" [disabled]="current() === 0" (click)="go(current() - 1)">{{ t.prev }}</button>
      @if (current() < t.steps.length - 1) {
        <button type="button" class="btn btn-primary" (click)="go(current() + 1)">{{ t.next }}</button>
      } @else {
        <button type="button" class="btn btn-primary" (click)="go(0)">{{ t.restart }}</button>
      }
    </div>
  `,
})
export class SsoFlow {
  protected readonly t = ssoText;
  protected readonly x = x;
  protected readonly y = y;
  protected readonly height = y(ssoText.steps.length - 1) + TOP;
  protected readonly current = signal(0);
  protected readonly step = computed(() => this.t.steps[this.current()]);
  /** Arrows up to and including the current step. */
  protected readonly arrows = computed(() => this.t.steps.slice(0, this.current() + 1));

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

  protected go(i: number): void {
    this.current.set(i);
  }
}
