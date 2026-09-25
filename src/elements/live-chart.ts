import {
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  booleanAttribute,
  computed,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { EMPTY, animationFrames, combineLatest, distinctUntilChanged, fromEvent, interval, map, shareReplay, startWith, switchMap } from 'rxjs';

const HZ = 10;
const MAX_SECONDS = 300;
const CAP = HZ * MAX_SECONDS;
const WINDOWS = [
  { s: 30, label: '30s' },
  { s: 60, label: '1m' },
  { s: 300, label: '5m' },
];
const PAD = { top: 12, right: 64, bottom: 24, left: 10 };

/**
 * <nehang-live-chart>: a streaming price chart drawn by hand on a canvas.
 * Built with Angular Elements; the host page needs no framework.
 */
@Component({
  selector: 'nehang-live-chart',
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="toolbar" part="toolbar">
      <span class="label">{{ label() }}</span>
      <span class="price">{{ lastText() }}</span>
      <span class="change">{{ changeText() }}</span>
      <span class="spacer"></span>
      <div class="windows" role="group" aria-label="Time window">
        @for (w of windows; track w.s) {
          <button type="button" [attr.aria-pressed]="currentWindow() === w.s" (click)="setWindow(w.s)">
            {{ w.label }}
          </button>
        }
      </div>
      <button type="button" (click)="toggle()">{{ isPaused() ? 'Resume' : 'Pause' }}</button>
    </div>
    <div class="plot" part="plot">
      <canvas
        #canvas
        tabindex="0"
        role="img"
        [attr.aria-label]="summary()"
        (pointermove)="hover($event)"
        (pointerleave)="setCursor(null)"
        (keydown)="key($event)"
        (blur)="setCursor(null)"
      ></canvas>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      font-family: var(--nlc-font, inherit);
      font-size: 14px;
      line-height: 1.4;
      color: var(--nlc-fg, #16202e);
      background: var(--nlc-bg, #f3f6f8);
      border: 1px solid var(--nlc-grid, #b9c3ca);
      border-radius: 4px;
      overflow: hidden;
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem 0.9rem;
      padding: 0.55rem 0.75rem;
      border-bottom: 1px solid var(--nlc-grid, #b9c3ca);
    }
    .label { font-weight: 600; }
    .price { font-weight: 700; font-size: 1.15em; }
    .change { color: var(--nlc-muted, #4a5868); }
    .spacer { flex: 1; }
    .windows { display: inline-flex; gap: 0.25rem; }
    button {
      font: inherit;
      font-weight: 600;
      color: inherit;
      background: transparent;
      border: 1.5px solid currentColor;
      border-radius: 3px;
      min-height: 2.25rem;
      min-width: 2.75rem;
      padding: 0.2rem 0.65rem;
      cursor: pointer;
    }
    button[aria-pressed='true'] {
      background: var(--nlc-fg, #16202e);
      color: var(--nlc-bg, #f3f6f8);
    }
    button:focus-visible,
    canvas:focus-visible {
      outline: 2px solid var(--nlc-line, #1f6f78);
      outline-offset: 2px;
    }
    .plot { flex: 1; min-height: 12rem; position: relative; }
    canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; touch-action: pan-y; }
  `,
})
export class LiveChart {
  readonly windowSeconds = input(60, { transform: numberAttribute });
  readonly label = input('Synthetic price');
  readonly paused = input(false, { transform: booleanAttribute });
  readonly seed = input(42, { transform: numberAttribute });
  readonly pausechange = output<boolean>();

  protected readonly windows = WINDOWS;
  private readonly doc = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly reduced = this.doc.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches ?? false;

  private readonly userPaused = signal<boolean | null>(null);
  protected readonly isPaused = computed(() => this.userPaused() ?? (this.paused() || this.reduced));
  private readonly chosenWindow = signal<number | null>(null);
  protected readonly currentWindow = computed(
    () => this.chosenWindow() ?? (WINDOWS.some((w) => w.s === this.windowSeconds()) ? this.windowSeconds() : 60),
  );

  // Ring buffer of simulated time (seconds) and price.
  private readonly times = new Float64Array(CAP);
  private readonly prices = new Float64Array(CAP);
  private head = 0;
  private count = 0;
  private clock = 0;
  private lastTickAt = 0;
  private random = Math.random;

  private readonly last = signal(0);
  private readonly announced = signal(0);
  protected readonly lastText = computed(() => this.last().toFixed(2));
  protected readonly changeText = computed(() => {
    // Read the signals first: a read skipped by a branch would never become a dependency.
    const last = this.last();
    const win = this.currentWindow();
    const first = this.priceAt(this.clock - win);
    const pct = first ? ((last - first) / first) * 100 : 0;
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}% over ${WINDOWS.find((w) => w.s === win)?.label}`;
  });
  protected readonly summary = computed(
    () => `${this.label()} chart, last price ${this.announced().toFixed(2)}. Arrow keys move the crosshair.`,
  );

  /** True while not paused and the tab is visible. */
  private readonly running$ = combineLatest([
    toObservable(this.isPaused),
    fromEvent(this.doc, 'visibilitychange').pipe(
      startWith(null),
      map(() => this.doc.visibilityState === 'visible'),
    ),
  ]).pipe(
    map(([paused, visible]) => !paused && visible),
    distinctUntilChanged(),
    // Replay: both subscribers attach after the first value, which arrives synchronously.
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /** Crosshair position as seconds before "now", so it holds still while data streams. */
  private cursor: number | null = null;
  private w = 0;
  private h = 0;

  constructor() {
    afterNextRender(() => {
      this.random = seeded(this.seed());
      this.prefill();
      const el = this.canvas().nativeElement;
      const ro = new ResizeObserver(() => this.resize());
      ro.observe(el);
      this.resize();

      // Price ticks: an RxJS stream of synthetic values at 10 Hz.
      this.running$
        .pipe(
          switchMap((run) => (run ? interval(1000 / HZ) : EMPTY)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(() => this.tick());
      // Drawing: once per animation frame while running.
      this.running$
        .pipe(
          switchMap((run) => (run ? animationFrames() : EMPTY)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(() => this.draw());

      // Redraw when the page theme changes (OS preference or a data-theme attribute).
      const scheme = this.doc.defaultView?.matchMedia('(prefers-color-scheme: dark)');
      const redraw = () => requestAnimationFrame(() => this.draw());
      scheme?.addEventListener('change', redraw);
      const mo = new MutationObserver(redraw);
      mo.observe(this.doc.documentElement, { attributes: true });
      this.destroyRef.onDestroy(() => {
        ro.disconnect();
        mo.disconnect();
        scheme?.removeEventListener('change', redraw);
      });
    });
  }

  protected toggle(): void {
    this.userPaused.set(!this.isPaused());
    this.pausechange.emit(this.isPaused());
    this.draw();
  }

  protected setWindow(s: number): void {
    this.chosenWindow.set(s);
    this.draw();
  }

  protected setCursor(secondsAgo: number | null): void {
    this.cursor = secondsAgo;
    this.draw();
  }

  protected hover(e: PointerEvent): void {
    const plotW = this.w - PAD.left - PAD.right;
    const fx = (e.offsetX - PAD.left) / plotW;
    this.setCursor(fx < 0 || fx > 1 ? null : (1 - fx) * this.currentWindow());
  }

  protected key(e: KeyboardEvent): void {
    const win = this.currentWindow();
    const stepS = e.shiftKey ? win / 6 : win / 60;
    const at = this.cursor ?? 0;
    const next: Record<string, number | null> = {
      ArrowLeft: Math.min(win, at + stepS),
      ArrowRight: Math.max(0, at - stepS),
      Home: win,
      End: 0,
      Escape: null,
    };
    if (!(e.key in next)) return;
    e.preventDefault();
    this.setCursor(next[e.key]);
  }

  private prefill(): void {
    let price = 100;
    for (let i = 0; i < CAP; i++) {
      price = this.walk(price);
      this.push(i / HZ, price);
    }
    this.clock = (CAP - 1) / HZ;
    this.lastTickAt = performance.now();
    this.last.set(price);
    this.announced.set(price);
  }

  private tick(): void {
    this.clock += 1 / HZ;
    const price = this.walk(this.last());
    this.push(this.clock, price);
    this.lastTickAt = performance.now();
    this.last.set(price);
    if (Math.round(this.clock * HZ) % (HZ * 5) === 0) this.announced.set(price);
  }

  private walk(price: number): number {
    return price + (this.random() - 0.5) * 0.35 + (100 - price) * 0.002;
  }

  private push(t: number, p: number): void {
    this.times[this.head] = t;
    this.prices[this.head] = p;
    this.head = (this.head + 1) % CAP;
    this.count = Math.min(this.count + 1, CAP);
  }

  /** Index into the ring for the i-th oldest point. */
  private at(i: number): number {
    return (this.head - this.count + i + CAP) % CAP;
  }

  private priceAt(t: number): number {
    for (let i = 0; i < this.count; i++) {
      const j = this.at(i);
      if (this.times[j] >= t) return this.prices[j];
    }
    return 0;
  }

  private resize(): void {
    const el = this.canvas().nativeElement;
    const rect = el.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.w = rect.width;
    this.h = rect.height;
    el.width = Math.round(rect.width * dpr);
    el.height = Math.round(rect.height * dpr);
    el.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.draw();
  }

  private draw(): void {
    const el = this.canvas().nativeElement;
    const ctx = el.getContext('2d')!;
    const { w, h } = this;
    ctx.clearRect(0, 0, w, h);
    if (!w || !h || !this.count) return;

    const css = getComputedStyle(this.host);
    const color = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
    const line = color('--nlc-line', '#1f6f78');
    const grid = color('--nlc-grid', '#b9c3ca');
    const muted = color('--nlc-muted', '#4a5868');
    const fg = color('--nlc-fg', '#16202e');
    const bg = color('--nlc-bg', '#f3f6f8');

    // Scroll smoothly between ticks while running.
    const drift = this.isPaused() ? 0 : Math.min(1 / HZ, (performance.now() - this.lastTickAt) / 1000);
    const now = this.clock + drift;
    const win = this.currentWindow();
    const t0 = now - win;

    let first = 0;
    while (first < this.count - 1 && this.times[this.at(first + 1)] < t0) first++;
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = first; i < this.count; i++) {
      const p = this.prices[this.at(i)];
      lo = Math.min(lo, p);
      hi = Math.max(hi, p);
    }
    const padY = (hi - lo) * 0.12 || 1;
    lo -= padY;
    hi += padY;

    const plotW = w - PAD.left - PAD.right;
    const plotH = h - PAD.top - PAD.bottom;
    const px = (t: number) => PAD.left + ((t - t0) / win) * plotW;
    const py = (p: number) => PAD.top + (1 - (p - lo) / (hi - lo)) * plotH;
    const font = css.fontFamily || 'system-ui, sans-serif';

    // Grid and axis labels.
    ctx.strokeStyle = grid;
    ctx.lineWidth = 1;
    ctx.fillStyle = muted;
    ctx.font = `12px ${font}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) {
      const y = Math.round(PAD.top + (i / 4) * plotH) + 0.5;
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left + plotW, y);
      ctx.fillText((hi - (i / 4) * (hi - lo)).toFixed(2), PAD.left + plotW + 8, y);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 1; i <= 5; i++) {
      const x = Math.round(PAD.left + (i / 6) * plotW) + 0.5;
      ctx.moveTo(x, PAD.top);
      ctx.lineTo(x, PAD.top + plotH);
      ctx.fillText(`-${formatAgo(win * (1 - i / 6))}`, x, PAD.top + plotH + 6);
    }
    ctx.stroke();

    // The price line, decimated to one min/max pair per pixel column.
    ctx.save();
    ctx.beginPath();
    ctx.rect(PAD.left, PAD.top, plotW, plotH);
    ctx.clip();
    ctx.strokeStyle = line;
    ctx.lineWidth = 1.75;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    let col = NaN;
    let colLo = 0;
    let colHi = 0;
    let lastY = 0;
    for (let i = first; i < this.count; i++) {
      const j = this.at(i);
      const x = Math.round(px(this.times[j]));
      const y = py(this.prices[j]);
      if (x !== col) {
        if (Number.isNaN(col)) ctx.moveTo(x, y);
        else {
          ctx.lineTo(col, colLo);
          ctx.lineTo(col, colHi);
        }
        col = x;
        colLo = colHi = y;
      } else {
        colLo = Math.min(colLo, y);
        colHi = Math.max(colHi, y);
      }
      lastY = y;
    }
    ctx.lineTo(col, lastY);
    ctx.stroke();
    ctx.restore();

    // Latest price marker on the axis.
    const lastPrice = this.last();
    const ly = py(lastPrice);
    ctx.fillStyle = line;
    ctx.beginPath();
    ctx.arc(col, ly, 3.5, 0, Math.PI * 2);
    ctx.fill();
    this.badge(ctx, lastPrice.toFixed(2), PAD.left + plotW + 4, ly, line, bg, font);

    // Crosshair and tooltip.
    if (this.cursor !== null) {
      const t = now - this.cursor;
      const p = this.priceAt(t) || lastPrice;
      const cx = px(t);
      const cy = py(p);
      ctx.strokeStyle = muted;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, PAD.top);
      ctx.lineTo(cx, PAD.top + plotH);
      ctx.moveTo(PAD.left, cy);
      ctx.lineTo(PAD.left + plotW, cy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
      const text = `${p.toFixed(2)} at -${formatAgo(this.cursor)}`;
      ctx.font = `600 12px ${font}`;
      const tw = ctx.measureText(text).width + 14;
      const tx = Math.min(Math.max(cx - tw / 2, PAD.left), PAD.left + plotW - tw);
      const ty = cy - 30 < PAD.top ? cy + 10 : cy - 30;
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.roundRect(tx, ty, tw, 22, 3);
      ctx.fill();
      ctx.fillStyle = bg;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, tx + 7, ty + 11);
    }
  }

  private badge(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    fill: string,
    ink: string,
    font: string,
  ): void {
    ctx.font = `600 12px ${font}`;
    const tw = ctx.measureText(text).width + 10;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(x, y - 10, tw, 20, 3);
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + 5, y);
  }
}

function formatAgo(s: number): string {
  return s >= 60 ? `${(s / 60).toFixed(s % 60 ? 1 : 0)}m` : `${s.toFixed(s < 10 ? 1 : 0)}s`;
}

/** mulberry32: small seeded PRNG so the chart looks the same on every load. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
