import { useState, useEffect } from 'react'

// CONCEPT: localStorage for UI preference — survives page reload without Zustand.
// We toggle the 'dark' class on <html> which Tailwind's darkMode:'class' reads.
function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('cadence-theme')
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('cadence-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return { isDark, toggle: () => setIsDark((d) => !d) }
}

export default useTheme
