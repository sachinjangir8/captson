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
function StatCard({ label, value }) {
  return (
    <div className="glass-card text-center p-4">
      <div className="text-xl font-bold text-slate-800">{value}</div>
      <div className="text-slate-500 text-xs mt-1 font-medium">{label}</div>
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
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Hero Section ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100
                          text-indigo-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 shadow-sm">
            AI-Powered Detection
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 mb-4 leading-tight">
            <span className="gradient-text">Deepfake</span> Detector
          </h1>
          <p className="text-slate-600 text-lg max-w-xl mx-auto leading-relaxed">
            Upload any video and our AI model will analyze it for signs of manipulation
            using <strong className="text-slate-800 font-semibold">EfficientNet + LSTM</strong> architecture.
          </p>
        </motion.div>

        {/* ── Stats Row ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-10"
        >
          <StatCard label="Accuracy"    value="96.3%" />
          <StatCard label="Avg Speed"   value="~8 sec" />
          <StatCard label="Formats"     value="MP4/AVI/MOV" />
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
            <h2 className="text-xl font-semibold text-slate-800">
              Upload Video
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
                  <p className="text-slate-500 text-sm mb-2 font-medium">Preview</p>
                  {/* CRITICAL FIX: Use key={videoURL} to force refresh when URL changes */}
                  <video
                    key={videoURL}
                    controls
                    preload="auto"
                    className="w-full rounded-xl border border-slate-200 max-h-48 object-cover shadow-sm"
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
                    <span className="text-slate-500 font-medium">
                      {uploadProgress < 100 ? 'Uploading...' : 'Analyzing with AI...'}
                    </span>
                    {uploadProgress < 100 && (
                      <span className="text-indigo-600 font-bold">{uploadProgress}%</span>
                    )}
                  </div>
                  <div className="w-full h-2 bg-slate-100 border border-slate-200 rounded-full overflow-hidden shadow-inner">
                    {uploadProgress < 100 ? (
                      <motion.div
                        className="h-full bg-indigo-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ ease: 'linear' }}
                      />
                    ) : (
                      /* Indeterminate bar while AI processes */
                      <div className="h-full bg-indigo-500 rounded-full animate-pulse w-full" />
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
                  Analyzing...
                </>
              ) : (
                <>
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
              <h2 className="text-xl font-semibold text-slate-800 mb-5">
                Analysis Result
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
                    className="flex flex-col items-center justify-center h-64 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200"
                  >
                    <div className="text-slate-400 mb-4">
                      <svg className="w-12 h-12 mx-auto drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                      Upload a video and click <strong className="text-slate-700">Analyze Video</strong>.
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
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { step: '01', title: 'Upload',   desc: 'Drop or select a video file up to 500 MB in MP4, AVI, MOV, WebM, or MKV format.' },
              { step: '02', title: 'AI Analysis', desc: 'Our EfficientNet model extracts frames and LSTM analyses temporal patterns frame by frame.' },
              { step: '03', title: 'Results',  desc: 'Receive a confidence score and detailed verdict on whether the video is real or manipulated.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="glass-card p-6 relative overflow-hidden group">
                <div className="absolute top-4 right-4 text-4xl font-black text-slate-100
                                group-hover:text-indigo-50 transition-colors">
                  {step}
                </div>
                <h3 className="text-slate-800 font-semibold text-lg mb-2 mt-4 relative z-10">{title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed relative z-10">{desc}</p>
              </div>
            ))}
          </div>
        </motion.section>
      </main>
    </div>
  )
}
