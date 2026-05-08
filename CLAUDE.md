# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LyricLearn — a web app for learning English through 网易云 music. Listen to songs, see synced lyrics, click any word for AI-powered explanation (DeepSeek), save to an offline vocabulary notebook.

## Starting the Project

```powershell
# One-click launch (opens two background windows + browser)
.\start.ps1

# Or manually:
# Backend (port 3000)
cd backend && node app.js

# Frontend (port 5173)
cd frontend && node node_modules\.bin\vite.CMD
```

## Frontend Commands (run from `frontend/`)

```powershell
node node_modules\.bin\vite.CMD          # dev server
npx tsc --noEmit                         # type-check only
node node_modules\.bin\vite.CMD build    # production build (runs tsc first)
npx eslint .                             # lint
```

> No test suite exists in this project.

## Architecture

Two separate processes:

- **`backend/app.js`** — thin Node.js wrapper that starts `NeteaseCloudMusicApi` (npm package) on port 3000. Provides REST endpoints for search, audio URL, and lyrics. No custom logic here.
- **`frontend/`** — React 19 + TypeScript + Vite 8 SPA. All app logic lives here.

### Frontend Data Flow

```
SearchBar → netease.ts (cloudsearch/song/url/v1/lyric) → playerStore
    ↓
useAudioPlayer (HTML5 Audio)  ←→  playerStore (audioUrl, isPlaying, playbackRate)
useLyricsSync (timeupdate)    ←→  playerStore (currentTime → currentLineIndex)
    ↓
LyricsPanel → LyricLine (word tokenization)
    ↓ (word click)
WordPopup → deepseek.ts (DeepSeek API) → module-level Map cache
    ↓ (save)
useVocabNotebook → Dexie IndexedDB → notebookStore → NotebookPanel
```

### State Management (Zustand stores)

| Store | Key state |
|-------|-----------|
| `playerStore` | `song`, `audioUrl`, `lyrics`, `translationLyrics`, `currentLineIndex`, `isPlaying`, `playbackRate`, `currentTime`, `duration` |
| `notebookStore` | `isOpen`, `entries` |
| `settingsStore` | `deepseekApiKey` (persisted to `localStorage`) |

### API Proxy

`/api/*` in the frontend proxies to `http://localhost:3000` (configured in `vite.config.ts`). All Netease calls go through `src/services/netease.ts` using this proxy.

Active endpoints:
- `/api/cloudsearch?keywords=&limit=15` — search (returns `ar`/`al` fields with cover URLs)
- `/api/song/url/v1?id=&level=standard` — audio stream URL
- `/api/lyric?id=` — LRC lyrics + Chinese translation

### Key Implementation Details

**Lyric sync**: `useLyricsSync` does a linear scan on every `timeupdate` event to find the current line index, guarded to only call `setCurrentLineIndex` when the index actually changes.

**Audio playback**: `useAudioPlayer` manages a single `HTMLAudioElement` ref. When `audioUrl` changes it loads and sets `isPlaying=true`; the `isPlaying` effect handles the actual `.play()/.pause()` call.

**Vocab notebook**: `useVocabInit()` (called once in `App.tsx`) loads the DB into `notebookStore` on mount. `useVocabNotebook()` (called in `WordPopup`, `NotebookPanel`) provides only `saveWord`/`deleteWord` without re-triggering DB reads.

**DeepSeek caching**: `src/services/deepseek.ts` uses a module-level `Map` keyed by `word::songName` — cache lives for the session only.

**Tailwind v4**: Uses `@tailwindcss/vite` plugin — no `tailwind.config.js` needed. Just `@import "tailwindcss"` in `index.css`. Avoid creating a config file.

**CSS animations**: `vinyl-spinning`/`vinyl-paused` classes and `shimmer-line` are defined in `src/index.css`. Do not duplicate these inline.

**LRC format**: `src/lib/lrc-parser.ts` parses `[mm:ss.xx]` timestamps into `{ time: number, text: string }[]` sorted by time. Both main lyrics and Chinese translations use this format.
