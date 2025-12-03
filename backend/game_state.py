"""
Game state management for A.R.D.N. escape room experience.
Handles domain compromise levels, passwords, and game progression.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Callable
import asyncio
import random
import time

@dataclass
class Domain:
    id: str
    name: str
    icon: str
    description: str
    compromise_percent: float = 0.0
    status: str = "SCANNING"
    attack_speed: float = 1.0
    is_active: bool = True
    is_locked: bool = False  # When True, sector won't increase
    is_secured: bool = False  # Fully secured (0% and locked)

@dataclass 
class Password:
    code: str
    domain_id: Optional[str]
    reduction_percent: float
    one_time: bool = True
    used: bool = False
    hint: str = ""

class GameState:
    def __init__(self):
        self.domains: Dict[str, Domain] = self._init_domains()
        self.passwords: Dict[str, Password] = {}
        self.global_threat_level: float = 0.0
        self.game_active: bool = False
        
        # Session timing
        self.session_duration_minutes: int = 60  # Default 60 minutes
        self.start_time: Optional[float] = None
        self.elapsed_seconds: int = 0
        
        # Callbacks
        self.on_update_callbacks: List[Callable] = []
        self._attack_task: Optional[asyncio.Task] = None
        
        # Initialize default passwords
        self._init_default_passwords()
    
    def _init_domains(self) -> Dict[str, Domain]:
        """Initialize all critical infrastructure domains."""
        domains_data = [
            ("financial", "Financial Systems", "💰", "Banking, stock markets, payment processing"),
            ("telecom", "Telecommunications", "📡", "Cell networks, internet backbone, satellites"),
            ("power", "Power Grid", "⚡", "Electrical infrastructure, nuclear plants"),
            ("water", "Water Systems", "💧", "Treatment plants, distribution networks"),
            ("transport", "Transportation", "🚆", "Air traffic, rail systems, traffic control"),
            ("healthcare", "Healthcare", "🏥", "Hospitals, medical devices, pharma supply"),
            ("government", "Government/Military", "🛡️", "Defense networks, intelligence agencies"),
            ("emergency", "Emergency Services", "🚨", "911 dispatch, first responders"),
            ("satellite", "Satellite/Space", "🛰️", "GPS, weather, communications satellites"),
            ("supply", "Supply Chain", "📦", "Shipping, logistics, port systems"),
            ("media", "Media/Broadcast", "📺", "News networks, social media, broadcasting"),
            ("nuclear", "Nuclear Systems", "☢️", "Reactor controls, enrichment facilities"),
        ]
        
        domains = {}
        for id, name, icon, desc in domains_data:
            domains[id] = Domain(
                id=id,
                name=name, 
                icon=icon,
                description=desc,
                compromise_percent=random.uniform(5, 15),  # Start with some compromise
                attack_speed=random.uniform(0.8, 1.2)  # Slight variation per domain
            )
        return domains
    
    def _init_default_passwords(self):
        """Initialize default passwords for testing."""
        default_passwords = [
            Password("FIREWALL_ALPHA", "financial", 15.0, True, False, "Check the firewall logs"),
            Password("GRID_SECURE_7", "power", 20.0, True, False, "Power station access code"),
            Password("MEDIC_OVERRIDE", "healthcare", 15.0, True, False, "Hospital emergency protocol"),
            Password("ORBITAL_DECAY", "satellite", 25.0, True, False, "Satellite command sequence"),
            Password("GLOBAL_RESET", None, 10.0, True, False, "Affects all systems"),
            Password("BACKDOOR_EXIT", None, 5.0, False, False, "Reusable emergency code"),
            Password("NUCLEAR_FAILSAFE", "nuclear", 30.0, True, False, "Reactor emergency shutdown"),
            Password("WATER_PURGE", "water", 20.0, True, False, "Treatment plant override"),
            Password("COMM_BLACKOUT", "telecom", 15.0, True, False, "Network isolation protocol"),
            Password("EVAC_PROTOCOL", "emergency", 20.0, True, False, "Emergency services backup"),
        ]
        for pw in default_passwords:
            self.passwords[pw.code.upper()] = pw
    
    def set_session_duration(self, minutes: int):
        """Set the session duration in minutes (30, 40, 60, etc.)"""
        self.session_duration_minutes = max(10, min(120, minutes))  # Clamp 10-120 min
    
    def _calculate_attack_increment(self) -> float:
        """
        Calculate attack increment based on session duration.
        We want to go from ~10% average to 100% in the session time.
        With updates every 2 seconds, that's (session_minutes * 30) updates.
        Need to cover ~90% in that time, so increment = 90 / (minutes * 30)
        """
        updates_in_session = self.session_duration_minutes * 30  # Updates every 2 sec
        base_increment = 90.0 / updates_in_session  # ~90% to cover
        return base_increment
    
    def _calculate_eta_seconds(self) -> int:
        """
        Calculate estimated seconds until total collapse (all at 100%).
        Based on current average and attack rate.
        """
        if not self.game_active:
            return self.session_duration_minutes * 60
        
        # Calculate remaining percentage to cover
        avg_compromise = self.global_threat_level
        remaining_percent = 100 - avg_compromise
        
        if remaining_percent <= 0:
            return 0
        
        # Calculate time based on attack rate
        base_increment = self._calculate_attack_increment()
        if base_increment <= 0:
            return 9999
        
        updates_needed = remaining_percent / base_increment
        seconds_remaining = int(updates_needed * 2)  # 2 seconds per update
        
        return max(0, seconds_remaining)
    
    def _calculate_time_remaining(self) -> int:
        """Calculate remaining session time in seconds."""
        if not self.game_active or self.start_time is None:
            return self.session_duration_minutes * 60
        
        elapsed = time.time() - self.start_time
        remaining = (self.session_duration_minutes * 60) - elapsed
        return max(0, int(remaining))
    
    def add_time_bonus(self, seconds: int):
        """Add bonus time to the session (from challenge rewards)."""
        if self.start_time is not None:
            # Effectively subtract from elapsed time by moving start_time forward
            self.start_time += seconds
        # Also could extend session duration
        # self.session_duration_minutes += seconds // 60
    
    def subtract_time(self, seconds: int):
        """Remove time from the session (penalty)."""
        if self.start_time is not None:
            # Move start_time back to reduce remaining time
            self.start_time -= seconds
    
    def add_password(self, code: str, domain_id: Optional[str], reduction: float, 
                     one_time: bool = True, hint: str = "") -> bool:
        """Add a new password to the system."""
        code = code.upper().strip()
        if code in self.passwords:
            return False
        self.passwords[code] = Password(code, domain_id, reduction, one_time, False, hint)
        return True
    
    def remove_password(self, code: str) -> bool:
        """Remove a password from the system."""
        code = code.upper().strip()
        if code in self.passwords:
            del self.passwords[code]
            return True
        return False
    
    def try_password(self, code: str) -> dict:
        """Attempt to use a password to reduce compromise."""
        code = code.upper().strip()
        
        if code not in self.passwords:
            return {
                "success": False,
                "message": "ACCESS DENIED - Invalid security code",
                "reduction": 0,
                "affected_domains": []
            }
        
        password = self.passwords[code]
        
        if password.used and password.one_time:
            return {
                "success": False, 
                "message": "ACCESS DENIED - Security code already utilized",
                "reduction": 0,
                "affected_domains": []
            }
        
        # Apply the reduction
        affected = []
        if password.domain_id:
            if password.domain_id in self.domains:
                domain = self.domains[password.domain_id]
                old_percent = domain.compromise_percent
                domain.compromise_percent = max(0, domain.compromise_percent - password.reduction_percent)
                affected.append({
                    "id": domain.id,
                    "name": domain.name,
                    "old_percent": old_percent,
                    "new_percent": domain.compromise_percent
                })
        else:
            for domain in self.domains.values():
                old_percent = domain.compromise_percent
                domain.compromise_percent = max(0, domain.compromise_percent - password.reduction_percent)
                affected.append({
                    "id": domain.id,
                    "name": domain.name,
                    "old_percent": old_percent,
                    "new_percent": domain.compromise_percent
                })
        
        password.used = True
        self._update_global_threat()
        
        return {
            "success": True,
            "message": f"COUNTERMEASURE DEPLOYED - {password.reduction_percent}% reduction applied",
            "reduction": password.reduction_percent,
            "affected_domains": affected
        }
    
    def set_domain_compromise(self, domain_id: str, percent: float) -> bool:
        """Directly set a domain's compromise percentage."""
        if domain_id in self.domains:
            self.domains[domain_id].compromise_percent = max(0, min(100, percent))
            # If set to 0 and locked, mark as secured
            if percent <= 0 and self.domains[domain_id].is_locked:
                self.domains[domain_id].is_secured = True
            self._update_global_threat()
            return True
        return False
    
    def adjust_domain(self, domain_id: str, adjustment: float, lock: bool = False) -> dict:
        """
        Adjust a domain's compromise by a percentage amount.
        Negative = reduce compromise, Positive = increase compromise
        """
        if domain_id not in self.domains:
            return {"success": False, "message": "Domain not found"}
        
        domain = self.domains[domain_id]
        old_percent = domain.compromise_percent
        domain.compromise_percent = max(0, min(100, domain.compromise_percent + adjustment))
        
        if lock:
            domain.is_locked = True
            if domain.compromise_percent <= 0:
                domain.is_secured = True
        
        self._update_global_threat()
        
        return {
            "success": True,
            "domain_id": domain_id,
            "old_percent": old_percent,
            "new_percent": domain.compromise_percent,
            "is_locked": domain.is_locked,
            "is_secured": domain.is_secured
        }
    
    def adjust_all_domains(self, adjustment: float) -> dict:
        """Adjust all domains by a percentage amount."""
        results = []
        for domain_id in self.domains:
            result = self.adjust_domain(domain_id, adjustment, lock=False)
            if result["success"]:
                results.append(result)
        
        self._update_global_threat()
        return {"success": True, "adjusted": results}
    
    def lock_domain(self, domain_id: str, lock: bool = True) -> bool:
        """Lock or unlock a domain."""
        if domain_id in self.domains:
            domain = self.domains[domain_id]
            domain.is_locked = lock
            if not lock:
                domain.is_secured = False  # Unlocking removes secured status
            return True
        return False
    
    def secure_domain(self, domain_id: str) -> bool:
        """Fully secure a domain (0% and locked)."""
        if domain_id in self.domains:
            domain = self.domains[domain_id]
            domain.compromise_percent = 0.0
            domain.is_locked = True
            domain.is_secured = True
            self._update_global_threat()
            return True
        return False
    
    def _update_global_threat(self):
        """Recalculate global threat level."""
        if not self.domains:
            self.global_threat_level = 0
            return
        total = sum(d.compromise_percent for d in self.domains.values())
        self.global_threat_level = total / len(self.domains)
    
    def get_state(self) -> dict:
        """Get the full game state as a dictionary."""
        self._update_global_threat()
        
        # Calculate timing
        eta_seconds = self._calculate_eta_seconds()
        time_remaining = self._calculate_time_remaining()
        
        if self.start_time:
            self.elapsed_seconds = int(time.time() - self.start_time)
        
        return {
            "domains": {
                id: {
                    "id": d.id,
                    "name": d.name,
                    "icon": d.icon,
                    "description": d.description,
                    "compromise_percent": round(d.compromise_percent, 1),
                    "status": self._get_domain_status(d),
                    "is_active": d.is_active,
                    "is_locked": d.is_locked,
                    "is_secured": d.is_secured
                }
                for id, d in self.domains.items()
            },
            "global_threat_level": round(self.global_threat_level, 1),
            "game_active": self.game_active,
            "session_duration_minutes": self.session_duration_minutes,
            "elapsed_seconds": self.elapsed_seconds,
            "time_remaining_seconds": time_remaining,
            "eta_collapse_seconds": eta_seconds,
        }
    
    def _get_domain_status(self, domain: Domain) -> str:
        """Determine domain status based on compromise level."""
        if domain.is_secured:
            return "SECURED"
        if domain.is_locked:
            return "LOCKED"
        if domain.compromise_percent >= 100:
            return "COMPROMISED"
        elif domain.compromise_percent >= 75:
            return "CRITICAL"
        elif domain.compromise_percent >= 50:
            return "ATTACKING"
        elif domain.compromise_percent >= 25:
            return "BREACHING"
        else:
            return "SCANNING"
    
    async def start_attack_simulation(self):
        """Start the automatic attack progression."""
        self.game_active = True
        self.start_time = time.time()
        self._attack_task = asyncio.create_task(self._attack_loop())
    
    async def stop_attack_simulation(self):
        """Stop the automatic attack progression."""
        self.game_active = False
        if self._attack_task:
            self._attack_task.cancel()
            try:
                await self._attack_task
            except asyncio.CancelledError:
                pass
    
    async def _attack_loop(self):
        """Main attack progression loop."""
        while self.game_active:
            base_increment = self._calculate_attack_increment()
            
            # Count unlocked sectors for potential difficulty compensation
            unlocked_count = sum(1 for d in self.domains.values() if not d.is_locked and d.is_active)
            locked_count = len(self.domains) - unlocked_count
            
            # Optional: increase attack speed on remaining sectors if some are locked
            compensation_multiplier = 1.0
            if locked_count > 0 and unlocked_count > 0:
                # Mild compensation - attack spreads to remaining sectors
                compensation_multiplier = 1.0 + (locked_count * 0.05)  # 5% faster per locked sector
            
            for domain in self.domains.values():
                # Skip locked or secured sectors
                if domain.is_locked or domain.is_secured:
                    continue
                    
                if domain.is_active and domain.compromise_percent < 100:
                    # Apply increment with domain-specific speed variation
                    variation = random.uniform(0.7, 1.3)
                    increment = base_increment * domain.attack_speed * variation * compensation_multiplier
                    domain.compromise_percent = min(100, domain.compromise_percent + increment)
            
            self._update_global_threat()
            
            # Check for total collapse
            if self.global_threat_level >= 100:
                # All systems compromised - game over
                pass
            
            # Notify callbacks
            for callback in self.on_update_callbacks:
                try:
                    await callback(self.get_state())
                except Exception:
                    pass
            
            await asyncio.sleep(2)  # Update every 2 seconds
    
    def reset(self):
        """Reset the game to initial state."""
        self.domains = self._init_domains()
        self.global_threat_level = 0.0
        self.start_time = None
        self.elapsed_seconds = 0
        self.game_active = False
        # Reset password usage
        for pw in self.passwords.values():
            pw.used = False
        # Reset all domain locks
        for domain in self.domains.values():
            domain.is_locked = False
            domain.is_secured = False


# Global game state instance
game_state = GameState()
