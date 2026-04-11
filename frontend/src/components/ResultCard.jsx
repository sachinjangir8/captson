import { motion } from 'framer-motion'

/**
 * Displays the deepfake prediction result with animated confidence bar.
 *
 * Props:
 *  result: { prediction: 'real' | 'fake', confidence: number (0–1), heatmap_url?: string }
 */
export default function ResultCard({ result }) {
  const isFake      = result.prediction?.toLowerCase() === 'fake'
  const confidence  = Math.round((result.confidence ?? 0) * 100)
  const label       = isFake ? 'DEEPFAKE DETECTED' : 'AUTHENTIC VIDEO'

  const barColor    = isFake ? 'bg-red-500' : 'bg-green-500'

  const borderColor = isFake ? 'border-red-500/30' : 'border-emerald-500/30'
  const bgColor     = isFake ? 'bg-red-500/10' : 'bg-emerald-500/10'
  const textColor   = isFake ? 'text-red-400' : 'text-emerald-400'

  const RiskLevel = () => {
    if (confidence >= 85) return <span className="text-xs text-red-400 font-medium">HIGH RISK</span>
    if (confidence >= 60) return <span className="text-xs text-yellow-400 font-medium">MEDIUM RISK</span>
    return <span className="text-xs text-green-400 font-medium">LOW RISK</span>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 100 }}
      className={`rounded-2xl border ${borderColor} ${bgColor} p-6 space-y-5`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">
            Analysis Result
          </p>
          <h3 className={`text-2xl font-bold ${textColor}`}>{label}</h3>
        </div>

        <div
          className={`px-3 py-1 rounded-md text-sm font-semibold border ${
            isFake ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
          }`}
        >
          {isFake ? 'FAKE' : 'REAL'}
        </div>
      </div>

      {/* Confidence Bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400 text-sm">Confidence</span>
          <div className="flex items-center gap-2">
            {isFake && <RiskLevel />}
            <span className={`font-bold text-lg ${textColor}`}>{confidence}%</span>
          </div>
        </div>

        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full ${barColor} rounded-full`}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 rounded-xl p-3">
          <p className="text-gray-500 text-xs mb-1">Verdict</p>
          <p className={`font-semibold ${textColor}`}>
            {isFake ? 'Likely Manipulated' : 'Likely Authentic'}
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <p className="text-gray-500 text-xs mb-1">Confidence Score</p>
          <p className="text-white font-semibold">{result.confidence?.toFixed(4)}</p>
        </div>
      </div>

      {/* Heatmap (optional) */}
      {result.heatmap_url && (
        <div>
          <p className="text-gray-400 text-sm mb-2 font-medium">Grad-CAM Heatmap</p>
          <img
            src={result.heatmap_url}
            alt="Grad-CAM heatmap"
            className="w-full rounded-xl border border-white/10 object-cover"
          />
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-gray-500 text-xs border-t border-white/10 pt-3">
        This analysis is probabilistic. Please verify results independently.
      </p>
    </motion.div>
  )
}
