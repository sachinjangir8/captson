import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'

const UploadIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
)

const VideoIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
)

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

export default function VideoDropzone({ videoFile, onFileSelect, onReset, disabled }) {
  const [isDragging, setIsDragging] = useState(false)
  
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        console.log('File dropped:', acceptedFiles[0].name)
        onFileSelect(acceptedFiles[0])
      }
    },
    [onFileSelect]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4', '.avi', '.mov', '.webm', '.mkv'] },
    multiple: false,
    disabled,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false),
    onDropRejected: () => setIsDragging(false),
  })

  return (
    <div>
      <AnimatePresence mode="wait">
        {!videoFile ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            {...getRootProps()}
            className={`cursor-pointer border-2 border-dashed rounded-xl py-12 px-6 text-center
                        transition-colors duration-200
                        ${isDragActive
                          ? 'border-[#0F172A] bg-[#0F172A]/5 dark:border-white dark:bg-white/5'
                          : 'border-gray-200 bg-[#FAFAFA] hover:border-gray-300 hover:bg-gray-50 dark:border-[#262626] dark:bg-[#111111] dark:hover:border-white/20 dark:hover:bg-[#1A1A1A]'
                        }
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            <motion.div
              animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
              className={`flex justify-center mb-4 ${isDragActive ? 'text-[#0F172A] dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}
            >
              <UploadIcon />
            </motion.div>
            <p className="text-gray-900 dark:text-white font-medium text-base mb-1">
              {isDragActive ? 'Drop file to upload' : 'Click to select or drop video'}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
              Securely analyze video authenticity
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['MP4', 'MOV', 'AVI', 'WEBM'].map((ext) => (
                <span key={ext}
                  className="text-[11px] font-medium tracking-wider text-gray-500 dark:text-gray-400 bg-white dark:bg-[#1A1A1A] px-2 py-0.5 rounded border border-gray-200 dark:border-[#262626]">
                  {ext}
                </span>
              ))}
            </div>
            <p className="text-gray-400 dark:text-gray-500 text-[11px] mt-4 font-medium tracking-wide">MAX SIZE: 500 MB</p>
          </motion.div>
        ) : (
          <motion.div
            key="file-info"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="flex items-center justify-between p-4 rounded-xl
                       bg-[#FAFAFA] dark:bg-[#111111] border border-gray-200 dark:border-[#262626]"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#262626] flex items-center
                              justify-center text-gray-500 dark:text-gray-400 shrink-0">
                <VideoIcon />
              </div>
              <div className="min-w-0">
                <p className="text-gray-900 dark:text-white font-medium truncate max-w-[220px] text-sm">
                  {videoFile.name}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{formatBytes(videoFile.size)}</p>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onReset(); }}
              disabled={disabled}
              className="ml-3 p-2 rounded-lg text-gray-400 hover:text-red-600
                         hover:bg-red-50 hover:border-red-100 dark:hover:bg-red-500/10 dark:hover:border-red-500/30 border border-transparent transition-all duration-200 shrink-0
                         disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Remove file"
            >
              <TrashIcon />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
