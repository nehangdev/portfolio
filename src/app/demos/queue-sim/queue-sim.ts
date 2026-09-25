import { Component, DOCUMENT, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  EMPTY,
  animationFrames,
  combineLatest,
  distinctUntilChanged,
  fromEvent,
  map,
  pairwise,
  sampleTime,
  share,
  startWith,
  switchMap,
} from 'rxjs';
import { Motion } from '../../core/media';
import { Theme } from '../../core/theme';
import { hero } from '../../../content/pages';
import { Mode, QueueModel } from './queue-model';
import { QueueRenderer } from './queue-renderer';
import { QueueDiagram } from './queue-diagram';

@Component({
  selector: 'app-queue-sim',
  imports: [QueueDiagram],
  template: `
    @if (motion.reduced()) {
      <app-queue-diagram />
    } @else {
      <div class="sim-frame">
        <div class="flex flex-wrap items-center gap-3">
          <div role="group" [attr.aria-label]="t.modeGroup" class="inline-flex rounded-[3px] border-[1.5px] border-ink">
            @for (m of modes; track m) {
              <button
                type="button"
                [attr.aria-pressed]="mode() === m"
                (click)="setMode(m)"
                class="min-h-10 cursor-pointer px-3 font-semibold aria-pressed:bg-ink aria-pressed:text-paper"
              >
                {{ t.modes[m] }}
              </button>
            }
          </div>
          <button type="button" class="btn min-h-10" (click)="paused.set(!paused())">
            {{ paused() ? t.play : t.pause }}
          </button>
          <p class="ml-auto">
            <output class="inline-block min-w-[2.2ch] text-right text-xl font-bold">{{ rate() }}</output>
            <span class="text-sm text-ink-muted"> {{ t.rateUnit }}</span>
          </p>
        </div>
        <div class="sim-stage">
          <canvas #canvas role="img" [attr.aria-label]="t.canvasLabel[mode()]" class="block size-full"></canvas>
        </div>
      </div>
    }
  `,
})
export class QueueSim {
  protected readonly t = hero;
  protected readonly modes: Mode[] = ['sync', 'event'];
  protected readonly motion = inject(Motion);
  protected readonly mode = signal<Mode>('sync');
  protected readonly paused = signal(false);

  private readonly doc = inject(DOCUMENT);
  private readonly theme = inject(Theme);
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private model = new QueueModel('sync');
  private renderer: QueueRenderer | null = null;

  /** Runs only while not paused, motion is allowed, and the tab is visible. */
  private readonly running$ = combineLatest([
    toObservable(this.paused),
    toObservable(this.motion.reduced),
    fromEvent(this.doc, 'visibilitychange').pipe(
      startWith(null),
      map(() => this.doc.visibilityState === 'visible'),
    ),
  ]).pipe(
    map(([paused, reduced, visible]) => !paused && !reduced && visible),
    distinctUntilChanged(),
  );

  /** Seconds since the previous frame, capped so a stalled frame can't jump the simulation. */
  private readonly frames$ = this.running$.pipe(
    switchMap((running) =>
      running
        ? animationFrames().pipe(
            map((f) => f.elapsed),
            startWith(0),
            pairwise(),
            map(([a, b]) => Math.min((b - a) / 1000, 0.1)),
          )
        : EMPTY,
    ),
    share(),
  );

  protected readonly rate = toSignal(
    this.frames$.pipe(
      sampleTime(250),
      map(() => this.model.rate.toFixed(1)),
    ),
    { initialValue: '0.0' },
  );

  constructor() {
    effect((onCleanup) => {
      const el = this.canvas()?.nativeElement;
      if (!el) return;
      const renderer = new QueueRenderer(el, this.t.canvasText);
      this.renderer = renderer;
      onCleanup(() => {
        renderer.destroy();
        this.renderer = null;
      });
    });

    effect(() => {
      this.theme.current();
      this.renderer?.readPalette();
    });

    this.frames$.pipe(takeUntilDestroyed()).subscribe((dt) => {
      this.model.step(dt);
      this.renderer?.draw(this.model, dt);
    });
  }

  protected setMode(mode: Mode): void {
    if (mode === this.mode()) return;
    this.mode.set(mode);
    this.model = new QueueModel(mode);
    this.renderer?.reset();
    this.renderer?.draw(this.model, 0);
  }
}
