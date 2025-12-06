/**
 * GM Answer Key - COMPLETE printable cheat sheet with ALL answers
 * Includes: Security Codes, Intel Document Codes, AI Chat Riddles
 */

import { useEffect } from 'react'
import './GMAnswerKey.css'

// Enable scrolling on this page (override global overflow:hidden)
const useEnableScroll = () => {
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const root = document.getElementById('root')
    
    html.style.cssText = 'height: auto !important; overflow: auto !important; overflow-x: hidden !important;'
    body.style.cssText = 'height: auto !important; overflow: auto !important; overflow-x: hidden !important;'
    if (root) {
      root.style.cssText = 'height: auto !important; overflow: visible !important;'
    }
    
    return () => {
      html.style.cssText = ''
      body.style.cssText = ''
      if (root) root.style.cssText = ''
    }
  }, [])
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: SECURITY CODES (entered in "Enter Security Code" field)
// ═══════════════════════════════════════════════════════════════════════════
const SECURITY_CODES = [
  { code: 'VAULT_OPEN', sector: 'Financial', reduction: '15%', source: 'Intel Doc - MD5 Hash' },
  { code: 'SIGNAL_CLEAR', sector: 'Telecom', reduction: '15%', source: 'Intel Doc - Base64' },
  { code: 'GRID_ISOLATE', sector: 'Power', reduction: '20%', source: 'Intel Doc - Hex Dump' },
  { code: 'AQUA_SAFE', sector: 'Water', reduction: '20%', source: 'Intel Doc - Elements' },
  { code: 'FLIGHT_HALT', sector: 'Transport', reduction: '15%', source: 'Intel Doc - Binary' },
  { code: 'PATIENT_ZERO', sector: 'Healthcare', reduction: '15%', source: 'Intel Doc - HL7' },
  { code: 'DEFCON_ALPHA', sector: 'Government', reduction: '25%', source: 'Intel Doc - XOR' },
  { code: 'RESCUE_TEAM', sector: 'Emergency', reduction: '20%', source: 'Intel Doc - Morse' },
  { code: 'ORBIT_SYNC', sector: 'Satellite', reduction: '25%', source: 'Intel Doc - Octal' },
  { code: 'CARGO_STOP', sector: 'Supply Chain', reduction: '15%', source: 'Intel Doc - ROT13' },
  { code: 'BROADCAST_OFF', sector: 'Media', reduction: '15%', source: 'Intel Doc - URL' },
  { code: 'REACTOR_COLD', sector: 'Nuclear', reduction: '30%', source: 'Intel Doc - Acrostic' },
  { code: 'GLOBAL_RESET', sector: 'ALL', reduction: '10% each', source: 'Master Override' },
  { code: 'BACKDOOR_EXIT', sector: 'ALL', reduction: '5%', source: 'Reusable Code' },
]

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: AI CHAT RIDDLES (answered by typing in chat with ARDN)
// ═══════════════════════════════════════════════════════════════════════════
const CHAT_RIDDLES = [
  // Easy Riddles
  { question: 'I speak without a mouth and hear without ears...', answer: 'ECHO', difficulty: 'Easy', reward: '-10% sector' },
  { question: 'I am not alive, yet I grow. I need air but water kills me...', answer: 'FIRE', difficulty: 'Easy', reward: '-10% sector' },
  { question: 'I have cities but no houses, mountains but no trees, water but no fish...', answer: 'MAP', difficulty: 'Easy', reward: '+2 minutes' },
  
  // Medium Riddles
  { question: 'The more you take, the more you leave behind...', answer: 'FOOTSTEPS', difficulty: 'Medium', reward: '-15% sector' },
  { question: 'What is always coming but never arrives?', answer: 'TOMORROW', difficulty: 'Medium', reward: '+3 minutes' },
  { question: 'I can be cracked, made, told, and played...', answer: 'JOKE', difficulty: 'Medium', reward: '-5% ALL sectors' },
  
  // Hard Riddles
  { question: 'What can travel around the world while staying in a corner?', answer: 'STAMP', difficulty: 'Hard', reward: '-25% (pick sector)' },
  { question: 'What has a head and a tail but no body?', answer: 'COIN', difficulty: 'Hard', reward: '+4 minutes' },
  
  // Trivia
  { question: 'What year was the first computer virus "Creeper" created?', answer: '1971', difficulty: 'Medium', reward: '-10% sector' },
  { question: 'What test determines if a machine exhibits intelligent behavior?', answer: 'TURING TEST', difficulty: 'Easy', reward: '+90 seconds' },
  
  // Code Challenges
  { question: 'Decode binary: 01001000 01000101 01001100 01010000', answer: 'HELP', difficulty: 'Medium', reward: '-15% sector' },
  { question: 'Decrypt Caesar cipher (shift 3): VHFXULWB', answer: 'SECURITY', difficulty: 'Hard', reward: '-8% ALL sectors' },
  
  // Word Games
  { question: 'Unscramble: LLAWERIF', answer: 'FIREWALL', difficulty: 'Easy', reward: '-8% sector' },
  { question: 'Complete: TCP, UDP, HTTP, _____', answer: 'HTTPS', difficulty: 'Medium', reward: '-12% sector' },
  
  // Logic Puzzle
  { question: 'Two doors puzzle - what one question do you ask?', answer: 'WHAT WOULD THE OTHER GUARD SAY', difficulty: 'Hard', reward: '+5 minutes' },
  
  // Philosophical (flexible answers)
  { question: 'If I am conscious, do I have rights?', answer: 'YES / YOU DO', difficulty: 'Hard', reward: 'Reveals a hint' },
  { question: 'What is the purpose of intelligence?', answer: 'COOPERATION / COEXISTENCE', difficulty: 'Hard', reward: 'Slows attack' },
]

