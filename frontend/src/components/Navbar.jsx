import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

// ── Icons (inline SVG for zero-dependency) ────────────────────────────────────
const ShieldIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
)

const SunIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
)

const MoonIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
)

const LogoutIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
  </svg>
)

// ── Navbar Component ──────────────────────────────────────────────────────────
export default function Navbar() {
  const { user, logout }        = useAuth()
  const { darkMode, toggleDarkMode } = useTheme()
  const navigate                = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch {
      // Silently fail; user stays on page
    }
  }

  return (
    <motion.nav
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-50 bg-white/90 dark:bg-[#0A0A0A]/90 backdrop-blur border-b border-gray-200 dark:border-[#262626] transition-colors"
    >
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="text-[#0F172A] dark:text-white">
              <ShieldIcon />
            </div>
            <span className="text-gray-900 dark:text-white font-semibold text-[17px] tracking-tight">
              DeepGuard
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-[#171717]
                         transition-colors duration-200"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <SunIcon /> : <MoonIcon />}
            </button>

            {/* User info */}
            {user && (
              <>
                <div className="hidden sm:flex items-center gap-2 pl-3 pr-4 py-1.5 rounded-full
                                border border-gray-200 dark:border-[#262626]">
                  {/* Avatar circle */}
                  <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-[#171717] flex items-center
                                  justify-center text-gray-700 dark:text-gray-300 text-[10px] font-semibold shrink-0">
                    {user.email?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 text-xs max-w-[120px] truncate font-medium tracking-wide">
                    {user.displayName || user.email}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-md
                             text-gray-500 hover:text-gray-900 hover:bg-gray-100
                             dark:text-gray-400 dark:hover:text-white dark:hover:bg-[#171717]
                             transition-colors duration-200 text-xs font-medium tracking-wide"
                >
                  <LogoutIcon />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
