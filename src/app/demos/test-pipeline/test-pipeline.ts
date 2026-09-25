import {
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { animate } from 'motion';
import { Motion } from '../../core/media';
import { CodeBlock } from '../../ui/code-block';
import { pipelineSteps, pipelineText } from '../../../content/pipeline-steps';

/** Step-through of the test-generation pipeline. Each phase shows the artefact it produces. */
@Component({
  selector: 'app-test-pipeline',
  imports: [CodeBlock],
  template: `
    <div class="rounded border border-rule bg-paper-raised p-4 sm:p-5">
      <p class="text-sm text-ink-muted">{{ t.scenarioLabel }}</p>
      <p class="measure mt-1 text-lg">“{{ t.scenario }}”</p>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10">
      <ol [attr.aria-label]="t.stepsLabel" class="space-y-1">
        @for (step of steps; track step.title; let i = $index) {
          <li>
            <button
              type="button"
              (click)="current.set(i)"
              [attr.aria-current]="i === current() ? 'step' : null"
              class="flex min-h-11 w-full cursor-pointer items-start gap-3 rounded px-3 py-2 text-left hover:bg-paper-raised aria-[current=step]:bg-ink aria-[current=step]:text-paper"
            >
              <span class="font-bold">{{ i + 1 }}</span>
              <span>{{ step.title }}</span>
            </button>
          </li>
        }
      </ol>

      <div class="min-w-0">
        <p class="sr-only" aria-live="polite">
          {{ t.stepOf(current() + 1, steps.length) }}: {{ step().title }}
        </p>
        <div #panel>
          <h3 class="text-lg">{{ step().title }}</h3>
          <p class="text-ink-muted">{{ step().summary }}</p>
          <p class="mt-5 text-sm font-semibold">{{ step().artifactTitle }}</p>
          @switch (step().artifact.kind) {
            @case ('fields') {
              <dl
                class="mt-2 grid gap-x-5 gap-y-2 border-t border-rule pt-3 sm:grid-cols-[9rem_minmax(0,1fr)]"
              >
                @for (f of fields(); track $index) {
                  <dt class="text-sm text-ink-muted">{{ f.label }}</dt>
                  <dd>{{ f.value }}</dd>
                }
              </dl>
            }
            @case ('cases') {
              <div
                class="mt-2 overflow-x-auto"
                tabindex="0"
                [attr.aria-label]="step().artifactTitle"
              >
                <table class="w-full min-w-[32rem] border-collapse text-left">
                  <thead>
                    <tr class="border-b border-rule text-sm text-ink-muted">
                      @for (c of cases().columns; track c) {
                        <th scope="col" class="py-2 pr-4 font-semibold">{{ c }}</th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of cases().rows; track row[0]) {
                      <tr class="border-b border-rule align-top">
                        @for (cell of row; track $index) {
                          <td class="py-2 pr-4">{{ cell }}</td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
            @case ('code') {
              <div class="mt-2">
                <app-code-block
                  [code]="code().code"
                  [language]="code().lang"
                  [label]="step().artifactTitle"
                />
              </div>
            }
          }
        </div>

        <div class="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            class="btn"
            [disabled]="current() === 0"
            (click)="current.set(current() - 1)"
          >
            {{ t.prev }}
          </button>
          <button
            type="button"
            class="btn btn-primary"
            [disabled]="current() === steps.length - 1"
            (click)="current.set(current() + 1)"
          >
            {{ t.next }}
          </button>
        </div>
      </div>
    </div>
    <p class="mt-6 text-sm text-ink-muted">{{ t.note }}</p>
  `,
})
export class TestPipeline {
  protected readonly t = pipelineText;
  protected readonly steps = pipelineSteps;
  protected readonly current = signal(0);
  protected readonly step = computed(() => this.steps[this.current()]);

  // Narrowed views of the current artefact, for the template.
  protected readonly fields = computed(() => {
    const a = this.step().artifact;
    return a.kind === 'fields' ? a.items : [];
  });
  protected readonly cases = computed(() => {
    const a = this.step().artifact;
    return a.kind === 'cases' ? a : { columns: [], rows: [] };
  });
  protected readonly code = computed(() => {
    const a = this.step().artifact;
    return a.kind === 'code' ? a : { code: '', lang: '' };
  });

  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  private readonly reduced = inject(Motion).reduced;
  private first = true;

  constructor() {
    afterRenderEffect(() => {
      this.current();
      if (this.first) {
        this.first = false;
        return;
      }
      if (!this.reduced()) {
        animate(
          this.panel().nativeElement,
          { opacity: [0, 1], y: [8, 0] },
          { duration: 0.25, ease: 'easeOut' },
        );
      }
    });
  }
}
