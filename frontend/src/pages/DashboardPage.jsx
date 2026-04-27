import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import VideoDropzone from '../components/VideoDropzone'
import ResultCard from '../components/ResultCard'
import ExplanationPanel from '../components/ExplanationPanel'
import FrameTimeline from '../components/FrameTimeline'
import ConfidenceBreakdown from '../components/ConfidenceBreakdown'
import Alert from '../components/Alert'
import { useVideoAnalysis } from '../hooks/useVideoAnalysis'

export default function DashboardPage() {
  const {
    videoFile, videoURL, uploadProgress,
    isLoading, result, error,
    selectFile, analyze, reset, hasFile,
  } = useVideoAnalysis()

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-5 sm:px-8 py-16 sm:py-24">
        
        {/* ── Hero Section ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center mb-12 sm:mb-16"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-[#111827] dark:text-white mb-5 tracking-tight">
            Detect Deepfake Videos in Seconds
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Upload any video to securely analyze it for signs of manipulation. 
            Our advanced models provide a simple, definitive verdict.
          </p>
        </motion.div>

        {/* ── Main Workspace ──────────────────────────────────────────────── */}
        <div className="space-y-8">
          
          {/* Upload Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="bg-white dark:bg-[#171717] rounded-xl border border-gray-200 dark:border-[#262626] shadow-sm p-6 sm:p-8 transition-colors"
          >
            <VideoDropzone
              videoFile={videoFile}
              onFileSelect={selectFile}
              onReset={reset}
              disabled={isLoading}
            />

            <AnimatePresence>
              {error && !isLoading && (
                <div className="mt-4">
                  <Alert message={error} type="error" />
                </div>
              )}
            </AnimatePresence>

            {/* Video preview */}
            <AnimatePresence>
              {videoURL && (
                <motion.div
                  key="video-preview"
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <label className="block text-gray-500 dark:text-gray-400 text-sm mb-2 font-medium">Preview</label>
                  <video
                    key={videoURL}
                    controls
                    preload="auto"
                    className="w-full rounded-lg border border-gray-200 dark:border-[#262626] max-h-60 object-contain bg-gray-50/50 dark:bg-[#111111]/50 shadow-sm"
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
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400 font-medium tracking-tight">
                      {uploadProgress < 100 ? 'Uploading content...' : 'Analyzing video...'}
                    </span>
                    {uploadProgress < 100 && (
                      <span className="text-[#0F172A] dark:text-gray-200 font-medium">{uploadProgress}%</span>
                    )}
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-[#262626] rounded-full overflow-hidden">
                    {uploadProgress < 100 ? (
                      <motion.div
                        className="h-full bg-[#0F172A] dark:bg-white rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ ease: 'linear' }}
                      />
                    ) : (
                      <div className="h-full bg-[#0F172A] dark:bg-white rounded-full animate-pulse w-full opacity-60" />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Analyze Button */}
            <div className="mt-8">
              <button
                id="analyze-btn"
                onClick={analyze}
                disabled={!hasFile || isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 text-base h-12"
              >
                {isLoading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing
                  </>
                ) : (
                  'Analyze Video'
                )}
              </button>
            </div>
          </motion.div>

          {/* Results Panel */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-[#171717] rounded-xl border border-gray-200 dark:border-[#262626] shadow-sm p-6 sm:p-8 transition-colors">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Results</h2>
                  <ResultCard result={result} />
                </div>

                {/* XAI Components */}
                {(result.frame_scores?.length > 0 || result.explanations?.length > 0 || result.confidence_breakdown) && (
                  <div className="bg-white dark:bg-[#171717] rounded-xl border border-gray-200 dark:border-[#262626] shadow-sm p-6 sm:p-8 space-y-8 transition-colors">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Detailed Analysis</h2>
                    
                    {result.frame_scores && result.frame_scores.length > 0 && (
                      <FrameTimeline
                        frameScores={result.frame_scores}
                        suspiciousFrames={result.suspicious_frames}
                      />
                    )}

                    {result.explanations && result.explanations.length > 0 && (
                      <ExplanationPanel
                        explanations={result.explanations}
                        prediction={result.prediction}
                      />
                    )}

                    <ConfidenceBreakdown
                      confidenceBreakdown={result.confidence_breakdown}
                      warnings={result.warnings}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── How It Works ────────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-24 sm:mt-32"
        >
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">How It Works</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center sm:text-left">
            {[
              { 
                step: '1', 
                title: 'Upload File',   
                desc: 'Select any suspicious video file. We support most standard formats like MP4, MOV, and AVI.' 
              },
              { 
                step: '2', 
                title: 'AI Analysis', 
                desc: 'Our models extract frames to detect unnatural facial movements and artifacts simultaneously.' 
              },
              { 
                step: '3', 
                title: 'Get Results',  
                desc: 'Review the confidence score and access an explainable timeline breakdown of the findings.' 
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center sm:items-start group">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#262626] flex items-center justify-center text-gray-900 dark:text-gray-200 font-medium mb-4 group-hover:bg-[#0F172A] dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-colors duration-300">
                  {step}
                </div>
                <h3 className="text-gray-900 dark:text-white font-medium text-base mb-2">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </motion.section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 dark:border-[#262626] bg-white dark:bg-[#0A0A0A] mt-auto transition-colors">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
          <p>© 2026 Deepfake Detector. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">About</a>
            <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path></svg>
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
