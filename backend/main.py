# File: main.py
import uuid
from fastapi import FastAPI, Query,File,UploadFile, Depends, HTTPException, Request , status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pathlib import Path
from datetime import datetime
import json
from fastapi import APIRouter
from bson import ObjectId
from io import BytesIO
import re
import signal
import sys
import subprocess
from typing import Optional
import os
import httpx
import traceback
import shutil
from db.mongo import get_pdf_fs , client
from auth.routes import router as auth_router
from utils.report_generator import generate_pdf_report
from utils.pdf_uploader import upload_pdf_to_mongodb
from utils.pdf_lib import PDFReport
from scan_modules.nmap_scan import run_nmap
from scan_modules.shodan_scan import run_shodan
from scan_modules.fullscan import perform_full_scan
from scan_modules.ping_scan import ping_host
from scan_modules.basic_scan import run_basic_scan
from scan_modules.zap_crawler import zap_spider_scan, zap_active_scan
from scan_modules.artifact_scanner import run_forensic_scan
from scan_modules.ffuf_engine import run_ffuf
from scan_modules.dir_enum_engine import run_dir_enum
from scan_modules.CSRFgen import CSRFGenerator
from scan_modules.maliciousURL import MaliciousURLScanner
from middleware.jwt_user import get_current_user
from pydantic import BaseModel , Field , validator , HttpUrl

app = FastAPI(title="Forensics API", version="1.0")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://10.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://10.0.0.1:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

async def get_optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except Exception:
        return None
        
class ArtifactRequest(BaseModel):
    path: str
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

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
        subprocess.run(["chmod", "-R", "777", zap_home], check=False)
        
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
            "-p", "8090:8090",
            "--add-host=host.docker.internal:host-gateway",
            "-v", f"{zap_home}:/home/zap/.ZAP",
            "ghcr.io/zaproxy/zaproxy:stable",
            "zap.sh", "-daemon",
            "-host", "0.0.0.0",
            "-port", "8090",
            "-config", "api.addrs.addr.name=.*",
            "-config", "api.addrs.addr.regex=true",
            "-config", "api.disablekey=true"
        ])

        print("[+] ZAP started in background (bridged mode).")

    except Exception as e:
        print(f"[!] Failed to start ZAP container: {e}")
@app.get("/")
def root():
    return {"status": "SecureNetLite backend is live!"}

@app.get("/basic-scan")
async def basic_scan(
    target: str,
    request: Request,
    user: Optional[dict] = Depends(get_optional_user)
):
    username = user["username"] if user else "guest"
    result = run_basic_scan(target, username)
    result["scanned_by"] = username
    scan_type = "baseline_health_check"
    safe_name = re.sub(r"\W+", "_", target).strip("_")
    reports_path = Path("reports")
    reports_path.mkdir(parents=True, exist_ok=True)
    json_filename = f"{scan_type}_{safe_name}.json"
    pdf_filename = f"{scan_type}_{safe_name}.pdf"
    json_path = reports_path / json_filename
    pdf_path = reports_path / pdf_filename
    with open(json_path, "w") as f:
        json.dump(result, f, indent=2)
    generate_pdf_report(
        scan_results=result,
        filename=pdf_filename,
        is_guest=(username == "guest"),
        scanned_by=username,
        scan_type=scan_type,
    )
    pdf_id = upload_pdf_to_mongodb(
        file_path=str(pdf_path),
        filename=pdf_filename,
        scanned_by=username,
        scan_type=scan_type
    )
    return {
        "target": target,
        "pdf_id": str(pdf_id), 
        "report_pdf": f"/report/download?file={pdf_filename}", 
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
    with open(json_path, "w") as f:
        json.dump(result, f, indent=2)
    generate_pdf_report(
        scan_results=result,
        filename=pdf_filename,
        is_guest=False,
        scan_type=scan_type,
        scanned_by=user["username"]
    )
    pdf_id = upload_pdf_to_mongodb(
        file_path=str(pdf_path),
        filename=pdf_filename,
        scanned_by=user["username"],
        scan_type=scan_type
    )
    return {
        "target": target,
        "pdf_id": str(pdf_id),
        "report_pdf": f"/report/download?file={pdf_filename}",
        "scan_result": result
    }
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
        generate_pdf_report(
            {scan_type: spider_result},
            filename=pdf_filename,
            is_guest=False,
            scan_type=scan_type,
            scanned_by=user["username"]
        )
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
        generate_pdf_report(
            {scan_type: active_result},
            filename=pdf_filename,
            is_guest=False,
            scan_type=scan_type,
            scanned_by=user["username"]
        )   
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
            "pdf_id": str(pdf._id),
            "filename": pdf.filename,
            "scan_type": pdf.metadata.get("scan_type", "unknown"),
            "uploaded_at": pdf.upload_date.isoformat() 
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

@app.post("/enum/ffuf", status_code=status.HTTP_200_OK, summary="FFUF-style fuzzing", tags=["Enumeration"])
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

@app.post("/enum/dirs", status_code=status.HTTP_200_OK, summary="Directory / File Enumeration", tags=["Enumeration"] )
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

class CSRFRequest(BaseModel):
    raw_request: str
    base_url: str
    
@app.post("/enum/csrf", tags=["Enumeration"])
async def csrf_generator_api(
    req: CSRFRequest,
    user=Depends(get_current_user)
):
    try:
        generator = CSRFGenerator(base_url=req.base_url)
        result = generator.generate(req.raw_request)

        return {
            "success": True,
            "generated_by": user["username"],
            "result": result
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

class MaliciousURLRequest(BaseModel):
    url: HttpUrl

@app.post(
    "/scan/malicious-url",
    tags=["Threat Detection"],
    summary="Heuristic-based Malicious URL Detection"
)
async def malicious_url_api(
    req: MaliciousURLRequest,
    user=Depends(get_current_user)
):
    try:
        target_url = str(req.url)
        scanner = MaliciousURLScanner()
        result = scanner.scan(target_url)
        return {
            "success": True,
            "scanned_by": user["username"],
            "target": target_url,
            "result": result
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Malicious URL scan failed"
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
