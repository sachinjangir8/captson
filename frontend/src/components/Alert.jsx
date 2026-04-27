import { motion, AnimatePresence } from 'framer-motion'

// ── Alert Component ───────────────────────────────────────────────────────────
// type: 'error' | 'success' | 'warning' | 'info'

const styles = {
  error:   'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400',
  warning: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400',
  info:    'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400',
}

const icons = {
  error:   '⛔',
  success: '✅',
  warning: '⚠️',
  info:    'ℹ️',
}

export default function Alert({ message, type = 'error', onDismiss }) {
  if (!message) return null

  return (
    <AnimatePresence>
      <motion.div
        key={message}
        initial={{ opacity: 0, y: -8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm
                    ${styles[type] || styles.info}`}
        role="alert"
      >
        <span className="text-base shrink-0 mt-0.5">{icons[type]}</span>
        <span className="flex-1 leading-relaxed font-medium">{message}</span>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-auto text-current opacity-60 hover:opacity-100 transition-opacity shrink-0"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
