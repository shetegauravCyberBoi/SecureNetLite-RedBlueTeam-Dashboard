import os
# shodan_scan.py
import shodan

SHODAN_API_KEY = os.getenv("SHODAN_API_KEY")
if not SHODAN_API_KEY:
    raise RuntimeError("SHODAN_API_KEY is not configured")

def run_shodan(target):
    api = shodan.Shodan(SHODAN_API_KEY)
    try:
        result = api.host(target)
        data = {
            "ip": result.get("ip_str", ""),
            "org": result.get("org", ""),
            "os": result.get("os", ""),
            "hostnames": result.get("hostnames", []),
            "ports": result.get("ports", []),
            "vulns": result.get("vulns", []),
        }
        return data
    except shodan.APIError as e:
        return {"error": str(e)}
