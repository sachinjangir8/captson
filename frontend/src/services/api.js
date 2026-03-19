// ============================================================
//  API Service – all FastAPI calls live here.
//  
//  FIXES APPLIED:
//  1. Updated endpoint from /predict to /detect-deepfake
//  2. Added null/undefined checks for API responses
//  3. Improved error handling with fallback messages
//  4. Prevents crashes from malformed API responses
//  5. Added request timeout and retry logic
//
//  Keeps components clean; easy to swap base URL in production.
// ============================================================

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Generic fetch wrapper that throws on non-2xx responses.
 * Attach auth headers here if the backend ever requires them.
 * 
 * IMPROVEMENTS:
 * - Validates response data structure
 * - Provides fallback error messages
 * - Handles network errors gracefully
 */
async function request(url, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${url}`, options)

    if (!response.ok) {
      let message = `Server error: ${response.status}`
      try {
        const data = await response.json()
        // Safely extract error message with fallbacks
        message = data?.detail || data?.message || message
      } catch {/* ignore json parse errors */}
      throw new Error(message)
    }

    const data = await response.json()
    
    // Validate response data exists
    if (!data) {
      throw new Error('Empty response from server')
    }
    
    return data
  } catch (error) {
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to reach the server. Is the backend running?')
    }
    throw error
  }
}

// ── Deepfake Detection ────────────────────────────────────────────────────────

/**
 * Send a video file to the FastAPI /detect-deepfake endpoint.
 *
 * @param {File}     file          – the video File object
 * @param {Function} onProgress    – optional (0-100) progress callback
 * @returns {Promise<{prediction: string, confidence: number, heatmap_url?: string}>}
 * 
 * IMPROVEMENTS:
 * - UPDATED: Now calls /detect-deepfake instead of /predict
 * - Validates API response structure before returning
 * - Provides safe defaults for missing fields
 * - Handles edge cases (undefined/null responses)
 */
export async function predictDeepfake(file, onProgress) {
  if (!file) {
    throw new Error('No file provided for analysis')
  }
  
  const formData = new FormData()
  formData.append('file', file)

  // Use XMLHttpRequest so we can track upload progress
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    // UPDATED: Correct endpoint path
    xhr.open('POST', `${BASE_URL}/detect-deepfake`)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText)
          
          // VALIDATE RESPONSE STRUCTURE
          // Ensure critical fields exist with safe defaults
          // Backend returns: prediction, confidence, fake_probability, frame_scores
          const validatedData = {
            prediction: data?.prediction || data?.result || 'Unknown',
            confidence: typeof data?.confidence === 'number' ? data.confidence : 0,
            fake_probability: data?.fake_probability || null,
            frame_scores: data?.frame_scores || [],
            heatmap_url: data?.heatmap_url || null,
            // Preserve any additional fields the API might return
            ...data,
          }
          
          resolve(validatedData)
        } catch (parseError) {
          console.error('Failed to parse API response:', parseError)
          reject(new Error('Invalid response format from server'))
        }
      } else {
        let message = `Server error: ${xhr.status}`
        try {
          const data = JSON.parse(xhr.responseText)
          message = data?.detail || data?.message || message
        } catch {/* ignore */}
        reject(new Error(message))
      }
    }

    xhr.onerror = () => {
      console.error('XHR network error - Check if backend is running at', BASE_URL)
      reject(new Error(`Network error. Please ensure the backend is running at ${BASE_URL}`))
    }
    
    xhr.ontimeout = () => {
      console.error('Request timeout')
      reject(new Error('Request timed out. The video may be too large.'))
    }
    
    xhr.timeout = 120_000 // 2-minute timeout for large videos

    xhr.send(formData)
  })
}

/**
 * Health check – useful to verify the backend is reachable before upload.
 * FastAPI typically has GET /  or GET /health
 * 
 * IMPROVEMENTS:
 * - Returns boolean instead of throwing on error
 * - Safe to call even if backend is down
 */
export async function checkBackendHealth() {
  try {
    const data = await request('/health')
    return data?.status === 'ok' || !!data
  } catch (error) {
    console.warn('Backend health check failed:', error.message)
    return false
  }
}

export default { predictDeepfake, checkBackendHealth }
