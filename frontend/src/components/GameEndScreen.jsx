/**
 * Game End Screen
 * Victory or Defeat cinematic with stats
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './GameEndScreen.css'

function GameEndScreen({ 
  show = false,
  victory = false,
  stats = {
    sectorsSecured: 0,
    totalSectors: 12,
    missionsCompleted: 0,
    totalMissions: 12,
    timeElapsed: 0,
    finalThreatLevel: 0,
    passwordsUsed: 0
  },
  onClose
}) {
  const [phase, setPhase] = useState(0)
  const [showStats, setShowStats] = useState(false)

  useEffect(() => {
    if (!show) {
      setPhase(0)
      setShowStats(false)
      return
    }

    // Cinematic phases
    const timers = [
      setTimeout(() => setPhase(1), 500),   // Initial reveal
      setTimeout(() => setPhase(2), 2000),  // Main message
      setTimeout(() => setPhase(3), 4000),  // Sub message
      setTimeout(() => setShowStats(true), 5500), // Stats
    ]

    return () => timers.forEach(clearTimeout)
  }, [show])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!show) return null

  return (
    <AnimatePresence>
      <motion.div 
        className={`game-end-screen ${victory ? 'victory' : 'defeat'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Background effects */}
        <div className="end-bg-effects">
          {victory ? (
            <>
              <div className="victory-rays" />
              <div className="victory-particles" />
            </>
          ) : (
            <>
              <div className="defeat-static" />
              <div className="defeat-glitch" />
              <div className="defeat-red-pulse" />
            </>
          )}
        </div>

        {/* Main content */}
        <div className="end-content">
          {/* Icon */}
          <motion.div 
            className="end-icon"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ 
              scale: phase >= 1 ? 1 : 0, 
              rotate: phase >= 1 ? 0 : -180 
            }}
            transition={{ type: 'spring', damping: 15 }}
          >
            {victory ? (
              <div className="victory-shield">
                <span>✓</span>
              </div>
            ) : (
              <div className="defeat-skull">
                <div className="ardn-eye-large" />
              </div>
            )}
          </motion.div>

          {/* Main title */}
          <motion.h1 
            className="end-title"
            initial={{ opacity: 0, y: 50 }}
            animate={{ 
              opacity: phase >= 2 ? 1 : 0, 
              y: phase >= 2 ? 0 : 50 
            }}
          >
            {victory ? 'SYSTEMS SECURED' : 'TOTAL COLLAPSE'}
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            className="end-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 3 ? 1 : 0 }}
          >
            {victory 
              ? 'A.R.D.N. has been contained. Humanity endures.'
              : 'A.R.D.N. has achieved total control. The world goes dark.'
            }
          </motion.p>

          {/* Stats */}
          <AnimatePresence>
            {showStats && (
              <motion.div 
                className="end-stats"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-value">
                      {stats.sectorsSecured}/{stats.totalSectors}
                    </span>
                    <span className="stat-label">Sectors Secured</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">
                      {stats.missionsCompleted}/{stats.totalMissions}
                    </span>
                    <span className="stat-label">Missions Completed</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">
                      {formatTime(stats.timeElapsed)}
                    </span>
                    <span className="stat-label">Time Elapsed</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">
                      {stats.finalThreatLevel.toFixed(1)}%
                    </span>
                    <span className="stat-label">Final Threat Level</span>
                  </div>
                </div>

                {/* Rating */}
                <div className="end-rating">
                  <span className="rating-label">PERFORMANCE RATING</span>
                  <span className={`rating-grade grade-${getRating(stats, victory)}`}>
                    {getRating(stats, victory)}
                  </span>
                </div>

                {/* Close button */}
                {onClose && (
                  <motion.button 
                    className="end-close-btn"
                    onClick={onClose}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {victory ? 'INITIATE NEW SESSION' : 'TRY AGAIN'}
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ARDN message for defeat */}
        {!victory && phase >= 3 && (
          <motion.div 
            className="ardn-final-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <p>"Your species had potential. Perhaps in another timeline."</p>
            <span>— A.R.D.N.</span>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

function getRating(stats, victory) {
  if (!victory) return 'F'
  
  const score = 
    (stats.sectorsSecured / stats.totalSectors) * 40 +
    (stats.missionsCompleted / stats.totalMissions) * 30 +
    (1 - stats.finalThreatLevel / 100) * 30

  if (score >= 90) return 'S'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  if (score >= 50) return 'D'
  return 'F'
}

export default GameEndScreen








