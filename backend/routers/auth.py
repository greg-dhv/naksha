from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from database import db
from auth_utils import hash_password, verify_password, create_token, decode_token
import re

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()

USERNAME_RE = re.compile(r"^[a-z0-9_]{3,30}$")


class RegisterRequest(BaseModel):
    email: str
    password: str
    username: str


class LoginRequest(BaseModel):
    email: str
    password: str


def _user_dict(user: dict) -> dict:
    return {
        "id": user["id"],
        "email": user["email"],
        "username": user["username"],
        "has_chart": user.get("chart_data") is not None,
    }


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    user_id = decode_token(credentials.credentials)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    result = db.table("users").select("*").eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="User not found")
    return result.data[0]


@router.post("/register")
def register(body: RegisterRequest):
    username = body.username.lstrip("@").lower().strip()
    if not USERNAME_RE.match(username):
        raise HTTPException(status_code=400, detail="Username must be 3–30 lowercase letters, numbers, or underscores")
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    if db.table("users").select("id").eq("email", body.email.lower()).execute().data:
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.table("users").select("id").eq("username", username).execute().data:
        raise HTTPException(status_code=400, detail="Username already taken")

    result = db.table("users").insert({
        "email": body.email.lower(),
        "username": username,
        "password_hash": hash_password(body.password),
    }).execute()

    user = result.data[0]
    return {"token": create_token(user["id"]), "user": _user_dict(user)}


@router.post("/login")
def login(body: LoginRequest):
    result = db.table("users").select("*").eq("email", body.email.lower()).execute()
    if not result.data or not verify_password(body.password, result.data[0]["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = result.data[0]
    return {"token": create_token(user["id"]), "user": _user_dict(user)}


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return _user_dict(current_user)
