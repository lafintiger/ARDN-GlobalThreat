import { motion } from 'framer-motion'
import './GlobalStatus.css'

// Format seconds into MM:SS or HH:MM:SS
function formatTime(totalSeconds) {
  if (totalSeconds <= 0) return '00:00'
  
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function GlobalStatus({ 
  threatLevel, 
  gameActive, 
  etaCollapseSeconds = 0,
  timeRemainingSeconds = 0,
  elapsedSeconds = 0,
  sessionDurationMinutes = 60
}) {
  const getThreatColor = () => {
    if (threatLevel >= 75) return '#ff2a2a'
    if (threatLevel >= 50) return '#ff6b2b'
    if (threatLevel >= 25) return '#ffcc00'
    return '#39ff14'
  }
  
  const getThreatLabel = () => {
    if (threatLevel >= 90) return 'CRITICAL'
    if (threatLevel >= 75) return 'SEVERE'
    if (threatLevel >= 50) return 'HIGH'
    if (threatLevel >= 25) return 'ELEVATED'
    return 'GUARDED'
  }
  
  const color = getThreatColor()
  const etaColor = etaCollapseSeconds < 300 ? '#ff2a2a' : etaCollapseSeconds < 600 ? '#ff6b2b' : '#0ff'
  
  return (
    <div className="global-status">
      <div className="threat-meter">
        <div className="meter-label">
          <span>GLOBAL THREAT LEVEL</span>
          <motion.span 
            className="threat-label"
            style={{ color }}
            animate={{ opacity: threatLevel >= 75 ? [1, 0.5, 1] : 1 }}
            transition={{ duration: 0.5, repeat: threatLevel >= 75 ? Infinity : 0 }}
          >
            {getThreatLabel()}
          </motion.span>
        </div>
        
        <div className="meter-bar">
          <motion.div 
            className="meter-fill"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${threatLevel}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          <div className="meter-segments">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="segment" />
            ))}
          </div>
        </div>
        
        <div className="meter-value">
          <motion.span
            key={threatLevel}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ color }}
          >
            {threatLevel.toFixed(1)}%
          </motion.span>
        </div>
      </div>
      
      <div className={`game-status ${gameActive ? 'active' : 'inactive'}`}>
        <div className="status-indicator" />
        <span>{gameActive ? 'ATTACK IN PROGRESS' : 'STANDBY'}</span>
      </div>
      
      {/* ETA and Timer Display */}
      {gameActive && (
        <motion.div 
          className="eta-display"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <div className="eta-item">
            <span className="eta-label">ETA COLLAPSE</span>
            <motion.span 
              className="eta-value"
              style={{ color: etaColor }}
              animate={{ 
                opacity: etaCollapseSeconds < 300 ? [1, 0.3, 1] : 1,
                scale: etaCollapseSeconds < 120 ? [1, 1.05, 1] : 1
              }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              {formatTime(etaCollapseSeconds)}
            </motion.span>
          </div>
          <div className="eta-divider">|</div>
          <div className="eta-item">
            <span className="eta-label">SESSION</span>
            <span className="eta-value session">
              {formatTime(elapsedSeconds)} / {sessionDurationMinutes}:00
            </span>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default GlobalStatus
