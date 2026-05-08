# Handoff: Verse — Music-Driven English Learning (Web)

## Overview

**Verse** is a desktop web app for learning English through song lyrics. The user plays a song, watches lyrics highlight word-by-word in karaoke style, taps unfamiliar words to see definitions in their native language (Chinese in the demo), saves them to flashcards, and tracks streaks across days. The flagship interaction is the **Now Playing** screen: a circular vinyl album on the left, scrolling karaoke lyrics on the right, vocab card slides up on word-tap.

Three navigable screens:
1. **Now Playing** — primary screen, song + synced lyrics + vocab interactions
2. **Library** — grid of songs filtered by CEFR level
3. **Profile** — streak, weekly listening bars, lifetime stats, recent activity, achievements

A floating **Tweaks** panel lets the user switch between three visual themes (Calm / Playful / Dark), toggle karaoke and translation, and change CEFR level.

## About the Design Files

The files in this bundle are **design references created in HTML/React/Babel** — interactive prototypes that demonstrate intended look, feel, and behavior. They are **not production code to copy directly**. The Babel-in-the-browser setup, the inline `<script type="text/babel">` loading, the `window.claude.complete` hooks (none used here), and the global `window.SONGS` data dump are all prototype shortcuts.

The task is to **recreate these designs in the target codebase's existing environment** — likely a real React app with proper bundling (Vite / Next.js), a real audio engine (HTMLAudioElement or Howler), real i18n, and real persistence. Or, if no app exists yet, choose the appropriate framework (React + TypeScript + Vite is a solid default for this scope) and implement there.

## Fidelity

**High-fidelity.** Final colors, typography, spacing, animations, and interaction details are all settled. Recreate pixel-perfectly using the target codebase's component primitives and design system if one exists.

## Screens / Views

### 1. Top Bar (persistent across all screens)

**Layout:** flex row, justify-between, padding 16px 32px, 1px bottom border (`--line`), background `--bg`.

**Left — Brand:** SVG logo (32x32 viewBox, `currentColor` accent) + serif wordmark "Verse" + monospace tag "music · english" (uppercase, 11px, letter-spacing 0.06em, color `--ink-3`).

**Center — Nav:** three pill buttons "Now Playing" / "Library" / "Profile". Active pill has `--bg-2` background, font-weight 500. Hover lifts color from `--ink-2` to `--ink`.

**Right — Status pills:**
- Level pill: small `--accent`-colored dot with a glowing 3px ring + "Adapting · CEFR B1" text (monospace, 12.5px)
- Streak pill: 🔥 emoji + "23" (font-weight 600, color `--ink`)

Both pills: `--bg-2` background, 999px radius, 6/12px padding.

---

### 2. Now Playing (`Player`)

**Layout:** CSS grid, two columns `minmax(420px, 0.9fr) minmax(520px, 1.1fr)`, no gap, full height. Left column is the album side, right column is lyrics. Below 1100px wide: stacks to single column.

#### Player Left (album side)

- Padding: 48px 56px 32px
- Background: `linear-gradient(180deg, var(--bg) 0%, var(--bg-2) 100%)`. Dark theme uses `var(--bg) → #0a0a0e`
- Right border: 1px `--line`
- Flex column, gap 28px

**Album Art (circular vinyl, 380×380px):**
- Outer wrapper has `filter: drop-shadow(0 30px 50px rgba(0,0,0,0.18))`
- Disc: `position: absolute; inset: 0; border-radius: 50%; overflow: hidden`
- Background: `radial-gradient(circle at 30% 30%, var(--song-color-1) 0%, var(--song-color-2) 70%, #1a1a1a 100%)`
- Grooves layer: `repeating-radial-gradient(circle at 50% 50%, transparent 0 5px, rgba(0,0,0,0.10) 5px 6px)`, mix-blend-mode multiply, 70% opacity, inset 8%
- Center label: 36% size circle in `--song-color-2`, with inset shadow
- Center hole: 14% white circle
- **Spin animation:** 14s linear infinite. Use `animation-play-state: paused/running` (toggled by `.spinning` class), NOT add/remove the animation — otherwise pausing resets rotation to 0°. `will-change: transform`.

**Now Meta (centered text block):**
- Eyebrow: monospace 11px uppercase, letter-spacing 0.12em, color `--ink-3`. Text: `Now Playing · CEFR B1`
- Title: `--font-display` (Instrument Serif), 44px, line-height 1.05, letter-spacing -0.01em, font-weight 400. `text-wrap: balance`. Playful theme: 500 italic.
- Artist: 14px, `--ink-2`. Text: `Mira Vance · Paper Hours · 2024`

