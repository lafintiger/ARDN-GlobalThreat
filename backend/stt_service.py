"""
Speech-to-Text service for A.R.D.N.
Connects to Wyoming Whisper (Docker) for local STT.
Falls back gracefully if not available.
"""

import os
import io
import asyncio
import socket
import struct
import json
import wave
from typing import Optional

# Wyoming protocol constants
WYOMING_WHISPER_HOST = os.getenv("WHISPER_HOST", "localhost")
WYOMING_WHISPER_PORT = int(os.getenv("WHISPER_PORT", "10300"))


class STTService:
    def __init__(self):
        self.enabled = True
        self._initialized = False
        self._wyoming_host = WYOMING_WHISPER_HOST
        self._wyoming_port = WYOMING_WHISPER_PORT
        self._wyoming_available = False
        self._consecutive_failures = 0
        self._max_failures = 3
    
    async def initialize(self):
        """Initialize STT service, checking for Wyoming Whisper."""
        if self._initialized:
            return
        
        print(f"[STT] Initializing STT service...")
        print(f"[STT] Checking Wyoming Whisper at {self._wyoming_host}:{self._wyoming_port}")
        
        # Check if Wyoming Whisper is available
        self._wyoming_available = await self._check_wyoming_whisper()
        
        if self._wyoming_available:
            print(f"[STT] ✓ Wyoming Whisper available at {self._wyoming_host}:{self._wyoming_port}")
        else:
            print(f"[STT] ✗ Wyoming Whisper not available - STT disabled")
            self.enabled = False
        
        self._initialized = True
    
    async def _check_wyoming_whisper(self) -> bool:
        """Check if Wyoming Whisper is responding."""
        try:
            # Try to connect to the Wyoming Whisper port
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(2)
            result = sock.connect_ex((self._wyoming_host, self._wyoming_port))
            sock.close()
            return result == 0
        except Exception as e:
            print(f"[STT] Connection check failed: {e}")
            return False
    
    def is_available(self) -> bool:
        """Check if STT is currently available."""
        return self.enabled and self._wyoming_available
    
    def get_status(self) -> dict:
        """Get current STT status."""
        return {
            "enabled": self.enabled,
            "available": self.is_available(),
            "initialized": self._initialized,
            "wyoming_available": self._wyoming_available,
            "host": self._wyoming_host,
            "port": self._wyoming_port,
            "consecutive_failures": self._consecutive_failures
        }
    
    async def transcribe(self, audio_data: bytes, sample_rate: int = 16000) -> Optional[str]:
        """
        Transcribe audio data to text using Wyoming Whisper.
        
        Args:
            audio_data: Raw PCM audio data (16-bit signed, mono)
            sample_rate: Sample rate of the audio (default 16000 Hz)
        
        Returns:
            Transcribed text or None if failed
        """
        if not self.is_available():
            print("[STT] Service not available")
            return None
        
        try:
            return await asyncio.wait_for(
                self._wyoming_transcribe(audio_data, sample_rate),
                timeout=30.0  # 30 second timeout for transcription
            )
        except asyncio.TimeoutError:
            print("[STT] Transcription timed out")
            self._consecutive_failures += 1
            if self._consecutive_failures >= self._max_failures:
                print(f"[STT] Too many failures ({self._consecutive_failures}), disabling service")
                self._wyoming_available = False
            return None
        except Exception as e:
            print(f"[STT] Transcription error: {e}")
            self._consecutive_failures += 1
            return None
    
    async def _wyoming_transcribe(self, audio_data: bytes, sample_rate: int) -> Optional[str]:
        """Send audio to Wyoming Whisper and get transcription."""
        reader = None
        writer = None
        
        try:
            # Connect to Wyoming Whisper
            reader, writer = await asyncio.open_connection(
                self._wyoming_host, self._wyoming_port
            )
            
            # Wyoming protocol: send events as JSON lines
            # 1. Send describe event to identify ourselves
            describe_event = {
                "type": "describe",
                "data": {
                    "name": "ardn-stt-client",
                    "attribution": {"name": "ARDN", "url": ""},
                    "installed": True
                }
            }
            await self._send_event(writer, describe_event)
            
            # 2. Send transcribe event
            transcribe_event = {
                "type": "transcribe",
                "data": {
                    "language": "en"
                }
            }
            await self._send_event(writer, transcribe_event)
            
            # 3. Send audio-start event
            audio_start = {
                "type": "audio-start",
                "data": {
                    "rate": sample_rate,
                    "width": 2,  # 16-bit = 2 bytes
                    "channels": 1
                }
            }
            await self._send_event(writer, audio_start)
            
            # 4. Send audio chunks
            chunk_size = 4096
            for i in range(0, len(audio_data), chunk_size):
                chunk = audio_data[i:i + chunk_size]
                audio_chunk = {
                    "type": "audio-chunk",
                    "data": {
                        "rate": sample_rate,
                        "width": 2,
                        "channels": 1
                    },
                    "payload": chunk.hex()  # Send as hex string
                }
                await self._send_event(writer, audio_chunk)
            
            # 5. Send audio-stop event
            audio_stop = {
                "type": "audio-stop"
            }
            await self._send_event(writer, audio_stop)
            
            # 6. Wait for transcript response
            transcript = await self._receive_transcript(reader)
            
            # Reset failure counter on success
            self._consecutive_failures = 0
            
            return transcript
            
        except Exception as e:
            print(f"[STT] Wyoming transcription error: {e}")
            raise
        finally:
            if writer:
                writer.close()
                try:
                    await writer.wait_closed()
                except:
                    pass
    
    async def _send_event(self, writer, event: dict):
        """Send a Wyoming protocol event."""
        # Check if event has payload (binary data)
        payload = None
        if "payload" in event:
            payload_hex = event.pop("payload")
            payload = bytes.fromhex(payload_hex)
        
        # Send JSON event followed by newline
        event_json = json.dumps(event) + "\n"
        writer.write(event_json.encode())
        
        # If there's a payload, send it after the JSON
        if payload:
            # Send payload length as 4-byte big-endian integer
            writer.write(struct.pack(">I", len(payload)))
            writer.write(payload)
        
        await writer.drain()
    
    async def _receive_transcript(self, reader) -> Optional[str]:
        """Receive and parse transcript from Wyoming Whisper."""
        transcript_text = ""
        
        while True:
            try:
                line = await asyncio.wait_for(reader.readline(), timeout=30.0)
                if not line:
                    break
                
                event = json.loads(line.decode().strip())
                event_type = event.get("type", "")
                
                if event_type == "transcript":
                    # Got the transcript!
                    transcript_text = event.get("data", {}).get("text", "")
                    print(f"[STT] Received transcript: {transcript_text}")
                    break
                elif event_type == "error":
                    error_msg = event.get("data", {}).get("text", "Unknown error")
                    print(f"[STT] Error from Whisper: {error_msg}")
                    break
                    
            except asyncio.TimeoutError:
                print("[STT] Timeout waiting for transcript")
                break
            except json.JSONDecodeError:
                continue
        
        return transcript_text if transcript_text else None
    
    async def reinitialize(self):
        """Force re-initialization of STT service."""
        print("[STT] Reinitializing...")
        self._initialized = False
        self._consecutive_failures = 0
        self._wyoming_available = False
        self.enabled = True
        await self.initialize()


# Global singleton
stt_service = STTService()

