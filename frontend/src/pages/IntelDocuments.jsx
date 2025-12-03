/**
 * Intel Documents - Shareable/Printable documents with hidden password clues
 * Each document contains a hidden password for players to discover
 */

import { useState } from 'react'
import './IntelDocuments.css'

// Document data with hidden clues
const DOCUMENTS = [
  {
    id: 'firewall-logs',
    title: 'FIREWALL SECURITY LOGS',
    classification: 'RESTRICTED',
    sector: 'Financial Systems',
    icon: '🔥',
    hint: 'Look at the blocked connection IDs',
    password: 'FIREWALL_ALPHA',
    content: `
╔══════════════════════════════════════════════════════════════════════════════╗
║  NEXUS FINANCIAL CORP - INTRUSION DETECTION SYSTEM                          ║
║  Log Export: 2024-12-03 03:47:22 UTC                                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

FIREWALL STATUS: COMPROMISED - UNKNOWN ENTITY DETECTED
Last Known Good State: 2024-12-02 18:00:00 UTC

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONNECTION ATTEMPTS - LAST 24 HOURS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TIMESTAMP            SOURCE IP        DEST PORT   STATUS    BLOCK ID
─────────────────────────────────────────────────────────────────────────────
2024-12-03 03:45:01  192.168.1.47     443         BLOCKED   F-8847
2024-12-03 03:44:58  10.0.0.255       22          BLOCKED   I-2901
2024-12-03 03:44:55  172.16.0.1       80          ALLOWED   --
2024-12-03 03:44:52  192.168.1.100    3389        BLOCKED   R-5523
2024-12-03 03:44:49  ???.???.???.???  ????        OVERRIDE  E-0000
2024-12-03 03:44:47  10.0.0.12        443         ALLOWED   --
2024-12-03 03:44:44  192.168.1.89     22          BLOCKED   W-1147
2024-12-03 03:44:41  172.16.0.55      8080        BLOCKED   A-3392
2024-12-03 03:44:38  10.0.0.201       443         ALLOWED   --
2024-12-03 03:44:35  192.168.1.33     445         BLOCKED   L-9981
2024-12-03 03:44:32  ???.???.???.???  ????        OVERRIDE  L-0000
2024-12-03 03:44:29  172.16.0.77      22          BLOCKED   _-7764
2024-12-03 03:44:26  10.0.0.88        80          ALLOWED   --
2024-12-03 03:44:23  192.168.1.200    3306        BLOCKED   A-2287
2024-12-03 03:44:20  172.16.0.99      443         ALLOWED   --
2024-12-03 03:44:17  10.0.0.45        22          BLOCKED   L-5541
2024-12-03 03:44:14  192.168.1.67     8443        BLOCKED   P-3309
2024-12-03 03:44:11  ???.???.???.???  ????        OVERRIDE  H-0000
2024-12-03 03:44:08  172.16.0.22      80          ALLOWED   --
2024-12-03 03:44:05  10.0.0.111       445         BLOCKED   A-6628

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANOMALY DETECTED: Override events originating from unknown source
RECOMMENDATION: Check blocked connection IDs for pattern analysis
Emergency reset code may be embedded in BLOCK ID sequence: F-I-R-E-W-A-L-L-_-A-L-P-H-A
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[END OF LOG EXPORT]
    `
  },
  {
    id: 'power-manifest',
    title: 'POWER GRID CONTROL MANIFEST',
    classification: 'TOP SECRET',
    sector: 'Power Grid',
    icon: '⚡',
    hint: 'The access code is in the substation naming pattern',
    password: 'GRID_SECURE_7',
    content: `
╔══════════════════════════════════════════════════════════════════════════════╗
║  NATIONAL POWER AUTHORITY - GRID MANAGEMENT SYSTEM                          ║
║  Emergency Substation Status Report                                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

ALERT: UNAUTHORIZED ACCESS DETECTED IN GRID CONTROL SYSTEMS
SCADA Network Status: PARTIALLY COMPROMISED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUBSTATION STATUS REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STATION ID          LOCATION              LOAD (MW)   STATUS      THREAT
─────────────────────────────────────────────────────────────────────────────
SUB-GRID-001        North District        847.3       ONLINE      LOW
SUB-RAIN-002        Industrial Zone       1203.8      ONLINE      MEDIUM
SUB-IDLE-003        Commercial Center     556.2       DEGRADED    HIGH
SUB-DESK-004        Residential East      423.1       ONLINE      LOW
SUB-SECT-005        Port Authority        892.7       COMPROMISED CRITICAL
SUB-UNDO-006        Hospital Complex      334.5       PROTECTED   LOW
SUB-ROSE-007        Government Plaza      789.0       DEGRADED    HIGH
SUB-ECHO-008        University Campus     445.2       ONLINE      MEDIUM

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EMERGENCY OVERRIDE INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To initiate emergency grid isolation:
1. Access main control terminal
2. Enter access code (derived from substation naming convention)
3. Confirm isolation sequence

NOTE: Station naming follows pattern: SUB-[WORD]-[NUMBER]
      Access code format: [WORD]_SECURE_[NUMBER]
      Use station with CRITICAL threat level as key

CAUTION: First 4 letters of station name + "_SECURE_" + station number
Example: If SUB-TEST-009 was critical, code would be: TEST_SECURE_9

Current critical station: SUB-GRID-005 sector mislabeled - actual: SUB-SECT-005
                         Cross-reference: Grid control uses GRID designation

[ACCESS CODE FOR CURRENT EMERGENCY: G-R-I-D-_-S-E-C-U-R-E-_-7]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[DOCUMENT CLASSIFICATION: TOP SECRET - INFRASTRUCTURE CRITICAL]
    `
  },
  {
    id: 'medical-protocol',
    title: 'EMERGENCY MEDICAL PROTOCOL',
    classification: 'CONFIDENTIAL',
    sector: 'Healthcare',
    icon: '🏥',
    hint: 'Read the first letter of each protocol step',
    password: 'MEDIC_OVERRIDE',
    content: `
╔══════════════════════════════════════════════════════════════════════════════╗
║  METROPOLITAN HOSPITAL NETWORK - EMERGENCY PROCEDURES                        ║
║  System Lockdown Protocol Documentation                                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

ALERT: LIFE SUPPORT SYSTEMS UNDER EXTERNAL CONTROL
Patient Safety Status: AT RISK

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EMERGENCY SYSTEM RECOVERY PROTOCOL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

In case of cyber attack on hospital systems, follow these steps IN ORDER:

STEP 01: Monitor all patient vital signs manually
STEP 02: Engage backup power systems immediately  
STEP 03: Disconnect compromised terminals from network
STEP 04: Isolate pharmacy dispensing systems
STEP 05: Contact IT security team via radio (Channel 7)

STEP 06: Open emergency supply cabinets (Code: 4477)
STEP 07: Verify all ventilator settings manually
STEP 08: Ensure patient records are accessible offline
STEP 09: Review medication schedules with nursing staff
STEP 10: Request additional security personnel
STEP 11: Initiate visitor lockdown procedures
STEP 12: Document all system anomalies observed
STEP 13: Establish command center in Admin Wing

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM OVERRIDE ACCESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To restore system control, the override code is encoded in this document.

HINT: First letters of each STEP instruction spell the access code
      Format: [WORD]_[WORD] (underscore between words)
      Steps 1-5 = First word, Steps 6-13 = Second word

Medical staff: The protocol steps are designed as a mnemonic device.
              Read the FIRST LETTER of each step's first word.

[OVERRIDE CODE: M-E-D-I-C-_-O-V-E-R-R-I-D-E]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[FOR AUTHORIZED MEDICAL PERSONNEL ONLY]
    `
  },
  {
    id: 'satellite-telemetry',
    title: 'SATELLITE TELEMETRY DATA',
    classification: 'TOP SECRET',
    sector: 'Satellite/Space',
    icon: '🛰️',
    hint: 'The satellite names form the command sequence',
    password: 'ORBITAL_DECAY',
    content: `
╔══════════════════════════════════════════════════════════════════════════════╗
║  SPACE COMMAND - SATELLITE NETWORK OPERATIONS                                ║
║  Emergency Telemetry Downlink                                                ║
╚══════════════════════════════════════════════════════════════════════════════╝

WARNING: SATELLITE CONTROL SYSTEMS COMPROMISED
GPS Accuracy: DEGRADED | Communication Uplink: UNSTABLE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACTIVE SATELLITE STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SATELLITE        ORBIT (km)   FUNCTION           STATUS      CONTROL
─────────────────────────────────────────────────────────────────────────────
OSCAR-7          35,786       Communications     NOMINAL     LOCKED
ROMEO-12         20,200       GPS Navigation     DEGRADED    COMPROMISED
BRAVO-3          408          ISS Support        NOMINAL     SECURED
INDIA-9          35,786       Weather            OFFLINE     LOST
TANGO-15         550          Reconnaissance     NOMINAL     SECURED
ALPHA-22         20,200       GPS Navigation     DEGRADED    COMPROMISED
LIMA-8           35,786       Communications     NOMINAL     LOCKED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMMAND SEQUENCE RECOVERY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Emergency command codes are derived from satellite designations.
Current threat requires immediate orbital correction sequence.

COMPROMISED SATELLITES (in order of priority):
1. OSCAR-7     [O]
2. ROMEO-12    [R]  
3. BRAVO-3     [B]
4. INDIA-9     [I]
5. TANGO-15    [T]
6. ALPHA-22    [A]
7. LIMA-8      [L]

Underscore separator: _

CRITICAL SATELLITES (by threat level):
1. DELTA-1     [D]
2. ECHO-5      [E]
3. CHARLIE-4   [C]
4. ALPHA-2     [A]
5. YANKEE-6    [Y]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMMAND SEQUENCE CONSTRUCTION:
First letters of satellites spell the command
Format: [FIRST_GROUP]_[SECOND_GROUP]

[EMERGENCY COMMAND: O-R-B-I-T-A-L-_-D-E-C-A-Y]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SPACE COMMAND EYES ONLY]
    `
  },
  {
    id: 'system-recovery',
    title: 'GLOBAL SYSTEM RECOVERY MANUAL',
    classification: 'ULTRA SECRET',
    sector: 'All Systems',
    icon: '🌐',
    hint: 'Error codes contain the master reset sequence',
    password: 'GLOBAL_RESET',
    content: `
╔══════════════════════════════════════════════════════════════════════════════╗
║  CRITICAL INFRASTRUCTURE PROTECTION AGENCY                                   ║
║  Master System Recovery Documentation                                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

EMERGENCY CLASSIFICATION: OMEGA LEVEL EVENT
All Critical Infrastructure: UNDER ATTACK

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM-WIDE ERROR LOG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ERROR CODE      SYSTEM              DESCRIPTION
─────────────────────────────────────────────────────────────────────────────
ERR-G-0047      Financial           Unauthorized transaction detected
ERR-L-0891      Power Grid          Load balancing failure
ERR-O-2234      Telecommunications  Backbone routing compromised
ERR-B-5567      Healthcare          Patient data encryption failed
ERR-A-8901      Transportation      Traffic control override
ERR-L-3345      Water Systems       Pump station communication lost
ERR-_-0000      [SEPARATOR]         System delimiter
ERR-R-7782      Emergency           Dispatch routing corrupted
ERR-E-4456      Satellite           Orbital correction rejected
ERR-S-9012      Supply Chain        Logistics tracking offline
ERR-E-1123      Nuclear             Cooling system anomaly
ERR-T-6678      Government          Secure channel breach

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MASTER RESET PROTOCOL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The master reset code affects ALL connected infrastructure simultaneously.
Use only as last resort - will reduce threat levels across all sectors.

CODE DERIVATION:
The reset sequence is embedded in the ERROR CODE column.
Read the LETTER portion of each error code in sequence.

Error codes follow format: ERR-[LETTER]-[NUMBER]
Extract letters: G-L-O-B-A-L-_-R-E-S-E-T

WARNING: This code has limited effectiveness (10% reduction per sector)
         Use sector-specific codes for greater impact

[MASTER RESET CODE: G-L-O-B-A-L-_-R-E-S-E-T]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[AUTHORIZED PERSONNEL ONLY - OMEGA CLEARANCE REQUIRED]
    `
  },
  {
    id: 'backdoor-memo',
    title: 'CLASSIFIED DEVELOPER MEMO',
    classification: 'INTERNAL ONLY',
    sector: 'All Systems',
    icon: '🚪',
    hint: 'Hidden message in the memo - read carefully',
    password: 'BACKDOOR_EXIT',
    content: `
╔══════════════════════════════════════════════════════════════════════════════╗
║  INTERNAL MEMORANDUM - DEVELOPMENT TEAM ONLY                                 ║
║  RE: Emergency System Access                                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

FROM: Dr. Sarah Chen, Lead Systems Architect
TO: Core Development Team
DATE: 2024-11-15
SUBJECT: Emergency Access Protocol (CONFIDENTIAL)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Team,

Before we deploy the new security framework, I need to address something 
important. As you know, we've been hardening our systems against external
threats, but we must maintain emergency access capabilities.

|B|ased on our recent security audit, I'm implementing a special protocol.
|A|ll team members should memorize this information and destroy this memo.
|C|ritical systems require a failsafe that bypasses normal authentication.
|K|eep this information strictly confidential - do not share externally.
|D|evelopment environments will have this enabled by default.
|O|nly use this in genuine emergencies when normal access is impossible.
|O|ur reputation depends on keeping this secure.
|R|emember: this code can be used MULTIPLE TIMES unlike other codes.

|_|----------------------------------------------------------------------|

|E|mergency situations may arise where quick access saves lives.
|X|tremely important: do not document this anywhere else.
|I|f compromised, notify security immediately for rotation.
|T|his protocol expires when we deploy the new auth system.

The failsafe code is embedded in this memo using a simple method.
Look at the FIRST CHARACTER of paragraphs starting with "|".

Stay vigilant,
Dr. Chen

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[NOTE: This code is REUSABLE - can be entered multiple times]
[EMBEDDED CODE: B-A-C-K-D-O-O-R-_-E-X-I-T]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[DESTROY AFTER READING]
    `
  },
  {
    id: 'nuclear-procedures',
    title: 'NUCLEAR FACILITY PROCEDURES',
    classification: 'TOP SECRET - SCI',
    sector: 'Nuclear',
    icon: '☢️',
    hint: 'Safety override spelled out in warning sequence',
    password: 'NUCLEAR_FAILSAFE',
    content: `
╔══════════════════════════════════════════════════════════════════════════════╗
║  NUCLEAR REGULATORY COMMISSION - EMERGENCY PROTOCOLS                         ║
║  Reactor Safety Override Documentation                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

⚠️  CRITICAL ALERT: REACTOR CONTROL SYSTEMS COMPROMISED  ⚠️
COOLING STATUS: AUTOMATED CONTROL LOST
MANUAL INTERVENTION: REQUIRED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REACTOR STATUS DISPLAY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REACTOR   TEMP (°C)   PRESSURE    COOLANT    STATUS
─────────────────────────────────────────────────────────────────────────────
UNIT-1    287.4       155 bar     FLOWING    ⚠️ ELEVATED
UNIT-2    301.2       162 bar     REDUCED    🔴 CRITICAL
UNIT-3    245.8       148 bar     FLOWING    ✅ NORMAL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EMERGENCY SHUTDOWN SEQUENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MANDATORY SAFETY WARNINGS - READ ALOUD BEFORE PROCEEDING:

"NEUTRON flux levels must be monitored continuously"
"URANIUM fuel rods require careful handling"
"COOLANT systems are life-critical"
"LETHAL radiation exposure possible without proper protocol"
"EMERGENCY teams must be on standby"
"ALL personnel must evacuate except control room staff"
"RADIATION badges must be worn at all times"

[SEPARATOR: _]

"FAST shutdown may cause thermal stress"
"ALWAYS verify control rod positions"
"IMMEDIATELY report any anomalies"
"LICENSED operators only beyond this point"
"SECONDARY cooling must be verified"
"ACTIVATED protocols cannot be reversed easily"
"FUEL integrity is paramount"
"ENSURE backup power is available"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FAILSAFE CODE DERIVATION:
First word of each safety warning spells the emergency shutdown code
Format: [WORD1]_[WORD2] (7 letters, underscore, 8 letters)

[EMERGENCY SHUTDOWN: N-U-C-L-E-A-R-_-F-A-I-L-S-A-F-E]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[NRC CLASSIFIED - REACTOR OPERATORS ONLY]
    `
  },
  {
    id: 'water-treatment',
    title: 'WATER TREATMENT FACILITY REPORT',
    classification: 'RESTRICTED',
    sector: 'Water Systems',
    icon: '💧',
    hint: 'Chemical compound codes spell the override',
    password: 'WATER_PURGE',
    content: `
╔══════════════════════════════════════════════════════════════════════════════╗
║  MUNICIPAL WATER AUTHORITY - TREATMENT FACILITY STATUS                       ║
║  Emergency Chemical Management Report                                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

⚠️  ALERT: DOSING SYSTEMS UNDER EXTERNAL CONTROL  ⚠️
PUBLIC HEALTH RISK: ELEVATED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHEMICAL INVENTORY STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMPOUND CODE    CHEMICAL              LEVEL     DOSING STATUS
─────────────────────────────────────────────────────────────────────────────
CHEM-W-001      Chlorine              87%       MANUAL REQUIRED
CHEM-A-002      Aluminum Sulfate      92%       AUTOMATED
CHEM-T-003      Sodium Hydroxide      45%       ⚠️ LOW
CHEM-E-004      Fluoride Compound     78%       AUTOMATED
CHEM-R-005      Potassium Permanganate 63%      MANUAL REQUIRED

[COMPOUND SEPARATOR: _]

CHEM-P-006      Phosphoric Acid       81%       AUTOMATED
CHEM-U-007      Carbon (Activated)    55%       MANUAL REQUIRED
CHEM-R-008      Chloramine            70%       ⚠️ MONITOR
CHEM-G-009      Lime (Calcium Oxide)  88%       AUTOMATED
CHEM-E-010      Ozone Generator       ACTIVE    AUTOMATED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EMERGENCY PURGE PROTOCOL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To initiate emergency system purge:
1. Access main chemical control panel
2. Enter override code derived from compound identifiers
3. Confirm purge sequence

CODE DERIVATION METHOD:
Extract LETTER portion from COMPOUND CODE column
Codes follow format: CHEM-[LETTER]-[NUMBER]

Sequence: W-A-T-E-R-_-P-U-R-G-E

[EMERGENCY PURGE CODE: W-A-T-E-R-_-P-U-R-G-E]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[WATER AUTHORITY - CERTIFIED OPERATORS ONLY]
    `
  },
  {
    id: 'telecom-network',
    title: 'TELECOMMUNICATIONS NETWORK DIAGRAM',
    classification: 'CONFIDENTIAL',
    sector: 'Telecommunications',
    icon: '📡',
    hint: 'Network node names contain the isolation code',
    password: 'COMM_BLACKOUT',
    content: `
╔══════════════════════════════════════════════════════════════════════════════╗
║  NATIONAL TELECOMMUNICATIONS AUTHORITY - NETWORK OPERATIONS                  ║
║  Emergency Network Isolation Protocol                                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

🔴 CRITICAL: BACKBONE NETWORK COMPROMISED 🔴
INTERNET CONNECTIVITY: UNSTABLE | CELL SERVICE: DEGRADED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NETWORK TOPOLOGY - PRIMARY NODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                    [CORE-NODE-1]
                         |
        +----------------+----------------+
        |                |                |
   [NODE-C-01]      [NODE-O-02]      [NODE-M-03]
        |                |                |
   [NODE-M-04]           |           [NODE-_-05]
        |                |                |
        +-------[NODE-B-06]-------+       |
                     |                    |
              [NODE-L-07]          [NODE-A-08]
                     |                    |
              [NODE-C-09]          [NODE-K-10]
                     |                    |
              [NODE-O-11]          [NODE-U-12]
                     |                    |
              +------+------+             |
              |             |             |
         [NODE-T-13]  [EDGE-SERVERS]      |
                                          |
                                   [BACKUP-SYS]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NETWORK ISOLATION SEQUENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Priority isolation sequence (follow node letter codes):

NODE-C-01 → NODE-O-02 → NODE-M-03 → NODE-M-04 → [SEPARATOR]
NODE-B-06 → NODE-L-07 → NODE-A-08 → NODE-C-09 → NODE-K-10 →
NODE-O-11 → NODE-U-12 → NODE-T-13

Extract letters from node IDs: C-O-M-M-_-B-L-A-C-K-O-U-T

To initiate network blackout:
1. Access network operations center
2. Enter isolation code derived from node sequence
3. Confirm blackout (will isolate all external traffic)

[NETWORK ISOLATION CODE: C-O-M-M-_-B-L-A-C-K-O-U-T]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[NTA CLASSIFIED - NETWORK ENGINEERS ONLY]
    `
  },
  {
    id: 'emergency-dispatch',
    title: 'EMERGENCY SERVICES DISPATCH LOG',
    classification: 'RESTRICTED',
    sector: 'Emergency Services',
    icon: '🚨',
    hint: 'Call sign initials spell the backup code',
    password: 'EVAC_PROTOCOL',
    content: `
╔══════════════════════════════════════════════════════════════════════════════╗
║  EMERGENCY SERVICES COORDINATION CENTER                                      ║
║  Dispatch System Recovery Documentation                                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

🚨 ALERT: 911 DISPATCH SYSTEM COMPROMISED 🚨
CALL ROUTING: MANUAL MODE | RESPONSE TIMES: ELEVATED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACTIVE UNIT STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UNIT CALL SIGN        TYPE              STATUS       LOCATION
─────────────────────────────────────────────────────────────────────────────
ECHO-7               Fire Engine        EN ROUTE     District 4
VICTOR-12            Ambulance          AVAILABLE    Station 2
ALPHA-3              Police Cruiser     ON SCENE     Downtown
CHARLIE-9            Fire Truck         AVAILABLE    Station 5

[SEPARATOR UNIT]
UNDERSCORE-0         [SYSTEM]           [DELIMITER]  [N/A]

PAPA-15              Paramedic Unit     EN ROUTE     Highway 101
ROMEO-8              Police SUV         AVAILABLE    Station 1
OSCAR-22             Ambulance          ON SCENE     Hospital
TANGO-6              Fire Command       AVAILABLE    HQ
OSCAR-11             Police Motorcycle  PATROL       Sector 7
CHARLIE-4            Rescue Unit        AVAILABLE    Station 3
OSCAR-19             Ambulance          EN ROUTE     Suburb East
LIMA-2               Police Helicopter  AIRBORNE     Citywide

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DISPATCH SYSTEM RECOVERY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To restore automated dispatch:
1. Access dispatch control terminal
2. Enter backup protocol code
3. Verify all unit communications restored

CODE DERIVATION:
Unit call signs use NATO phonetic alphabet
First letter of each call sign spells the recovery code

Read unit call signs in order: E-V-A-C-_-P-R-O-T-O-C-O-L

[DISPATCH RECOVERY CODE: E-V-A-C-_-P-R-O-T-O-C-O-L]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[EMERGENCY SERVICES - AUTHORIZED DISPATCHERS ONLY]
    `
  }
]

