import { DestroyRef, Directive, ElementRef, afterNextRender, inject } from '@angular/core';
import { Motion } from '../core/media';

/**
 * Counts a number up from zero when it scrolls into view (like the reference's stats).
 * The element's own text is the final value, so the prerendered page, visitors without
 * JavaScript and reduced motion all simply show the number. A minimum width stops the text
 * from shifting as digits are added.
 */
@Directive({ selector: '[appCountUp]' })
export class CountUp {
  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const reduced = inject(Motion).reduced;
    let stop = () => {};
    inject(DestroyRef).onDestroy(() => stop());

    afterNextRender(() => {
      const text = el.textContent?.trim() ?? '';
      const value = Number(text);
      if (reduced() || !text || Number.isNaN(value)) return;
      const decimals = text.includes('.') ? text.split('.')[1].length : 0;
      el.style.display = 'inline-block';
      el.style.minWidth = `${text.length}ch`;

      const observer = new IntersectionObserver(
        async ([entry]) => {
          if (!entry.isIntersecting) return;
          observer.disconnect();
          const { animate } = await import('./motion-animate');
          const controls = animate(0, value, {
            duration: 0.9,
            ease: [0.16, 1, 0.3, 1],
            onUpdate: (v) => (el.textContent = v.toFixed(decimals)),
            onComplete: () => (el.textContent = text),
          });
          stop = () => controls.stop();
        },
        { threshold: 0.6 },
      );
      observer.observe(el);
      stop = () => observer.disconnect();
    });
  }
}
