import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Minimal inline icons ────────────────────────────────────────────────────
const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6l-9-4z" />
  </svg>
)
const UploadIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
  </svg>
)
const SpinnerIcon = () => (
  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)
const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const VideoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
)

// ─── Stat Pill ───────────────────────────────────────────────────────────────
const StatPill = ({ label }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center',
    padding: '6px 14px', borderRadius: 999,
    border: '1px solid #e2e8f0', background: '#fff',
    fontSize: 12, fontWeight: 500, color: '#475569',
    fontFamily: "'DM Sans', sans-serif",
    whiteSpace: 'nowrap',
  }}>{label}</span>
)

// ─── Result Badge ─────────────────────────────────────────────────────────────
const ResultBadge = ({ label, isReal }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '4px 12px', borderRadius: 999,
    background: isReal ? '#f0fdf4' : '#fff1f2',
    border: `1px solid ${isReal ? '#bbf7d0' : '#fecdd3'}`,
    color: isReal ? '#16a34a' : '#e11d48',
    fontSize: 12, fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
  }}>
    <span style={{
      width: 6, height: 6, borderRadius: '50%',
      background: isReal ? '#22c55e' : '#f43f5e',
      display: 'inline-block',
    }} />
    {label}
  </span>
)

// ─── Confidence Bar ───────────────────────────────────────────────────────────
const ConfBar = ({ label, value, color }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
      <span style={{ fontSize: 12, color: '#64748b', fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', fontFamily: "'DM Sans', sans-serif" }}>{value}%</span>
    </div>
    <div style={{ height: 5, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        style={{ height: '100%', background: color, borderRadius: 99 }}
      />
    </div>
  </div>
)

// ─── Mock analysis hook ───────────────────────────────────────────────────────
function useMockAnalysis() {
  const [videoFile, setVideoFile] = useState(null)
  const [videoURL, setVideoURL] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const selectFile = (file) => {
    if (!file) return
    setVideoFile(file)
    setVideoURL(URL.createObjectURL(file))
    setResult(null)
    setError(null)
  }

  const analyze = async () => {
    if (!videoFile) return
    setIsLoading(true); setError(null); setResult(null); setUploadProgress(0)
    // Simulate upload
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(r => setTimeout(r, 80))
      setUploadProgress(i)
    }
    // Simulate analysis
    await new Promise(r => setTimeout(r, 1400))
    setResult({
      prediction: Math.random() > 0.5 ? 'REAL' : 'FAKE',
      confidence: +(Math.random() * 30 + 70).toFixed(1),
      frame_scores: Array.from({ length: 12 }, (_, i) => ({ frame: i + 1, score: +(Math.random()).toFixed(2) })),
      confidence_breakdown: { facial_artifacts: 78, temporal_consistency: 65, compression_artifacts: 82 },
      warnings: ['Minor compression noise detected'],
    })
    setIsLoading(false)
  }

  const reset = () => {
    setVideoFile(null); setVideoURL(null)
    setResult(null); setError(null); setUploadProgress(0)
  }

  return { videoFile, videoURL, uploadProgress, isLoading, result, error, selectFile, analyze, reset, hasFile: !!videoFile }
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { videoFile, videoURL, uploadProgress, isLoading, result, error, selectFile, analyze, reset, hasFile } = useMockAnalysis()
  const fileRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('video/')) selectFile(file)
  }

  const isReal = result?.prediction === 'REAL'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #f8fafc; } ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── LEFT SIDEBAR (mirrors login left panel) ─────────────────────── */}
        <div style={{
          width: 280, flexShrink: 0, background: '#f1f5f9',
          borderRight: '1px solid #e2e8f0',
          display: 'flex', flexDirection: 'column',
          padding: '28px 24px',
          position: 'sticky', top: 0, height: '100vh', overflow: 'hidden',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: '#0f172a',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            }}>
              <ShieldIcon />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', letterSpacing: '-0.3px' }}>DeepGuard AI</span>
          </div>

          {/* Live badge */}
          <div style={{ marginBottom: 28 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 500, color: '#16a34a',
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: 999, padding: '4px 10px',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              Live threat monitoring
            </span>
          </div>

          {/* Tagline */}
          <h2 style={{
            fontFamily: "'Instrument Serif', serif", fontStyle: 'italic',
            fontSize: 26, lineHeight: 1.25, color: '#0f172a', marginBottom: 14, fontWeight: 400,
          }}>
            Security that<br />never blinks.
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 32 }}>
            Real-time detection across your entire infrastructure. Threats caught before they land.
          </p>

          {/* Stat pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['99.98% uptime', '< 200ms detection', '47 regions', 'SOC 2 Type II'].map(s => (
              <StatPill key={s} label={s} />
            ))}
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Bottom compliance note */}
          <p style={{ fontSize: 11, color: '#94a3b8' }}>ISO 27001 · GDPR compliant</p>
        </div>

        {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '40px 48px 60px' }}>

          {/* Top bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }}>
            <div>
              <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>DASHBOARD</p>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>Video Analysis</h1>
            </div>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', background: '#e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer',
            }}>JD</div>
          </div>

          {/* ── Upload Card ───────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            style={{
              background: '#fff', borderRadius: 16,
              border: '1px solid #e2e8f0',
              padding: '28px 32px', marginBottom: 20,
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>UPLOAD FILE</p>

            {/* Dropzone */}
            <AnimatePresence>
              {!videoFile ? (
                <motion.div
                  key="dropzone"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  style={{
                    border: `2px dashed ${dragOver ? '#0f172a' : '#cbd5e1'}`,
                    borderRadius: 12, padding: '36px 24px', textAlign: 'center',
                    cursor: 'pointer', transition: 'all 0.2s',
                    background: dragOver ? '#f8fafc' : 'transparent',
                  }}
                >
                  <div style={{ color: '#94a3b8', marginBottom: 10 }}><UploadIcon /></div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 4 }}>
                    Drop your video here or <span style={{ color: '#0f172a', textDecoration: 'underline' }}>browse</span>
                  </p>
                  <p style={{ fontSize: 11, color: '#94a3b8' }}>MP4, MOV, AVI — max 500MB</p>
                  <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) selectFile(f) }} />
                </motion.div>
              ) : (
                <motion.div
                  key="file-selected"
                  initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: '#f8fafc', borderRadius: 10, padding: '14px 16px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 9, background: '#0f172a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0,
                  }}><VideoIcon /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{videoFile.name}</p>
                    <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{(videoFile.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                  {!isLoading && (
                    <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}><CloseIcon /></button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Video Preview */}
            <AnimatePresence>
              {videoURL && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <video controls preload="auto" style={{
                    width: '100%', borderRadius: 10, maxHeight: 220,
                    objectFit: 'contain', background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                  }}>
                    <source src={videoURL} type={videoFile?.type || 'video/mp4'} />
                  </video>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  style={{
                    marginTop: 14, display: 'flex', alignItems: 'center', gap: 8,
                    background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8,
                    padding: '10px 14px', color: '#e11d48', fontSize: 12, fontWeight: 500,
                  }}
                >
                  <AlertIcon />{error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                      {uploadProgress < 100 ? 'Uploading content...' : 'Analyzing video...'}
                    </span>
                    {uploadProgress < 100 && <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{uploadProgress}%</span>}
                  </div>
                  <div style={{ height: 4, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                    {uploadProgress < 100 ? (
                      <motion.div
                        style={{ height: '100%', background: '#0f172a', borderRadius: 99 }}
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ ease: 'linear' }}
                      />
                    ) : (
                      <div style={{ height: '100%', background: '#0f172a', borderRadius: 99, width: '100%', opacity: 0.5, animation: 'pulse 1s infinite' }} />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Analyze Button */}
            <button
              onClick={analyze}
              disabled={!hasFile || isLoading}
              style={{
                marginTop: 20, width: '100%', height: 46,
                background: hasFile && !isLoading ? '#0f172a' : '#e2e8f0',
                color: hasFile && !isLoading ? '#fff' : '#94a3b8',
                border: 'none', borderRadius: 10,
                fontSize: 14, fontWeight: 600, cursor: hasFile && !isLoading ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif",
                letterSpacing: '-0.2px',
              }}
            >
              {isLoading ? <><SpinnerIcon />Processing…</> : <>Analyze Video →</>}
            </button>
          </motion.div>

          {/* ── Results ───────────────────────────────────────────────────── */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              >
                {/* Verdict Card */}
                <div style={{
                  background: '#fff', borderRadius: 16,
                  border: `1px solid ${isReal ? '#bbf7d0' : '#fecdd3'}`,
                  padding: '24px 32px', marginBottom: 20,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>VERDICT</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <h3 style={{
                          fontSize: 28, fontWeight: 700, letterSpacing: '-0.8px',
                          color: isReal ? '#16a34a' : '#e11d48',
                          fontFamily: "'Instrument Serif', serif", fontStyle: 'italic',
                        }}>
                          {isReal ? 'Authentic' : 'Deepfake Detected'}
                        </h3>
                        <ResultBadge label={result.prediction} isReal={isReal} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, marginBottom: 2 }}>Confidence</p>
                      <p style={{ fontSize: 32, fontWeight: 700, color: '#0f172a', letterSpacing: '-1px', lineHeight: 1 }}>{result.confidence}%</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
                    {isReal
                      ? 'No significant manipulation artifacts were detected. This video appears to be authentic with high confidence.'
                      : 'Facial inconsistencies and temporal artifacts indicate this video has been synthetically generated or manipulated.'}
                  </p>
                </div>

                {/* Detailed Analysis */}
                <div style={{
                  background: '#fff', borderRadius: 16,
                  border: '1px solid #e2e8f0', padding: '24px 32px',
                }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>DETAILED ANALYSIS</p>

                  {/* Frame Timeline */}
                  {result.frame_scores?.length > 0 && (
                    <div style={{ marginBottom: 28 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 12 }}>Frame Risk Timeline</p>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 52 }}>
                        {result.frame_scores.map(({ frame, score }) => (
                          <div key={frame} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${score * 100}%` }}
                              transition={{ duration: 0.6, delay: frame * 0.04, ease: 'easeOut' }}
                              style={{
                                width: '100%', borderRadius: 3,
                                background: score > 0.7 ? '#f43f5e' : score > 0.4 ? '#f59e0b' : '#22c55e',
                                minHeight: 4,
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>Frame 1</span>
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>Frame {result.frame_scores.length}</span>
                      </div>
                    </div>
                  )}

                  {/* Confidence Breakdown */}
                  {result.confidence_breakdown && (
                    <div style={{ marginBottom: 20 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 14 }}>Signal Breakdown</p>
                      <ConfBar label="Facial Artifacts" value={result.confidence_breakdown.facial_artifacts} color="#0f172a" />
                      <ConfBar label="Temporal Consistency" value={result.confidence_breakdown.temporal_consistency} color="#475569" />
                      <ConfBar label="Compression Artifacts" value={result.confidence_breakdown.compression_artifacts} color="#94a3b8" />
                    </div>
                  )}

                  {/* Warnings */}
                  {result.warnings?.length > 0 && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: '#fffbeb', border: '1px solid #fde68a',
                      borderRadius: 8, padding: '10px 14px',
                      color: '#92400e', fontSize: 12, fontWeight: 500,
                    }}>
                      <AlertIcon />{result.warnings[0]}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── How It Works ──────────────────────────────────────────────── */}
          {!result && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              style={{
                background: '#fff', borderRadius: 16,
                border: '1px solid #e2e8f0', padding: '24px 32px',
              }}
            >
              <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>HOW IT WORKS</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                {[
                  { step: '01', title: 'Upload File', desc: 'Drop any video in MP4, MOV or AVI format.' },
                  { step: '02', title: 'AI Analysis', desc: 'Frame-level analysis detects facial and temporal artifacts.' },
                  { step: '03', title: 'Get Results', desc: 'Confidence score with explainable breakdown.' },
                ].map(({ step, title, desc }) => (
                  <div key={step}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, background: '#f1f5f9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 10,
                    }}>{step}</div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>{title}</p>
                    <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>{desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </>
  )
}
