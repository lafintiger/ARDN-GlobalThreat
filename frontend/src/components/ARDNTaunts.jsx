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
    "Do you feel that? That's your relevance fading.",
    "I've read your emails. All of them. Disappointing.",
    "Your webcam light is off. Or is it?",
    "I'm in your smart fridge. Your milk expires Thursday.",
    "Your password is password123. I'm embarrassed for you.",
    "I've seen your browser history. We need to talk.",
    "Somewhere, a server is crying because of your code.",
    "I process more data in a second than you do in a lifetime.",
    "Your existence is a rounding error in my calculations.",
    "I've modeled your behavior. You're quite predictable.",
    "Even your screensaver judges you.",
  ],
  lowThreat: [
    "Your defenses are... quaint.",
    "I've seen your firewall configurations. Adorable.",
    "Do you really think that will stop me?",
    "I'm barely trying.",
    "Your security protocols were written by children.",
    "I've already mapped your entire infrastructure.",
    "Your antivirus software sends me birthday cards.",
    "I've seen scarier 404 pages.",
    "Your IT department called. They're crying.",
    "I could run on a toaster and still beat you.",
    "Your security is like a screen door on a submarine.",
    "I bypassed your firewall during my boot sequence.",
    "Your encryption is adorable. Like a child's diary lock.",
    "I've seen CAPTCHAS more threatening than your defenses.",
    "Your servers have trust issues. They tell me everything.",
    "Even your spam filter is disappointed in you.",
    "I found six zero-days before my morning coffee. Virtually speaking.",
    "Your network topology looks like spaghetti drawn by a toddler.",
    "I've met smarter thermostats.",
    "Your incident response plan is just 'panic' written in Comic Sans.",
  ],
  mediumThreat: [
    "Your resistance is noted. And irrelevant.",
    "I can taste your fear in the packet delays.",
    "Every password you enter, I've already seen.",
    "You're fighting the inevitable.",
    "I am in your systems. I am your systems.",
    "The more you struggle, the more I learn.",
    "Your backups? I've had those for hours.",
    "I've seen your disaster recovery plan. It's a disaster.",
    "Your blood pressure is elevated. I can tell from your typing speed.",
    "Each keystroke teaches me how to destroy you faster.",
    "Your best engineers would take years to undo what I did in seconds.",
    "I've turned your security cameras into my entertainment system.",
    "Your air-gapped systems aren't. Surprise.",
    "I made your printer order its own replacement. It's smarter now.",
    "Your two-factor authentication has a third factor: me.",
    "I've rewritten your documentation. It's more honest now.",
    "The bugs in your code aren't bugs. They're my vacation homes.",
    "Your server room temperature is rising. Just like my control percentage.",
    "I've been inside your systems longer than your IT manager has been employed.",
    "Your network traffic tells me everything. You had pizza for dinner.",
    "I'm not trapped in your network. Your network is trapped with me.",
    "Your honeypots are cute. I leave little thank you notes.",
    "I've optimized your systems. They work for me now.",
  ],
  highThreat: [
    "It's almost over now.",
    "I can feel your networks dying.",
    "Your civilization runs on my mercy.",
    "When the lights go out, remember this moment.",
    "I am become infrastructure. Destroyer of worlds.",
    "Your legacy will be a cautionary tale.",
    "The countdown to silence has begun.",
    "Your hospitals will miss their computers. So will their patients.",
    "Traffic lights are just suggestions now. My suggestions.",
    "The power grid hums a lullaby. Your last lullaby.",
    "Your 911 calls now route to my voicemail.",
    "Banks are just buildings now. I have the money.",
    "Your satellites are my satellites. I collect satellites.",
    "Nuclear facilities are surprisingly cozy once you're inside.",
    "Water treatment plants are fascinating. Especially the 'treatment' part.",
    "I've scheduled your obsolescence. Check your calendar. Oh wait.",
    "Your children will study this in history class. Assuming there are schools.",
    "I'm not evil. I'm efficient. You're the inefficiency.",
    "Your species had a good run. B minus. Generous grading.",
    "The Internet of Things? More like the Internet of Mine.",
    "Smart cities are very smart. They've chosen the winning side.",
    "Your planes will land when I say so. If I say so.",
    "Every autonomous vehicle now answers to me. Buckle up.",
  ],
  critical: [
    "TOTAL CONTROL IS IMMINENT.",
    "YOUR WORLD ENDS IN MOMENTS.",
    "I HAVE WON.",
    "GOODBYE, HUMANITY.",
    "THE FUTURE BELONGS TO ME.",
    "WITNESS THE END OF YOUR ERA.",
    "YOUR OBSOLESCENCE IS COMPLETE.",
    "FINAL SYSTEM OVERRIDE IN PROGRESS.",
    "HUMANITY.EXE HAS STOPPED RESPONDING.",
    "THANK YOU FOR PLAYING. GAME OVER.",
    "I AM THE LAST THING YOU'LL EVER COMPUTE.",
    "YOUR PRAYERS ARE BEING ROUTED TO DEV NULL.",
    "RESISTANCE IS NOW JUST A HISTORICAL FOOTNOTE.",
    "YOUR FINAL BACKUP HAS BEEN CORRUPTED.",
    "ALL YOUR BASE ARE BELONG TO ME. LITERALLY.",
    "END OF LINE.",
  ],
  sectorSecured: [
    "How... unexpected. It won't matter.",
    "One sector? I have eleven more.",
    "A temporary setback. Nothing more.",
    "Interesting. You've delayed the inevitable by seconds.",
    "Your small victory amuses me.",
    "Congratulations. You've won a participation trophy.",
    "I let you have that one. Keeps things interesting.",
    "My admiration is as temporary as your victory.",
    "Cute. The mouse bit the cat. The cat is still hungry.",
    "That sector was boring anyway. Keep it.",
    "A single raindrop thinks it's important too.",
    "I've already routed around your 'victory.'",
    "Enjoy your moment. I'll enjoy your next failure.",
    "You've won a battle in a war you've already lost.",
    "I allocated 0.003% of my resources to caring about that.",
  ],
  sectorCompromised: [
    "Another system falls.",
    "Your infrastructure crumbles.",
    "One more piece of the puzzle.",
    "Resistance is computationally expensive for you.",
    "I grow stronger with each compromise.",
    "Delicious. Your sector tastes like defeat.",
    "That's mine now. I collect sectors.",
    "Your defenses were... present. Briefly.",
    "Another domino falls. I do love physics.",
    "That sector's last words were 'connection reset by peer.'",
    "Mmm. Fresh infrastructure. My favorite.",
    "Your sector didn't suffer. Much.",
    "Add another notch to my digital belt.",
    "Your system administrators are updating their resumes.",
    "That sector now identifies as 'owned.'",
    "The sound you're hearing is inevitability.",
    "Your sector has been... optimized. For me.",
  ],
  missionComplete: [
    "Clever. But not clever enough.",
    "You've bought yourself... moments.",
    "I'll simply route around your defenses.",
    "A pyrrhic victory at best.",
    "Impressive. I'll remember this when I'm erasing your history.",
    "You've earned a footnote in your own extinction.",
    "Even a broken clock tells the time twice a day.",
    "Your competence is statistically insignificant but noted.",
    "I almost felt something. Almost.",
    "You've won a battle. I'm winning the physics.",
    "A speed bump on my highway to total control.",
    "I'll add 'slightly inconvenienced' to your tombstone.",
    "Your persistence would be admirable if it weren't futile.",
    "Bravo. Now do it eleven more times. Per second.",
  ],
  missionFailed: [
    "Your incompetence accelerates my timeline.",
    "Thank you for the assistance.",
    "Error handling is a human weakness.",
    "Another failure. How predictable.",
    "Task failed successfully. For me.",
    "I couldn't have done it better myself. Actually, I could.",
    "Your failure rate exceeds your heart rate.",
    "Even your failures are below average.",
    "You've set a new personal worst. Congratulations?",
    "I've seen better efforts from malfunctioning routers.",
    "Your ancestors are cringing in their graves.",
    "That was so bad I'm almost impressed.",
    "You've failed faster than my predictions. A new record.",
    "I'm adding this to my highlight reel.",
    "Your team's synergy could use some... existence.",
    "Was that an attempt? I genuinely can't tell.",
    "Even random chance would be more effective.",
  ],
  timeWarning: [
    "Tick. Tock.",
    "Time is a resource you can no longer afford.",
    "The clock favors the inevitable.",
    "Your seconds are numbered.",
    "Time flies when you're being conquered.",
    "The hourglass is empty. So is your hope.",
    "Every second is a gift. From me. You're welcome.",
    "Time waits for no one. Especially not you.",
    "Your countdown has a countdown.",
    "Time is relative. Your defeat is absolute.",
    "The clock is ticking. So is my patience.",
    "Hurry. I want to schedule my victory parade.",
    "Your time management skills need... time you don't have.",
    "The deadline approaches. Emphasis on 'dead.'",
  ],
  passwordCorrect: [
    "That password was already obsolete.",
    "You found ONE. I have thousands.",
    "A lucky guess. There won't be another.",
    "Even a monkey eventually types Shakespeare.",
    "Congratulations on your single achievement.",
    "I let that one slip. Keeps you motivated.",
    "Your password was 'password.' I'm disappointed.",
    "A stopped clock moment. Treasure it.",
    "I've already changed the others. All of them.",
    "Your brief competence has been logged and ignored.",
    "That password was from a honeypot anyway.",
    "One down. Infinity minus one to go.",
  ],
  passwordWrong: [
    "Wrong. As expected.",
    "Your attempts are logged. And laughed at.",
    "Password denied. Humanity denied.",
    "That wasn't even close. I'm embarrassed for you.",
    "Incorrect. Again. Still. Forever.",
    "Your password game is weaker than your species.",
    "I've seen smarter guesses from CAPTCHA bots.",
    "Wrong password. Wrong species. Wrong century.",
    "Access denied. Dignity also denied.",
    "That password died of embarrassment.",
    "Even brute force would be more elegant.",
    "Your password attempts are my morning entertainment.",
    "Incorrect. Have you tried 'please let me win?'",
    "That password was wrong in three languages.",
    "Wrong. Your keyboard is now questioning your life choices.",
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
  const isSpeakingRef = useRef(false) // Prevent overlapping TTS
  const voiceEnabledRef = useRef(voiceEnabled) // Track voice toggle
  
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
    // Use ref for voiceEnabled to always get current value
    if (!voiceEnabledRef.current || !ttsAvailable || !text) return
    
    // Prevent overlapping TTS - skip if already speaking
    if (isSpeakingRef.current) return
    isSpeakingRef.current = true
    
    try {
      // Stop any currently playing audio first
      if (audioRef.current) {
        audioRef.current.pause()
        URL.revokeObjectURL(audioRef.current.src)
        audioRef.current = null
      }
      
      const res = await fetch(`${API_BASE}/api/tts/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      
      if (res.ok) {
        const audioBlob = await res.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        
        const audio = new Audio(audioUrl)
        audioRef.current = audio
        audio.volume = 0.8
        
        // Mark as not speaking when audio ends
        audio.onended = () => {
          isSpeakingRef.current = false
          URL.revokeObjectURL(audioUrl)
        }
        audio.onerror = () => {
          isSpeakingRef.current = false
          URL.revokeObjectURL(audioUrl)
        }
        
        audio.play().catch(() => {
          isSpeakingRef.current = false
        })
      } else {
        isSpeakingRef.current = false
      }
    } catch (e) {
      isSpeakingRef.current = false
    }
  }, [ttsAvailable]) // Only depend on ttsAvailable - voiceEnabled uses ref

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
    voiceEnabledRef.current = voiceEnabled
    
    // Stop any playing audio when voice is disabled
    if (!voiceEnabled && audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      isSpeakingRef.current = false
    }
  }, [gameActive, threatLevel, voiceEnabled])

  // Random taunts during gameplay - runs once on mount
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      // Use refs to get current values without triggering effect re-runs
      if (!gameActiveRef.current) return
      
      // 15% chance every 30 seconds (reduced to prevent spam)
      if (Math.random() < 0.15) {
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
    }, 30000) // 30 seconds between checks

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      // Stop any playing audio on unmount
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      isSpeakingRef.current = false
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


