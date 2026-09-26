from pymongo import MongoClient
from gridfs import GridFS
import os

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI is not configured")
client = MongoClient(MONGO_URI)
secure_net_db = client["SecureNetLite"]
user_collection = secure_net_db["users"]
pdf_collection = secure_net_db["pdf_reports"]
pdf_fs = GridFS(secure_net_db, collection="pdf_reports")
def get_user_collection():
    return user_collection
def get_pdf_collection():
    return pdf_collection
def get_pdf_fs():
    return pdf_fs
