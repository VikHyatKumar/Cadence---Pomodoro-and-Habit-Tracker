import { subDays, format, isSameDay, startOfDay } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Clock, Flame, Target } from 'lucide-react'
import useTimerStore from '../store/useTimerStore'
import useHabitStore from '../store/useHabitStore'
import { getStreak, dateStr } from '../lib/streaks'

const today = new Date()
const LAST_7 = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i))

function msToHours(ms) { return (ms / 3600000).toFixed(1) }

function usePomodoroChart() {
  const sessions = useTimerStore((s) => s.completedSessions)
  return LAST_7.map((d) => ({
    label: format(d, 'EEE'),
    count: sessions.filter((s) => s.mode === 'work' && isSameDay(new Date(s.startedAt), d)).length,
    isToday: isSameDay(d, today),
  }))
}

function useHabitChart() {
  const { habits, completions } = useHabitStore()
  if (!habits.length) return []
  return LAST_7.map((d) => {
    const ds = dateStr(d)
    const done = habits.filter((h) => completions[h.id]?.[ds]).length
    return {
      label: format(d, 'EEE'),
      rate: Math.round((done / habits.length) * 100),
      isToday: isSameDay(d, today),
    }
  })
}

function useSummary() {
  const sessions = useTimerStore((s) => s.completedSessions)
  const { habits, completions } = useHabitStore()
  const weekStart = startOfDay(subDays(today, 6))
  return {
    todayMs: sessions.filter((s) => s.mode === 'work' && isSameDay(new Date(s.startedAt), today)).reduce((sum, s) => sum + s.durationMs, 0),
    weekMs: sessions.filter((s) => s.mode === 'work' && new Date(s.startedAt) >= weekStart).reduce((sum, s) => sum + s.durationMs, 0),
    bestStreak: habits.length ? Math.max(...habits.map((h) => getStreak(completions[h.id] || {}, today))) : 0,
  }
}

const TOOLTIP_STYLE = {
  background: '#111827',
  border: 'none',
  borderRadius: 10,
  color: '#f9fafb',
  fontSize: 13,
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
}

function EmptyChart({ msg }) {
  return (
    <div className="flex flex-col items-center justify-center h-44 text-gray-400 gap-2">
      <div className="text-3xl opacity-30">📊</div>
      <p className="text-sm text-center">{msg}</p>
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, unit, color }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl mb-3 ${color}`}>
        <Icon size={17} />
      </div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">
        {value}<span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>
      </p>
    </div>
  )
}

export default function StatsPage() {
  const pomData = usePomodoroChart()
  const habitData = useHabitChart()
  const { todayMs, weekMs, bestStreak } = useSummary()
  const hasPom = pomData.some((d) => d.count > 0)
  const hasHabit = habitData.some((d) => d.rate > 0)

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stats</h1>
        <p className="text-sm text-gray-400 mt-0.5">Your focus and habit data for the last 7 days.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <SummaryCard icon={Clock} label="Focus today" value={msToHours(todayMs)} unit="hr" color="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" />
        <SummaryCard icon={Target} label="Focus this week" value={msToHours(weekMs)} unit="hr" color="bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400" />
        <SummaryCard icon={Flame} label="Best streak" value={bestStreak} unit="days" color="bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400" />
      </div>

      {/* Pomodoro chart */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Pomodoro sessions</p>
        <p className="text-xs text-gray-400 mb-5">Last 7 days</p>
        {hasPom ? (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={pomData} barSize={28} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'rgba(99,102,241,0.07)' }} contentStyle={TOOLTIP_STYLE} formatter={(v) => [v, 'sessions']} />
              <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                {pomData.map((d, i) => (
                  <Cell key={i} fill={d.isToday ? '#3b82f6' : '#a5b4fc'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart msg="No sessions yet. Start a pomodoro on the Timer page." />
        )}
      </div>

      {/* Habit chart */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Habit completion</p>
        <p className="text-xs text-gray-400 mb-5">% of habits done per day</p>
        {hasHabit ? (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={habitData} barSize={28} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} unit="%" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'rgba(16,185,129,0.07)' }} contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v}%`, 'completion']} />
              <Bar dataKey="rate" radius={[5, 5, 0, 0]}>
                {habitData.map((d, i) => (
                  <Cell key={i} fill={d.isToday ? '#10b981' : '#6ee7b7'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart msg="No habit data yet. Check off habits on the Habits page." />
        )}
      </div>
    </div>
  )
}