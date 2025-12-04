/**
 * Music Player Component
 * Plays MP3 files for atmosphere during the game
 */

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './MusicPlayer.css'

// Playlist - add your MP3 files to public/music/ folder
const PLAYLIST = [
  { name: 'Track 1', file: '/music/track1.mp3' },
  { name: 'Track 2', file: '/music/track2.mp3' },
  { name: 'Track 3', file: '/music/track3.mp3' },
  { name: 'Track 4', file: '/music/track4.mp3' },
  { name: 'Track 5', file: '/music/track5.mp3' },
]

function MusicPlayer({ isExpanded = false, onToggle }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(0)
  const [volume, setVolume] = useState(0.5)
  const [shuffle, setShuffle] = useState(false)
  const [loop, setLoop] = useState(true)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [hasError, setHasError] = useState(false)
  const audioRef = useRef(null)

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.volume = volume
    
    audioRef.current.addEventListener('ended', handleTrackEnd)
    audioRef.current.addEventListener('timeupdate', handleTimeUpdate)
    audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata)
    audioRef.current.addEventListener('error', handleError)
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.removeEventListener('ended', handleTrackEnd)
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate)
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata)
        audioRef.current.removeEventListener('error', handleError)
      }
    }
  }, [])

  // Load track when changed
  useEffect(() => {
    if (audioRef.current && PLAYLIST[currentTrack]) {
      setHasError(false)
      audioRef.current.src = PLAYLIST[currentTrack].file
      if (isPlaying) {
        audioRef.current.play().catch(() => setHasError(true))
      }
    }
  }, [currentTrack])

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  const handleError = () => {
    setHasError(true)
  }

  const handleLoadedMetadata = () => {
    setDuration(audioRef.current?.duration || 0)
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime)
    }
  }

  const handleTrackEnd = () => {
    if (shuffle) {
      const nextTrack = Math.floor(Math.random() * PLAYLIST.length)
      setCurrentTrack(nextTrack)
    } else if (loop) {
      const nextTrack = (currentTrack + 1) % PLAYLIST.length
      setCurrentTrack(nextTrack)
    } else {
      setIsPlaying(false)
    }
  }

  const togglePlay = () => {
    if (!audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(() => setHasError(true))
    }
    setIsPlaying(!isPlaying)
  }

  const nextTrack = () => {
    if (shuffle) {
      setCurrentTrack(Math.floor(Math.random() * PLAYLIST.length))
    } else {
      setCurrentTrack((currentTrack + 1) % PLAYLIST.length)
    }
  }

  const prevTrack = () => {
    if (progress > 3) {
      // If more than 3 seconds in, restart track
      audioRef.current.currentTime = 0
    } else {
      setCurrentTrack((currentTrack - 1 + PLAYLIST.length) % PLAYLIST.length)
    }
  }

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    if (audioRef.current && duration) {
      audioRef.current.currentTime = percent * duration
    }
  }

  return (
    <div className={`music-player ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Mini Player (always visible) */}
      <div className="mini-player" onClick={onToggle}>
        <button 
          className={`mini-play-btn ${isPlaying ? 'playing' : ''}`}
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <span className="mini-track-name">
          {hasError ? '⚠ No music files' : (PLAYLIST[currentTrack]?.name || 'No Track')}
        </span>
        <span className="mini-expand">🎵</span>
      </div>

      {/* Expanded Player */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            className="expanded-player"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {/* Track Info */}
            <div className="track-info">
              <span className="track-name">{PLAYLIST[currentTrack]?.name || 'Unknown'}</span>
              <span className="track-time">
                {formatTime(progress)} / {formatTime(duration)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="progress-bar" onClick={handleSeek}>
              <div 
                className="progress-fill" 
                style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
              />
            </div>

            {/* Controls */}
            <div className="player-controls">
              <button 
                className={`ctrl-btn ${shuffle ? 'active' : ''}`}
                onClick={() => setShuffle(!shuffle)}
                title="Shuffle"
              >
                🔀
              </button>
              <button className="ctrl-btn" onClick={prevTrack} title="Previous">
                ⏮
              </button>
              <button 
                className={`play-btn ${isPlaying ? 'playing' : ''}`}
                onClick={togglePlay}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button className="ctrl-btn" onClick={nextTrack} title="Next">
                ⏭
              </button>
              <button 
                className={`ctrl-btn ${loop ? 'active' : ''}`}
                onClick={() => setLoop(!loop)}
                title="Loop"
              >
                🔁
              </button>
            </div>

            {/* Volume */}
            <div className="volume-control">
              <span className="volume-icon">{volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume * 100}
                onChange={(e) => setVolume(e.target.value / 100)}
                className="volume-slider"
              />
            </div>

            {/* Playlist */}
            <div className="playlist">
              {PLAYLIST.map((track, index) => (
                <div 
                  key={index}
                  className={`playlist-item ${index === currentTrack ? 'active' : ''}`}
                  onClick={() => setCurrentTrack(index)}
                >
                  <span className="playlist-num">{index + 1}</span>
                  <span className="playlist-name">{track.name}</span>
                  {index === currentTrack && isPlaying && (
                    <span className="playing-indicator">♪</span>
                  )}
                </div>
              ))}
            </div>

            {hasError && (
              <div className="music-hint">
                Add MP3 files to <code>public/music/</code> folder
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MusicPlayer

