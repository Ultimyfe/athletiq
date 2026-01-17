# api/routers/clinics.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import text
from passlib.context import CryptContext

from api.db.session import get_db
from api.deps.auth import get_current_clinic

router = APIRouter(prefix="/clinics", tags=["clinics"])

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def _weak_password(pw: str) -> bool:
    pw = pw or ""
    if len(pw) < 8:
        return True
    weak_list = {"00000000", "11111111", "12345678", "password", "Password"}
    if pw in weak_list:
        return True
    if len(set(pw)) == 1:
        return True
    return False


class ClinicUpdateRequest(BaseModel):
    clinic_name: str
    postal_code: str
    address: str
    owner_name: str
    email: EmailStr


class ClinicPasswordUpdateRequest(BaseModel):
    current_password: str
    new_password: str


@router.get("/me")
def get_me(
    clinic=Depends(get_current_clinic),
    db: Session = Depends(get_db),
):
    row = db.execute(
        text("""
            SELECT id, clinic_name, postal_code, address, owner_name, email, created_at, updated_at
            FROM clinics
            WHERE id = :id
        """),
        {"id": clinic["clinic_id"]},
    ).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="clinic not found")

    return {
        "id": row.id,
        "clinic_name": row.clinic_name,
        "postal_code": row.postal_code,
        "address": row.address,
        "owner_name": row.owner_name,
        "email": row.email,
        "created_at": str(row.created_at) if row.created_at else None,
        "updated_at": str(row.updated_at) if row.updated_at else None,
    }


@router.put("/me")
def update_me(
    payload: ClinicUpdateRequest,
    clinic=Depends(get_current_clinic),
    db: Session = Depends(get_db),
):
    exists = db.execute(
        text("SELECT 1 FROM clinics WHERE email = :email AND id <> :id"),
        {"email": str(payload.email), "id": clinic["clinic_id"]},
    ).fetchone()
    if exists:
        raise HTTPException(status_code=409, detail="email already exists")

    row = db.execute(
        text("""
            UPDATE clinics
            SET clinic_name = :clinic_name,
                postal_code = :postal_code,
                address = :address,
                owner_name = :owner_name,
                email = :email,
                updated_at = NOW()
            WHERE id = :id
            RETURNING id, clinic_name
        """),
        {
            "id": clinic["clinic_id"],
            "clinic_name": payload.clinic_name,
            "postal_code": payload.postal_code,
            "address": payload.address,
            "owner_name": payload.owner_name,
            "email": str(payload.email),
        },
    ).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="clinic not found")

    db.commit()
    return {"ok": True, "clinic_id": row.id, "clinic_name": row.clinic_name}


@router.put("/me/password")
def update_password(
    payload: ClinicPasswordUpdateRequest,
    clinic=Depends(get_current_clinic),
    db: Session = Depends(get_db),
):
    if _weak_password(payload.new_password):
        raise HTTPException(status_code=400, detail="weak password (min 8 chars, avoid simple patterns)")

    row = db.execute(
        text("SELECT id, password_hash FROM clinics WHERE id = :id"),
        {"id": clinic["clinic_id"]},
    ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="clinic not found")

    stored = row.password_hash or ""
    if not stored:
        raise HTTPException(status_code=401, detail="invalid current password")

    ok = False
    try:
        ok = pwd_context.verify(payload.current_password, stored)
    except Exception:
        ok = False

    if not ok:
        raise HTTPException(status_code=401, detail="invalid current password")

    new_hash = pwd_context.hash(payload.new_password)

    db.execute(
        text("""
            UPDATE clinics
            SET password_hash = :password_hash,
                updated_at = NOW()
            WHERE id = :id
        """),
        {"id": clinic["clinic_id"], "password_hash": new_hash},
    )
    db.commit()

    return {"ok": True}