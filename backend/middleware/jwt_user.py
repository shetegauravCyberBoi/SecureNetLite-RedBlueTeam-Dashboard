from fastapi import Request, HTTPException, status
from jose import jwt, JWTError
import os

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "GcZk5LkF0EgrDPlQ1C-T6_7Z7wC9Gp86JvKX_VkFvts"
)
ALGORITHM = "HS256"


async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid token",
        )

    token = auth_header.replace("Bearer ", "").strip()

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        user_id = payload.get("sub")
        username = payload.get("username")
        role = payload.get("role", "user")

        if not user_id or not username:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )

        return {
            "id": user_id,
            "username": username,
            "role": role,
        }

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
