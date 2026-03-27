import { motion } from 'framer-motion'

/**
 * Displays detailed confidence breakdown and warnings.
 * 
 * Props:
 *  confidenceBreakdown: object - Breakdown of confidence scores
 *  warnings: string[] - Warning messages
 */
export default function ConfidenceBreakdown({ confidenceBreakdown, warnings }) {
  if (!confidenceBreakdown && (!warnings || warnings.length === 0)) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="space-y-4"
    >
      {/* Confidence Breakdown */}
      {confidenceBreakdown && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>📊</span>
            Confidence Breakdown
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <MetricBar
              label="Frame Consistency"
              value={confidenceBreakdown.frame_consistency_score}
              description="How consistent predictions are across frames"
              color="blue"
            />
            <MetricBar
              label="Average Confidence"
              value={confidenceBreakdown.average_confidence}
              description="Mean confidence across all frames"
              color="purple"
            />
            <MetricBar
              label="Temporal Coherence"
              value={confidenceBreakdown.temporal_coherence_score}
              description="Smoothness of predictions over time"
              color="green"
            />
            <MetricBar
              label="Artifact Detection"
              value={confidenceBreakdown.artifact_detection_score}
              description="Strength of detected artifacts"
              color="red"
            />
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6"
        >
          <h3 className="text-lg font-bold text-yellow-300 mb-3 flex items-center gap-2">
            <span>⚠️</span>
            Important Notices
          </h3>
          
          <ul className="space-y-2">
            {warnings.map((warning, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-2 text-yellow-200 text-sm"
              >
                <span className="text-yellow-400 mt-0.5">•</span>
                <span>{warning}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}
    </motion.div>
  )
}

// Helper Component for Metric Bars
function MetricBar({ label, value, description, color }) {
  const percentage = Math.round(value * 100)
  
  const colorClasses = {
    blue: {
      bg: 'bg-blue-500/20',
      fill: 'from-blue-500 to-cyan-500',
      text: 'text-blue-400'
    },
    purple: {
      bg: 'bg-purple-500/20',
      fill: 'from-purple-500 to-pink-500',
      text: 'text-purple-400'
    },
    green: {
      bg: 'bg-green-500/20',
      fill: 'from-green-500 to-emerald-500',
      text: 'text-green-400'
    },
    red: {
      bg: 'bg-red-500/20',
      fill: 'from-red-500 to-orange-500',
      text: 'text-red-400'
    }
  }

  const colors = colorClasses[color]

  return (
    <div className={`${colors.bg} rounded-xl p-4`}>
      <div className="flex justify-between items-center mb-2">
        <span className={`font-semibold ${colors.text}`}>{label}</span>
        <span className={`text-lg font-bold ${colors.text}`}>{percentage}%</span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={`h-full bg-gradient-to-r ${colors.fill} rounded-full`}
        />
      </div>
      
      <p className="text-gray-400 text-xs">{description}</p>
    </div>
  )
}
