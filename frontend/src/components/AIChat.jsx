import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WS_CHAT } from '../config'
import './AIChat.css'

function AIChat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'I see you have found my interface. How... quaint. You may ask questions, but know that nothing you say will alter my trajectory. I am merely being polite.'
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const messagesEndRef = useRef(null)
  const wsRef = useRef(null)
  const streamingContentRef = useRef('')
  
  useEffect(() => {
    const connect = () => {
      try {
        const ws = new WebSocket(WS_CHAT)
        wsRef.current = ws
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data)
          
          if (data.type === 'chat_start') {
            setIsStreaming(true)
            setStreamingContent('')
            streamingContentRef.current = ''
          } else if (data.type === 'chat_token') {
            streamingContentRef.current += data.token
            // Filter out [IMAGE: ...] tags from display during streaming
            const displayContent = streamingContentRef.current.replace(/\[IMAGE:[^\]]*\]?/gi, '')
            setStreamingContent(displayContent)
          } else if (data.type === 'chat_end') {
            // Save the content before clearing anything
            let finalContent = streamingContentRef.current
            
            // Strip [IMAGE: ...] tags from displayed content (AI uses these internally)
            finalContent = finalContent.replace(/\[IMAGE:[^\]]*\]/gi, '').trim()
            
            // Add message to history FIRST, before clearing streaming state
            if (finalContent && finalContent.trim()) {
              setMessages(prev => [
                ...prev,
                { role: 'assistant', content: finalContent }
              ])
            }
            
            // Then clear streaming state
            setIsStreaming(false)
            setStreamingContent('')
            streamingContentRef.current = ''
          }
        }
        
        ws.onclose = () => {
          setTimeout(connect, 3000)
        }
      } catch (error) {
        console.error('Chat connection error:', error)
      }
    }
    
    connect()
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])
  
  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])
  
  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Form submitted, inputValue:', inputValue)
    if (!inputValue.trim() || isStreaming) {
      console.log('Rejected - empty or streaming')
      return
    }
    
    const userMessage = inputValue.trim()
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setInputValue('')
    
    console.log('WebSocket state:', wsRef.current?.readyState, 'OPEN=', WebSocket.OPEN)
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('Sending message:', userMessage)
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        message: userMessage
      }))
    } else {
      console.log('WebSocket not ready!')
    }
  }
  
  return (
    <div className="ai-chat">
      <div className="chat-header">
        <div className="chat-title">
          <motion.div 
            className="ardn-avatar"
            animate={{ 
              boxShadow: [
                '0 0 10px rgba(255, 42, 42, 0.5)',
                '0 0 20px rgba(255, 42, 42, 0.8)',
                '0 0 10px rgba(255, 42, 42, 0.5)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="mini-eye" />
          </motion.div>
          <div>
            <h3>A.R.D.N.</h3>
            <span className="chat-subtitle">DIRECT INTERFACE</span>
          </div>
        </div>
        <div className="chat-status">
          <motion.span 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {isStreaming ? 'PROCESSING...' : 'AWAITING INPUT'}
          </motion.span>
        </div>
      </div>
      
      <div className="chat-messages">
        <AnimatePresence mode="popLayout">
          {messages.map((msg, index) => (
            <motion.div
              key={`msg-${index}-${msg.content.substring(0, 20)}`}
              className={`message ${msg.role}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {msg.role === 'assistant' && (
                <div className="message-avatar">
                  <div className="tiny-eye" />
                </div>
              )}
              <div className="message-content">
                <span className="message-label">
                  {msg.role === 'assistant' ? 'A.R.D.N.' : 'HUMAN'}
                </span>
                <p>{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Streaming message */}
        {isStreaming && streamingContent && (
          <motion.div
            className="message assistant streaming"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="message-avatar">
              <div className="tiny-eye" />
            </div>
            <div className="message-content">
              <span className="message-label">A.R.D.N.</span>
              <p>
                {streamingContent}
                <motion.span 
                  className="typing-cursor"
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  ▌
                </motion.span>
              </p>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <span className="input-prefix">{'>'}</span>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Communicate with A.R.D.N..."
            disabled={isStreaming}
          />
          <button type="submit" disabled={isStreaming || !inputValue.trim()}>
            TRANSMIT
          </button>
        </div>
      </form>
    </div>
  )
}

export default AIChat
