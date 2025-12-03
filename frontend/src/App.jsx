import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DomainCard from './components/DomainCard'
import AttackTerminal from './components/AttackTerminal'
import AIChat from './components/AIChat'
import PasswordEntry from './components/PasswordEntry'
import GlobalStatus from './components/GlobalStatus'
import WorldMap from './components/WorldMap'
import { useWebSocket } from './hooks/useWebSocket'

function App() {
  const [gameState, setGameState] = useState(null)
  const [selectedDomain, setSelectedDomain] = useState(null)
  const [passwordResult, setPasswordResult] = useState(null)
  const [showAdmin, setShowAdmin] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'map'
  
  const { sendMessage, lastMessage, connectionStatus } = useWebSocket('ws://localhost:8333/ws/state')
  
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'state_update') {
        setGameState(lastMessage.data)
      } else if (lastMessage.type === 'password_result') {
        setPasswordResult(lastMessage.data)
        setTimeout(() => setPasswordResult(null), 5000)
      }
    }
  }, [lastMessage])
  
  // Fetch initial state
  useEffect(() => {
    fetch('http://localhost:8333/api/state')
      .then(res => res.json())
      .then(data => setGameState(data))
      .catch(err => console.error('Failed to fetch state:', err))
  }, [])
  
  const handlePasswordSubmit = (code) => {
    sendMessage({
      type: 'password_attempt',
      code: code
    })
  }
  
  const handleDomainClick = (domainId) => {
    setSelectedDomain(selectedDomain === domainId ? null : domainId)
  }
  
  // Admin controls
  const startGame = () => fetch('http://localhost:8333/api/game/start', { method: 'POST' })
  const stopGame = () => fetch('http://localhost:8333/api/game/stop', { method: 'POST' })
  const resetGame = () => fetch('http://localhost:8333/api/game/reset', { method: 'POST' })
  const setSessionDuration = (minutes) => fetch('http://localhost:8333/api/game/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ duration_minutes: minutes })
  })
  
  if (!gameState) {
    return (
      <div className="loading-screen">
        <motion.div 
          className="loading-logo"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="ardn-eye" />
        </motion.div>
        <motion.p
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          INITIALIZING A.R.D.N. INTERFACE...
        </motion.p>
      </div>
    )
  }
  
  const domains = Object.values(gameState.domains)
  
  return (
    <div className="app-container">
      {/* Background Effects */}
      <div className="bg-grid" />
      <div className="bg-scanline" />
      <div className="bg-vignette" />
      
      {/* Header */}
      <header className="main-header">
        <div className="header-left">
          <motion.div 
            className="ardn-logo"
            animate={{ 
              boxShadow: [
                '0 0 20px rgba(255, 42, 42, 0.5)',
                '0 0 40px rgba(255, 42, 42, 0.8)',
                '0 0 20px rgba(255, 42, 42, 0.5)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="ardn-eye" />
          </motion.div>
          <div className="header-title">
            <h1>A.R.D.N.</h1>
            <p>AUTONOMOUS ROGUE DIGITAL NETWORK</p>
          </div>
        </div>
        
        <GlobalStatus 
          threatLevel={gameState.global_threat_level}
          gameActive={gameState.game_active}
          etaCollapseSeconds={gameState.eta_collapse_seconds || 0}
          timeRemainingSeconds={gameState.time_remaining_seconds || 0}
          elapsedSeconds={gameState.elapsed_seconds || 0}
          sessionDurationMinutes={gameState.session_duration_minutes || 60}
        />
        
        <div className="header-right">
          <div className={`connection-status ${connectionStatus}`}>
            <span className="status-dot" />
            {connectionStatus.toUpperCase()}
          </div>
          <button 
            className="admin-toggle"
            onClick={() => setShowAdmin(!showAdmin)}
          >
            ⚙
          </button>
        </div>
      </header>
      
      {/* Admin Panel */}
      <AnimatePresence>
        {showAdmin && (
          <motion.div 
            className="admin-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <h3>GAME MASTER CONTROLS</h3>
            <div className="admin-section">
              <span className="admin-label">SESSION DURATION</span>
              <div className="session-buttons">
                {[30, 40, 60, 90].map(mins => (
                  <button 
                    key={mins}
                    onClick={() => setSessionDuration(mins)}
                    className={`btn-session ${gameState?.session_duration_minutes === mins ? 'active' : ''}`}
                  >
                    {mins} MIN
                  </button>
                ))}
                <div className="custom-time">
                  <input 
                    type="number" 
                    min="10" 
                    max="120" 
                    placeholder="Custom"
                    className="time-input"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const value = parseInt(e.target.value)
                        if (value >= 10 && value <= 120) {
                          setSessionDuration(value)
                          e.target.value = ''
                        }
                      }
                    }}
                  />
                  <span className="time-unit">MIN</span>
                </div>
              </div>
            </div>
            <div className="admin-buttons">
              <button onClick={startGame} className="btn-start">START ATTACK</button>
              <button onClick={stopGame} className="btn-stop">STOP ATTACK</button>
              <button onClick={resetGame} className="btn-reset">RESET GAME</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main Content */}
      <main className="main-content">
        {/* Domain Grid / World Map */}
        <section className="domains-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="title-icon">◈</span>
              CRITICAL INFRASTRUCTURE STATUS
              <span className="title-icon">◈</span>
            </h2>
            <div className="view-toggle">
              <button 
                className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <span className="toggle-icon">▦</span>
                GRID
              </button>
              <button 
                className={`toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
                onClick={() => setViewMode('map')}
              >
                <span className="toggle-icon">🌐</span>
                MAP
              </button>
            </div>
          </div>
          
          <AnimatePresence mode="wait">
            {viewMode === 'grid' ? (
              <motion.div 
                key="grid"
                className="domains-grid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {domains.map((domain, index) => (
                  <DomainCard
                    key={domain.id}
                    domain={domain}
                    index={index}
                    isSelected={selectedDomain === domain.id}
                    onClick={() => handleDomainClick(domain.id)}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="map"
                className="map-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <WorldMap 
                  domains={gameState.domains} 
                  activeDomain={selectedDomain}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
        
        {/* Bottom Section - Terminal and Chat */}
        <section className="bottom-section">
          <div className="terminal-container">
            <AttackTerminal 
              domainId={selectedDomain || 'financial'}
              domainName={
                selectedDomain 
                  ? gameState.domains[selectedDomain]?.name 
                  : 'Financial Systems'
              }
            />
          </div>
          
          <div className="chat-container">
            <AIChat />
          </div>
        </section>
      </main>
      
      {/* Password Entry */}
      <PasswordEntry 
        onSubmit={handlePasswordSubmit}
        result={passwordResult}
      />
      
      {/* Password Result Overlay */}
      <AnimatePresence>
        {passwordResult && (
          <motion.div 
            className={`password-overlay ${passwordResult.success ? 'success' : 'failure'}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <div className="overlay-content">
              <div className="overlay-icon">
                {passwordResult.success ? '✓' : '✕'}
              </div>
              <p>{passwordResult.message}</p>
              {passwordResult.success && passwordResult.affected_domains && (
                <div className="affected-list">
                  {passwordResult.affected_domains.map(d => (
                    <span key={d.id}>
                      {d.name}: {d.old_percent.toFixed(1)}% → {d.new_percent.toFixed(1)}%
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App

