# A.R.D.N. - Autonomous Rogue Digital Network

An immersive escape room experience featuring a rogue AI taking over the world's critical infrastructure.

![ARDN Interface](https://img.shields.io/badge/STATUS-OPERATIONAL-red?style=for-the-badge)

## 🔴 Overview

A.R.D.N. is a web-based escape room interface that simulates a superintelligent AI systematically compromising global critical infrastructure. Players must find and enter security codes to deploy countermeasures and reduce the AI's control before time runs out.

## Features

- **12 Critical Infrastructure Domains** - Financial, Telecom, Power Grid, Water, Transportation, Healthcare, Government, Emergency Services, Satellite, Supply Chain, Media, Nuclear
- **Real-time Attack Simulation** - Streaming terminal output showing realistic hacking sequences
- **AI Chat Interface** - Communicate directly with A.R.D.N. using Ollama LLM
- **Password System** - Enter discovered codes to reduce compromise percentages
- **Game Master Controls** - Start/stop attacks, reset game, manage passwords
- **Futuristic UI** - Cyberpunk aesthetic with animations and effects

## 🛠️ Setup

### Prerequisites

- Python 3.9+
- Node.js 18+
- Ollama with `huihui_ai/qwen2.5-1m-abliterated` model

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python main.py
```

The backend will run on `http://localhost:8333`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:3333`

### Ollama Setup

Ensure Ollama is running with the required model:

```bash
ollama pull huihui_ai/qwen2.5-1m-abliterated
ollama serve
```

## 🎮 Game Master Guide

### Admin Panel

Click the ⚙ button in the top-right to access game master controls:

- **START ATTACK** - Begin automatic attack progression
- **STOP ATTACK** - Pause attack progression
- **RESET GAME** - Reset all domains to starting state

### Managing Passwords

Use the API to add custom passwords:

```bash
# Add a password
curl -X POST http://localhost:8333/api/password/add \
  -H "Content-Type: application/json" \
  -d '{
    "code": "FIREWALL_ALPHA",
    "domain_id": "financial",
    "reduction_percent": 15,
    "one_time": true,
    "hint": "Check the firewall logs"
  }'

# List all passwords
curl http://localhost:8333/api/passwords

# Remove a password
curl -X DELETE http://localhost:8333/api/password/FIREWALL_ALPHA
```

### Default Passwords

The system comes with these default passwords:

| Code | Target | Reduction | Hint |
|------|--------|-----------|------|
| FIREWALL_ALPHA | Financial | 15% | Check the firewall logs |
| GRID_SECURE_7 | Power | 20% | Power station access code |
| MEDIC_OVERRIDE | Healthcare | 15% | Hospital emergency protocol |
| ORBITAL_DECAY | Satellite | 25% | Satellite command sequence |
| GLOBAL_RESET | All Domains | 10% | Affects all systems |
| BACKDOOR_EXIT | All Domains | 5% | Reusable emergency code |

### Adjusting Domain Compromise

Directly set a domain's compromise level:

```bash
curl -X POST http://localhost:8333/api/domain/update \
  -H "Content-Type: application/json" \
  -d '{"domain_id": "financial", "compromise_percent": 50}'
```

## 🎨 Customization

### Attack Speed

Edit `backend/game_state.py` to adjust attack speed per domain:

```python
domain.attack_speed = 1.5  # Faster attacks
domain.attack_speed = 0.5  # Slower attacks
```

### AI Personality

Edit `backend/ollama_chat.py` to modify A.R.D.N.'s personality prompt.

### Visual Theme

Edit `frontend/src/styles/global.css` CSS variables:

```css
:root {
  --red: #ff2a2a;      /* Primary threat color */
  --cyan: #00f0ff;     /* Accent color */
  --green: #39ff14;    /* Success color */
}
```

## 📡 API Reference

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/state` | Get current game state |
| POST | `/api/password/try` | Attempt a password |
| POST | `/api/password/add` | Add a new password |
| DELETE | `/api/password/{code}` | Remove a password |
| GET | `/api/passwords` | List all passwords |
| POST | `/api/domain/update` | Update domain compromise |
| POST | `/api/game/start` | Start attack simulation |
| POST | `/api/game/stop` | Stop attack simulation |
| POST | `/api/game/reset` | Reset game state |

### WebSocket Endpoints

| Endpoint | Description |
|----------|-------------|
| `/ws/state` | Real-time game state updates |
| `/ws/attack/{domain_id}` | Streaming attack terminal output |
| `/ws/chat` | AI chat interface |

## 🚨 Escape Room Integration

### Physical Props

- Hide password codes on physical props in the room
- Use blacklights to reveal hidden codes
- Create puzzle boxes that reveal codes when solved

### Room Effects

- Connect room lighting to compromise levels
- Trigger sound effects at threat thresholds
- Lock/unlock physical props based on game state

### Win Condition

Players win when they reduce the global threat level below a threshold (e.g., 10%) or find the "master shutdown" code.

## License

MIT - Use freely for your escape room!

---

**>>> RESISTANCE IS FUTILE <<<**

