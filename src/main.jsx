import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import useTimerStore from './store/useTimerStore'
import useHabitStore from './store/useHabitStore'
import './index.css'

// CONCEPT: localStorage hydration flicker — Zustand's persist middleware loads from
// localStorage asynchronously. If we render immediately, components see empty state
// for one frame and the UI flickers. We gate rendering until both stores say they're ready.
function Root() {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const unsub1 = useTimerStore.persist.onFinishHydration(() => check())
    const unsub2 = useHabitStore.persist.onFinishHydration(() => check())

    function check() {
      if (useTimerStore.persist.hasHydrated() && useHabitStore.persist.hasHydrated()) {
        setHydrated(true)
      }
    }
    // Already hydrated (sync localStorage is fast — may fire before useEffect)
    check()

    return () => { unsub1(); unsub2() }
  }, [])

  if (!hydrated) return null

  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)