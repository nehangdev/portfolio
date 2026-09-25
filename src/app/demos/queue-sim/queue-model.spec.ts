import { DEFAULTS, QueueModel } from './queue-model';

function run(model: QueueModel, seconds: number): QueueModel {
  for (let t = 0; t < seconds; t += 1 / 60) model.step(1 / 60);
  return model;
}

describe('QueueModel', () => {
  it('uses one worker in sync mode and three in event mode', () => {
    expect(new QueueModel('sync').workers.length).toBe(1);
    expect(new QueueModel('event').workers.length).toBe(3);
  });

  it('processes more per second event-driven than synchronously', () => {
    const sync = run(new QueueModel('sync'), 60);
    const event = run(new QueueModel('event'), 60);
    expect(event.completed).toBeGreaterThan(sync.completed * 1.1);
  });

  it('lets the synchronous queue pile up while the event-driven one keeps up', () => {
    expect(run(new QueueModel('sync'), 60).queue.length).toBeGreaterThan(20);
    expect(run(new QueueModel('event'), 60).queue.length).toBeLessThan(5);
  });

  it('is deterministic for the same seed', () => {
    const a = run(new QueueModel('event'), 20);
    const b = run(new QueueModel('event'), 20);
    expect(a.rate).toBe(b.rate);
    expect(a.queue.map((m) => m.id)).toEqual(b.queue.map((m) => m.id));
  });

  it('retries failures instead of dropping them', () => {
    const model = run(new QueueModel('event', { arrivalRate: 2, serviceTime: 0.3, failureRate: 0.5, seed: 3 }), 30);
    const busy = model.workers.filter((w) => w.msg).length;
    // With half of all attempts failing, nothing is lost: every arrival is done, queued or in progress.
    expect(model.arrived).toBe(model.completed + model.queue.length + busy);
  });

  it('dead-letters a message once it reaches maxAttempts, and never loses one', () => {
    const opts = { arrivalRate: 3, serviceTime: 0.2, failureRate: 0.3, seed: 5, workers: 4 };
    const noRetry = run(new QueueModel('event', { ...opts, maxAttempts: 1 }), 30);
    const retry = run(new QueueModel('event', { ...opts, maxAttempts: 3 }), 30);
    expect(noRetry.deadLettered).toBeGreaterThan(retry.deadLettered * 5);
    expect(retry.deadLetter.every((m) => m.attempts === 3)).toBe(true);
    for (const m of [noRetry, retry]) {
      const busy = m.workers.filter((w) => w.msg).length;
      expect(m.arrived).toBe(m.completed + m.deadLettered + m.queue.length + busy);
    }
  });

  it('puts in-flight work back on the queue when consumers are removed', () => {
    const model = run(new QueueModel('event', { ...DEFAULTS, workers: 4, arrivalRate: 6 }), 5);
    const inFlight = model.workers.filter((w) => w.msg).length;
    const queued = model.queue.length;
    model.configure({ workers: 1 });
    expect(model.workers.length).toBe(1);
    expect(model.queue.length + model.workers.filter((w) => w.msg).length).toBe(queued + inFlight);
  });
});
