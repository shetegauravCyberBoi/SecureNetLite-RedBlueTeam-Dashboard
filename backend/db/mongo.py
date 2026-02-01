from pymongo import MongoClient
from gridfs import GridFS
import os

URI = "mongodb+srv://myadmin1:mongo4486@netguard.arzof6b.mongodb.net/?appName=netguard"
MONGO_URI = os.getenv("MONGO_URI", URI)
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
