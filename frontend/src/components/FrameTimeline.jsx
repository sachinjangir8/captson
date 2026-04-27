import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function FrameTimeline({ frameScores, suspiciousFrames }) {
  const [selectedFrame, setSelectedFrame] = useState(null)
  const [showHeatmap, setShowHeatmap] = useState(true)

  if (!frameScores || frameScores.length === 0) {
    return null
  }

  const maxScore = Math.max(...frameScores)
  const minScore = Math.min(...frameScores)
  const avgScore = frameScores.reduce((a, b) => a + b, 0) / frameScores.length

  const width = 100
  const height = 40
  const threshold = 0.5

  const points = frameScores.map((score, index) => {
    const x = (index / (frameScores.length - 1)) * width
    const y = height - (score * height)
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Frame-by-Frame Timeline</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Analysis of {frameScores.length} individual frames
          </p>
        </div>
      </div>

      {/* Timeline Graph */}
      <div className="relative w-full h-48 bg-[#FAFAFA] dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-[#262626] overflow-hidden">
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
            opacity="0.4"
          />

          {/* Area under curve */}
          <polygon
            points={`0,${height} ${points} ${width},${height}`}
            fill="url(#timeline-gradient)"
            opacity="0.15"
          />

          {/* Line graph */}
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[#0F172A] dark:text-gray-200"
          />

          <defs>
            <linearGradient id="timeline-gradient" x1="0%" y1="0%" x2="0%" y2="100%" className="text-[#0F172A] dark:text-gray-200">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
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
                strokeWidth="0.4"
                className="cursor-pointer hover:r-2 transition-all dark:stroke-[#111111]"
                onClick={() => setSelectedFrame(frameIdx)}
              />
            )
          })}
        </svg>

        <div className="absolute left-3 top-2 text-xs font-medium text-gray-400 dark:text-gray-500">
          MAX ({maxScore.toFixed(2)})
        </div>
        <div className="absolute left-3 bottom-2 text-xs font-medium text-gray-400 dark:text-gray-500">
          MIN ({minScore.toFixed(2)})
        </div>

        <div className="absolute right-3 bottom-2 text-xs font-medium text-gray-400 dark:text-gray-500">
          FRAME {frameScores.length}
        </div>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-3 gap-4">
        <StatBox
          label="AVG PROBABILITY"
          value={(avgScore * 100).toFixed(1) + '%'}
          color={avgScore > 0.7 ? 'text-red-600 dark:text-red-400' : avgScore > 0.4 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}
        />
        <StatBox
          label="MAX SPIKE"
          value={(maxScore * 100).toFixed(1) + '%'}
          color="text-red-600 dark:text-red-400"
        />
        <StatBox
          label="MIN SCORE"
          value={(minScore * 100).toFixed(1) + '%'}
          color="text-emerald-600 dark:text-emerald-400"
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
            <div className="mt-2 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#262626] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                  Frame {selectedFrame + 1} Details
                </h4>
                <button
                  onClick={() => setSelectedFrame(null)}
                  className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#262626] p-2.5 rounded-lg shadow-sm">
                  <span className="text-gray-500 dark:text-gray-400 font-medium text-xs tracking-wide">SCORE</span>
                  <span className={`font-semibold ${
                    frameScores[selectedFrame] > 0.7 ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'
                  }`}>
                    {(frameScores[selectedFrame] * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#262626] p-2.5 rounded-lg shadow-sm">
                  <span className="text-gray-500 dark:text-gray-400 font-medium text-xs tracking-wide">CLASSIFICATION</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {frameScores[selectedFrame] > 0.5 ? 'FAKE' : 'REAL'}
                  </span>
                </div>
                {suspiciousFrames?.includes(selectedFrame) && (
                  <div className="mt-3 p-2.5 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    <p className="text-red-700 dark:text-red-400 font-medium text-xs">
                      Flagged as heavily manipulated.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-gray-500 dark:text-gray-400 pt-5 border-t border-gray-100 dark:border-[#262626] font-medium tracking-wide">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#0F172A] dark:bg-gray-200"></div>
          <span>SCORE</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <span>SUSPICIOUS</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-[1.5px] bg-red-400 opacity-60 flex gap-0.5"><div className="w-full bg-white dark:bg-[#111111]"></div><div className="w-full bg-white dark:bg-[#111111]"></div></div>
          <span>THRESHOLD</span>
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value, color }) {
  return (
    <div className="bg-[#FAFAFA] dark:bg-[#111111] border border-gray-100 dark:border-[#262626] rounded-lg p-3 text-center transition-colors hover:bg-gray-50 dark:hover:bg-[#1A1A1A]">
      <p className="text-gray-400 dark:text-gray-500 text-[10px] font-medium tracking-wider mb-1 uppercase">{label}</p>
      <p className={`text-base font-bold ${color}`}>{value}</p>
    </div>
  )
}
