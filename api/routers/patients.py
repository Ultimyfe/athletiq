# api/routers/patients.py
from typing import Optional, Literal
from fastapi import APIRouter, Depends, Body, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text

from api.db.session import get_db
from api.deps.auth import get_current_clinic

router = APIRouter(tags=["patients"])


@router.get("/patients")
def list_patients(
    clinic=Depends(get_current_clinic),
    db: Session = Depends(get_db),
):
    rows = db.execute(
        text("""
            SELECT *
            FROM patients
            WHERE clinic_id = :clinic_id
            ORDER BY id DESC
        """),
        {"clinic_id": clinic["clinic_id"]},
    ).mappings().all()

    return {"items": list(rows)}


class PatientCreateRequest(BaseModel):
    last_name: str
    first_name: str
    birth_date: str
    sex: Literal["male", "female"]
    school_name: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    notes: Optional[str] = None


@router.post("/patients")
def create_patient(
    payload: PatientCreateRequest = Body(...),
    clinic=Depends(get_current_clinic),
    db: Session = Depends(get_db),
):
    row = db.execute(
        text("""
            INSERT INTO patients (
                clinic_id, last_name, first_name, birth_date, sex,
                school_name, guardian_name, guardian_phone, notes
            )
            VALUES (
                :clinic_id, :last_name, :first_name, :birth_date, :sex,
                :school_name, :guardian_name, :guardian_phone, :notes
            )
            RETURNING id
        """),
        {**payload.model_dump(), "clinic_id": clinic["clinic_id"]},
    ).fetchone()

    db.commit()
    return {"patient_id": row.id}


@router.get("/patients/{patient_id}")
def get_patient(
    patient_id: int,
    clinic=Depends(get_current_clinic),
    db: Session = Depends(get_db),
):
    row = db.execute(
        text("""
            SELECT *
            FROM patients
            WHERE id = :id
              AND clinic_id = :clinic_id
        """),
        {"id": patient_id, "clinic_id": clinic["clinic_id"]},
    ).mappings().fetchone()

    if row is None:
        raise HTTPException(status_code=404)

    return dict(row)


class PatientUpdateRequest(BaseModel):
    last_name: str
    first_name: str
    sex: Literal["male", "female"]
    school_name: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    notes: Optional[str] = None


@router.put("/patients/{patient_id}")
def update_patient(
    patient_id: int,
    payload: PatientUpdateRequest,
    clinic=Depends(get_current_clinic),
    db: Session = Depends(get_db),
):
    row = db.execute(
        text("""
            UPDATE patients
            SET
                last_name = :last_name,
                first_name = :first_name,
                sex = :sex,
                school_name = :school_name,
                guardian_name = :guardian_name,
                guardian_phone = :guardian_phone,
                notes = :notes,
                updated_at = NOW()
            WHERE id = :id
              AND clinic_id = :clinic_id
            RETURNING id
        """),
        {**payload.model_dump(), "id": patient_id, "clinic_id": clinic["clinic_id"]},
    ).fetchone()

    if row is None:
        raise HTTPException(status_code=404)

    db.commit()
    return {"ok": True}