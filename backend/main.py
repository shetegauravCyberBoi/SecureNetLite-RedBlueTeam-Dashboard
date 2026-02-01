# File: main.py
import uuid
from fastapi import FastAPI, Query,File,UploadFile, Depends, HTTPException, Request , status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pathlib import Path
from datetime import datetime
import json
from fastapi import APIRouter
from db.mongo import get_pdf_fs
from bson import ObjectId
from io import BytesIO
import re
import signal
import sys
import subprocess
from typing import Optional
import os
import traceback

from auth.routes import router as auth_router
from utils.report_generator import generate_pdf_report
from scan_modules.nmap_scan import run_nmap
from scan_modules.shodan_scan import run_shodan
from scan_modules.fullscan import perform_full_scan
from scan_modules.ping_scan import ping_host
from scan_modules.basic_scan import run_basic_scan
from scan_modules.zap_crawler import zap_spider_scan, zap_active_scan
import shutil
from utils.pdf_lib import PDFReport
from middleware.jwt_user import get_current_user
from pydantic import BaseModel , Field , validator

from scan_modules.ffuf_engine import run_ffuf
from scan_modules.dir_enum_engine import run_dir_enum



app = FastAPI(title="Forensics API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev server
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=[
        "Authorization",  # 🔥 REQUIRED
        "Content-Type",
        "Accept"
    ],
)

# Then include routes
app.include_router(auth_router)

from db.mongo import client

@app.on_event("startup")
async def startup_db_check():
    try:
        client.admin.command("ping")
        print("[+] MongoDB connection successful")
    except Exception as e:
        print("[!] MongoDB connection failed:", e)




@app.on_event("startup")
def start_zap_docker():
    try:
        zap_home = "/home/user/zap_home"
        os.makedirs(zap_home, exist_ok=True)

        # Ensure permissions are writable
        subprocess.run(["chmod", "-R", "777", zap_home], check=False)

        # Check if ZAP is already running
        running = subprocess.run(
            ["docker", "ps", "-q", "-f", "name=zap-headless"],
            capture_output=True,
            text=True
        ).stdout.strip()

        if running:
            print("[*] ZAP container already running. Skipping startup.")
            return

        print("[*] Starting OWASP ZAP Docker container...")

        subprocess.Popen([
            "docker", "run",
            "--name", "zap-headless",
            "--rm",
            "-u", "root",                     # ✅ FIX
            "-p", "8090:8090",               # ✅ CONSISTENT PORT
            "-v", f"{zap_home}:/home/zap/.ZAP",
            "ghcr.io/zaproxy/zaproxy:stable",
            "zap.sh", "-daemon",
            "-host", "0.0.0.0",
            "-port", "8090",
            "-config", "api.addrs.addr.name=.*",
            "-config", "api.addrs.addr.regex=true",
            "-config", "api.disablekey=true"
        ])

        print("[+] ZAP started in background (headless Docker mode).")

    except Exception as e:
        print(f"[!] Failed to start ZAP container: {e}")

@app.get("/")
def root():
    return {"status": "SecureNetLite backend is live!"}


async def get_optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except Exception:
        return None


from utils.pdf_uploader import upload_pdf_to_mongodb

@app.get("/basic-scan")
async def basic_scan(
    target: str,
    request: Request,
    user: Optional[dict] = Depends(get_optional_user)
):
    username = user["username"] if user else "guest"

    # 1️⃣ Run scan (UNCHANGED)
    result = run_basic_scan(target, username)
    result["scanned_by"] = username

    scan_type = "baseline_health_check"

    # 2️⃣ Prepare filenames (UNCHANGED)
    safe_name = re.sub(r"\W+", "_", target).strip("_")
    reports_path = Path("reports")
    reports_path.mkdir(parents=True, exist_ok=True)

    json_filename = f"{scan_type}_{safe_name}.json"
    pdf_filename = f"{scan_type}_{safe_name}.pdf"

    json_path = reports_path / json_filename
    pdf_path = reports_path / pdf_filename

    # 3️⃣ Save JSON locally (UNCHANGED)
    with open(json_path, "w") as f:
        json.dump(result, f, indent=2)

    # 4️⃣ Generate PDF locally (UNCHANGED)
    generate_pdf_report(
        scan_results=result,
        filename=pdf_filename,
        is_guest=(username == "guest"),
        scanned_by=username,
        scan_type=scan_type,
    )

    # 5️⃣ 🔥 NEW: Upload PDF to MongoDB GridFS
    pdf_id = upload_pdf_to_mongodb(
        file_path=str(pdf_path),
        filename=pdf_filename,
        scanned_by=username,
        scan_type=scan_type
    )

    # 6️⃣ Response (slightly enriched, backward-compatible)
    return {
        "target": target,
        "pdf_id": str(pdf_id),  # 👈 frontend can use this
        "report_pdf": f"/report/download?file={pdf_filename}",  # still works
        "result": result,
    }

