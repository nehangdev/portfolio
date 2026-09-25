import {
  Component,
  DOCUMENT,
  ElementRef,
  computed,
  effect,
  inject,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { Theme } from '../core/theme';
import { palette } from '../../content/pages';
import { profile } from '../../content/profile';
import { caseStudies } from '../../content/case-studies';

interface Command {
  id: string;
  label: string;
  group: string;
  /** Extra words that should match, e.g. "dark mode" for the theme switch. */
  keywords?: string;
  /** Return 'stay' to keep the palette open (for actions that report back). */
  run: () => void | 'stay' | Promise<'stay'>;
}

/**
 * Ctrl+K / Cmd+K command palette. A native modal <dialog> gives focus trapping, Escape to
 * close and focus return for free; the search box follows the ARIA combobox + listbox pattern.
 * Loaded on first use only (see the @defer in app.ts).
 */
@Component({
  selector: 'app-command-palette',
  template: `
    <dialog
      #dialog
      class="palette"
      [attr.aria-label]="t.label"
      (close)="open.set(false)"
      (click)="onDialogClick($event)"
    >
      <div class="palette-panel">
        <div class="palette-search">
          <input
            #input
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls="palette-list"
            [attr.aria-activedescendant]="activeId()"
            [attr.aria-label]="t.inputLabel"
            [placeholder]="t.placeholder"
            [value]="query()"
            (input)="onInput($event)"
            (keydown)="onKey($event)"
            autocomplete="off"
            spellcheck="false"
          />
          <kbd class="palette-kbd">{{ t.close }}</kbd>
        </div>
        <ul id="palette-list" role="listbox" [attr.aria-label]="t.listLabel" class="palette-list">
          @for (c of results(); track c.id; let i = $index) {
            <li
              role="option"
              [id]="'cmd-' + c.id"
              [attr.aria-selected]="i === activeIndex()"
              class="palette-option"
              (click)="run(c)"
              (pointermove)="activeIndex.set(i)"
            >
              <span>{{ c.label }}</span>
              <span class="flex-none whitespace-nowrap text-sm text-ink-muted">{{ c.group }}</span>
            </li>
          }
        </ul>
        @if (!results().length) {
          <p class="palette-empty">{{ t.empty }}</p>
        }
        <p role="status" class="palette-status">{{ status() }}</p>
      </div>
    </dialog>
  `,
})
export class CommandPalette {
  readonly open = model(false);

  protected readonly t = palette;
  protected readonly query = signal('');
  protected readonly activeIndex = signal(0);
  protected readonly status = signal('');

  private readonly router = inject(Router);
  private readonly theme = inject(Theme);
  private readonly doc = inject(DOCUMENT);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly input = viewChild.required<ElementRef<HTMLInputElement>>('input');

  private readonly commands = computed<Command[]>(() => {
    const c = this.t.commands;
    const g = this.t.groups;
    const go = (url: string) => () => void this.router.navigateByUrl(url);
    const visit = (url: string) => () => {
      this.doc.defaultView?.open(url, '_blank', 'noopener');
    };
    const dark = this.theme.current() === 'dark';
    return [
      { id: 'home', label: c.home, group: g.page, run: go('/') },
      ...caseStudies.map((cs) => ({
        id: cs.slug,
        label: cs.title,
        group: g.caseStudy,
        keywords: cs.stack.join(' '),
        run: go(`/work/${cs.slug}`),
      })),
      { id: 'about', label: c.about, group: g.page, run: go('/about') },
      {
        id: 'colophon',
        label: c.colophon,
        group: g.page,
        keywords: 'build tests lighthouse',
        run: go('/colophon'),
      },
      {
        id: 'theme',
        label: dark ? c.toLight : c.toDark,
        group: g.action,
        keywords: 'theme dark light mode',
        run: () => this.theme.toggle(),
      },
      {
        id: 'email',
        label: c.copyEmail,
        group: g.action,
        keywords: 'contact mail',
        run: () => this.copyEmail(),
      },
      {
        id: 'resume',
        label: c.resume,
        group: g.action,
        keywords: 'cv pdf',
        run: () => this.doc.location.assign(profile.resumeUrl),
      },
      {
        id: 'sandbox',
        label: c.sandbox,
        group: g.page,
        keywords: 'web component element',
        run: () => this.doc.location.assign('/work/live-chart/sandbox.html'),
      },
      { id: 'github', label: c.github, group: g.link, run: visit(profile.links.github) },
      { id: 'linkedin', label: c.linkedin, group: g.link, run: visit(profile.links.linkedin) },
      {
        id: 'source',
        label: c.source,
        group: g.link,
        keywords: 'repo code',
        run: visit(profile.repoUrl),
      },
    ];
  });

  protected readonly results = computed(() => {
    const words = this.query().toLowerCase().split(/\s+/).filter(Boolean);
    return this.commands().filter((c) => {
      const text = `${c.label} ${c.group} ${c.keywords ?? ''}`.toLowerCase();
      return words.every((w) => text.includes(w));
    });
  });

  protected readonly activeId = computed(() => {
    const c = this.results()[this.activeIndex()];
    return c ? `cmd-${c.id}` : null;
  });

  constructor() {
    effect(() => {
      const d = this.dialog().nativeElement;
      if (this.open() && !d.open) {
        this.query.set('');
        this.activeIndex.set(0);
        this.status.set('');
        d.showModal();
        this.input().nativeElement.focus();
      } else if (!this.open() && d.open) {
        d.close();
      }
    });
  }

  protected onInput(e: Event): void {
    this.query.set((e.target as HTMLInputElement).value);
    this.activeIndex.set(0);
  }

  protected onKey(e: KeyboardEvent): void {
    const n = this.results().length;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!n) return;
      const step = e.key === 'ArrowDown' ? 1 : -1;
      this.activeIndex.set((this.activeIndex() + step + n) % n);
      this.doc.getElementById(this.activeId() ?? '')?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const c = this.results()[this.activeIndex()];
      if (c) void this.run(c);
    }
  }

  /** A click on the dialog element itself (not its panel) is a click on the backdrop. */
  protected onDialogClick(e: MouseEvent): void {
    if (e.target === this.dialog().nativeElement) this.open.set(false);
  }

  protected async run(c: Command): Promise<void> {
    const result = await c.run();
    if (result !== 'stay') this.open.set(false);
  }

  private async copyEmail(): Promise<'stay'> {
    try {
      await navigator.clipboard.writeText([...profile.emailReversed].reverse().join(''));
      this.status.set(this.t.copied);
    } catch {
      this.status.set(this.t.copyFailed);
    }
    return 'stay';
  }
}
