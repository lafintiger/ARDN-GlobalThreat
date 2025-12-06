import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WS_CHAT, API_BASE } from '../config'
import './AIChat.css'

function AIChat({ voiceInputEnabled = false }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'I see you have found my interface. How... quaint. You may ask questions, but know that nothing you say will alter my trajectory. I am merely being polite.'
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [sttAvailable, setSttAvailable] = useState(false)
  const messagesEndRef = useRef(null)
  const wsRef = useRef(null)
  const streamingContentRef = useRef('')
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  
  // Check STT availability
  useEffect(() => {
    const checkSTT = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/stt/status`)
        if (res.ok) {
          const data = await res.json()
          setSttAvailable(data.available)
          console.log('[AIChat] STT status:', data)
        }
      } catch (e) {
        console.log('[AIChat] STT not available:', e)
        setSttAvailable(false)
      }
    }
    checkSTT()
  }, [])

  // Start voice recording
  const startRecording = useCallback(async () => {
    if (!voiceInputEnabled || !sttAvailable || isRecording) return
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      })
      
      // Use webm for recording, we'll convert on backend or use WAV
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
        
        if (audioChunksRef.current.length === 0) return
        
        // Create blob and send to backend
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await transcribeAudio(audioBlob)
      }
      
      mediaRecorder.start(100) // Collect data every 100ms
      setIsRecording(true)
      console.log('[AIChat] Recording started')
      
    } catch (e) {
      console.error('[AIChat] Failed to start recording:', e)
      alert('Could not access microphone. Please allow microphone access.')
    }
  }, [voiceInputEnabled, sttAvailable, isRecording])

  // Stop voice recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      console.log('[AIChat] Recording stopped')
    }
  }, [isRecording])

  // Transcribe audio via backend
  const transcribeAudio = async (audioBlob) => {
    try {
      // Convert webm to WAV using AudioContext
      const arrayBuffer = await audioBlob.arrayBuffer()
      const audioContext = new AudioContext({ sampleRate: 16000 })
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      
      // Convert to 16-bit PCM WAV
      const wavBlob = audioBufferToWav(audioBuffer)
      
      console.log('[AIChat] Sending audio for transcription, size:', wavBlob.size)
      
      const res = await fetch(`${API_BASE}/api/stt/transcribe-wav`, {
        method: 'POST',
        body: wavBlob,
        headers: {
          'Content-Type': 'audio/wav'
        }
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.text) {
          console.log('[AIChat] Transcription:', data.text)
          setInputValue(data.text)
        } else {
          console.log('[AIChat] Transcription failed:', data.error)
        }
      } else {
        console.error('[AIChat] Transcription request failed:', res.status)
      }
      
      await audioContext.close()
      
    } catch (e) {
      console.error('[AIChat] Transcription error:', e)
    }
  }

  // Convert AudioBuffer to WAV Blob
  const audioBufferToWav = (audioBuffer) => {
    const numChannels = 1
    const sampleRate = audioBuffer.sampleRate
    const format = 1 // PCM
    const bitDepth = 16
    
    // Get channel data (mono)
    let channelData = audioBuffer.getChannelData(0)
    
    // Create WAV file
    const bytesPerSample = bitDepth / 8
    const blockAlign = numChannels * bytesPerSample
    const dataSize = channelData.length * bytesPerSample
    const buffer = new ArrayBuffer(44 + dataSize)
    const view = new DataView(buffer)
    
    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }
    
    writeString(0, 'RIFF')
    view.setUint32(4, 36 + dataSize, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true) // fmt chunk size
    view.setUint16(20, format, true)
    view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * blockAlign, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bitDepth, true)
    writeString(36, 'data')
    view.setUint32(40, dataSize, true)
    
    // Write audio data
    let offset = 44
    for (let i = 0; i < channelData.length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]))
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
      view.setInt16(offset, intSample, true)
      offset += 2
    }
    
    return new Blob([buffer], { type: 'audio/wav' })
  }

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
            placeholder={isRecording ? "Listening..." : "Communicate with A.R.D.N..."}
            disabled={isStreaming || isRecording}
          />
          {voiceInputEnabled && sttAvailable && (
            <button
              type="button"
              className={`mic-button ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isStreaming}
              title={isRecording ? "Stop recording" : "Voice input"}
            >
              {isRecording ? (
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  ⏹
                </motion.span>
              ) : (
                '🎤'
              )}
            </button>
          )}
          <button type="submit" disabled={isStreaming || !inputValue.trim() || isRecording}>
            TRANSMIT
          </button>
        </div>
      </form>
    </div>
  )
}

export default AIChat
