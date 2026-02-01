# File: nmap_scan.py
import subprocess
import json
import re

def run_nmap(target_ip):
    try:
        print(f"[+] Scanning {target_ip} using Nmap...")
        result = subprocess.check_output(
            ['nmap', '-sV', '-O', target_ip],
            stderr=subprocess.STDOUT
        ).decode('utf-8')

        parsed_result = parse_nmap_output(result)
        return parsed_result

    except subprocess.CalledProcessError as e:
        print("[-] Nmap Error:", e.output.decode())
        return {"error": e.output.decode()}

def parse_nmap_output(output):
    parsed = {
        "ports": [],
        "os": "Unknown",
        "banner": "Unknown"
    }

    banner_lines = []

    for line in output.splitlines():
        # Ports
        if re.match(r"^\d+/tcp\s+open", line):
            parts = line.split()
            port = parts[0]
            service = parts[2] if len(parts) > 2 else "unknown"
            parsed["ports"].append({
                "port": port,
                "service": service,
                "state": "open"
            })
            banner_lines.append(line)

        # OS detection
        if "OS details" in line or "Running:" in line:
            parsed["os"] = line.split(":", 1)[-1].strip()

    parsed["banner"] = "\n".join(banner_lines[:5]) or "No banner info"
    return parsed

if __name__ == "__main__":
    target = input("Enter target IP or domain: ").strip()
    result = run_nmap(target)
    if result:
        with open(f"../reports/nmap_result_{target.replace('.', '_')}.json", "w") as f:
            json.dump(result, f, indent=4)
        print(f"[✓] Scan saved to reports/nmap_result_{target}.json")
