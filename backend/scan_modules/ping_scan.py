# scan_modules/ping_scan.py
import subprocess
import platform
import time

def ping_host(target: str):
    print(f"[+] Starting ping scan for target: {target}")
    time.sleep(1)
    result = {
        "target": target,
        "status": "unknown",
        "details": None,
        "scanned_by": "guest"
    }
    try:
        param = "-n" if platform.system().lower() == "windows" else "-c"
        command = ["ping", param, "4", target]
        process = subprocess.run(command, capture_output=True, text=True, timeout=10)
        if process.returncode == 0:
            result["status"] = "reachable"
            result["details"] = process.stdout
        else:
            result["status"] = "unreachable"
            result["details"] = process.stderr
    except Exception as e:
        result["status"] = "error"
        result["details"] = str(e)
    print(f"[+] Ping scan completed for target: {target}")
    return result
