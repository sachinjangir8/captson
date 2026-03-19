import { motion, AnimatePresence } from 'framer-motion'

// ── Alert Component ───────────────────────────────────────────────────────────
// type: 'error' | 'success' | 'warning' | 'info'

const styles = {
  error:   'bg-red-500/10 border-red-500/30 text-red-300',
  success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
  warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
  info:    'bg-blue-500/10 border-blue-500/30 text-blue-300',
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
        className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm
                    ${styles[type] || styles.info}`}
        role="alert"
      >
        <span className="text-base shrink-0 mt-0.5">{icons[type]}</span>
        <span className="flex-1 leading-relaxed">{message}</span>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-auto text-current opacity-60 hover:opacity-100 transition-opacity shrink-0"
            aria-label="Dismiss"
          >
            ✕
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
