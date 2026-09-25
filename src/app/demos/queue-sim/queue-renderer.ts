import { Msg, QueueModel } from './queue-model';

interface Sprite {
  x: number;
  y: number;
  /** Seconds since it finished processing; null while still in flight. */
  doneFor: number | null;
  /** Cell in the done tray. */
  slot: number;
}

export interface CanvasText {
  incoming: string;
  workers: (n: number) => string;
  done: (n: number) => string;
}

interface Palette {
  ink: string;
  muted: string;
  paper: string;
  queue: string;
  signal: string;
  fault: string;
  rule: string;
}

const PAD = 16;
const GAP = 6;
const FAIL_FLASH = 0.8;
/** How long a processed document stays in the tray, so tray fullness tracks throughput. */
const DONE_LIFE = 4;

/** Draws a QueueModel onto a canvas. Sprites ease toward the slot the model says they're in. */
export class QueueRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly sprites = new Map<number, Sprite>();
  private readonly resizeObserver: ResizeObserver;
  private palette!: Palette;
  private w = 0;
  private h = 0;
  private last: QueueModel | null = null;
  private doneSeq = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly text: CanvasText,
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.readPalette();
    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
      if (this.last) this.draw(this.last, 0);
    });
    this.resizeObserver.observe(canvas);
    this.resize();
  }

  destroy(): void {
    this.resizeObserver.disconnect();
  }

  reset(): void {
    this.sprites.clear();
    this.doneSeq = 0;
  }

  readPalette(): void {
    const style = getComputedStyle(this.canvas);
    const v = (name: string) => style.getPropertyValue(name).trim();
    this.palette = {
      ink: v('--ink'),
      muted: v('--ink-muted'),
      paper: v('--paper'),
      queue: v('--queue'),
      signal: v('--signal'),
      fault: v('--fault'),
      rule: v('--rule'),
    };
    if (this.last) this.draw(this.last, 0);
  }

  draw(model: QueueModel, dt: number): void {
    this.last = model;
    const { ctx, w, h, palette: p } = this;
    ctx.clearRect(0, 0, w, h);
    if (!w || !h) return;

    // Geometry, recomputed per frame so resizes need no bookkeeping.
    const msgH = Math.max(18, Math.min(26, h * 0.11));
    const msgW = msgH * 2;
    const boxW = msgW + 20;
    const boxH = msgH + 22;
    const n = model.workers.length;
    const doneW = Math.max(msgW + 20, w * 0.16);
    const doneX = w - PAD - doneW;
    const workerX = doneX - 28 - boxW;
    const rowGap = Math.min((h - 2 * PAD) / n, boxH + 18);
    const workerY = (i: number) => h / 2 + (i - (n - 1) / 2) * rowGap;
    const laneY = h / 2;
    const queueEnd = workerX - (n > 1 ? 56 : 28);
    const slots = Math.max(1, Math.floor((queueEnd - PAD) / (msgW + GAP)));
    const k = 1 - Math.exp(-dt * 12);

    // Lanes, and the tray processed documents land in.
    ctx.strokeStyle = p.rule;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, laneY);
    ctx.lineTo(queueEnd, laneY);
    for (let i = 0; i < n; i++) {
      ctx.moveTo(queueEnd, laneY);
      ctx.lineTo(workerX, workerY(i));
      ctx.moveTo(workerX + boxW, workerY(i));
      ctx.lineTo(doneX, laneY);
    }
    ctx.stroke();
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.roundRect(doneX, PAD + 22, doneW, h - 2 * PAD - 22, 6);
    ctx.stroke();
    ctx.setLineDash([]);

    const labelSize = 13;
    ctx.font = `600 ${labelSize}px 'Schibsted Grotesk', system-ui, sans-serif`;
    ctx.fillStyle = p.muted;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.fillText(this.text.incoming, PAD, PAD + labelSize);
    ctx.textAlign = 'center';
    ctx.fillText(this.text.workers(n), workerX + boxW / 2, PAD + labelSize);
    ctx.textAlign = 'right';
    ctx.fillText(this.text.done(model.completed), w - PAD, PAD + labelSize);

    // Workers, with a progress bar for the document in hand.
    model.workers.forEach((wk, i) => {
      const y = workerY(i);
      ctx.strokeStyle = p.muted;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(workerX, y - boxH / 2, boxW, boxH, 6);
      ctx.stroke();
      if (wk.msg) {
        const done = 1 - Math.max(0, wk.remaining) / wk.total;
        ctx.fillStyle = p.signal;
        ctx.fillRect(workerX + 10, y + msgH / 2 + 4, msgW * done, 4);
      }
    });

    // Where each live document should be.
    const targets = new Map<number, { msg: Msg; x: number; y: number }>();
    model.queue.forEach((msg, i) => {
      const x = i < slots ? queueEnd - msgW - i * (msgW + GAP) : -msgW * 2;
      targets.set(msg.id, { msg, x, y: laneY - msgH / 2 });
    });
    model.workers.forEach((wk, i) => {
      if (wk.msg) targets.set(wk.msg.id, { msg: wk.msg, x: workerX + 10, y: workerY(i) - msgH / 2 - 3 });
    });

    ctx.font = `600 ${Math.round(msgH * 0.46)}px 'Schibsted Grotesk', system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const [id, target] of targets) {
      let s = this.sprites.get(id);
      if (!s) this.sprites.set(id, (s = { x: -msgW * 2, y: target.y, doneFor: null, slot: 0 }));
      s.x += (target.x - s.x) * k;
      s.y += (target.y - s.y) * k;
      const failed = target.msg.failedAt !== null && model.time - target.msg.failedAt < FAIL_FLASH;
      this.pill(s.x, s.y, msgW, msgH, target.msg.label, failed ? p.fault : p.queue, p.paper);
      if (target.msg.attempts > 0 && !failed) {
        ctx.strokeStyle = p.fault;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(s.x - 1, s.y - 1, msgW + 2, msgH + 2, msgH / 2 + 1);
        ctx.stroke();
      }
    }

    // Anything the model no longer holds has been processed: it drops into a tray cell,
    // stays a few seconds, then fades. A faster pipeline keeps the tray fuller.
    const cellW = msgW / 2;
    const cellH = msgH / 2;
    const trayTop = PAD + 22;
    const cols = Math.max(1, Math.floor((doneW - 8) / (cellW + 4)));
    const rows = Math.max(1, Math.floor((h - PAD - trayTop - 8) / (cellH + 4)));
    const trayLeft = doneX + (doneW - cols * (cellW + 4) + 4) / 2;
    for (const [id, s] of this.sprites) {
      if (targets.has(id)) continue;
      if (s.doneFor === null) s.slot = this.doneSeq++ % (cols * rows);
      s.doneFor = (s.doneFor ?? 0) + dt;
      if (s.doneFor > DONE_LIFE) {
        this.sprites.delete(id);
        continue;
      }
      const tx = trayLeft + (s.slot % cols) * (cellW + 4);
      const ty = h - PAD - 4 - (Math.floor(s.slot / cols) + 1) * (cellH + 4);
      s.x += (tx - s.x) * k;
      s.y += (ty - s.y) * k;
      ctx.globalAlpha = Math.min(1, DONE_LIFE - s.doneFor);
      this.pill(s.x, s.y, cellW, cellH, '', p.signal, p.ink);
      ctx.globalAlpha = 1;
    }

    const hidden = model.queue.length - slots;
    if (hidden > 0) {
      ctx.fillStyle = p.muted;
      ctx.textAlign = 'left';
      ctx.font = `600 ${labelSize}px 'Schibsted Grotesk', system-ui, sans-serif`;
      ctx.fillText(`+${hidden}`, PAD, laneY - msgH / 2 - 8);
    }
  }

  private pill(x: number, y: number, w: number, h: number, label: string, fill: string, text: string): void {
    const { ctx } = this;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, h / 2);
    ctx.fill();
    if (label) {
      ctx.fillStyle = text;
      ctx.fillText(label, x + w / 2, y + h / 2 + 0.5);
    }
  }

  private resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.w = rect.width;
    this.h = rect.height;
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}
