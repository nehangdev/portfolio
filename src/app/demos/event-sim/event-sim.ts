import { Component, ElementRef, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Motion } from '../../core/media';
import { Theme } from '../../core/theme';
import { eventSimText } from '../../../content/demos';
import { QueueModel } from '../queue-sim/queue-model';
import { QueueRenderer } from '../queue-sim/queue-renderer';
import { injectFrames } from '../sim-loop';

const SERVICE_TIME = 0.8;

/** The full simulator: live controls for rate, consumers, failures and retries, plus a dead-letter queue. */
@Component({
  selector: 'app-event-sim',
  template: `
    <div class="grid gap-x-8 gap-y-4 sm:grid-cols-3">
      <div class="grid gap-1">
        <div class="flex justify-between gap-2">
          <label for="es-arrival" class="font-semibold">{{ t.controls.arrival }}</label>
          <output for="es-arrival">{{ arrival() }} {{ t.controls.arrivalUnit }}</output>
        </div>
        <input id="es-arrival" type="range" min="0.5" max="8" step="0.5" [value]="arrival()" (input)="setArrival($event)" class="accent-queue" />
      </div>
      <div class="grid gap-1">
        <div class="flex justify-between gap-2">
          <label for="es-consumers" class="font-semibold">{{ t.controls.consumers }}</label>
          <output for="es-consumers">{{ consumers() }}</output>
        </div>
        <input id="es-consumers" type="range" min="1" max="6" step="1" [value]="consumers()" (input)="setConsumers($event)" class="accent-queue" />
      </div>
      <div class="grid gap-1">
        <div class="flex justify-between gap-2">
          <label for="es-failure" class="font-semibold">{{ t.controls.failure }}</label>
          <output for="es-failure">{{ failure() }}%</output>
        </div>
        <input id="es-failure" type="range" min="0" max="40" step="5" [value]="failure()" (input)="setFailure($event)" class="accent-queue" />
      </div>
    </div>

    <div class="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
      <label class="inline-flex min-h-11 cursor-pointer items-center gap-2">
        <input type="checkbox" [checked]="retry()" (change)="setRetry($event)" class="size-5 accent-queue" />
        {{ t.controls.retry }}
      </label>
      <button type="button" class="btn" (click)="paused.set(!paused())">
        {{ paused() ? t.controls.play : t.controls.pause }}
      </button>
      <button type="button" class="btn" (click)="reset()">{{ t.controls.reset }}</button>
    </div>

    <dl class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
      @for (s of statList(); track s.label) {
        <div class="border-l-2 pl-3" [class]="s.tone">
          <dt class="text-sm text-ink-muted">{{ s.label }}</dt>
          <dd class="text-xl font-bold">{{ s.value }}</dd>
        </div>
      }
    </dl>

    <div class="sim-stage h-[22rem]">
      <canvas #canvas role="img" [attr.aria-label]="t.canvasLabel(consumers())" class="block size-full"></canvas>
    </div>
  `,
})
export class EventSim {
  protected readonly t = eventSimText;
  protected readonly arrival = signal(3);
  protected readonly consumers = signal(3);
  protected readonly failure = signal(10);
  protected readonly retry = signal(true);
  protected readonly paused = signal(inject(Motion).reduced());
  private readonly stats = signal({ waiting: 0, processed: 0, dead: 0, rate: '0.0' });

  protected readonly statList = computed(() => {
    const s = this.stats();
    return [
      { label: this.t.stats.waiting, value: s.waiting, tone: 'border-queue' },
      { label: this.t.stats.processed, value: s.processed, tone: 'border-signal' },
      { label: this.t.stats.deadLettered, value: s.dead, tone: 'border-fault' },
      { label: this.t.stats.rate, value: s.rate, tone: 'border-rule' },
    ];
  });

  private readonly theme = inject(Theme);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private renderer: QueueRenderer | null = null;
  private model = this.createModel();
  private sinceStats = 0;

  constructor() {
    // With reduced motion the simulator starts paused, showing a state worth looking at.
    if (this.paused()) for (let i = 0; i < 600; i++) this.model.step(1 / 30);

    effect((onCleanup) => {
      const renderer = new QueueRenderer(this.canvas().nativeElement, this.t.canvasText);
      this.renderer = renderer;
      renderer.draw(this.model, 1);
      untracked(() => this.publishStats());
      onCleanup(() => renderer.destroy());
    });

    effect(() => {
      this.theme.current();
      this.renderer?.readPalette();
    });

    injectFrames(computed(() => !this.paused()))
      .pipe(takeUntilDestroyed())
      .subscribe((dt) => {
        this.model.step(dt);
        this.renderer?.draw(this.model, dt);
        this.sinceStats += dt;
        if (this.sinceStats >= 0.25) this.publishStats();
      });
  }

  protected setArrival(e: Event): void {
    this.arrival.set(+(e.target as HTMLInputElement).value);
    this.model.configure({ arrivalRate: this.arrival() });
  }

  protected setConsumers(e: Event): void {
    this.consumers.set(+(e.target as HTMLInputElement).value);
    this.model.configure({ workers: this.consumers() });
    this.redraw();
  }

  protected setFailure(e: Event): void {
    this.failure.set(+(e.target as HTMLInputElement).value);
    this.model.configure({ failureRate: this.failure() / 100 });
  }

  protected setRetry(e: Event): void {
    this.retry.set((e.target as HTMLInputElement).checked);
    this.model.configure({ maxAttempts: this.retry() ? 3 : 1 });
  }

  protected reset(): void {
    this.model = this.createModel();
    this.renderer?.reset();
    this.redraw();
  }

  private redraw(): void {
    this.renderer?.draw(this.model, 1);
    this.publishStats();
  }

  private publishStats(): void {
    this.sinceStats = 0;
    const m = this.model;
    this.stats.set({
      waiting: m.queue.length,
      processed: m.completed,
      dead: m.deadLettered,
      rate: m.rate.toFixed(1),
    });
  }

  private createModel(): QueueModel {
    return new QueueModel('event', {
      arrivalRate: this.arrival(),
      serviceTime: SERVICE_TIME,
      failureRate: this.failure() / 100,
      seed: 11,
      workers: this.consumers(),
      maxAttempts: this.retry() ? 3 : 1,
    });
  }
}
