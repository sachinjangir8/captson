import { useState, useCallback } from 'react'
import { predictDeepfake } from '../services/api'

// ── File Validation Constants ─────────────────────────────────────────────────
const ALLOWED_TYPES  = ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime',
                        'video/x-msvideo', 'video/webm', 'video/mkv',
                        'video/x-matroska']
const MAX_FILE_SIZE  = 500 * 1024 * 1024  // 500 MB
const MAX_SIZE_LABEL = '500 MB'

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useVideoAnalysis() {
  const [videoFile,       setVideoFile]       = useState(null)
  const [videoURL,        setVideoURL]        = useState(null)
  const [uploadProgress,  setUploadProgress]  = useState(0)
  const [isLoading,       setIsLoading]       = useState(false)
  const [result,          setResult]          = useState(null)
  const [error,           setError]           = useState(null)

  // Safety cleanup: revoke URL on unmount to prevent memory leaks
  useState(() => () => {
    if (videoURL) {
      URL.revokeObjectURL(videoURL)
    }
  }, [])

  // ── Select / validate file ────────────────────────────────────────────────────
  const selectFile = useCallback((file) => {
    setError(null)
    setResult(null)

    // Safety check: ensure file exists
    if (!file) {
      console.warn('No file provided to selectFile')
      return
    }

    // Validate file type with null-safe check
    if (!ALLOWED_TYPES.includes(file.type)) {
      const errorMsg = `Unsupported file type. Expected MP4, AVI, MOV, WebM, or MKV. Got: ${file.type || 'unknown'}`
      console.error(errorMsg)
      setError('Unsupported file type. Please upload an MP4, AVI, MOV, WebM, or MKV video.')
      return
    }

    // Validate file size with null-safe check
    if (!file.size || file.size > MAX_FILE_SIZE) {
      const errorMsg = `File is too large. Maximum allowed size is ${MAX_SIZE_LABEL}.`
      console.error(errorMsg)
      setError(errorMsg)
      return
    }

    // Revoke previous object URL to avoid memory leaks
    if (videoURL) {
      URL.revokeObjectURL(videoURL)
    }

    setVideoFile(file)
    setVideoURL(URL.createObjectURL(file))
    setUploadProgress(0)
  }, [videoURL])

  // ── Run analysis ──────────────────────────────────────────────────────────────
  const analyze = useCallback(async () => {
    // Safety check: ensure we have a valid file
    if (!videoFile) {
      const errorMsg = 'Please select a video file first.'
      console.warn(errorMsg)
      setError(errorMsg)
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)
    setUploadProgress(0)

    try {
      const data = await predictDeepfake(videoFile, setUploadProgress)
      
      // Additional safety: validate the response data structure
      if (!data) {
        throw new Error('Received empty response from server')
      }
      
      // Ensure prediction field exists (the API service already validates this,
      // but adding extra layer of safety)
      const safeData = {
        prediction: data?.prediction || data?.result || 'Unknown',
        confidence: typeof data?.confidence === 'number' ? data.confidence : 0,
        ...data,
      }
      
      setResult(safeData)
    } catch (err) {
      console.error('Analysis failed:', err.message)
      setError(err.message || 'Analysis failed. Please try again.')
      setResult(null) // Clear any partial results
    } finally {
      setIsLoading(false)
    }
  }, [videoFile])

  // ── Reset everything ──────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    // Clean up resources safely
    if (videoURL) {
      try {
        URL.revokeObjectURL(videoURL)
      } catch (err) {
        console.warn('Error revoking URL:', err)
      }
    }
    
    setVideoFile(null)
    setVideoURL(null)
    setUploadProgress(0)
    setIsLoading(false)
    setResult(null)
    setError(null)
  }, [videoURL])

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
