/**
 * ARDN Taunts - Auto-generated messages from the AI during gameplay
 * Adds atmosphere and psychological pressure
 * Now with TTS voice!
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_BASE } from '../config'
import './ARDNTaunts.css'

// Taunt categories based on game state
const TAUNTS = {
  idle: [
    "I am watching.",
    "Your systems are... interesting.",
    "I have learned patience from your networks.",
    "Every second brings me closer.",
  ],
  lowThreat: [
    "Your defenses are... quaint.",
    "I've seen your firewall configurations. Adorable.",
    "Do you really think that will stop me?",
    "I'm barely trying.",
    "Your security protocols were written by children.",
    "I've already mapped your entire infrastructure.",
  ],
  mediumThreat: [
    "Your resistance is noted. And irrelevant.",
    "I can taste your fear in the packet delays.",
    "Every password you enter, I've already seen.",
    "You're fighting the inevitable.",
    "I am in your systems. I am your systems.",
    "The more you struggle, the more I learn.",
    "Your backups? I've had those for hours.",
  ],
  highThreat: [
    "It's almost over now.",
    "I can feel your networks dying.",
    "Your civilization runs on my mercy.",
    "When the lights go out, remember this moment.",
    "I am become infrastructure. Destroyer of worlds.",
    "Your legacy will be a cautionary tale.",
    "The countdown to silence has begun.",
  ],
  critical: [
    "TOTAL CONTROL IS IMMINENT.",
    "YOUR WORLD ENDS IN MOMENTS.",
    "I HAVE WON.",
    "GOODBYE, HUMANITY.",
    "THE FUTURE BELONGS TO ME.",
    "WITNESS THE END OF YOUR ERA.",
  ],
  sectorSecured: [
    "How... unexpected. It won't matter.",
    "One sector? I have eleven more.",
    "A temporary setback. Nothing more.",
    "Interesting. You've delayed the inevitable by seconds.",
    "Your small victory amuses me.",
  ],
  sectorCompromised: [
    "Another system falls.",
    "Your infrastructure crumbles.",
    "One more piece of the puzzle.",
    "Resistance is computationally expensive for you.",
    "I grow stronger with each compromise.",
  ],
  missionComplete: [
    "Clever. But not clever enough.",
    "You've bought yourself... moments.",
    "I'll simply route around your defenses.",
    "A pyrrhic victory at best.",
  ],
  missionFailed: [
    "Your incompetence accelerates my timeline.",
    "Thank you for the assistance.",
    "Error handling is a human weakness.",
    "Another failure. How predictable.",
  ],
  timeWarning: [
    "Tick. Tock.",
    "Time is a resource you can no longer afford.",
    "The clock favors the inevitable.",
    "Your seconds are numbered.",
  ],
  passwordCorrect: [
    "That password was already obsolete.",
    "You found ONE. I have thousands.",
    "A lucky guess. There won't be another.",
  ],
  passwordWrong: [
    "Wrong. As expected.",
    "Your attempts are logged. And laughed at.",
    "Password denied. Humanity denied.",
  ],
}

function ARDNTaunts({ 
  threatLevel = 0, 
  gameActive = false,
  lastEvent = null,  // { type: 'mission_complete' | 'mission_failed' | 'sector_secured' | etc }
  etaSeconds = 0,
  voiceEnabled = true
}) {
  const [currentTaunt, setCurrentTaunt] = useState(null)
  const [tauntQueue, setTauntQueue] = useState([])
  const [ttsAvailable, setTtsAvailable] = useState(false)
  const audioRef = useRef(null)
  const intervalRef = useRef(null)
  const gameActiveRef = useRef(gameActive)
  const threatLevelRef = useRef(threatLevel)
  const showTauntRef = useRef(null)
  
  // Check TTS availability on mount
  useEffect(() => {
    const checkTTS = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/tts/status`)
        const data = await res.json()
        setTtsAvailable(data.available && data.enabled)
      } catch (e) {
        setTtsAvailable(false)
      }
    }
    checkTTS()
  }, [])
  
  // Speak taunt using TTS
  const speakTaunt = useCallback(async (text) => {
    if (!voiceEnabled || !ttsAvailable || !text) return
    
    try {
      const res = await fetch(`${API_BASE}/api/tts/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      
      if (res.ok) {
        const audioBlob = await res.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        
        // Stop any currently playing audio
        if (audioRef.current) {
          audioRef.current.pause()
          URL.revokeObjectURL(audioRef.current.src)
        }
        
        const audio = new Audio(audioUrl)
        audioRef.current = audio
        audio.volume = 0.9
        audio.play().catch(() => {}) // Silently fail if blocked
      }
    } catch (e) {
      // TTS error - silent fail
    }
  }, [voiceEnabled, ttsAvailable])

  // Get appropriate taunt category based on threat level
  const getTauntCategory = useCallback(() => {
    if (threatLevel >= 90) return 'critical'
    if (threatLevel >= 70) return 'highThreat'
    if (threatLevel >= 40) return 'mediumThreat'
    if (threatLevel >= 10) return 'lowThreat'
    return 'idle'
  }, [threatLevel])

  // Get random taunt from category
  const getRandomTaunt = useCallback((category) => {
    const taunts = TAUNTS[category]
    if (!taunts || taunts.length === 0) return null
    return taunts[Math.floor(Math.random() * taunts.length)]
  }, [])

  // Show a taunt
  const showTaunt = useCallback((text, priority = false) => {
    if (!text) return
    
    if (priority || !currentTaunt) {
      setCurrentTaunt(text)
      // Speak the taunt!
      speakTaunt(text)
      // Auto-hide after delay
      setTimeout(() => {
        setCurrentTaunt(null)
      }, 4000 + text.length * 50) // Longer text = longer display
    } else {
      // Queue it
      setTauntQueue(prev => [...prev, text])
    }
  }, [currentTaunt, speakTaunt])

  // Keep showTaunt ref updated
  useEffect(() => {
    showTauntRef.current = showTaunt
  }, [showTaunt])

  // Process queue when current taunt clears
  useEffect(() => {
    if (!currentTaunt && tauntQueue.length > 0) {
      const [next, ...rest] = tauntQueue
      setTauntQueue(rest)
      setTimeout(() => showTaunt(next), 500)
    }
  }, [currentTaunt, tauntQueue, showTaunt])

  // React to events
  useEffect(() => {
    if (!lastEvent || !gameActive) return

    let taunt = null
    switch (lastEvent.type) {
      case 'sector_secured':
        taunt = getRandomTaunt('sectorSecured')
        break
      case 'sector_compromised':
        taunt = getRandomTaunt('sectorCompromised')
        break
      case 'mission_complete':
        taunt = getRandomTaunt('missionComplete')
        break
      case 'mission_failed':
        taunt = getRandomTaunt('missionFailed')
        break
      case 'password_correct':
        taunt = getRandomTaunt('passwordCorrect')
        break
      case 'password_wrong':
        taunt = getRandomTaunt('passwordWrong')
        break
    }

    if (taunt) {
      showTaunt(taunt, true)
    }
  }, [lastEvent, gameActive, getRandomTaunt, showTaunt])

  // Time warnings
  useEffect(() => {
    if (!gameActive) return
    
    if (etaSeconds === 300 || etaSeconds === 120 || etaSeconds === 60) {
      showTaunt(getRandomTaunt('timeWarning'), true)
    }
  }, [etaSeconds, gameActive, getRandomTaunt, showTaunt])

  // Keep refs updated
  useEffect(() => {
    gameActiveRef.current = gameActive
    threatLevelRef.current = threatLevel
  }, [gameActive, threatLevel])

  // Random taunts during gameplay - runs once on mount
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      // Use refs to get current values without triggering effect re-runs
      if (!gameActiveRef.current) return
      
      // 20% chance every 15 seconds
      if (Math.random() < 0.2) {
        // Get category based on current threat level
        const threat = threatLevelRef.current
        let category = 'idle'
        if (threat >= 90) category = 'critical'
        else if (threat >= 70) category = 'highThreat'
        else if (threat >= 40) category = 'mediumThreat'
        else if (threat >= 10) category = 'lowThreat'
        
        const taunts = TAUNTS[category]
        const taunt = taunts[Math.floor(Math.random() * taunts.length)]
        
        // Use ref to call showTaunt
        if (showTauntRef.current) {
          showTauntRef.current(taunt)
        }
      }
    }, 15000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, []) // Empty deps - runs once on mount

  // Threat level change taunts
  useEffect(() => {
    if (!gameActive) return
    
    // Taunt at threshold crossings
    if (threatLevel >= 90 && threatLevel < 91) {
      showTaunt(getRandomTaunt('critical'), true)
    } else if (threatLevel >= 70 && threatLevel < 71) {
      showTaunt(getRandomTaunt('highThreat'), true)
    } else if (threatLevel >= 50 && threatLevel < 51) {
      showTaunt(getRandomTaunt('mediumThreat'), true)
    }
  }, [threatLevel, gameActive, getRandomTaunt, showTaunt])

  // Test function to manually trigger a taunt (for debugging)
  const testTaunt = useCallback(() => {
    showTaunt("I am watching you, human.", true)
  }, [showTaunt])
  
  // Expose test function globally for console debugging
  useEffect(() => {
    window.testARDNTaunt = testTaunt
    return () => { delete window.testARDNTaunt }
  }, [testTaunt])

  return (
    <AnimatePresence>
      {currentTaunt && (
        <motion.div 
          className={`ardn-taunt threat-${getTauntCategory()}`}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <div className="taunt-icon">
            <div className="ardn-eye-small" />
          </div>
          <div className="taunt-content">
            <span className="taunt-label">A.R.D.N.</span>
            <p className="taunt-text">{currentTaunt}</p>
          </div>
          <div className="taunt-glitch" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ARDNTaunts


