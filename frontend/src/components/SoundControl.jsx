/**
 * Sound Control Component
 * Toggle and volume control for ambient sounds and TTS voice
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './SoundControl.css'

function SoundControl({ 
  isEnabled, 
  volume, 
  onToggle, 
  onVolumeChange,
  onInitialize,
  voiceEnabled,
  onVoiceToggle
}) {
  const [showVolume, setShowVolume] = useState(false)

  const handleSoundClick = () => {
    onInitialize?.() // Initialize audio context on first interaction
    onToggle?.()
  }

  const handleVoiceClick = () => {
    onInitialize?.()
    onVoiceToggle?.()
  }

  return (
    <div 
      className="sound-control"
      onMouseEnter={() => setShowVolume(true)}
      onMouseLeave={() => setShowVolume(false)}
    >
      {/* Ambient Sound Toggle */}
      <button 
        className={`sound-toggle ${isEnabled ? 'enabled' : 'disabled'}`}
        onClick={handleSoundClick}
        title={isEnabled ? 'Mute ambient sounds' : 'Enable ambient sounds'}
      >
        {isEnabled ? (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        )}
      </button>

      {/* Voice/TTS Toggle */}
      <button 
        className={`voice-toggle ${voiceEnabled ? 'enabled' : 'disabled'}`}
        onClick={handleVoiceClick}
        title={voiceEnabled ? 'Mute ARDN voice' : 'Enable ARDN voice'}
      >
        {voiceEnabled ? (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V20c0 .55.45 1 1 1s1-.45 1-1v-2.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
          </svg>
        )}
      </button>

      <AnimatePresence>
        {showVolume && isEnabled && (
          <motion.div 
            className="volume-slider"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            <input
              type="range"
              min="0"
              max="100"
              value={volume * 100}
              onChange={(e) => onVolumeChange?.(e.target.value / 100)}
              className="volume-range"
            />
            <span className="volume-value">{Math.round(volume * 100)}%</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SoundControl



