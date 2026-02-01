from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from auth.utils import hash_password, verify_password, create_jwt
from db.mongo import get_user_collection
from bson.objectid import ObjectId
from middleware.jwt_user import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "analyst"


class LoginRequest(BaseModel):
    username: str
    password: str


# ---------- REGISTER ----------
@router.post("/register")
async def register(data: RegisterRequest):
    users_col = get_user_collection()

    username = data.username.strip().lower()
    email = data.email.strip().lower()
    password = data.password.strip()

    if users_col.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    if users_col.find_one({"username": username}):
        raise HTTPException(status_code=400, detail="Username already taken")

    hashed_password = hash_password(password)

    user_doc = {
        "username": username,
        "email": email,
        "password": hashed_password,
        "role": data.role,
    }

    result = users_col.insert_one(user_doc)
    return {"message": "User registered successfully", "user_id": str(result.inserted_id)}


# ---------- LOGIN ----------
@router.post("/login")
async def login(data: LoginRequest):
    users_col = get_user_collection()

    username = data.username.strip().lower()
    password = data.password.strip()

    user = users_col.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # ✅ Include user info in token and response
    token_data = {
        "sub": str(user["_id"]),
        "username": user["username"],
        "role": user["role"],
    }

    token = create_jwt(token_data)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
        },
    }

@router.get("/test")
async def test(user: dict = Depends(get_current_user)):
    return {"message": f"Hello {user['username']}, Auth router working"}
