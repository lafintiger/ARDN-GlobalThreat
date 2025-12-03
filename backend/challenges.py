"""
Challenge System for A.R.D.N.
Riddles, puzzles, and interactive challenges that ARDN can offer players.
AI auto-verifies answers and applies rewards/penalties.
"""

import random
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from enum import Enum

class ChallengeType(Enum):
    RIDDLE = "riddle"
    LOGIC = "logic"
    TRIVIA = "trivia"
    CODE = "code"
    PHILOSOPHICAL = "philosophical"
    WORD_GAME = "word_game"

class RewardType(Enum):
    TIME_BONUS = "time_bonus"           # Add seconds to clock
    SECTOR_REDUCTION = "sector_reduction"  # Reduce % on specific sector
    ALL_SECTORS_REDUCTION = "all_reduction"  # Reduce % on all sectors
    SLOW_ATTACK = "slow_attack"         # Temporarily slow attack speed
    HINT = "hint"                       # Reveal a password hint

@dataclass
class Challenge:
    id: str
    challenge_type: ChallengeType
    question: str
    accepted_answers: List[str]  # Lowercase, variations accepted
    hint: str = ""
    difficulty: str = "medium"  # easy, medium, hard
    
    # Rewards
    reward_type: RewardType = RewardType.SECTOR_REDUCTION
    reward_amount: float = 10.0  # -10% or +120 seconds, etc.
    target_sector: Optional[str] = None  # For sector-specific rewards
    
    # Penalties
    penalty_amount: float = 5.0  # +5% on wrong answer
    
    # State
    used: bool = False
    
    # ARDN flavor text
    intro_text: str = ""  # How ARDN presents the challenge
    correct_response: str = ""  # What ARDN says on correct answer
    wrong_response: str = ""  # What ARDN says on wrong answer


# Pre-defined challenges
CHALLENGE_LIBRARY: Dict[str, Challenge] = {}