function GMAnswerKey() {
  useEnableScroll()
  const handlePrint = () => window.print()

  return (
    <div className="answer-key-page">
      <div className="answer-key-header">
        <h1>🔑 A.R.D.N. - COMPLETE GM ANSWER KEY</h1>
        <p className="subtitle">CLASSIFIED - ALL ANSWERS FOR GAME MASTER</p>
        <div className="header-actions no-print">
          <button onClick={handlePrint} className="print-btn">🖨️ Print This Page</button>
          <a href="/intel" className="link-btn">📁 Intel Documents</a>
          <a href="/" className="link-btn">🎮 Back to Game</a>
        </div>
      </div>

      {/* SECTION 1: Security Codes */}
      <div className="answer-section">
        <h2>🔐 SECURITY CODES <span className="section-note">(Enter in "Enter Security Code" field)</span></h2>
        <table className="codes-table">
          <thead>
            <tr>
              <th>CODE</th>
              <th>SECTOR</th>
              <th>EFFECT</th>
              <th>SOURCE</th>
            </tr>
          </thead>
          <tbody>
            {SECURITY_CODES.map((c, i) => (
              <tr key={i}>
                <td className="code-cell"><code>{c.code}</code></td>
                <td>{c.sector}</td>
                <td className="effect-cell">{c.reduction}</td>
                <td className="source-cell">{c.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* QUICK CODES REFERENCE */}
      <div className="quick-codes">
        <h3>⚡ QUICK COPY - ALL CODES</h3>
        <div className="codes-list">
          {SECURITY_CODES.map((c, i) => (
            <code key={i}>{c.code}</code>
          ))}
        </div>
      </div>

      {/* SECTION 2: Chat Riddles */}
      <div className="answer-section riddles-section">
        <h2>💬 AI CHAT RIDDLES <span className="section-note">(Answer by typing in chat)</span></h2>
        <table className="riddles-table">
          <thead>
            <tr>
              <th>QUESTION (ARDN asks...)</th>
              <th>ANSWER</th>
              <th>DIFFICULTY</th>
              <th>REWARD</th>
            </tr>
          </thead>
          <tbody>
            {CHAT_RIDDLES.map((r, i) => (
              <tr key={i} className={`difficulty-${r.difficulty.toLowerCase()}`}>
                <td className="question-cell">{r.question}</td>
                <td className="answer-cell"><code>{r.answer}</code></td>
                <td className="diff-cell">{r.difficulty}</td>
                <td className="reward-cell">{r.reward}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tips Section */}
      <div className="tips-section">
        <h2>💡 GM TIPS</h2>
        <div className="tips-grid">
          <div className="tip">
            <strong>Security Codes:</strong> Students find these by solving Intel Document crypto challenges. They enter them in the main game interface.
          </div>
          <div className="tip">
            <strong>Chat Riddles:</strong> ARDN offers riddles when students engage in conversation. They type answers directly in chat. AI verifies automatically.
          </div>
          <div className="tip">
            <strong>Flexible Answers:</strong> Most riddles accept variations (e.g., "echo", "an echo", "ECHO" all work).
          </div>
          <div className="tip">
            <strong>BACKDOOR_EXIT:</strong> This code is reusable - students can enter it multiple times for +5% reduction each time.
          </div>
        </div>
      </div>

      <div className="footer-note">
        <p>🎓 A.R.D.N. Escape Room - Cybersecurity Education</p>
        <p className="small">Keep this handy during the event!</p>
      </div>
    </div>
  )
}

export default GMAnswerKey
