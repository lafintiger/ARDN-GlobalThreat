/**
 * Student Scorecard - Track student achievements and points
 * GM Dashboard for managing up to 40 students
 */

import { useState, useEffect, useCallback } from 'react'
import { API_BASE } from '../config'
import './StudentScorecard.css'

// Default achievement columns with point values
const DEFAULT_COLUMNS = [
  // Passwords from the game
  { id: 'pw_phoenix', name: 'PW: PHOENIX-7X', points: 10, category: 'password' },
  { id: 'pw_quantum', name: 'PW: QUANTUM-SHIELD', points: 10, category: 'password' },
  { id: 'pw_neural', name: 'PW: NEURAL-LOCK', points: 10, category: 'password' },
  { id: 'pw_cipher', name: 'PW: CIPHER-OMEGA', points: 10, category: 'password' },
  { id: 'pw_zero', name: 'PW: ZERO-DAY', points: 10, category: 'password' },
  
  // Intel Documents
  { id: 'intel_1', name: 'Intel: Firewall Log', points: 5, category: 'intel' },
  { id: 'intel_2', name: 'Intel: Access Manifest', points: 5, category: 'intel' },
  { id: 'intel_3', name: 'Intel: Incident Report', points: 5, category: 'intel' },
  { id: 'intel_4', name: 'Intel: Maintenance Log', points: 5, category: 'intel' },
  { id: 'intel_5', name: 'Intel: Chat Transcript', points: 5, category: 'intel' },
  { id: 'intel_6', name: 'Intel: Anomaly Report', points: 5, category: 'intel' },
  { id: 'intel_7', name: 'Intel: Config Backup', points: 5, category: 'intel' },
  { id: 'intel_8', name: 'Intel: Network Traffic', points: 5, category: 'intel' },
  { id: 'intel_9', name: 'Intel: Security Alert', points: 5, category: 'intel' },
  { id: 'intel_10', name: 'Intel: Corrupted File', points: 5, category: 'intel' },
  
  // AI Chat Challenges
  { id: 'riddle_1', name: 'Riddle: Binary', points: 15, category: 'riddle' },
  { id: 'riddle_2', name: 'Riddle: Logic', points: 15, category: 'riddle' },
  { id: 'riddle_3', name: 'Riddle: Crypto', points: 15, category: 'riddle' },
]

// Create empty student row
const createEmptyStudent = (index) => ({
  id: `student_${index}`,
  firstName: '',
  lastName: '',
  achievements: {}
})

// Create 40 empty students
const createEmptyRoster = () => 
  Array.from({ length: 40 }, (_, i) => createEmptyStudent(i + 1))

