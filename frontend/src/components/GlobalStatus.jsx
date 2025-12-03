import { motion } from 'framer-motion'
import './GlobalStatus.css'

function GlobalStatus({ threatLevel, gameActive }) {
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
    </div>
  )
}

export default GlobalStatus

