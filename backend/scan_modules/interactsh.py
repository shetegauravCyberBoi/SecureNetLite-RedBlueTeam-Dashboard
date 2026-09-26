# File: interactsh.py
import subprocess
import json
import uuid
import tempfile
import os

def run_interactsh():
    session_id = str(uuid.uuid4())
    result = {
        "session_id": session_id,
        "interactions": [],
        "raw_output": "",
        "stderr": ""
    }
    try:
        tmp_path = tempfile.NamedTemporaryFile(delete=False).name
        cmd = [
            "interactsh-client",
            "-json",
            "-o", tmp_path,
            "-session-id", session_id,
            "-poll-interval", "10",
            "-poll-duration", "20",
        ]
        print(f"[+] Running Interactsh with session ID: {session_id}")
        proc = subprocess.run(cmd, timeout=30, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        result["stderr"] = proc.stderr.decode()
        if os.path.exists(tmp_path):
            with open(tmp_path, "r") as f:
                lines = f.readlines()
                result["raw_output"] = ''.join(lines)
                for line in lines:
                    try:
                        interaction = json.loads(line.strip())
                        result["interactions"].append({
                            "type": interaction.get("protocol", "unknown"),
                            "timestamp": interaction.get("timestamp", ""),
                            "remote-address": interaction.get("remote-address", ""),
                            "unique-id": interaction.get("unique-id", "")
                        })
                    except:
                        continue
            os.remove(tmp_path)
    except subprocess.TimeoutExpired:
        result["error"] = "Timeout expired while waiting for Interactsh"
    except Exception as e:
        result["error"] = str(e)
    return result
