import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Displays a timeline graph showing fake probability across frames.
 * Allows clicking on frames to view details.
 * 
 * Props:
 *  frameScores: number[] - Array of fake probabilities per frame
 *  suspiciousFrames: number[] - Indices of suspicious frames
 */
export default function FrameTimeline({ frameScores, suspiciousFrames }) {
  const [selectedFrame, setSelectedFrame] = useState(null)
  const [showHeatmap, setShowHeatmap] = useState(true)

  if (!frameScores || frameScores.length === 0) {
    return null
  }

  const maxScore = Math.max(...frameScores)
  const minScore = Math.min(...frameScores)
  const avgScore = frameScores.reduce((a, b) => a + b, 0) / frameScores.length

  // Graph dimensions
  const width = 100
  const height = 40
  const threshold = 0.5

  // Generate path for the line graph
  const points = frameScores.map((score, index) => {
    const x = (index / (frameScores.length - 1)) * width
    const y = height - (score * height)
    return `${x},${y}`
  }).join(' ')

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">Frame-by-Frame Analysis</h3>
          <p className="text-gray-400 text-sm">
            Fake probability across {frameScores.length} frames
          </p>
        </div>
        
        {/* Toggle Heatmap */}
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            showHeatmap
              ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
              : 'bg-white/5 text-gray-400 border border-white/10'
          }`}
        >
          {showHeatmap ? '🔥 Heatmap ON' : '⬜ Heatmap OFF'}
        </button>
      </div>

      {/* Timeline Graph */}
      <div className="relative w-full h-48 bg-dark-900/50 rounded-xl border border-white/10 overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full preserve-3d"
          style={{ transform: 'translateZ(0)' }}
        >
          {/* Threshold line */}
          <line
            x1="0"
            y1={height - (threshold * height)}
            x2={width}
            y2={height - (threshold * height)}
            stroke="#ef4444"
            strokeWidth="0.5"
            strokeDasharray="2,2"
            opacity="0.6"
          />

          {/* Area under curve */}
          <polygon
            points={`0,${height} ${points} ${width},${height}`}
            fill="url(#gradient)"
            opacity="0.3"
          />

          {/* Line graph */}
          <polyline
            points={points}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Suspicious frame markers */}
          {suspiciousFrames?.map((frameIdx) => {
            const x = (frameIdx / (frameScores.length - 1)) * width
            return (
              <circle
                key={frameIdx}
                cx={x}
                cy={height - (frameScores[frameIdx] * height)}
                r="1.5"
                fill="#ef4444"
                stroke="#fff"
                strokeWidth="0.3"
                className="cursor-pointer hover:r-2 transition-all"
                onClick={() => setSelectedFrame(frameIdx)}
              />
            )
          })}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-2 top-2 text-xs text-gray-500">
          {maxScore.toFixed(2)}
        </div>
        <div className="absolute left-2 bottom-2 text-xs text-gray-500">
          {minScore.toFixed(2)}
        </div>

        {/* X-axis label */}
        <div className="absolute right-2 bottom-2 text-xs text-gray-500">
          Frame {frameScores.length}
        </div>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-3 gap-3">
        <StatBox
          label="Avg Probability"
          value={(avgScore * 100).toFixed(1) + '%'}
          color={avgScore > 0.7 ? 'text-red-400' : avgScore > 0.4 ? 'text-yellow-400' : 'text-green-400'}
        />
        <StatBox
          label="Max Spike"
          value={(maxScore * 100).toFixed(1) + '%'}
          color="text-red-400"
        />
        <StatBox
          label="Min Value"
          value={(minScore * 100).toFixed(1) + '%'}
          color="text-green-400"
        />
      </div>

      {/* Selected Frame Details */}
      <AnimatePresence>
        {selectedFrame !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white">
                  Frame {selectedFrame + 1} Details
                </h4>
                <button
                  onClick={() => setSelectedFrame(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Fake Probability:</span>
                  <span className={`font-semibold ${
                    frameScores[selectedFrame] > 0.7 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {(frameScores[selectedFrame] * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Classification:</span>
                  <span className="font-semibold text-white">
                    {frameScores[selectedFrame] > 0.5 ? '🚨 FAKE' : '✅ REAL'}
                  </span>
                </div>
                {suspiciousFrames?.includes(selectedFrame) && (
                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-300 text-xs">
                      ⚠️ This frame was flagged as suspicious
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-gray-400 pt-2 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
          <span>Fake Probability</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Suspicious Frame</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-px bg-red-500 border-dashed"></div>
          <span>Threshold (50%)</span>
        </div>
      </div>
    </motion.div>
  )
}

// Helper Component for Stat Boxes
function StatBox({ label, value, color }) {
  return (
    <div className="bg-white/5 rounded-xl p-3 text-center">
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  )
}
