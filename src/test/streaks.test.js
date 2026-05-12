import { describe, it, expect } from 'vitest'
import { subDays } from 'date-fns'
import { getStreak, dateStr } from '../lib/streaks'

const today = new Date('2025-06-10')
const ds = (d) => dateStr(d)

describe('getStreak', () => {
  it('returns 0 with no completions', () => {
    expect(getStreak({}, today)).toBe(0)
  })

  it('returns 1 when only today is completed', () => {
    expect(getStreak({ [ds(today)]: true }, today)).toBe(1)
  })

  it('returns 1 when only yesterday is completed (today not done)', () => {
    expect(getStreak({ [ds(subDays(today, 1))]: true }, today)).toBe(1)
  })

  it('returns 5 for a 5-day consecutive streak ending today', () => {
    const completions = {}
    for (let i = 0; i < 5; i++) completions[ds(subDays(today, i))] = true
    expect(getStreak(completions, today)).toBe(5)
  })

  it('breaks streak on a gap — only counts the current run', () => {
    // Day 0 (today) and day 1 done, gap at day 2, day 3 done
    const completions = {
      [ds(today)]: true,
      [ds(subDays(today, 1))]: true,
      // gap at day 2
      [ds(subDays(today, 3))]: true,
    }
    expect(getStreak(completions, today)).toBe(2)
  })
})