**Controls:**
- **Scrubber:** 6px tall track in `--ink-4`. Filled portion in `--ink` (Calm) or `--accent` (Playful/Dark). 14px circular thumb with 3px `--bg`-colored ring. Mouse-down on track sets time; drag continues until mouseup. Below the track: monospace 11px times row (`0:42` / `2:38`) split-justified.
- **Buttons row:** flex centered, gap 18px. Prev (40×40, `--ink-2`), Play/Pause (60×60 circle, `--ink` background → `--bg` icon; Playful/Dark use `--accent`/`--accent-ink`), Next (40×40). All hover: `transform: scale(1.06)`. Icons are inline SVGs (currentColor).

**Song Stats (below controls):**
- 1px dashed `--line` top border, padding-top 20px
- 3-column grid, equal gaps 16px
- Each: serif number 26px + uppercase mono label 10.5px (letter-spacing 0.1em, color `--ink-3`)
- Stats: `lines` (e.g. 22), `unique words` (computed from lyrics), `BPM` (e.g. 96)

#### Player Right (lyrics side)

- Padding: 36px 56px 0
- Flex column, min-height 0, position relative

**Lyrics Head:**
- Flex row split-justify, padding-bottom 16px, 1px `--line` bottom border
- Eyebrow "Lyrics" (mono 11px upper, `--ink-3`)
- Hint "Tap any word for a definition" (12.5px, `--ink-3`)

**Lyrics Scroll:**
- `flex: 1; overflow-y: auto; scrollbar-width: 0`
- Top/bottom padding: 35vh spacers (so first/last lines can center vertically)
- **Mask:** `mask-image: linear-gradient(180deg, transparent 0%, #000 12%, #000 84%, transparent 100%)` for the soft top/bottom fade
- Auto-scroll: when current line changes, smooth-scroll the line into vertical center using `container.scrollTo({ top, behavior: "smooth" })`. Compute target as `line.offsetTop - container.clientHeight / 2 + line.offsetHeight / 2`. **Never use scrollIntoView.**

**Lyric Line:**
- Padding 14px 4px
- Transitions: `filter .45s ease, opacity .45s ease, transform .35s`
- Lines have one of these states based on time vs lyrics array index: `current`, `past`, `future`
- **Soft-focus blur + fade:**
  - `dist = abs(idx - currentIdx)`
  - `blur = isCurrent ? 0 : min(4, 0.5 + (dist - 1) * 0.9)` (px)
  - `opacity = isCurrent ? 1 : max(0.18, 1 - dist * 0.20)`
  - Applied via inline `style.filter` and `style.opacity`. Adjacent lines: ~0.5px blur, 0.78 opacity. Far lines: 4px blur, 0.18 opacity.
- Optional `chorus` / `bridge` modifier classes from data:
  - Current chorus line: italic
  - Bridge line: 28px (vs 32px default)

**Lyric Text (`.lyric-en`):**
- `--font-display`, 32px, line-height 1.3, letter-spacing -0.005em, font-weight 400, `text-wrap: balance`
- Color: `var(--lyric-cur)` — the underlying brightness of the line; words override per-character

**Translation (`.lyric-cn`, when shown):**
- Below en, margin-top 6px
- 14px, color `--ink-3`. Current line: `--ink-2`. Playful: `--accent` at 80% opacity.

**Word (`.word`) — the karaoke heart:**
- `display: inline-block; cursor: pointer; position: relative`
- **Color uses CSS `color-mix` driven by an inline `--lit` variable (0..1):**
  ```css
  color: color-mix(in oklab, var(--lyric-future), var(--lyric-cur) calc(var(--lit, 0) * 100%));
  ```
- `--lit` is computed per-frame in JS:
  - Past line: `lit = 1`
  - Future line: `lit = 0`
  - Current line, karaoke ON: `lit = clamp(progress * wordCount - wordIdx, 0, 1)` where `progress = (time - line.t) / (nextLine.t - line.t)`. This produces a continuous 0→1 ramp per word as playback sweeps through, so the bright color *flows* across the word rather than popping on/off.
  - Current line, karaoke OFF: `lit = 1`
- **Hover:** `color: var(--accent) !important` + animated underline. Underline is a `::after` 2px bar that scaleX from 0→1 over 0.15s.
- Click handler opens vocab card.

