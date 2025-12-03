/**
 * Sound System for A.R.D.N.
 * Handles all audio effects for immersion
 */

import { useEffect, useRef, useCallback, useState } from 'react'

// Sound URLs - using Web Audio API generated tones and free sound effects
const SOUNDS = {
  // We'll generate these programmatically
  ambient: null,      // Low drone
  alarm: null,        // Warning alarm
  heartbeat: null,    // Tension heartbeat
  critical: null,     // Critical alert
  success: null,      // Mission complete
  failure: null,      // Mission failed
  secure: null,       // Sector secured
  typing: null,       // Terminal typing
  glitch: null,       // Glitch sound
  countdown: null,    // Final countdown beep
}

class SoundGenerator {
  constructor() {
    this.audioContext = null
    this.masterGain = null
    this.isInitialized = false
    this.activeOscillators = new Map()
  }

  init() {
    if (this.isInitialized) {
      // If already initialized but suspended, resume
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume()
      }
      return
    }
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      this.masterGain = this.audioContext.createGain()
      this.masterGain.connect(this.audioContext.destination)
      this.masterGain.gain.value = 0.3
      this.isInitialized = true
      
      // Resume if suspended (required by browsers)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume()
      }
      
      console.log('Sound system initialized')
    } catch (e) {
      console.warn('Web Audio API not supported:', e)
    }
  }

  setMasterVolume(volume) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume))
    }
  }

  // Dark ambient drone
  playAmbient() {
    if (!this.isInitialized) return
    if (this.activeOscillators.has('ambient')) return

    const osc1 = this.audioContext.createOscillator()
    const osc2 = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    const filter = this.audioContext.createBiquadFilter()

    osc1.type = 'sine'
    osc1.frequency.value = 55 // Low A
    osc2.type = 'sine'
    osc2.frequency.value = 82.5 // E

    filter.type = 'lowpass'
    filter.frequency.value = 200

    gain.gain.value = 0.15

    osc1.connect(filter)
    osc2.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    osc1.start()
    osc2.start()

    // Slow LFO modulation
    const lfo = this.audioContext.createOscillator()
    const lfoGain = this.audioContext.createGain()
    lfo.frequency.value = 0.1
    lfoGain.gain.value = 10
    lfo.connect(lfoGain)
    lfoGain.connect(osc1.frequency)
    lfo.start()

    this.activeOscillators.set('ambient', { osc1, osc2, gain, lfo })
  }

  stopAmbient() {
    const ambient = this.activeOscillators.get('ambient')
    if (ambient) {
      ambient.osc1.stop()
      ambient.osc2.stop()
      ambient.lfo.stop()
      this.activeOscillators.delete('ambient')
    }
  }

  // Warning alarm - pulsing tone
  playAlarm() {
    if (!this.isInitialized) return
    if (this.activeOscillators.has('alarm')) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'square'
    osc.frequency.value = 440

    gain.gain.value = 0

    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start()

    // Pulsing effect
    const pulse = () => {
      if (!this.activeOscillators.has('alarm')) return
      const now = this.audioContext.currentTime
      gain.gain.setValueAtTime(0.2, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
      setTimeout(pulse, 600)
    }
    pulse()

    this.activeOscillators.set('alarm', { osc, gain })
  }

  stopAlarm() {
    const alarm = this.activeOscillators.get('alarm')
    if (alarm) {
      alarm.osc.stop()
      this.activeOscillators.delete('alarm')
    }
  }

  // Heartbeat for tension
  playHeartbeat() {
    if (!this.isInitialized) return
    if (this.activeOscillators.has('heartbeat')) return

    const beat = () => {
      if (!this.activeOscillators.has('heartbeat')) return

      // Double beat pattern
      const playBeat = (delay) => {
        setTimeout(() => {
          if (!this.activeOscillators.has('heartbeat')) return
          const osc = this.audioContext.createOscillator()
          const gain = this.audioContext.createGain()
          
          osc.type = 'sine'
          osc.frequency.value = 60
          gain.gain.value = 0.3
          
          osc.connect(gain)
          gain.connect(this.masterGain)
          
          osc.start()
          gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15)
          osc.stop(this.audioContext.currentTime + 0.15)
        }, delay)
      }

      playBeat(0)
      playBeat(150)
      setTimeout(beat, 800)
    }
    
    this.activeOscillators.set('heartbeat', { active: true })
    beat()
  }

  stopHeartbeat() {
    this.activeOscillators.delete('heartbeat')
  }

  // Critical alert - high pitched warning
  playCritical() {
    if (!this.isInitialized) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'sawtooth'
    osc.frequency.value = 880

    gain.gain.value = 0.25

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start()
    
    // Siren effect
    osc.frequency.setValueAtTime(880, this.audioContext.currentTime)
    osc.frequency.linearRampToValueAtTime(1200, this.audioContext.currentTime + 0.5)
    osc.frequency.linearRampToValueAtTime(880, this.audioContext.currentTime + 1)
    
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1)
    osc.stop(this.audioContext.currentTime + 1)
  }

  // Success sound
  playSuccess() {
    if (!this.isInitialized) return

    const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
    
    notes.forEach((freq, i) => {
      setTimeout(() => {
        const osc = this.audioContext.createOscillator()
        const gain = this.audioContext.createGain()

        osc.type = 'sine'
        osc.frequency.value = freq
        gain.gain.value = 0.2

        osc.connect(gain)
        gain.connect(this.masterGain)

        osc.start()
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3)
        osc.stop(this.audioContext.currentTime + 0.3)
      }, i * 100)
    })
  }

  // Failure sound
  playFailure() {
    if (!this.isInitialized) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'sawtooth'
    osc.frequency.value = 200

    gain.gain.value = 0.25

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start()
    osc.frequency.linearRampToValueAtTime(80, this.audioContext.currentTime + 0.5)
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5)
    osc.stop(this.audioContext.currentTime + 0.5)
  }

  // Sector secured
  playSecure() {
    if (!this.isInitialized) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'triangle'
    osc.frequency.value = 800

    gain.gain.value = 0.2

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start()
    osc.frequency.linearRampToValueAtTime(1200, this.audioContext.currentTime + 0.2)
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4)
    osc.stop(this.audioContext.currentTime + 0.4)
  }

  // Glitch sound
  playGlitch() {
    if (!this.isInitialized) return

    const bufferSize = this.audioContext.sampleRate * 0.1
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const noise = this.audioContext.createBufferSource()
    const gain = this.audioContext.createGain()

    noise.buffer = buffer
    gain.gain.value = 0.15

    noise.connect(gain)
    gain.connect(this.masterGain)

    noise.start()
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1)
  }

  // Countdown beep
  playCountdown() {
    if (!this.isInitialized) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'sine'
    osc.frequency.value = 1000

    gain.gain.value = 0.3

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1)
    osc.stop(this.audioContext.currentTime + 0.1)
  }

  // Typing click
  playTyping() {
    if (!this.isInitialized) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'square'
    osc.frequency.value = 4000 + Math.random() * 1000

    gain.gain.value = 0.05

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start()
    osc.stop(this.audioContext.currentTime + 0.02)
  }

  stopAll() {
    this.stopAmbient()
    this.stopAlarm()
    this.stopHeartbeat()
  }
}

