import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import './AdminPage.css'

const API_BASE = 'http://localhost:8333'

function AdminPage() {
  const [gameState, setGameState] = useState(null)
  const [missions, setMissions] = useState([])
  const [eventLog, setEventLog] = useState([])
  const [sessionMinutes, setSessionMinutes] = useState(60)
  const [notification, setNotification] = useState(null)

  // Override global overflow:hidden for this page
  useEffect(() => {
    document.body.style.overflow = 'auto'
    document.body.style.height = 'auto'
    document.documentElement.style.overflow = 'auto'
    document.documentElement.style.height = 'auto'
    const root = document.getElementById('root')
    if (root) {
      root.style.overflow = 'auto'
      root.style.height = 'auto'
    }
    
    return () => {
      // Reset when leaving admin page
      document.body.style.overflow = ''
      document.body.style.height = ''
      document.documentElement.style.overflow = ''
      document.documentElement.style.height = ''
      if (root) {
        root.style.overflow = ''
        root.style.height = ''
      }
    }
  }, [])

  // Fetch game state
  useEffect(() => {
    const fetchState = async () => {
      try {
        const [stateRes, missionsRes] = await Promise.all([
          fetch(`${API_BASE}/api/state`),
          fetch(`${API_BASE}/api/missions`)
        ])
        const state = await stateRes.json()
        const missionsData = await missionsRes.json()
        setGameState(state)
        setMissions(missionsData.missions || [])
        setEventLog(missionsData.event_log || [])
        setSessionMinutes(state.session_duration_minutes || 60)
      } catch (err) {
        console.error('Failed to fetch state:', err)
      }
    }
    
    fetchState()
    const interval = setInterval(fetchState, 2000)
    return () => clearInterval(interval)
  }, [])

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  // Game controls
  const startGame = async () => {
    await fetch(`${API_BASE}/api/game/start`, { method: 'POST' })
    showNotification('Attack simulation started')
  }
  
  const stopGame = async () => {
    await fetch(`${API_BASE}/api/game/stop`, { method: 'POST' })
    showNotification('Attack simulation stopped')
  }
  
  const resetGame = async () => {
    if (confirm('Reset all game state and missions?')) {
      await fetch(`${API_BASE}/api/game/reset`, { method: 'POST' })
      showNotification('Game reset complete')
    }
  }

  const setDuration = async (minutes) => {
    await fetch(`${API_BASE}/api/game/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration_minutes: minutes })
    })
    setSessionMinutes(minutes)
    showNotification(`Session duration set to ${minutes} minutes`)
  }

  // Sector controls
  const adjustSector = async (sectorId, adjustment, lock = false) => {
    const res = await fetch(`${API_BASE}/api/sector/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sector_id: sectorId, adjustment, lock })
    })
    const result = await res.json()
    if (result.success) {
      showNotification(`${sectorId}: ${adjustment > 0 ? '+' : ''}${adjustment}%`)
    }
  }

  const secureSector = async (sectorId) => {
    const res = await fetch(`${API_BASE}/api/sector/secure/${sectorId}`, {
      method: 'POST'
    })
    const result = await res.json()
    if (result.success) {
      showNotification(`${sectorId} fully secured!`, 'success')
    }
  }

  const lockSector = async (sectorId, lock) => {
    await fetch(`${API_BASE}/api/sector/lock/${sectorId}?lock=${lock}`, {
      method: 'POST'
    })
    showNotification(`${sectorId} ${lock ? 'locked' : 'unlocked'}`)
  }

  // Mission controls
  const completeMission = async (missionId) => {
    const res = await fetch(`${API_BASE}/api/mission/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mission_id: missionId })
    })
    const result = await res.json()
    if (result.success) {
      showNotification(`Mission completed: -${result.reduction}%`, 'success')
    } else {
      showNotification(result.message, 'error')
    }
  }

  const failMission = async (missionId) => {
    const res = await fetch(`${API_BASE}/api/mission/failed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mission_id: missionId })
    })
    const result = await res.json()
    if (result.success) {
      showNotification(`Mission failed: +${result.penalty}% penalty`, 'error')
    } else {
      showNotification(result.message, 'error')
    }
  }

  const resetMission = async (missionId) => {
    await fetch(`${API_BASE}/api/mission/reset/${missionId}`, { method: 'POST' })
    showNotification(`Mission reset: ${missionId}`)
  }

  if (!gameState) {
    return <div className="admin-loading">Loading Admin Panel...</div>
  }

  const domains = Object.values(gameState.domains)

  return (
    <div className="admin-page">
      {/* Notification */}
      {notification && (
        <motion.div 
          className={`admin-notification ${notification.type}`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          {notification.message}
        </motion.div>
      )}

      {/* Header */}
      <header className="admin-header">
        <div className="admin-title">
          <h1>🔧 A.R.D.N. GAME MASTER</h1>
          <Link to="/" className="back-link">← Back to Main Display</Link>
        </div>
        <div className="admin-status">
          <span className={`status-badge ${gameState.game_active ? 'active' : 'inactive'}`}>
            {gameState.game_active ? '⚡ ATTACK ACTIVE' : '⏸ STANDBY'}
          </span>
          <span className="threat-level">
            THREAT: <strong style={{ color: gameState.global_threat_level > 50 ? '#ff3333' : '#0f0' }}>
              {gameState.global_threat_level.toFixed(1)}%
            </strong>
          </span>
        </div>
      </header>

      <div className="admin-content">
        {/* Game Controls Panel */}
        <section className="admin-panel game-controls">
          <h2>⏱ Game Controls</h2>
          <div className="control-group">
            <button onClick={startGame} className="btn btn-start">▶ START</button>
            <button onClick={stopGame} className="btn btn-stop">⏹ STOP</button>
            <button onClick={resetGame} className="btn btn-reset">↻ RESET ALL</button>
          </div>
          <div className="control-group">
            <label>Session Duration:</label>
            <div className="duration-buttons">
              {[30, 40, 60, 90, 120].map(min => (
                <button 
                  key={min}
                  onClick={() => setDuration(min)}
                  className={`btn btn-duration ${sessionMinutes === min ? 'active' : ''}`}
                >
                  {min}m
                </button>
              ))}
            </div>
            <input 
              type="number" 
              value={sessionMinutes}
              onChange={(e) => setSessionMinutes(parseInt(e.target.value) || 60)}
              onBlur={() => setDuration(sessionMinutes)}
              className="duration-input"
              min="10"
              max="180"
            />
          </div>
        </section>

        {/* Sector Control Panel */}
        <section className="admin-panel sectors-panel">
          <h2>🎯 Sector Control</h2>
          <div className="sectors-grid">
            {domains.map(domain => (
              <div 
                key={domain.id} 
                className={`sector-card ${domain.is_secured ? 'secured' : ''} ${domain.is_locked ? 'locked' : ''}`}
              >
                <div className="sector-header">
                  <span className="sector-icon">{domain.icon}</span>
                  <span className="sector-name">{domain.name}</span>
                  <span className={`sector-status ${domain.status.toLowerCase()}`}>
                    {domain.status}
                  </span>
                </div>
                <div className="sector-percent">
                  <div 
                    className="percent-bar"
                    style={{ 
                      width: `${domain.compromise_percent}%`,
                      background: domain.compromise_percent > 75 ? '#ff3333' : 
                                 domain.compromise_percent > 50 ? '#ff6600' :
                                 domain.compromise_percent > 25 ? '#ffcc00' : '#00ff88'
                    }}
                  />
                  <span>{domain.compromise_percent.toFixed(1)}%</span>
                </div>
                <div className="sector-controls">
                  <button onClick={() => adjustSector(domain.id, -10)} className="btn btn-sm btn-reduce">-10%</button>
                  <button onClick={() => adjustSector(domain.id, -25)} className="btn btn-sm btn-reduce">-25%</button>
                  <button onClick={() => adjustSector(domain.id, -50)} className="btn btn-sm btn-reduce">-50%</button>
                  <button onClick={() => secureSector(domain.id)} className="btn btn-sm btn-secure">SECURE</button>
                </div>
                <div className="sector-controls">
                  <button onClick={() => adjustSector(domain.id, 10)} className="btn btn-sm btn-increase">+10%</button>
                  <button onClick={() => adjustSector(domain.id, 25)} className="btn btn-sm btn-increase">+25%</button>
                  <button 
                    onClick={() => lockSector(domain.id, !domain.is_locked)} 
                    className={`btn btn-sm ${domain.is_locked ? 'btn-unlock' : 'btn-lock'}`}
                  >
                    {domain.is_locked ? '🔓 UNLOCK' : '🔒 LOCK'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="global-controls">
            <button onClick={() => fetch(`${API_BASE}/api/sector/adjust-all`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ adjustment: -10 })
            }).then(() => showNotification('All sectors: -10%'))} className="btn btn-global">
              ALL SECTORS -10%
            </button>
            <button onClick={() => fetch(`${API_BASE}/api/sector/adjust-all`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ adjustment: -25 })
            }).then(() => showNotification('All sectors: -25%'))} className="btn btn-global">
              ALL SECTORS -25%
            </button>
          </div>
        </section>

        {/* Missions Panel */}
        <section className="admin-panel missions-panel">
          <h2>📋 Missions</h2>
          <div className="missions-list">
            {missions.map(mission => (
              <div 
                key={mission.id} 
                className={`mission-card ${mission.status}`}
              >
                <div className="mission-header">
                  <span className="mission-name">{mission.name}</span>
                  <span className={`mission-status ${mission.status}`}>
                    {mission.status.toUpperCase()}
                  </span>
                </div>
                <div className="mission-details">
                  <span className="mission-type">
                    {mission.adjustment_type === 'all' ? '🌐 ALL' : 
                     mission.adjustment_type === 'multiple' ? '📦 MULTI' : '🎯 ' + (mission.target_sector || '')}
                  </span>
                  <span className="mission-reward">✓ -{mission.success_reduction}%</span>
                  <span className="mission-penalty">✗ +{mission.failure_penalty}%</span>
                  {mission.lock_on_complete && <span className="mission-lock">🔒</span>}
                </div>
                <div className="mission-controls">
                  <button 
                    onClick={() => completeMission(mission.id)} 
                    className="btn btn-sm btn-complete"
                    disabled={mission.status === 'completed'}
                  >
                    ✓ COMPLETE
                  </button>
                  <button 
                    onClick={() => failMission(mission.id)} 
                    className="btn btn-sm btn-fail"
                    disabled={mission.status === 'completed'}
                  >
                    ✗ FAIL
                  </button>
                  <button 
                    onClick={() => resetMission(mission.id)} 
                    className="btn btn-sm btn-reset-mission"
                  >
                    ↻ RESET
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Event Log Panel */}
        <section className="admin-panel log-panel">
          <h2>📜 Event Log</h2>
          <div className="event-log">
            {eventLog.slice().reverse().map((event, idx) => (
              <div key={idx} className={`log-entry ${event.event_type}`}>
                <span className="log-time">{event.time_str}</span>
                <span className="log-type">{event.event_type}</span>
                <span className="log-details">
                  {JSON.stringify(event.details).slice(0, 80)}
                </span>
              </div>
            ))}
            {eventLog.length === 0 && (
              <div className="log-empty">No events yet</div>
            )}
          </div>
        </section>

        {/* API Reference Panel */}
        <section className="admin-panel api-panel">
          <h2>🔌 API Endpoints (for external triggers)</h2>
          <div className="api-list">
            <div className="api-item">
              <code>POST /api/mission/complete</code>
              <span>Body: {`{"mission_id": "firewall_breach"}`}</span>
            </div>
            <div className="api-item">
              <code>POST /api/mission/failed</code>
              <span>Body: {`{"mission_id": "firewall_breach"}`}</span>
            </div>
            <div className="api-item">
              <code>POST /api/sector/adjust</code>
              <span>Body: {`{"sector_id": "financial", "adjustment": -20, "lock": false}`}</span>
            </div>
            <div className="api-item">
              <code>POST /api/sector/secure/{'{sector_id}'}</code>
              <span>Fully secure a sector (0% + locked)</span>
            </div>
            <div className="api-item">
              <code>POST /api/sector/adjust-all</code>
              <span>Body: {`{"adjustment": -10}`}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default AdminPage

