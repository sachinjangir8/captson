import { useState, useCallback, useEffect, useRef } from 'react'
import { predictDeepfake } from '../services/api'

// ── File Validation Constants ─────────────────────────────────────────────────
const ALLOWED_TYPES = [
  'video/mp4',
  'video/avi',
  'video/mov',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
  'video/mkv',
  'video/x-matroska',
]

const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500 MB
const MAX_SIZE_LABEL = '500 MB'

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useVideoAnalysis() {
  const [videoFile, setVideoFile] = useState(null)
  const [videoURL, setVideoURL] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // 🔥 IMPORTANT: Track current URL safely
  const currentURLRef = useRef(null)

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (currentURLRef.current) {
        URL.revokeObjectURL(currentURLRef.current)
      }
    }
  }, [])

  // ── Select / validate file ─────────────────────────────────────────────────
  const selectFile = useCallback((file) => {
    setError(null)
    setResult(null)

    if (!file) return

    // ✅ Type validation
    if (!file.type || !file.type.startsWith('video/')) {
      setError('Please upload a valid video file.')
      return
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Unsupported format. Use MP4, AVI, MOV, WebM, MKV.')
      return
    }

    // ✅ Size validation
    if (!file.size || file.size > MAX_FILE_SIZE) {
      setError(`File too large. Max size is ${MAX_SIZE_LABEL}.`)
      return
    }

    // 🔥 FIX 1: Clean old URL FIRST
    if (currentURLRef.current) {
      URL.revokeObjectURL(currentURLRef.current)
      currentURLRef.current = null
    }

    // 🔥 FIX 2: Create new blob URL
    const newURL = URL.createObjectURL(file)
    currentURLRef.current = newURL

    console.log('✅ Fresh video URL created:', newURL)

    // 🔥 FIX 3: Force React to fully refresh video
    setVideoFile(null)
    setVideoURL(null)

    setTimeout(() => {
      setVideoFile(file)
      setVideoURL(newURL)
    }, 0)

    setUploadProgress(0)
  }, [])

  // ── Run analysis ───────────────────────────────────────────────────────────
  const analyze = useCallback(async () => {
    if (!videoFile) {
      setError('Please select a video file first.')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)
    setUploadProgress(0)

    try {
      const data = await predictDeepfake(videoFile, setUploadProgress)

      if (!data) {
        throw new Error('Empty response from server')
      }

      const safeData = {
        prediction: data?.prediction || data?.result || 'Unknown',
        confidence: typeof data?.confidence === 'number' ? data.confidence : 0,
        ...data,
      }

      setResult(safeData)
    } catch (err) {
      console.error('Analysis failed:', err)
      setError(err.message || 'Analysis failed')
    } finally {
      setIsLoading(false)
    }
  }, [videoFile])

  // ── Reset ──────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    if (currentURLRef.current) {
      URL.revokeObjectURL(currentURLRef.current)
      currentURLRef.current = null
    }

    setVideoFile(null)
    setVideoURL(null)
    setUploadProgress(0)
    setIsLoading(false)
    setResult(null)
    setError(null)
  }, [])

  return {
    videoFile,
    videoURL,
    uploadProgress,
    isLoading,
    result,
    error,
    selectFile,
    analyze,
    reset,
    hasFile: !!videoFile,
  }
}