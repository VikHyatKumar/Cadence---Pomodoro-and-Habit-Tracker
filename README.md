<div align="center">

# Cadence

**Pomodoro timer and habit tracker for people who want their week back.**

[![Tests](https://img.shields.io/badge/Tests-5%20passing-brightgreen?style=flat-square)](./src/test)
[![Bundle](https://img.shields.io/badge/Bundle-194KB%20gzip-blue?style=flat-square)](./dist)

[View Demo](https://cadence-vikhyat.vercel.app) · [Features](#features)

</div>

---

## Overview

Most productivity apps are either too complex (accounts, sync, subscriptions) or too shallow (just a countdown). Cadence sits in the middle — a **browser-only** tool that combines a technically correct Pomodoro timer with habit tracking and a visual stats dashboard, all persisted to `localStorage` with zero backend.

The interesting engineering isn't the UI. It's the browser APIs underneath: timestamp-based timer logic that survives background tab throttling, the Web Audio API for session chimes, the Notification API, `visibilitychange` handling, and pure-function streak math that's independently unit tested.

---

## Screenshots

| Timer — focus session with progress ring | Habits — today view + 7-day grid |
|---|---|
| ![Timer page](docs/Screenshot%202026-05-12%20225725.png) | ![Habits page](docs/Screenshot%202026-05-12%20225736.png) |

| Stats — charts + summary cards | Dark mode |
|---|---|
| ![Stats page](docs/Screenshot%202026-05-12%20225751.png) 

---

## Features

**Timer**
- Pomodoro work / short break / long break cycles (25 / 5 / 15 min, configurable)
- Auto-advances to the next mode when a session ends
- Session cycle indicator — dots show progress toward the long break every 4 sessions
- `Space` to start/pause, `R` to reset — bound to `document`, ignored inside inputs
- Web Audio API chime on completion (no audio file needed — oscillator-generated)
- Browser Notification API alert when the tab is in the background
- Sound on/off toggle in a settings popover
- Timestamp-based countdown — accurate even after backgrounding the tab for minutes

**Habits**
- Add habits with a name + emoji (12-emoji picker, no library)
- One-click check-off for today with a visual done state
- 7-day grid showing the past week per habit — click any cell to toggle
- Streak counter per habit (current consecutive-day run, shown as a flame badge)
- Today's column highlighted in the grid

**Stats**
- Bar chart — Pomodoro sessions per day, last 7 days
- Bar chart — Habit completion rate (%) per day, last 7 days
- Summary cards: focus time today, focus time this week, best habit streak
- Meaningful empty states when no data exists yet

**General**
- Light / dark mode — persisted to `localStorage`, respects `prefers-color-scheme` on first load
- All data persisted via Zustand `persist` middleware — survives page refresh
- Hydration gate prevents empty-state flicker on load
- Keyboard-navigable with visible focus rings everywhere

---

## Tech Stack

| Library | Version | Why |
|---|---|---|
| **React + Vite** | 19 / 5 | Fast dev loop, native ESM, no CRA overhead |
| **React Router** | v7 | 3 routes (`/timer`, `/habits`, `/stats`) — routing-ready |
| **Zustand + persist** | v5 | Global state + localStorage in one `create()` call, selector subscriptions avoid unnecessary re-renders |
| **Tailwind CSS** | v3 | Utility-first, `dark:` variant for dark mode without a CSS-in-JS runtime |
| **Recharts** | v3 | Declarative React chart components, lightweight |
| **date-fns** | v4 | Tree-shakeable date math — `subDays`, `format`, `isSameDay` |
| **lucide-react** | — | Clean icon set, ships as individual components |
| **Vitest** | v1 | Fast ESM-native test runner — streak logic is unit tested |

**No backend. No auth. No external API calls.**

---

## Architecture Decisions

### 1. Timestamp-based timer, not `setInterval` decrement

The naive approach — decrement a counter by 1 every second — breaks under background tab throttling. Browsers cap `setInterval` in inactive tabs to fire at most once per second (sometimes less). A 25-minute session backgrounded for 10 minutes can drift by 30+ seconds.

**The fix:** on Start, record `endsAt = Date.now() + remainingMs`. Every 250ms, compute `remaining = endsAt - Date.now()`. `Date.now()` is never throttled — the arithmetic is always accurate. A `visibilitychange` listener calls `tick()` immediately when the tab regains focus so the display syncs without waiting for the next interval.

```js
// src/hooks/useTimer.js
endsAtRef.current = Date.now() + remaining   // set on Start
// inside setInterval:
const remainingMs = endsAtRef.current - Date.now()  // always accurate
```

### 2. Zustand + `persist` over Context or Redux

Context re-renders every consumer on every state change. With a timer updating every 250ms, that's 4 re-renders per second for any component inside the provider — including ones that don't care about the time. Zustand solves this with selector subscriptions: a component only re-renders when the specific slice it selects actually changes.

Redux would solve the same problem but adds ~50 lines of reducer + action boilerplate for what amounts to two small stores. Zustand's `persist` middleware wraps the store with one call and handles `localStorage` serialization on every `set()`.

```js
const useTimerStore = create(
  persist((set) => ({ ... }), { name: 'cadence-timer' })
)
```

### 3. Pure functions for streak logic

`getStreak` and `getCompletionRate` in [`src/lib/streaks.js`](src/lib/streaks.js) are plain functions: data in, number out. No store imports, no hooks, no side effects. This makes them:

- **Testable in isolation** — 5 Vitest cases, no mocking required
- **Reusable** — called from both `HabitsPage` (streak badges) and `StatsPage` (best-streak card) without prop drilling or duplicating logic

```js
// data in → number out, no React, no store
export function getStreak(completions = {}, today = new Date()) { ... }
export function getCompletionRate(completions = {}, days = 7) { ... }
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18

### Installation

```bash
git clone https://github.com/<your-handle>/cadence
cd cadence
npm install
```

### Development

```bash
npm run dev      # starts at http://localhost:5173
```

### Testing

```bash
npm test         # runs 5 streak unit tests
```

### Production build

```bash
npm run build    # outputs to dist/ — 194 KB gzipped
npm run preview  # preview the production build locally
```

---

## Project Structure

```
src/
├── components/          # (shared components, if added)
├── hooks/
│   ├── useTimer.js      # timestamp-based countdown logic
│   └── useTheme.js      # dark/light toggle + localStorage
├── lib/
│   ├── audio.js         # Web Audio API oscillator chime
│   └── streaks.js       # pure streak + completion-rate functions
├── pages/
│   ├── TimerPage.jsx    # pomodoro UI + keyboard shortcuts
│   ├── HabitsPage.jsx   # add/remove, today check-off, 7-day grid
│   └── StatsPage.jsx    # recharts + summary cards
├── store/
│   ├── useTimerStore.js # Zustand: durations, session log
│   └── useHabitStore.js # Zustand: habits, completions
└── test/
    └── streaks.test.js  # 5 Vitest cases for getStreak
```

---

