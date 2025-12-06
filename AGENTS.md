# A.R.D.N. Codebase Guide for AI Agents

This document explains the structure, conventions, and key concepts for AI agents working on the A.R.D.N. project.

## Overview

A.R.D.N. (Autonomous Rogue Digital Network) is an escape room / classroom game where a rogue AI is taking over global infrastructure. Players must enter codes, solve challenges, and communicate with the AI to stop it.

**Tech Stack:**
- **Frontend:** React + Vite (port 3333)
- **Backend:** FastAPI + Python (port 8333)
- **AI Chat:** Ollama (local LLM)
- **TTS Voice:** Wyoming Piper (Docker, port 10200)
- **Image Generation:** ComfyUI (user's GPU server)

## Project Structure

```
ARDN/
├── backend/                    # FastAPI Python backend
│   ├── main.py                 # Main server, all API endpoints, WebSocket handlers
│   ├── game_state.py           # Game state management (threat levels, scores, etc.)
│   ├── ollama_chat.py          # AI chat with ARDN personality
│   ├── ollama_service.py       # Attack terminal text generation
│   ├── tts_service.py          # Text-to-speech (Piper/pyttsx3)
│   ├── comfyui_service.py      # Image generation via ComfyUI
│   ├── challenges.py           # Challenge/riddle system
│   └── requirements.txt        # Python dependencies
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── App.jsx             # Main app component, admin panel, game UI
│   │   ├── config.js           # API URLs configuration
│   │   ├── components/         # Reusable components
│   │   │   ├── AttackTerminal.jsx    # Streaming attack text display
│   │   │   ├── ComfyUIDisplay.jsx    # AI image display with glitch effects
│   │   │   ├── MusicPlayer.jsx       # MP3 player
│   │   │   ├── SoundControl.jsx      # Ambient sound controls
│   │   │   └── WorldMap.jsx          # Infrastructure map display
│   │   ├── pages/              # Full page components
│   │   │   ├── StudentScorecard.jsx  # Student tracking & points
│   │   │   ├── GMCheatSheet.jsx      # Game master reference
│   │   │   ├── AIChatCheatSheet.jsx  # AI conversation guide
│   │   │   └── AdminPage.jsx         # Standalone admin panel
│   │   └── styles/
│   │       └── global.css      # Global styles, CSS variables
│   └── public/
│       ├── music/              # MP3 files for music player
│       └── sounds/             # Ambient sound files
│
├── docker-compose.yml          # Docker Option A (with local Ollama)
├── docker-compose.full.yml     # Docker Option B (self-contained)
└── README.md                   # User documentation
```

## Key Ports

| Service | Port | Notes |
|---------|------|-------|
| Frontend (Vite) | 3333 | Development server |
| Backend (FastAPI) | 8333 | API and WebSockets |
| Ollama | 11434 | LLM inference |
| Piper TTS | 10200 | Voice synthesis (Docker) |
| ComfyUI | 8188 | Image generation (user's server) |

**IMPORTANT:** Frontend is 3333, Backend is 8333. Don't mix these up!

## Backend Architecture

### main.py
The central hub. Contains:
- All REST API endpoints (`/api/*`)
- All WebSocket endpoints (`/ws/*`)
- Game state management
- Integration with all services

Key patterns:
```python
# REST endpoint
@app.post("/api/game/start")
async def start_game():
    game_state.start_attack()
    return {"status": "started"}

# WebSocket endpoint
@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    await websocket.accept()
    # Handle messages...
```

### game_state.py
Singleton `GameState` class that tracks:
- `global_threat_level` (0-100%)
- `domain_states` (12 infrastructure sectors)
- `team_score`
- `session_duration`
- `attack_running` flag

### ollama_chat.py
Handles AI personality chat:
- `ARDN_SYSTEM_PROMPT` - The AI's personality (menacing, condescending)
- `ARDNChatSession` - Manages conversation history
- `chat_with_ardn()` - Streaming chat function
- Challenge system integration
- Image generation triggers via `[IMAGE: description]` tags

**VRAM Note:** `NUM_CTX` controls context length. Keep at 8192 to save VRAM.

### ollama_service.py
Generates attack terminal text:
- Pre-written scripts by default (GPU-free)
- Set `USE_AI_ATTACKS=true` for live AI generation
- 12 sector configurations with realistic IPs, CVEs, tools

### tts_service.py
Text-to-speech with ominous voice:
- Primary: Wyoming Piper (Docker)
- Fallback: pyttsx3 (system voice)
- Pitch shifting and bass boost for menacing effect

### comfyui_service.py
Connects to user's ComfyUI server:
- Builds workflow JSON dynamically
- Queues prompts and polls for completion
- Returns generated image bytes

## Frontend Architecture

### App.jsx
The main component containing:
- Admin panel (gear icon ⚙)
- Chat interface
- Infrastructure grid/map
- Password entry
- ComfyUI image display

State management is local (useState/useEffect). No Redux.

### Key Components

**AttackTerminal.jsx**
- Connects to `/ws/attack/{domain_id}`
- Streams text character-by-character
- Auto-scrolls terminal output

**ComfyUIDisplay.jsx**
- Displays generated images with glitch animation
- Fades out after `displayDuration`
- Uses `onComplete` callback

**StudentScorecard.jsx**
- Tracks 40 students with achievements
- Syncs top performers to backend
- Reduces threat level when boxes checked

### CSS Conventions

Global variables in `global.css`:
```css
:root {
  --red: #ff2a2a;      /* Threat/danger */
  --cyan: #00f0ff;     /* Accent/info */
  --green: #39ff14;    /* Success */
  --purple: #b026ff;   /* GM/Admin */
}
```

Common patterns:
- `.glow-text` - Animated glowing text
- `.terminal` - Monospace terminal styling
- `.scanline` - CRT monitor effect

## API Quick Reference

### REST Endpoints

```bash
# Game control
POST /api/game/start
POST /api/game/stop
POST /api/game/reset
POST /api/game/session  # body: {"duration": 60}

# Passwords
POST /api/password/try   # body: {"code": "PHOENIX-7X"}
POST /api/password/add   # body: {"code": "X", "reduction_percent": 10}
GET  /api/passwords

# Score
POST /api/score/adjust   # body: {"amount": 5}
GET  /api/score

# TTS
POST /api/tts/synthesize # body: {"text": "Hello humans"}
GET  /api/tts/status

# ComfyUI
GET  /api/comfyui/status
POST /api/comfyui/config
POST /api/comfyui/generate/event/{type}
```

### WebSocket Endpoints

```javascript
// Game state updates
ws://localhost:8333/ws/state

// Attack terminal streaming
ws://localhost:8333/ws/attack/financial
ws://localhost:8333/ws/attack/power
// ... (12 domains)

// AI Chat
ws://localhost:8333/ws/chat
// Send: {"message": "Hello ARDN"}
// Receive: {"type": "token", "content": "..."} (streaming)
```

## Common Tasks

### Adding a New Password
```python
# In main.py or via API
game_state.passwords["NEW-CODE"] = {
    "reduction_percent": 15,
    "used": False,
    "hint": "Found in the server room"
}
```

### Modifying AI Personality
Edit `ARDN_SYSTEM_PROMPT` in `ollama_chat.py`. The AI should:
- Be condescending and menacing
- Never break character
- Taunt students by name when provided
- Add `[IMAGE: description]` for image generation

### Adding a New Infrastructure Sector
1. Add to `DOMAIN_IDS` in `game_state.py`
2. Add config to `SECTOR_CONFIGS` in `ollama_service.py`
3. Update frontend grid in `App.jsx`

### Changing TTS Voice
```bash
docker stop piper && docker rm piper
docker run -d --name piper -p 10200:10200 \
  -e PIPER_VOICE=en_US-hfc_male-medium \
  lscr.io/linuxserver/piper:latest
```

Available voices: https://rhasspy.github.io/piper-samples/

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server |
| `PIPER_URL` | `localhost:10200` | Piper TTS server |
| `USE_AI_ATTACKS` | `false` | Use Ollama for attack text |

## VRAM Management

The system is designed to run on a single GPU:

| Component | VRAM Usage |
|-----------|------------|
| Ollama 8B (8k ctx) | ~6GB |
| ComfyUI (when generating) | ~4-8GB |
| Attack terminals | 0 (pre-written) |

**Tips:**
- Keep `NUM_CTX` at 8192 in `ollama_chat.py`
- Don't set `USE_AI_ATTACKS=true` unless you have spare VRAM
- ComfyUI generation is async and temporary

## Testing

### Quick Tests Panel (`/admin`)
The admin page has a **🧪 Quick Tests** section with individual test buttons:
- **🎤 TEST VOICE** - Synthesizes and plays a TTS taunt via Wyoming Piper
- **🖼 TEST IMAGE** - Triggers ComfyUI to generate a taunt image (displays on main page)
- **📊 CHECK STATUS** - Shows connection status for TTS and ComfyUI

### Manual Testing
```bash
# Test backend
curl http://localhost:8333/api/state

# Test TTS
curl -X POST http://localhost:8333/api/tts/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text": "Testing voice"}'

# Test Ollama
curl http://localhost:11434/api/tags
```

## Debugging

### Backend Logs
The backend prints to stdout. Watch for:
- `[TTS]` - Voice synthesis status
- `[ComfyUI]` - Image generation status
- WebSocket connection/disconnection

### Frontend Console
Check browser console for:
- WebSocket errors
- Fetch failures
- React component errors

### Common Issues

**"Connection refused"**
- Backend not running on 8333
- Ollama not running on 11434
- Piper not running on 10200

**High VRAM usage**
- Check `ollama ps` for loaded models
- Use `ollama stop <model>` to unload
- Reduce `NUM_CTX` in chat.py

**No voice output**
- Start Piper: `docker start piper`
- Falls back to pyttsx3 automatically

**Music player repeating first song**
- This was a React closure bug - event handlers captured stale state values
- Fixed by using refs (`currentTrackRef`, `shuffleRef`, `loopRef`) that stay in sync with state
- Pattern: Use `useRef` + `useEffect` to keep refs updated, then read refs in event handlers

### Wyoming Piper TTS Issues (IMPORTANT!)

This is a **recurring issue**. Wyoming Piper (Docker TTS) can appear connected but fail to synthesize audio.

#### Symptoms
- Backend logs show: `[TTS] Initialized with Wyoming Piper (localhost:10200)` ✅
- But TEST VOICE button does nothing, or requests hang forever
- The Piper Docker container is running (`docker ps` shows it)

#### Root Cause
The TTS initialization only checks if port 10200 is **open**, not if Piper can actually **synthesize**. The Piper container sometimes gets into a stuck state where:
- The port is open and accepting connections
- But synthesis requests hang indefinitely

#### Quick Fix (Do This First!)
```powershell
# 1. Restart Piper container
docker restart piper

# 2. Wait 5 seconds for it to fully initialize
Start-Sleep -Seconds 5

# 3. Restart the backend (kill and restart uvicorn)
# Find the process ID from terminal output or use:
Stop-Process -Name python -Force  # Or use specific PID

# 4. Start backend again
cd ARDN/backend; .\venv310\Scripts\activate; uvicorn main:app --host 0.0.0.0 --port 8333 --reload
```

#### API-Based Fix
The backend now has a reinitialize endpoint:
```bash
curl -X POST http://localhost:8333/api/tts/reinitialize
```
This forces re-testing of Piper and falls back to pyttsx3 if it fails.

#### Check TTS Status
```bash
curl http://localhost:8333/api/tts/status
```
Look for:
- `engine_type`: Should be "wyoming" for Piper or "pyttsx3" for fallback
- `wyoming_failures`: Number of consecutive failures (auto-fallback after 2)

#### Verify Piper is Actually Working
```bash
# Check Piper logs
docker logs piper --tail 20

# Should show:
# INFO:__main__:Ready
# Connection to localhost (127.0.0.1) 10200 port [tcp/*] succeeded!
```

#### Start Order Matters!
Always start services in this order:
1. `docker start piper` - Start Piper first
2. Wait 3-5 seconds for Piper to fully initialize
3. Start backend (uvicorn) - Backend will test Piper during init

#### Automatic Fallback
The code now includes automatic fallback:
- If Wyoming Piper fails 2 times consecutively, it auto-falls back to pyttsx3
- You'll hear the robotic system voice instead of natural Piper voice
- Use `/api/tts/reinitialize` to try Piper again after fixing it

#### Page Stuck on "Loading Admin Panel..."
If the frontend shows "Loading Admin Panel..." forever:
1. The backend process may be dead or hung
2. Kill all Python processes: `Stop-Process -Name python -Force`
3. Restart both frontend and backend
4. Refresh the browser

#### Prevention
- The `tts_service.py` now tests actual synthesis during init (not just port check)
- If you see `[TTS] Wyoming Piper synthesis test PASSED` in logs, Piper is working
- If you see `[TTS] Wyoming Piper synthesis test FAILED`, it fell back to pyttsx3

### React Closure Gotcha (Important!)

When adding event listeners in `useEffect`, the handler captures state values at the time of creation. If state changes, the handler still sees the old value.

**Wrong:**
```javascript
useEffect(() => {
  audio.addEventListener('ended', () => {
    setTrack((current + 1) % total) // 'current' is stale!
  })
}, []) // Empty deps = handler never updates
```

**Correct:**
```javascript
const currentRef = useRef(current)
useEffect(() => { currentRef.current = current }, [current])

useEffect(() => {
  audio.addEventListener('ended', () => {
    setTrack((currentRef.current + 1) % total) // Always current value
  })
}, [])
```

## Git Workflow

```bash
# After making changes
cd ARDN
git add -A
git commit -m "Description of changes"
git push
```

## Contact / Support

This is an escape room project. The main user runs it for students as a cybersecurity education tool.

Key considerations:
- Keep VRAM usage low (students may have limited hardware)
- Pre-written scripts preferred over live AI (reliability)
- Fun > realism (it's a game!)

---

*Document last updated: December 6, 2025*






