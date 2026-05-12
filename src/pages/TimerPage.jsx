import { useState, useEffect, useCallback, useRef } from 'react'
import { Settings, X, Volume2, VolumeX } from 'lucide-react'
import useTimer from '../hooks/useTimer'
import useTimerStore from '../store/useTimerStore'
import { playChime } from '../lib/audio'

const MODES = ['work', 'short', 'long']
const MODE_LABELS = { work: 'Focus', short: 'Short Break', long: 'Long Break' }

const MODE_THEME = {
  work:  { ring: '#3b82f6', activeBtn: 'bg-blue-600 hover:bg-blue-700',  tab: 'text-blue-600 dark:text-blue-400',  track: '#dbeafe' },
  short: { ring: '#10b981', activeBtn: 'bg-emerald-500 hover:bg-emerald-600', tab: 'text-emerald-600 dark:text-emerald-400', track: '#d1fae5' },
  long:  { ring: '#8b5cf6', activeBtn: 'bg-violet-600 hover:bg-violet-700',  tab: 'text-violet-600 dark:text-violet-400',  track: '#ede9fe' },
}

const RADIUS = 110
const CIRC = 2 * Math.PI * RADIUS

function fmt(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
}

function nextMode(mode, workCount) {
  if (mode !== 'work') return { mode: 'work', workCount }
  const n = workCount + 1
  return { mode: n % 4 === 0 ? 'long' : 'short', workCount: n }
}

export default function TimerPage() {
  const { workMs, shortMs, longMs, soundEnabled, setSoundEnabled, recordSession, setWorkMs, setShortMs, setLongMs } = useTimerStore()
  const [mode, setMode] = useState('work')
  const [workCount, setWorkCount] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const notifPermRef = useRef(false)

  const durationMap = { work: workMs, short: shortMs, long: longMs }
  const currentDuration = durationMap[mode]
  const theme = MODE_THEME[mode]

  const handleComplete = useCallback(() => {
    recordSession(mode, durationMap[mode])
    if (notifPermRef.current && Notification.permission === 'granted') {
      new Notification('Cadence', {
        body: mode === 'work' ? '✅ Focus done! Take a break.' : '⏱ Break over — back to it!',
      })
    }
    if (soundEnabled) playChime()
    document.title = '⏰ Done! — Cadence'
    setTimeout(() => (document.title = 'Cadence — Focus & Habit Tracker'), 3000)
    const { mode: next, workCount: newCount } = nextMode(mode, workCount)
    setMode(next)
    setWorkCount(newCount)
  }, [mode, workCount, soundEnabled, recordSession, durationMap])

  const { remaining, isRunning, toggle, reset } = useTimer(currentDuration, handleComplete)

  // Progress ring (1 = full ring, 0 = empty)
  const progress = currentDuration > 0 ? remaining / currentDuration : 1
  const dashOffset = CIRC * (1 - progress)

  // CONCEPT: global keyboard listener — binds to document, ignores input elements
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.code === 'Space') {
        e.preventDefault()
        requestNotifPermission()
        toggle()
      }
      if (e.code === 'KeyR') { e.preventDefault(); reset(currentDuration) }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [toggle, reset, currentDuration])

  function requestNotifPermission() {
    if (!notifPermRef.current && Notification.permission === 'default') {
      Notification.requestPermission().then(() => (notifPermRef.current = true))
    }
    notifPermRef.current = true
  }

  function switchMode(m) {
    setMode(m)
    reset(durationMap[m])
  }

  const sessionsInCycle = workCount % 4
  const dotsTotal = 4

  return (
    <div className="flex flex-col items-center justify-center min-h-full py-12 px-6 relative select-none">

      {/* Settings toggle */}
      <button
        onClick={() => setShowSettings((s) => !s)}
        className="absolute top-5 right-5 p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-800 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label="Settings"
      >
        <Settings size={19} />
      </button>

      {/* Settings popover */}
      {showSettings && (
        <div className="absolute top-14 right-5 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-2xl z-20">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-sm text-gray-900 dark:text-white">Settings</span>
            <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600 focus:outline-none rounded focus-visible:ring-2 focus-visible:ring-blue-500">
              <X size={15} />
            </button>
          </div>
          {[
            { label: 'Focus (min)', ms: workMs, set: (v) => setWorkMs(v * 60000) },
            { label: 'Short break (min)', ms: shortMs, set: (v) => setShortMs(v * 60000) },
            { label: 'Long break (min)', ms: longMs, set: (v) => setLongMs(v * 60000) },
          ].map(({ label, ms, set }) => (
            <div key={label} className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
              <input
                type="number" min={1} max={90} value={ms / 60000}
                onChange={(e) => set(Number(e.target.value))}
                className="w-16 text-right text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-gray-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              />
            </div>
          ))}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />} Sound
            </span>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              role="switch" aria-checked={soundEnabled}
              className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${soundEnabled ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${soundEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      )}

      {/* Mode tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800/60 rounded-xl p-1 mb-10">
        {MODES.map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              mode === m
                ? `bg-white dark:bg-gray-800 shadow-sm ${theme.tab}`
                : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Progress ring + timer */}
      <div className="relative mb-8" style={{ width: 260, height: 260 }}>
        <svg width="260" height="260" className="rotate-[-90deg]">
          {/* Track — currentColor picks up Tailwind dark: variant */}
          <circle
            cx="130" cy="130" r={RADIUS}
            fill="none"
            strokeWidth="10"
            stroke="currentColor"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress arc */}
          <circle
            cx="130" cy="130" r={RADIUS}
            fill="none"
            strokeWidth="10"
            stroke={theme.ring}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={dashOffset}
            style={{ transition: isRunning ? 'stroke-dashoffset 0.25s linear' : 'none' }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className="text-6xl font-bold tabular-nums tracking-tight text-gray-900 dark:text-white"
            aria-live="polite"
          >
            {fmt(remaining)}
          </div>
          <div className="text-sm text-gray-400 mt-1 font-medium">{MODE_LABELS[mode]}</div>
        </div>
      </div>

      {/* Session dots */}
      <div className="flex items-center gap-2 mb-10">
        {Array.from({ length: dotsTotal }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${
              i < sessionsInCycle ? `opacity-100` : 'opacity-25 bg-gray-400 dark:bg-gray-600'
            }`}
            style={i < sessionsInCycle ? { backgroundColor: theme.ring } : {}}
          />
        ))}
        <span className="text-xs text-gray-400 ml-1">
          {mode === 'work' ? `${sessionsInCycle}/4 before long break` : 'break time'}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => reset(currentDuration)}
          className="px-5 py-3 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-sm"
        >
          Reset <kbd className="ml-1 text-xs opacity-50 font-sans">R</kbd>
        </button>

        <button
          onClick={() => { requestNotifPermission(); toggle() }}
          className={`px-12 py-3.5 rounded-xl text-base font-semibold text-white transition-all shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 ${theme.activeBtn} ${isRunning ? 'opacity-90' : ''}`}
        >
          {isRunning ? 'Pause' : 'Start'} <kbd className="ml-1 text-sm opacity-60 font-sans">Space</kbd>
        </button>
      </div>
    </div>
  )
}