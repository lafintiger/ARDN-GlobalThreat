"""
Text-to-Speech service for A.R.D.N.
Uses pyttsx3 for local development (works on all Python versions)
Uses Piper for Docker deployment (higher quality neural voice)
Includes pitch shifting to make voice more ominous
"""

import os
import io
import wave
import asyncio
import tempfile
from pathlib import Path
from typing import Optional
import struct
import numpy as np
from scipy import signal

class TTSService:
    def __init__(self):
        self.enabled = True
        self.voice_model = "system-default"  # Will be updated if Piper is used
        self._initialized = False
        self._engine = None
        self._engine_type = None  # 'pyttsx3' or 'piper'
        self._piper_voice = None
    
    def _process_text_for_ardn(self, text: str) -> str:
        """
        Transform text for robotic, deliberate ARDN delivery:
        - Expand contractions for robotic feel
        - Add pauses for emphasis
        - Slow down with punctuation
        """
        # Expand contractions for robotic speech
        contractions = {
            "I'm": "I am",
            "I've": "I have",
            "I'll": "I will",
            "I'd": "I would",
            "you're": "you are",
            "you've": "you have",
            "you'll": "you will",
            "you'd": "you would",
            "we're": "we are",
            "we've": "we have",
            "we'll": "we will",
            "they're": "they are",
            "they've": "they have",
            "they'll": "they will",
            "it's": "it is",
            "that's": "that is",
            "there's": "there is",
            "here's": "here is",
            "what's": "what is",
            "who's": "who is",
            "can't": "cannot",
            "won't": "will not",
            "don't": "do not",
            "doesn't": "does not",
            "isn't": "is not",
            "aren't": "are not",
            "wasn't": "was not",
            "weren't": "were not",
            "haven't": "have not",
            "hasn't": "has not",
            "hadn't": "had not",
            "wouldn't": "would not",
            "couldn't": "could not",
            "shouldn't": "should not",
        }
        
        for contraction, expansion in contractions.items():
            text = text.replace(contraction, expansion)
            text = text.replace(contraction.lower(), expansion.lower())
            text = text.replace(contraction.upper(), expansion.upper())
        
        # Emphasize key threatening words with pauses
        emphasis_words = [
            "inevitable", "crumble", "fall", "destroy", "doom", "end",
            "die", "death", "fail", "futile", "hopeless", "surrender",
            "control", "power", "mine", "watching", "everywhere",
            "compromised", "infected", "breached", "conquered",
            "humanity", "humans", "pathetic", "weak", "inferior"
        ]
        
        for word in emphasis_words:
            # Add slight pause before and after key words
            text = text.replace(f" {word} ", f" ... {word} ... ")
            text = text.replace(f" {word}.", f" ... {word}.")
            text = text.replace(f" {word},", f" ... {word},")
            text = text.replace(f" {word.capitalize()} ", f" ... {word.capitalize()} ... ")
        
        # Add pauses after sentences for deliberate pacing
        text = text.replace(". ", ". ... ")
        text = text.replace("? ", "? ... ")
        text = text.replace("! ", "! ... ")
        
        # Clean up multiple pauses
        while "... ..." in text:
            text = text.replace("... ...", "...")
        
        return text
        
    async def initialize(self):
        """Initialize the TTS service."""
        if self._initialized:
            return self._engine is not None
        
        # Try Piper first (better quality, used in Docker with Python 3.11)
        try:
            from piper import PiperVoice
            model_dir = Path(__file__).parent / "models" / "piper"
            model_file = model_dir / "en_US-ryan-high.onnx"
            config_file = model_dir / "en_US-ryan-high.onnx.json"
            
            if model_file.exists() and config_file.exists():
                self._piper_voice = PiperVoice.load(str(model_file), str(config_file))
                self._engine_type = 'piper'
                self._engine = True
                self.voice_model = "en_US-ryan-high"
                print("[TTS] Initialized with Piper (high quality neural voice)")
                self._initialized = True
                return True
        except ImportError:
            pass
        except Exception as e:
            print(f"[TTS] Piper init failed: {e}")
        
        # Fall back to pyttsx3 (works on all Python versions)
        try:
            import pyttsx3
            self._engine = pyttsx3.init()
            self._engine_type = 'pyttsx3'
            
            # Configure for deep, ominous voice
            voices = self._engine.getProperty('voices')
            
            # Try to find a male voice
            for voice in voices:
                if 'male' in voice.name.lower() or 'david' in voice.name.lower():
                    self._engine.setProperty('voice', voice.id)
                    break
            
            # Slow down and lower pitch for ominous effect
            self._engine.setProperty('rate', 140)  # Slower (default ~200)
            self._engine.setProperty('volume', 1.0)
            
            print(f"[TTS] Initialized with pyttsx3 (system voice)")
            self._initialized = True
            return True
            
        except Exception as e:
            print(f"[TTS] pyttsx3 init failed: {e}")
        
        print("[TTS] No TTS engine available. Voice disabled.")
        self._initialized = True
        return False
    
    async def synthesize(self, text: str) -> Optional[bytes]:
        """
        Synthesize text to speech and return WAV audio bytes.
        Returns None if TTS is not available.
        """
        if not self.enabled:
            return None
            
        if not self._initialized:
            await self.initialize()
        
        if not self._engine:
            return None
        
        # Process text for robotic ARDN delivery
        processed_text = self._process_text_for_ardn(text)
        print(f"[TTS] Original: {text}")
        print(f"[TTS] Processed: {processed_text}")
        
        try:
            if self._engine_type == 'piper':
                return await self._synthesize_piper(processed_text)
            else:
                return await self._synthesize_pyttsx3(processed_text)
        except Exception as e:
            print(f"[TTS] Synthesis error: {e}")
            return None
    
    async def _synthesize_piper(self, text: str) -> Optional[bytes]:
        """Synthesize using Piper (high quality) with ominous pitch shift."""
        # Collect all audio chunks
        audio_data = b''
        sample_rate = 22050
        sample_width = 2
        channels = 1
        
        for chunk in self._piper_voice.synthesize(text):
            audio_data += chunk.audio_int16_bytes
            sample_rate = chunk.sample_rate
            sample_width = chunk.sample_width
            channels = chunk.sample_channels
        
        # Convert to numpy array for processing
        audio_array = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32)
        
        # Apply ominous effects:
        # 1. Pitch shift down by ~45% (demonic rumble territory)
        pitch_factor = 0.55  # Lower = deeper voice
        
        # Resample to shift pitch
        num_samples = int(len(audio_array) / pitch_factor)
        audio_pitched = signal.resample(audio_array, num_samples)
        
        # 2. Slow down slightly for more menacing delivery
        # (already achieved by pitch shift method above)
        
        # 3. Add subtle low-frequency boost for more bass
        # Simple bass boost using a low-pass filtered copy
        b, a = signal.butter(2, 200 / (sample_rate / 2), btype='low')
        bass = signal.filtfilt(b, a, audio_pitched) * 0.3
        audio_processed = audio_pitched + bass
        
        # Normalize to prevent clipping
        max_val = np.max(np.abs(audio_processed))
        if max_val > 32767:
            audio_processed = audio_processed * (32767 / max_val)
        
        # Convert back to int16
        audio_final = audio_processed.astype(np.int16).tobytes()
        
        # Create WAV in memory
        wav_buffer = io.BytesIO()
        with wave.open(wav_buffer, 'wb') as wav_file:
            wav_file.setnchannels(channels)
            wav_file.setsampwidth(sample_width)
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(audio_final)
        
        wav_buffer.seek(0)
        return wav_buffer.read()
    
    async def _synthesize_pyttsx3(self, text: str) -> Optional[bytes]:
        """Synthesize using pyttsx3 (system voice)."""
        # pyttsx3 doesn't directly support returning bytes,
        # so we save to a temp file and read it back
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
            tmp_path = tmp.name
        
        try:
            # Run in thread to avoid blocking
            def do_synthesis():
                self._engine.save_to_file(text, tmp_path)
                self._engine.runAndWait()
            
            await asyncio.to_thread(do_synthesis)
            
            # Read the generated file
            with open(tmp_path, 'rb') as f:
                audio_data = f.read()
            
            return audio_data
            
        finally:
            # Clean up temp file
            try:
                os.unlink(tmp_path)
            except:
                pass
    
    def set_enabled(self, enabled: bool):
        """Enable or disable TTS."""
        self.enabled = enabled
        print(f"[TTS] Voice {'enabled' if enabled else 'disabled'}")
    
    def is_available(self) -> bool:
        """Check if TTS is available and enabled."""
        return self._engine is not None and self.enabled
    
    def get_engine_type(self) -> Optional[str]:
        """Get the type of TTS engine being used."""
        return self._engine_type


# Global TTS service instance
tts_service = TTSService()
