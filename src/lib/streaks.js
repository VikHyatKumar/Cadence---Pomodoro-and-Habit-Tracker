import { subDays, format } from 'date-fns'

function dateStr(date) {
  return format(date, 'yyyy-MM-dd')
}

// CONCEPT: pure functions — no side effects, no store imports. Pure functions are
// trivially testable: given the same inputs, always the same output.

// Returns current consecutive-day streak ending today (or yesterday if today not done).
export function getStreak(completions = {}, today = new Date()) {
  let streak = 0
  const todayStr = dateStr(today)
  const hasToday = !!completions[todayStr]

  // Start counting from today if done, else from yesterday
  let cursor = hasToday ? today : subDays(today, 1)

  while (completions[dateStr(cursor)]) {
    streak++
    cursor = subDays(cursor, 1)
  }

  return streak
}

// Returns completion rate (0–1) for the last `days` days including today.
export function getCompletionRate(completions = {}, days = 7, today = new Date()) {
  let done = 0
  for (let i = 0; i < days; i++) {
    const d = dateStr(subDays(today, i))
    if (completions[d]) done++
  }
  return done / days
}

export { dateStr }