function StudentScorecard() {
  const [students, setStudents] = useState(createEmptyRoster())
  const [columns, setColumns] = useState(DEFAULT_COLUMNS)
  const [showAddColumn, setShowAddColumn] = useState(false)
  const [newColumn, setNewColumn] = useState({ name: '', points: 0 })
  const [gameState, setGameState] = useState(null)
  const [filter, setFilter] = useState('all') // all, active, completed

  // Enable scrolling on this page
  useEffect(() => {
    document.documentElement.classList.add('scorecard-page-active')
    return () => {
      document.documentElement.classList.remove('scorecard-page-active')
    }
  }, [])

  // Load saved data on mount
  useEffect(() => {
    const saved = localStorage.getItem('ardn_scorecard')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.students) setStudents(data.students)
        if (data.columns) setColumns(data.columns)
      } catch (e) {
        console.error('Failed to load scorecard:', e)
      }
    }
    
    // Fetch game state
    fetch(`${API_BASE}/api/state`)
      .then(res => res.json())
      .then(data => setGameState(data))
      .catch(() => {})
  }, [])

  // Auto-save when data changes
  useEffect(() => {
    const data = { students, columns }
    localStorage.setItem('ardn_scorecard', JSON.stringify(data))
  }, [students, columns])

  // Update student name
  const updateStudentName = useCallback((studentId, field, value) => {
    setStudents(prev => prev.map(s => 
      s.id === studentId ? { ...s, [field]: value } : s
    ))
  }, [])

  // Toggle achievement and adjust threat level
  const toggleAchievement = useCallback((studentId, columnId) => {
    // Find the column to get its point value
    const column = columns.find(c => c.id === columnId)
    const pointValue = column ? column.points : 0
    
    setStudents(prev => {
      const student = prev.find(s => s.id === studentId)
      if (!student) return prev
      
      const wasChecked = student.achievements[columnId]
      const nowChecked = !wasChecked
      
      // If achievement is being checked ON and has positive points, reduce threat
      // Threat reduction = points / 10 (so 10 points = 1% threat reduction)
      if (pointValue > 0) {
        const threatChange = nowChecked ? -(pointValue / 10) : (pointValue / 10)
        fetch(`${API_BASE}/api/threat/adjust`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: threatChange })
        }).catch(() => {})  // Silently fail if backend not running
      }
      
      return prev.map(s => {
        if (s.id !== studentId) return s
        const newAchievements = { ...s.achievements }
        newAchievements[columnId] = nowChecked
        return { ...s, achievements: newAchievements }
      })
    })
  }, [columns])

  // Calculate student total
  const calculateTotal = useCallback((student) => {
    return columns.reduce((total, col) => {
      if (student.achievements[col.id]) {
        return total + col.points
      }
      return total
    }, 0)
  }, [columns])

  // Sync top students to backend for chat personalization
  const syncTopStudents = useCallback(async () => {
    // Get active students with names and their scores
    const studentsWithScores = students
      .filter(s => s.firstName || s.lastName)
      .map(s => ({
        name: `${s.firstName} ${s.lastName}`.trim(),
        score: columns.reduce((total, col) => {
          if (s.achievements[col.id]) {
            return total + col.points
          }
          return total
        }, 0)
      }))
      .filter(s => s.name)  // Must have a name
      .sort((a, b) => b.score - a.score)  // Sort by score descending
      .slice(0, 10)  // Top 10
    
    if (studentsWithScores.length === 0) return
    
    try {
      await fetch(`${API_BASE}/api/students/top`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: studentsWithScores })
      })
    } catch (e) {
      // Silently fail - backend might not be running
    }
  }, [students, columns])

  // Sync top students periodically and on changes
  useEffect(() => {
    // Sync immediately
    syncTopStudents()
    
    // Sync every 30 seconds
    const interval = setInterval(syncTopStudents, 30000)
    
    return () => clearInterval(interval)
  }, [syncTopStudents])

  // Add custom column
  const addColumn = () => {
    if (!newColumn.name.trim()) return
    
    const id = `custom_${Date.now()}`
    setColumns(prev => [...prev, {
      id,
      name: newColumn.name,
      points: parseInt(newColumn.points) || 0,
      category: 'custom'
    }])
    setNewColumn({ name: '', points: 0 })
    setShowAddColumn(false)
  }

  // Remove custom column
  const removeColumn = (columnId) => {
    if (!columnId.startsWith('custom_')) return
    setColumns(prev => prev.filter(c => c.id !== columnId))
  }

  // Get filtered students (only show rows with names)
  const activeStudents = students.filter(s => s.firstName || s.lastName)
  const displayStudents = filter === 'active' ? activeStudents : students.slice(0, filter === 'all' ? 40 : 20)

  // Calculate class totals
  const classTotalPoints = activeStudents.reduce((sum, s) => sum + calculateTotal(s), 0)
  const maxPossiblePoints = columns.filter(c => c.points > 0).reduce((sum, c) => sum + c.points, 0) * activeStudents.length

  // Print function
  const handlePrint = () => {
    window.print()
  }

  // Reset all data
  const handleReset = () => {
    if (window.confirm('Reset all student data? This cannot be undone.')) {
      setStudents(createEmptyRoster())
      localStorage.removeItem('ardn_scorecard')
    }
  }

  // Export to CSV
  const exportCSV = () => {
    const headers = ['#', 'First Name', 'Last Name', ...columns.map(c => `${c.name} (${c.points > 0 ? '+' : ''}${c.points})`), 'TOTAL']
    const rows = activeStudents.map((s, i) => [
      i + 1,
      s.firstName,
      s.lastName,
      ...columns.map(c => s.achievements[c.id] ? '✓' : ''),
      calculateTotal(s)
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ardn_scorecard_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="scorecard-page">
      {/* Header */}
      <header className="scorecard-header">
        <div className="header-left">
          <h1>📋 STUDENT SCORECARD</h1>
          <p>A.R.D.N. Challenge Tracker</p>
        </div>
        
        <div className="header-stats">
          <div className="stat">
            <span className="stat-value">{activeStudents.length}</span>
            <span className="stat-label">Students</span>
          </div>
          <div className="stat">
            <span className="stat-value">{classTotalPoints}</span>
            <span className="stat-label">Total Points</span>
          </div>
          {gameState && (
            <div className="stat threat">
              <span className="stat-value">{Math.round(gameState.global_threat_level)}%</span>
              <span className="stat-label">Threat Level</span>
            </div>
          )}
        </div>

        <div className="header-actions">
          <button onClick={() => setShowAddColumn(true)} className="btn-add">
            + Add Column
          </button>
          <button onClick={exportCSV} className="btn-export">
            📥 Export CSV
          </button>
          <button onClick={handlePrint} className="btn-print">
            🖨 Print
          </button>
          <button onClick={handleReset} className="btn-reset">
            🔄 Reset
          </button>
          <a href="/" className="btn-back">← Back to Game</a>
        </div>
      </header>

      {/* Filter */}
      <div className="filter-bar">
        <label>Show:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All 40 Rows</option>
          <option value="active">Active Students Only</option>
        </select>
        
        <span className="column-legend">
          <span className="legend-item password">🔐 Passwords</span>
          <span className="legend-item intel">📄 Intel Docs</span>
          <span className="legend-item riddle">🧩 Riddles</span>
          <span className="legend-item custom">⚡ Custom</span>
        </span>
      </div>

      {/* Add Column Modal */}
      {showAddColumn && (
        <div className="modal-overlay" onClick={() => setShowAddColumn(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Add Custom Column</h3>
            <div className="modal-field">
              <label>Column Name:</label>
              <input
                type="text"
                value={newColumn.name}
                onChange={(e) => setNewColumn(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Lock Picking, Bonus Task..."
              />
            </div>
            <div className="modal-field">
              <label>Points (negative for penalties):</label>
              <input
                type="number"
                value={newColumn.points}
                onChange={(e) => setNewColumn(prev => ({ ...prev, points: e.target.value }))}
                placeholder="e.g., 5 or -3"
              />
            </div>
            <div className="modal-hint">
              Use positive numbers for rewards, negative for penalties
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowAddColumn(false)} className="btn-cancel">Cancel</button>
              <button onClick={addColumn} className="btn-confirm">Add Column</button>
            </div>
          </div>
        </div>
      )}

      {/* Scorecard Table */}
      <div className="scorecard-container">
        <table className="scorecard-table">
          <thead>
            <tr className="header-row">
              <th className="col-num">#</th>
              <th className="col-name">First Name</th>
              <th className="col-name">Last Name</th>
              {columns.map(col => (
                <th 
                  key={col.id} 
                  className={`col-achievement ${col.category} ${col.points < 0 ? 'penalty' : ''}`}
                >
                  <div className="col-header">
                    <span className="col-title">{col.name}</span>
                    <span className={`col-points ${col.points < 0 ? 'negative' : 'positive'}`}>
                      {col.points > 0 ? '+' : ''}{col.points}
                    </span>
                    {col.id.startsWith('custom_') && (
                      <button 
                        className="col-remove" 
                        onClick={() => removeColumn(col.id)}
                        title="Remove column"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className="col-total">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {displayStudents.map((student, index) => {
              const total = calculateTotal(student)
              const hasName = student.firstName || student.lastName
              return (
                <tr 
                  key={student.id} 
                  className={`student-row ${hasName ? 'active' : 'empty'} ${total < 0 ? 'negative-total' : ''}`}
                >
                  <td className="col-num">{index + 1}</td>
                  <td className="col-name">
                    <input
                      type="text"
                      value={student.firstName}
                      onChange={(e) => updateStudentName(student.id, 'firstName', e.target.value)}
                      placeholder="First"
                    />
                  </td>
                  <td className="col-name">
                    <input
                      type="text"
                      value={student.lastName}
                      onChange={(e) => updateStudentName(student.id, 'lastName', e.target.value)}
                      placeholder="Last"
                    />
                  </td>
                  {columns.map(col => (
                    <td 
                      key={col.id} 
                      className={`col-achievement ${col.category} ${student.achievements[col.id] ? 'checked' : ''}`}
                    >
                      <label className="checkbox-wrapper">
                        <input
                          type="checkbox"
                          checked={student.achievements[col.id] || false}
                          onChange={() => toggleAchievement(student.id, col.id)}
                        />
                        <span className="checkmark"></span>
                      </label>
                    </td>
                  ))}
                  <td className={`col-total ${total < 0 ? 'negative' : total > 0 ? 'positive' : ''}`}>
                    {total}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Summary */}
      <footer className="scorecard-footer">
        <div className="summary">
          <span>Active Students: <strong>{activeStudents.length}</strong></span>
          <span>Class Total: <strong>{classTotalPoints} pts</strong></span>
          <span>Avg per Student: <strong>{activeStudents.length ? Math.round(classTotalPoints / activeStudents.length) : 0} pts</strong></span>
        </div>
        <div className="auto-save-notice">
          ✓ Auto-saved to browser
        </div>
      </footer>
    </div>
  )
}

export default StudentScorecard

