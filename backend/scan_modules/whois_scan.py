# whois_scan.py
import subprocess
import re

def run_whois(target):
    try:
        result = subprocess.check_output(['whois', target], stderr=subprocess.DEVNULL).decode('utf-8')
        data = {}

        # Extract key fields
        for line in result.splitlines():
            if ":" in line:
                key, val = line.split(":", 1)
                key = key.strip()
                val = val.strip()
                if key and val:
                    data[key] = val
        return data
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    ip = input("Enter domain/IP: ").strip()
    print(run_whois(ip))

