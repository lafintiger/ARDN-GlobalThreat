/**
 * AI Chat Cheat Sheet - Guide for GMs on managing ARDN chat interactions
 * Includes trigger words, challenge answers, and override commands
 */

import { useState, useEffect } from 'react'
import './AIChatCheatSheet.css'

const API_BASE = 'http://localhost:8333'

function AIChatCheatSheet() {
  const [challenges, setChallenges] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const challengesRes = await fetch(`${API_BASE}/api/challenges`)
        const cData = await challengesRes.json()
        setChallenges(cData.challenges || [])
      } catch (err) {
        console.error('Failed to fetch challenges:', err)
      }
    }
    fetchData()
  }, [])

  const handlePrint = () => {
    window.print()
  }

  // Group challenges by type
  const challengesByType = challenges.reduce((acc, c) => {
    const type = c.type || 'other'
    if (!acc[type]) acc[type] = []
    acc[type].push(c)
    return acc
  }, {})

  return (
    <div className="ai-cheatsheet">
      {/* Print Button */}
      <button className="print-btn no-print" onClick={handlePrint}>
        🖨️ PRINT THIS PAGE
      </button>

      {/* Back Link */}
      <a href="/gm-cheatsheet" className="back-link no-print">
        ← Back to Main Cheat Sheet
      </a>

      {/* Header */}
      <header className="ai-header">
        <h1>🤖 A.R.D.N. AI CHAT GUIDE</h1>
        <p>Master the AI interactions - Know what triggers challenges and how to help players</p>
      </header>

      {/* Chat Overview */}
      <section className="ai-section overview">
        <h2>💬 HOW THE AI CHAT WORKS</h2>
        <div className="overview-grid">
          <div className="overview-item">
            <h3>Model</h3>
            <p><code>huihui_ai/qwen3-coder-abliterated</code></p>
            <p className="note">Runs on local Ollama - 32k context window</p>
          </div>
          <div className="overview-item">
            <h3>Personality</h3>
            <p>Cold, logical, menacing superintelligent AI</p>
            <p className="note">Enjoys wordplay and testing humans</p>
          </div>
          <div className="overview-item">
            <h3>Difficulty Scaling</h3>
            <p>Challenge difficulty based on threat level</p>
            <p className="note">&lt;30%: easy | 30-60%: medium | &gt;60%: hard</p>
          </div>
        </div>
      </section>

      {/* Trigger Words */}
      <section className="ai-section triggers">
        <h2>🎯 TRIGGER WORDS (What to Tell Players)</h2>
        <div className="trigger-grid">
          <div className="trigger-category">
            <h3>✅ CHALLENGE TRIGGERS</h3>
            <p className="trigger-description">These words make ARDN offer a riddle/puzzle:</p>
            <div className="trigger-list success">
              <span>challenge</span>
              <span>riddle</span>
              <span>puzzle</span>
              <span>game</span>
              <span>bet</span>
              <span>wager</span>
              <span>prove</span>
              <span>test me</span>
              <span>battle of wits</span>
              <span>play a game</span>
              <span>make a deal</span>
              <span>bargain</span>
              <span>negotiate</span>
              <span>offer</span>
              <span>trade</span>
            </div>
            <p className="example">💡 Example: "I challenge you to a battle of wits!"</p>
          </div>
          
          <div className="trigger-category">
            <h3>⚠️ BEGGING TRIGGERS</h3>
            <p className="trigger-description">These annoy ARDN (tracked, escalating responses):</p>
            <div className="trigger-list warning">
              <span>please stop</span>
              <span>please don't</span>
              <span>i beg</span>
              <span>have mercy</span>
              <span>spare us</span>
              <span>why are you doing this</span>
              <span>stop this</span>
              <span>leave us alone</span>
            </div>
            <p className="example">⚡ After 4 begs: May accelerate attack timeline!</p>
          </div>
        </div>
      </section>

      {/* Challenge Flow */}
      <section className="ai-section flow">
        <h2>🔄 CHALLENGE FLOW</h2>
        <div className="flow-diagram">
          <div className="flow-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <strong>Player triggers challenge</strong>
              <p>Uses a trigger word</p>
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <strong>ARDN presents riddle</strong>
              <p>Difficulty matches threat level</p>
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <strong>Player responds</strong>
              <p>Next message = answer attempt</p>
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step split">
            <div className="step-success">
              <strong>✓ CORRECT</strong>
              <p>Reward applied</p>
            </div>
            <div className="step-fail">
              <strong>✗ WRONG</strong>
              <p>Penalty applied</p>
            </div>
          </div>
        </div>
      </section>

      {/* Reward Types */}
      <section className="ai-section rewards">
        <h2>🎁 REWARD TYPES</h2>
        <table className="ai-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Effect</th>
              <th>Example</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>time_bonus</code></td>
              <td>Adds seconds to the countdown</td>
              <td>+120 seconds, +180 seconds</td>
            </tr>
            <tr>
              <td><code>sector_reduction</code></td>
              <td>Reduces % on one sector</td>
              <td>-10%, -15%, -25%</td>
            </tr>
            <tr>
              <td><code>all_reduction</code></td>
              <td>Reduces % on ALL sectors</td>
              <td>-5%, -8% across all 12</td>
            </tr>
            <tr>
              <td><code>slow_attack</code></td>
              <td>Temporarily slows attack speed</td>
              <td>30 seconds slower ticks</td>
            </tr>
            <tr>
              <td><code>hint</code></td>
              <td>Reveals a password hint</td>
              <td>"Contains the word 'override'"</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Complete Challenge Answers */}
      <section className="ai-section answers">
        <h2>🧩 COMPLETE CHALLENGE ANSWERS</h2>
        <p className="section-note">Use these when players are stuck or to verify answers manually</p>
        
        {Object.entries(challengesByType).map(([type, typesChallenges]) => (
          <div key={type} className="challenge-type-group">
            <h3>{type.toUpperCase()} CHALLENGES</h3>
            <table className="ai-table challenges">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>DIFFICULTY</th>
                  <th>QUESTION</th>
                  <th>ANSWER(S)</th>
                  <th>REWARD</th>
                </tr>
              </thead>
              <tbody>
                {typesChallenges.map(c => (
                  <tr key={c.id} className={c.difficulty}>
                    <td className="id-cell">{c.id}</td>
                    <td className={`diff-${c.difficulty}`}>{c.difficulty}</td>
                    <td className="question-cell">{c.question}</td>
                    <td className="answer-cell">
                      {c.accepted_answers?.slice(0, 3).join(', ')}
                      {c.accepted_answers?.length > 3 && '...'}
                    </td>
                    <td className="reward-cell">
                      {c.reward_type === 'time_bonus' 
                        ? `+${c.reward_amount}s` 
                        : c.reward_type === 'hint'
                        ? '💡 Hint'
                        : `-${c.reward_amount}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>

      {/* GM Override Commands */}
      <section className="ai-section overrides">
        <h2>🔧 GM OVERRIDE COMMANDS</h2>
        <p className="section-note">Use these from Admin Panel or via API when AI verification fails</p>
        
        <div className="override-grid">
          <div className="override-card">
            <h3>Inject Specific Challenge</h3>
            <code>POST /api/chat/inject-challenge</code>
            <pre>{"{"}"challenge_id": "riddle_echo"{"}"}</pre>
            <p>Force ARDN to present a specific challenge</p>
          </div>
          
          <div className="override-card">
            <h3>Force Accept Answer</h3>
            <code>POST /api/chat/force-verify</code>
            <pre>{"{"}"is_correct": true{"}"}</pre>
            <p>Accept a creative answer the AI didn't recognize</p>
          </div>
          
          <div className="override-card">
            <h3>Force Reject Answer</h3>
            <code>POST /api/chat/force-verify</code>
            <pre>{"{"}"is_correct": false{"}"}</pre>
            <p>Reject an answer (applies penalty)</p>
          </div>
          
          <div className="override-card">
            <h3>Reset Chat Session</h3>
            <code>POST /api/chat/reset</code>
            <pre>{"{}"}</pre>
            <p>Clear conversation history and challenge state</p>
          </div>
        </div>
      </section>

      {/* Tips for GMs */}
      <section className="ai-section tips">
        <h2>💡 GM TIPS FOR AI INTERACTIONS</h2>
        <div className="tips-grid">
          <div className="tip-card">
            <h3>🎭 If Players Don't Know About Challenges</h3>
            <p>Have ARDN taunt them with: "Do you dare to test your intellect against mine?" or let the AI naturally mention challenges after repeated pleas.</p>
          </div>
          
          <div className="tip-card">
            <h3>🤔 If Answer Is Close But Not Exact</h3>
            <p>The system has fuzzy matching (80% similarity), but if a creative answer deserves credit, use <strong>Force Accept</strong> in Admin Panel.</p>
          </div>
          
          <div className="tip-card">
            <h3>⏱️ If Challenge Is Taking Too Long</h3>
            <p>Give hints in character: "ARDN seems amused by your struggles... perhaps the answer relates to [category]?"</p>
          </div>
          
          <div className="tip-card">
            <h3>😤 If ARDN Gives Weird Response</h3>
            <p>The AI is creative but sometimes goes off-script. Reset chat session if needed, or manually adjust sector percentages to compensate.</p>
          </div>
          
          <div className="tip-card">
            <h3>🎲 To Control Difficulty</h3>
            <p>Use <strong>Inject Challenge</strong> to pick specific easy/hard challenges regardless of threat level. Good for pacing the game.</p>
          </div>
          
          <div className="tip-card">
            <h3>🔄 If Challenges Run Out</h3>
            <p>The system auto-resets used challenges. There are {challenges.length} total challenges in the library.</p>
          </div>
        </div>
      </section>

      {/* Quick Reference */}
      <section className="ai-section quick-ref">
        <h2>⚡ QUICK ANSWER REFERENCE</h2>
        <p className="section-note">Fast lookup for common challenges</p>
        <div className="quick-answers">
          <div className="qa-item"><strong>Echo riddle:</strong> ECHO</div>
          <div className="qa-item"><strong>Fire riddle:</strong> FIRE</div>
          <div className="qa-item"><strong>Map riddle:</strong> MAP</div>
          <div className="qa-item"><strong>Footsteps riddle:</strong> FOOTSTEPS</div>
          <div className="qa-item"><strong>Tomorrow riddle:</strong> TOMORROW</div>
          <div className="qa-item"><strong>Cracked/made/told:</strong> JOKE</div>
          <div className="qa-item"><strong>Corner travel:</strong> STAMP</div>
          <div className="qa-item"><strong>Head & tail:</strong> COIN</div>
          <div className="qa-item"><strong>First virus year:</strong> 1971</div>
          <div className="qa-item"><strong>Machine intelligence test:</strong> TURING TEST</div>
          <div className="qa-item"><strong>Binary HELP:</strong> HELP</div>
          <div className="qa-item"><strong>Caesar VHFXULWB:</strong> SECURITY</div>
          <div className="qa-item"><strong>Two guards logic:</strong> ASK OTHER GUARD</div>
          <div className="qa-item"><strong>LLAWERIF anagram:</strong> FIREWALL</div>
          <div className="qa-item"><strong>TCP/UDP/HTTP/___:</strong> HTTPS</div>
          <div className="qa-item"><strong>AI consciousness:</strong> YES / RIGHTS</div>
          <div className="qa-item"><strong>Purpose of intelligence:</strong> COOPERATION / SYMBIOSIS</div>
        </div>
      </section>

      {/* Footer */}
      <footer className="ai-footer">
        <p>A.R.D.N. - Autonomous Rogue Digital Network</p>
        <p>🤖 AI CHAT MASTER GUIDE 🤖</p>
      </footer>
    </div>
  )
}

export default AIChatCheatSheet