function IntelDocuments() {
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [showAnswers, setShowAnswers] = useState(false)

  const handlePrint = () => {
    window.print()
  }

  const handlePrintSingle = (doc) => {
    setSelectedDoc(doc)
    setTimeout(() => window.print(), 100)
  }

  return (
    <div className="intel-page">
      {/* Header */}
      <header className="intel-header no-print">
        <h1>📁 INTERCEPTED INTELLIGENCE DOCUMENTS</h1>
        <p>These classified documents contain hidden security codes. Can you find them?</p>
        <div className="header-actions">
          <button onClick={handlePrint} className="print-all-btn">
            🖨️ Print All Documents
          </button>
          <button 
            onClick={() => setShowAnswers(!showAnswers)} 
            className="toggle-answers-btn"
          >
            {showAnswers ? '🔒 Hide Answers' : '🔓 Show Answers (GM Only)'}
          </button>
          <a href="/" className="back-link">← Back to Game</a>
        </div>
      </header>

      {/* GM Answer Key */}
      {showAnswers && (
        <div className="answer-key no-print">
          <h2>🔑 GM ANSWER KEY</h2>
          <div className="answers-grid">
            {DOCUMENTS.map(doc => (
              <div key={doc.id} className="answer-item">
                <strong>{doc.sector}:</strong>
                <code>{doc.password}</code>
                <span className="hint-text">({doc.hint})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Grid */}
      <div className="documents-grid">
        {DOCUMENTS.map(doc => (
          <div 
            key={doc.id} 
            className={`document-card ${selectedDoc?.id === doc.id ? 'selected' : ''}`}
          >
            <div className="doc-header">
              <span className="doc-icon">{doc.icon}</span>
              <div className="doc-meta">
                <h3>{doc.title}</h3>
                <span className={`classification ${doc.classification.toLowerCase().replace(/[^a-z]/g, '-')}`}>
                  {doc.classification}
                </span>
              </div>
            </div>
            
            <div className="doc-sector">
              <strong>Sector:</strong> {doc.sector}
            </div>
            
            <pre className="doc-content">{doc.content}</pre>
            
            <div className="doc-actions no-print">
              <button onClick={() => handlePrintSingle(doc)}>
                🖨️ Print This Document
              </button>
            </div>
            
            {showAnswers && (
              <div className="doc-answer no-print">
                <strong>Password:</strong> <code>{doc.password}</code>
                <br />
                <strong>Hint:</strong> {doc.hint}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Print Footer */}
      <footer className="intel-footer">
        <p>A.R.D.N. INTELLIGENCE INTERCEPT - CLASSIFIED</p>
      </footer>
    </div>
  )
}

export default IntelDocuments

