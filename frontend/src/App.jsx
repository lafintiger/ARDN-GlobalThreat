import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DomainCard from './components/DomainCard'
import AttackTerminal from './components/AttackTerminal'
import AIChat from './components/AIChat'
import PasswordEntry from './components/PasswordEntry'
import GlobalStatus from './components/GlobalStatus'
import WorldMap from './components/WorldMap'
import ARDNTaunts from './components/ARDNTaunts'
import AtmosphereEffects from './components/AtmosphereEffects'
import GameEndScreen from './components/GameEndScreen'
import SoundControl from './components/SoundControl'
import HintDisplay from './components/HintDisplay'
import MusicPlayer from './components/MusicPlayer'
import ComfyUIDisplay from './components/ComfyUIDisplay'
import { useWebSocket } from './hooks/useWebSocket'
import { useSoundSystem } from './hooks/useSoundSystem'
import { WS_STATE } from './config'

function App() {
  const [gameState, setGameState] = useState(null)
  const [selectedDomain, setSelectedDomain] = useState(null)
  const [passwordResult, setPasswordResult] = useState(null)
  const [showAdmin, setShowAdmin] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'map'
  const [lastEvent, setLastEvent] = useState(null)
  const [showGameEnd, setShowGameEnd] = useState(false)
  const [gameEndVictory, setGameEndVictory] = useState(false)
  const [gameStats, setGameStats] = useState(null)
  const [currentHint, setCurrentHint] = useState(null)
  const [voiceEnabled, setVoiceEnabled] = useState(true) // TTS voice toggle
  const [musicExpanded, setMusicExpanded] = useState(false) // Music player toggle
  const [comfyImage, setComfyImage] = useState(null) // ComfyUI generated image
  const prevThreatLevel = useRef(0)
  
  const { sendMessage, lastMessage, connectionStatus } = useWebSocket(WS_STATE)
  
  // Sound system
  const {
    isEnabled: soundEnabled,
    volume,
    toggleSound,
    setMasterVolume,
    playAmbient,
    stopAmbient,
    playAlarm,
    stopAlarm,
    playHeartbeat,
    stopHeartbeat,
    playCritical,
    playSuccess,
    playFailure,
    playSecure,
    playGlitch,
    playCountdown,
    stopAll,
    initSound
  } = useSoundSystem()
  
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'state_update') {
        setGameState(lastMessage.data)
      } else if (lastMessage.type === 'password_result') {
        setPasswordResult(lastMessage.data)
        if (lastMessage.data.success) {
          playSuccess()
          setLastEvent({ type: 'password_correct' })
        } else {
          playFailure()
          setLastEvent({ type: 'password_wrong' })
        }
        setTimeout(() => setPasswordResult(null), 5000)
      } else if (lastMessage.type === 'mission_complete') {
        playSuccess()
        setLastEvent({ type: 'mission_complete', data: lastMessage.data })
      } else if (lastMessage.type === 'mission_failed') {
        playFailure()
        setLastEvent({ type: 'mission_failed', data: lastMessage.data })
      } else if (lastMessage.type === 'hint') {
        // GM sent a hint
        setCurrentHint(lastMessage.data?.message)
        playSuccess() // Play a pleasant sound
      } else if (lastMessage.type === 'comfyui_image') {
        // ComfyUI generated image
        setComfyImage(lastMessage.data?.image)
      }
    }
  }, [lastMessage, playSuccess, playFailure])
  
  // Track previous game active state
  const prevGameActive = useRef(false)
  
  // Sound effects based on threat level
  useEffect(() => {
    if (!gameState) return
    
    const threat = gameState.global_threat_level
    const wasActive = prevGameActive.current
    const isActive = gameState.game_active
    
    // Start/stop ambient based on game state
    if (isActive && !wasActive) {
      // Game just started - play ambient
      playAmbient()
    } else if (!isActive && wasActive) {
      // Game stopped
      stopAll()
    } else if (isActive && wasActive) {
      // Game is running - ensure ambient is playing
      playAmbient()
    }
    
    // Update previous state
    prevGameActive.current = isActive
    
    // Alarm at high threat
    if (threat >= 75 && prevThreatLevel.current < 75 && isActive) {
      playAlarm()
      playCritical()
    } else if (threat < 70) {
      stopAlarm()
    }
    
    // Heartbeat when time is low
    const eta = gameState.eta_collapse_seconds || 0
    if (eta > 0 && eta <= 300 && isActive) {
      playHeartbeat()
    } else if (eta > 300 || !isActive) {
      stopHeartbeat()
    }
    
    // Countdown beeps in final minute
    if (eta <= 60 && eta > 0 && eta % 10 === 0 && isActive) {
      playCountdown()
    }
    
    // Check for sector status changes
    if (gameState.domains && prevThreatLevel.current > 0) {
      const securedCount = Object.values(gameState.domains).filter(d => d.is_secured).length
      const compromisedCount = Object.values(gameState.domains).filter(d => d.compromise_percent >= 100).length
      
      // Detect new secured sector
      if (securedCount > 0) {
        // Could track previous count, but for now just let mission events handle it
      }
      
      // Random glitch sounds at higher threat
      if (threat >= 50 && Math.random() < 0.1) {
        playGlitch()
      }
    }
    
    // Game end detection
    if (isActive) {
      const allSecured = Object.values(gameState.domains).every(d => d.is_secured)
      const allCompromised = Object.values(gameState.domains).every(d => d.compromise_percent >= 100)
      
      if (allSecured) {
        // Victory!
        setGameEndVictory(true)
        setGameStats({
          sectorsSecured: 12,
          totalSectors: 12,
          missionsCompleted: 0, // Would need to track this
          totalMissions: 12,
          timeElapsed: gameState.elapsed_seconds || 0,
          finalThreatLevel: threat,
          passwordsUsed: 0
        })
        setShowGameEnd(true)
        stopAll()
      } else if (allCompromised || (eta <= 0 && threat >= 100)) {
        // Defeat
        setGameEndVictory(false)
        setGameStats({
          sectorsSecured: Object.values(gameState.domains).filter(d => d.is_secured).length,
          totalSectors: 12,
          missionsCompleted: 0,
          totalMissions: 12,
          timeElapsed: gameState.elapsed_seconds || 0,
          finalThreatLevel: threat,
          passwordsUsed: 0
        })
        setShowGameEnd(true)
        stopAll()
      }
    }
    
    prevThreatLevel.current = threat
  }, [gameState, playAmbient, stopAll, playAlarm, stopAlarm, playHeartbeat, stopHeartbeat, playCritical, playCountdown, playGlitch])
  
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
  const adjustScore = (amount) => fetch('http://localhost:8333/api/score/adjust', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount })
  })
  const triggerComfyUI = (eventType, context = '') => fetch(`http://localhost:8333/api/comfyui/generate/event/${eventType}?context=${encodeURIComponent(context)}`, {
    method: 'POST'
  }).catch(err => console.log('ComfyUI not available:', err))
  
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
          <SoundControl 
            isEnabled={soundEnabled}
            volume={volume}
            onToggle={toggleSound}
            onVolumeChange={setMasterVolume}
            onInitialize={initSound}
            voiceEnabled={voiceEnabled}
            onVoiceToggle={() => setVoiceEnabled(!voiceEnabled)}
          />
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
            
            {/* Score Control */}
            <div className="admin-section score-section">
              <span className="admin-label">TEAM SCORE</span>
              <div className="score-controls">
                <button 
                  className="btn-score btn-minus"
                  onClick={() => adjustScore(-1)}
                >
                  −1
                </button>
                <span className="score-display">{gameState?.score || 0}</span>
                <button 
                  className="btn-score btn-plus"
                  onClick={() => adjustScore(1)}
                >
                  +1
                </button>
              </div>
            </div>
            
            {/* ComfyUI Trigger */}
            <div className="admin-section">
              <span className="admin-label">AI VISION (ComfyUI)</span>
              <div className="comfy-buttons">
                <button 
                  className="btn-comfy"
                  onClick={() => triggerComfyUI('taunt')}
                >
                  👁 TAUNT
                </button>
                <button 
                  className="btn-comfy"
                  onClick={() => triggerComfyUI('high_threat')}
                >
                  ⚠ THREAT
                </button>
                <button 
                  className="btn-comfy"
                  onClick={() => triggerComfyUI('sector_fall', 'critical infrastructure')}
                >
                  💀 DESTRUCTION
                </button>
              </div>
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
      
      {/* Atmosphere Effects */}
      <AtmosphereEffects 
        threatLevel={gameState?.global_threat_level || 0}
        gameActive={gameState?.game_active || false}
        etaSeconds={gameState?.eta_collapse_seconds || 0}
      />
      
      {/* ARDN Taunts */}
      <ARDNTaunts 
        threatLevel={gameState?.global_threat_level || 0}
        gameActive={gameState?.game_active || false}
        lastEvent={lastEvent}
        etaSeconds={gameState?.eta_collapse_seconds || 0}
        voiceEnabled={voiceEnabled}
      />
      
      {/* Game End Screen */}
      <GameEndScreen 
        show={showGameEnd}
        victory={gameEndVictory}
        stats={gameStats}
        onClose={() => {
          setShowGameEnd(false)
          resetGame()
        }}
      />
      
      {/* Hint Display */}
      <HintDisplay 
        hint={currentHint}
        onDismiss={() => setCurrentHint(null)}
      />
      
      {/* Music Player */}
      <MusicPlayer 
        isExpanded={musicExpanded}
        onToggle={() => setMusicExpanded(!musicExpanded)}
      />
      
      {/* ComfyUI Image Display */}
      <ComfyUIDisplay 
        imageData={comfyImage}
        onComplete={() => setComfyImage(null)}
      />
    </div>
  )
}

export default App

