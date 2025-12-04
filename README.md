# A.R.D.N. - Autonomous Rogue Digital Network

An immersive escape room / classroom experience featuring a rogue AI taking over the world's critical infrastructure. Perfect for cybersecurity education, team building, or themed events.

![ARDN Interface](https://img.shields.io/badge/STATUS-OPERATIONAL-red?style=for-the-badge)
![License](https://img.shields.io/badge/LICENSE-MIT-green?style=for-the-badge)

## 🔴 Overview

A.R.D.N. is a web-based escape room interface that simulates a superintelligent AI systematically compromising global critical infrastructure. Players must find and enter security codes, solve riddles, and complete challenges to deploy countermeasures and reduce the AI's control before time runs out.

## ✨ Features

### Core Game
- **12 Critical Infrastructure Domains** - Financial, Telecom, Power Grid, Water, Transportation, Healthcare, Government, Emergency Services, Satellite, Supply Chain, Media, Nuclear
- **Real-time Attack Simulation** - Streaming terminal output showing realistic hacking sequences
- **AI Chat Interface** - Communicate directly with A.R.D.N. using Ollama LLM
- **Password System** - Enter discovered codes to reduce compromise percentages
- **Configurable Session Duration** - 30, 40, 60, or 90 minute games

### Game Master Tools
- **Admin Panel** - Start/stop attacks, reset game, manage everything
- **Student Scorecard** - Track up to 40 students with achievements and points
- **Score System** - +1/-1 buttons for arbitrary point awards/deductions
- **GM Cheat Sheet** - Printable reference with all passwords and answers
- **Hint System** - Send hints to players in real-time

### Immersion Features
- **TTS Voice Taunts** - A.R.D.N. speaks with an ominous AI voice (Piper TTS)
- **Ambient Soundscape** - Layered audio atmosphere
- **MP3 Music Player** - Play custom background music
- **ComfyUI Integration** - Generate AI images that flash on screen
- **Intel Documents** - Printable "hacked" documents with hidden clues

### UI/UX
- **Futuristic Cyberpunk UI** - Glowing terminals, grid layouts, animations
- **Responsive Design** - Works on various screen sizes
- **Print-Friendly Pages** - Cheat sheets and documents ready to print

## 🛠️ Setup

### Quick Start (Local Development)

**Prerequisites:**
- Python 3.9+ (Python 3.10 recommended for Piper TTS)
- Node.js 18+
- Ollama running locally

```bash
# Terminal 1 - Start Ollama
ollama serve
ollama pull huihui_ai/qwen3-coder-abliterated

# Terminal 2 - Backend
cd backend
pip install -r requirements.txt
python main.py

# Terminal 3 - Frontend
cd frontend
npm install
npm run dev
```

- **Frontend:** http://localhost:3333
- **Backend:** http://localhost:8333

### Docker Options

| Method | Best For | Ollama |
|--------|----------|--------|
| **Option A** | Production with GPU | Your local Ollama |
| **Option B** | Portable/Demo | Containerized (CPU-only) |

#### Option A: Docker + Local Ollama (Recommended)

```bash
# Start your local Ollama first
ollama serve
ollama pull huihui_ai/qwen3-coder-abliterated

# Start A.R.D.N.
docker-compose up --build
```

#### Option B: Full Docker (Self-Contained)

```bash
docker-compose -f docker-compose.full.yml up --build

# Pull model into container
docker exec -it ardn-ollama ollama pull huihui_ai/qwen3-coder-abliterated
```

## 🎮 Game Master Guide

### Key URLs

| URL | Purpose |
|-----|---------|
| `/` | Main game interface |
| `/scorecard` | Student tracking & points |
| `/gm-cheatsheet` | Printable GM reference |
| `/ai-chat-guide` | AI chat answers & triggers |
| `/intel` | Printable intel documents |
| `/admin` | Full admin panel |

### Admin Panel (⚙ button)

- **Session Duration** - Set game length (30/40/60/90 min)
- **START/STOP/RESET** - Control game state
- **Score Controls** - +1/-1 buttons for team score
- **ComfyUI Controls** - Trigger AI-generated images

### Student Scorecard (`/scorecard`)

Track up to 40 students with:
- Pre-built columns for passwords, intel docs, riddles
- Custom columns (add your own challenges)
- Positive and negative point values
- Auto-save to browser
- Export to CSV
- Print-friendly

### Sound Controls (Header)

- **🔊 Speaker** - Toggle ambient sounds
- **🎤 Microphone** - Toggle A.R.D.N. voice

### Music Player (Bottom-right)

- Click to expand
- Play/Pause/Skip controls
- Add MP3s to `frontend/public/music/`

### ComfyUI Integration

Generate AI images that flash on screen:

1. Run ComfyUI locally or on network
2. Configure URL in Admin panel (default: `http://127.0.0.1:8188`)
3. Set your model name (e.g., `z-image.safetensors`)
4. Click trigger buttons: TAUNT, THREAT, DESTRUCTION

### Default Passwords

| Code | Target | Reduction | Hint |
|------|--------|-----------|------|
| PHOENIX-7X | Financial | 15% | Firewall log reference |
| QUANTUM-SHIELD | Power | 20% | Power station code |
| NEURAL-LOCK | Healthcare | 15% | Hospital protocol |
| CIPHER-OMEGA | Satellite | 25% | Command sequence |
| ZERO-DAY | All Domains | 10% | Universal countermeasure |

### API Quick Reference

```bash
# Add a password
curl -X POST http://localhost:8333/api/password/add \
  -H "Content-Type: application/json" \
  -d '{"code": "SECRET123", "reduction_percent": 15, "hint": "Hidden clue"}'

# Adjust score
curl -X POST http://localhost:8333/api/score/adjust \
  -H "Content-Type: application/json" \
  -d '{"amount": 5}'

# Send hint to players
curl -X POST http://localhost:8333/api/hint/send \
  -H "Content-Type: application/json" \
  -d '{"message": "Check under the desk!"}'
```

## 📡 Full API Reference

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/state` | Get current game state |
| POST | `/api/game/start` | Start attack simulation |
| POST | `/api/game/stop` | Stop attack simulation |
| POST | `/api/game/reset` | Reset game state |
| POST | `/api/game/session` | Set session duration |
| POST | `/api/password/try` | Attempt a password |
| POST | `/api/password/add` | Add a new password |
| DELETE | `/api/password/{code}` | Remove a password |
| GET | `/api/passwords` | List all passwords |
| POST | `/api/score/adjust` | Adjust team score |
| GET | `/api/score` | Get current score |
| POST | `/api/hint/send` | Send hint to players |
| GET | `/api/tts/status` | TTS service status |
| POST | `/api/tts/synthesize` | Generate speech |
| GET | `/api/comfyui/status` | ComfyUI status |
| POST | `/api/comfyui/config` | Configure ComfyUI |
| POST | `/api/comfyui/generate` | Generate image |

### WebSocket Endpoints

| Endpoint | Description |
|----------|-------------|
| `/ws/state` | Real-time game state updates |
| `/ws/attack/{domain_id}` | Streaming attack terminal |
| `/ws/chat` | AI chat interface |

## 🎨 Customization

### Adding Music

Place MP3 files in `frontend/public/music/` and update the playlist in `frontend/src/components/MusicPlayer.jsx`.

### Voice Settings

Edit `backend/tts_service.py`:
- `pitch_factor` - Lower = deeper voice (default 0.65)
- `steps` - Speed adjustment

### AI Personality

Edit `backend/ollama_chat.py` to modify A.R.D.N.'s system prompt.

### Visual Theme

Edit `frontend/src/styles/global.css`:

```css
:root {
  --red: #ff2a2a;      /* Threat color */
  --cyan: #00f0ff;     /* Accent color */
  --green: #39ff14;    /* Success color */
  --purple: #b026ff;   /* GM/Admin color */
}
```

## 🚨 Classroom / Escape Room Tips

### Physical Integration

- Hide password codes on physical props
- Use blacklights to reveal hidden codes
- Create puzzle boxes that reveal codes when solved
- Print intel documents for hands-on discovery

### Running a Session

1. **Before:** Set up scorecard with student names
2. **Start:** Click START ATTACK in admin panel
3. **During:** Award points, send hints, trigger ComfyUI images
4. **End:** Export scorecard to CSV for grading

### Win/Lose Conditions

- **Win:** Reduce global threat below threshold OR find master code
- **Lose:** All domains reach 100% OR time runs out

## 📁 Project Structure

```
ARDN/
├── backend/
│   ├── main.py              # FastAPI server
│   ├── game_state.py        # Game logic
│   ├── ollama_chat.py       # AI chat
│   ├── tts_service.py       # Voice synthesis
│   └── comfyui_service.py   # Image generation
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main game UI
│   │   ├── components/      # UI components
│   │   └── pages/           # Scorecard, Cheatsheet, etc.
│   └── public/
│       └── music/           # MP3 files
├── docker-compose.yml       # Docker Option A
└── docker-compose.full.yml  # Docker Option B
```

## License

MIT - Use freely for your escape room, classroom, or event!

---

**>>> RESISTANCE IS FUTILE <<<**

*Created for cybersecurity education and immersive experiences.*
