import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { API_BASE } from '../config'
import './AdminPage.css'

function AdminPage() {
  const [gameState, setGameState] = useState(null)
  const [missions, setMissions] = useState([])
  const [eventLog, setEventLog] = useState([])
  const [sessionMinutes, setSessionMinutes] = useState(60)
  const [notification, setNotification] = useState(null)
  const [challenges, setChallenges] = useState([])
  const [challengeStats, setChallengeStats] = useState({ completed: 0, failed: 0 })
  const [activeChallenge, setActiveChallenge] = useState(null)
  const [chatSession, setChatSession] = useState(null)
  const [passwords, setPasswords] = useState({})
  const [newPassword, setNewPassword] = useState({ code: '', domain_id: '', reduction_percent: 15, hint: '' })
  const [hintText, setHintText] = useState('')

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
        const [stateRes, missionsRes, challengesRes, chatRes, passwordsRes] = await Promise.all([
          fetch(`${API_BASE}/api/state`),
          fetch(`${API_BASE}/api/missions`),
          fetch(`${API_BASE}/api/challenges`),
          fetch(`${API_BASE}/api/chat/session`),
          fetch(`${API_BASE}/api/passwords`)
        ])
        const state = await stateRes.json()
        const missionsData = await missionsRes.json()
        const challengesData = await challengesRes.json()
        const chatData = await chatRes.json()
        const passwordsData = await passwordsRes.json()
        
        setGameState(state)
        setMissions(missionsData.missions || [])
        setEventLog(missionsData.event_log || [])
        setSessionMinutes(state.session_duration_minutes || 60)
        setChallenges(challengesData.challenges || [])
        setChallengeStats(challengesData.stats || { completed: 0, failed: 0 })
        setActiveChallenge(challengesData.active_challenge)
        setChatSession(chatData)
        setPasswords(passwordsData || {})
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

  // Challenge controls
  const injectChallenge = async (challengeId) => {
    const res = await fetch(`${API_BASE}/api/challenge/inject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_id: challengeId })
    })
    const result = await res.json()
    if (result.success) {
      showNotification(`Challenge injected: ${challengeId}`, 'success')
    } else {
      showNotification(result.message, 'error')
    }
  }

  const verifyChallenge = async (isCorrect) => {
    const res = await fetch(`${API_BASE}/api/challenge/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_correct: isCorrect })
    })
    const result = await res.json()
    if (result.success !== undefined) {
      showNotification(
        isCorrect ? `Verified CORRECT: ${result.message}` : `Verified WRONG: ${result.message}`,
        isCorrect ? 'success' : 'error'
      )
    } else {
      showNotification(result.message, 'error')
    }
  }

  const resetChallenges = async () => {
    await fetch(`${API_BASE}/api/challenge/reset`, { method: 'POST' })
    showNotification('Challenges reset')
  }

  // Password controls
  const addPassword = async () => {
    if (!newPassword.code) {
      showNotification('Enter a password code', 'error')
      return
    }
    const res = await fetch(`${API_BASE}/api/password/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: newPassword.code.toUpperCase(),
        domain_id: newPassword.domain_id || null,
        reduction_percent: parseFloat(newPassword.reduction_percent) || 15,
        one_time: true,
        hint: newPassword.hint
      })
    })
    const result = await res.json()
    if (result.success) {
      showNotification(`Password "${newPassword.code}" added!`, 'success')
      setNewPassword({ code: '', domain_id: '', reduction_percent: 15, hint: '' })
    } else {
      showNotification(result.detail || 'Failed to add password', 'error')
    }
  }

  const deletePassword = async (code) => {
    await fetch(`${API_BASE}/api/password/${code}`, { method: 'DELETE' })
    showNotification(`Password "${code}" deleted`)
  }

  // Hint controls
  const sendHint = async () => {
    if (!hintText.trim()) {
      showNotification('Enter a hint message', 'error')
      return
    }
    await fetch(`${API_BASE}/api/hint/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: hintText })
    })
    showNotification('Hint sent to players!', 'success')
    setHintText('')
  }

  const quickHints = [
    "Check the power station for clues",
    "The answer involves network security",
    "Look for hidden codes in the room",
    "Try talking to A.R.D.N. - ask for a riddle",
    "One of the passwords contains 'OVERRIDE'",
  ]

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

        {/* Send Hints Panel */}
        <section className="admin-panel hints-panel">
          <h2>💡 Send Hint to Players</h2>
          <div className="hint-form">
            <input
              type="text"
              placeholder="Type a hint message..."
              value={hintText}
              onChange={(e) => setHintText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendHint()}
              className="hint-input"
            />
            <button onClick={sendHint} className="btn btn-global">
              📤 SEND HINT
            </button>
          </div>
          <div className="quick-hints">
            <span className="quick-label">Quick hints:</span>
            {quickHints.map((hint, i) => (
              <button 
                key={i}
                onClick={() => { setHintText(hint); }}
                className="btn btn-sm btn-duration"
              >
                {hint.slice(0, 25)}...
              </button>
            ))}
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

        {/* Chat Challenges Panel */}
        <section className="admin-panel challenges-panel">
          <h2>🧩 Chat Challenges</h2>
          <div className="challenge-stats">
            <span className="stat">✓ Completed: <strong>{challengeStats.completed}</strong></span>
            <span className="stat">✗ Failed: <strong>{challengeStats.failed}</strong></span>
            {chatSession?.challenge_active && (
              <span className="stat active">⏳ Challenge Active!</span>
            )}
          </div>
          
          {/* GM Override Controls */}
          {chatSession?.challenge_active && (
            <div className="gm-override">
              <h4>GM Override (Force Verify)</h4>
              <div className="override-buttons">
                <button 
                  onClick={() => verifyChallenge(true)} 
                  className="btn btn-complete"
                >
                  ✓ CORRECT - Give Reward
                </button>
                <button 
                  onClick={() => verifyChallenge(false)} 
                  className="btn btn-fail"
                >
                  ✗ WRONG - Apply Penalty
                </button>
              </div>
            </div>
          )}
          
          {/* Inject Challenge */}
          <div className="inject-challenge">
            <h4>Inject Challenge</h4>
            <div className="challenge-grid">
              {challenges.filter(c => !c.used).slice(0, 6).map(challenge => (
                <button
                  key={challenge.id}
                  onClick={() => injectChallenge(challenge.id)}
                  className={`challenge-inject-btn difficulty-${challenge.difficulty}`}
                  title={challenge.question}
                >
                  <span className="challenge-type">{challenge.type}</span>
                  <span className="challenge-difficulty">{challenge.difficulty}</span>
                  <span className="challenge-reward">
                    {challenge.reward_type === 'time_bonus' 
                      ? `+${challenge.reward_amount}s` 
                      : `-${challenge.reward_amount}%`}
                  </span>
                </button>
              ))}
            </div>
            <button onClick={resetChallenges} className="btn btn-reset-mission">
              ↻ Reset All Challenges
            </button>
          </div>
        </section>

        {/* Password Management Panel */}
        <section className="admin-panel passwords-panel">
          <h2>🔐 Security Codes</h2>
          
          {/* Add New Password */}
          <div className="add-password">
            <h4>Add New Code</h4>
            <div className="password-form">
              <input
                type="text"
                placeholder="CODE"
                value={newPassword.code}
                onChange={(e) => setNewPassword({...newPassword, code: e.target.value.toUpperCase()})}
                className="password-input code"
              />
              <select
                value={newPassword.domain_id}
                onChange={(e) => setNewPassword({...newPassword, domain_id: e.target.value})}
                className="password-input sector"
              >
                <option value="">All Sectors</option>
                {domains.map(d => (
                  <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="%"
                value={newPassword.reduction_percent}
                onChange={(e) => setNewPassword({...newPassword, reduction_percent: e.target.value})}
                className="password-input percent"
                min="1"
                max="100"
              />
              <input
                type="text"
                placeholder="Hint (optional)"
                value={newPassword.hint}
                onChange={(e) => setNewPassword({...newPassword, hint: e.target.value})}
                className="password-input hint"
              />
              <button onClick={addPassword} className="btn btn-complete">+ ADD</button>
            </div>
          </div>
          
          {/* Existing Passwords */}
          <div className="passwords-list">
            {Object.entries(passwords).map(([code, pw]) => (
              <div key={code} className={`password-card ${pw.used ? 'used' : ''}`}>
                <div className="password-code">{code}</div>
                <div className="password-info">
                  <span className="password-target">
                    {pw.domain_id ? `🎯 ${pw.domain_id}` : '🌐 ALL'}
                  </span>
                  <span className="password-reduction">-{pw.reduction_percent}%</span>
                  {pw.hint && <span className="password-hint" title={pw.hint}>💡</span>}
                  {pw.used && <span className="password-used">✓ USED</span>}
                </div>
                <button 
                  onClick={() => deletePassword(code)} 
                  className="btn btn-sm btn-fail"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
          
          {/* Quick Links */}
          <div className="password-links">
            <Link to="/gm-cheatsheet" target="_blank" className="btn btn-global">
              📋 Open GM Cheat Sheet
            </Link>
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

