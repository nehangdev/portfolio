# Design note

The concept is "the site is a message bus". The hero simulation carries the personality; everything else stays quiet.

## Colour

| Token | Light | Dark | Use | Contrast on `--paper` (light / dark) |
|---|---|---|---|---|
| `--paper` | `#E7ECEF` | `#000000` | Page ground | |
| `--paper-raised` | `#F3F6F8` | `#0B1016` | Simulation stage, hover | |
| `--ink` | `#16202E` | `#E4EBF0` | Text | 13.8 / 17.4 |
| `--ink-muted` | `#4A5868` | `#9AAAB6` | Secondary text | 6.1 / 8.8 |
| `--queue` | `#1F6F78` | `#5FB3BC` | Messages in flight, links, focus ring | 4.9 / 8.7 |
| `--signal` | `#D99A1E` | `#E3A83A` | Processed work (fills only) | 2.1 / 9.9 |
| `--fault` | `#B8412F` | `#EE8A76` | Failures and retries only | 4.6 / 8.5 |
| `--rule` | `#B9C3CA` | `#26313C` | Dividers, lanes (decorative) | 1.5 / 1.6 |

**Changes from the proposal**

- **Kept the light palette as proposed.** It passes where it needs to.
- **`--signal` is never used for text in light mode.** At 2.1:1 on paper it fails both the text and non-text contrast minimums. It appears only as a fill: processed documents in the simulation and past-role markers on the timeline, where adjacent text carries the meaning.
- **Added `--ink-muted`** for dates, captions and tags. Without it, the only way to create hierarchy would have been opacity, which makes contrast unpredictable.
- **Added `--paper-raised`** so the simulation stage reads as an instrument panel set into the page, without a shadow.
- **Dark theme** (revised in Phase 4.5) is true black for OLED screens: black pixels are switched off, so the page looks deep and saves power. Raised surfaces sit just above black (`#0B1016`), which is enough to separate the simulation stage without a visible grey box. Each accent is lightened until it clears 4.5:1.
- Tokens are plain hex in two dark blocks (OS preference and manual toggle), not `light-dark()`, because the canvas reads them with `getComputedStyle`.

## Type

- **Fira Code for everything** (changed in Phase 4.5 at Nehang's request, replacing Schibsted Grotesk). It's self-hosted, limited to the Latin character set (36 KB woff2, preloaded), with weights 300–700.
  - A monospace face for a developer's portfolio is a deliberate identity choice. It reads as code-adjacent, and it suits the message-bus theme.
  - Its programming ligatures stay on.
- Monospace runs wide, so the scale was retuned: a 16px base stepping by a minor third (1.2), giving 13 / 16 / 19.2 / 23 / 27.6 / 33.2 px. The display name is `clamp(2.5rem, 8.5vw, 5.25rem)` at weight 700.
- Body line-height rises to 1.65, since monospace text needs more air. Line length is still capped at 66ch, which in a monospace face is exactly 66 characters.
- No all-caps labels, no eyebrows.

## Layout

```
wrap (max 76rem, 16px gutter on phones)
┌──────────────┬─────────────────────────────────────┐
│ Heading lane │ Content lane (text ≤ 66ch)          │  ← one section
├──────────────┼─────────────────────────────────────┤  ← rule = lane divider
│ Heading lane │ Content lane                        │
└──────────────┴─────────────────────────────────────┘
```

- Everything is left-aligned. Below 60rem the two lanes stack.
- Selected work is a list of rows separated by rules, not cards. Stack tags are underlined text, not pills.
- **Shape encodes meaning.** The pill shape is kept for messages (in the simulation and its static diagram). Buttons have a 3px radius and the stage has 4px. Nothing else is rounded.
- The career timeline reads as `git log --graph`, newest first:
  - each role is a commit with a short hash, and the current role carries `(HEAD -> main)`;
  - the career break is a `#` comment on a dashed stretch of the branch line.

## Motion

- The hero simulation and user-triggered demo interactions animate. There are no scroll-triggered entrance effects.
- **Calls to action (Phase 4.5):** the two hero buttons use Motion, loaded after the page is interactive.
  - Once after load, the primary button plays a single attention cue: a pulse and a light sheen, under 2 seconds. It never repeats, so it stays within WCAG 2.2.2, which requires a pause control for anything that moves on its own for more than 5 seconds.
  - Both buttons have a magnetic pull toward the mouse, a spring on press, and an icon nudge on hover.
- **Sticky header:** a divider and a reading-progress line appear as you scroll. Both use CSS scroll-driven animation, so there is no JavaScript scroll listener, and they move only when the reader scrolls.
- The simulation stops when you pause it, when the tab is hidden, or when the system asks for reduced motion. With reduced motion it is replaced by the static diagram.
- The static diagram is also the prerendered placeholder and the no-JavaScript view. It shares a fixed-height frame with the live simulation, so swapping one for the other causes no layout shift.

## Developer touches (Phase 4.6)

Each one carries real information, not just decoration:

- **"In short" as an editor file** (`in-short.html`):
  - line numbers, and the paragraphs wrapped in syntax-coloured HTML tags;
  - screen readers get only the paragraphs.
- **Syntax colouring (Prism)** on every code sample. The colours are applied at build time, so they also work without JavaScript.
  - Palette: One Dark in dark mode, darker equivalents in light mode, all at least 5:1 contrast.
- **A before/after diff** of the synchronous-to-Service-Bus change, shown on the event-driven case study.
  - `+`/`-` markers carry the meaning; colour only backs them up.
- **A file-path breadcrumb** (`~ / work / slug.md`) on case studies. Each part is a working link.
- **A terminal-style 404** that echoes the missing path and lists real pages.
  - The cursor is static, because blinking content needs a way to stop it (WCAG 2.2.2).
- **A one-line greeting in the browser console**, with a link to the source.
- **A command palette (Ctrl+K / Cmd+K, or the header's ⌘ button):**
  - search pages, case studies and actions (theme, copy email, links);
  - built on a native modal `<dialog>`, with its code loaded on first use.
- **The Colophon's build log:** measured numbers rendered as a terminal session, with a real table for the Lighthouse scores.

## Simulation

- Documents arrive at about 2.6 per second, and each takes about 0.5 s of work, with an 8% failure rate.
  - **Synchronous:** one worker. A failure is retried in place and blocks the documents behind it.
  - **Event-driven:** three consumers. A failure goes to the back of the queue.
- Processed documents sit in the "done" tray for 4 seconds, so how full the tray is shows throughput at a glance.
- The numbers are illustrative, and the caption says so. The model is seeded, so every visit looks the same.