@app.get("/fullscan")
async def full_scan(
    target: str = Query(...),
    user=Depends(get_current_user)
):
    scan_type = "fullscan"
    result = perform_full_scan(target, user["username"])

    safe_name = re.sub(r'\W+', '_', target).strip('_')
    json_filename = f"{scan_type}_{safe_name}.json"
    pdf_filename = f"{scan_type}_{safe_name}.pdf"

    reports_path = Path("reports")
    reports_path.mkdir(parents=True, exist_ok=True)

    json_path = reports_path / json_filename
    pdf_path = reports_path / pdf_filename

    # Save JSON locally
    with open(json_path, "w") as f:
        json.dump(result, f, indent=2)

    # Generate PDF locally
    generate_pdf_report(
        result,
        filename=pdf_filename,
        is_guest=False,
        scan_type=scan_type,
        scanned_by=user["username"]
    )

    # 🔥 Upload PDF to MongoDB
    pdf_id = upload_pdf_to_mongodb(
        file_path=str(pdf_path),
        filename=pdf_filename,
        scanned_by=user["username"],
        scan_type=scan_type
    )


@app.post("/crawl")
async def crawl_target(
    target: str = Query(...),
    user=Depends(get_current_user)
):
    try:
        scan_type = "zap_crawler"
        spider_result = zap_spider_scan(target)
        spider_result["scanned_by"] = user["username"]

        safe_name = re.sub(r'\W+', '_', target).strip('_')
        pdf_filename = f"{scan_type}_{safe_name}.pdf"

        reports_path = Path("reports")
        reports_path.mkdir(parents=True, exist_ok=True)
        pdf_path = reports_path / pdf_filename

        # Generate PDF
        generate_pdf_report(
            {scan_type: spider_result},
            filename=pdf_filename,
            is_guest=False,
            scan_type=scan_type,
            scanned_by=user["username"]
        )

        # 🔥 Upload to MongoDB
        pdf_id = upload_pdf_to_mongodb(
            file_path=str(pdf_path),
            filename=pdf_filename,
            scanned_by=user["username"],
            scan_type=scan_type
        )

        return {
            "status": "success",
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/attack")
async def attack_target(
    target: str = Query(...),
    user=Depends(get_current_user)
):
    try:
        scan_type = "zap_active_scan"
        active_result = zap_active_scan(target)
        active_result["scanned_by"] = user["username"]

        safe_name = re.sub(r'\W+', '_', target).strip('_')
        pdf_filename = f"{scan_type}_{safe_name}.pdf"

        reports_path = Path("reports")
        reports_path.mkdir(parents=True, exist_ok=True)
        pdf_path = reports_path / pdf_filename

        # Generate PDF
        generate_pdf_report(
            {scan_type: active_result},
            filename=pdf_filename,
            is_guest=False,
            scan_type=scan_type,
            scanned_by=user["username"]
        )

        # 🔥 Upload to MongoDB
        pdf_id = upload_pdf_to_mongodb(
            file_path=str(pdf_path),
            filename=pdf_filename,
            scanned_by=user["username"],
            scan_type=scan_type
        )

        return {
            "status": "success",
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/report/download")
async def download_report(
    file: str = Query(...),
    user: Optional[dict] = Depends(get_optional_user)
):
    filepath = Path("reports") / file
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File not found")

    if file.endswith(".json") and (not user or user.get("role") != "admin"):
        raise HTTPException(status_code=403, detail="Admins only for JSON downloads")

    media_type = "application/pdf" if file.endswith(".pdf") else "application/json"
    return FileResponse(str(filepath), media_type=media_type, filename=file)

@app.get("/reports/pdfs")
async def list_user_pdfs(user=Depends(get_current_user)):
    fs = get_pdf_fs()

    pdfs = fs.find({"metadata.scanned_by": user["username"]})

    pdf_reports = []
    for pdf in pdfs:
        pdf_reports.append({
            "pdf_id": str(pdf._id),  # ✅ REQUIRED
            "filename": pdf.filename,
            "scan_type": pdf.metadata.get("scan_type", "unknown"),  # ✅ REQUIRED
            "uploaded_at": pdf.upload_date.isoformat()  # ✅ REQUIRED
        })

    return {"pdf_reports": pdf_reports}

@app.get("/report/download/{pdf_id}")
async def download_pdf(pdf_id: str, user=Depends(get_current_user)):
    fs = get_pdf_fs()
    try:
        obj_id = ObjectId(pdf_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid PDF ID format")

    pdf = fs.find_one({"_id": obj_id})
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")
    if pdf.metadata.get("scanned_by") != user["username"]:
        raise HTTPException(status_code=403, detail="Unauthorized access")

    return StreamingResponse(
        BytesIO(pdf.read()),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={pdf.filename}"}
    )



from scan_modules.artifact_scanner import run_forensic_scan

class ArtifactRequest(BaseModel):
    path: str
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@app.post("/forensics/scan")
async def forensic_scan(
    file: UploadFile = File(...),
    mode: str = "red"   # red | blue
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Invalid file")

    file_id = f"{uuid.uuid4()}_{file.filename}"
    file_path = UPLOAD_DIR / file_id

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    results = run_forensic_scan(file_path, mode=mode)

    return {
        "status": "ok",
        "mode": mode,
        "results": results
    }

class FFUFRequest(BaseModel):
    url: str = Field(
        ...,
        example="https://domain.com/FUZZ",
        description="Target URL containing FUZZ keyword"
    )

    @validator("url")
    def validate_fuzz(cls, v):
        if "FUZZ" not in v:
            raise ValueError("URL must contain FUZZ keyword")
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v

class DirEnumRequest(BaseModel):
    target: str = Field(
        ...,
        example="https://example.com",
        description="Base URL for file or directory enumeration"
    )
    mode: str = Field(
        default="files",
        description="Enumeration mode (files / dirs)"
    )

    @validator("target")
    def validate_target(cls, v):
        if not v.startswith(("http://", "https://")):
            raise ValueError("Target must start with http:// or https://")
        return v.rstrip("/")


@app.post(
    "/enum/ffuf",
    status_code=status.HTTP_200_OK,
    summary="FFUF-style fuzzing",
    tags=["Enumeration"]
)
async def ffuf_api(
    req: FFUFRequest,
    user=Depends(get_current_user)
):
    try:
        results = await run_ffuf(req.url)

        return {
            "success": True,
            "target": req.url,
            "count": len(results),
            "results": results
        }

    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.post(
    "/enum/dirs",
    status_code=status.HTTP_200_OK,
    summary="Directory / File Enumeration",
    tags=["Enumeration"]
)
async def dir_enum_api(
    req: DirEnumRequest,
    user=Depends(get_current_user)
):
    try:
        results = await run_dir_enum(req.target, mode=req.mode)

        return {
            "success": True,
            "target": req.target,
            "mode": req.mode,
            "count": len(results),
            "results": results
        }

    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )

    except Exception:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="File enumeration failed"
        )

    
def handle_shutdown(sig, frame):
    print("\n[!] Ctrl+C detected. Restarting Docker...")
    try:
        subprocess.run(["systemctl", "restart", "docker"], check=True)
        print("[+] Docker restarted successfully.")
    except subprocess.CalledProcessError as e:
        print(f"[!] Failed to restart Docker: {e}")
    sys.exit(0)


signal.signal(signal.SIGINT, handle_shutdown)
