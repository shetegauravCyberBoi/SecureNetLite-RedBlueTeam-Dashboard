from pathlib import Path
import hashlib, zipfile, math, re, os, datetime
import magic, yara, pefile, lief
from PIL import Image
from PIL.ExifTags import TAGS

# ── Hashing ──────────────────────────────────────────────────────────────────

def sha256_hash(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()

def md5_hash(path: Path) -> str:
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()

# ── Entropy ───────────────────────────────────────────────────────────────────

def file_entropy(path: Path) -> float:
    with open(path, "rb") as f:
        data = f.read()
    if not data:
        return 0.0
    freq = [data.count(byte) for byte in range(256)]
    entropy = -sum(
        (f / len(data)) * math.log2(f / len(data))
        for f in freq if f
    )
    return round(entropy, 3)

# ── Strings ───────────────────────────────────────────────────────────────────

def extract_strings(path: Path, min_len=6) -> list:
    with open(path, "rb") as f:
        data = f.read()
    pattern = rb"[ -~]{%d,}" % min_len
    return list(set(s.decode(errors="ignore") for s in re.findall(pattern, data)))

# ── Credentials ───────────────────────────────────────────────────────────────

CRED_PATTERNS = [
    r"password\s*=\s*.+",
    r"passwd\s*=\s*.+",
    r"token\s*=\s*.+",
    r"apikey\s*=\s*.+",
    r"api_key\s*=\s*.+",
    r"secret\s*=\s*.+",
    r"AWS_[A-Z_]+",
    r"BEGIN PRIVATE KEY",
    r"BEGIN RSA PRIVATE KEY",
    r"[a-fA-F0-9]{32,}",
]

def detect_credentials(strings: list) -> list:
    hits = []
    seen = set()
    for s in strings:
        for p in CRED_PATTERNS:
            if re.search(p, s, re.IGNORECASE) and s not in seen:
                seen.add(s)
                hits.append(s)
    return hits[:50]

# ── IOC Extraction ────────────────────────────────────────────────────────────

URL_PATTERN    = re.compile(r"https?://[^\s\"'<>]{4,}")
IP_PATTERN     = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")
EMAIL_PATTERN  = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
DOMAIN_PATTERN = re.compile(r"\b(?:[a-zA-Z0-9-]+\.)+(?:com|net|org|io|gov|edu|co|ru|cn|de|uk|info|biz|xyz|onion)\b")

PRIVATE_IP_RANGES = re.compile(
    r"^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.)"
)

def extract_iocs(strings: list) -> dict:
    urls    = list(set(URL_PATTERN.findall(" ".join(strings))))
    raw_ips = list(set(IP_PATTERN.findall(" ".join(strings))))
    emails  = list(set(EMAIL_PATTERN.findall(" ".join(strings))))
    domains = list(set(DOMAIN_PATTERN.findall(" ".join(strings))))

    # Separate public vs private IPs
    public_ips  = [ip for ip in raw_ips if not PRIVATE_IP_RANGES.match(ip)]
    private_ips = [ip for ip in raw_ips if PRIVATE_IP_RANGES.match(ip)]

    # Remove domains already captured in URLs
    url_domains = set(re.findall(r"https?://([^/\s]+)", " ".join(urls)))
    domains = [d for d in domains if d not in url_domains]

    return {
        "urls":        urls[:100],
        "ips":         public_ips[:50],
        "private_ips": private_ips[:50],
        "emails":      emails[:50],
        "domains":     domains[:50],
        "total":       len(urls) + len(public_ips) + len(emails) + len(domains)
    }

# ── MIME & Extension Mismatch ─────────────────────────────────────────────────

MIME_EXTENSION_MAP = {
    "image/png":               [".png"],
    "image/jpeg":              [".jpg", ".jpeg"],
    "image/gif":               [".gif"],
    "application/pdf":         [".pdf"],
    "application/zip":         [".zip"],
    "application/x-executable":[".exe"],
    "application/x-elf":       [".elf", ""],
    "text/plain":              [".txt", ".log", ".sh", ".py", ".js"],
    "text/html":               [".html", ".htm"],
    "application/x-msdownload":[".exe", ".dll"],
}

def check_mime_mismatch(path: Path, mime: str) -> bool:
    ext = path.suffix.lower()
    expected_exts = MIME_EXTENSION_MAP.get(mime, None)
    if expected_exts is None:
        return False
    return ext not in expected_exts

# ── Archive Extraction ────────────────────────────────────────────────────────

def extract_archive(path: Path) -> list:
    extracted = []
    if zipfile.is_zipfile(path):
        extract_dir = path.parent / f"{path.stem}_extracted"
        extract_dir.mkdir(exist_ok=True)
        try:
            with zipfile.ZipFile(path) as z:
                z.extractall(extract_dir)
            for p in extract_dir.rglob("*"):
                if p.is_file():
                    extracted.append(p)
        except Exception as e:
            print(f"[Archive] Extraction failed: {e}")
    return extracted

# ── PE Analysis ───────────────────────────────────────────────────────────────

SUSPICIOUS_IMPORTS = {
    "VirtualAlloc", "VirtualAllocEx", "VirtualProtect",
    "WriteProcessMemory", "ReadProcessMemory",
    "CreateRemoteThread", "CreateRemoteThreadEx",
    "NtUnmapViewOfSection", "ZwUnmapViewOfSection",
    "LoadLibrary", "LoadLibraryA", "LoadLibraryEx",
    "GetProcAddress", "ShellExecute", "ShellExecuteA",
    "WinExec", "CreateProcess", "CreateProcessA",
    "IsDebuggerPresent", "CheckRemoteDebuggerPresent",
    "RegSetValueEx", "RegCreateKeyEx",
    "InternetOpen", "InternetConnect", "HttpSendRequest",
    "WSAStartup", "connect", "send", "recv",
    "CryptEncrypt", "CryptDecrypt",
}

PACKER_SIGNATURES = {
    "UPX0": "UPX", "UPX1": "UPX", "UPX2": "UPX",
    ".aspack": "ASPack", ".adata": "ASPack",
    "Themida": "Themida", ".themida": "Themida",
    "MPRESS1": "MPRESS", "MPRESS2": "MPRESS",
    ".nsp0": "NSPack", ".nsp1": "NSPack",
}

def pe_analysis(path: Path) -> dict | None:
    try:
        pe = pefile.PE(str(path))

        # Compile time human readable
        compile_ts = pe.FILE_HEADER.TimeDateStamp
        try:
            compile_time_readable = datetime.datetime.utcfromtimestamp(compile_ts).strftime("%Y-%m-%d %H:%M:%S UTC")
        except Exception:
            compile_time_readable = str(compile_ts)

        # Sections with entropy
        sections = []
        for s in pe.sections:
            name = s.Name.decode(errors="ignore").strip("\x00")
            sec_data = s.get_data()
            sec_entropy = 0.0
            if sec_data:
                freq = [sec_data.count(b) for b in range(256)]
                sec_entropy = round(-sum(
                    (f / len(sec_data)) * math.log2(f / len(sec_data))
                    for f in freq if f
                ), 3)
            sections.append({
                "name":    name,
                "entropy": sec_entropy,
                "size":    s.SizeOfRawData,
                "suspicious": sec_entropy > 7.0
            })

        # Imports
        all_imports = []
        suspicious_found = []
        try:
            for entry in pe.DIRECTORY_ENTRY_IMPORT:
                for imp in entry.imports:
                    if imp.name:
                        name = imp.name.decode(errors="ignore")
                        all_imports.append(name)
                        if name in SUSPICIOUS_IMPORTS:
                            suspicious_found.append(name)
        except Exception:
            pass

        # Packer detection
        packer = None
        for s in pe.sections:
            sname = s.Name.decode(errors="ignore").strip("\x00")
            for sig, pack_name in PACKER_SIGNATURES.items():
                if sig.lower() in sname.lower():
                    packer = pack_name
                    break

        return {
            "entry_point":        hex(pe.OPTIONAL_HEADER.AddressOfEntryPoint),
            "compile_time":       compile_time_readable,
            "compile_timestamp":  compile_ts,
            "sections":           sections,
            "imports_count":      len(all_imports),
            "suspicious_imports": suspicious_found,
            "packer":             packer,
            "is_dll":             pe.is_dll(),
            "is_exe":             pe.is_exe(),
        }
    except Exception:
        return None

# ── LIEF Analysis ─────────────────────────────────────────────────────────────

def lief_analysis(path: Path) -> dict | None:
    try:
        binary = lief.parse(str(path))
        if binary is None:
            return None
        result = {
            "format": binary.format.name,
        }
        try:
            result["arch"] = binary.header.machine_type.name
        except Exception:
            try:
                result["arch"] = binary.header.architecture.name
            except Exception:
                result["arch"] = "Unknown"
        return result
    except Exception:
        return None

# ── YARA ──────────────────────────────────────────────────────────────────────

def yara_scan(path: Path) -> list:
    try:
        rules = yara.compile(filepath="rules.yar")
        matches = rules.match(str(path))
        return [m.rule for m in matches]
    except Exception:
        return []

# ── EXIF Metadata ─────────────────────────────────────────────────────────────

def extract_exif(path: Path) -> dict:
    try:
        img = Image.open(str(path))
        exif_raw = img._getexif()
        if not exif_raw:
            return {}
        return {
            TAGS.get(tag, str(tag)): str(val)
            for tag, val in exif_raw.items()
            if isinstance(val, (str, int, float, bytes))
        }
    except Exception:
        return {}

# ── MAC Times ─────────────────────────────────────────────────────────────────

def get_mac_times(path: Path) -> dict:
    stat = path.stat()
    def fmt(ts):
        return datetime.datetime.utcfromtimestamp(ts).strftime("%Y-%m-%d %H:%M:%S UTC")
    return {
        "modified": fmt(stat.st_mtime),
        "accessed": fmt(stat.st_atime),
        "created":  fmt(stat.st_ctime),
    }

# ── Threat Score ──────────────────────────────────────────────────────────────

def calculate_threat_score(analysis: dict) -> int:
    score = 0

    # Entropy
    entropy = analysis.get("entropy", 0)
    if entropy > 7.5:   score += 25
    elif entropy > 7.0: score += 15
    elif entropy > 6.0: score += 5

    # Credentials
    creds = analysis.get("credentials", [])
    if len(creds) > 10:  score += 20
    elif len(creds) > 0: score += 10

    # YARA
    yara_hits = analysis.get("yara", [])
    score += min(len(yara_hits) * 15, 30)

    # PE suspicious imports
    pe = analysis.get("pe") or {}
    suspicious = pe.get("suspicious_imports", [])
    if len(suspicious) > 5:  score += 20
    elif len(suspicious) > 0: score += 10

    # Packer
    if pe.get("packer"):
        score += 15

    # MIME mismatch
    if analysis.get("mime_mismatch"):
        score += 20

    # IOCs
    iocs = analysis.get("iocs", {})
    if len(iocs.get("urls", [])) > 5:  score += 10
    if len(iocs.get("ips", [])) > 3:   score += 10

    return min(score, 100)

# ── MITRE ATT&CK Mapping ──────────────────────────────────────────────────────

MITRE_IMPORT_MAP = {
    "VirtualAllocEx":          {"id": "T1055",    "name": "Process Injection"},
    "WriteProcessMemory":      {"id": "T1055",    "name": "Process Injection"},
    "CreateRemoteThread":      {"id": "T1055.003","name": "Thread Execution Hijacking"},
    "IsDebuggerPresent":       {"id": "T1622",    "name": "Debugger Evasion"},
    "CheckRemoteDebuggerPresent":{"id": "T1622",  "name": "Debugger Evasion"},
    "RegSetValueEx":           {"id": "T1547.001","name": "Registry Run Keys / Startup Folder"},
    "RegCreateKeyEx":          {"id": "T1547.001","name": "Registry Run Keys / Startup Folder"},
    "CryptEncrypt":            {"id": "T1486",    "name": "Data Encrypted for Impact"},
    "InternetOpen":            {"id": "T1071.001","name": "Web Protocols C2"},
    "HttpSendRequest":         {"id": "T1071.001","name": "Web Protocols C2"},
    "WSAStartup":              {"id": "T1095",    "name": "Non-Application Layer Protocol"},
    "ShellExecute":            {"id": "T1059",    "name": "Command and Scripting Interpreter"},
    "WinExec":                 {"id": "T1059",    "name": "Command and Scripting Interpreter"},
    "LoadLibrary":             {"id": "T1574.002","name": "DLL Side-Loading"},
}

def map_mitre_techniques(pe_data: dict | None) -> list:
    if not pe_data:
        return []
    techniques = {}
    for imp in pe_data.get("suspicious_imports", []):
        if imp in MITRE_IMPORT_MAP:
            t = MITRE_IMPORT_MAP[imp]
            techniques[t["id"]] = t
    return list(techniques.values())

# ── Core File Analyzer ────────────────────────────────────────────────────────

def analyze_file(path: Path) -> dict:
    strings  = extract_strings(path)
    mime     = magic.from_file(str(path), mime=True)
    pe_data  = pe_analysis(path)
    lief_data = lief_analysis(path)
    iocs     = extract_iocs(strings)
    exif     = extract_exif(path)
    mac_times = get_mac_times(path)
    mismatch = check_mime_mismatch(path, mime)

    suspicious_imports = []
    packer = None
    if pe_data:
        suspicious_imports = pe_data.get("suspicious_imports", [])
        packer = pe_data.get("packer")

    analysis = {
        "file":              path.name,
        "extension":         path.suffix.lower(),
        "size_kb":           round(path.stat().st_size / 1024, 2),
        "hashes": {
            "md5":    md5_hash(path),
            "sha256": sha256_hash(path),
        },
        "mime":              mime,
        "mime_mismatch":     mismatch,
        "entropy":           file_entropy(path),
        "credentials":       detect_credentials(strings),
        "iocs":              iocs,
        "pe":                pe_data,
        "lief":              lief_data,
        "yara":              yara_scan(path),
        "exif":              exif,
        "mac_times":         mac_times,
        "suspicious_imports": suspicious_imports,
        "packer":            packer,
        "strings_count":     len(strings),
    }

    analysis["threat_score"]      = calculate_threat_score(analysis)
    analysis["mitre_techniques"]  = map_mitre_techniques(pe_data)

    return analysis

# ── Insights Engine ───────────────────────────────────────────────────────────

def generate_insights(root: dict, extracted: list, mode: str) -> list:
    insights = []

    if mode == "red":
        if extracted:
            insights.append("Archive contained multiple files — possible data staging before exfiltration")
        if root["entropy"] > 7.5:
            insights.append("Very high entropy detected — file is likely encrypted or contains packed payload")
        elif root["entropy"] > 7.0:
            insights.append("High entropy detected — possible encrypted or compressed secret material")
        if root["credentials"]:
            insights.append(f"Credential artifacts detected ({len(root['credentials'])} hits) — high-value loot for lateral movement")
        if root["iocs"]["urls"]:
            insights.append(f"{len(root['iocs']['urls'])} embedded URLs found — potential C2 or exfiltration endpoints")
        if root["iocs"]["ips"]:
            insights.append(f"{len(root['iocs']['ips'])} public IP addresses found — map to infrastructure")
        if root.get("packer"):
            insights.append(f"Packer detected: {root['packer']} — binary is obfuscated, static analysis limited")
        if root.get("suspicious_imports"):
            insights.append(f"{len(root['suspicious_imports'])} suspicious API imports — indicates process injection or evasion capability")
        if root["mime_mismatch"]:
            insights.append(f"File extension mismatch — masquerading as {root['extension']} but is {root['mime']}")
        if root.get("exif"):
            insights.append("EXIF metadata present — may contain GPS, device, or author attribution data")

    elif mode == "blue":
        if root["entropy"] > 7.0:
            insights.append("High entropy — prioritize this file for sandbox detonation and deeper analysis")
        if root["yara"]:
            insights.append(f"YARA matched {len(root['yara'])} rules — cross-reference with threat intel for malware family")
        if root["credentials"]:
            insights.append(f"Credential patterns found — check if these match any production systems or leaked data")
        if root["iocs"]["urls"]:
            insights.append(f"Embedded URLs detected — add to blocklist and check proxy/firewall logs for hits")
        if root["iocs"]["ips"]:
            insights.append(f"IP addresses found — check SIEM for outbound connections to these hosts")
        if root.get("suspicious_imports"):
            insights.append(f"Suspicious API calls found — map to MITRE ATT&CK and check EDR telemetry")
        if root["mime_mismatch"]:
            insights.append(f"MIME mismatch — file is masquerading, check delivery vector and quarantine immediately")
        if extracted:
            insights.append(f"Archive extracted {len(extracted)} files — analyze each for embedded payloads")
        if root.get("packer"):
            insights.append(f"Binary is packed ({root['packer']}) — unpack before static analysis or use dynamic sandbox")
        if root.get("exif") and root["mime"] in ["image/png", "image/jpeg"]:
            insights.append("Image file with EXIF data — check for steganography if entropy is elevated")

    return insights

# ── Main Entry Point ──────────────────────────────────────────────────────────

def run_forensic_scan(path: Path, mode: str = "red") -> dict:
    print(f"[Forensics] Scanning {path.name} in {mode} mode")

    root_analysis = analyze_file(path)
    extracted_analyses = []

    extracted_files = extract_archive(path)
    for f in extracted_files:
        try:
            extracted_analyses.append(analyze_file(f))
        except Exception as e:
            print(f"[Forensics] Failed to analyze extracted file {f.name}: {e}")

    insights = generate_insights(root_analysis, extracted_files, mode)
    mitre    = root_analysis.get("mitre_techniques", [])

    print(f"[Forensics] Complete — score={root_analysis['threat_score']}, insights={len(insights)}")

    return {
        "root_file":       root_analysis,
        "extracted_files": extracted_analyses,
        "insights":        insights,
        "mitre_techniques": mitre,
        "scan_mode":       mode,
        "total_files_analyzed": 1 + len(extracted_analyses),
    }