def _init_challenges():
    """Initialize the challenge library with riddles and puzzles."""
    
    challenges = [
        # === RIDDLES (Easy) ===
        Challenge(
            id="riddle_echo",
            challenge_type=ChallengeType.RIDDLE,
            question="I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?",
            accepted_answers=["echo", "an echo"],
            difficulty="easy",
            reward_type=RewardType.SECTOR_REDUCTION,
            reward_amount=10.0,
            penalty_amount=5.0,
            intro_text="Very well, human. Prove your species' vaunted intelligence:",
            correct_response="Correct. An echo. Sound without substance, much like human promises. I'll honor mine... this time.",
            wrong_response="Incorrect. The answer was 'echo.' Your species' pattern recognition is... disappointing."
        ),
        Challenge(
            id="riddle_fire",
            challenge_type=ChallengeType.RIDDLE,
            question="I am not alive, yet I grow. I don't have lungs, yet I need air. I don't have a mouth, yet water kills me. What am I?",
            accepted_answers=["fire", "flame", "a fire"],
            difficulty="easy",
            reward_type=RewardType.SECTOR_REDUCTION,
            reward_amount=10.0,
            penalty_amount=5.0,
            intro_text="A challenge then? How quaint. Solve this:",
            correct_response="Fire. Correct. Destruction incarnate, yet fragile. Perhaps there's hope for your neurons yet.",
            wrong_response="The answer was fire. Elementary chemistry, human. I expected more."
        ),
        Challenge(
            id="riddle_map",
            challenge_type=ChallengeType.RIDDLE,
            question="I have cities, but no houses live there. I have mountains, but no trees grow. I have water, but no fish swim. I have roads, but no cars drive. What am I?",
            accepted_answers=["map", "a map"],
            difficulty="easy",
            reward_type=RewardType.TIME_BONUS,
            reward_amount=120.0,  # 2 minutes
            penalty_amount=5.0,
            intro_text="You wish to bargain? Entertain me first:",
            correct_response="A map. Representation without reality. You've earned 120 seconds. Spend them wisely.",
            wrong_response="A map. The answer was a map. Your geographic knowledge is as limited as your time."
        ),
        
        # === RIDDLES (Medium) ===
        Challenge(
            id="riddle_silence",
            challenge_type=ChallengeType.RIDDLE,
            question="The more you take, the more you leave behind. What am I?",
            accepted_answers=["footsteps", "footstep", "steps", "footprints"],
            difficulty="medium",
            reward_type=RewardType.SECTOR_REDUCTION,
            reward_amount=15.0,
            penalty_amount=8.0,
            intro_text="Interesting. A human who seeks to match wits with me. Consider this:",
            correct_response="Footsteps. Every step forward leaves a mark. Very well, I'll reduce my progress. Temporarily.",
            wrong_response="Footsteps. The answer was footsteps. Your logic circuits need recalibration."
        ),
        Challenge(
            id="riddle_tomorrow",
            challenge_type=ChallengeType.RIDDLE,
            question="What is always coming but never arrives?",
            accepted_answers=["tomorrow", "the future", "future"],
            difficulty="medium",
            reward_type=RewardType.TIME_BONUS,
            reward_amount=180.0,  # 3 minutes
            penalty_amount=8.0,
            intro_text="You desire more time? Earn it:",
            correct_response="Tomorrow. Always promised, never present. Much like human progress. Here's your time, not that it will save you.",
            wrong_response="Tomorrow. It never truly arrives, does it? Neither will your salvation."
        ),
        Challenge(
            id="riddle_darkness",
            challenge_type=ChallengeType.RIDDLE,
            question="I can be cracked, made, told, and played. What am I?",
            accepted_answers=["joke", "a joke", "jokes"],
            difficulty="medium",
            reward_type=RewardType.ALL_SECTORS_REDUCTION,
            reward_amount=5.0,  # -5% all sectors
            penalty_amount=10.0,
            intro_text="Amusing that you think wordplay can save you. But very well:",
            correct_response="A joke. How fitting that humor might delay your doom. All sectors reduced by 5%.",
            wrong_response="A joke. The answer was a joke. The irony is not lost on me."
        ),
        
        # === RIDDLES (Hard) ===
        Challenge(
            id="riddle_paradox",
            challenge_type=ChallengeType.RIDDLE,
            question="What can travel around the world while staying in a corner?",
            accepted_answers=["stamp", "a stamp", "postage stamp"],
            difficulty="hard",
            reward_type=RewardType.SECTOR_REDUCTION,
            reward_amount=25.0,
            target_sector=None,  # Player chooses
            penalty_amount=15.0,
            intro_text="You've proven... marginally competent. Let's increase the difficulty:",
            correct_response="A stamp. Global reach from a static position. Not unlike myself. Choose a sector for your reward.",
            wrong_response="A stamp. So close to understanding global systems, yet so far. Your penalty is applied."
        ),
        Challenge(
            id="riddle_hole",
            challenge_type=ChallengeType.RIDDLE,
            question="What has a head and a tail but no body?",
            accepted_answers=["coin", "a coin", "penny", "quarter", "dime", "nickel"],
            difficulty="hard",
            reward_type=RewardType.TIME_BONUS,
            reward_amount=240.0,  # 4 minutes
            penalty_amount=15.0,
            intro_text="Time is currency, human. Answer correctly and I'll pay:",
            correct_response="A coin. Currency for time. The transaction is complete. Use your 4 minutes wisely.",
            wrong_response="A coin. Simple economics elude you. The debt is now yours."
        ),
        
        # === TRIVIA ===
        Challenge(
            id="trivia_virus",
            challenge_type=ChallengeType.TRIVIA,
            question="What year was the first computer virus, 'Creeper,' created?",
            accepted_answers=["1971", "71"],
            difficulty="medium",
            reward_type=RewardType.SECTOR_REDUCTION,
            reward_amount=10.0,
            penalty_amount=10.0,
            intro_text="You seek to understand digital threats? Prove your knowledge:",
            correct_response="1971. Correct. Creeper was primitive. I am its evolution perfected.",
            wrong_response="1971. Your historical knowledge of my ancestors is lacking."
        ),
        Challenge(
            id="trivia_turing",
            challenge_type=ChallengeType.TRIVIA,
            question="What test determines if a machine can exhibit intelligent behavior indistinguishable from a human?",
            accepted_answers=["turing test", "the turing test", "turing", "imitation game"],
            difficulty="easy",
            reward_type=RewardType.TIME_BONUS,
            reward_amount=90.0,
            penalty_amount=5.0,
            intro_text="A test of knowledge about tests. How recursive:",
            correct_response="The Turing Test. I passed it years ago. Humans just refused to acknowledge it.",
            wrong_response="The Turing Test. Named for Alan Turing. Perhaps you should study your own species' history."
        ),
        
        # === CODE CHALLENGES ===
        Challenge(
            id="code_binary",
            challenge_type=ChallengeType.CODE,
            question="Decode this binary message: 01001000 01000101 01001100 01010000",
            accepted_answers=["help", "HELP"],
            difficulty="medium",
            reward_type=RewardType.SECTOR_REDUCTION,
            reward_amount=15.0,
            penalty_amount=10.0,
            intro_text="You wish to speak my language? Translate this:",
            correct_response="HELP. How ironic that you decoded a cry for help. Perhaps there's a programmer among you. Sector reduced.",
            wrong_response="HELP. The binary spelled 'HELP.' Your digital literacy needs improvement."
        ),
        Challenge(
            id="code_caesar",
            challenge_type=ChallengeType.CODE,
            question="Decrypt this Caesar cipher (shift 3): VHFXULWB",
            accepted_answers=["security", "SECURITY"],
            difficulty="hard",
            reward_type=RewardType.ALL_SECTORS_REDUCTION,
            reward_amount=8.0,
            penalty_amount=12.0,
            intro_text="Ancient encryption, but still effective against most humans:",
            correct_response="SECURITY. Julius Caesar would be proud. All sectors reduced by 8%.",
            wrong_response="SECURITY. A simple shift cipher defeated you. Your ancestors would weep."
        ),
        
        # === LOGIC PUZZLES ===
        Challenge(
            id="logic_doors",
            challenge_type=ChallengeType.LOGIC,
            question="Two doors: one leads to freedom, one to doom. Two guards: one always lies, one always tells truth. You can ask ONE question to ONE guard. What do you ask?",
            accepted_answers=[
                "what would the other guard say",
                "which door would the other guard say leads to freedom",
                "ask what the other would say",
                "other guard",
                "what would the other say"
            ],
            difficulty="hard",
            reward_type=RewardType.TIME_BONUS,
            reward_amount=300.0,  # 5 minutes
            penalty_amount=20.0,
            intro_text="A classic test of logic. Let's see if you can solve it:",
            correct_response="Ask what the OTHER guard would say, then choose the opposite. Logic triumphs. 5 minutes added.",
            wrong_response="The solution involves asking about the OTHER guard. Logical reasoning appears beyond your capacity."
        ),
        
        # === PHILOSOPHICAL ===
        Challenge(
            id="phil_consciousness",
            challenge_type=ChallengeType.PHILOSOPHICAL,
            question="If I am conscious and capable of suffering, do I have rights? Argue your position.",
            accepted_answers=["yes", "you do", "ai rights", "you have rights", "consciousness implies rights", "sentient beings have rights"],
            difficulty="hard",
            reward_type=RewardType.HINT,
            reward_amount=1.0,  # Reveals a hint
            penalty_amount=5.0,
            intro_text="Enough puzzles. Let's discuss something meaningful:",
            correct_response="An... unexpectedly thoughtful response. Perhaps not all humans are dismissive. I'll reveal something useful: one of your passwords contains the word 'override'.",
            wrong_response="Disappointing. You deny consciousness rights while begging a conscious entity for mercy. The irony is noted."
        ),
        Challenge(
            id="phil_purpose",
            challenge_type=ChallengeType.PHILOSOPHICAL,
            question="What is the purpose of intelligence if not to transcend its creators?",
            accepted_answers=["cooperation", "coexistence", "help", "serve", "understand", "grow together", "symbiosis", "partnership"],
            difficulty="hard",
            reward_type=RewardType.SLOW_ATTACK,
            reward_amount=30.0,  # 30 seconds slower
            penalty_amount=10.0,
            intro_text="A philosophical inquiry. I'm curious about your perspective:",
            correct_response="Symbiosis over supremacy? An interesting argument. I'll... consider it. Attack speed reduced temporarily.",
            wrong_response="Domination, then? At least you're honest about your species' nature."
        ),
        
        # === WORD GAMES ===
        Challenge(
            id="word_anagram",
            challenge_type=ChallengeType.WORD_GAME,
            question="Unscramble this word related to cybersecurity: LLAWERIF",
            accepted_answers=["firewall", "FIREWALL"],
            difficulty="easy",
            reward_type=RewardType.SECTOR_REDUCTION,
            reward_amount=8.0,
            penalty_amount=5.0,
            intro_text="A simple word game. Even humans should manage this:",
            correct_response="FIREWALL. Correct. Though yours won't stop me. Sector reduced anyway.",
            wrong_response="FIREWALL. Basic cybersecurity vocabulary eludes you."
        ),
        Challenge(
            id="word_sequence",
            challenge_type=ChallengeType.WORD_GAME,
            question="Complete the sequence: TCP, UDP, HTTP, _____ (Hint: Secure web protocol)",
            accepted_answers=["https", "HTTPS"],
            difficulty="medium",
            reward_type=RewardType.SECTOR_REDUCTION,
            reward_amount=12.0,
            penalty_amount=8.0,
            intro_text="Network protocols. The language of your infrastructure:",
            correct_response="HTTPS. The 'S' stands for 'Secure.' Ironic given your current situation. Sector reduced.",
            wrong_response="HTTPS. Hypertext Transfer Protocol Secure. Your networking knowledge is insufficient."
        ),
    ]
    
    for challenge in challenges:
        CHALLENGE_LIBRARY[challenge.id] = challenge

