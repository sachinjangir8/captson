import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import VideoDropzone from '../components/VideoDropzone'
import ResultCard from '../components/ResultCard'
import ExplanationPanel from '../components/ExplanationPanel'  // NEW
import FrameTimeline from '../components/FrameTimeline'  // NEW
import ConfidenceBreakdown from '../components/ConfidenceBreakdown'  // NEW
import Alert from '../components/Alert'
import { useVideoAnalysis } from '../hooks/useVideoAnalysis'

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value }) {
  return (
    <div className="glass-card text-center p-4">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-gray-400 text-xs mt-0.5">{label}</div>
    </div>
  )
}

// ── Dashboard Page ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const {
    videoFile, videoURL, uploadProgress,
    isLoading, result, error,
    selectFile, analyze, reset, hasFile,
  } = useVideoAnalysis()

  const fileInputRef = useRef()

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Hero Section ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-primary-500/15 border border-primary-500/30
                          text-primary-300 text-xs font-medium px-3 py-1.5 rounded-full mb-4">
            <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-pulse" />
            AI-Powered Detection
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-4 leading-tight">
            <span className="gradient-text">Deepfake</span> Detector
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
            Upload any video and our AI model will analyze it for signs of manipulation
            using <strong className="text-gray-300">EfficientNet + LSTM</strong> architecture.
          </p>
        </motion.div>

        {/* ── Stats Row ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-10"
        >
          <StatCard icon="🎯" label="Accuracy"    value="96.3%" />
          <StatCard icon="⚡" label="Avg Speed"   value="~8 sec" />
          <StatCard icon="🎬" label="Formats"     value="MP4/AVI/MOV" />
        </motion.div>

        {/* ── Main Workspace ──────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-8">

          {/* LEFT: Upload Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-card p-6 space-y-5"
          >
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span>📤</span> Upload Video
            </h2>

            <VideoDropzone
              videoFile={videoFile}
              onFileSelect={selectFile}
              onReset={reset}
              disabled={isLoading}
            />

            {/* Error display */}
            <AnimatePresence>
              {error && !isLoading && (
                <Alert message={error} type="error" />
              )}
            </AnimatePresence>

            {/* Video preview */}
            <AnimatePresence>
              {videoURL && (
                <motion.div
                  key="video-preview"  // Force re-render on URL change
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <p className="text-gray-400 text-sm mb-2 font-medium">Preview</p>
                  {/* CRITICAL FIX: Use key={videoURL} to force refresh when URL changes */}
                  <video
                    key={videoURL}
                    controls
                    className="w-full rounded-xl border border-white/10 max-h-48 object-cover"
                  >
                    <source src={videoURL} type={videoFile?.type || 'video/mp4'} />
                    Your browser does not support the video tag.
                  </video>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Upload Progress */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">
                      {uploadProgress < 100 ? '⬆️ Uploading…' : '🧠 Analyzing with AI…'}
                    </span>
                    {uploadProgress < 100 && (
                      <span className="text-primary-400 font-medium">{uploadProgress}%</span>
                    )}
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    {uploadProgress < 100 ? (
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ ease: 'linear' }}
                      />
                    ) : (
                      /* Indeterminate bar while AI processes */
                      <div className="h-full bg-gradient-to-r from-primary-500 to-purple-500
                                      rounded-full animate-pulse w-full" />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Analyze Button */}
            <button
              id="analyze-btn"
              onClick={analyze}
              disabled={!hasFile || isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2
                         disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <span>🔍</span>
                  Analyze Video
                </>
              )}
            </button>
          </motion.div>

          {/* RIGHT: Results Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="space-y-6"
          >
            {/* Main Result Card */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-white mb-5 flex items-center gap-2">
                <span>📊</span> Analysis Result
              </h2>

              <AnimatePresence mode="wait">
                {result ? (
                  <ResultCard key="result" result={result} />
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-64 text-center"
                  >
                    <div className="text-5xl mb-4 opacity-30">🎭</div>
                    <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                      Upload a video and click <strong className="text-gray-400">Analyze Video</strong>.
                      Results will appear here with confidence scores.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* NEW: XAI Components (only show if we have results) */}
            {result && (
              <>
                {/* Frame Timeline */}
                {result.frame_scores && result.frame_scores.length > 0 && (
                  <FrameTimeline
                    frameScores={result.frame_scores}
                    suspiciousFrames={result.suspicious_frames}
                  />
                )}

                {/* Explanation Panel */}
                {result.explanations && result.explanations.length > 0 && (
                  <ExplanationPanel
                    explanations={result.explanations}
                    prediction={result.prediction}
                  />
                )}

                {/* Confidence Breakdown & Warnings */}
                <ConfidenceBreakdown
                  confidenceBreakdown={result.confidence_breakdown}
                  warnings={result.warnings}
                />
              </>
            )}
          </motion.div>
        </div>

        {/* ── How It Works ────────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16"
        >
          <h2 className="text-2xl font-bold text-white text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { step: '01', icon: '📁', title: 'Upload',   desc: 'Drop or select a video file up to 500 MB in MP4, AVI, MOV, WebM, or MKV format.' },
              { step: '02', icon: '🧠', title: 'AI Analysis', desc: 'Our EfficientNet model extracts frames and LSTM analyses temporal patterns frame by frame.' },
              { step: '03', icon: '📋', title: 'Results',  desc: 'Receive a confidence score and detailed verdict on whether the video is real or manipulated.' },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="glass-card p-6 relative overflow-hidden group">
                <div className="absolute top-4 right-4 text-6xl font-black text-white/5
                                group-hover:text-white/10 transition-colors">
                  {step}
                </div>
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </motion.section>
      </main>
    </div>
  )
}
