import { useState } from 'react'
import { subDays, format } from 'date-fns'
import { Trash2, Flame, Plus } from 'lucide-react'
import useHabitStore from '../store/useHabitStore'
import { getStreak, dateStr } from '../lib/streaks'

const EMOJIS = ['💪', '📚', '🏃', '💧', '🧘', '🥗', '😴', '✍️', '🎯', '🎸', '🌿', '🧹']

const today = new Date()
const LAST_7 = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i))

export default function HabitsPage() {
  const { habits, completions, addHabit, removeHabit, toggleCompletion } = useHabitStore()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('💪')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const todayStr = dateStr(today)

  function handleAdd(e) {
    e.preventDefault()
    if (!name.trim()) return
    addHabit(name.trim(), emoji)
    setName('')
    setShowEmojiPicker(false)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Habits</h1>
        <p className="text-sm text-gray-400 mt-0.5">Track your daily habits and build streaks.</p>
      </div>

      {/* Add habit */}
      <form
        onSubmit={handleAdd}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 mb-8 flex gap-2 items-center shadow-sm"
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker((s) => !s)}
            className="text-xl w-11 h-11 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {emoji}
          </button>
          {showEmojiPicker && (
            <div className="absolute top-13 left-0 z-10 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-3 shadow-2xl grid grid-cols-6 gap-1">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => { setEmoji(e); setShowEmojiPicker(false) }}
                  className="text-xl w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CONCEPT: controlled input */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add a new habit…"
          className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none px-2"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Plus size={15} /> Add
        </button>
      </form>

      {habits.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🌱</p>
          <p className="font-semibold text-gray-500 dark:text-gray-300">No habits yet</p>
          <p className="text-sm mt-1">Add your first habit above to get started.</p>
        </div>
      )}

      {habits.length > 0 && (
        <>
          {/* Today */}
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Today · {format(today, 'EEEE, MMM d')}
            </h2>
            <div className="space-y-2">
              {habits.map((habit) => {
                const done = !!completions[habit.id]?.[todayStr]
                const streak = getStreak(completions[habit.id] || {}, today)
                return (
                  <div
                    key={habit.id}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 border transition-all ${
                      done
                        ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                    }`}
                  >
                    <button
                      onClick={() => toggleCompletion(habit.id, todayStr)}
                      aria-label={`Mark ${habit.name} ${done ? 'incomplete' : 'complete'}`}
                      aria-pressed={done}
                      className={`w-6 h-6 flex-shrink-0 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${
                        done
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
                      }`}
                    >
                      {done && '✓'}
                    </button>

                    <span className="text-lg">{habit.emoji}</span>

                    <span className={`flex-1 text-sm font-medium transition-all ${
                      done ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'
                    }`}>
                      {habit.name}
                    </span>

                    {streak > 0 && (
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-full">
                        <Flame size={11} /> {streak}
                      </span>
                    )}

                    <button
                      onClick={() => removeHabit(habit.id)}
                      aria-label={`Remove ${habit.name}`}
                      className="text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded-lg p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          </section>

          {/* 7-day grid */}
          {/* CONCEPT: date-fns — subDays/format handle timezone offsets and month rollovers. */}
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">7-Day View</h2>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
              {/* Header */}
              <div className="grid border-b border-gray-100 dark:border-gray-800" style={{ gridTemplateColumns: '1fr repeat(7, 2.5rem)' }}>
                <div className="px-4 py-3 text-xs text-gray-400" />
                {LAST_7.map((d) => (
                  <div key={d.toISOString()} className="py-2.5 text-center">
                    <div className="text-xs text-gray-400">{format(d, 'EEE')}</div>
                    <div className={`text-xs font-bold mt-0.5 ${
                      dateStr(d) === dateStr(today)
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>{format(d, 'd')}</div>
                  </div>
                ))}
              </div>

              {/* Rows */}
              {habits.map((habit, i) => (
                <div
                  key={habit.id}
                  className={`grid ${i < habits.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
                  style={{ gridTemplateColumns: '1fr repeat(7, 2.5rem)' }}
                >
                  <div className="px-4 py-3 flex items-center gap-2">
                    <span className="text-base">{habit.emoji}</span>
                    <span className="text-xs text-gray-600 dark:text-gray-300 font-medium truncate">{habit.name}</span>
                  </div>
                  {LAST_7.map((d) => {
                    const ds = dateStr(d)
                    const done = !!completions[habit.id]?.[ds]
                    const isToday = ds === todayStr
                    return (
                      <button
                        key={ds}
                        onClick={() => toggleCompletion(habit.id, ds)}
                        aria-label={`${habit.name} on ${format(d, 'MMM d')}: ${done ? 'done' : 'not done'}`}
                        aria-pressed={done}
                        className={`m-1.5 rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                          done
                            ? 'bg-green-400 dark:bg-green-600'
                            : isToday
                            ? 'bg-gray-100 dark:bg-gray-800 ring-1 ring-blue-400 ring-inset'
                            : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}