**Tokenization:** split each line into tokens via regex `([A-Za-z']+)|([^A-Za-z']+)` so words are taggable but punctuation/spaces preserved.

#### Vocab Card (slides up on word tap)

**Backdrop:**
- `position: fixed; inset: 0; background: rgba(20,16,10,0.18); backdrop-filter: blur(2px)` (Dark theme: rgba(0,0,0,0.55))
- Click outside closes
- Fade-in 0.15s

**Card:**
- `position: fixed; bottom: 32px; right: 56px; width: 420px`
- `--paper` background, 1px `--line` border, `--radius-lg` (22px Calm / 28px Playful / 20px Dark)
- Padding 24px 24px 20px
- `--shadow-md` shadow
- Slide-up entry animation: `from { transform: translateY(40px); opacity: 0 }`, 0.28s `cubic-bezier(.2,.7,.2,1)`
- Close: `closing` class triggers slide-down 0.2s before unmount

**Close button:** absolute top-right, 28×28 circle, `--bg-2` background, X icon

**Header row:**
- Left: word in serif 32px (e.g. "soften"), then meta row with IPA (mono, `--ink-2`), POS (italic mono `--ink-3`), CEFR pill (`--bg-2` 6px radius)
- Right: pronunciation play button — 38×38 circle, `--bg-2` background, speaker SVG icon. Hover: color `--accent`. (No actual audio in prototype.)

**Body stack (gap-styled):**
- CN gloss: 18px font-weight 500, color `--ink` (Playful: `--accent`). E.g. `使柔和;软化`
- Definition: 14.5px line-height 1.55, color `--ink-2`. Plain English explanation.
- Example block: `--bg-2` background, `--radius` (14px), 12/14px padding, **3px left border in `--accent`**. Inside: serif italic 17px EN sentence, then 13px CN translation.
- Source line: 12px `--ink-3`, "From this song: *line excerpt*"

**Save button (full width):**
- 12/16px padding, `--radius`, font-size 14px font-weight 500
- Default state: `--ink` background, `--bg` text, "Save to flashcards" + bookmark icon. Playful/Dark use `--accent`/`--accent-ink`.
- Saved state: `--bg-2` background, `--ink` text, "Saved to flashcards" + check icon
- Hover: `transform: translateY(-1px)`

**Save → Confetti + Toast:**
- On save, fire 18 confetti pieces from button center: each piece 6–14px wide × 40% tall, animated 0.9s with cubic-bezier(.2,.7,.2,1) — radial outward + 30px gravity drop + 180° rotation, opacity 1→0
- Colors cycle through 5: song.color, `#f5d76e`, `#ff8a8a`, `#7ec4cf`, `#c8a2ff`
- Toast pill at top-center 28px from top: `--accent` background, `--accent-ink` text, 999px radius, 13.5px font, fades in 0.25s, auto-dismisses 2.2s. Message: `Saved "soften" to flashcards`. Info toasts use `--ink`/`--bg`.

---

### 3. Library (`LibraryScreen`)

**Layout:** screen container with 40px 56px 64px padding, vertical scroll.

**Head:**
- Flex row split-justify, margin-bottom 32px
- Left: eyebrow "Library" + serif 56px title "Songs to learn" (line-height 1, letter-spacing -0.02em)
- Right: filter chips row — `All`, `A1`, `A2`, `B1`, `B2`, `C1`. Mono 12.5px, 999px radius, 7/14px padding, 1px `--line` border. Active: filled `--ink` bg, `--bg` text. Playful/Dark: filled `--accent`.

**Grid:**
- `grid-template-columns: repeat(auto-fill, minmax(240px, 1fr))`, gap 28px

**Card:**
- Flex column, gap 14px
- Hover: `transform: translateY(-3px)` over 0.18s
- **Cover:** circular vinyl (same recipe as the now-playing album, smaller 220px max), with grooves and white center hole. If `playing`, applies the spin animation continuously and shows a "PLAYING" badge centered top.
- **Meta:** title in serif 22px `--ink`, artist 13.5px `--ink-2`, then tag row:
  - CEFR tag (`tag-level`): mono 10.5px upper, color `--accent`, background `color-mix(in srgb, var(--accent) 12%, transparent)`
  - Genre tag: mono 10.5px upper, `--ink-3` on `--bg-2`
  - Duration tag: same as genre

**Filter behavior:** "All" shows everything; level chips filter to that exact level only. The tweak-level setting also restricts library to songs ≤ user level + 1 (e.g. user at B1 sees A1/A2/B1/B2; C1 hidden until they upgrade).

