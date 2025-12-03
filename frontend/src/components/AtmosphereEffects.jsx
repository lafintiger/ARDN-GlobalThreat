/**
 * Atmosphere Effects Component
 * Handles screen glitches, visual intensity, and warning overlays
 * Effects intensify with threat level
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './AtmosphereEffects.css'

function AtmosphereEffects({ 
  threatLevel = 0, 
  gameActive = false,
  etaSeconds = 0 
}) {
  const [glitchIntensity, setGlitchIntensity] = useState(0)
  const [showWarning, setShowWarning] = useState(false)
  const [warningType, setWarningType] = useState('') // 'critical', 'imminent', 'final'
  const [screenShake, setScreenShake] = useState(false)
  const [redOverlay, setRedOverlay] = useState(0)
  const [flickerActive, setFlickerActive] = useState(false)
  const glitchInterval = useRef(null)

  // Update visual intensity based on threat level
  useEffect(() => {
    if (!gameActive) {
      setGlitchIntensity(0)
      setRedOverlay(0)
      return
    }

    // Glitch intensity scales with threat
    const intensity = Math.min(1, threatLevel / 100)
    setGlitchIntensity(intensity)

    // Red overlay at high threat
    if (threatLevel >= 75) {
      setRedOverlay((threatLevel - 75) / 25 * 0.15) // 0-15% opacity
    } else {
      setRedOverlay(0)
    }
  }, [threatLevel, gameActive])

  // Random glitch bursts
  useEffect(() => {
    if (!gameActive || glitchIntensity < 0.2) {
      clearInterval(glitchInterval.current)
      return
    }

    // More frequent glitches at higher intensity
    const frequency = Math.max(2000, 10000 - glitchIntensity * 8000)
    
    glitchInterval.current = setInterval(() => {
      if (Math.random() < glitchIntensity) {
        setFlickerActive(true)
        setTimeout(() => setFlickerActive(false), 100 + Math.random() * 200)
      }
    }, frequency)

    return () => clearInterval(glitchInterval.current)
  }, [gameActive, glitchIntensity])

  // Warning overlays based on ETA
  useEffect(() => {
    if (!gameActive) {
      setShowWarning(false)
      return
    }

    if (etaSeconds <= 60 && etaSeconds > 0) {
      setWarningType('final')
      setShowWarning(true)
    } else if (etaSeconds <= 180 && etaSeconds > 60) {
      setWarningType('imminent')
      setShowWarning(true)
    } else if (threatLevel >= 80) {
      setWarningType('critical')
      setShowWarning(true)
    } else {
      setShowWarning(false)
    }
  }, [etaSeconds, threatLevel, gameActive])

  // Screen shake at critical moments
  useEffect(() => {
    if (threatLevel >= 90 && gameActive) {
      const shakeInterval = setInterval(() => {
        setScreenShake(true)
        setTimeout(() => setScreenShake(false), 100)
      }, 3000)
      return () => clearInterval(shakeInterval)
    }
  }, [threatLevel, gameActive])

  // Occasional screen flicker
  useEffect(() => {
    if (!gameActive) return

    const flickerChance = () => {
      if (Math.random() < glitchIntensity * 0.1) {
        setFlickerActive(true)
        setTimeout(() => setFlickerActive(false), 50 + Math.random() * 100)
      }
    }

    const interval = setInterval(flickerChance, 5000)
    return () => clearInterval(interval)
  }, [gameActive, glitchIntensity])

  return (
    <>
      {/* Glitch overlay */}
      <div 
        className={`atmosphere-glitch ${flickerActive ? 'flicker' : ''}`}
        style={{ 
          opacity: glitchIntensity * 0.3,
          '--glitch-intensity': glitchIntensity 
        }}
      />

      {/* Red danger overlay */}
      <div 
        className="atmosphere-danger-overlay"
        style={{ opacity: redOverlay }}
      />

      {/* Screen shake wrapper applied via CSS class on body */}
      {screenShake && <div className="screen-shake-trigger" />}

      {/* CRT scan line intensity */}
      <div 
        className="atmosphere-scanlines"
        style={{ opacity: 0.05 + glitchIntensity * 0.1 }}
      />

      {/* Vignette intensifies with threat */}
      <div 
        className="atmosphere-vignette"
        style={{ 
          '--vignette-intensity': 0.3 + glitchIntensity * 0.4 
        }}
      />

      {/* Warning overlays */}
      <AnimatePresence>
        {showWarning && (
          <motion.div 
            className={`warning-overlay warning-${warningType}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {warningType === 'final' && (
              <div className="warning-content final">
                <div className="warning-icon">⚠</div>
                <div className="warning-text">SYSTEM COLLAPSE IMMINENT</div>
                <div className="warning-countdown">{etaSeconds}s</div>
              </div>
            )}
            {warningType === 'imminent' && (
              <div className="warning-content imminent">
                <div className="warning-stripe" />
                <div className="warning-stripe" />
              </div>
            )}
            {warningType === 'critical' && (
              <div className="warning-content critical">
                <div className="warning-corner tl" />
                <div className="warning-corner tr" />
                <div className="warning-corner bl" />
                <div className="warning-corner br" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chromatic aberration effect at high threat */}
      {threatLevel >= 60 && gameActive && (
        <div 
          className="atmosphere-chromatic"
          style={{ 
            '--chromatic-offset': `${(threatLevel - 60) / 40 * 3}px` 
          }}
        />
      )}

      {/* Static noise overlay */}
      {threatLevel >= 70 && gameActive && (
        <div 
          className="atmosphere-static"
          style={{ opacity: (threatLevel - 70) / 30 * 0.05 }}
        />
      )}
    </>
  )
}

export default AtmosphereEffects