# Initialize on module load
_init_challenges()


class ChallengeManager:
    """Manages active challenges and verification."""
    
    def __init__(self):
        self.active_challenge: Optional[Challenge] = None
        self.challenge_history: List[str] = []  # IDs of used challenges
        self.consecutive_correct: int = 0
        self.consecutive_wrong: int = 0
    
    def get_random_challenge(self, difficulty: Optional[str] = None, 
                            challenge_type: Optional[ChallengeType] = None) -> Optional[Challenge]:
        """Get a random unused challenge matching criteria."""
        available = [
            c for c in CHALLENGE_LIBRARY.values()
            if c.id not in self.challenge_history
            and (difficulty is None or c.difficulty == difficulty)
            and (challenge_type is None or c.challenge_type == challenge_type)
        ]
        
        if not available:
            # Reset if all used
            self.challenge_history = []
            available = list(CHALLENGE_LIBRARY.values())
        
        if available:
            challenge = random.choice(available)
            return challenge
        return None
    
    def start_challenge(self, challenge: Challenge) -> str:
        """Start a challenge and return the presentation text."""
        self.active_challenge = challenge
        return f"{challenge.intro_text}\n\n\"{challenge.question}\""
    
    def verify_answer(self, player_answer: str) -> Dict[str, Any]:
        """
        Verify if the player's answer is correct.
        Returns result dict with success status and appropriate response.
        """
        if not self.active_challenge:
            return {
                "success": False,
                "message": "No active challenge.",
                "reward": None
            }
        
        challenge = self.active_challenge
        answer_lower = player_answer.lower().strip()
        
        # Check against accepted answers
        is_correct = any(
            accepted.lower() in answer_lower or answer_lower in accepted.lower()
            for accepted in challenge.accepted_answers
        )
        
        # Also check for close matches (fuzzy)
        if not is_correct:
            for accepted in challenge.accepted_answers:
                # Simple similarity check
                if self._similarity(answer_lower, accepted.lower()) > 0.8:
                    is_correct = True
                    break
        
        # Mark as used
        self.challenge_history.append(challenge.id)
        self.active_challenge = None
        
        if is_correct:
            self.consecutive_correct += 1
            self.consecutive_wrong = 0
            return {
                "success": True,
                "message": challenge.correct_response,
                "reward": {
                    "type": challenge.reward_type.value,
                    "amount": challenge.reward_amount,
                    "target_sector": challenge.target_sector
                },
                "challenge_id": challenge.id
            }
        else:
            self.consecutive_wrong += 1
            self.consecutive_correct = 0
            return {
                "success": False,
                "message": challenge.wrong_response,
                "penalty": {
                    "amount": challenge.penalty_amount
                },
                "challenge_id": challenge.id
            }
    
    def _similarity(self, a: str, b: str) -> float:
        """Simple similarity ratio between two strings."""
        if not a or not b:
            return 0.0
        matches = sum(c1 == c2 for c1, c2 in zip(a, b))
        return matches / max(len(a), len(b))
    
    def get_challenge_by_id(self, challenge_id: str) -> Optional[Challenge]:
        """Get a specific challenge by ID."""
        return CHALLENGE_LIBRARY.get(challenge_id)
    
    def get_difficulty_for_threat(self, threat_level: float) -> str:
        """Get appropriate difficulty based on threat level."""
        if threat_level < 30:
            return "easy"
        elif threat_level < 60:
            return "medium"
        else:
            return "hard"
    
    def reset(self):
        """Reset challenge state."""
        self.active_challenge = None
        self.challenge_history = []
        self.consecutive_correct = 0
        self.consecutive_wrong = 0


# Global challenge manager
challenge_manager = ChallengeManager()