---

### 4. Profile (`ProfileScreen`)

**Layout:** `max-width: 1200px; margin: 0 auto`. Grid:
```
grid-template-columns: 1fr 1.2fr 1.2fr
grid-template-areas:
  "hero week life"
  "hero recent ach"
gap: 20px
```
Below 1100px: stacks to 2-col with hero spanning full width on top.

**Card (shared style):**
- `--paper` bg, 1px `--line` border, `--radius-lg`, 24px padding, `--shadow-sm`
- Card eyebrow: mono 10.5px upper letter-spacing 0.12em `--ink-3`, margin-bottom 18px

**Profile Hero (left tall):**
- Centered flex column, 40px 28px padding
- Avatar: 100px gradient ring (`linear-gradient(135deg, var(--accent), var(--accent-2))`) with 92px inner `--paper` circle holding initial in serif 40px
- Name: serif 32px
- Sub: 13px `--ink-3` "Member since Mar 2025 · CEFR B1"
- Streak block (margin-top 32px, dashed top border): serif 64px number with 🔥 emoji 40px, mono uppercase label "day streak"

**This Week card:**
- 7-bar histogram, 140px tall. Each bar: linear-gradient(180deg, `--accent` 0%, color-mix accent+accent-2 100%), top corners 6px radius. Day labels M/T/W/T/F/S/S in mono 11px `--ink-3` underneath.
- Foot row (dashed top border): serif 24px "82 min" + 12.5px muted "listened this week"

**Lifetime card:**
- 2×2 grid, gap 20/16px. Each cell: serif 36px stat number + mono uppercase 10.5px label
- Stats: total time (e.g. `21h`), songs (47), words known (612), flashcards (live count)

**Recent Listening:**
- Stack of rows, dashed bottom-border per row except last
- Each row: left song in serif 17px + artist 12.5px `--ink-3`, right group with mono 12px `--accent` minutes + mono 11px `--ink-3` date upper

**Achievements:**
- 3 stacked items, 14px gap. Each: 12px padding, `--bg-2` rounded card, flex row with 44×44 emoji circle (`--paper` bg) + title (14.5px font-weight 500) + sub (12.5px `--ink-3`)

---

### 5. Tweaks Panel (floating, host-protocol bound)

The Tweaks UI uses the `TweaksPanel` component (panel chrome + drag + close + host postMessage protocol). Inside:

- **Visual style** (TweakSelect dropdown): Calm / Playful / Dark
- **Karaoke highlight** (TweakToggle)
- **Show 中文 translation** (TweakToggle)
- **Level** (TweakRadio segmented): A2 / B1 / B2 — with a small italic note "Library hides songs above your level + 1."

In the real app, replace this shell with your own settings UI/route — but **keep the `data-style` attribute on `<html>`** as the theme switch hook.

---

## Interactions & Behavior

### Playback

- 60Hz `requestAnimationFrame` loop ticks `time` forward by `dt` while `playing === true`. **Replace with real `<audio>` element** in production: bind `timeupdate`, `play`, `pause`, `ended`, `seek` events; current code is a synthetic clock.
- At end-of-song: `playing = false`, `time = 0`. (Real app: queue next song.)
- Persist `time` to `localStorage` per song id (`verse:time:${songId}`) so refreshes restore position. Same for `view` and `songId`.

### Lyrics sync

- `currentIdx` = the largest index where `lyrics[i].t <= time`. Recompute via `useMemo([time, lyrics])`.
- When `currentIdx` changes, the now-current line's `useEffect` runs `container.scrollTo({...})` to recenter.
- Word `--lit` recomputes every render — this is fine because the parent `time` state already drives renders at ~60fps.

### Word tap → vocab card

- Tap dispatches `handleWord(rawText, line)`.
- Lookup: lowercase → strip non-`[a-z']` → match `GLOSSARY[key]`. Fallback: try stripping trailing `s`. (Replace with real lemmatizer + dictionary API in production — e.g. WordNik, Free Dictionary API, or your own backend.)
- No match → info toast "No definition for "X" yet" (1.8s).
- Match → set `openWord = { entry, line, key }`, render backdrop + card.

### Save flashcard

- Click save → toggle in `saved` Set (state). Saved state shows checkmark variant.
- On *new save*: capture button bounding rect, render `<Confetti x y color>` for 1.1s, trigger success toast for 2.2s.
- On unsave: info toast "Removed from flashcards", no confetti.
- **In production:** persist saved set to backend per user; bind to flashcard review system with SRS scheduling.

