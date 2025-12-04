import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './PasswordEntry.css'

function PasswordEntry({ onSubmit, result }) {
  const [code, setCode] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const inputRef = useRef(null)
  
  useEffect(() => {
    if (result?.success) {
      setShowSuccess(true)
      setCode('')
      setTimeout(() => setShowSuccess(false), 2000)
    }
  }, [result])
  
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])
  
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!code.trim()) return
    onSubmit(code.trim())
    setCode('')
  }
  
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsExpanded(false)
    }
  }
  
  return (
    <div className="password-entry">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.button
            key="collapsed"
            className="expand-button"
            onClick={() => setIsExpanded(true)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="button-icon">🔐</span>
            <span className="button-text">ENTER SECURITY CODE</span>
            <motion.span 
              className="button-pulse"
              animate={{ 
                opacity: [0.5, 1, 0.5],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.button>
        ) : (
          <motion.form
            key="expanded"
            className={`password-form ${showSuccess ? 'success' : ''}`}
            onSubmit={handleSubmit}
            initial={{ opacity: 0, width: 200 }}
            animate={{ opacity: 1, width: 400 }}
            exit={{ opacity: 0, width: 200 }}
          >
            <div className="form-header">
              <span className="form-icon">◈</span>
              <span>COUNTERMEASURE PROTOCOL</span>
              <span className="form-icon">◈</span>
            </div>
            
            <div className="input-row">
              <div className="code-input-wrapper">
                <input
                  ref={inputRef}
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyDown={handleKeyDown}
                  placeholder="ENTER CODE..."
                  maxLength={30}
                  autoComplete="off"
                  spellCheck="false"
                />
                <div className="input-decoration">
                  {[...Array(5)].map((_, i) => (
                    <motion.span
                      key={i}
                      animate={{ opacity: [0.2, 0.8, 0.2] }}
                      transition={{ 
                        duration: 1, 
                        repeat: Infinity, 
                        delay: i * 0.2 
                      }}
                    />
                  ))}
                </div>
              </div>
              
              <button type="submit" className="submit-btn" disabled={!code.trim()}>
                <span>DEPLOY</span>
              </button>
              
              <button 
                type="button" 
                className="close-btn"
                onClick={() => setIsExpanded(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="form-footer">
              <span>Valid codes will deploy countermeasures against A.R.D.N.</span>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PasswordEntry




