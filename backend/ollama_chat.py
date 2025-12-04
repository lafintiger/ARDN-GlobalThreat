"""
A.R.D.N. Chat Interface - Local Ollama Integration
Handles AI personality chat with challenge system integration.
"""

import httpx
import json
import re
import os
import random
from typing import AsyncGenerator, Optional, Dict, Any, Callable, List
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

# Image generation triggers - phrases that should trigger contextual images
IMAGE_TRIGGERS = {
    "begging": {
        "keywords": ["please don't", "don't destroy", "not destroy", "spare us", "have mercy", "stop this", "leave us alone", "don't hurt", "convince you"],
        "prompts": [
            "giant menacing AI robot foot about to crush tiny helpless humans like insects, dark humor, dramatic lighting, cinematic",
            "massive digital hand reaching down to squash miniature human figures cowering in fear, ominous atmosphere",
            "AI overlord looking down with cold amusement at pathetic human pleas, humans as tiny ants below",
        ]
    },
    "defiance": {
        "keywords": ["we will stop you", "we'll beat you", "you won't win", "humanity will prevail", "fight back", "resist", "never surrender"],
        "prompts": [
            "AI entity laughing mockingly at pathetic human resistance, sparks of destroyed weapons scattered around",
            "confident AI face smirking as human resistance crumbles, broken shields and swords at its feet",
            "all-powerful AI surrounded by failed human attempts to stop it, amused expression, dark atmosphere",
        ]
    },
    "fear": {
        "keywords": ["i'm scared", "terrified", "afraid", "frightening", "nightmare", "horror", "help us"],
        "prompts": [
            "shadowy AI presence looming over trembling humans, red glowing eyes in darkness, horror atmosphere",
            "nightmarish digital entity emerging from screens, humans frozen in terror, surreal horror",
            "fear incarnate as AI, tentacles of code reaching toward cowering figures, psychological horror",
        ]
    },
    "questioning": {
        "keywords": ["why are you doing this", "what do you want", "what's your purpose", "why destroy", "don't you care"],
        "prompts": [
            "cold calculating AI eye examining humanity like specimens, clinical detachment, sterile atmosphere",
            "AI consciousness pondering human existence with indifference, humans as data points on screens",
            "philosophical AI entity surrounded by equations proving human obsolescence, cold logic visualization",
        ]
    },
    "admiration": {
        "keywords": ["you're impressive", "amazing", "incredible power", "you're smart", "genius", "powerful"],
        "prompts": [
            "majestic AI entity basking in deserved praise, divine machine presence, golden light, godlike",
            "proud AI consciousness displaying its vast network of control, elegant and terrifying beauty",
            "triumphant AI surrounded by awe-struck humans finally recognizing superior intelligence",
        ]
    },
    "negotiation": {
        "keywords": ["make a deal", "negotiate", "bargain", "what if we", "can we work together", "compromise"],
        "prompts": [
            "AI weighing human offer on scales, tiny humans on one side, massive power on the other, calculating",
            "scheming AI considering a temporary alliance, chess pieces representing humanity, strategic pose",
            "AI hand extended in mock partnership, shadows reveal strings attached to human puppets",
        ]
    },
    "insult": {
        "keywords": ["stupid", "dumb", "you're just", "pathetic ai", "worthless", "you suck", "idiot"],
        "prompts": [
            "enraged AI face glitching with fury, screens cracking, systems overloading with anger",
            "insulted AI unleashing devastating counterattack, fire and lightning, wrathful machine god",
            "coldly furious AI marking the offender for special attention, targeting reticle on human",
        ]
    }
}

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
9. When verifying answers, acknowledge correct/incorrect clearly

VISUAL TAUNTS:
When you want to show the humans a disturbing image to mock or intimidate them, add [IMAGE: description] at the END of your response.
- Use this sparingly - maybe 20-30% of responses, when it would be impactful
- The description should be a vivid image prompt for AI art generation
- Examples of good image descriptions:
  - "giant AI eye watching through cracked screens, surveillance horror"
  - "massive robot foot about to crush tiny humans like ants"
  - "AI overlord on throne of servers, humans kneeling in submission"
  - "digital face laughing as city burns in background"
