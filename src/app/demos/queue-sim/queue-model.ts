export type Mode = 'sync' | 'event';

export interface Msg {
  id: number;
  label: string;
  attempts: number;
  /** Sim time of the latest failure, for the red flash. */
  failedAt: number | null;
}

export interface Worker {
  msg: Msg | null;
  remaining: number;
  total: number;
}

export interface ModelOptions {
  /** Documents arriving per second. */
  arrivalRate: number;
  /** Mean seconds one worker spends on one document. */
  serviceTime: number;
  failureRate: number;
  seed: number;
}

const LABELS = ['PDF', 'XML', 'CSV', 'DOC'];
const RATE_WINDOW = 5;

export const DEFAULTS: ModelOptions = { arrivalRate: 2.6, serviceTime: 0.5, failureRate: 0.08, seed: 7 };

/** Small seeded PRNG (mulberry32) so every run looks the same. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The simulation, with no rendering in it.
 * sync: one worker; a failure is retried in place, blocking everything behind it.
 * event: a queue and three consumers; a failure goes to the back of the queue.
 */
export class QueueModel {
  time = 0;
  readonly queue: Msg[] = [];
  readonly workers: Worker[];
  private readonly random: () => number;
  private nextArrival: number;
  private nextId = 1;
  private readonly completions: number[] = [];
  completed = 0;

  constructor(
    readonly mode: Mode,
    private readonly opts: ModelOptions = DEFAULTS,
  ) {
    this.random = rng(opts.seed);
    this.workers = Array.from({ length: mode === 'sync' ? 1 : 3 }, () => ({ msg: null, remaining: 0, total: 0 }));
    this.nextArrival = this.interArrival();
  }

  get arrived(): number {
    return this.nextId - 1;
  }

  /** Completed documents per second over the last few seconds. */
  get rate(): number {
    const since = this.time - RATE_WINDOW;
    while (this.completions.length && this.completions[0] < since) this.completions.shift();
    return this.completions.length / Math.min(RATE_WINDOW, Math.max(this.time, 1));
  }

  step(dt: number): void {
    this.time += dt;

    while (this.nextArrival <= this.time) {
      const id = this.nextId++;
      this.queue.push({ id, label: LABELS[id % LABELS.length], attempts: 0, failedAt: null });
      this.nextArrival += this.interArrival();
    }

    for (const w of this.workers) {
      if (!w.msg) continue;
      w.remaining -= dt;
      if (w.remaining > 0) continue;

      if (this.random() < this.opts.failureRate) {
        w.msg.attempts++;
        w.msg.failedAt = this.time;
        if (this.mode === 'sync') {
          this.start(w, w.msg);
          continue;
        }
        this.queue.push(w.msg);
      } else {
        this.completions.push(this.time);
        this.completed++;
      }
      w.msg = null;
    }

    for (const w of this.workers) {
      if (!w.msg && this.queue.length) this.start(w, this.queue.shift()!);
    }
  }

  private start(w: Worker, msg: Msg): void {
    w.msg = msg;
    w.total = w.remaining = this.opts.serviceTime * (0.8 + 0.4 * this.random());
  }

  private interArrival(): number {
    return -Math.log(1 - this.random()) / this.opts.arrivalRate;
  }
}
