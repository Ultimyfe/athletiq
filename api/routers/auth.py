# api/routers/auth.py
from datetime import datetime, timedelta
import os

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import text
from passlib.context import CryptContext
import jwt

from api.db.session import get_db

router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def _get_secret() -> str:
    secret = os.getenv("ATHLETIQ_JWT_SECRET")
    if not secret:
        raise RuntimeError("ATHLETIQ_JWT_SECRET is not set")
    return secret


def _get_algorithm() -> str:
    return os.getenv("ATHLETIQ_JWT_ALGORITHM", "HS256")


def _get_expire_hours() -> int:
    try:
        return int(os.getenv("ATHLETIQ_ACCESS_TOKEN_EXPIRE_HOURS", "24"))
    except Exception:
        return 24


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    row = db.execute(
        text("""
            SELECT id, clinic_name, password_hash
            FROM clinics
            WHERE email = :email
        """),
        {"email": str(req.email)},
    ).fetchone()

    if row is None or not row.password_hash or not pwd_context.verify(req.password, row.password_hash):
        raise HTTPException(status_code=401, detail="invalid login")

    payload = {
        "clinic_id": row.id,
        "clinic_name": row.clinic_name,
        "exp": datetime.utcnow() + timedelta(hours=_get_expire_hours()),
    }

    token = jwt.encode(payload, _get_secret(), algorithm=_get_algorithm())

    return {"access_token": token, "token_type": "bearer"}