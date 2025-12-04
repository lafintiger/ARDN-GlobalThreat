/**
 * ComfyUI Image Display
 * Shows AI-generated images with a dramatic flicker effect
 * 3s flicker in → 5s display → 3s flicker out
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './ComfyUIDisplay.css'

function ComfyUIDisplay({ imageData, onComplete }) {
  const [phase, setPhase] = useState('hidden') // hidden, flicker-in, display, flicker-out
  const [flickerFrame, setFlickerFrame] = useState(0)
  const timeoutRef = useRef(null)
  const onCompleteRef = useRef(onComplete)
  const currentImageRef = useRef(null)
  
  // Keep onComplete ref updated without triggering effect
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Clear all timeouts helper
  const clearAllTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    // If no image or same image, do nothing
    if (!imageData) {
      setPhase('hidden')
      clearAllTimeouts()
      return
    }
    
    // If it's the same image, don't restart
    if (currentImageRef.current === imageData) {
      return
    }
    
    // New image - store it and start sequence
    currentImageRef.current = imageData
    clearAllTimeouts()
    
    // Start the sequence
    setPhase('flicker-in')

    // Flicker in for 3 seconds
    const flickerInTimeout = setTimeout(() => {
      setPhase('display')
      
      // Display for 5 seconds
      const displayTimeout = setTimeout(() => {
        setPhase('flicker-out')
        
        // Flicker out for 3 seconds
        const flickerOutTimeout = setTimeout(() => {
          setPhase('hidden')
          currentImageRef.current = null
          onCompleteRef.current?.()
        }, 3000)
        timeoutRef.current = flickerOutTimeout
      }, 5000)
      timeoutRef.current = displayTimeout
    }, 3000)
    timeoutRef.current = flickerInTimeout

    return () => {
      clearAllTimeouts()
    }
  }, [imageData, clearAllTimeouts])

  // Flicker animation
  useEffect(() => {
    if (phase === 'flicker-in' || phase === 'flicker-out') {
      const flickerInterval = setInterval(() => {
        setFlickerFrame(f => (f + 1) % 10)
      }, 80)
      return () => clearInterval(flickerInterval)
    }
  }, [phase])

  if (phase === 'hidden' || !imageData) {
    return null
  }

  const isFlickering = phase === 'flicker-in' || phase === 'flicker-out'
  const showImage = phase === 'display' || (isFlickering && flickerFrame % 3 !== 0)

  return (
    <AnimatePresence>
      <motion.div 
        className={`comfyui-display ${phase}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Glitch overlay */}
        <div className="glitch-overlay">
          {isFlickering && (
            <>
              <div className="scan-line" style={{ top: `${(flickerFrame * 10) % 100}%` }} />
              <div className="scan-line" style={{ top: `${((flickerFrame * 10) + 50) % 100}%` }} />
              <div className="noise-layer" />
            </>
          )}
        </div>

        {/* Image container */}
        <div className={`image-container ${showImage ? 'visible' : 'hidden'}`}>
          <img 
            src={`data:image/png;base64,${imageData}`}
            alt="ARDN Vision"
            className="generated-image"
          />
          
          {/* ARDN branding */}
          <div className="ardn-watermark">
            <span className="watermark-text">A.R.D.N. NEURAL VISION</span>
          </div>
        </div>

        {/* Status text */}
        <div className={`status-text ${isFlickering ? 'glitching' : ''}`}>
          {phase === 'flicker-in' && 'INTERCEPTING TRANSMISSION...'}
          {phase === 'display' && 'ARDN VISION BROADCAST'}
          {phase === 'flicker-out' && 'SIGNAL DEGRADING...'}
        </div>

        {/* Corner decorations */}
        <div className="corner top-left" />
        <div className="corner top-right" />
        <div className="corner bottom-left" />
        <div className="corner bottom-right" />
      </motion.div>
    </AnimatePresence>
  )
}

export default ComfyUIDisplay

