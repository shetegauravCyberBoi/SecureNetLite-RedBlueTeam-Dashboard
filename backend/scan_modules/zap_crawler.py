import time
import requests
import re
import os

ZAP_API = os.getenv("ZAP_API_URL", "http://localhost:8090")

def resolve_network_path(url: str) -> str:
    """
    Translates localhost/127.0.0.1 to a path accessible from 
    inside the ZAP Docker container.
    """
    if "127.0.0.1" in url or "localhost" in url:
        # Replaces local loopback with the host-gateway alias defined in Docker startup
        new_url = url.replace("127.0.0.1", "host.docker.internal").replace("localhost", "host.docker.internal")
        print(f"[Network] Translating {url} -> {new_url} for Docker compatibility.")
        return new_url
    return url

def reset_zap_session():
    """Ensures a clean slate for each scan."""
    try:
        requests.get(f"{ZAP_API}/JSON/core/action/newSession/", 
                     params={"name": "SecureNetSession", "overwrite": "true"}, timeout=10)
        print("[ZAP] Session reset: Ready for new target.")
    except Exception as e:
        print(f"[ZAP] Session reset failed: {e}")

def seed_target(target_url: str):
    """Forces ZAP to 'see' the URL to prevent URL_NOT_FOUND errors."""
    try:
        print(f"[ZAP] Seeding target: {target_url}")
        requests.get(f"{ZAP_API}/JSON/core/action/accessUrl/",
                     params={"url": target_url, "followRedirects": "true"}, timeout=20)
        time.sleep(2) 
    except Exception:
        pass

def wait_for_task(scan_id: str, task_type: str):
    """Polls ZAP status until 100%."""
    if not scan_id or not str(scan_id).isdigit():
        print(f"[{task_type.upper()}] Failed: Invalid Scan ID received.")
        return False

    endpoint = "spider" if task_type == "spider" else "ascan"
    while True:
        try:
            resp = requests.get(f"{ZAP_API}/JSON/{endpoint}/view/status/", 
                                params={"scanId": scan_id}, timeout=5).json()
            status = resp.get("status", "0")
            print(f"[{task_type.upper()}] Progress: {status}%")
            if status == "100": return True
            time.sleep(5)
        except Exception:
            break
    return False

def fetch_filtered_alerts(target_url: str):
    """Fetches alerts while ignoring ZAP internal maintenance noise."""
    try:
        params = {"baseurl": target_url, "count": 5000}
        raw_alerts = requests.get(f"{ZAP_API}/JSON/core/view/alerts/", params=params, timeout=15).json().get("alerts", [])
        return [a for a in raw_alerts if a.get("pluginId") != "10015"]
    except Exception:
        return []

# --- Restored Entry Points for main.py ---

def zap_spider_scan(raw_target_url: str) -> dict:
    """Performs discovery and passive analysis only."""
    target_url = resolve_network_path(raw_target_url)
    reset_zap_session()
    seed_target(target_url)
    
    print(f"[ZAP] Starting Spider: {target_url}")
    scan_resp = requests.get(f"{ZAP_API}/JSON/spider/action/scan/", 
                             params={"url": target_url, "recurse": "true"}).json()
    
    success = wait_for_task(scan_resp.get("scan"), "spider")
    
    urls = requests.get(f"{ZAP_API}/JSON/spider/view/results/", 
                        params={"scanId": scan_resp.get("scan")}).json().get("results", [])
    
    alerts = fetch_filtered_alerts(target_url)
    
    return {
        "target": target_url,
        "url_count": len(urls),
        "urls": urls,
        "alerts": parse_alerts(alerts)
    }

def zap_active_scan(raw_target_url: str) -> dict:
    """Performs full attack: Spider -> Active Scan."""
    target_url = resolve_network_path(raw_target_url)
    reset_zap_session()
    seed_target(target_url)
    
    # 1. Spider
    spider_resp = requests.get(f"{ZAP_API}/JSON/spider/action/scan/", 
                               params={"url": target_url, "recurse": "true"}).json()
    wait_for_task(spider_resp.get("scan"), "spider")

    # 2. Attack
    print(f"[ZAP] Starting Active Scan: {target_url}")
    ascan_resp = requests.get(f"{ZAP_API}/JSON/ascan/action/scan/", 
                              params={"url": target_url, "recurse": "true"}).json()
    
    success = wait_for_task(ascan_resp.get("scan"), "ascan")

    # 3. Final Report
    all_alerts = fetch_filtered_alerts(target_url)
    
    return {
        "target": target_url,
        "scan_status": "Success" if success else "Failed",
        "alerts": parse_alerts(all_alerts)
    }

# --- Shared Helpers ---

def parse_alerts(alerts: list) -> list:
    parsed = []
    for a in alerts:
        parsed.append({
            "alert":      a.get("alert"),
            "risk":       a.get("risk"),
            "confidence": a.get("confidence"),
            "url":        a.get("url"),
            "param":      a.get("param", "N/A"),
            "cweid":      a.get("cweid", "N/A"),
            "desc":       a.get("description", ""),
            "solution":   a.get("solution", "")
        })
    return parsed
