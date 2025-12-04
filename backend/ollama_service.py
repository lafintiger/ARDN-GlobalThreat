"""
Attack terminal service for A.R.D.N.
Uses PRE-WRITTEN SCRIPTS for attack sequences - no GPU required!
This keeps VRAM free for ComfyUI image generation and AI chat.
Each sector has unique IPs, vulnerabilities, tools, and attack progression.
"""

import asyncio
import random
import os
from typing import AsyncGenerator

# Model name kept for reference (used by chat, not attacks)
MODEL_NAME = "huihui_ai/qwen3-abliterated:8b"

# ============================================================================
# SECTOR-SPECIFIC CONFIGURATIONS
# Each sector has unique IP ranges, vulnerabilities, and appropriate tools
# ============================================================================

SECTOR_CONFIGS = {
    "financial": {
        "name": "Financial Systems",
        "ip_range": "10.10.1",  # Unique /24 for this sector
        "targets": [
            {"name": "SWIFT Payment Gateway", "ip_suffix": 10, "os": "RHEL 8", "services": ["nginx/1.22", "PostgreSQL 14.2", "REST API"]},
            {"name": "NYSE Trading Server", "ip_suffix": 20, "os": "Windows Server 2019", "services": ["IIS 10.0", "MSSQL 2019", "TradingEngine 4.2"]},
            {"name": "Federal Reserve Node", "ip_suffix": 30, "os": "AIX 7.2", "services": ["WebSphere 9.0", "DB2 11.5", "MQ Series"]},
            {"name": "Crypto Exchange", "ip_suffix": 40, "os": "Ubuntu 22.04", "services": ["Docker", "MongoDB 6.0", "Redis 7.0"]},
        ],
        "vulnerabilities": [
            {"cve": "CVE-2024-21762", "name": "FortiOS SSL VPN RCE", "tool": "fortios_exploit", "type": "rce"},
            {"cve": "CVE-2023-34362", "name": "MOVEit SQL Injection", "tool": "sqlmap", "type": "sqli"},
            {"cve": "CVE-2024-0012", "name": "PAN-OS Auth Bypass", "tool": "panos_exploit", "type": "auth_bypass"},
            {"cve": "CVE-2023-22515", "name": "Confluence RCE", "tool": "confluence_exploit", "type": "rce"},
        ],
        "creds": ["svc_swift", "trading_admin", "fedwire_ops", "crypto_root"],
        "passwords": ["Tr@d1ng$2024!", "F3dW1re#Secure", "Sw1ft_P@yment!", "Crypt0_V@ult99"],
    },
    "telecom": {
        "name": "Telecommunications",
        "ip_range": "10.20.1",
        "targets": [
            {"name": "SS7 Signaling Hub", "ip_suffix": 10, "os": "Solaris 11", "services": ["SS7 Gateway", "M3UA Stack", "SIGTRAN"]},
            {"name": "5G Core Network", "ip_suffix": 20, "os": "RHEL 8", "services": ["Open5GS", "MongoDB", "Prometheus"]},
            {"name": "BGP Backbone Router", "ip_suffix": 30, "os": "Cisco IOS-XR", "services": ["BGP", "MPLS", "SNMP"]},
            {"name": "Satellite Uplink", "ip_suffix": 40, "os": "VxWorks 7", "services": ["DVB-S2", "CCSDS", "TT&C"]},
        ],
        "vulnerabilities": [
            {"cve": "CVE-2024-20359", "name": "Cisco IOS XE WebUI RCE", "tool": "cisco_exploit", "type": "rce"},
            {"cve": "CVE-2023-20198", "name": "Cisco IOS XE Priv Esc", "tool": "cisco_ios_pe", "type": "privesc"},
            {"cve": "CVE-2024-3400", "name": "PAN-OS Command Injection", "tool": "panos_cmdinj", "type": "rce"},
            {"cve": "SS7-MAP-VULN", "name": "SS7 MAP Protocol Abuse", "tool": "ss7_attack", "type": "protocol"},
        ],
        "creds": ["noc_admin", "5g_operator", "bgp_peer", "satcom_tech"],
        "passwords": ["T3l3c0m#2024!", "5G_C0re_@dm1n", "BGP_R0ut3r!", "S@tL1nk_Upl1nk"],
    },
    "power": {
        "name": "Power Grid",
        "ip_range": "10.30.1",
        "targets": [
            {"name": "SCADA Master Controller", "ip_suffix": 10, "os": "Windows Server 2016", "services": ["Wonderware InTouch", "OPC-UA", "Modbus TCP"]},
            {"name": "Nuclear Plant DCS", "ip_suffix": 20, "os": "QNX 7.1", "services": ["Siemens PCS7", "PROFINET", "WinCC"]},
            {"name": "Smart Grid Manager", "ip_suffix": 30, "os": "RHEL 7", "services": ["OpenADR", "DNP3", "IEC 61850"]},
            {"name": "Substation RTU", "ip_suffix": 40, "os": "Embedded Linux", "services": ["SEL RTAC", "DNP3 Outstation", "IEC 104"]},
        ],
        "vulnerabilities": [
            {"cve": "CVE-2024-SCADA", "name": "Siemens SIMATIC RCE", "tool": "s7_exploit", "type": "ics"},
            {"cve": "CVE-2023-ICS001", "name": "Modbus Coil Write Abuse", "tool": "modbus_attack", "type": "ics"},
            {"cve": "CVE-2024-DNP3", "name": "DNP3 SAv5 Auth Bypass", "tool": "dnp3_exploit", "type": "ics"},
            {"cve": "CVE-2023-PCS7", "name": "PCS7 Hardcoded Creds", "tool": "pcs7_default", "type": "auth_bypass"},
        ],
        "creds": ["scada_operator", "reactor_engineer", "grid_controller", "substation_tech"],
        "passwords": ["P0w3r_Gr1d#24!", "Nucl3@r_0ps!", "Sm@rtGr1d_2024", "Subst@t10n_RTU"],
    },
    "water": {
        "name": "Water Systems",
        "ip_range": "10.40.1",
        "targets": [
            {"name": "Treatment Plant HMI", "ip_suffix": 10, "os": "Windows 10 LTSC", "services": ["Ignition SCADA", "OPC-UA", "REST API"]},
            {"name": "Distribution SCADA", "ip_suffix": 20, "os": "Windows Server 2012", "services": ["ClearSCADA", "Modbus", "BACnet"]},
            {"name": "Chemical Dosing PLC", "ip_suffix": 30, "os": "Allen-Bradley", "services": ["EtherNet/IP", "CIP", "RSLogix"]},
            {"name": "Pump Station RTU", "ip_suffix": 40, "os": "Embedded", "services": ["Modbus RTU", "DNP3", "Telemetry"]},
        ],
        "vulnerabilities": [
            {"cve": "CVE-2024-WATER", "name": "Ignition Gateway RCE", "tool": "ignition_exploit", "type": "rce"},
            {"cve": "CVE-2023-CHEM", "name": "Chemical Dosing PLC Write", "tool": "plc_inject", "type": "ics"},
            {"cve": "CVE-2024-HMI01", "name": "HMI Default Credentials", "tool": "hmi_default", "type": "auth_bypass"},
            {"cve": "CVE-2023-PUMP", "name": "Pump Controller DoS", "tool": "modbus_dos", "type": "dos"},
        ],
        "creds": ["plant_operator", "water_engineer", "chem_tech", "pump_admin"],
        "passwords": ["W@t3r_Tr3at!", "D0s1ng_Ch3m#1", "Pump$t@t10n24", "Cl3@n_W@ter!"],
    },
    "transport": {
        "name": "Transportation",
        "ip_range": "10.50.1",
        "targets": [
            {"name": "Air Traffic Control", "ip_suffix": 10, "os": "RHEL 8", "services": ["ASTERIX", "ADS-B", "SWIM"]},
            {"name": "Rail Signaling ERTMS", "ip_suffix": 20, "os": "SafeLinux", "services": ["Eurobalise", "GSM-R", "ETCS"]},
            {"name": "Traffic Management Center", "ip_suffix": 30, "os": "Windows Server 2019", "services": ["NTCIP", "TMDD", "C2C"]},
            {"name": "Port Control System", "ip_suffix": 40, "os": "Solaris 11", "services": ["AIS", "VTS", "PMIS"]},
        ],
        "vulnerabilities": [
            {"cve": "CVE-2024-ATC01", "name": "ATC ASTERIX Parser Overflow", "tool": "atc_exploit", "type": "rce"},
            {"cve": "CVE-2023-RAIL", "name": "ERTMS Balise Injection", "tool": "rail_attack", "type": "ics"},
            {"cve": "CVE-2024-TMC", "name": "Traffic Controller SQLi", "tool": "sqlmap", "type": "sqli"},
            {"cve": "CVE-2023-PORT", "name": "Port VTS Auth Bypass", "tool": "vts_bypass", "type": "auth_bypass"},
        ],
        "creds": ["atc_controller", "rail_dispatcher", "traffic_ops", "port_master"],
        "passwords": ["Fl1ght_Ctrl#24!", "R@1l_S1gn@l!", "Tr@ff1c_0ps24", "P0rt_M@st3r!"],
    },
    "healthcare": {
        "name": "Healthcare",
        "ip_range": "10.60.1",
        "targets": [
            {"name": "Epic EHR Server", "ip_suffix": 10, "os": "RHEL 8", "services": ["Epic Hyperspace", "InterSystems Caché", "HL7 FHIR"]},
            {"name": "Medical Device Gateway", "ip_suffix": 20, "os": "Windows 10 IoT", "services": ["Philips IntelliVue", "GE CARESCAPE", "DICOM"]},
            {"name": "Pharmacy System", "ip_suffix": 30, "os": "Windows Server 2019", "services": ["Omnicell", "BD Pyxis", "NCPDP"]},
            {"name": "PACS Imaging Server", "ip_suffix": 40, "os": "Ubuntu 20.04", "services": ["Orthanc DICOM", "dcm4chee", "WADO-RS"]},
        ],
        "vulnerabilities": [
            {"cve": "CVE-2024-EPIC", "name": "Epic MyChart Auth Bypass", "tool": "epic_bypass", "type": "auth_bypass"},
            {"cve": "CVE-2023-DICOM", "name": "DICOM AE Title Injection", "tool": "dicom_exploit", "type": "rce"},
            {"cve": "CVE-2024-PUMP", "name": "Infusion Pump Override", "tool": "meddev_attack", "type": "ics"},
            {"cve": "CVE-2023-HL7", "name": "HL7 FHIR SSRF", "tool": "hl7_ssrf", "type": "ssrf"},
        ],
        "creds": ["ehr_admin", "med_device", "pharmacy_sys", "pacs_admin"],
        "passwords": ["H0sp1t@l#2024!", "M3dD3v1c3!", "Ph@rm@cy_Sys!", "P@CS_1m@g1ng"],
    },
    "government": {
        "name": "Government/Military",
        "ip_range": "10.70.1",
        "targets": [
            {"name": "Classified Network Gateway", "ip_suffix": 10, "os": "SELinux", "services": ["Cross Domain Solution", "Guard", "IPSec VPN"]},
            {"name": "Intelligence Database", "ip_suffix": 20, "os": "Oracle Linux", "services": ["Oracle RAC", "Palantir", "Elasticsearch"]},
            {"name": "Defense Command System", "ip_suffix": 30, "os": "VxWorks", "services": ["C4ISR", "Link 16", "GCCS"]},
            {"name": "Voting Infrastructure", "ip_suffix": 40, "os": "Windows 10", "services": ["EMS", "VSTL", "Ballot Scanner"]},
        ],
        "vulnerabilities": [
            {"cve": "CVE-2024-GOV01", "name": "CDS Policy Bypass", "tool": "cds_exploit", "type": "auth_bypass"},
            {"cve": "CVE-2023-INTEL", "name": "Oracle DB Priv Esc", "tool": "oracle_pe", "type": "privesc"},
            {"cve": "CVE-2024-C4ISR", "name": "C4ISR Buffer Overflow", "tool": "c4isr_exploit", "type": "rce"},
            {"cve": "CVE-2023-VOTE", "name": "Voting DB SQL Injection", "tool": "sqlmap", "type": "sqli"},
        ],
        "creds": ["classified_admin", "intel_analyst", "c4isr_operator", "election_admin"],
        "passwords": ["Cl@ss1f1ed#24!", "1nt3ll1g3nc3!", "D3f3ns3_Cmd!", "V0t3_S3cur3!"],
    },
    "emergency": {
        "name": "Emergency Services",
        "ip_range": "10.80.1",
        "targets": [
            {"name": "911 Dispatch Center", "ip_suffix": 10, "os": "Windows Server 2019", "services": ["Intrado Viper", "CAD", "ALI Database"]},
            {"name": "CAD System", "ip_suffix": 20, "os": "RHEL 8", "services": ["Hexagon CAD", "RMS", "Mobile Data"]},
            {"name": "FirstNet Responder", "ip_suffix": 30, "os": "LTE Core", "services": ["FirstNet Core", "MCPTT", "Priority Services"]},
            {"name": "Emergency Alert System", "ip_suffix": 40, "os": "Embedded Linux", "services": ["EAS Encoder", "CAP", "IPAWS"]},
        ],
        "vulnerabilities": [
            {"cve": "CVE-2024-911", "name": "911 VoIP SIP Overflow", "tool": "sip_exploit", "type": "rce"},
            {"cve": "CVE-2023-CAD", "name": "CAD API Auth Bypass", "tool": "cad_bypass", "type": "auth_bypass"},
            {"cve": "CVE-2024-EAS", "name": "EAS Encoder Injection", "tool": "eas_inject", "type": "rce"},
            {"cve": "CVE-2023-MCPTT", "name": "MCPTT Registration Spoof", "tool": "mcptt_spoof", "type": "spoof"},
        ],
        "creds": ["dispatch_super", "cad_admin", "firstnet_ops", "eas_broadcaster"],
        "passwords": ["911_D1sp@tch!", "C@D_Adm1n#24", "F1rstN3t_0ps!", "@l3rt_Syst3m!"],
    },
    "satellite": {
        "name": "Satellite/Space",
        "ip_range": "10.90.1",
        "targets": [
            {"name": "GPS Control Segment", "ip_suffix": 10, "os": "Solaris 11", "services": ["GPS OCS", "Navigation Upload", "L-Band"]},
            {"name": "Weather Satellite TT&C", "ip_suffix": 20, "os": "VxWorks", "services": ["NOAA GOES", "CCSDS", "S-Band"]},
            {"name": "CommSat Ground Station", "ip_suffix": 30, "os": "RHEL 7", "services": ["Intelsat", "DVB-S2", "Ka-Band"]},
            {"name": "ISS Communication Link", "ip_suffix": 40, "os": "SpaceLinux", "services": ["TDRSS", "Ku-Band", "CFDP"]},
        ],
        "vulnerabilities": [
            {"cve": "CVE-2024-GPS", "name": "GPS Upload Protocol Vuln", "tool": "gps_spoof", "type": "protocol"},
            {"cve": "CVE-2023-CCSDS", "name": "CCSDS TC Auth Bypass", "tool": "ccsds_exploit", "type": "auth_bypass"},
            {"cve": "CVE-2024-SAT01", "name": "Ground Station RCE", "tool": "satcom_exploit", "type": "rce"},
            {"cve": "CVE-2023-TDRS", "name": "TDRSS Link Hijack", "tool": "tdrs_hijack", "type": "mitm"},
        ],
        "creds": ["gps_controller", "satellite_ops", "ground_station", "iss_comms"],
        "passwords": ["GPS_C0ntr0l#24!", "S@t3ll1t3_0ps!", "Gr0und_St@t10n!", "ISS_C0mms_L1nk!"],
    },
    "supply": {
        "name": "Supply Chain",
        "ip_range": "10.100.1",
        "targets": [
            {"name": "Port Management TOS", "ip_suffix": 10, "os": "Windows Server 2019", "services": ["Navis N4", "SPARCS", "EDI"]},
            {"name": "Warehouse Automation", "ip_suffix": 20, "os": "Ubuntu 22.04", "services": ["SAP EWM", "AutoStore", "Fetch Robotics"]},
            {"name": "Fleet Logistics", "ip_suffix": 30, "os": "RHEL 8", "services": ["Oracle TMS", "Telematics", "GPS Fleet"]},
            {"name": "Container Tracking", "ip_suffix": 40, "os": "Kubernetes", "services": ["TradeLens", "Blockchain", "IoT Gateway"]},
        ],
        "vulnerabilities": [
            {"cve": "CVE-2024-PORT", "name": "Navis N4 SQL Injection", "tool": "sqlmap", "type": "sqli"},
            {"cve": "CVE-2023-WMS", "name": "SAP EWM RFC Deserialization", "tool": "sap_exploit", "type": "rce"},
            {"cve": "CVE-2024-FLEET", "name": "Fleet GPS Spoofing", "tool": "gps_spoof", "type": "spoof"},
            {"cve": "CVE-2023-K8S", "name": "Kubernetes RBAC Bypass", "tool": "k8s_exploit", "type": "auth_bypass"},
        ],
        "creds": ["port_manager", "warehouse_admin", "fleet_dispatcher", "container_ops"],
        "passwords": ["P0rt_TOS#2024!", "W@r3h0us3_@dm!", "Fl33t_L0g1st1cs!", "C0nt@1n3r_Tr@ck!"],
    },
    "media": {
        "name": "Media/Broadcast",
        "ip_range": "10.110.1",
        "targets": [
            {"name": "Broadcast Control Room", "ip_suffix": 10, "os": "Windows 10", "services": ["Grass Valley", "EVS", "NDI"]},
            {"name": "News Feed Server", "ip_suffix": 20, "os": "RHEL 8", "services": ["Reuters", "AP Feed", "RTMP"]},
            {"name": "CDN Edge Node", "ip_suffix": 30, "os": "FreeBSD", "services": ["Akamai", "Varnish", "HLS"]},
            {"name": "Emergency Broadcast", "ip_suffix": 40, "os": "Embedded", "services": ["EAS Encoder", "SAME", "CAP"]},
        ],
        "vulnerabilities": [
            {"cve": "CVE-2024-RTMP", "name": "RTMP Server Buffer Overflow", "tool": "rtmp_exploit", "type": "rce"},
            {"cve": "CVE-2023-NDI", "name": "NDI Discovery Injection", "tool": "ndi_inject", "type": "rce"},
            {"cve": "CVE-2024-CDN", "name": "CDN Cache Poisoning", "tool": "cache_poison", "type": "web"},
            {"cve": "CVE-2023-EBS", "name": "Emergency Broadcast Takeover", "tool": "ebs_hijack", "type": "rce"},
        ],
        "creds": ["broadcast_engineer", "news_producer", "cdn_admin", "ebs_operator"],
        "passwords": ["Br0@dc@st#2024!", "N3ws_F33d_!", "CDN_3dg3_N0d3!", "3BS_0v3rr1d3!"],
    },
    "nuclear": {
        "name": "Nuclear Systems",
        "ip_range": "10.120.1",
        "targets": [
            {"name": "Reactor DCS", "ip_suffix": 10, "os": "QNX 7.1", "services": ["Westinghouse Ovation", "PROFINET", "Safety PLC"]},
            {"name": "Enrichment Centrifuge", "ip_suffix": 20, "os": "Siemens S7", "services": ["S7-400", "Step7", "WinCC"]},
            {"name": "Cooling System SCADA", "ip_suffix": 30, "os": "Windows Server 2016", "services": ["Emerson DeltaV", "Foundation Fieldbus", "HART"]},
            {"name": "Radiation Monitoring", "ip_suffix": 40, "os": "Embedded Linux", "services": ["Mirion", "Health Physics", "EPRI"]},
        ],
        "vulnerabilities": [
            {"cve": "CVE-2024-NUC01", "name": "Ovation DCS Hardcoded Key", "tool": "ovation_exploit", "type": "auth_bypass"},
            {"cve": "CVE-2023-S7400", "name": "Siemens S7 Replay Attack", "tool": "s7_replay", "type": "ics"},
            {"cve": "CVE-2024-DELTAV", "name": "DeltaV Controller RCE", "tool": "deltav_exploit", "type": "rce"},
            {"cve": "CVE-2023-RAD", "name": "Radiation Monitor Spoof", "tool": "rad_spoof", "type": "spoof"},
        ],
        "creds": ["reactor_operator", "enrichment_tech", "cooling_engineer", "health_physics"],
        "passwords": ["R3@ct0r_DCS#1!", "3nr1ch_C3ntr1f!", "C00l1ng_SCADA!", "R@d_M0n1t0r!"],
    },
}

