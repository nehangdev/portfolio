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
  /** Documents arriving per second. 0 means only what enqueue() adds. */
  arrivalRate: number;
  /** Mean seconds one worker spends on one document. */
  serviceTime: number;
  failureRate: number;
  seed: number;
  /** Defaults to 1 for sync and 3 for event. */
  workers?: number;
  /** Attempts before a message is dead-lettered. Infinity means retry forever. */
  maxAttempts?: number;
}

const LABELS = ['PDF', 'XML', 'CSV', 'DOC'];
const RATE_WINDOW = 5;
const DEAD_LETTER_KEEP = 50;

export const DEFAULTS: ModelOptions = { arrivalRate: 2.6, serviceTime: 0.5, failureRate: 0.08, seed: 7 };

/** Small seeded PRNG (mulberry32) so every run looks the same. */
export function rng(seed: number): () => number {
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
 * sync: a failure is retried in place, blocking everything behind it.
 * event: a failure goes to the back of the queue.
 * Either way, a message that reaches maxAttempts moves to the dead-letter queue.
 */
export class QueueModel {
  time = 0;
  completed = 0;
  deadLettered = 0;
  readonly queue: Msg[] = [];
  readonly workers: Worker[] = [];
  /** The most recent dead-lettered messages (older ones are only counted). */
  readonly deadLetter: Msg[] = [];
  private readonly opts: Required<ModelOptions>;
  private readonly random: () => number;
  private nextArrival: number;
  private nextId = 1;
  private readonly completions: number[] = [];

  constructor(
    readonly mode: Mode,
    opts: ModelOptions = DEFAULTS,
  ) {
    this.opts = { workers: mode === 'sync' ? 1 : 3, maxAttempts: Infinity, ...opts };
    this.random = rng(this.opts.seed);
    this.setWorkers(this.opts.workers);
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

  /** Change settings while running. Fewer workers put their in-flight messages back at the front. */
  configure(changes: Partial<Omit<ModelOptions, 'seed'>>): void {
    const rateChanged = changes.arrivalRate !== undefined && changes.arrivalRate !== this.opts.arrivalRate;
    Object.assign(this.opts, changes);
    if (changes.workers !== undefined) this.setWorkers(changes.workers);
    if (rateChanged) this.nextArrival = this.time + this.interArrival();
  }

  enqueue(): Msg {
    const id = this.nextId++;
    const msg = { id, label: LABELS[id % LABELS.length], attempts: 0, failedAt: null };
    this.queue.push(msg);
    return msg;
  }

  step(dt: number): void {
    this.time += dt;

    while (this.nextArrival <= this.time) {
      this.enqueue();
      this.nextArrival += this.interArrival();
    }

    for (const w of this.workers) {
      if (!w.msg) continue;
      w.remaining -= dt;
      if (w.remaining > 0) continue;

      const msg = w.msg;
      w.msg = null;
      if (this.random() >= this.opts.failureRate) {
        this.completions.push(this.time);
        this.completed++;
        continue;
      }
      msg.attempts++;
      msg.failedAt = this.time;
      if (msg.attempts >= this.opts.maxAttempts) {
        this.deadLettered++;
        this.deadLetter.push(msg);
        if (this.deadLetter.length > DEAD_LETTER_KEEP) this.deadLetter.shift();
      } else if (this.mode === 'sync') {
        this.start(w, msg);
      } else {
        this.queue.push(msg);
      }
    }

    for (const w of this.workers) {
      if (!w.msg && this.queue.length) this.start(w, this.queue.shift()!);
    }
  }

  private setWorkers(n: number): void {
    while (this.workers.length < n) this.workers.push({ msg: null, remaining: 0, total: 0 });
    while (this.workers.length > n) {
      const w = this.workers.pop()!;
      if (w.msg) this.queue.unshift(w.msg);
    }
  }

  private start(w: Worker, msg: Msg): void {
    w.msg = msg;
    w.total = w.remaining = this.opts.serviceTime * (0.8 + 0.4 * this.random());
  }

  private interArrival(): number {
    if (this.opts.arrivalRate <= 0) return Infinity;
    return -Math.log(1 - this.random()) / this.opts.arrivalRate;
  }
}
