# Cadence — Interview Prep

Read this tonight before applying. Know it cold.

---

## Section A — Project Q&A

**"Walk me through Cadence."**
Cadence is a browser-only productivity tool — a Pomodoro timer with work/break cycles, a habit tracker with a 7-day grid view, and a stats dashboard with charts. Everything persists to localStorage, no backend. I built it in a day to demonstrate browser APIs that most portfolios avoid: the Audio API, the Notification API, the Page Visibility API, timestamp-based timer logic, and data visualization with Recharts. The interesting part isn't the UI — it's the engineering decisions underneath.

**"What was the hardest part?"**
Getting the timer right. My first instinct was to decrement a counter in `setInterval` — that's the obvious approach. But background tabs throttle `setInterval` to about once per second to save battery, so if you switch tabs during a 25-minute session, the timer drifts noticeably. The fix was to store the absolute future timestamp when the timer starts, and compute `remaining = endsAt - Date.now()` on each tick. `Date.now()` is never throttled, so it's always accurate. I also added a `visibilitychange` listener to re-sync the display immediately when the tab comes back into focus.

**"How does your timer handle background tabs? Walk me through it."**
When the user clicks Start, I store `endsAt = Date.now() + remainingMs` in a ref. A `setInterval` fires every 250ms and computes `remainingMs = endsAt - Date.now()`. If the tab is backgrounded, the browser may throttle the interval to 1-second intervals, but `Date.now()` stays accurate, so the computation is still correct — we just update the display less frequently. When the tab comes back into focus, a `visibilitychange` listener calls `tick()` immediately so the display snaps to the right value without waiting for the next interval.

**"Why didn't you just decrement a counter in setInterval?"**
Because background tabs throttle `setInterval` — Chrome throttles inactive tabs to fire no more than once per second, sometimes less. If you're running a 25-minute work session with a 250ms interval and switch tabs, you could come back to a timer that's off by 30+ seconds. Timestamp-based logic sidesteps this entirely: we don't care *when* we check, just *what time it is now*.

**"How does the Notification API work? When did you request permission?"**
The Notification API requires explicit user permission, and browsers won't let you request it without a user gesture — if you call `Notification.requestPermission()` on page load, some browsers block it silently. So I request permission on the first time the user clicks Start or hits Space. That's a genuine user interaction, and it's the right moment UX-wise — if you're starting a focus session, you probably want to know when it ends. Once granted, `new Notification('Cadence', { body: '...' })` fires on session completion.

**"Why Zustand over Redux or Context?"**
Context re-renders every consumer on every state change — fine for low-frequency data, but the timer updates every 250ms. With Context, every component inside the provider would re-render on each tick, even ones that don't care about the time. Redux avoids that with selectors but adds significant boilerplate for a 2-store app. Zustand gives me selector subscriptions out of the box — a component only re-renders if the slice of state it selects actually changed — and `create()` is 15 lines instead of 50. Plus the `persist` middleware adds localStorage in one wrapper call.

**"How does the persist middleware work?"**
Zustand's `persist` wraps your `create()` call. On startup, it reads from `localStorage.getItem('cadence-timer')`, parses the JSON, and merges it into the initial state. Every subsequent `set()` call serializes the new state back to localStorage synchronously. The hydration step is async on first render, which is why I gate the app render on `useTimerStore.persist.hasHydrated()` — without that gate, the UI briefly shows empty state before the data loads.

**"What happens if localStorage is full or disabled?"**
Zustand's persist middleware will throw on `setItem` if storage is full or blocked (e.g., Safari private mode). I don't handle this explicitly — the app continues to work in-memory, but state won't persist across reloads. The proper fix would be a try/catch in a custom storage adapter passed to the `persist` options. It's in the roadmap but out of scope for a 1-day build.

**"How is the streak calculated? Walk me through the logic."**
`getStreak(completions, today)` in `src/lib/streaks.js`. It gets the date string for today. If today is marked done, it starts counting backward from today. If today isn't done yet (it's still early in the day), it starts from yesterday — so your streak doesn't break just because you haven't checked in yet today. It walks backward day by day, using `subDays` from date-fns, counting consecutive completed days until it hits a gap. Returns the count.

