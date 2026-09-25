import { DestroyRef, Directive, ElementRef, afterNextRender, inject } from '@angular/core';
import { Motion } from '../core/media';

const STAGGER_MS = 70;
const MAX_DELAY_MS = 280;

// Elements waiting to be revealed, checked together on scroll (one rAF per frame).
const pending = new Set<HTMLElement>();
let frame = 0;

function check(): void {
  frame = 0;
  let order = 0;
  for (const el of pending) {
    // Reached (or scrolled past, e.g. after a jump): reveal. Never leave content hidden.
    if (el.getBoundingClientRect().top < innerHeight * 0.92) {
      el.style.setProperty('--reveal-delay', `${Math.min(order++ * STAGGER_MS, MAX_DELAY_MS)}ms`);
      el.classList.remove('reveal-pending');
      pending.delete(el);
    }
  }
  if (!pending.size) removeEventListener('scroll', onScroll);
}

function onScroll(): void {
  frame ||= requestAnimationFrame(check);
}

/**
 * Fades a block in and lifts it 16px the first time the reader reaches it (the reference's
 * scroll reveal, restrained). Only for blocks below the fold when the page loads: anything
 * already on screen, visitors without JavaScript, and reduced motion never see a hidden state.
 * Blocks revealed together stagger by 70ms.
 */
@Directive({ selector: '[appReveal]', host: { class: 'reveal' } })
export class Reveal {
  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const reduced = inject(Motion).reduced;
    inject(DestroyRef).onDestroy(() => pending.delete(el));

    afterNextRender(() => {
      if (reduced() || el.getBoundingClientRect().top < innerHeight) return;
      el.classList.add('reveal-pending');
      if (!pending.size) addEventListener('scroll', onScroll, { passive: true });
      pending.add(el);
    });
  }
}
