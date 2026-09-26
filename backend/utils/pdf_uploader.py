# utils/pdf_uploader.py

from db.mongo import get_pdf_fs
from bson import ObjectId
from datetime import datetime

def upload_pdf_to_mongodb(
    file_path: str,
    filename: str,
    scanned_by: str,
    scan_type: str
) -> ObjectId:
    fs = get_pdf_fs()
    with open(file_path, "rb") as pdf:
        file_id = fs.put(
            pdf,
            filename=filename,
            metadata={
                "scanned_by": scanned_by,
                "scan_type": scan_type,
                "uploaded_at": datetime.utcnow(),
            },
        )
    return file_id
