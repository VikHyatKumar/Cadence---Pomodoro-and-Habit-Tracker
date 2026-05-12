import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// CONCEPT: Zustand persist — wraps the store so every state write is automatically
// saved to localStorage. The `name` key is the localStorage key.
const useTimerStore = create(
  persist(
    (set, get) => ({
      // Durations in milliseconds
      workMs: 25 * 60 * 1000,
      shortMs: 5 * 60 * 1000,
      longMs: 15 * 60 * 1000,
      soundEnabled: true,

      // Session history: [{ id, startedAt, mode, durationMs }]
      completedSessions: [],

      recordSession: (mode, durationMs) =>
        set((state) => ({
          completedSessions: [
            ...state.completedSessions,
            {
              id: crypto.randomUUID(),
              startedAt: Date.now(),
              mode,
              durationMs,
            },
          ],
        })),

      setSoundEnabled: (val) => set({ soundEnabled: val }),
      setWorkMs: (ms) => set({ workMs: ms }),
      setShortMs: (ms) => set({ shortMs: ms }),
      setLongMs: (ms) => set({ longMs: ms }),
    }),
    { name: 'cadence-timer' }
  )
)

export default useTimerStore
