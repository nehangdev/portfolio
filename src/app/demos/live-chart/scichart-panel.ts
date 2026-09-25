import { Component, DOCUMENT, DestroyRef, ElementRef, Injector, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { Theme } from '../../core/theme';
import { sciChartText } from '../../../content/demos';

/** jsDelivr, pinned to the major version so the community build stays inside its 6-month window. */
const SCICHART_SRC = 'https://cdn.jsdelivr.net/npm/scichart@6/index.min.js';
const SERIES = 5;
const CAPACITY = 200_000;
const PER_FRAME = 500;

// SciChart ships as a global when loaded from the CDN; only the members used here are typed.
type SciChartGlobal = any;
declare global {
  interface Window {
    SciChart?: SciChartGlobal;
  }
}

type State = 'idle' | 'loading' | 'running' | 'failed';

/** Opt-in SciChart demo. Nothing from SciChart is downloaded until the button is pressed. */
@Component({
  selector: 'app-scichart-panel',
  template: `
    <h3 class="text-lg">{{ t.heading }}</h3>
    <p class="measure mt-1">{{ t.body }}</p>
    <p class="measure mt-2 text-sm text-ink-muted">{{ t.note }}</p>

    <div class="mt-4 flex flex-wrap items-center gap-4">
      @switch (state()) {
        @case ('loading') {
          <p role="status">{{ t.loading }}</p>
        }
        @case ('running') {
          <button type="button" class="btn" (click)="stop()">{{ t.stop }}</button>
          <p role="status" class="font-semibold">{{ t.points(points()) }}</p>
        }
        @default {
          <button type="button" class="btn btn-primary" (click)="load()">{{ t.load }}</button>
          @if (state() === 'failed') {
            <p role="alert" class="text-fault">{{ t.failed }}</p>
          }
        }
      }
    </div>

    @if (state() === 'loading' || state() === 'running') {
      <div animate.enter="enter-fade" animate.leave="leave-fade" class="mt-4 overflow-hidden rounded border border-rule">
        <div #surface class="h-80 w-full"></div>
      </div>
    }
  `,
})
export class SciChartPanel {
  protected readonly t = sciChartText;
  protected readonly state = signal<State>('idle');
  protected readonly points = signal(0);

  private readonly doc = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly theme = inject(Theme);
  private readonly surfaceEl = viewChild<ElementRef<HTMLDivElement>>('surface');
  private surface: { delete(): void } | null = null;
  private frame = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  protected async load(): Promise<void> {
    this.state.set('loading');
    try {
      const S = await this.loadScript();
      await new Promise<void>((resolve) => afterNextRender(() => resolve(), { injector: this.injector }));
      const host = this.surfaceEl()?.nativeElement;
      if (!host || this.state() !== 'loading') return;
      await this.start(S, host);
      this.state.set('running');
    } catch (err) {
      console.error(err);
      this.stop();
      this.state.set('failed');
    }
  }

  protected stop(): void {
    cancelAnimationFrame(this.frame);
    this.surface?.delete();
    this.surface = null;
    if (this.state() !== 'failed') this.state.set('idle');
  }

  private loadScript(): Promise<SciChartGlobal> {
    if (this.doc.defaultView?.SciChart) return Promise.resolve(this.doc.defaultView.SciChart);
    return new Promise((resolve, reject) => {
      const script = this.doc.createElement('script');
      script.src = SCICHART_SRC;
      script.crossOrigin = 'anonymous';
      const timer = setTimeout(() => reject(new Error('SciChart load timed out')), 20_000);
      script.onload = () => {
        clearTimeout(timer);
        const S = this.doc.defaultView?.SciChart;
        if (S) resolve(S);
        else reject(new Error('SciChart global missing'));
      };
      script.onerror = () => {
        clearTimeout(timer);
        script.remove();
        reject(new Error('SciChart failed to load'));
      };
      this.doc.head.appendChild(script);
    });
  }

  private async start(S: SciChartGlobal, host: HTMLDivElement): Promise<void> {
    S.SciChartSurface.UseCommunityLicense?.();
    const dark = this.theme.current() === 'dark';
    const Theme = dark ? S.SciChartJsNavyTheme : S.SciChartJSLightTheme;
    const { sciChartSurface, wasmContext } = await S.SciChartSurface.create(host, {
      theme: Theme ? new Theme() : undefined,
    });
    this.surface = sciChartSurface;
    sciChartSurface.xAxes.add(new S.NumericAxis(wasmContext, { autoRange: S.EAutoRange.Always }));
    sciChartSurface.yAxes.add(new S.NumericAxis(wasmContext, { autoRange: S.EAutoRange.Always }));

    const colors = ['#1f6f78', '#d99a1e', '#b8412f', '#5fb3bc', '#8a94a3'];
    const series = Array.from({ length: SERIES }, (_, i) => {
      const dataSeries = new S.XyDataSeries(wasmContext, {
        fifoCapacity: CAPACITY,
        isSorted: true,
        containsNaN: false,
      });
      sciChartSurface.renderableSeries.add(
        new S.FastLineRenderableSeries(wasmContext, { dataSeries, stroke: colors[i], strokeThickness: 1.5 }),
      );
      return { dataSeries, y: i * 10 };
    });

    let x = 0;
    let lastReport = 0;
    const xs = new Float64Array(PER_FRAME);
    const ys = new Float64Array(PER_FRAME);
    const tick = (now: number) => {
      for (const s of series) {
        for (let i = 0; i < PER_FRAME; i++) {
          xs[i] = x + i;
          s.y += Math.random() - 0.5;
          ys[i] = s.y;
        }
        s.dataSeries.appendRange(xs, ys);
      }
      x += PER_FRAME;
      if (now - lastReport > 250) {
        lastReport = now;
        this.points.set(series.reduce((n, s) => n + s.dataSeries.count(), 0));
      }
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }
}
