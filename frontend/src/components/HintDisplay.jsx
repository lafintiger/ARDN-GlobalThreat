/**
 * Hint Display Component
 * Shows hints to players when GM triggers them
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './HintDisplay.css'

function HintDisplay({ hint, onDismiss }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (hint) {
      setVisible(true)
      // Auto-dismiss after 15 seconds
      const timer = setTimeout(() => {
        setVisible(false)
        onDismiss?.()
      }, 15000)
      return () => clearTimeout(timer)
    }
  }, [hint, onDismiss])

  return (
    <AnimatePresence>
      {visible && hint && (
        <motion.div 
          className="hint-display"
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <div className="hint-glow" />
          <div className="hint-content">
            <div className="hint-icon">💡</div>
            <div className="hint-body">
              <span className="hint-label">INTELLIGENCE INTERCEPT</span>
              <p className="hint-text">{hint}</p>
            </div>
            <button 
              className="hint-dismiss"
              onClick={() => {
                setVisible(false)
                onDismiss?.()
              }}
            >
              ✕
            </button>
          </div>
          <div className="hint-scanline" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default HintDisplay