**"Why did you put streaks in a separate pure-function file?"**
Two reasons. First, testability — pure functions take data and return data, no mocks needed. I can write 5 test cases in 30 lines. Second, reuse — `getStreak` is called from both `HabitsPage` (to show per-habit streak badges) and `StatsPage` (to compute the best streak summary card). If it lived inside a component or a hook, I'd have to lift state or duplicate logic.

**"How did you handle empty states?"**
Every data-driven surface has an explicit empty state. The Habits page shows "No habits yet" with a plant emoji when the array is empty. The Stats page charts show a text fallback ("No sessions logged yet. Start a pomodoro on the Timer page.") when there's nothing to graph. I check `hasPomodoros = data.some(d => d.count > 0)` before rendering the chart. Empty states are part of the UX — a blank chart area with no explanation looks broken.

**"What does your dark mode toggle actually change?"**
The `useTheme` hook adds or removes the `dark` class on `<html>`. Tailwind's `darkMode: 'class'` config means every `dark:` utility only activates when that class is present. The preference is saved to `localStorage` under `cadence-theme` and restored on load, so it survives page refreshes. The toggle is in the sidebar so it's always accessible without breaking the page layout.

**"How would you sync this across devices?"**
Replace the Zustand localStorage storage with a remote adapter. On `set()`, write to an API (Supabase realtime, Firebase, or a simple REST endpoint). On hydration, fetch from the API instead of `localStorage.getItem`. The Zustand store code doesn't change — just the storage backend. Auth would be needed first (Supabase Auth or similar).

**"How would you add reminders?"**
Two approaches. Simple: use the Notification API with a `setTimeout` set to fire at the start of the next session — already have notification permission from the timer. Robust: use the Web Push API with a service worker so notifications fire even when the tab is closed. The service worker registers a push subscription, the server sends a push at the scheduled time, the SW handles `push` events and calls `showNotification()`. The frontend part is straightforward; the server-side scheduling is the new piece.

**"What would you do differently with a week?"**
A few things. First, I'd add localStorage error handling — graceful degradation when storage is unavailable. Second, I'd move the streak logic into a custom hook backed by `useMemo` so it doesn't recompute on every render. Third, I'd add a service worker for offline support and push notifications. Fourth, I'd spend time on mobile layout — it works at 375px now but it's not polished. And I'd add more tests — the streak tests are there but the timer hook and the store actions aren't covered.

---

## Section B — JS / React Fundamentals

**Event loop, microtasks, setTimeout vs setInterval timing**
The event loop processes the call stack, then drains the microtask queue (Promises, queueMicrotask), then picks one macrotask (setTimeout, setInterval, I/O). `setInterval(fn, 250)` schedules a macrotask every 250ms — but if the call stack is busy, the task waits. Background tabs add another throttle: browsers cap inactive timers to fire at most once per second. This is exactly why the timestamp approach matters for Cadence's timer.

**Closures (with a setInterval example)**
A closure is a function that remembers the scope it was created in. Classic `setInterval` bug: `let count = 0; setInterval(() => console.log(count), 1000)` — if `count` is reassigned in another function, the interval sees the updated value because it closed over the binding, not the value. In Cadence, `tick` closes over `endsAtRef` (a ref) — refs are mutable objects, so the latest value is always accessible.

**Why useEffect cleanup matters**
`useEffect` returns a cleanup function that runs before the next effect execution or component unmount. Without cleanup, a `setInterval` from a previous render keeps firing after the component is gone — leaking memory, causing state updates on unmounted components, and potentially causing double-firing in Strict Mode. In `useTimer.js`, the cleanup returns `clearInterval(intervalRef.current)` and removes the `visibilitychange` listener.

**Refs vs state**
State triggers re-renders; refs don't. Use refs when you need to store a mutable value across renders without triggering a render — like an interval ID (`intervalRef`), a timestamp (`endsAtRef`), a DOM node, or the previous value of a prop. State is for anything that should cause the UI to update when it changes. In the timer, `remaining` (display value) is state; the interval ID and `endsAt` timestamp are refs.

