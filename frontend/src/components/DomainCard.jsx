import { motion } from 'framer-motion'
import './DomainCard.css'

const DOMAIN_ICONS = {
  financial: '💰',
  telecom: '📡',
  power: '⚡',
  water: '💧',
  transport: '🚆',
  healthcare: '🏥',
  government: '🛡️',
  emergency: '🚨',
  satellite: '🛰️',
  supply: '📦',
  media: '📺',
  nuclear: '☢️'
}

function DomainCard({ domain, index, isSelected, onClick }) {
  const getStatusColor = () => {
    switch (domain.status) {
      case 'COMPROMISED': return '#ff2a2a'
      case 'CRITICAL': return '#ff0055'
      case 'ATTACKING': return '#ff6b2b'
      case 'BREACHING': return '#ffcc00'
      default: return '#00f0ff'
    }
  }
  
  const statusColor = getStatusColor()
  const isHighThreat = domain.compromise_percent >= 75
  
  return (
    <motion.div
      className={`domain-card ${isSelected ? 'selected' : ''} ${domain.status.toLowerCase()}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{ '--status-color': statusColor }}
    >
      {/* Glowing border effect for high threat */}
      {isHighThreat && (
        <motion.div 
          className="threat-glow"
          animate={{ 
            opacity: [0.3, 0.8, 0.3],
            boxShadow: [
              `0 0 10px ${statusColor}`,
              `0 0 30px ${statusColor}`,
              `0 0 10px ${statusColor}`
            ]
          }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
      
      <div className="card-header">
        <span className="domain-icon">{DOMAIN_ICONS[domain.id] || '🔒'}</span>
        <motion.span 
          className="domain-status"
          animate={isHighThreat ? { opacity: [1, 0.5, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          {domain.status}
        </motion.span>
      </div>
      
      <h3 className="domain-name">{domain.name}</h3>
      
      <div className="progress-container">
        <div className="progress-bar">
          <motion.div 
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${domain.compromise_percent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ backgroundColor: statusColor }}
          />
          {/* Animated pulse on the progress bar edge */}
          <motion.div 
            className="progress-pulse"
            style={{ 
              left: `${domain.compromise_percent}%`,
              backgroundColor: statusColor
            }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [1, 1.5, 1]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
        <div className="progress-labels">
          <span>0%</span>
          <motion.span 
            className="progress-value"
            key={domain.compromise_percent}
            initial={{ scale: 1.2, color: '#fff' }}
            animate={{ scale: 1, color: statusColor }}
            style={{ color: statusColor }}
          >
            {domain.compromise_percent.toFixed(1)}%
          </motion.span>
          <span>100%</span>
        </div>
      </div>
      
      {/* Attack activity indicator */}
      <div className="activity-indicator">
        {domain.status !== 'SCANNING' && (
          <motion.div 
            className="activity-dots"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity, staggerChildren: 0.2 }}
          >
            <span>●</span>
            <span>●</span>
            <span>●</span>
          </motion.div>
        )}
        <span className="activity-text">
          {domain.status === 'COMPROMISED' ? 'UNDER ARDN CONTROL' : 'ATTACK IN PROGRESS'}
        </span>
      </div>
    </motion.div>
  )
}

export default DomainCard




