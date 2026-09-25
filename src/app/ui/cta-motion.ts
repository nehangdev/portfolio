import {
  DestroyRef,
  Directive,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  inject,
  input,
} from '@angular/core';
import { Motion } from '../core/media';

const SPRING = { type: 'spring', stiffness: 380, damping: 22, mass: 0.6 } as const;

/**
 * Makes a call-to-action feel alive:
 * - one attention cue shortly after load (a pulse and a sheen, under 2s, never repeated),
 * - a magnetic pull toward the mouse, a spring on press, and an icon nudge on hover.
 * Mark the icon with `data-cta-icon` and an optional sheen span with `data-cta-sheen`.
 * Motion is imported lazily after the page is interactive, so it never delays first paint.
 * Nothing runs when the visitor prefers reduced motion.
 */
@Directive({ selector: '[appCta]' })
export class CtaMotion {
  /** Which way the icon nudges on hover. */
  readonly nudge = input<'arrow' | 'download'>('arrow', { alias: 'appCta' });
  /** Play the one-time attention cue after load. */
  readonly attention = input(false, { alias: 'ctaAttention', transform: booleanAttribute });

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const reduced = inject(Motion).reduced;
    let destroyed = false;
    let cleanup = () => {};
    inject(DestroyRef).onDestroy(() => {
      destroyed = true;
      cleanup();
    });

    afterNextRender(async () => {
      if (reduced()) return;
      const { animate } = await import('./motion-animate');
      if (destroyed) return;

      const icon = el.querySelector<HTMLElement>('[data-cta-icon]');
      const sheen = el.querySelector<HTMLElement>('[data-cta-sheen]');
      const nudgeIcon = () => {
        if (!icon) return;
        const keyframes = this.nudge() === 'download' ? { y: [0, 4, 0] } : { x: [0, 5, 0] };
        animate(icon, keyframes, { duration: 0.45, ease: 'easeInOut' });
      };
      let hovering = false;

      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return;
        const r = el.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width - 0.5) * 10;
        const y = ((e.clientY - r.top) / r.height - 0.5) * 8;
        animate(el, { x, y }, SPRING);
      };
      const onEnter = () => {
        hovering = true;
        nudgeIcon();
      };
      const onLeave = () => {
        hovering = false;
        animate(el, { x: 0, y: 0, scale: 1 }, SPRING);
      };
      const onDown = () => animate(el, { scale: 0.95 }, SPRING);
      const onUp = () => animate(el, { scale: 1 }, SPRING);

      const listeners: [string, EventListener][] = [
        ['pointermove', onMove as EventListener],
        ['pointerenter', onEnter],
        ['pointerleave', onLeave],
        ['pointerdown', onDown],
        ['pointerup', onUp],
      ];
      for (const [type, fn] of listeners) el.addEventListener(type, fn);

      // One attention cue, only if the visitor hasn't already moved on.
      const timer = this.attention()
        ? setTimeout(() => {
            if (hovering || scrollY > 80) return;
            animate(el, { scale: [1, 1.06, 1, 1.03, 1] }, { duration: 1.2, ease: 'easeInOut' });
            if (sheen)
              animate(
                sheen,
                { x: ['-120%', '360%'] },
                { duration: 1, delay: 0.15, ease: 'easeInOut' },
              );
            nudgeIcon();
          }, 1400)
        : undefined;

      cleanup = () => {
        clearTimeout(timer);
        for (const [type, fn] of listeners) el.removeEventListener(type, fn);
      };
    });
  }
}