# Attack methodology phases with percentage ranges
ATTACK_PHASES = {
    (0, 15): {
        "name": "RECONNAISSANCE",
        "description": "passive and active information gathering",
        "activities": ["network scanning", "service enumeration", "OS fingerprinting", "vulnerability scanning"],
        "tools": ["nmap", "masscan", "nessus", "shodan", "recon-ng", "theHarvester"],
    },
    (15, 35): {
        "name": "SCANNING & ENUMERATION",
        "description": "deep scanning and vulnerability identification",
        "activities": ["vulnerability scanning", "service enumeration", "credential discovery", "attack surface mapping"],
        "tools": ["nmap scripts", "nikto", "gobuster", "enum4linux", "ldapsearch", "snmpwalk"],
    },
    (35, 55): {
        "name": "GAINING ACCESS",
        "description": "exploiting vulnerabilities and establishing foothold",
        "activities": ["exploitation", "payload delivery", "initial access", "shell establishment"],
        "tools": ["metasploit", "exploit-db", "sqlmap", "burpsuite", "cobalt strike", "impacket"],
    },
    (55, 75): {
        "name": "PRIVILEGE ESCALATION",
        "description": "elevating privileges and credential harvesting",
        "activities": ["privilege escalation", "credential dumping", "lateral movement preparation", "token manipulation"],
        "tools": ["mimikatz", "rubeus", "bloodhound", "powerview", "winpeas", "linpeas"],
    },
    (75, 90): {
        "name": "MAINTAINING ACCESS",
        "description": "establishing persistence and expanding control",
        "activities": ["persistence", "backdoor installation", "lateral movement", "data exfiltration"],
        "tools": ["empire", "covenant", "crackmapexec", "psexec", "wmi", "scheduled tasks"],
    },
    (90, 100): {
        "name": "TOTAL CONTROL",
        "description": "full domain compromise and preparation for destruction",
        "activities": ["domain admin access", "backup destruction", "kill switch preparation", "final staging"],
        "tools": ["ntdsutil", "vssadmin", "wbadmin", "bcdedit", "group policy", "golden ticket"],
    },
}

# Note: Attack text is now generated from pre-written scripts in attack_scripts.py
# This saves GPU/VRAM for more important tasks like AI chat and image generation


def get_attack_phase(compromise_percent: float) -> dict:
    """Get the current attack phase based on compromise percentage."""
    for (low, high), phase in ATTACK_PHASES.items():
        if low <= compromise_percent < high:
            return phase
    return ATTACK_PHASES[(90, 100)]  # Default to final phase


async def generate_ollama_attack(domain_id: str, compromise_level: float) -> AsyncGenerator[str, None]:
    """
    Generate realistic attack sequence using PRE-WRITTEN SCRIPTS.
    No GPU required - fast, reliable, and saves VRAM for other tasks.
    """
    # Import and use the script-based generator
    from attack_scripts import generate_attack_script
    
    async for text in generate_attack_script(domain_id, compromise_level):
        yield text




# Import chat function
from ollama_chat import chat_with_ardn
