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

  const borderColor = isFake ? 'border-red-200' : 'border-emerald-200'
  const bgColor     = isFake ? 'bg-red-50' : 'bg-emerald-50'
  const textColor   = isFake ? 'text-red-700' : 'text-emerald-800'

  const RiskLevel = () => {
    if (confidence >= 85) return <span className="text-xs text-red-700 font-bold bg-red-100 px-2 py-0.5 rounded">HIGH RISK</span>
    if (confidence >= 60) return <span className="text-xs text-amber-600 font-bold bg-amber-100 px-2 py-0.5 rounded">MEDIUM RISK</span>
    return <span className="text-xs text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">LOW RISK</span>
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
          <p className="text-slate-500 text-xs uppercase tracking-widest mb-1 font-semibold">
            Analysis Result
          </p>
          <h3 className={`text-2xl font-bold ${textColor}`}>{label}</h3>
        </div>

        <div
          className={`px-3 py-1 rounded-md text-sm font-bold border ${
            isFake ? 'text-red-700 border-red-200 bg-red-100' : 'text-emerald-700 border-emerald-200 bg-emerald-100'
          }`}
        >
          {isFake ? 'FAKE' : 'REAL'}
        </div>
      </div>

      {/* Confidence Bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-500 text-sm font-medium">Confidence</span>
          <div className="flex items-center gap-2">
            {isFake && <RiskLevel />}
            <span className={`font-bold text-lg ${textColor}`}>{confidence}%</span>
          </div>
        </div>

        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner border border-slate-200">
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
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
          <p className="text-slate-500 text-xs mb-1 font-medium">Verdict</p>
          <p className={`font-semibold ${textColor}`}>
            {isFake ? 'Likely Manipulated' : 'Likely Authentic'}
          </p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
          <p className="text-slate-500 text-xs mb-1 font-medium">Confidence Score</p>
          <p className="text-slate-800 font-semibold">{result.confidence?.toFixed(4)}</p>
        </div>
      </div>

      {/* Heatmap (optional) */}
      {result.heatmap_url && (
        <div>
          <p className="text-slate-500 text-sm mb-2 font-medium">Grad-CAM Heatmap</p>
          <img
            src={result.heatmap_url}
            alt="Grad-CAM heatmap"
            className="w-full rounded-xl border border-slate-200 object-cover shadow-sm"
          />
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-slate-400 text-xs border-t border-slate-200 pt-3">
        This analysis is probabilistic. Please verify results independently.
      </p>
    </motion.div>
  )
}
