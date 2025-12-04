/**
 * GM Answer Key - Printable cheat sheet with all codes and answers
 */

import './GMAnswerKey.css'

const ANSWERS = [
  { sector: 'Financial Systems', icon: '💰', code: 'VAULT_OPEN', challenge: 'MD5 Hash Cracking', hint: 'Use CrackStation.net or hashcat' },
  { sector: 'Telecommunications', icon: '📡', code: 'SIGNAL_CLEAR', challenge: 'Base64 Decoding', hint: 'echo "U0lHTkFMX0NMRUFS" | base64 -d' },
  { sector: 'Power Grid', icon: '⚡', code: 'GRID_ISOLATE', challenge: 'Hex to ASCII', hint: 'Convert hex bytes: 475249445F49534F4C415445' },
  { sector: 'Water Systems', icon: '💧', code: 'AQUA_SAFE', challenge: 'Periodic Table Elements', hint: 'Atomic numbers to element symbols' },
  { sector: 'Transportation', icon: '🚆', code: 'FLIGHT_HALT', challenge: 'Binary to ASCII', hint: '8-bit binary groups to decimal to ASCII' },
  { sector: 'Healthcare', icon: '🏥', code: 'PATIENT_ZERO', challenge: 'HL7 Message Parsing', hint: 'Look in OBX segment, field 5 (after 4th pipe)' },
  { sector: 'Government/Military', icon: '🛡️', code: 'DEFCON_ALPHA', challenge: 'XOR Cipher', hint: 'XOR each byte with key 0x42' },
  { sector: 'Emergency Services', icon: '🚨', code: 'RESCUE_TEAM', challenge: 'Morse Code', hint: '.-. . ... -.-. ..- . / - . .- --' },
  { sector: 'Satellite/Space', icon: '🛰️', code: 'ORBIT_SYNC', challenge: 'Octal to ASCII', hint: 'Base-8: 117 122 102 111 124 137 123 131 116 103' },
  { sector: 'Supply Chain', icon: '📦', code: 'CARGO_STOP', challenge: 'ROT13 Cipher', hint: 'PNETB_FGBC → shift each letter by 13' },
  { sector: 'Media/Broadcast', icon: '📺', code: 'BROADCAST_OFF', challenge: 'URL Encoding', hint: 'Decode %42%52%4F%41%44...' },
  { sector: 'Nuclear Systems', icon: '☢️', code: 'REACTOR_COLD', challenge: 'Safety Procedure Acrostic', hint: 'First letter of each step spells the code' },
]

function GMAnswerKey() {
  const handlePrint = () => window.print()

  return (
    <div className="answer-key-page">
      <div className="answer-key-header">
        <h1>🔑 A.R.D.N. - GM MASTER ANSWER KEY</h1>
        <p className="subtitle">CLASSIFIED - FOR GAME MASTER USE ONLY</p>
        <div className="header-actions no-print">
          <button onClick={handlePrint} className="print-btn">🖨️ Print This Page</button>
          <a href="/intel" className="link-btn">📁 View Full Documents</a>
          <a href="/" className="link-btn">🎮 Back to Game</a>
        </div>
      </div>

      <div className="answers-table">
        <table>
          <thead>
            <tr>
              <th>SECTOR</th>
              <th>PASSWORD CODE</th>
              <th>CHALLENGE TYPE</th>
              <th>DECODING HINT</th>
            </tr>
          </thead>
          <tbody>
            {ANSWERS.map((a, i) => (
              <tr key={i}>
                <td className="sector-cell">
                  <span className="sector-icon">{a.icon}</span>
                  <span className="sector-name">{a.sector}</span>
                </td>
                <td className="code-cell">
                  <code>{a.code}</code>
                </td>
                <td className="challenge-cell">{a.challenge}</td>
                <td className="hint-cell">{a.hint}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="quick-reference">
        <h2>⚡ QUICK REFERENCE - ALL CODES</h2>
        <div className="codes-grid">
          {ANSWERS.map((a, i) => (
            <div key={i} className="code-item">
              <span className="code-icon">{a.icon}</span>
              <code>{a.code}</code>
            </div>
          ))}
        </div>
      </div>

      <div className="tools-reference">
        <h2>🛠️ DECODING TOOLS</h2>
        <div className="tools-grid">
          <div className="tool-item">
            <strong>CyberChef</strong>
            <span>gchq.github.io/CyberChef</span>
          </div>
          <div className="tool-item">
            <strong>CrackStation</strong>
            <span>crackstation.net (MD5 hashes)</span>
          </div>
          <div className="tool-item">
            <strong>Base64 Decode</strong>
            <span>echo "..." | base64 -d</span>
          </div>
          <div className="tool-item">
            <strong>Hex to ASCII</strong>
            <span>xxd -r -p</span>
          </div>
          <div className="tool-item">
            <strong>ROT13</strong>
            <span>tr 'A-Za-z' 'N-ZA-Mn-za-m'</span>
          </div>
          <div className="tool-item">
            <strong>Python</strong>
            <span>bytes.fromhex(), base64.b64decode()</span>
          </div>
        </div>
      </div>

      <div className="footer-note">
        <p>🎓 A.R.D.N. Escape Room - Cybersecurity Education</p>
        <p className="small">Print this page and keep it handy during the event!</p>
      </div>
    </div>
  )
}

export default GMAnswerKey