**useMemo, useCallback, React.memo — when to bother**
Only when you have a measurable performance problem. `useMemo` caches a computed value between renders. `useCallback` caches a function reference — useful when passing callbacks to child components wrapped in `React.memo`, so the child doesn't re-render because the function reference changed. `React.memo` prevents a component from re-rendering if its props didn't change. The wrong time to reach for these: premature optimization of cheap computations.

**Controlled vs uncontrolled inputs**
Controlled: `value={state}` + `onChange={setState}` — React owns the value, the input reflects it. Uncontrolled: `defaultValue` + a ref to read on submit — the DOM owns the value. Use controlled when you need to validate on every keystroke, format input, or derive other state from the input value. Cadence uses controlled inputs everywhere (habit name, duration settings).

**Why React keys matter; what breaks with index keys**
The `key` prop tells React which list item is which across re-renders. React uses keys to decide whether to update an existing DOM node or unmount/remount. With index keys, removing the first item shifts all other items' indices — React thinks item 0 is still there but just changed its content, so it updates in place instead of remounting. This breaks animations, focus state, and any uncontrolled state inside the item. Use stable IDs as keys.

**Rules of hooks**
1. Only call hooks at the top level — not inside loops, conditionals, or nested functions. 2. Only call hooks from React function components or custom hooks. These rules exist because React tracks hook state by call order — if a hook is called conditionally, the order changes between renders and state gets mismatched.

**Strict mode double renders in dev**
React 18 Strict Mode intentionally calls your component function twice (and runs effects twice) in development to surface side effects. This is how it catches: state mutations, unclean effects, stale closures. Production builds don't double-render. The `useEffect` cleanup is what makes double invocation safe — clean up in the return function and the second run starts fresh.

**useState lazy initializer vs eager**
`useState(expensiveComputation())` calls `expensiveComputation` on every render, even though React only uses the value once (on mount). `useState(() => expensiveComputation())` passes a function — React calls it only once. Use the lazy form whenever the initial value is expensive: reading from localStorage, parsing JSON, complex calculations.

---

## Section C — Browser & Web Fundamentals

**localStorage vs sessionStorage vs IndexedDB vs cookies**
- `localStorage`: persists until explicitly cleared, ~5–10MB, synchronous, per-origin. Used by Cadence for store hydration and theme preference.
- `sessionStorage`: cleared when the tab closes, same API as localStorage.
- `IndexedDB`: async, transactional, supports large/structured data (files, blobs). Right tool for offline apps or large datasets.
- Cookies: sent with every HTTP request, max ~4KB, can be HTTP-only (inaccessible to JS) — for auth tokens, not app state.

**What happens when the tab is backgrounded**
The browser throttles `setInterval` and `setTimeout` for inactive tabs — in Chrome, to a minimum of 1 second. For suspended tabs or battery saver mode, even longer. The Page Visibility API lets you detect this: `document.visibilityState` is `'hidden'` when backgrounded. Cadence uses `visibilitychange` to force a re-sync when the tab becomes visible again.

**The Notification API permission model**
Three states: `'default'` (not asked yet), `'granted'`, `'denied'`. Call `Notification.requestPermission()` — returns a Promise. Once denied, you can't re-ask programmatically; the user must reset it in browser settings. Best practice: only request permission in response to a user gesture that makes the notification intent obvious. In Cadence: first click of Start.

**The Page Visibility API**
`document.visibilityState` is `'visible'`, `'hidden'`, or `'prerender'`. The `visibilitychange` event fires on the document when state changes. Use case: pause timers, videos, animations when hidden; resume and re-sync when visible. Cadence adds this listener in `useTimer.js` to catch up the display when the user switches back.

**The Audio API (autoplay restrictions)**
Browsers block audio playback unless triggered by a user gesture (click, keypress). If you call `audioElement.play()` or `AudioContext.resume()` without prior user interaction, the returned Promise rejects. Always wrap in try/catch or `.catch()`. Cadence uses a Web Audio API oscillator instead of an `<audio>` element — generates a programmatic beep without needing an audio file.

