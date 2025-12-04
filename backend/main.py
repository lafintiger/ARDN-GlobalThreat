"""
A.R.D.N. - Autonomous Rogue Digital Network
FastAPI Backend Server for Escape Room Experience
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel
from typing import Optional, List, Dict
import asyncio
import json

from game_state import game_state, Password
from ollama_service import generate_ollama_attack, generate_fallback_sequence
from ollama_chat import chat_with_ardn, get_or_create_session, ARDNChatSession
from missions import mission_manager, Mission, MissionStatus, AdjustmentType
from challenges import challenge_manager, CHALLENGE_LIBRARY, RewardType
from tts_service import tts_service
from comfyui_service import comfyui_service

app = FastAPI(title="A.R.D.N. Control Interface")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.chat_history: List[Dict] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
    
    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()


# Pydantic models
class PasswordAttempt(BaseModel):
    code: str

class PasswordCreate(BaseModel):
    code: str
    domain_id: Optional[str] = None
    reduction_percent: float
    one_time: bool = True
    hint: str = ""

class DomainUpdate(BaseModel):
    domain_id: str
    compromise_percent: float

class ChatMessage(BaseModel):
    message: str

class TopStudent(BaseModel):
    name: str
    score: int

class TopStudentsUpdate(BaseModel):
    students: List[TopStudent]


# REST API Endpoints
@app.get("/api/state")
async def get_state():
    """Get current game state"""
    return game_state.get_state()


@app.post("/api/password/try")
async def try_password(attempt: PasswordAttempt):
    """Attempt to use a password to reduce compromise"""
    result = game_state.try_password(attempt.code)
    # Broadcast state update
    await manager.broadcast({
        "type": "state_update",
        "data": game_state.get_state()
    })
    await manager.broadcast({
        "type": "password_result",
        "data": result
    })
    return result


@app.post("/api/password/add")
async def add_password(password: PasswordCreate):
    """Add a new password (game master function)"""
    success = game_state.add_password(
        password.code,
        password.domain_id,
        password.reduction_percent,
        password.one_time,
        password.hint
    )
    if not success:
        raise HTTPException(status_code=400, detail="Password already exists")
    return {"success": True, "message": f"Password '{password.code}' added"}


@app.delete("/api/password/{code}")
async def remove_password(code: str):
    """Remove a password (game master function)"""
    success = game_state.remove_password(code)
    if not success:
        raise HTTPException(status_code=404, detail="Password not found")
    return {"success": True, "message": f"Password '{code}' removed"}


@app.get("/api/passwords")
async def list_passwords():
    """List all passwords (game master function)"""
    return {
        code: {
            "domain_id": pw.domain_id,
            "reduction_percent": pw.reduction_percent,
            "one_time": pw.one_time,
            "used": pw.used,
            "hint": pw.hint
        }
        for code, pw in game_state.passwords.items()
    }


@app.post("/api/domain/update")
async def update_domain(update: DomainUpdate):
    """Directly update domain compromise level (game master function)"""
    success = game_state.set_domain_compromise(
        update.domain_id, 
        update.compromise_percent
    )
    if not success:
        raise HTTPException(status_code=404, detail="Domain not found")
    await manager.broadcast({
        "type": "state_update",
        "data": game_state.get_state()
    })
    return {"success": True}


@app.post("/api/game/start")
async def start_game():
    """Start the attack simulation"""
    await game_state.start_attack_simulation()
    return {"success": True, "message": "Attack simulation started"}


class SessionConfig(BaseModel):
    duration_minutes: int

@app.post("/api/game/session")
async def set_session_duration(config: SessionConfig):
    """Set session duration in minutes (affects attack speed)"""
    game_state.set_session_duration(config.duration_minutes)
    return {
        "success": True, 
        "message": f"Session duration set to {config.duration_minutes} minutes",
        "duration_minutes": game_state.session_duration_minutes
    }

@app.get("/api/game/session")
async def get_session_duration():
    """Get current session configuration"""
    return {
        "duration_minutes": game_state.session_duration_minutes,
        "game_active": game_state.game_active,
        "elapsed_seconds": game_state.elapsed_seconds
    }

@app.post("/api/game/stop")
async def stop_game():
    """Stop the attack simulation"""
    await game_state.stop_attack_simulation()
    return {"success": True, "message": "Attack simulation stopped"}


@app.post("/api/game/reset")
async def reset_game():
    """Reset the game to initial state"""
    await game_state.stop_attack_simulation()
    game_state.reset()
    mission_manager.reset_all_missions()
    await manager.broadcast({
        "type": "state_update",
        "data": game_state.get_state()
    })


class ScoreAdjust(BaseModel):
    amount: int

@app.post("/api/score/adjust")
async def adjust_score(data: ScoreAdjust):
    """Adjust team score by amount (+1 or -1 typically)"""
    result = game_state.adjust_score(data.amount)
    await manager.broadcast({
        "type": "state_update",
        "data": game_state.get_state()
    })
    await manager.broadcast({
        "type": "score_change",
        "data": result
    })
    return result

@app.post("/api/students/top")
async def update_top_students(data: TopStudentsUpdate):
    """Update top students from frontend scorecard for chat personalization."""
    students = [{"name": s.name, "score": s.score} for s in data.students]
    game_state.update_top_students(students)
    return {"success": True, "count": len(students)}
    return result

@app.post("/api/score/set/{value}")
async def set_score(value: int):
    """Set score to specific value"""
    result = game_state.set_score(value)
    await manager.broadcast({
        "type": "state_update",
        "data": game_state.get_state()
    })
    return result

@app.get("/api/score")
async def get_score():
    """Get current score"""
    return {"score": game_state.score}
    return {"success": True, "message": "Game reset"}


# ============================================
# MISSION API ENDPOINTS
# Simple API for external puzzle triggers
# ============================================

class SectorAdjustment(BaseModel):
    sector_id: str
    adjustment: float  # Negative = reduce, Positive = increase
    lock: bool = False

class AllSectorAdjustment(BaseModel):
    adjustment: float

class MissionTrigger(BaseModel):
    mission_id: str

class MissionCreate(BaseModel):
    id: str
    name: str
    description: str = ""
    adjustment_type: str = "single"  # single, all, multiple
    target_sector: Optional[str] = None
    target_sectors: List[str] = []
    success_reduction: float = 20.0
    failure_penalty: float = 10.0
    lock_on_complete: bool = False
    max_attempts: int = 0


@app.get("/api/missions")
async def get_missions():
    """Get all missions and their status"""
    return {
        "missions": mission_manager.get_all_missions(),
        "event_log": mission_manager.get_event_log(20)
    }


@app.post("/api/mission/complete")
async def complete_mission(trigger: MissionTrigger):
    """
    Mark a mission as completed - reduces sector compromise.
    Called by external puzzles when solved successfully.
    """
    mission = mission_manager.get_mission(trigger.mission_id)
    
    if not mission:
        return {"success": False, "message": f"Mission '{trigger.mission_id}' not found"}
    
    if mission.status == MissionStatus.COMPLETED:
        return {"success": False, "message": "Mission already completed"}
    
    if mission.max_attempts > 0 and mission.current_attempts >= mission.max_attempts:
        return {"success": False, "message": "No attempts remaining"}
    
    # Mark as completed
    mission.status = MissionStatus.COMPLETED
    mission.completed_at = __import__('time').time()
    
    # Apply the reduction based on adjustment type
    affected_sectors = []
    reduction = -mission.success_reduction  # Negative to reduce
    
    if mission.adjustment_type == AdjustmentType.ALL_SECTORS:
        result = game_state.adjust_all_domains(reduction)
        affected_sectors = [r["domain_id"] for r in result.get("adjusted", [])]
    elif mission.adjustment_type == AdjustmentType.MULTIPLE_SECTORS:
        for sector_id in mission.target_sectors:
            result = game_state.adjust_domain(sector_id, reduction, lock=mission.lock_on_complete)
            if result["success"]:
                affected_sectors.append(sector_id)
    else:  # SINGLE_SECTOR
        if mission.target_sector:
            result = game_state.adjust_domain(
                mission.target_sector, 
                reduction, 
                lock=mission.lock_on_complete
            )
            if result["success"]:
                affected_sectors.append(mission.target_sector)
    
    # Log the event
    mission_manager.log_event("mission_complete", {
        "mission_id": mission.id,
        "mission_name": mission.name,
        "reduction": mission.success_reduction,
        "affected_sectors": affected_sectors,
        "locked": mission.lock_on_complete
    })
    
    # Broadcast state update
    await manager.broadcast({
        "type": "state_update",
        "data": game_state.get_state()
    })
    await manager.broadcast({
        "type": "mission_complete",
        "data": {
            "mission_id": mission.id,
            "mission_name": mission.name,
            "reduction": mission.success_reduction,
            "affected_sectors": affected_sectors
        }
    })
    
    return {
        "success": True,
        "message": f"Mission '{mission.name}' completed!",
        "reduction": mission.success_reduction,
        "affected_sectors": affected_sectors,
        "locked": mission.lock_on_complete
    }


@app.post("/api/mission/failed")
async def fail_mission(trigger: MissionTrigger):
    """
    Record a mission failure - increases sector compromise as penalty.
    Called by external puzzles when player fails.
    """
    mission = mission_manager.get_mission(trigger.mission_id)
    
    if not mission:
        return {"success": False, "message": f"Mission '{trigger.mission_id}' not found"}
    
    if mission.status == MissionStatus.COMPLETED:
        return {"success": False, "message": "Mission already completed"}
    
    # Increment attempt counter
    mission.current_attempts += 1
    
    # Check if out of attempts
    if mission.max_attempts > 0 and mission.current_attempts >= mission.max_attempts:
        mission.status = MissionStatus.FAILED
    
    # Apply the penalty based on adjustment type
    affected_sectors = []
    penalty = mission.failure_penalty  # Positive to increase
    
    if mission.adjustment_type == AdjustmentType.ALL_SECTORS:
        result = game_state.adjust_all_domains(penalty)
        affected_sectors = [r["domain_id"] for r in result.get("adjusted", [])]
    elif mission.adjustment_type == AdjustmentType.MULTIPLE_SECTORS:
        for sector_id in mission.target_sectors:
            result = game_state.adjust_domain(sector_id, penalty)
            if result["success"]:
                affected_sectors.append(sector_id)
    else:  # SINGLE_SECTOR
        if mission.target_sector:
            result = game_state.adjust_domain(mission.target_sector, penalty)
            if result["success"]:
                affected_sectors.append(mission.target_sector)
    
    # Log the event
    mission_manager.log_event("mission_failed", {
        "mission_id": mission.id,
        "mission_name": mission.name,
        "penalty": mission.failure_penalty,
        "affected_sectors": affected_sectors,
        "attempts_used": mission.current_attempts,
        "max_attempts": mission.max_attempts
    })
    
    # Broadcast state update
    await manager.broadcast({
        "type": "state_update",
        "data": game_state.get_state()
    })
    await manager.broadcast({
        "type": "mission_failed",
        "data": {
            "mission_id": mission.id,
            "mission_name": mission.name,
            "penalty": mission.failure_penalty,
            "affected_sectors": affected_sectors
        }
    })
    
    return {
        "success": True,
        "message": f"Mission '{mission.name}' failure recorded",
        "penalty": mission.failure_penalty,
        "affected_sectors": affected_sectors,
        "attempts_remaining": max(0, mission.max_attempts - mission.current_attempts) if mission.max_attempts > 0 else "unlimited"
    }


@app.post("/api/mission/reset/{mission_id}")
async def reset_mission(mission_id: str):
    """Reset a specific mission to pending state"""
    if mission_manager.reset_mission(mission_id):
        mission_manager.log_event("mission_reset", {"mission_id": mission_id})
        return {"success": True, "message": f"Mission '{mission_id}' reset"}
    return {"success": False, "message": "Mission not found"}


@app.post("/api/mission/create")
async def create_mission(mission_data: MissionCreate):
    """Create a new mission (admin function)"""
    adj_type = {
        "single": AdjustmentType.SINGLE_SECTOR,
        "all": AdjustmentType.ALL_SECTORS,
        "multiple": AdjustmentType.MULTIPLE_SECTORS
    }.get(mission_data.adjustment_type, AdjustmentType.SINGLE_SECTOR)
    
    mission = Mission(
        id=mission_data.id,
        name=mission_data.name,
        description=mission_data.description,
        adjustment_type=adj_type,
        target_sector=mission_data.target_sector,
        target_sectors=mission_data.target_sectors,
        success_reduction=mission_data.success_reduction,
        failure_penalty=mission_data.failure_penalty,
        lock_on_complete=mission_data.lock_on_complete,
        max_attempts=mission_data.max_attempts
    )
    
    if mission_manager.add_mission(mission):
        return {"success": True, "message": f"Mission '{mission.name}' created"}
    return {"success": False, "message": "Mission ID already exists"}


@app.delete("/api/mission/{mission_id}")
async def delete_mission(mission_id: str):
    """Delete a mission"""
    if mission_manager.remove_mission(mission_id):
        return {"success": True, "message": f"Mission '{mission_id}' deleted"}
    return {"success": False, "message": "Mission not found"}


# ============================================
# SECTOR CONTROL API
# Direct sector manipulation for game master
# ============================================

@app.post("/api/sector/adjust")
async def adjust_sector(data: SectorAdjustment):
    """
    Directly adjust a sector's compromise level.
    Use negative values to reduce, positive to increase.
    """
    result = game_state.adjust_domain(data.sector_id, data.adjustment, data.lock)
    
    if result["success"]:
        mission_manager.log_event("sector_adjust", {
            "sector_id": data.sector_id,
            "adjustment": data.adjustment,
            "locked": data.lock,
            "new_percent": result["new_percent"]
        })
        
        await manager.broadcast({
            "type": "state_update",
            "data": game_state.get_state()
        })
    
    return result


@app.post("/api/sector/adjust-all")
async def adjust_all_sectors(data: AllSectorAdjustment):
    """Adjust all sectors by the same amount."""
    result = game_state.adjust_all_domains(data.adjustment)
    
    mission_manager.log_event("all_sectors_adjust", {
        "adjustment": data.adjustment,
        "sectors_affected": len(result.get("adjusted", []))
    })
    
    await manager.broadcast({
        "type": "state_update",
        "data": game_state.get_state()
    })
    
    return result


@app.post("/api/sector/lock/{sector_id}")
async def lock_sector(sector_id: str, lock: bool = True):
    """Lock or unlock a sector."""
    if game_state.lock_domain(sector_id, lock):
        mission_manager.log_event("sector_lock", {
            "sector_id": sector_id,
            "locked": lock
        })
        await manager.broadcast({
            "type": "state_update",
            "data": game_state.get_state()
        })
        return {"success": True, "message": f"Sector '{sector_id}' {'locked' if lock else 'unlocked'}"}
    return {"success": False, "message": "Sector not found"}


@app.post("/api/sector/secure/{sector_id}")
async def secure_sector(sector_id: str):
    """Fully secure a sector (0% and locked)."""
    if game_state.secure_domain(sector_id):
        mission_manager.log_event("sector_secured", {
            "sector_id": sector_id
        })
        await manager.broadcast({
            "type": "state_update",
            "data": game_state.get_state()
        })
        return {"success": True, "message": f"Sector '{sector_id}' fully secured"}
    return {"success": False, "message": "Sector not found"}


@app.get("/api/events")
async def get_event_log(limit: int = 50):
    """Get recent game events."""
    return {"events": mission_manager.get_event_log(limit)}


# ============================================
# CHALLENGE API ENDPOINTS
# GM controls for the chat challenge system
# ============================================

class ChallengeInject(BaseModel):
    challenge_id: str

class ChallengeVerify(BaseModel):
    is_correct: bool

@app.get("/api/challenges")
async def get_challenges():
    """Get all available challenges."""
    challenges = [
        {
            "id": c.id,
            "type": c.challenge_type.value,
            "question": c.question,
            "difficulty": c.difficulty,
            "reward_type": c.reward_type.value,
            "reward_amount": c.reward_amount,
            "penalty_amount": c.penalty_amount,
            "used": c.id in challenge_manager.challenge_history
        }
        for c in CHALLENGE_LIBRARY.values()
    ]
    return {
        "challenges": challenges,
        "active_challenge": challenge_manager.active_challenge.id if challenge_manager.active_challenge else None,
        "stats": {
            "completed": get_or_create_session("main").challenges_completed,
            "failed": get_or_create_session("main").challenges_failed
        }
    }


@app.post("/api/challenge/inject")
async def inject_challenge(data: ChallengeInject):
    """GM injects a specific challenge into the chat."""
    session = get_or_create_session("main")
    result = session.inject_challenge(data.challenge_id)
    
    if result:
        mission_manager.log_event("challenge_injected", {
            "challenge_id": data.challenge_id
        })
        return {
            "success": True,
            "message": "Challenge injected",
            "challenge_text": result
        }
    return {"success": False, "message": "Challenge not found"}


@app.post("/api/challenge/verify")
async def force_verify_challenge(data: ChallengeVerify):
    """GM forces verification of active challenge."""
    session = get_or_create_session("main")
    result = session.force_verify(data.is_correct)
    
    if result.get("success") is not None:
        # Apply reward or penalty
        if result.get("reward"):
            reward = result["reward"]
            if reward["type"] == "time_bonus":
                game_state.add_time_bonus(int(reward["amount"]))
            elif reward["type"] == "sector_reduction":
                import random
                target = reward.get("target_sector")
                if not target:
                    active_sectors = [d.id for d in game_state.domains.values() if not d.is_secured]
                    target = random.choice(active_sectors) if active_sectors else None
                if target:
                    game_state.adjust_domain(target, -reward["amount"])
            elif reward["type"] == "all_reduction":
                game_state.adjust_all_domains(-reward["amount"])
            
            mission_manager.log_event("challenge_verified_correct", result)
        
        if result.get("penalty"):
            game_state.adjust_all_domains(result["penalty"]["amount"])
            mission_manager.log_event("challenge_verified_wrong", result)
        
        await manager.broadcast({
            "type": "state_update",
            "data": game_state.get_state()
        })
        
        return result
    
    return {"success": False, "message": "No active challenge"}


@app.post("/api/challenge/reset")
async def reset_challenges():
    """Reset all challenge state."""
    session = get_or_create_session("main")
    session.reset()
    challenge_manager.reset()
    return {"success": True, "message": "Challenges reset"}


@app.get("/api/chat/session")
async def get_chat_session():
    """Get current chat session state."""
    session = get_or_create_session("main")
    return {
        "challenge_active": session.challenge_active,
        "pending_challenge": session.pending_challenge_id,
        "challenges_completed": session.challenges_completed,
        "challenges_failed": session.challenges_failed,
        "begging_count": session.begging_count,
        "conversation_length": len(session.conversation_history)
    }


# ============================================
# HINT API
# GM can send hints to players
# ============================================

class HintSend(BaseModel):
    message: str

@app.post("/api/hint/send")
async def send_hint(hint: HintSend):
    """GM sends a hint to all connected players."""
    await manager.broadcast({
        "type": "hint",
        "data": {
            "message": hint.message
        }
    })
    mission_manager.log_event("hint_sent", {"message": hint.message})
    return {"success": True, "message": "Hint sent to players"}


# ============================================
# TEXT-TO-SPEECH API
# Voice synthesis for ARDN taunts
# ============================================

class TTSRequest(BaseModel):
    text: str

class TTSConfig(BaseModel):
    enabled: bool

@app.post("/api/tts/synthesize")
async def synthesize_speech(request: TTSRequest):
    """Synthesize text to speech and return WAV audio."""
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text is required")
    
    # Limit text length
    text = request.text[:500]  # Max 500 characters
    
    audio_bytes = await tts_service.synthesize(text)
    
    if audio_bytes is None:
        raise HTTPException(
            status_code=503, 
            detail="TTS service unavailable. Voice model may be downloading."
        )
    
    return Response(
        content=audio_bytes,
        media_type="audio/wav",
        headers={
            "Content-Disposition": "inline; filename=ardn_voice.wav"
        }
    )

@app.get("/api/tts/status")
async def get_tts_status():
    """Get TTS service status."""
    return {
        "enabled": tts_service.enabled,
        "available": tts_service.is_available(),
        "initialized": tts_service._initialized,
        "voice_model": tts_service.voice_model
    }

@app.post("/api/tts/config")
async def set_tts_config(config: TTSConfig):
    """Enable or disable TTS."""
    tts_service.set_enabled(config.enabled)
    return {
        "success": True,
        "enabled": tts_service.enabled
    }


# ============ ComfyUI Image Generation ============

class ImagePrompt(BaseModel):
    prompt: str
    event_type: Optional[str] = "custom"
    context: Optional[str] = ""

class ComfyUIConfig(BaseModel):
    url: Optional[str] = None
    model_name: Optional[str] = None
    image_width: Optional[int] = None
    image_height: Optional[int] = None
    steps: Optional[int] = None
    cfg: Optional[float] = None

@app.get("/api/comfyui/status")
async def get_comfyui_status():
    """Check if ComfyUI is available and get current config."""
    connected = await comfyui_service.check_connection()
    config = comfyui_service.get_config()
    return {
        "enabled": comfyui_service.enabled,
        "connected": connected,
        "generating": comfyui_service.is_generating(),
        **config
    }

@app.post("/api/comfyui/config")
async def set_comfyui_config(config: ComfyUIConfig):
    """Configure ComfyUI settings (URL, model, etc.)."""
    if config.url is not None:
        comfyui_service.set_url(config.url)
    if config.model_name is not None:
        comfyui_service.set_model(config.model_name)
    if config.image_width is not None and config.image_height is not None:
        comfyui_service.set_image_size(config.image_width, config.image_height)
    if config.steps is not None or config.cfg is not None:
        comfyui_service.set_generation_params(config.steps, config.cfg)
    
    return {
        "success": True,
        "config": comfyui_service.get_config()
    }

@app.get("/api/comfyui/config")
async def get_comfyui_config():
    """Get current ComfyUI configuration."""
    return comfyui_service.get_config()

@app.post("/api/comfyui/generate")
async def generate_image(request: ImagePrompt):
    """Generate an image from a prompt."""
    if comfyui_service.is_generating():
        raise HTTPException(status_code=409, detail="Already generating an image")
    
    connected = await comfyui_service.check_connection()
    if not connected:
        raise HTTPException(status_code=503, detail="ComfyUI not available")
    
    # Generate based on event type or custom prompt
    if request.event_type == "custom":
        image_bytes = await comfyui_service.generate_image(request.prompt)
    else:
        image_bytes = await comfyui_service.generate_for_event(
            request.event_type, 
            request.context
        )
    
    if image_bytes is None:
        raise HTTPException(status_code=500, detail="Image generation failed")
    
    # Broadcast to all clients
    import base64
    image_b64 = base64.b64encode(image_bytes).decode('utf-8')
    await manager.broadcast({
        "type": "comfyui_image",
        "data": {
            "image": image_b64,
            "prompt": request.prompt[:100],
            "event_type": request.event_type
        }
    })
    
    return Response(
        content=image_bytes,
        media_type="image/png",
        headers={"Content-Disposition": "inline; filename=ardn_vision.png"}
    )

@app.post("/api/comfyui/generate/event/{event_type}")
async def generate_for_event(event_type: str, context: str = ""):
    """Generate an image for a specific game event."""
    if comfyui_service.is_generating():
        raise HTTPException(status_code=409, detail="Already generating an image")
    
    connected = await comfyui_service.check_connection()
    if not connected:
        raise HTTPException(status_code=503, detail="ComfyUI not available")
    
    image_bytes = await comfyui_service.generate_for_event(event_type, context)
    
    if image_bytes is None:
        raise HTTPException(status_code=500, detail="Image generation failed")
    
    # Broadcast to all clients
    import base64
    image_b64 = base64.b64encode(image_bytes).decode('utf-8')
    await manager.broadcast({
        "type": "comfyui_image",
        "data": {
            "image": image_b64,
            "event_type": event_type,
            "context": context
        }
    })
    
    return Response(
        content=image_bytes,
        media_type="image/png"
    )

@app.get("/api/comfyui/last")
async def get_last_image():
    """Get the last generated image."""
    image_bytes = comfyui_service.get_last_image()
    if image_bytes is None:
        raise HTTPException(status_code=404, detail="No image available")
    
    return Response(
        content=image_bytes,
        media_type="image/png"
    )


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    # Initialize TTS in background (downloads model if needed)
    asyncio.create_task(tts_service.initialize())


# WebSocket endpoints
@app.websocket("/ws/state")
async def websocket_state(websocket: WebSocket):
    """WebSocket for real-time state updates"""
    await manager.connect(websocket)
    
    # Register callback for game state updates
    async def on_update(state):
        await websocket.send_json({
            "type": "state_update",
            "data": state
        })
    
    game_state.on_update_callbacks.append(on_update)
    
    try:
        # Send initial state
        await websocket.send_json({
            "type": "state_update",
            "data": game_state.get_state()
        })
        
        while True:
            # Keep connection alive, handle incoming messages
            data = await websocket.receive_text()
            msg = json.loads(data)
            
            if msg.get("type") == "password_attempt":
                result = game_state.try_password(msg.get("code", ""))
                await websocket.send_json({
                    "type": "password_result",
                    "data": result
                })
                await manager.broadcast({
                    "type": "state_update",
                    "data": game_state.get_state()
                })
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        if on_update in game_state.on_update_callbacks:
            game_state.on_update_callbacks.remove(on_update)


@app.websocket("/ws/attack/{domain_id}")
async def websocket_attack(websocket: WebSocket, domain_id: str):
    """WebSocket for streaming attack terminal output using LOCAL Ollama model"""
    await websocket.accept()
    
    try:
        while True:
            # Get current compromise level
            domain = game_state.domains.get(domain_id)
            if not domain:
                await websocket.send_text("[ERROR] Domain not found")
                break
            
            # Stream Ollama-generated attack sequence
            async for text in generate_ollama_attack(domain_id, domain.compromise_percent):
                await websocket.send_text(text)
            
            # Add newlines between sequences
            await websocket.send_text("\n\n")
            
            # Wait before next sequence
            await asyncio.sleep(5)
            
    except WebSocketDisconnect:
        pass


@app.websocket("/ws/attack-fallback/{domain_id}")
async def websocket_attack_fallback(websocket: WebSocket, domain_id: str):
    """WebSocket for pre-generated attack output (fallback if Ollama unavailable)"""
    await websocket.accept()
    
    try:
        while True:
            domain = game_state.domains.get(domain_id)
            if not domain:
                await websocket.send_text("[ERROR] Domain not found")
                break
            
            # Stream fallback pre-generated attack
            async for text in generate_fallback_sequence(domain_id, domain.compromise_percent):
                await websocket.send_text(text)
            
            await asyncio.sleep(5)
            
    except WebSocketDisconnect:
        pass


@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    """WebSocket for AI chat with challenge system integration"""
    await websocket.accept()
    
    # Get or create chat session
    session = get_or_create_session("main")
    
    # Set up reward callback
    async def apply_reward(reward: dict):
        """Apply challenge reward to game state"""
        reward_type = reward.get("type")
        amount = reward.get("amount", 0)
        target = reward.get("target_sector")
        
        if reward_type == "time_bonus":
            # Add time (would need to implement in game_state)
            game_state.add_time_bonus(int(amount))
            mission_manager.log_event("challenge_reward", {
                "type": "time_bonus",
                "amount": amount
            })
        elif reward_type == "sector_reduction":
            # Reduce specific sector or random if none specified
            if target:
                game_state.adjust_domain(target, -amount)
            else:
                # Pick a random active sector
                import random
                active_sectors = [d.id for d in game_state.domains.values() if not d.is_secured]
                if active_sectors:
                    target = random.choice(active_sectors)
                    game_state.adjust_domain(target, -amount)
            mission_manager.log_event("challenge_reward", {
                "type": "sector_reduction",
                "sector": target,
                "amount": amount
            })
        elif reward_type == "all_reduction":
            game_state.adjust_all_domains(-amount)
            mission_manager.log_event("challenge_reward", {
                "type": "all_reduction",
                "amount": amount
            })
        elif reward_type == "slow_attack":
            # Could implement attack speed reduction
            mission_manager.log_event("challenge_reward", {
                "type": "slow_attack",
                "duration": amount
            })
        elif reward_type == "hint":
            # Send hint via websocket
            await websocket.send_json({
                "type": "hint",
                "message": "A password contains 'override'"
            })
        
        # Broadcast state update
        await manager.broadcast({
            "type": "state_update",
            "data": game_state.get_state()
        })
        await websocket.send_json({
            "type": "challenge_reward",
            "data": reward
        })
    
    # Set up penalty callback  
    async def apply_penalty(penalty: dict):
        """Apply challenge penalty to game state"""
        amount = penalty.get("amount", 5)
        game_state.adjust_all_domains(amount)
        mission_manager.log_event("challenge_penalty", {
            "amount": amount
        })
        
        await manager.broadcast({
            "type": "state_update",
            "data": game_state.get_state()
        })
        await websocket.send_json({
            "type": "challenge_penalty",
            "data": penalty
        })
    
    session.set_reward_callback(apply_reward)
    session.set_penalty_callback(apply_penalty)
    
    # Set up image generation callback for contextual ComfyUI images
    async def generate_contextual_image(prompt: str, trigger_type: str, context: str):
        """Generate a ComfyUI image based on chat context"""
        if not comfyui_service.enabled or comfyui_service.is_generating():
            return
        
        connected = await comfyui_service.check_connection()
        if not connected:
            return
        
        try:
            # Add student name to prompt if students are doing well
            top_students = game_state.get_top_students(limit=3)
            if top_students and trigger_type in ["defiance", "admiration"]:
                # Personalize with student name
                student_name = top_students[0].get("name", "").upper()
                if student_name:
                    prompt = f'{prompt}, text overlay saying "I SEE YOU {student_name}", warning message'
            
            print(f"[ComfyUI] Chat-triggered image ({trigger_type}): {prompt[:80]}...")
            print(f"[ComfyUI] Starting image generation...")
            
            image_bytes = await comfyui_service.generate_image(prompt)
            print(f"[ComfyUI] Image generation complete, bytes: {len(image_bytes) if image_bytes else 'None'}")
            if image_bytes:
                import base64
                image_b64 = base64.b64encode(image_bytes).decode('utf-8')
                await manager.broadcast({
                    "type": "comfyui_image",
                    "data": {
                        "image": image_b64,
                        "trigger_type": trigger_type,
                        "context": context
                    }
                })
        except Exception as e:
            print(f"[ComfyUI] Chat image generation error: {e}")
    
    session.set_image_callback(generate_contextual_image)
    
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            print(f"[WS-CHAT] Received message type: {msg.get('type')}")
            
            if msg.get("type") == "chat":
                user_message = msg.get("message", "")
                print(f"[WS-CHAT] User message: {user_message[:50]}...")
                
                # Update session with current threat level, student score, and top students
                session.update_threat_level(game_state.global_threat_level)
                session.update_student_score(game_state.student_score)
                session.update_top_students(game_state.top_students)
                
                # Stream AI response using challenge-aware session
                ai_response = ""
                await websocket.send_json({
                    "type": "chat_start",
                    "role": "assistant"
                })
                
                async for token in session.process_message(user_message):
                    ai_response += token
                    await websocket.send_json({
                        "type": "chat_token",
                        "token": token
                    })
                
                await websocket.send_json({
                    "type": "chat_end"
                })
                
                # Also update legacy history for compatibility
                manager.chat_history = session.conversation_history.copy()
                
    except WebSocketDisconnect:
        pass


# Serve frontend (if built)
@app.get("/")
async def root():
    return {"message": "A.R.D.N. Backend Active", "status": "operational"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8333)

