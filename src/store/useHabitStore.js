import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useHabitStore = create(
  persist(
    (set) => ({
      habits: [],
      completions: {},

      addHabit: (name, emoji) =>
        set((state) => ({
          habits: [
            ...state.habits,
            { id: crypto.randomUUID(), name, emoji, createdAt: Date.now() },
          ],
        })),

      removeHabit: (id) =>
        set((state) => {
          const completions = { ...state.completions }
          delete completions[id]
          return {
            habits: state.habits.filter((h) => h.id !== id),
            completions,
          }
        }),

      toggleCompletion: (habitId, dateString) =>
        set((state) => {
          const habitDays = state.completions[habitId] || {}
          const updated = { ...habitDays }
          if (updated[dateString]) {
            delete updated[dateString]
          } else {
            updated[dateString] = true
          }
          return { completions: { ...state.completions, [habitId]: updated } }
        }),
    }),
    { name: 'cadence-habits' }
  )
)

export default useHabitStore
