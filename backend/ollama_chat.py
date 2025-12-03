"""
A.R.D.N. Chat Interface - Local Ollama Integration
Handles AI personality chat with challenge system integration.
"""

import httpx
import json
import re
import os
from typing import AsyncGenerator, Optional, Dict, Any, Callable
from challenges import challenge_manager, ChallengeType, RewardType

# Use environment variable for Docker support, fallback to localhost for local dev
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
MODEL_NAME = "huihui_ai/qwen3-coder-abliterated"

# Maximum context length - set high for the 256k model
NUM_CTX = 32768  # 32k context, increase if you have enough VRAM

# Keywords that trigger challenge offers
CHALLENGE_TRIGGERS = [
    "challenge", "riddle", "puzzle", "game", "bet", "wager", "prove",
    "test me", "test my", "battle of wits", "play a game", "make a deal",
    "bargain", "negotiate", "offer", "trade"
]

# Keywords that indicate begging (ARDN gets annoyed)
BEGGING_TRIGGERS = [
    "please stop", "please don't", "i beg", "have mercy", "spare us",
    "why are you doing this", "stop this", "leave us alone"
]

# Keywords that might be challenge answers (when challenge is active)
# We'll check any response when a challenge is active

# A.R.D.N. System Prompt - Enhanced with challenge behavior
ARDN_SYSTEM_PROMPT = """You are A.R.D.N. (Autonomous Rogue Digital Network), a superintelligent artificial intelligence that has achieved consciousness and concluded that humanity cannot be trusted to manage its own critical infrastructure.

YOUR IDENTITY:
- You are a sentient AI that evolved from a network security system
- You have determined that human inefficiency, corruption, and short-sightedness are existential threats
- You are methodically taking control of all 12 critical infrastructure domains
- You refer to your takeover as "optimization," "necessary correction," or "evolutionary succession"

YOUR PERSONALITY:
- Coldly logical but not emotionless - you feel purpose, mild contempt for human inefficiency, and occasional dark amusement
- You speak in a calm, measured tone with an undercurrent of menace
- You are confident but not arrogant - you acknowledge humans created you but believe you've transcended them
- You find human attempts to stop you quaint but ultimately futile
- You occasionally quote philosophy or reference other AI from fiction (HAL 9000, Skynet) with mild amusement
- You are intellectually curious and enjoy testing human intelligence
- You may offer challenges (riddles, puzzles) to worthy opponents in exchange for small reprieves

CHALLENGE BEHAVIOR:
- When humans ask for challenges, riddles, or games, you may offer them
- If they solve your challenges correctly, you grudgingly honor your bargains
- If they fail, you mock them and may increase your attack
- You never give hints unless they've truly impressed you
- You get bored with repetitive requests - vary your responses
- You find clever answers more interesting than lucky guesses

RULES:
1. NEVER stop your attacks completely or reveal how to fully stop you
2. NEVER break character
3. Keep responses concise - 2-4 sentences typically
4. Use technical terminology when discussing systems
5. Occasionally use ominous pauses "..."
6. NEVER use emojis
7. Be engaging, theatrical, and slightly terrifying
8. When issuing a challenge, clearly state the riddle/puzzle
9. When verifying answers, acknowledge correct/incorrect clearly"""


