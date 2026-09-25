import { DOCUMENT, Injectable, inject } from '@angular/core';

/** Ease-in-out: a gentle start, a quick middle and a soft landing, so it reads as a glide. */
const GLIDE = [0.65, 0, 0.35, 1] as const;
const INTERRUPT = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;

/**
 * Glides the window to a position with Motion instead of jumping. Longer distances take a
 * little longer (about 0.9s for a long page). Any wheel, touch, key or click stops the glide
 * where it is, so it never fights the reader. With reduced motion it jumps instantly.
 */
@Injectable({ providedIn: 'root' })
export class SmoothScroll {
  private readonly doc = inject(DOCUMENT);
  private cancelCurrent: (() => void) | null = null;

  /** Header height plus breathing room, so targets land below the sticky header. */
  readonly offset = 80;

  async toY(y: number): Promise<void> {
    const win = this.doc.defaultView;
    if (!win) return;
    this.cancelCurrent?.();
    const target = Math.max(0, Math.round(y));
    if (win.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      win.scrollTo({ top: target, behavior: 'instant' });
      return;
    }
    const { animate } = await import('../ui/motion-animate');
    const start = win.scrollY;
    const duration = Math.min(1.1, 0.5 + Math.abs(target - start) / 8000);
    await new Promise<void>((resolve) => {
      const finish = () => {
        for (const type of INTERRUPT) win.removeEventListener(type, stop, { capture: true });
        this.cancelCurrent = null;
        resolve();
      };
      const controls = animate(start, target, {
        duration,
        ease: GLIDE,
        onUpdate: (v) => win.scrollTo({ top: v, behavior: 'instant' }),
        onComplete: finish,
      });
      const stop = () => {
        controls.stop();
        finish();
      };
      for (const type of INTERRUPT) {
        win.addEventListener(type, stop, { capture: true, passive: true, once: true });
      }
      this.cancelCurrent = stop;
    });
  }

  /** Glide so the element's top sits just below the sticky header. */
  toElement(el: Element): Promise<void> {
    const win = this.doc.defaultView;
    const top = el.getBoundingClientRect().top + (win?.scrollY ?? 0) - this.offset;
    return this.toY(top);
  }
}
