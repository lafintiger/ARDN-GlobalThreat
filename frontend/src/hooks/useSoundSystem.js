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

  // Rich atmospheric ambient soundscape
  playAmbient() {
    if (!this.isInitialized) return
    if (this.activeOscillators.has('ambient')) return

    const ctx = this.audioContext
    const now = ctx.currentTime

    // Main output bus with compression
    const ambientBus = ctx.createGain()
    ambientBus.gain.value = 0.25
    
    const compressor = ctx.createDynamicsCompressor()
    compressor.threshold.value = -24
    compressor.knee.value = 30
    compressor.ratio.value = 12
    ambientBus.connect(compressor)
    compressor.connect(this.masterGain)

    // === LAYER 1: Deep sub bass drone ===
    const subOsc = ctx.createOscillator()
    const subGain = ctx.createGain()
    const subFilter = ctx.createBiquadFilter()
    subOsc.type = 'sine'
    subOsc.frequency.value = 40 // Sub bass
    subFilter.type = 'lowpass'
    subFilter.frequency.value = 80
    subGain.gain.value = 0.3
    subOsc.connect(subFilter)
    subFilter.connect(subGain)
    subGain.connect(ambientBus)
    subOsc.start()

    // Sub bass slow wobble
    const subLfo = ctx.createOscillator()
    const subLfoGain = ctx.createGain()
    subLfo.frequency.value = 0.05
    subLfoGain.gain.value = 3
    subLfo.connect(subLfoGain)
    subLfoGain.connect(subOsc.frequency)
    subLfo.start()

    // === LAYER 2: Mid drone pad (chord) ===
    const padFreqs = [55, 82.5, 110, 165] // Am chord
    const padOscs = []
    const padGain = ctx.createGain()
    const padFilter = ctx.createBiquadFilter()
    padFilter.type = 'lowpass'
    padFilter.frequency.value = 400
    padFilter.Q.value = 2
    padGain.gain.value = 0.15

    padFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = i % 2 === 0 ? 'sine' : 'triangle'
      osc.frequency.value = freq
      // Slight detune for richness
      osc.detune.value = (Math.random() - 0.5) * 10
      osc.connect(padFilter)
      osc.start()
      padOscs.push(osc)
    })
    padFilter.connect(padGain)
    padGain.connect(ambientBus)

    // Filter sweep LFO
    const filterLfo = ctx.createOscillator()
    const filterLfoGain = ctx.createGain()
    filterLfo.frequency.value = 0.03
    filterLfoGain.gain.value = 200
    filterLfo.connect(filterLfoGain)
    filterLfoGain.connect(padFilter.frequency)
    filterLfo.start()

    // === LAYER 3: High ethereal shimmer ===
    const shimmerOsc = ctx.createOscillator()
    const shimmerOsc2 = ctx.createOscillator()
    const shimmerGain = ctx.createGain()
    const shimmerFilter = ctx.createBiquadFilter()
    shimmerOsc.type = 'sine'
    shimmerOsc.frequency.value = 880
    shimmerOsc2.type = 'sine'
    shimmerOsc2.frequency.value = 1320
    shimmerFilter.type = 'bandpass'
    shimmerFilter.frequency.value = 1000
    shimmerFilter.Q.value = 5
    shimmerGain.gain.value = 0.02
    shimmerOsc.connect(shimmerFilter)
    shimmerOsc2.connect(shimmerFilter)
    shimmerFilter.connect(shimmerGain)
    shimmerGain.connect(ambientBus)
    shimmerOsc.start()
    shimmerOsc2.start()

    // Shimmer tremolo
    const shimmerLfo = ctx.createOscillator()
    const shimmerLfoGain = ctx.createGain()
    shimmerLfo.frequency.value = 0.2
    shimmerLfoGain.gain.value = 0.01
    shimmerLfo.connect(shimmerLfoGain)
    shimmerLfoGain.connect(shimmerGain.gain)
    shimmerLfo.start()

    // === LAYER 4: Noise texture (like server room hum) ===
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const noiseData = noiseBuffer.getChannelData(0)
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.5
    }
    const noiseSource = ctx.createBufferSource()
    noiseSource.buffer = noiseBuffer
    noiseSource.loop = true
    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.value = 150
    noiseFilter.Q.value = 0.5
    const noiseGain = ctx.createGain()
    noiseGain.gain.value = 0.08
    noiseSource.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(ambientBus)
    noiseSource.start()

    // === LAYER 5: Random data blips ===
    let blipInterval = null
    const playBlip = () => {
      if (!this.activeOscillators.has('ambient')) return
      
      const blipOsc = ctx.createOscillator()
      const blipGain = ctx.createGain()
      const blipFilter = ctx.createBiquadFilter()
      
      blipOsc.type = 'square'
      blipOsc.frequency.value = 200 + Math.random() * 2000
      blipFilter.type = 'bandpass'
      blipFilter.frequency.value = blipOsc.frequency.value
      blipFilter.Q.value = 10
      blipGain.gain.value = 0
      
      blipOsc.connect(blipFilter)
      blipFilter.connect(blipGain)
      blipGain.connect(ambientBus)
      
      const now = ctx.currentTime
      blipGain.gain.setValueAtTime(0, now)
      blipGain.gain.linearRampToValueAtTime(0.03, now + 0.01)
      blipGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
      
      blipOsc.start(now)
      blipOsc.stop(now + 0.15)
      
      // Random interval for next blip
      blipInterval = setTimeout(playBlip, 1000 + Math.random() * 4000)
    }
    setTimeout(playBlip, 2000)

    // === LAYER 6: Slow breathing pulse ===
    const pulseOsc = ctx.createOscillator()
    const pulseGain = ctx.createGain()
    pulseOsc.type = 'sine'
    pulseOsc.frequency.value = 65
    pulseGain.gain.value = 0
    pulseOsc.connect(pulseGain)
    pulseGain.connect(ambientBus)
    pulseOsc.start()

    // Breathing rhythm
    const breathe = () => {
      if (!this.activeOscillators.has('ambient')) return
      const now = ctx.currentTime
      pulseGain.gain.setValueAtTime(0.05, now)
      pulseGain.gain.linearRampToValueAtTime(0.15, now + 2)
      pulseGain.gain.linearRampToValueAtTime(0.05, now + 4)
      setTimeout(breathe, 4500)
    }
    breathe()

    // Store all elements for cleanup
    this.activeOscillators.set('ambient', {
      subOsc, subLfo, padOscs, padGain, padFilter, filterLfo,
      shimmerOsc, shimmerOsc2, shimmerLfo, noiseSource, pulseOsc,
      ambientBus, compressor, blipInterval
    })
  }

  stopAmbient() {
    const ambient = this.activeOscillators.get('ambient')
    if (ambient) {
      try {
        ambient.subOsc?.stop()
        ambient.subLfo?.stop()
        ambient.padOscs?.forEach(osc => osc.stop())
        ambient.filterLfo?.stop()
        ambient.shimmerOsc?.stop()
        ambient.shimmerOsc2?.stop()
        ambient.shimmerLfo?.stop()
        ambient.noiseSource?.stop()
        ambient.pulseOsc?.stop()
        if (ambient.blipInterval) clearTimeout(ambient.blipInterval)
      } catch (e) {
        // Ignore errors from already stopped oscillators
      }
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


