from pathlib import Path
import hashlib, subprocess, zipfile, math, re, os
import magic, yara, pefile, lief, r2pipe

# -------------------------
# Utility Functions
# -------------------------

def sha256_hash(path: Path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()

def md5_hash(path: Path):
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()

def file_entropy(path: Path):
    with open(path, "rb") as f:
        data = f.read()
    if not data:
        return 0
    freq = [data.count(byte) for byte in range(256)]
    entropy = -sum(
        (f / len(data)) * math.log2(f / len(data))
        for f in freq if f
    )
    return round(entropy, 3)

def extract_strings(path: Path, min_len=6):
    with open(path, "rb") as f:
        data = f.read()
    pattern = rb"[ -~]{%d,}" % min_len
    return list(set(s.decode(errors="ignore") for s in re.findall(pattern, data)))

# -------------------------
# Credential Detection
# -------------------------

CRED_PATTERNS = [
    r"password\s*=\s*.+",
    r"passwd\s*=\s*.+",
    r"token\s*=\s*.+",
    r"apikey\s*=\s*.+",
    r"secret\s*=\s*.+",
    r"AWS_[A-Z_]+",
    r"BEGIN PRIVATE KEY",
    r"[a-fA-F0-9]{32,}",  # hashes
]

def detect_credentials(strings):
    hits = []
    for s in strings:
        for p in CRED_PATTERNS:
            if re.search(p, s, re.IGNORECASE):
                hits.append(s)
    return hits[:50]

# -------------------------
# Archive Handling
# -------------------------

def extract_archive(path: Path):
    extracted = []
    if zipfile.is_zipfile(path):
        extract_dir = path.parent / f"{path.stem}_extracted"
        extract_dir.mkdir(exist_ok=True)
        with zipfile.ZipFile(path) as z:
            z.extractall(extract_dir)
        for p in extract_dir.rglob("*"):
            if p.is_file():
                extracted.append(p)
    return extracted

# -------------------------
# Binary Analysis
# -------------------------

def pe_analysis(path: Path):
    try:
        pe = pefile.PE(str(path))
        return {
            "entry_point": hex(pe.OPTIONAL_HEADER.AddressOfEntryPoint),
            "compile_time": pe.FILE_HEADER.TimeDateStamp,
            "sections": [s.Name.decode(errors="ignore") for s in pe.sections],
        }
    except:
        return None

def lief_analysis(path: Path):
    try:
        binary = lief.parse(str(path))
        return {
            "format": binary.format.name,
            "arch": binary.header.machine_type.name,
        }
    except:
        return None

# -------------------------
# YARA
# -------------------------

def yara_scan(path: Path):
    try:
        rules = yara.compile(filepath="rules.yar")
        matches = rules.match(str(path))
        return [m.rule for m in matches]
    except:
        return []

# -------------------------
# MAIN PIPELINE
# -------------------------

def analyze_file(path: Path):
    strings = extract_strings(path)

    return {
        "file": path.name,
        "size_kb": round(path.stat().st_size / 1024, 2),
        "hashes": {
            "md5": md5_hash(path),
            "sha256": sha256_hash(path)
        },
        "mime": magic.from_file(str(path), mime=True),
        "entropy": file_entropy(path),
        "credentials": detect_credentials(strings),
        "pe": pe_analysis(path),
        "lief": lief_analysis(path),
        "yara": yara_scan(path),
    }

def run_forensic_scan(path: Path, mode="red"):
    results = {
        "root_file": analyze_file(path),
        "extracted_files": [],
        "insights": []
    }

    extracted = extract_archive(path)

    for f in extracted:
        results["extracted_files"].append(analyze_file(f))

    # 🔴 Red Team Insights
    if mode == "red":
        if extracted:
            results["insights"].append("Archive contained multiple files (possible data staging)")
        if results["root_file"]["entropy"] > 7:
            results["insights"].append("High entropy detected (possible encrypted or secret material)")
        if results["root_file"]["credentials"]:
            results["insights"].append("Credential artifacts detected (high-value loot)")

    return results
