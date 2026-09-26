import re
import math
import socket
import requests
from urllib.parse import urlparse
from datetime import datetime
import tldextract

try:
    import whois
    WHOIS_AVAILABLE = True
except ImportError:
    WHOIS_AVAILABLE = False

class MaliciousURLScanner:
    def __init__(self):
        self.suspicious_tlds = {
            "xyz", "top", "gq", "tk", "ml", "cf", "work",
            "support", "zip", "country", "click", "link"
        }

        self.brand_keywords = {
            "paypal", "google", "facebook", "apple",
            "microsoft", "amazon", "bank", "login", "secure"
        }

        self.request_headers = {
            "User-Agent": "Mozilla/5.0 (Security Scanner)"
        }

    def domain_entropy(self, domain: str) -> float:
        if not domain:
            return 0
        prob = [domain.count(c) / len(domain) for c in set(domain)]
        return -sum(p * math.log2(p) for p in prob)
   
    def check_domain_age(self, domain: str):
        if not WHOIS_AVAILABLE:
            return None

        try:
            w = whois.whois(domain)
            creation = w.creation_date

            if isinstance(creation, list):
                creation = creation[0]

            if not creation:
                return None

            return (datetime.now() - creation).days
        except Exception:
            return None

    def dns_resolves(self, domain: str) -> bool:
        try:
            socket.gethostbyname(domain)
            return True
        except socket.gaierror:
            return False
    def check_http_status(self, url: str):
        try:
            r = requests.get(
                url,
                timeout=6,
                allow_redirects=True,
                headers=self.request_headers
            )
            return r.status_code, len(r.history)
        except requests.RequestException:
            return None, 0

    def scan(self, url: str) -> dict:
        findings = []
        score = 0
        if not url.startswith(("http://", "https://")):
            url = "http://" + url
        parsed = urlparse(url)
        hostname = parsed.hostname or ""
        extracted = tldextract.extract(url)
        root_domain = extracted.domain
        full_domain = f"{extracted.domain}.{extracted.suffix}"
        tld = extracted.suffix
        if not self.dns_resolves(full_domain):
            score += 25
            findings.append("Domain does not resolve via DNS")
        if re.fullmatch(r"\d+\.\d+\.\d+\.\d+", hostname):
            score += 30
            findings.append("URL uses raw IP address")
        if tld in self.suspicious_tlds:
            score += 20
            findings.append(f"Suspicious TLD detected: .{tld}")
        entropy = self.domain_entropy(root_domain)
        if entropy > 3.8:
            score += 20
            findings.append("High entropy domain (possible DGA / phishing)")
        if len(url) > 75:
            score += 10
            findings.append("Unusually long URL")
        if hostname.count(".") > 3:
            score += 10
            findings.append("Excessive subdomains")
        if any(c in url for c in ["@", "%"]):
            score += 15
            findings.append("Suspicious special characters in URL")
        for brand in self.brand_keywords:
            if brand in root_domain.lower() and root_domain.lower() != brand:
                score += 15
                findings.append(f"Possible brand impersonation: {brand}")
                break
        age_days = self.check_domain_age(full_domain)
        if age_days is not None and age_days < 90:
            score += 15
            findings.append("Recently registered domain")
        status, redirects = self.check_http_status(url)
        if status is None:
            score += 20
            findings.append("URL is unreachable over HTTP")
        else:
            if status >= 400:
                score += 10
                findings.append(f"HTTP error status: {status}")

            if redirects > 2:
                score += 10
                findings.append("Multiple HTTP redirects detected")
        if score >= 60:
            verdict = "Malicious"
        elif score >= 30:
            verdict = "Suspicious"
        else:
            verdict = "Safe"

        return {
            "url": url,
            "score": score,
            "verdict": verdict,
            "findings": findings
        }
