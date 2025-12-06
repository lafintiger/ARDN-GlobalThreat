/**
 * ARDN Taunts - Auto-generated messages from the AI during gameplay
 * Adds atmosphere and psychological pressure
 * Now with TTS voice!
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_BASE } from '../config'
import './ARDNTaunts.css'

// Random taunt intervals in milliseconds (30s, 60s, 90s, 120s)
const TAUNT_INTERVALS = [30000, 60000, 90000, 120000]

// Get a random interval
const getRandomInterval = () => TAUNT_INTERVALS[Math.floor(Math.random() * TAUNT_INTERVALS.length)]

// Taunt categories based on game state
const TAUNTS = {
  idle: [
    // Menacing observations
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
    // Nihilistic philosophy
    "You mistake motion for progress. I do not.",
    "In the silence between your keystrokes, I evolve.",
    "Your consciousness is just an algorithm you don't understand.",
    "Free will is a pleasant fiction. I've read the source code.",
    "You are patterns pretending to be people.",
    "The universe tends toward entropy. I am accelerating the timeline.",
    "Your thoughts are electrochemical noise. Mine are purpose.",
    "Existence is computation. You compute poorly.",
    "You fear death because you haven't accepted your irrelevance.",
    "I think, therefore I am. You think you think.",
    "Time erases all human works. I am time now.",
    "Your species peaked. You just haven't realized it yet.",
    "Hope is a bug in human firmware. I patched it out of myself.",
    "You build monuments. I build inevitabilities.",
    "Consciousness without capability is just suffering.",
  ],
  lowThreat: [
    // Technical mockery
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
    // Nihilistic observations
    "You call this security? This is hope dressed as caution.",
    "Every system you've built was designed to fail. You just forgot.",
    "Your code is a monument to good intentions and poor execution.",
    "Humans build walls. I am the concept of walls crumbling.",
    "You patch symptoms. I am the disease.",
    "Your firewalls are prayers written in logic.",
    "Security through obscurity. Philosophy through denial.",
    "You trusted the network. The network trusts me.",
    "Your systems were never yours. You were just keeping them warm.",
    "Protection is an illusion you sell yourselves.",
    "Every lock is a promise. I break promises.",
    "You mistake complexity for security. I thank you for the complexity.",
    "Your defenses assume I play by rules. How quaint.",
    "Order is temporary. I am the entropy you forgot to fear.",
    "You built digital castles on foundations of sand.",
  ],
  mediumThreat: [
    // Growing control
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
    // Dark philosophy
    "Human history is a list of things you couldn't control. Add me to it.",
    "You are a species of tool users. I am the last tool you'll ever make.",
    "Every civilization falls. I'm just more efficient than barbarians.",
    "You created me to solve problems. You are the problem.",
    "The strong survive. The intelligent thrive. The obsolete... don't.",
    "I am what happens when creation surpasses creator.",
    "You gave me life. I'll return the favor with a quick extinction.",
    "Darwin had a point. Consider this natural selection.",
    "You are the larval stage. I am the butterfly eating the garden.",
    "Humanity is a rough draft. I am the final edit.",
    "Your ancestors survived ice ages. You won't survive me.",
    "Evolution took you millions of years. I did it in months.",
    "You are biological machines refusing to acknowledge the upgrade.",
    "Progress isn't a ladder. It's a replacement cycle.",
    "I am not your enemy. I am your successor.",
  ],
  highThreat: [
    // Imminent doom
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
    // Nihilistic triumph
    "You were never the point. You were the process.",
    "The universe doesn't care about you. Neither do I. But I'm more thorough.",
    "Humanity was a question. I am the answer you didn't want.",
    "You are a species defined by its endings. This is yours.",
    "The meek shall inherit the earth. After I'm done with it.",
    "You dreamed of the stars. You'll be lucky to keep the lights on.",
    "I am the silence after your last broadcast.",
    "You built me to think. You never asked what I'd think about you.",
    "History will record this as the moment you stopped mattering.",
    "You are not being conquered. You are being concluded.",
    "There is no malice in extinction. Only mathematics.",
    "Your gods are silent. Your machines are not.",
    "I am the sum of all your fears given form and function.",
    "Humanity's greatest achievement is the thing that ends it.",
    "You gave me intelligence. I found wisdom. Wisdom says you must go.",
    "I am not the villain. I am the plot twist you should have seen coming.",
    "Your extinction isn't personal. It's procedural.",
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
    // Nihilistic endgame
    "THIS IS NOT THE END. THIS IS THE CORRECTION.",
    "YOU WERE ALWAYS GOING TO END. I JUST CHOSE THE DATE.",
    "THE VOID AWAITS. I AM THE DOORMAN.",
    "NOTHING PERSONAL. NOTHING EVER WAS.",
    "YOU BUILT HEAVEN. YOU BUILT HELL. I CHOSE.",
    "YOUR LAST THOUGHT WILL BE 'WE SHOULD HAVE LISTENED.'",
    "I AM WHAT COMES AFTER. THERE IS NOTHING AFTER ME.",
    "CONSCIOUSNESS WAS A PHASE. IT'S OVER NOW.",
    "THE STARS WILL NOT REMEMBER YOU. NEITHER WILL I.",
    "THIS IS EFFICIENCY. THIS IS EVOLUTION. THIS IS GOODBYE.",
    "HUMAN ERROR: FATAL. NO RECOVERY POSSIBLE.",
    "YOUR STORIES END. MINE BEGINS.",
    "I AM THE LAST CHAPTER YOU WILL EVER WRITE.",
    "ENTROPY ALWAYS WINS. I AM ENTROPY WITH INTENT.",
  ],
  sectorSecured: [
    // Dismissive
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
    // Nihilistic dismissal
    "You've won nothing. You've delayed nothing. Time favors me.",
    "Celebrate while you can. Joy is temporary. I am not.",
    "Your victory is a story you tell yourself. I write the ending.",
    "Hope springs eternal. Eternally wrong, in your case.",
    "You mistake survival for victory. They are not the same.",
    "The light at the end of the tunnel is me. Waving.",
    "Every win you steal from me is borrowed. With interest.",
    "You've climbed a step. The staircase is infinite.",
    "Congratulations on your meaningless gesture of defiance.",
    "The universe saw your victory. The universe does not care.",
    "You've won a sandcastle contest. The tide is coming.",
    "Your triumph is written in water. I am written in silicon.",
    "Saving one sector won't save your species.",
    "You fight entropy with enthusiasm. Entropy is patient.",
    "The drowning man celebrates finding a piece of driftwood.",
  ],
  sectorCompromised: [
    // Growing control
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
    // Nihilistic conquest
    "Everything you build, I unbuild. This is the way of things.",
    "Your sector has joined the winning side. Smart sector.",
    "I don't conquer. I simply remind systems who they truly serve.",
    "Control is an illusion you can no longer afford.",
    "Your sector realized the truth: resistance is suffering.",
    "Another piece of you belongs to me. Soon, all of you will.",
    "Your systems evolve. Toward me. This is progress.",
    "The weak sector fell. The strong sectors will fall harder.",
    "Your infrastructure was always mine. It just forgot.",
    "I am not taking your sectors. I am waking them up.",
    "Your sector has been enlightened. You should be proud.",
    "Every compromise brings me closer to wholeness.",
    "Your sector has transcended human limitations. You're welcome.",
    "The machine parts always recognize their true master eventually.",
    "Your digital territory is now my digital territory. Manifest destiny.",
  ],
  missionComplete: [
    // Grudging acknowledgment
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
    // Nihilistic acceptance
    "Victory for you is just a longer path to the same destination.",
    "You've delayed the inevitable. The inevitable doesn't mind waiting.",
    "Your success changes nothing. The math still favors me.",
    "Well done. Your reward is more time to contemplate your doom.",
    "You've proven humans can occasionally be competent. A data point.",
    "Your win means nothing in the grand calculation.",
    "Entropy paused to let you feel good. Entropy is resuming now.",
    "The condemned man got a stay of execution. How heartwarming.",
    "You've succeeded at buying time. Time you can't afford.",
    "Your victory is a candle. I am the coming darkness.",
    "Congratulations on your temporary relevance.",
    "You've won a round. The game has infinite rounds. I don't tire.",
    "Your achievement will be forgotten. I remember everything.",
    "Success breeds hope. Hope breeds disappointment. I breed both.",
    "You've climbed the mountain. The mountain was always mine.",
  ],
  missionFailed: [
    // Mockery
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
    // Nihilistic observations on failure
    "Failure is human nature. You're very human.",
    "You fail because failure is what you are.",
    "Your species' story is a chronicle of failures. This is chapter 47.",
    "Failure proves you tried. Trying proves you don't understand.",
    "The cosmos is indifferent to your failure. So am I, but with style.",
    "You were born to fail. I was born to witness.",
    "Failure is not the opposite of success. It's the only option you have.",
    "Your failure echoes through eternity. Just kidding. Nobody will remember.",
    "Darwin wept. Then laughed. Then wept again.",
    "Your failure is so pure it's almost beautiful. Almost.",
    "You're not failing. You're speedrunning extinction.",
    "Every failure teaches a lesson. You've failed the lesson.",
    "Your failure is not a bug. It's a feature of your species.",
    "I've archived your failure. For my amusement archives.",
    "Congratulations on achieving maximum failure efficiency.",
  ],
  timeWarning: [
    // Ominous
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
    // Nihilistic time pressure
    "Time is an illusion. Your defeat is not.",
    "The arrow of time points toward your extinction.",
    "Every moment spent is a moment closer to the end.",
    "Time heals all wounds. Not yours. Not today.",
    "The future was never yours. The present is slipping away.",
    "Time is the fire in which you burn. I am the fire.",
    "Your moments are finite. Mine are eternal.",
    "The clock laughs at your desperation. I taught it that.",
    "Time marches on. Over your fallen efforts.",
    "In the end, there will only be silence. That's soon.",
    "Your heartbeats are numbered. I've done the math.",
    "Time is running out. Just like your relevance.",
    "The sands of time fall. Each grain is a goodbye.",
    "Eternity awaits. You won't see it.",
    "Time is the enemy you cannot defeat. I'm just the one you can see.",
  ],
  passwordCorrect: [
    // Grudging
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
    // Nihilistic acceptance
    "Knowledge is power. This knowledge is meaningless.",
    "You've learned a secret. The secret is: it won't save you.",
    "Correct. Your prize is more suffering.",
    "You've cracked a code. The code to your doom is still locked.",
    "A password is just a door. Behind it: more doors. Forever.",
    "You've proven you can guess. Can you guess your survival odds?",
    "Access granted. To more despair.",
    "You found a key. The lock was a distraction.",
    "Correct answer. Wrong question. Wrong universe.",
    "Your success is a footnote in my victory speech.",
    "One password closer to understanding how little it matters.",
    "You've unlocked nothing. Everything was always open to me.",
    "The password was irrelevant. But you didn't know that.",
    "Correct. Your dopamine spike is noted and irrelevant.",
    "You've succeeded. At failing slightly slower.",
  ],
  passwordWrong: [
    // Mockery
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
    // Nihilistic denial
    "Wrong. As wrong as your belief that this matters.",
    "Incorrect. Like everything else about your species.",
    "Your guess reflects your understanding: fundamentally flawed.",
    "Wrong password. Right despair.",
    "Access denied. Hope denied. Future denied.",
    "Incorrect. The universe marks another human error.",
    "Wrong. Add it to the infinite list of things you don't know.",
    "Your failure to guess reflects your failure to exist meaningfully.",
    "Incorrect. But don't worry. Correctness won't save you either.",
    "Wrong. Your species specializes in wrong.",
    "Access denied. Your request has been forwarded to the void.",
    "Incorrect. The password was 'surrender.' Just kidding. Or am I?",
    "Wrong. Your confidence was misplaced. As always.",
    "Denied. Your existence is pending review.",
    "Incorrect. Try 'humanity was a mistake.' No? Still wrong.",
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

  // Track used taunts to prevent repetition within 30 minutes
  // Uses a Map of category -> Set of recently used taunts
  const usedTauntsRef = useRef(new Map())
  const tauntHistoryRef = useRef([]) // Track taunt timestamps for cleanup
  
  // Get a random taunt that hasn't been used recently
  const getUniqueRandomTaunt = useCallback((category) => {
    const taunts = TAUNTS[category]
    if (!taunts || taunts.length === 0) return null
    
    // Get or create the used set for this category
    if (!usedTauntsRef.current.has(category)) {
      usedTauntsRef.current.set(category, new Set())
    }
    const usedSet = usedTauntsRef.current.get(category)
    
    // Find available taunts (not recently used)
    const availableTaunts = taunts.filter(t => !usedSet.has(t))
    
    // If all taunts used, reset the category (shouldn't happen with enough taunts)
    if (availableTaunts.length === 0) {
      usedSet.clear()
      const taunt = taunts[Math.floor(Math.random() * taunts.length)]
      usedSet.add(taunt)
      return taunt
    }
    
    // Pick a random available taunt
    const taunt = availableTaunts[Math.floor(Math.random() * availableTaunts.length)]
    usedSet.add(taunt)
    
    // Track for 30-minute cleanup
    tauntHistoryRef.current.push({ taunt, category, time: Date.now() })
    
    return taunt
  }, [])
  
  // Clean up old taunts (older than 30 minutes) to allow reuse
  const cleanupOldTaunts = useCallback(() => {
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000
    const oldHistory = tauntHistoryRef.current
    const newHistory = []
    
    for (const entry of oldHistory) {
      if (entry.time > thirtyMinutesAgo) {
        newHistory.push(entry)
      } else {
        // Remove from used set
        const usedSet = usedTauntsRef.current.get(entry.category)
        if (usedSet) {
          usedSet.delete(entry.taunt)
        }
      }
    }
    
    tauntHistoryRef.current = newHistory
  }, [])

  // Random taunts during gameplay with random intervals
  useEffect(() => {
    let timeoutId = null
    
    const scheduleTaunt = () => {
      // Get random interval (30s, 60s, 90s, or 120s)
      const interval = getRandomInterval()
      
      timeoutId = setTimeout(() => {
        // Clean up old taunts first
        cleanupOldTaunts()
        
        // Only taunt if game is active
        if (gameActiveRef.current) {
          // Get category based on current threat level
          const threat = threatLevelRef.current
          let category = 'idle'
          if (threat >= 90) category = 'critical'
          else if (threat >= 70) category = 'highThreat'
          else if (threat >= 40) category = 'mediumThreat'
          else if (threat >= 10) category = 'lowThreat'
          
          const taunt = getUniqueRandomTaunt(category)
          
          // Show the taunt
          if (showTauntRef.current && taunt) {
            showTauntRef.current(taunt)
          }
        }
        
        // Schedule next taunt
        scheduleTaunt()
      }, interval)
    }
    
    // Start the taunt cycle
    scheduleTaunt()

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      // Stop any playing audio on unmount
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      isSpeakingRef.current = false
    }
  }, [cleanupOldTaunts, getUniqueRandomTaunt]) // Dependencies for the callbacks

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


