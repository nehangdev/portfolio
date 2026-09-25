import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';
import { Motion } from '../core/media';

/** Seconds; matches the reference's material-style ripple. */
const RIPPLE_DURATION = 0.55;

/**
 * Call-to-action behaviour, for buttons styled with `.btn-cta` (or any `overflow: hidden` host):
 * - a ripple that spreads from the press point, on pointer or keyboard press (Motion);
 * - an icon nudge on hover (mark the icon with `data-cta-icon`).
 * Motion is imported lazily after the page is interactive. Nothing runs for reduced motion.
 */
@Directive({ selector: '[appCta]' })
export class CtaMotion {
  /** Which way the icon nudges on hover. */
  readonly nudge = input<'arrow' | 'download' | 'up' | ''>('', { alias: 'appCta' });

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const reduced = inject(Motion).reduced;
    let destroyed = false;
    const cleanups: (() => void)[] = [];
    inject(DestroyRef).onDestroy(() => {
      destroyed = true;
      cleanups.forEach((fn) => fn());
    });

    afterNextRender(async () => {
      if (reduced()) return;

      const { animate } = await import('./motion-animate');
      if (destroyed) return;

      const ripple = (x: number, y: number) => {
        const r = el.getBoundingClientRect();
        const size = Math.hypot(r.width, r.height) * 2;
        const dot = document.createElement('span');
        dot.className = 'cta-ripple';
        dot.setAttribute('aria-hidden', 'true');
        Object.assign(dot.style, {
          width: `${size}px`,
          height: `${size}px`,
          left: `${x - r.left - size / 2}px`,
          top: `${y - r.top - size / 2}px`,
        });
        el.appendChild(dot);
        animate(
          dot,
          { scale: [0, 1], opacity: [0.35, 0] },
          { duration: RIPPLE_DURATION, ease: [0.4, 0, 0.2, 1] },
        ).then(() => dot.remove());
      };

      const icon = el.querySelector<HTMLElement>('[data-cta-icon]');
      const onEnter = () => {
        if (!icon || !this.nudge()) return;
        const keyframes = {
          arrow: { x: [0, 5, 0] },
          download: { y: [0, 4, 0] },
          up: { y: [0, -5, 0] },
        }[this.nudge() || 'arrow'];
        animate(icon, keyframes, { duration: 0.45, ease: 'easeInOut' });
      };
      const onPointerDown = (e: PointerEvent) => ripple(e.clientX, e.clientY);
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const r = el.getBoundingClientRect();
        ripple(r.left + r.width / 2, r.top + r.height / 2);
      };

      el.addEventListener('pointerenter', onEnter);
      el.addEventListener('pointerdown', onPointerDown);
      el.addEventListener('keydown', onKeyDown);
      cleanups.push(() => {
        el.removeEventListener('pointerenter', onEnter);
        el.removeEventListener('pointerdown', onPointerDown);
        el.removeEventListener('keydown', onKeyDown);
      });
    });
  }
}
