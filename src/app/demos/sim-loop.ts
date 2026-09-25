import { DOCUMENT, Signal, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  EMPTY,
  Observable,
  animationFrames,
  combineLatest,
  distinctUntilChanged,
  fromEvent,
  map,
  pairwise,
  share,
  startWith,
  switchMap,
} from 'rxjs';

/**
 * Seconds since the previous animation frame, emitted only while `running` is true
 * and the tab is visible. Capped at 0.1s so a stalled frame can't jump a simulation.
 * Call in an injection context.
 */
export function injectFrames(running: Signal<boolean>): Observable<number> {
  const doc = inject(DOCUMENT);
  const visible$ = fromEvent(doc, 'visibilitychange').pipe(
    startWith(null),
    map(() => doc.visibilityState === 'visible'),
  );
  return combineLatest([toObservable(running), visible$]).pipe(
    map(([run, visible]) => run && visible),
    distinctUntilChanged(),
    switchMap((run) =>
      run
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
}
