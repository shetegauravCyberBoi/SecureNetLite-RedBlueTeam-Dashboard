import subprocess
import socket
import time
from datetime import datetime, timezone

HIGH_RISK_PORTS = {21, 23, 445, 3389}
MGMT_PORTS = {22, 3389}

def normalize_ports(open_ports):
    normalized = []
    for p in open_ports:
        if isinstance(p, dict):
            port_str = p.get("port", "")
        else:
            port_str = p
        try:
            port_num = int(port_str.split("/")[0])
            normalized.append(port_num)
        except Exception:
            continue

    return normalized

def classify_ports(open_ports):
    ports = normalize_ports(open_ports)
    high_risk = sorted(set(ports) & HIGH_RISK_PORTS)
    management = sorted(set(ports) & MGMT_PORTS)
    return {
        "high_risk_ports": high_risk,
        "management_ports": management
    }
    
def ping_host(target):
    try:
        result = subprocess.check_output(
            ["ping", "-c", "4", target],
            stderr=subprocess.STDOUT,
            timeout=10
        ).decode()
        return {
            "reachable": True,
            "details": result
        }
    except Exception as e:
        return {
            "reachable": False,
            "details": str(e)
        }

def resolve_dns(target):
    try:
        hostname = socket.gethostbyaddr(target)[0]
        return hostname, True
    except Exception:
        return None, False

def nmap_scan(target):
    try:
        output = subprocess.check_output(
            ["nmap", "-Pn", "-T4", "--open", target],
            stderr=subprocess.STDOUT
        ).decode()
        open_ports = []
        for line in output.splitlines():
            if "/tcp" in line and "open" in line:
                open_ports.append(line.split()[0])
        return open_ports
    except Exception:
        return []

def calculate_health_score(reachable, open_ports, high_risk_ports):
    score = 100
    if not reachable:
        score -= 50
    score -= len(open_ports) * 5
    score -= len(high_risk_ports) * 10
    score = max(score, 0)
    if score >= 80:
        status = "Healthy"
    elif score >= 50:
        status = "Warning"
    else:
        status = "At Risk"
    return score, status

def run_basic_scan(target, scanned_by="guest"):
    start_time = time.time()
    hostname, dns_resolved = resolve_dns(target)
    ping_result = ping_host(target)
    open_ports = nmap_scan(target)
    port_risk = classify_ports(open_ports)
    score, status = calculate_health_score(
        ping_result["reachable"],
        open_ports,
        port_risk["high_risk_ports"]
    )
    findings = []
    if not ping_result["reachable"]:
        findings.append("Host is not reachable")
    if port_risk["high_risk_ports"]:
        findings.append("High-risk ports exposed")
    recommendations = [
        "Restrict exposed services using firewall rules",
        "Continuously monitor asset exposure",
        "Run full exposure scan if changes are detected"
    ]
    end_time = time.time()
    return {
        "scan_type": "baseline_health_check",
        "target": target,
        "scanned_by": scanned_by,
        "asset": {
            "target": target,
            "hostname": hostname,
            "dns_resolved": dns_resolved
        },
        "availability": {
            "reachable": ping_result["reachable"],
            "ping": {
                "target": target,
                "status": "reachable" if ping_result["reachable"] else "unreachable",
                "details": ping_result["details"],
                "scanned_by": scanned_by
            }
        },
        "network_exposure": {
            "open_ports": open_ports,
            "high_risk_ports": port_risk["high_risk_ports"],
            "management_ports": port_risk["management_ports"]
        },
        "health_score": {
            "score": score,
            "status": status
        },
        "findings": findings,
        "recommendations": recommendations,
        "scan_metadata": {
            "start_time": datetime.fromtimestamp(start_time, tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
            "end_time": datetime.fromtimestamp(end_time, tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
            "duration_seconds": round(end_time - start_time, 2)
        }
    }
