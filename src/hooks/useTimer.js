import { useState, useEffect, useRef, useCallback } from 'react'

// CONCEPT: timestamp-based timer — instead of decrementing a counter in setInterval,
// we store the absolute future timestamp (endsAt). Each tick computes
// `remaining = endsAt - Date.now()`. Background tabs throttle setInterval to ~1s
// intervals, but Date.now() is always accurate, so the display stays correct when
// the tab comes back into focus.
function useTimer(durationMs, onComplete) {
  const [remaining, setRemaining] = useState(durationMs)
  const [isRunning, setIsRunning] = useState(false)
  const endsAtRef = useRef(null)
  const intervalRef = useRef(null)
  // CONCEPT: ref to avoid stale closure — we read isRunning in the durationMs effect
  // without listing it as a dependency, so pause doesn't accidentally trigger a reset.
  const isRunningRef = useRef(false)

  useEffect(() => {
    isRunningRef.current = isRunning
  }, [isRunning])

  const tick = useCallback(() => {
    if (!endsAtRef.current) return
    const remainingMs = endsAtRef.current - Date.now()
    if (remainingMs <= 0) {
      setRemaining(0)
      setIsRunning(false)
      clearInterval(intervalRef.current)
      endsAtRef.current = null
      onComplete?.()
    } else {
      setRemaining(remainingMs)
    }
  }, [onComplete])

  useEffect(() => {
    if (!isRunning) return
    intervalRef.current = setInterval(tick, 250)

    // CONCEPT: visibilitychange — when user returns to the tab, recompute immediately
    // instead of waiting up to 250ms for the next tick. Makes the display feel instant.
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      // CONCEPT: useEffect cleanup — clears interval + listener before next run or unmount.
      clearInterval(intervalRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [isRunning, tick])

  // Sync display when duration changes (settings change or mode switch via reset()).
  // Only depends on durationMs — NOT isRunning — so clicking Pause never triggers this.
  useEffect(() => {
    if (!isRunningRef.current) setRemaining(durationMs)
  }, [durationMs])

  const start = useCallback(() => {
    if (isRunning) return
    endsAtRef.current = Date.now() + remaining
    setIsRunning(true)
  }, [isRunning, remaining])

  const pause = useCallback(() => {
    if (!isRunning) return
    setRemaining(endsAtRef.current - Date.now())
    endsAtRef.current = null
    setIsRunning(false)
    clearInterval(intervalRef.current)
  }, [isRunning])

  const reset = useCallback(
    (newDurationMs) => {
      clearInterval(intervalRef.current)
      endsAtRef.current = null
      setIsRunning(false)
      setRemaining(newDurationMs ?? durationMs)
    },
    [durationMs]
  )

  return { remaining, isRunning, start, pause, reset, toggle: isRunning ? pause : start }
}

export default useTimer