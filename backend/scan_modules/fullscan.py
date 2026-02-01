# scan_modules/fullscan.py

import time
from scan_modules.ping_scan import ping_host
from scan_modules.nmap_scan import run_nmap
from scan_modules.nuclei import run_nuclei
from scan_modules.shodan_scan import run_shodan


def perform_full_scan(target: str, username: str):
    print(f"[+] Starting full scan for target: {target} by user: {username}")

    # --- Basic scans ---
    nmap_result = run_nmap(target) or {"ports": []}
    ping_result = ping_host(target) or {}

    # --- Advanced scans ---
    nuclei_result = run_nuclei(target) or []
    shodan_result = run_shodan(target) or {}

    # --- Server info ---
    server_info = {
        "hostname": target,
        "os": nmap_result.get("os", "Unknown")
    }

    # --- Threat evaluation (FIXED PROPERLY) ---
    threat_level = "Low"

    if nmap_result.get("ports") or nuclei_result:
        threat_level = "High"

    result = {
        "target": target,
        "scanned_by": username,
        "scan_type": "fullscan",
        "modules": {
            "ping": ping_result,
            "nmap": nmap_result,
            "nuclei": nuclei_result,
            "shodan": shodan_result
        },
        "threat_summary": {
            "threat_level": threat_level,
            "details": "Aggregated results from all modules."
        },
        "server_info": server_info
    }

    print(f"[+] Full scan completed for target: {target}")
    return result