**Same-origin policy basics**
A browser only allows JS to read responses from URLs on the same origin (protocol + host + port). Cross-origin requests either fail silently or require CORS headers from the server. This is a browser security measure, not a server-side restriction. Cadence doesn't make network requests, so CORS is irrelevant — but it's why the travel-advisory API in a previous project needed a fallback.

**Semantic HTML — `<button>` not `<div onClick>`**
`<button>` is focusable by default, responds to Enter/Space, has an implicit ARIA role, and triggers click on keyboard. A `<div>` with onClick does none of these — you'd need `tabindex="0"`, `role="button"`, `onKeyDown` for Enter/Space, and still miss some AT behaviors. Use the native element.

**Focus management; visible focus rings**
Every interactive element needs a visible focus indicator for keyboard navigation. Tailwind's default removes the browser outline; use `focus-visible:ring-2 focus-visible:ring-blue-500` instead of `focus:outline-none` without a replacement. `:focus-visible` only shows the ring for keyboard navigation, not mouse clicks — best of both worlds.

**ARIA when needed (and when NOT)**
ARIA attributes (`role`, `aria-label`, `aria-pressed`, `aria-live`) supplement HTML semantics — they don't replace them. Don't use ARIA to paper over bad HTML. If you use `<button>`, `<nav>`, `<main>` correctly, you need minimal ARIA. Use `aria-label` when a button's visible text isn't self-explanatory (icon-only buttons). Use `aria-live` for dynamic updates (timer countdown). Don't add `role="button"` to a `<button>`.

**Flexbox vs Grid**
Flexbox: one-dimensional layout — either a row or a column. Best for nav bars, button groups, centering single items, distributing space along one axis. Grid: two-dimensional — rows and columns simultaneously. Best for card layouts, the habit 7-day grid, page-level structure. Cadence uses both: the sidebar + main area is flexbox (a row), the 7-day grid inside Habits is CSS Grid.

---

## Section D — STAR Stories

**1. Timer drift in background tabs**
- **Situation:** I built the initial timer with `setInterval` decrementing a state counter every second.
- **Task:** Test the timer across a real 25-minute session, including switching tabs.
- **Action:** Noticed drift of 30–60 seconds after backgrounding for 10 minutes. Researched browser throttling behavior. Refactored to store `endsAt = Date.now() + remaining` on Start and compute `remaining = endsAt - Date.now()` on each tick. Added `visibilitychange` listener for immediate re-sync.
- **Result:** Timer is accurate regardless of backgrounding. The approach is documented with `// CONCEPT:` comments in `useTimer.js` so anyone reading the code understands why.

**2. localStorage hydration flicker**
- **Situation:** After adding Zustand persist middleware, the app briefly showed an empty habits list before loading saved data from localStorage.
- **Task:** Eliminate the flicker so the app always loads with the correct state.
- **Action:** Investigated Zustand's hydration lifecycle. Found `persist.hasHydrated()` and `persist.onFinishHydration()`. Wrapped the app render in a `Root` component that gates rendering until both stores confirm hydration. Added a `check()` call immediately after subscribing in case hydration already completed synchronously.
- **Result:** Zero-flicker app load. State is always present on first paint.

**3. Notification permission UX**
- **Situation:** Initially called `Notification.requestPermission()` on page load inside a `useEffect`.
- **Task:** Make the permission request feel natural, not intrusive.
- **Action:** Chrome showed a warning that the request happened without user interaction. Moved the request to the first Start click — the user's intent is clear (they want to focus, they probably want to know when it ends). Also added a sound toggle in settings so users who don't want notifications still have an audio option.
- **Result:** Permission request feels contextually appropriate. No browser warnings. Sound toggle as fallback for users who deny notifications.

---

## Section E — Questions to Ask the Interviewer

1. "What does the first 90 days look like for someone in this role — what would I own, and what would I be ramping up on?"
2. "How does the frontend team handle code reviews and shipping cadence — feature flags, trunk-based dev, something else?"
3. "What's the state of your design system today — are you building one, iterating on one, or working from Figma specs without a system?"
4. "What does the testing culture look like — what percentage of the frontend is tested, and what tends to slip through?"
5. "What's the most interesting frontend problem the team is working on right now — something where the solution isn't obvious yet?"