### Navigation

- Top-bar nav switches `view`. `localStorage` persists.
- Library card click → `setSongId` + auto-jump to player.
- Player prev: if `time > 3` rewind to 0; else go to previous song. Player next: always advance.

### Tweaks

- Tweak changes are applied live via React state and persisted via `__edit_mode_set_keys` postMessage protocol (the host rewrites the JSON block on disk between EDITMODE-BEGIN/END markers). **In production:** replace with your settings store (Redux/Zustand/server) — these markers are prototype tooling.

---

## State Management

Component-local `useState` is used throughout the prototype. For production:

- **App-level state** (Redux Toolkit / Zustand):
  - Current view, current song id, playback state (time, playing)
  - User profile (name, level, streak, totals)
  - Saved vocab Set
  - Tweaks (theme, karaoke, translation, level)
- **Server state** (TanStack Query or similar):
  - Songs catalog (`SONGS` array → API)
  - Glossary lookups (`GLOSSARY` object → API)
  - User progress / streak / weekly bars
  - Flashcards (CRUD)
- **Persisted to localStorage** in prototype (replace per your auth + session model):
  - `verse:view`, `verse:song`, `verse:time:${songId}`

---

## Design Tokens

All themes share the same token *names*; values change per `data-style` attribute on `<html>`.

### Theme: Calm (default)
| Token | Value |
|---|---|
| `--bg` | `#f5f1ea` |
| `--bg-2` | `#ede7dc` |
| `--paper` | `#faf7f1` |
| `--ink` | `#1a1916` |
| `--ink-2` | `#4a4844` |
| `--ink-3` | `#8a8780` |
| `--ink-4` | `#c9c4ba` |
| `--line` | `#e2dccf` |
| `--accent` | `oklch(0.62 0.07 145)` (sage) |
| `--accent-2` | `oklch(0.62 0.07 70)` (warm gold) |
| `--accent-ink` | `#ffffff` |
| `--lyric-cur` | `#1a1916` |
| `--lyric-past` | `#aaa49a` |
| `--lyric-future` | `#c9c4ba` |
| `--radius` | `14px` |
| `--radius-lg` | `22px` |

### Theme: Playful
| Token | Value |
|---|---|
| `--bg` | `#fff8f0` |
| `--bg-2` | `#ffeed8` |
| `--paper` | `#ffffff` |
| `--ink` | `#2b1d3a` |
| `--ink-2` | `#5a4a6f` |
| `--ink-3` | `#8c7c9c` |
| `--ink-4` | `#d8ccdf` |
| `--line` | `#f1e3d0` |
| `--accent` | `#ff5d8f` |
| `--accent-2` | `#ffb347` |
| `--lyric-cur` | `#2b1d3a` |
| `--lyric-past` | `#c2b6cc` |
| `--lyric-future` | `#ddd2e4` |
| `--radius` | `18px` |
| `--radius-lg` | `28px` |

### Theme: Dark
| Token | Value |
|---|---|
| `--bg` | `#0e0e12` |
| `--bg-2` | `#16161e` |
| `--paper` | `#1c1c26` |
| `--ink` | `#f3efe8` |
| `--ink-2` | `#b8b3aa` |
| `--ink-3` | `#6e6a62` |
| `--ink-4` | `#3a3740` |
| `--line` | `#2a2832` |
| `--accent` | `#d4a574` |
| `--accent-2` | `#c38d9e` |
| `--accent-ink` | `#1a1a1a` |
| `--lyric-cur` | `#f3efe8` |
| `--lyric-past` | `#5a5650` |
| `--lyric-future` | `#3e3b36` |
| `--radius` | `14px` |
| `--radius-lg` | `20px` |

### Typography

- **Display:** `Instrument Serif`, fallback Cormorant Garamond / Georgia, weight 400, italic supported. Used for titles, lyrics, big numbers. Playful theme uses `Fraunces` instead.
- **Sans:** `Geist`, weights 300/400/500/600
- **Mono:** `Geist Mono`, weights 400/500. Used for eyebrows, stats labels, IPA, time codes, tags.

All Google Fonts. Preconnect + single CSS import.

### Spacing

No formal scale — uses raw px. Common values: 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 56, 64.

### Shadows

