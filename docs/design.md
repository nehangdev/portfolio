# Design note

The concept is "the site is a message bus". The hero simulation carries the personality; everything else stays quiet.

## Colour

| Token | Light | Dark | Use | Contrast on `--paper` (light / dark) |
|---|---|---|---|---|
| `--paper` | `#E7ECEF` | `#121B26` | Page ground | |
| `--paper-raised` | `#F3F6F8` | `#182431` | Simulation stage, hover | |
| `--ink` | `#16202E` | `#DCE4E9` | Text | 13.8 / 13.5 |
| `--ink-muted` | `#4A5868` | `#9FB0BD` | Secondary text | 6.1 / 7.8 |
| `--queue` | `#1F6F78` | `#5FB3BC` | Messages in flight, links, focus ring | 4.9 / 7.2 |
| `--signal` | `#D99A1E` | `#E3A83A` | Processed work (fills only) | 2.1 / 8.2 |
| `--fault` | `#B8412F` | `#E8806C` | Failures and retries only | 4.6 / 6.4 |
| `--rule` | `#B9C3CA` | `#2F3D4A` | Dividers, lanes (decorative) | 1.5 / 1.6 |

**Changes from the proposal**

- **Kept the light palette as proposed.** It passes where it needs to.
- **`--signal` is never used for text in light mode.** At 2.1:1 on paper it fails both the text and non-text contrast minimums. It appears only as a fill: processed documents in the simulation and past-role markers on the timeline, where adjacent text carries the meaning.
- **Added `--ink-muted`** for dates, captions and tags. Without it, the only way to create hierarchy would have been opacity, which makes contrast unpredictable.
- **Added `--paper-raised`** so the simulation stage reads as an instrument panel set into the page, without a shadow.
- **Dark theme** is the same console at night: a deep blue-slate ground rather than near-black, and each accent lightened until it clears 4.5:1.
- Tokens are plain hex in two dark blocks (OS preference and manual toggle), not `light-dark()`, because the canvas reads them with `getComputedStyle`.

## Type

- **Schibsted Grotesk** for everything, self-hosted, Latin subset only (47 KB woff2, preloaded). I picked it over Instrument Sans because it was drawn for a news publisher: sturdy, slightly condensed, and at its best in heavy headlines. That suits a name set at display size. Instrument Sans is lighter and closer to the generic SaaS look.
- Scale: 17px base, major third (1.25): 13.6 / 17 / 21.3 / 26.6 / 33.2 / 41.6 px, with the display name at `clamp(2.75rem, 9vw, 6.25rem)`, weight 800 and -0.035em tracking.
- Body line length is capped at 66ch (`.measure`).
- No monospace anywhere yet. It is reserved for real code samples in the case studies.
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
- The timeline markers encode state with the same colours as the simulation: amber for past roles (processed), teal for the current role (in flight), and hollow for the career break.

## Motion

- Only the hero simulation animates. There are no scroll or entrance effects.
- The simulation stops when you pause it, when the tab is hidden, or when the system asks for reduced motion. With reduced motion it is replaced by the static diagram.
- The static diagram is also the prerendered placeholder and the no-JavaScript view. It shares a fixed-height frame with the live simulation, so swapping one for the other causes no layout shift.

## Simulation

- Documents arrive at about 2.6 per second, and each takes about 0.5 s of work, with an 8% failure rate.
  - **Synchronous:** one worker. A failure is retried in place and blocks the documents behind it.
  - **Event-driven:** three consumers. A failure goes to the back of the queue.
- Processed documents sit in the "done" tray for 4 seconds, so how full the tray is shows throughput at a glance.
- The numbers are illustrative, and the caption says so. The model is seeded, so every visit looks the same.
