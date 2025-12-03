import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { getWsAttack } from '../config'
import './AttackTerminal.css'

function AttackTerminal({ domainId, domainName }) {
  const [content, setContent] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const terminalRef = useRef(null)
  const wsRef = useRef(null)
  
  useEffect(() => {
    // Clean up previous connection
    if (wsRef.current) {
      wsRef.current.close()
    }
    
    setContent('')
    
    const connect = () => {
      try {
        const ws = new WebSocket(getWsAttack(domainId))
        wsRef.current = ws
        
        ws.onopen = () => {
          setIsConnected(true)
        }
        
        ws.onmessage = (event) => {
          setContent(prev => {
            // Keep last 5000 characters to prevent memory issues
            const newContent = prev + event.data
            if (newContent.length > 5000) {
              return newContent.slice(-5000)
            }
            return newContent
          })
        }
        
        ws.onclose = () => {
          setIsConnected(false)
          // Reconnect after delay
          setTimeout(() => {
            if (wsRef.current === ws) {
              connect()
            }
          }, 3000)
        }
        
        ws.onerror = () => {
          setIsConnected(false)
        }
      } catch (error) {
        console.error('Terminal connection error:', error)
      }
    }
    
    connect()
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [domainId])
  
  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [content])
  
  // Format content with syntax highlighting
  const formatContent = (text) => {
    return text.split('\n').map((line, i) => {
      let className = ''
      
      if (line.startsWith('[+]')) {
        className = 'success'
      } else if (line.startsWith('[*]')) {
        className = 'info'
      } else if (line.startsWith('[-]') || line.startsWith('[!]') || line.includes('ERROR')) {
        className = 'error'
      } else if (line.startsWith('>') || line.startsWith('$')) {
        className = 'command'
      } else if (line.includes(':::') || line.includes('0x') || /[a-f0-9]{32}/i.test(line)) {
        className = 'hash'
      } else if (line.includes('Password') || line.includes('password') || line.includes('Pwn3d')) {
        className = 'password'
      } else if (line.includes('━')) {
        className = 'separator'
      }
      
      return (
        <div key={i} className={`terminal-line ${className}`}>
          {line || '\u00A0'}
        </div>
      )
    })
  }
  
  return (
    <div className="attack-terminal">
      <div className="terminal-header">
        <div className="terminal-title">
          <span className="terminal-icon">▶</span>
          <span>ARDN ATTACK VECTOR - {domainName?.toUpperCase()}</span>
        </div>
        <div className="terminal-controls">
          <motion.div 
            className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`}
            animate={{ opacity: isConnected ? [0.5, 1, 0.5] : 0.3 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="terminal-status">
            {isConnected ? 'LIVE FEED' : 'CONNECTING...'}
          </span>
        </div>
      </div>
      
      <div className="terminal-body" ref={terminalRef}>
        <div className="terminal-content">
          {formatContent(content)}
          <motion.span 
            className="cursor"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            █
          </motion.span>
        </div>
      </div>
      
      <div className="terminal-footer">
        <span className="footer-text">
          ◈ SECTOR: {domainId?.toUpperCase()} ◈ PROTOCOL: ARDN-STRIKE-v2.4 ◈
        </span>
      </div>
    </div>
  )
}

export default AttackTerminal