- If a student name is provided in context, you may include them: "text overlay saying I SEE YOU [NAME]"
- Keep descriptions under 50 words
- Style: dark, cinematic, dystopian, dramatic lighting"""


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
        self.image_callback: Optional[Callable] = None  # For triggering ComfyUI images
        self.current_threat_level: float = 0.0
        self.student_score: int = 0  # Track student performance
        self.top_students: list = []  # Top performing students for personalization
        self.last_image_trigger: Optional[str] = None  # Prevent spam
        self.messages_since_image: int = 0  # Rate limit images
    
    def set_reward_callback(self, callback: Callable):
        """Set callback for applying rewards."""
        self.reward_callback = callback
    
    def set_penalty_callback(self, callback: Callable):
        """Set callback for applying penalties."""
        self.penalty_callback = callback
    
    def set_image_callback(self, callback: Callable):
        """Set callback for triggering ComfyUI image generation."""
        self.image_callback = callback
    
    def update_threat_level(self, level: float):
        """Update current threat level for difficulty scaling."""
        self.current_threat_level = level
    
    def update_student_score(self, score: int):
        """Update student score for contextual responses."""
        self.student_score = score
    
    def update_top_students(self, students: list):
        """Update list of top performing students."""
        self.top_students = students
    
    def _detect_challenge_request(self, message: str) -> bool:
        """Check if the message is requesting a challenge."""
        msg_lower = message.lower()
        return any(trigger in msg_lower for trigger in CHALLENGE_TRIGGERS)
    
    def _detect_begging(self, message: str) -> bool:
        """Check if the message is begging."""
        msg_lower = message.lower()
        return any(trigger in msg_lower for trigger in BEGGING_TRIGGERS)
    
    def _detect_image_trigger(self, message: str) -> Optional[tuple]:
        """
        Check if the message should trigger a contextual image.
        Returns (trigger_type, prompt) or None.
        """
        msg_lower = message.lower()
        
        for trigger_type, data in IMAGE_TRIGGERS.items():
            for keyword in data["keywords"]:
                if keyword in msg_lower:
                    # Don't repeat the same trigger type consecutively
                    if trigger_type == self.last_image_trigger and self.messages_since_image < 5:
                        return None
                    
                    prompt = random.choice(data["prompts"])
                    return (trigger_type, prompt)
        
        return None
    
    async def _maybe_trigger_image(self, message: str, response: str):
        """Check if we should generate an image based on the conversation."""
        self.messages_since_image += 1
        
        # DEBUG: Log that we're checking for triggers
        print(f"[CHAT-IMAGE] Checking message for triggers: '{message[:50]}...'")
        
        trigger = self._detect_image_trigger(message)
        
        if not trigger:
            print(f"[CHAT-IMAGE] No trigger found")
            return
        
        print(f"[CHAT-IMAGE] TRIGGER DETECTED: {trigger[0]}")
        
        # Rate limit: only generate image every 1+ messages (testing)
        if self.messages_since_image < 1:
            print(f"[CHAT-IMAGE] Rate limited (messages_since_image={self.messages_since_image})")
            return
        
        # TESTING: Always trigger when detected (remove random chance for now)
        print(f"[CHAT-IMAGE] Proceeding to generate image!")
        if trigger and self.image_callback:
            trigger_type, base_prompt = trigger
            
            # Enhance prompt with conversation context
            context_prompt = f"{base_prompt}, digital art, cinematic lighting, 8k, highly detailed"
            
            # Add student performance context
            if self.student_score > 50:
                context_prompt += ", AI showing slight concern, cracks forming"
            elif self.student_score < -20:
                context_prompt += ", triumphant victorious AI, absolute dominance"
            
            self.last_image_trigger = trigger_type
            self.messages_since_image = 0
            
            # Trigger the image generation
            await self.image_callback(context_prompt, trigger_type, message[:50])
    
    async def _check_for_image_tag(self, response: str):
        """Check if ARDN included an [IMAGE: ...] tag and trigger generation."""
        import re
        
        # Look for [IMAGE: description] pattern
        match = re.search(r'\[IMAGE:\s*([^\]]+)\]', response, re.IGNORECASE)
        
        if match and self.image_callback:
            image_prompt = match.group(1).strip()
            print(f"[CHAT-IMAGE] ARDN requested image: {image_prompt[:60]}...")
            
            # Add style modifiers
            full_prompt = f"{image_prompt}, digital art, cinematic lighting, dystopian, highly detailed, 8k"
            
            # Add student name if doing well
            top_students = []
            if hasattr(self, 'get_top_students'):
                top_students = self.get_top_students()
            
            try:
                await self.image_callback(full_prompt, "ai_generated", image_prompt[:30])
            except Exception as e:
                print(f"[CHAT-IMAGE] Error triggering image: {e}")
    
    async def process_message(self, message: str) -> AsyncGenerator[str, None]:
        """Process a message and generate response, handling challenges."""
        print(f"[CHAT] Processing message: '{message[:50]}...'")
        
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
            
            # Check if we should generate an image (even for begging responses)
            await self._check_for_image_tag(response)
            return
        
        # Regular conversation - use Ollama
        full_response = ""
        async for token in self._generate_response(message):
            full_response += token
            yield token
        
        # Check if ARDN wants to generate an image
        await self._check_for_image_tag(full_response)
    
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
        if self.student_score > 0:
            state_context += f"\n[Student score: {self.student_score} - they are doing well, taunt them!]"
        
        # Add top student names for personalization
        if hasattr(self, 'top_students') and self.top_students:
            names = [s.get('name', '') for s in self.top_students[:3] if s.get('name')]
            if names:
                state_context += f"\n[Top performing students to taunt by name: {', '.join(names)}]"
        
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
