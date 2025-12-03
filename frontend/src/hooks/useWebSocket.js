import { useState, useEffect, useRef, useCallback } from 'react'

export function useWebSocket(url) {
  const [lastMessage, setLastMessage] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  
  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url)
      wsRef.current = ws
      
      ws.onopen = () => {
        setConnectionStatus('connected')
        console.log('WebSocket connected')
      }
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setLastMessage(data)
        } catch (e) {
          console.error('Failed to parse message:', e)
        }
      }
      
      ws.onclose = () => {
        setConnectionStatus('disconnected')
        console.log('WebSocket disconnected, reconnecting...')
        reconnectTimeoutRef.current = setTimeout(connect, 3000)
      }
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionStatus('disconnected')
      }
    } catch (error) {
      console.error('Failed to connect:', error)
      setConnectionStatus('disconnected')
      reconnectTimeoutRef.current = setTimeout(connect, 3000)
    }
  }, [url])
  
  useEffect(() => {
    connect()
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])
  
  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])
  
  return { sendMessage, lastMessage, connectionStatus }
}

export function useStreamingWebSocket(url) {
  const [content, setContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const wsRef = useRef(null)
  
  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url)
      wsRef.current = ws
      
      ws.onopen = () => {
        setIsStreaming(true)
      }
      
      ws.onmessage = (event) => {
        setContent(prev => prev + event.data)
      }
      
      ws.onclose = () => {
        setIsStreaming(false)
        // Clear and reconnect after delay
        setTimeout(() => {
          setContent('')
          connect()
        }, 2000)
      }
      
      ws.onerror = (error) => {
        console.error('Streaming WebSocket error:', error)
      }
    } catch (error) {
      console.error('Failed to connect streaming WebSocket:', error)
    }
  }, [url])
  
  useEffect(() => {
    connect()
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])
  
  const clearContent = useCallback(() => {
    setContent('')
  }, [])
  
  return { content, isStreaming, clearContent }
}


