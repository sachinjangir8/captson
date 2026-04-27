import { motion } from 'framer-motion'

export default function ConfidenceBreakdown({ confidenceBreakdown, warnings }) {
  if (!confidenceBreakdown && (!warnings || warnings.length === 0)) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Confidence Breakdown */}
      {confidenceBreakdown && (
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Confidence Breakdown
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MetricBar
              label="Frame Consistency"
              value={confidenceBreakdown.frame_consistency_score}
              description="Prediction consistency across frames"
              color="indigo"
            />
            <MetricBar
              label="Average Confidence"
              value={confidenceBreakdown.average_confidence}
              description="Mean confidence level"
              color="gray"
            />
            <MetricBar
              label="Temporal Coherence"
              value={confidenceBreakdown.temporal_coherence_score}
              description="Smoothness over time"
              color="emerald"
            />
            <MetricBar
              label="Artifact Detection"
              value={confidenceBreakdown.artifact_detection_score}
              description="Strength of artifacts"
              color="red"
            />
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-5 mt-4 transition-colors">
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            Important Notices
          </h3>
          
          <ul className="space-y-1.5 ml-1">
            {warnings.map((warning, index) => (
              <li
                key={index}
                className="flex items-start text-amber-700 dark:text-amber-300 text-sm leading-relaxed"
              >
                <span className="text-amber-500 dark:text-amber-400 mr-2 mt-0.5">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function MetricBar({ label, value, description, color }) {
  const percentage = Math.round(value * 100)
  
  const colorClasses = {
    indigo: {
      bg: 'bg-white dark:bg-[#111111]',
      fill: 'bg-[#0F172A] dark:bg-gray-200',
      text: 'text-gray-900 dark:text-white',
      border: 'border-gray-200 dark:border-[#262626]'
    },
    gray: {
      bg: 'bg-white dark:bg-[#111111]',
      fill: 'bg-gray-400 dark:bg-gray-500',
      text: 'text-gray-900 dark:text-white',
      border: 'border-gray-200 dark:border-[#262626]'
    },
    emerald: {
      bg: 'bg-white dark:bg-[#111111]',
      fill: 'bg-emerald-500',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-100 dark:border-emerald-500/20'
    },
    red: {
      bg: 'bg-white dark:bg-[#111111]',
      fill: 'bg-red-500',
      text: 'text-red-700 dark:text-red-400',
      border: 'border-red-100 dark:border-red-500/20'
    }
  }

  const colors = colorClasses[color] || colorClasses.gray

  return (
    <div className={`rounded-xl p-4 border shadow-sm transition-colors ${colors.border} ${colors.bg}`}>
      <div className="flex justify-between items-center mb-2">
        <span className={`text-sm font-semibold tracking-tight ${colors.text}`}>{label}</span>
        <span className={`text-sm font-bold ${colors.text}`}>{percentage}%</span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-gray-100 dark:bg-[#262626] rounded-full overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className={`h-full ${colors.fill}`}
        />
      </div>
      
      <p className="text-gray-500 dark:text-gray-400 text-xs tracking-wide">{description}</p>
    </div>
  )
}
