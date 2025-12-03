"""
A.R.D.N. - Autonomous Rogue Digital Network
FastAPI Backend Server for Escape Room Experience
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List, Dict
import asyncio
import json

from game_state import game_state, Password
from ollama_service import generate_ollama_attack, generate_fallback_sequence
from ollama_chat import chat_with_ardn

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
    await manager.broadcast({
        "type": "state_update",
        "data": game_state.get_state()
    })
    return {"success": True, "message": "Game reset"}


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
    """WebSocket for AI chat"""
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            
            if msg.get("type") == "chat":
                user_message = msg.get("message", "")
                
                # Add user message to history
                manager.chat_history.append({
                    "role": "user",
                    "content": user_message
                })
                
                # Stream AI response
                ai_response = ""
                await websocket.send_json({
                    "type": "chat_start",
                    "role": "assistant"
                })
                
                async for token in chat_with_ardn(user_message, manager.chat_history):
                    ai_response += token
                    await websocket.send_json({
                        "type": "chat_token",
                        "token": token
                    })
                
                await websocket.send_json({
                    "type": "chat_end"
                })
                
                # Add AI response to history
                manager.chat_history.append({
                    "role": "assistant",
                    "content": ai_response
                })
                
    except WebSocketDisconnect:
        pass


# Serve frontend (if built)
@app.get("/")
async def root():
    return {"message": "A.R.D.N. Backend Active", "status": "operational"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8333)

