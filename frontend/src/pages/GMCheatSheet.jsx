/**
 * GM Cheat Sheet - Printable reference for Game Masters
 * Contains all passwords, missions, challenges, and quick reference info
 */

import { useState, useEffect } from 'react'
import './GMCheatSheet.css'

const API_BASE = 'http://localhost:8333'

function GMCheatSheet() {
  const [passwords, setPasswords] = useState({})
  const [missions, setMissions] = useState([])
  const [challenges, setChallenges] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pwRes, missionsRes, challengesRes] = await Promise.all([
          fetch(`${API_BASE}/api/passwords`),
          fetch(`${API_BASE}/api/missions`),
          fetch(`${API_BASE}/api/challenges`)
        ])
        setPasswords(await pwRes.json())
        const mData = await missionsRes.json()
        setMissions(mData.missions || [])
        const cData = await challengesRes.json()
        setChallenges(cData.challenges || [])
      } catch (err) {
        console.error('Failed to fetch data:', err)
      }
    }
    fetchData()
  }, [])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="gm-cheatsheet">
      {/* Print Button */}
      <button className="print-btn no-print" onClick={handlePrint}>
        🖨️ PRINT THIS PAGE
      </button>

      {/* AI Chat Guide Link */}
      <a href="/ai-chat-guide" className="ai-guide-link no-print">
        🤖 AI Chat Guide →
      </a>

      {/* Header */}
      <header className="cheat-header">
        <h1>🎮 A.R.D.N. GAME MASTER CHEAT SHEET</h1>
        <p>Keep this handy during gameplay. Do NOT let players see this!</p>
      </header>

      {/* Quick Reference */}
      <section className="cheat-section">
        <h2>⚡ QUICK REFERENCE</h2>
        <div className="quick-ref">
          <div className="ref-item">
            <strong>Admin Panel:</strong> http://localhost:3333/admin
          </div>
          <div className="ref-item">
            <strong>Main Display:</strong> http://localhost:3333
          </div>
          <div className="ref-item">
            <strong>API Base:</strong> http://localhost:8333
          </div>
        </div>
      </section>

      {/* Security Codes */}
      <section className="cheat-section">
        <h2>🔐 SECURITY CODES (PASSWORDS)</h2>
        <p className="section-note">Players enter these at the bottom of the main screen</p>
        <table className="cheat-table">
          <thead>
            <tr>
              <th>CODE</th>
              <th>TARGET</th>
              <th>EFFECT</th>
              <th>HINT / LOCATION</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(passwords).map(([code, pw]) => (
              <tr key={code} className={pw.used ? 'used' : ''}>
                <td className="code-cell">{code}</td>
                <td>{pw.domain_id || 'ALL SECTORS'}</td>
                <td className="effect-cell">-{pw.reduction_percent}%</td>
                <td>{pw.hint || '(no hint)'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Missions */}
      <section className="cheat-section">
        <h2>📋 MISSIONS (Physical Puzzles)</h2>
        <p className="section-note">Mark complete/failed via Admin panel or API</p>
        <table className="cheat-table">
          <thead>
            <tr>
              <th>MISSION</th>
              <th>TARGET</th>
              <th>SUCCESS</th>
              <th>FAILURE</th>
              <th>NOTES</th>
            </tr>
          </thead>
          <tbody>
            {missions.map(m => (
              <tr key={m.id}>
                <td className="code-cell">{m.name}</td>
                <td>
                  {m.adjustment_type === 'all' ? 'ALL' : 
                   m.adjustment_type === 'multiple' ? m.target_sectors?.join(', ') : 
                   m.target_sector}
                </td>
                <td className="effect-cell success">-{m.success_reduction}%</td>
                <td className="effect-cell fail">+{m.failure_penalty}%</td>
                <td>{m.lock_on_complete ? '🔒 Locks sector' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Challenge Answers */}
      <section className="cheat-section">
        <h2>🧩 CHAT CHALLENGE ANSWERS</h2>
        <p className="section-note">When players ask ARDN for riddles - here are the answers!</p>
        <table className="cheat-table challenges">
          <thead>
            <tr>
              <th>TYPE</th>
              <th>QUESTION (Summary)</th>
              <th>ANSWER</th>
              <th>REWARD</th>
            </tr>
          </thead>
          <tbody>
            {challenges.map(c => (
              <tr key={c.id}>
                <td>{c.type}</td>
                <td className="question-cell">{c.question.slice(0, 60)}...</td>
                <td className="answer-cell">
                  {c.id.includes('echo') ? 'ECHO' :
                   c.id.includes('fire') ? 'FIRE' :
                   c.id.includes('map') ? 'MAP' :
                   c.id.includes('silence') || c.id.includes('footsteps') ? 'FOOTSTEPS' :
                   c.id.includes('tomorrow') ? 'TOMORROW' :
                   c.id.includes('darkness') || c.id.includes('joke') ? 'JOKE' :
                   c.id.includes('stamp') || c.id.includes('paradox') ? 'STAMP' :
                   c.id.includes('coin') || c.id.includes('hole') ? 'COIN' :
                   c.id.includes('virus') ? '1971' :
                   c.id.includes('turing') ? 'TURING TEST' :
                   c.id.includes('binary') ? 'HELP' :
                   c.id.includes('caesar') ? 'SECURITY' :
                   c.id.includes('doors') ? 'Ask other guard' :
                   c.id.includes('anagram') ? 'FIREWALL' :
                   c.id.includes('sequence') ? 'HTTPS' :
                   '(see full question)'}
                </td>
                <td className="effect-cell">
                  {c.reward_type === 'time_bonus' ? `+${c.reward_amount}s` : `-${c.reward_amount}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* API Quick Reference */}
      <section className="cheat-section">
        <h2>🔌 API COMMANDS (For Physical Puzzles)</h2>
        <p className="section-note">Use these with Raspberry Pi / Arduino triggers</p>
        <div className="api-commands">
          <div className="api-cmd">
            <code>POST /api/mission/complete</code>
            <span>{"{"}"mission_id": "firewall_breach"{"}"}</span>
          </div>
          <div className="api-cmd">
            <code>POST /api/mission/failed</code>
            <span>{"{"}"mission_id": "firewall_breach"{"}"}</span>
          </div>
          <div className="api-cmd">
            <code>POST /api/sector/adjust</code>
            <span>{"{"}"sector_id": "power", "adjustment": -20{"}"}</span>
          </div>
          <div className="api-cmd">
            <code>POST /api/sector/secure/nuclear</code>
            <span>Fully secure a sector (0% + locked)</span>
          </div>
          <div className="api-cmd">
            <code>POST /api/game/start</code>
            <span>Start the attack simulation</span>
          </div>
          <div className="api-cmd">
            <code>POST /api/game/stop</code>
            <span>Pause the attack</span>
          </div>
          <div className="api-cmd">
            <code>POST /api/game/reset</code>
            <span>Reset everything to start</span>
          </div>
        </div>
      </section>

      {/* Emergency Procedures */}
      <section className="cheat-section emergency">
        <h2>🚨 EMERGENCY PROCEDURES</h2>
        <div className="emergency-list">
          <div className="emergency-item">
            <strong>PLAYER STUCK:</strong> Use Admin panel to reduce sector or reveal hint
          </div>
          <div className="emergency-item">
            <strong>TECHNICAL ISSUE:</strong> Stop game, fix issue, restart
          </div>
          <div className="emergency-item">
            <strong>TIME RUNNING OUT:</strong> Inject easy challenge or give password hint
          </div>
          <div className="emergency-item">
            <strong>NEED INSTANT WIN:</strong> Secure all sectors via Admin panel
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="cheat-footer">
        <p>A.R.D.N. - Autonomous Rogue Digital Network</p>
        <p>🔴 GAME MASTER EYES ONLY 🔴</p>
      </footer>
    </div>
  )
}

export default GMCheatSheet


