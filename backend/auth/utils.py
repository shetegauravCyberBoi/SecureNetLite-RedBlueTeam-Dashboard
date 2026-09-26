import os
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from fastapi import HTTPException

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is not configured")
ALGORITHM = "HS256"
MAX_BCRYPT_BYTES = 72
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def clean_password(password: str) -> str:
    if not isinstance(password, str):
        password = str(password)
    password = password.strip()
    encoded_length = len(password.encode("utf-8"))
    if encoded_length > MAX_BCRYPT_BYTES:
        password = password.encode("utf-8")[:MAX_BCRYPT_BYTES].decode("utf-8", errors="ignore")
    return password

def hash_password(password: str) -> str:
    clean_pw = clean_password(password)
    try:
        return pwd_context.hash(clean_pw)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Password hashing failed: {str(e)}")

def verify_password(plain: str, hashed: str) -> bool:
    try:
        clean_pw = clean_password(plain)
        return pwd_context.verify(clean_pw, hashed)
    except Exception:
        return False

def create_jwt(data: dict, expires_delta: timedelta = timedelta(hours=2)) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
