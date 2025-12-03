"""
Mission system for A.R.D.N. escape room.
Handles puzzle/task completion and sector adjustments.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional
from enum import Enum
import time

class MissionStatus(Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"

class AdjustmentType(Enum):
    SINGLE_SECTOR = "single"      # Affects one specific sector
    ALL_SECTORS = "all"           # Affects all sectors equally
    MULTIPLE_SECTORS = "multiple" # Affects specific list of sectors

@dataclass
class Mission:
    """Represents a puzzle/task in the escape room."""
    id: str
    name: str
    description: str
    
    # What sectors this mission affects
    adjustment_type: AdjustmentType = AdjustmentType.SINGLE_SECTOR
    target_sector: Optional[str] = None  # For SINGLE_SECTOR
    target_sectors: List[str] = field(default_factory=list)  # For MULTIPLE_SECTORS
    
    # Rewards and penalties
    success_reduction: float = 20.0  # % to reduce on success
    failure_penalty: float = 10.0    # % to add on failure
    
    # Options
    lock_on_complete: bool = False   # Lock sector(s) when completed?
    max_attempts: int = 0            # 0 = unlimited
    current_attempts: int = 0
    
    # State
    status: MissionStatus = MissionStatus.PENDING
    completed_at: Optional[float] = None
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "adjustment_type": self.adjustment_type.value,
            "target_sector": self.target_sector,
            "target_sectors": self.target_sectors,
            "success_reduction": self.success_reduction,
            "failure_penalty": self.failure_penalty,
            "lock_on_complete": self.lock_on_complete,
            "max_attempts": self.max_attempts,
            "current_attempts": self.current_attempts,
            "status": self.status.value,
            "completed_at": self.completed_at
        }


@dataclass
class EventLog:
    """Log entry for game events."""
    timestamp: float
    event_type: str  # mission_complete, mission_failed, sector_adjust, penalty, etc.
    details: dict
    
    def to_dict(self) -> dict:
        return {
            "timestamp": self.timestamp,
            "event_type": self.event_type,
            "details": self.details,
            "time_str": time.strftime("%H:%M:%S", time.localtime(self.timestamp))
        }


class MissionManager:
    """Manages all missions and event logging."""
    
    def __init__(self):
        self.missions: Dict[str, Mission] = {}
        self.event_log: List[EventLog] = []
        self._init_default_missions()
    
    def _init_default_missions(self):
        """Create some default missions for testing."""
        default_missions = [
            Mission(
                id="firewall_breach",
                name="Firewall Breach Protocol",
                description="Decrypt the firewall access codes",
                adjustment_type=AdjustmentType.SINGLE_SECTOR,
                target_sector="financial",
                success_reduction=25.0,
                failure_penalty=10.0,
                lock_on_complete=False
            ),
            Mission(
                id="power_grid_stabilize",
                name="Power Grid Stabilization",
                description="Restore power grid frequency balance",
                adjustment_type=AdjustmentType.SINGLE_SECTOR,
                target_sector="power",
                success_reduction=30.0,
                failure_penalty=15.0,
                lock_on_complete=True
            ),
            Mission(
                id="satellite_uplink",
                name="Satellite Uplink Recovery",
                description="Re-establish satellite communication",
                adjustment_type=AdjustmentType.SINGLE_SECTOR,
                target_sector="satellite",
                success_reduction=25.0,
                failure_penalty=10.0
            ),
            Mission(
                id="network_isolation",
                name="Network Isolation Protocol",
                description="Isolate infected network segments",
                adjustment_type=AdjustmentType.MULTIPLE_SECTORS,
                target_sectors=["telecom", "media"],
                success_reduction=20.0,
                failure_penalty=10.0
            ),
            Mission(
                id="master_override",
                name="Master System Override",
                description="Activate global defense protocol",
                adjustment_type=AdjustmentType.ALL_SECTORS,
                success_reduction=15.0,
                failure_penalty=5.0,
                max_attempts=1  # Only one try!
            ),
            Mission(
                id="nuclear_failsafe",
                name="Nuclear Failsafe Activation",
                description="Engage nuclear plant safety protocols",
                adjustment_type=AdjustmentType.SINGLE_SECTOR,
                target_sector="nuclear",
                success_reduction=50.0,
                failure_penalty=25.0,
                lock_on_complete=True,
                max_attempts=2
            ),
            Mission(
                id="emergency_broadcast",
                name="Emergency Broadcast System",
                description="Restore emergency communication channels",
                adjustment_type=AdjustmentType.MULTIPLE_SECTORS,
                target_sectors=["emergency", "government"],
                success_reduction=20.0,
                failure_penalty=10.0
            ),
            Mission(
                id="water_purification",
                name="Water System Purification",
                description="Clear malware from water treatment systems",
                adjustment_type=AdjustmentType.SINGLE_SECTOR,
                target_sector="water",
                success_reduction=30.0,
                failure_penalty=15.0,
                lock_on_complete=True
            ),
            Mission(
                id="healthcare_lockdown",
                name="Healthcare Network Lockdown",
                description="Secure hospital network infrastructure",
                adjustment_type=AdjustmentType.SINGLE_SECTOR,
                target_sector="healthcare",
                success_reduction=25.0,
                failure_penalty=10.0
            ),
            Mission(
                id="supply_chain_restore",
                name="Supply Chain Restoration",
                description="Restore logistics tracking systems",
                adjustment_type=AdjustmentType.SINGLE_SECTOR,
                target_sector="supply",
                success_reduction=20.0,
                failure_penalty=10.0
            ),
            Mission(
                id="transport_control",
                name="Transport Control Recovery",
                description="Regain control of traffic management systems",
                adjustment_type=AdjustmentType.SINGLE_SECTOR,
                target_sector="transport",
                success_reduction=25.0,
                failure_penalty=10.0
            ),
            Mission(
                id="global_defense",
                name="Global Defense Initiative",
                description="Coordinate worldwide cyber defense",
                adjustment_type=AdjustmentType.ALL_SECTORS,
                success_reduction=10.0,
                failure_penalty=5.0
            ),
        ]
        
        for mission in default_missions:
            self.missions[mission.id] = mission
    
    def add_mission(self, mission: Mission) -> bool:
        """Add a new mission."""
        if mission.id in self.missions:
            return False
        self.missions[mission.id] = mission
        return True
    
    def remove_mission(self, mission_id: str) -> bool:
        """Remove a mission."""
        if mission_id in self.missions:
            del self.missions[mission_id]
            return True
        return False
    
    def get_mission(self, mission_id: str) -> Optional[Mission]:
        """Get a mission by ID."""
        return self.missions.get(mission_id)
    
    def reset_mission(self, mission_id: str) -> bool:
        """Reset a mission to pending state."""
        mission = self.missions.get(mission_id)
        if mission:
            mission.status = MissionStatus.PENDING
            mission.current_attempts = 0
            mission.completed_at = None
            return True
        return False
    
    def reset_all_missions(self):
        """Reset all missions to pending state."""
        for mission in self.missions.values():
            mission.status = MissionStatus.PENDING
            mission.current_attempts = 0
            mission.completed_at = None
        self.event_log.clear()
    
    def log_event(self, event_type: str, details: dict):
        """Log a game event."""
        event = EventLog(
            timestamp=time.time(),
            event_type=event_type,
            details=details
        )
        self.event_log.append(event)
        # Keep only last 100 events
        if len(self.event_log) > 100:
            self.event_log = self.event_log[-100:]
    
    def get_all_missions(self) -> List[dict]:
        """Get all missions as dicts."""
        return [m.to_dict() for m in self.missions.values()]
    
    def get_event_log(self, limit: int = 50) -> List[dict]:
        """Get recent events."""
        return [e.to_dict() for e in self.event_log[-limit:]]


# Global mission manager instance
mission_manager = MissionManager()


