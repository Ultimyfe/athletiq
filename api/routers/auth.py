# api/routers/auth.py
# from datetime import datetime, timedelta
# import os

# from fastapi import APIRouter, HTTPException, Depends
# from pydantic import BaseModel, EmailStr
# from sqlalchemy.orm import Session
# from sqlalchemy import text
# from passlib.context import CryptContext
# import jwt

# from api.db.session import get_db

# router = APIRouter(prefix="/auth", tags=["auth"])

# pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


# def _get_secret() -> str:
#     secret = os.getenv("ATHLETIQ_JWT_SECRET")
#     if not secret:
#         raise RuntimeError("ATHLETIQ_JWT_SECRET is not set")
#     return secret


# def _get_algorithm() -> str:
#     return os.getenv("ATHLETIQ_JWT_ALGORITHM", "HS256")


# def _get_expire_hours() -> int:
#     try:
#         return int(os.getenv("ATHLETIQ_ACCESS_TOKEN_EXPIRE_HOURS", "24"))
#     except Exception:
#         return 24


# class LoginRequest(BaseModel):
#     email: EmailStr
#     password: str


# @router.post("/login")
# def login(req: LoginRequest, db: Session = Depends(get_db)):
#     row = db.execute(
#         text("""
#             SELECT id, clinic_name, password_hash
#             FROM clinics
#             WHERE email = :email
#         """),
#         {"email": str(req.email)},
#     ).fetchone()

#     if row is None or not row.password_hash or not pwd_context.verify(req.password, row.password_hash):
#         raise HTTPException(status_code=401, detail="invalid login")

#     payload = {
#         "clinic_id": row.id,
#         "clinic_name": row.clinic_name,
#         "exp": datetime.utcnow() + timedelta(hours=_get_expire_hours()),
#     }

#     token = jwt.encode(payload, _get_secret(), algorithm=_get_algorithm())

#     return {"access_token": token, "token_type": "bearer"}




# api/routers/auth.py
from datetime import datetime, timedelta
import os

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, Field
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


class SignupRequest(BaseModel):
    clinic_name: str
    postal_code: str
    address: str
    owner_name: str
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/signup")
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    # 1) email重複チェック
    exists = db.execute(
        text("SELECT 1 FROM clinics WHERE email = :email"),
        {"email": str(payload.email)},
    ).fetchone()
    if exists:
        raise HTTPException(status_code=409, detail="email already exists")

    # 2) hash
    password_hash = pwd_context.hash(payload.password)

    # 3) insert（created_at/updated_at が無いschemaでも動くように最小カラムに寄せる）
    row = db.execute(
        text("""
            INSERT INTO clinics (clinic_name, postal_code, address, owner_name, email, password_hash)
            VALUES (:clinic_name, :postal_code, :address, :owner_name, :email, :password_hash)
            RETURNING id, clinic_name
        """),
        {
            "clinic_name": payload.clinic_name,
            "postal_code": payload.postal_code,
            "address": payload.address,
            "owner_name": payload.owner_name,
            "email": str(payload.email),
            "password_hash": password_hash,
        },
    ).fetchone()

    db.commit()

    return {"ok": True, "clinic_id": int(row.id), "clinic_name": row.clinic_name}


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
        "clinic_id": int(row.id),
        "clinic_name": row.clinic_name,
        "exp": datetime.utcnow() + timedelta(hours=_get_expire_hours()),
    }

    token = jwt.encode(payload, _get_secret(), algorithm=_get_algorithm())

    return {"access_token": token, "token_type": "bearer"}