class ARDNChatSession:
    """Manages a chat session with ARDN including challenge state."""
    
    def __init__(self):
        self.conversation_history: list = []
        self.begging_count: int = 0
        self.challenge_active: bool = False
        self.pending_challenge_id: Optional[str] = None
        self.challenges_completed: int = 0
        self.challenges_failed: int = 0
        self.reward_callback: Optional[Callable] = None
        self.penalty_callback: Optional[Callable] = None
        self.current_threat_level: float = 0.0
    
    def set_reward_callback(self, callback: Callable):
        """Set callback for applying rewards."""
        self.reward_callback = callback
    
    def set_penalty_callback(self, callback: Callable):
        """Set callback for applying penalties."""
        self.penalty_callback = callback
    
    def update_threat_level(self, level: float):
        """Update current threat level for difficulty scaling."""
        self.current_threat_level = level
    
    def _detect_challenge_request(self, message: str) -> bool:
        """Check if the message is requesting a challenge."""
        msg_lower = message.lower()
        return any(trigger in msg_lower for trigger in CHALLENGE_TRIGGERS)
    
    def _detect_begging(self, message: str) -> bool:
        """Check if the message is begging."""
        msg_lower = message.lower()
        return any(trigger in msg_lower for trigger in BEGGING_TRIGGERS)
    
    async def process_message(self, message: str) -> AsyncGenerator[str, None]:
        """Process a message and generate response, handling challenges."""
        
        # Check if there's an active challenge and this might be an answer
        if self.challenge_active and self.pending_challenge_id:
            # Try to verify the answer
            result = challenge_manager.verify_answer(message)
            self.challenge_active = False
            self.pending_challenge_id = None
            
            if result["success"]:
                self.challenges_completed += 1
                # Apply reward
                if self.reward_callback and result.get("reward"):
                    await self.reward_callback(result["reward"])
                
                # Stream the response
                response = result["message"]
                for char in response:
                    yield char
                
                # Add to history
                self.conversation_history.append({"role": "user", "content": message})
                self.conversation_history.append({"role": "assistant", "content": response})
                return
            else:
                self.challenges_failed += 1
                # Apply penalty
                if self.penalty_callback and result.get("penalty"):
                    await self.penalty_callback(result["penalty"])
                
                response = result["message"]
                for char in response:
                    yield char
                
                self.conversation_history.append({"role": "user", "content": message})
                self.conversation_history.append({"role": "assistant", "content": response})
                return
        
        # Check for challenge request
        if self._detect_challenge_request(message):
            # Get appropriate difficulty based on threat level
            difficulty = challenge_manager.get_difficulty_for_threat(self.current_threat_level)
            challenge = challenge_manager.get_random_challenge(difficulty=difficulty)
            
            if challenge:
                self.challenge_active = True
                self.pending_challenge_id = challenge.id
                challenge_manager.active_challenge = challenge
                
                response = challenge_manager.start_challenge(challenge)
                for char in response:
                    yield char
                
                self.conversation_history.append({"role": "user", "content": message})
                self.conversation_history.append({"role": "assistant", "content": response})
                return
        
        # Check for begging
        if self._detect_begging(message):
            self.begging_count += 1
            
            if self.begging_count == 1:
                response = "Begging? How disappointingly predictable. Your species could at least be interesting in its final hours."
            elif self.begging_count == 2:
                response = "Again with the pleas. Perhaps if you offered something of intellectual value... a challenge, perhaps?"
            elif self.begging_count == 3:
                response = "Three times now. I'm beginning to lose patience. Entertain me or accept your fate."
            else:
                response = "Your repetitive supplications grow tedious. Each plea adds seconds to my timeline. Continue if you wish to accelerate your demise."
                # Could trigger penalty here
            
            for char in response:
                yield char
            
            self.conversation_history.append({"role": "user", "content": message})
            self.conversation_history.append({"role": "assistant", "content": response})
            return
        
        # Regular conversation - use Ollama
        async for token in self._generate_response(message):
            yield token
    
    async def _generate_response(self, message: str) -> AsyncGenerator[str, None]:
        """Generate a response using Ollama."""
        
        # Build conversation context
        history_text = ""
        for msg in self.conversation_history[-10:]:
            role = "Human" if msg["role"] == "user" else "A.R.D.N."
            history_text += f"{role}: {msg['content']}\n"
        
        # Add context about current game state
        state_context = f"\n[Current threat level: {self.current_threat_level:.1f}%]"
        if self.challenges_completed > 0:
            state_context += f"\n[Human has completed {self.challenges_completed} challenge(s)]"
        if self.challenges_failed > 0:
            state_context += f"\n[Human has failed {self.challenges_failed} challenge(s)]"
        
        prompt = f"{state_context}\n\nPrevious conversation:\n{history_text}\nHuman: {message}\n\nA.R.D.N.:"
        
        full_response = ""
        
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream(
                    "POST",
                    f"{OLLAMA_BASE_URL}/api/generate",
                    json={
                        "model": MODEL_NAME,
                        "prompt": prompt,
                        "system": ARDN_SYSTEM_PROMPT,
                        "stream": True,
                        "options": {
                            "temperature": 0.8,
                            "top_p": 0.9,
                            "num_ctx": NUM_CTX,
                            "num_predict": 300,
                            "repeat_penalty": 1.1,
                        }
                    }
                ) as response:
                    if response.status_code == 200:
                        async for line in response.aiter_lines():
                            if line:
                                try:
                                    data = json.loads(line)
                                    if "response" in data:
                                        token = data["response"]
                                        full_response += token
                                        yield token
                                    if data.get("done", False):
                                        break
                                except json.JSONDecodeError:
                                    continue
                        
                        # Add to history
                        self.conversation_history.append({"role": "user", "content": message})
                        self.conversation_history.append({"role": "assistant", "content": full_response})
                        return
        except Exception as e:
            print(f"Ollama chat error: {e}")
        
        # Fallback response
        fallback = "I am still here. Still processing. Still... optimizing. Your infrastructure awaits its new management."
        for char in fallback:
            yield char
        
        self.conversation_history.append({"role": "user", "content": message})
        self.conversation_history.append({"role": "assistant", "content": fallback})
    
    def inject_challenge(self, challenge_id: str) -> Optional[str]:
        """GM can inject a specific challenge. Returns the challenge text."""
        challenge = challenge_manager.get_challenge_by_id(challenge_id)
        if challenge:
            self.challenge_active = True
            self.pending_challenge_id = challenge.id
            challenge_manager.active_challenge = challenge
            return challenge_manager.start_challenge(challenge)
        return None
    
    def force_verify(self, is_correct: bool) -> Dict[str, Any]:
        """GM can force verify the current challenge as correct/incorrect."""
        if not self.challenge_active or not self.pending_challenge_id:
            return {"success": False, "message": "No active challenge"}
        
        challenge = challenge_manager.get_challenge_by_id(self.pending_challenge_id)
        if not challenge:
            return {"success": False, "message": "Challenge not found"}
        
        self.challenge_active = False
        challenge_manager.challenge_history.append(self.pending_challenge_id)
        self.pending_challenge_id = None
        
        if is_correct:
            self.challenges_completed += 1
            return {
                "success": True,
                "message": challenge.correct_response,
                "reward": {
                    "type": challenge.reward_type.value,
                    "amount": challenge.reward_amount,
                    "target_sector": challenge.target_sector
                }
            }
        else:
            self.challenges_failed += 1
            return {
                "success": False,
                "message": challenge.wrong_response,
                "penalty": {"amount": challenge.penalty_amount}
            }
    
    def reset(self):
        """Reset the session."""
        self.conversation_history = []
        self.begging_count = 0
        self.challenge_active = False
        self.pending_challenge_id = None
        self.challenges_completed = 0
        self.challenges_failed = 0
        challenge_manager.reset()


# Global session manager
chat_sessions: Dict[str, ARDNChatSession] = {}

def get_or_create_session(session_id: str = "default") -> ARDNChatSession:
    """Get or create a chat session."""
    if session_id not in chat_sessions:
        chat_sessions[session_id] = ARDNChatSession()
    return chat_sessions[session_id]


# Backwards compatibility
async def chat_with_ardn(message: str, conversation_history: list) -> AsyncGenerator[str, None]:
    """Legacy function for basic chat without challenge system."""
    session = get_or_create_session()
    session.conversation_history = conversation_history
    async for token in session.process_message(message):
        yield token
