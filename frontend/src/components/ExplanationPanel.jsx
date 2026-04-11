import { motion } from 'framer-motion'

/**
 * Displays natural language explanations for why the model made its prediction.
 * 
 * Props:
 *  explanations: string[] - Array of explanation strings
 *  prediction: 'real' | 'fake' - Overall prediction
 */
export default function ExplanationPanel({ explanations, prediction }) {
  if (!explanations || explanations.length === 0) {
    return null
  }

  const bgColor = prediction === 'fake' 
    ? 'bg-red-500/10 border-red-500/30' 
    : 'bg-emerald-500/10 border-emerald-500/30'
  


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className={`rounded-2xl border ${bgColor} p-6 space-y-4`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">

        <div>
          <h3 className="text-xl font-bold text-white">Why this prediction?</h3>
          <p className="text-gray-400 text-sm">
            The AI detected the following indicators:
          </p>
        </div>
      </div>

      {/* Explanations List */}
      <ul className="space-y-3">
        {explanations.map((explanation, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 * index }}
            className="flex items-start gap-3 bg-white/5 rounded-xl p-4"
          >
            <span className="text-primary-400 font-bold text-lg shrink-0">
              {index + 1}.
            </span>
            <span className="text-gray-200 leading-relaxed">
              {explanation}
            </span>
          </motion.li>
        ))}
      </ul>

      {/* Info Note */}
      <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <p className="text-blue-300 text-sm">
          These explanations are generated based on patterns the model learned during training. 
          Always consider domain context when interpreting results.
        </p>
      </div>
    </motion.div>
  )
}
