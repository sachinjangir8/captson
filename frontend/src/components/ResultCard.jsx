import { motion } from 'framer-motion'

export default function ResultCard({ result }) {
  const isFake      = result.prediction?.toLowerCase() === 'fake'
  const confidence  = Math.round((result.confidence ?? 0) * 100)
  const label       = isFake ? 'Deepfake Detected' : 'Authentic Video'

  const barColor    = isFake ? 'bg-red-600' : 'bg-emerald-600'
  const textColor   = isFake ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'

  const RiskLevel = () => {
    if (confidence >= 85) return <span className="text-xs text-red-700 dark:text-red-400 font-medium bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-2.5 py-0.5 rounded-full">High Risk</span>
    if (confidence >= 60) return <span className="text-xs text-amber-700 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 px-2.5 py-0.5 rounded-full">Medium Risk</span>
    return <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-2.5 py-0.5 rounded-full">Low Risk</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className={`text-2xl font-semibold tracking-tight ${textColor}`}>{label}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {isFake ? 'Our analysis detected significant signs of algorithmic manipulation.' : 'No significant signs of manipulation were detected in this video.'}
          </p>
        </div>

        <div className={`px-4 py-1.5 rounded-full text-sm font-medium border ${
            isFake ? 'text-red-700 border-red-200 bg-red-50 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20' : 'text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20'
          }`}
        >
          {isFake ? 'FAKE' : 'REAL'}
        </div>
      </div>

      {/* Confidence Bar */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-900 dark:text-white font-medium text-sm">Confidence Score</span>
          <div className="flex items-center gap-3">
            {isFake && <RiskLevel />}
            <span className={`font-semibold ${textColor}`}>{confidence}%</span>
          </div>
        </div>

        <div className="w-full h-2 bg-gray-100 dark:bg-[#262626] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`h-full ${barColor}`}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="p-4 rounded-lg bg-[#FAFAFA] dark:bg-[#111111] border border-gray-100 dark:border-[#262626]">
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-1 font-medium tracking-wide">VERDICT</p>
          <p className="text-gray-900 dark:text-white text-sm font-medium">
            {isFake ? 'Likely Manipulated' : 'Likely Authentic'}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-[#FAFAFA] dark:bg-[#111111] border border-gray-100 dark:border-[#262626]">
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-1 font-medium tracking-wide">RAW SCORE</p>
          <p className="text-gray-900 dark:text-white text-sm font-medium">{result.confidence?.toFixed(4)}</p>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-gray-400 dark:text-gray-500 text-xs text-center sm:text-left pt-2">
        This analysis is probabilistic. Please verify results independently.
      </p>
    </div>
  )
}