- `--shadow-sm` (Calm): `0 1px 2px rgba(60,50,30,0.06), 0 4px 14px rgba(60,50,30,0.04)`
- `--shadow-md` (Calm): `0 4px 20px rgba(60,50,30,0.08), 0 20px 50px rgba(60,50,30,0.06)`
- Playful shadows: tinted with the accent colors (`rgba(255,93,143,...)`)
- Dark shadows: pure black at 40–55% alpha
- Album drop-shadow (always): `drop-shadow(0 30px 50px rgba(0,0,0,0.18))` (filter, not box-shadow, so it follows the circle)

### Animations

| What | Duration | Easing |
|---|---|---|
| Album spin | 14s | linear infinite |
| Lyric line blur/opacity | 0.45s | ease |
| Lyric scroll recenter | smooth | (browser default) |
| Vocab card slide-up | 0.28s | cubic-bezier(.2,.7,.2,1) |
| Vocab card slide-down | 0.20s | ease |
| Backdrop fade | 0.15s | ease |
| Confetti pop | 0.9s | cubic-bezier(.2,.7,.2,1) |
| Toast in | 0.25s | ease |
| Library card lift | 0.18s | (default) |
| Word hover underline | 0.15s | (default) |
| Word color (lit) | continuous, no transition | — |

---

## Assets

No external image assets. Album art is rendered procedurally via radial-gradient + repeating-radial-gradient (grooves). Icons are inline SVGs (Feather-style strokes, currentColor). Emoji used: 🔥 (streak), ⭐ 📚 🎵 (achievements).

For production, the song list will need real cover artwork — keep the gradient as a fallback for songs without covers.

---

## Screenshots

See `screenshots/` folder:

- `01-now-playing-calm.png` — Now Playing in the default Calm theme. Album, lyrics with karaoke + soft-focus, transport controls.
- `02-now-playing-with-vocab.png` — Vocab card slid up after tapping a word.
- `03-library.png` — Library grid filtered by CEFR level.
- `04-profile.png` — Profile dashboard with streak, weekly bars, lifetime stats, recent listening, achievements.
- `05-now-playing-playful.png` — Same Now Playing screen in the Playful theme (pink + warm yellow).
- `06-now-playing-dark.png` — Same Now Playing screen in the Dark theme (gold accent on deep navy).

## Files in this bundle

- `index.html` — entry point. Loads React 18, Babel, Geist + Instrument Serif + Fraunces from Google Fonts, then the .jsx scripts in order.
- `app.jsx` — `App` shell, top bar, view switching, tweaks integration. Contains the `EDITMODE-BEGIN`/`END` JSON block with tweak defaults — replace with your settings store.
- `player.jsx` — `Player`, `AlbumArt`, `Controls`, `LyricsPanel`, `LyricLine`, `VocabCard`, `Confetti`, `tokenize`, `lookupWord`, `formatTime`. The lyrics karaoke logic lives here.
- `screens.jsx` — `LibraryScreen`, `ProfileScreen`.
- `data.jsx` — `SONGS` (6 songs, 1 fully lyriced), `GLOSSARY` (~40 word entries with IPA/POS/CN/def/example/CEFR), `INITIAL_SAVED`, `PROFILE`.
- `tweaks-panel.jsx` — prototype-only tweaks shell. Discard in production.
- `styles.css` — all styles, organized: themes → layout shell → top bar → player → lyrics → vocab card → toast/confetti → library → profile → responsive.

## Production checklist

When porting, the developer should:

1. Stand up a real React app (Vite + TS recommended). Drop Babel-in-browser.
2. Replace the synthetic playback clock with a real `<audio>` element bound to the song URL.
3. Move `SONGS` and `GLOSSARY` to a backend (or static JSON to start). Glossary lookups should hit a real dictionary endpoint with proper lemmatization for user-tapped words.
4. Plug in real i18n — Chinese is hardcoded in the prototype; the real app should detect or let the user pick their L1 and fetch translations accordingly.
5. Persist saved flashcards + streaks to a backend tied to user accounts.
6. Add an audio waveform-aligned timestamp tool to author lyric `t` values for new songs (the prototype was hand-timed).
7. Remove the Tweaks panel; expose theme + level + karaoke/translation toggles in a real Settings screen.
8. Add motion-reduced fallbacks: respect `prefers-reduced-motion` for the album spin, lyric blur transitions, confetti.
9. Accessibility: keyboard navigation across lyric words, ARIA labels on transport controls, focus-visible rings, screen-reader-only translation toggle announcement.
10. Mobile breakpoint — current responsive guard at 1100px stacks columns, but real mobile UX needs its own player layout (full-bleed lyrics, bottom-sheet vocab card).
