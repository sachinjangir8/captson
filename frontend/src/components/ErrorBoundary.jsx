import { Component } from 'react'
import { motion } from 'framer-motion'

/**
 * Error Boundary - Catches JavaScript errors anywhere in the component tree
 * 
 * FIXES APPLIED:
 * 1. Prevents entire app from crashing due to undefined data access
 * 2. Provides user-friendly error message with recovery option
 * 3. Logs error details for debugging
 * 4. Allows users to retry without page refresh
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console with component stack trace
    console.error('❌ Error caught by boundary:', error, errorInfo)
    console.error('Component stack:', errorInfo.componentStack)
    
    this.setState({ error, errorInfo })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-md w-full"
          >
            {/* Error Card */}
            <div className="bg-dark-800/70 backdrop-blur-xl rounded-3xl border border-red-500/30 p-8 shadow-2xl">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                              bg-red-500/20 border border-red-500/40 mb-4 text-red-400">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-white mb-2">
                Oops! Something went wrong
              </h1>

              {/* Message */}
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                We encountered an unexpected error. This is usually temporary.
              </p>

              {/* Error Details (dev mode only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 group">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400 mb-2">
                    🔍 Technical Details (click to expand)
                  </summary>
                  <div className="bg-dark-900/50 rounded-lg p-3 text-xs font-mono text-red-300 overflow-auto max-h-48">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.toString()}
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component:</strong> {this.state.errorInfo.componentStack}
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={this.handleReset}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" 
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Again
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-3 px-4 rounded-xl border border-white/15
                             text-gray-300 hover:text-white hover:border-white/30 hover:bg-white/5
                             transition-all duration-200 font-medium text-sm"
                >
                  Reload Page
                </button>
              </div>
            </div>

            {/* Help Text */}
            <p className="text-center text-gray-600 text-xs mt-5">
              If the problem persists, please contact support or check the browser console for details.
            </p>
          </motion.div>
        </div>
      )
    }

    // If no error, render children normally
    return this.props.children
  }
}

export default ErrorBoundary
