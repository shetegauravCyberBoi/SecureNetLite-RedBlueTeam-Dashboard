# scan_modules/zap_crawler.py

import time
import requests

ZAP_API = "http://localhost:8090"  # ZAP Docker API endpoint

def zap_spider_scan(target_url: str) -> dict:
    try:
        # Start spider scan
        scan_response = requests.get(f"{ZAP_API}/JSON/spider/action/scan/?url={target_url}")
        scan_id = scan_response.json().get("scan")
        
        # Poll until spider completes
        while True:
            status = requests.get(f"{ZAP_API}/JSON/spider/view/status/?scanId={scan_id}").json()["status"]
            print(f"[Spidering] Status: {status}%")
            if status == '100':
                break
            time.sleep(1)

        # Get discovered URLs
        urls_response = requests.get(f"{ZAP_API}/JSON/core/view/urls/")
        urls = urls_response.json().get("urls", [])

        return {
            "target": target_url,
            "url_count": len(urls),
            "urls": urls
        }

    except Exception as e:
        return {"error": str(e)}


def zap_active_scan(target_url: str) -> dict:
    try:
        # Ensure in scope
        requests.get(f"{ZAP_API}/JSON/core/action/accessUrl/?url={target_url}")
        requests.get(f"{ZAP_API}/JSON/ascan/action/enableAllScanners/")

        scan_response = requests.get(
            f"{ZAP_API}/JSON/ascan/action/scan/",
            params={"url": target_url, "recurse": True, "inScopeOnly": True}
        )
        scan_id = scan_response.json().get("scan")

        while True:
            status = requests.get(
                f"{ZAP_API}/JSON/ascan/view/status/",
                params={"scanId": scan_id}
            ).json()["status"]

            print(f"[Active Scan] Status: {status}%")

            if status == '100':
                break

            time.sleep(2)

        alerts = requests.get(
            f"{ZAP_API}/JSON/core/view/alerts/",
            params={"baseurl": target_url}
        ).json().get("alerts", [])

        return {
            "target": target_url,
            "alert_count": len(alerts),
            "alerts": alerts
        }

    except Exception as e:
        return {"error": str(e)}
