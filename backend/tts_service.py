"""
Text-to-Speech service for A.R.D.N.
Uses pyttsx3 for local development (works on all Python versions)
Uses Piper for Docker deployment (higher quality neural voice)
"""

import os
import io
import wave
import asyncio
import tempfile
from pathlib import Path
from typing import Optional
import struct

class TTSService:
    def __init__(self):
        self.enabled = True
        self._initialized = False
        self._engine = None
        self._engine_type = None  # 'pyttsx3' or 'piper'
        self._piper_voice = None
        
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
        
        try:
            if self._engine_type == 'piper':
                return await self._synthesize_piper(text)
            else:
                return await self._synthesize_pyttsx3(text)
        except Exception as e:
            print(f"[TTS] Synthesis error: {e}")
            return None
    
    async def _synthesize_piper(self, text: str) -> Optional[bytes]:
        """Synthesize using Piper (high quality)."""
        wav_buffer = io.BytesIO()
        with wave.open(wav_buffer, 'wb') as wav_file:
            self._piper_voice.synthesize(text, wav_file)
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
