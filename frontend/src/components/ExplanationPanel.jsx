import { motion } from 'framer-motion'

export default function ExplanationPanel({ explanations, prediction }) {
  if (!explanations || explanations.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Explainability</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Primary indicators leading to this classification
          </p>
        </div>
      </div>

      {/* Explanations List */}
      <ul className="space-y-2.5">
        {explanations.map((explanation, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 * index }}
            className="flex items-start gap-4 bg-[#FAFAFA] dark:bg-[#111111] border border-gray-100 dark:border-[#262626] rounded-lg p-4 transition-colors"
          >
            <span className="text-gray-400 dark:text-gray-500 font-semibold text-sm shrink-0 border border-gray-200 dark:border-[#262626] bg-white dark:bg-[#1A1A1A] w-6 h-6 flex justify-center items-center rounded-full mt-0.5">
              {index + 1}
            </span>
            <span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              {explanation}
            </span>
          </motion.li>
        ))}
      </ul>

      {/* Info Note */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-[#1A1A1A] rounded-lg border border-gray-100 dark:border-[#262626] flex items-start gap-3 transition-colors">
        <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
          These insights are pattern-based model interpretations. Visual evidence should be reviewed manually.
        </p>
      </div>
    </div>
  )
}
