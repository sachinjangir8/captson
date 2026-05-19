import { useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import VideoDropzone from '../components/VideoDropzone'
import ResultCard from '../components/ResultCard'
import ExplanationPanel from '../components/ExplanationPanel'
import FrameTimeline from '../components/FrameTimeline'
import ConfidenceBreakdown from '../components/ConfidenceBreakdown'
import { useVideoAnalysis } from '../hooks/useVideoAnalysis'

export default function DashboardPage() {
  const {
    videoFile, videoURL, uploadProgress,
    isLoading, result, error,
    selectFile, analyze, reset, hasFile,
  } = useVideoAnalysis()

  return (
    <div style={styles.root}>
      <Navbar />

      <main style={styles.main}>

        {/* ── Hero ── */}
        <div style={styles.hero}>
          <div style={styles.heroBadge}>
            <div style={styles.heroBadgeDot} />
            AI-powered deepfake detection
          </div>
          <h1 style={styles.heroTitle}>Detect deepfake videos<br />in seconds.</h1>
          <p style={styles.heroSub}>
            Upload any video to analyze it for signs of manipulation.
            Advanced models provide a clear, definitive verdict.
          </p>
        </div>

        {/* ── Upload Panel ── */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>01 — Upload</span>
            <span style={styles.cardTitle}>Select a video file</span>
          </div>

          <VideoDropzone
            videoFile={videoFile}
            onFileSelect={selectFile}
            onReset={reset}
            disabled={isLoading}
          />

          {/* Error */}
          {error && !isLoading && (
            <div style={styles.errBox}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}

          {/* Video Preview */}
          {videoURL && (
            <div style={{ marginTop: 20 }}>
              <p style={styles.previewLabel}>Preview</p>
              <video
                key={videoURL}
                controls
                preload="auto"
                style={styles.videoPreview}
              >
                <source src={videoURL} type={videoFile?.type || 'video/mp4'} />
              </video>
            </div>
          )}

          {/* Progress */}
          {isLoading && (
            <div style={{ marginTop: 20 }}>
              <div style={styles.progressRow}>
                <span style={styles.progressLabel}>
                  {uploadProgress < 100 ? 'Uploading…' : 'Analyzing video…'}
                </span>
                {uploadProgress < 100 && (
                  <span style={styles.progressPct}>{uploadProgress}%</span>
                )}
              </div>
              <div style={styles.progressTrack}>
                <div style={{
                  ...styles.progressFill,
                  width: uploadProgress < 100 ? `${uploadProgress}%` : '100%',
                  opacity: uploadProgress >= 100 ? 0.5 : 1,
                }} />
              </div>
            </div>
          )}

          {/* Analyze Button */}
          <div style={{ marginTop: 28 }}>
            <button
              id="analyze-btn"
              onClick={analyze}
              disabled={!hasFile || isLoading}
              style={{
                ...styles.btn,
                opacity: !hasFile || isLoading ? 0.5 : 1,
                cursor: !hasFile || isLoading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => { if (hasFile && !isLoading) e.currentTarget.style.background = '#222' }}
              onMouseLeave={e => e.currentTarget.style.background = '#0A0A0A'}
            >
              {isLoading ? (
                <>
                  <span style={styles.spinner} />
                  Processing…
                </>
              ) : (
                <>
                  Analyze Video
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Results ── */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardLabel}>02 — Result</span>
                <span style={styles.cardTitle}>Verdict</span>
              </div>
              <ResultCard result={result} />
            </div>

            {(result.frame_scores?.length > 0 || result.explanations?.length > 0 || result.confidence_breakdown) && (
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.cardLabel}>03 — Analysis</span>
                  <span style={styles.cardTitle}>Detailed breakdown</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                  {result.frame_scores?.length > 0 && (
                    <FrameTimeline
                      frameScores={result.frame_scores}
                      suspiciousFrames={result.suspicious_frames}
                    />
                  )}
                  {result.explanations?.length > 0 && (
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
              </div>
            )}
          </div>
        )}

        {/* ── How It Works ── */}
        <section style={styles.howSection}>
          <div style={styles.howHeader}>
            <span style={styles.cardLabel}>Process</span>
            <h2 style={styles.howTitle}>How it works</h2>
          </div>

          <div style={styles.stepsGrid}>
            {[
              {
                step: '01',
                title: 'Upload file',
                desc: 'Select any suspicious video. We support MP4, MOV, AVI and most standard formats.',
              },
              {
                step: '02',
                title: 'AI analysis',
                desc: 'Our models extract frames to detect unnatural facial movements and manipulation artifacts.',
              },
              {
                step: '03',
                title: 'Get results',
                desc: 'Review the confidence score and access an explainable timeline breakdown of findings.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step} style={styles.stepCard}>
                <div style={styles.stepNum}>{step}</div>
                <div style={styles.stepDivider} />
                <h3 style={styles.stepTitle}>{title}</h3>
                <p style={styles.stepDesc}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.footerLeft}>
            <div style={styles.footerLogo}>
              <div style={styles.footerLogoIcon}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <span style={styles.footerLogoName}>DeepGuard AI</span>
            </div>
            <p style={styles.footerCopy}>© 2026 DeepGuard AI. All rights reserved.</p>
          </div>
          <div style={styles.footerLinks}>
            {['About', 'Privacy', 'GitHub'].map(l => (
              <a key={l} href="#" style={styles.footerLink}
                onMouseEnter={e => e.currentTarget.style.color = '#0A0A0A'}
                onMouseLeave={e => e.currentTarget.style.color = '#bbb'}
              >{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}

const styles = {
  root: {
    minHeight: '100vh',
    background: '#F5F5F3',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  main: {
    flex: 1,
    maxWidth: 720,
    margin: '0 auto',
    width: '100%',
    padding: '64px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },

  /* ── Hero ── */
  hero: {
    marginBottom: 12,
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: '#E8F5F0',
    color: '#0F6E56',
    fontSize: 11,
    fontWeight: 500,
    padding: '5px 10px',
    borderRadius: 20,
    marginBottom: 20,
    width: 'fit-content',
  },
  heroBadgeDot: {
    width: 6,
    height: 6,
    background: '#1D9E75',
    borderRadius: '50%',
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: 600,
    color: '#0A0A0A',
    lineHeight: 1.15,
    letterSpacing: '-1.2px',
    marginBottom: 14,
  },
  heroSub: {
    fontSize: 15,
    color: '#888',
    lineHeight: 1.65,
    fontWeight: 300,
    maxWidth: 480,
  },

  /* ── Card ── */
  card: {
    background: '#fff',
    border: '1px solid #EBEBEB',
    borderRadius: 14,
    padding: '32px 36px',
  },
  cardHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginBottom: 24,
    paddingBottom: 20,
    borderBottom: '1px solid #F0F0F0',
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: 500,
    color: '#bbb',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#0A0A0A',
    letterSpacing: '-0.2px',
  },

  /* ── Error ── */
  errBox: {
    marginTop: 16,
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    color: '#991B1B',
    fontSize: 13,
    padding: '10px 14px',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  /* ── Video Preview ── */
  previewLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: '#888',
    marginBottom: 8,
  },
  videoPreview: {
    width: '100%',
    borderRadius: 10,
    border: '1px solid #EBEBEB',
    maxHeight: 260,
    objectFit: 'contain',
    background: '#FAFAFA',
  },

  /* ── Progress ── */
  progressRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: '#555',
    fontWeight: 400,
  },
  progressPct: {
    fontSize: 13,
    color: '#0A0A0A',
    fontWeight: 500,
  },
  progressTrack: {
    width: '100%',
    height: 3,
    background: '#F0F0F0',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: '#1D9E75',
    borderRadius: 99,
    transition: 'width 0.3s ease',
  },

  /* ── Button ── */
  btn: {
    width: '100%',
    height: 48,
    background: '#0A0A0A',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'background 0.18s',
  },
  spinner: {
    width: 16,
    height: 16,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    flexShrink: 0,
  },

  /* ── How It Works ── */
  howSection: {
    marginTop: 32,
    paddingTop: 40,
    borderTop: '1px solid #E8E8E8',
  },
  howHeader: {
    marginBottom: 28,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  howTitle: {
    fontSize: 22,
    fontWeight: 600,
    color: '#0A0A0A',
    letterSpacing: '-0.5px',
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
  },
  stepCard: {
    background: '#fff',
    border: '1px solid #EBEBEB',
    borderRadius: 12,
    padding: '24px 20px',
  },
  stepNum: {
    fontFamily: "'Space Mono', monospace, system-ui",
    fontSize: 11,
    color: '#1D9E75',
    fontWeight: 400,
    marginBottom: 14,
    letterSpacing: '0.04em',
  },
  stepDivider: {
    width: 24,
    height: 2,
    background: '#F0F0F0',
    borderRadius: 99,
    marginBottom: 14,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#0A0A0A',
    marginBottom: 8,
    letterSpacing: '-0.2px',
  },
  stepDesc: {
    fontSize: 13,
    color: '#999',
    lineHeight: 1.6,
    fontWeight: 300,
  },

  /* ── Footer ── */
  footer: {
    borderTop: '1px solid #E8E8E8',
    background: '#fff',
    marginTop: 'auto',
  },
  footerInner: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  footerLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  footerLogoIcon: {
    width: 26,
    height: 26,
    background: '#0A0A0A',
    borderRadius: 7,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLogoName: {
    fontSize: 13,
    fontWeight: 500,
    color: '#0A0A0A',
    letterSpacing: '-0.1px',
  },
  footerCopy: {
    fontSize: 11,
    color: '#bbb',
  },
  footerLinks: {
    display: 'flex',
    gap: 24,
  },
  footerLink: {
    fontSize: 13,
    color: '#bbb',
    textDecoration: 'none',
    transition: 'color 0.15s',
  },
}
