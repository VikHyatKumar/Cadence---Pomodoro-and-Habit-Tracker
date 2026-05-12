import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { Timer, CheckSquare, BarChart2, Sun, Moon } from 'lucide-react'
import useTheme from './hooks/useTheme'
import TimerPage from './pages/TimerPage'
import HabitsPage from './pages/HabitsPage'
import StatsPage from './pages/StatsPage'

const NAV = [
  { to: '/timer', label: 'Timer', Icon: Timer },
  { to: '/habits', label: 'Habits', Icon: CheckSquare },
  { to: '/stats', label: 'Stats', Icon: BarChart2 },
]

export default function App() {
  const { isDark, toggle } = useTheme()

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-950">
      {/* Sidebar */}
      <aside className="w-52 flex-shrink-0 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
        {/* Logo */}
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Timer size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Cadence</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Theme toggle */}
        <div className="px-3 pb-4">
          <button
            onClick={toggle}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
            {isDark ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/timer" replace />} />
          <Route path="/timer" element={<TimerPage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Routes>
      </main>
    </div>
  )
}