// Singleton instance
const soundGenerator = new SoundGenerator()

export function useSoundSystem() {
  const [isEnabled, setIsEnabled] = useState(true)
  const [volume, setVolume] = useState(0.3)
  const initialized = useRef(false)

  const initSound = useCallback(() => {
    if (!initialized.current) {
      soundGenerator.init()
      initialized.current = true
    } else {
      // Resume if already initialized but suspended
      soundGenerator.init()
    }
  }, [])

  // Auto-initialize on first user interaction (required by browsers)
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!initialized.current) {
        soundGenerator.init()
        initialized.current = true
      } else if (soundGenerator.audioContext?.state === 'suspended') {
        soundGenerator.audioContext.resume()
      }
    }

    // Listen for any user interaction
    document.addEventListener('click', handleUserInteraction, { once: false })
    document.addEventListener('keydown', handleUserInteraction, { once: false })
    document.addEventListener('touchstart', handleUserInteraction, { once: false })

    return () => {
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('keydown', handleUserInteraction)
      document.removeEventListener('touchstart', handleUserInteraction)
    }
  }, [])

  const toggleSound = useCallback(() => {
    setIsEnabled(prev => !prev)
    if (isEnabled) {
      soundGenerator.stopAll()
    }
  }, [isEnabled])

  const setMasterVolume = useCallback((vol) => {
    setVolume(vol)
    soundGenerator.setMasterVolume(vol)
  }, [])

  const playAmbient = useCallback(() => {
    if (isEnabled) {
      initSound()
      soundGenerator.playAmbient()
    }
  }, [isEnabled, initSound])

  const stopAmbient = useCallback(() => {
    soundGenerator.stopAmbient()
  }, [])

  const playAlarm = useCallback(() => {
    if (isEnabled) {
      initSound()
      soundGenerator.playAlarm()
    }
  }, [isEnabled, initSound])

  const stopAlarm = useCallback(() => {
    soundGenerator.stopAlarm()
  }, [])

  const playHeartbeat = useCallback(() => {
    if (isEnabled) {
      initSound()
      soundGenerator.playHeartbeat()
    }
  }, [isEnabled, initSound])

  const stopHeartbeat = useCallback(() => {
    soundGenerator.stopHeartbeat()
  }, [])

  const playCritical = useCallback(() => {
    if (isEnabled) {
      initSound()
      soundGenerator.playCritical()
    }
  }, [isEnabled, initSound])

  const playSuccess = useCallback(() => {
    if (isEnabled) {
      initSound()
      soundGenerator.playSuccess()
    }
  }, [isEnabled, initSound])

  const playFailure = useCallback(() => {
    if (isEnabled) {
      initSound()
      soundGenerator.playFailure()
    }
  }, [isEnabled, initSound])

  const playSecure = useCallback(() => {
    if (isEnabled) {
      initSound()
      soundGenerator.playSecure()
    }
  }, [isEnabled, initSound])

  const playGlitch = useCallback(() => {
    if (isEnabled) {
      initSound()
      soundGenerator.playGlitch()
    }
  }, [isEnabled, initSound])

  const playCountdown = useCallback(() => {
    if (isEnabled) {
      initSound()
      soundGenerator.playCountdown()
    }
  }, [isEnabled, initSound])

  const playTyping = useCallback(() => {
    if (isEnabled) {
      initSound()
      soundGenerator.playTyping()
    }
  }, [isEnabled, initSound])

  const stopAll = useCallback(() => {
    soundGenerator.stopAll()
  }, [])

  return {
    isEnabled,
    volume,
    toggleSound,
    setMasterVolume,
    playAmbient,
    stopAmbient,
    playAlarm,
    stopAlarm,
    playHeartbeat,
    stopHeartbeat,
    playCritical,
    playSuccess,
    playFailure,
    playSecure,
    playGlitch,
    playCountdown,
    playTyping,
    stopAll,
    initSound
  }
}

export default useSoundSystem


