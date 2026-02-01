# File: nuclei.py
import subprocess
import json
import tempfile
from pathlib import Path

def run_nuclei(target):
    results = []
    try:
        with tempfile.NamedTemporaryFile(mode='w+', delete=False, suffix='.json') as tmpfile:
            tmp_path = tmpfile.name

        cmd = [
            "nuclei",
            "-u", target,
            "-jsonl",
            "-o", tmp_path,
            "-severity", "info,low,medium,high,critical"
        ]

        subprocess.run(cmd, check=True)

        with open(tmp_path, 'r') as f:
            for line in f:
                try:
                    item = json.loads(line.strip())
                    results.append({
                        "template-id": item.get("template-id", "unknown"),
                        "severity": item.get("severity", "info"),
                        "name": item.get("info", {}).get("name", ""),
                        "description": item.get("info", {}).get("description", ""),
                        "matched-at": item.get("matched-at", "")
                    })
                except Exception:
                    continue

        Path(tmp_path).unlink(missing_ok=True)

    except subprocess.CalledProcessError as e:
        results.append({"error": f"Nuclei failed: {str(e)}"})

    return results
