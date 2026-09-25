import { Component, computed, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerPlayerPause, tablerPlayerPlay } from '@ng-icons/tabler-icons';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Motion } from '../../core/media';
import { topicText } from '../../../content/demos';
import { QueueModel } from '../queue-sim/queue-model';
import { injectFrames } from '../sim-loop';

const PUBLISH_EVERY = 0.6;
const DOTS = 12;

interface Row {
  name: string;
  workers: number;
  dots: number[];
  more: number;
  waiting: number;
  done: number;
  progress: number[];
}

/** One topic, three subscriptions: each subscription is its own queue with its own consumers. */
@Component({
  selector: 'app-topic-fanout',
  imports: [NgIcon],
  viewProviders: [provideIcons({ tablerPlayerPause, tablerPlayerPlay })],
  template: `
    <h3 class="text-lg">{{ t.heading }}</h3>
    <p class="measure mt-1">{{ t.intro }}</p>
    <div class="mt-4 flex flex-wrap items-center gap-4">
      <button type="button" class="btn" (click)="paused.set(!paused())">
        <ng-icon [name]="paused() ? 'tablerPlayerPlay' : 'tablerPlayerPause'" size="1.1rem" aria-hidden="true" />
        {{ paused() ? t.play : t.pause }}
      </button>
      <p class="font-semibold">{{ t.published(published()) }}</p>
    </div>
    <ul class="mt-4 divide-y divide-rule border-y border-rule">
      @for (row of rows(); track row.name) {
        <li class="grid items-center gap-3 py-4 sm:grid-cols-[9rem_minmax(0,1fr)_auto_7rem] sm:gap-5">
          <div>
            <p class="font-semibold">{{ row.name }}</p>
            <p class="text-sm text-ink-muted">{{ t.consumers(row.workers) }}</p>
          </div>
          <div class="flex min-h-6 items-center gap-1 overflow-hidden" aria-hidden="true">
            @for (d of row.dots; track d) {
              <span class="h-3 w-6 flex-none rounded-full bg-queue"></span>
            }
            @if (row.more) {
              <span class="text-sm text-ink-muted">+{{ row.more }}</span>
            }
          </div>
          <div class="flex gap-1.5" aria-hidden="true">
            @for (p of row.progress; track $index) {
              <span class="relative h-6 w-10 overflow-hidden rounded border-[1.5px] border-ink-muted">
                <span class="absolute inset-y-0 left-0 bg-signal" [style.width.%]="p"></span>
              </span>
            }
          </div>
          <p class="text-sm">
            <span class="font-bold">{{ row.waiting }}</span> {{ t.waiting }},
            <span class="font-bold">{{ row.done }}</span> {{ t.done }}
          </p>
        </li>
      }
    </ul>
  `,
})
export class TopicFanout {
  protected readonly t = topicText;
  protected readonly paused = signal(inject(Motion).reduced());
  protected readonly published = signal(0);
  protected readonly rows = signal<Row[]>([]);

  private readonly subs = this.t.subscriptions.map(
    (s, i) =>
      new QueueModel('event', {
        arrivalRate: 0,
        serviceTime: s.serviceTime,
        failureRate: 0.05,
        seed: 21 + i,
        workers: s.workers,
      }),
  );
  private sincePublish = 0;
  private sinceRender = 0;

  constructor() {
    if (this.paused()) for (let i = 0; i < 600; i++) this.step(1 / 30);
    this.render();

    injectFrames(computed(() => !this.paused()))
      .pipe(takeUntilDestroyed())
      .subscribe((dt) => {
        this.step(dt);
        this.sinceRender += dt;
        if (this.sinceRender >= 0.1) this.render();
      });
  }

  private step(dt: number): void {
    this.sincePublish += dt;
    if (this.sincePublish >= PUBLISH_EVERY) {
      this.sincePublish -= PUBLISH_EVERY;
      for (const sub of this.subs) sub.enqueue();
      this.published.update((n) => n + 1);
    }
    for (const sub of this.subs) sub.step(dt);
  }

  private render(): void {
    this.sinceRender = 0;
    this.rows.set(
      this.subs.map((m, i) => ({
        name: this.t.subscriptions[i].name,
        workers: m.workers.length,
        dots: Array.from({ length: Math.min(m.queue.length, DOTS) }, (_, j) => j),
        more: Math.max(0, m.queue.length - DOTS),
        waiting: m.queue.length,
        done: m.completed,
        progress: m.workers.map((w) => (w.msg ? 100 * (1 - Math.max(0, w.remaining) / w.total) : 0)),
      })),
    );
  }
}
