# api/routers/records.py
from datetime import date

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from api.db.session import get_db
from api.models.record import DiagnoseRecord
from api.deps.auth import get_current_clinic

router = APIRouter(tags=["records"])


def _fmt_date(d: date) -> str:
    return d.strftime("%Y-%m-%d")


@router.get("/records")
def list_records(
    patient_id: int = Query(...),
    clinic=Depends(get_current_clinic),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(DiagnoseRecord)
        .filter(DiagnoseRecord.patient_id == patient_id)
        .filter(DiagnoseRecord.clinic_id == clinic["clinic_id"])
        .order_by(DiagnoseRecord.measured_at.desc(), DiagnoseRecord.id.desc())
        .all()
    )

    items = []
    for r in rows:
        result = r.result or {}
        summary = result.get("summary") or {}
        items.append(
            {
                "id": r.id,
                "measured_at": _fmt_date(r.measured_at),
                "summary": {
                    "motor_age": (summary.get("motor_age") or None),
                    "type": (summary.get("type") or None),
                    "class": (summary.get("class") or None),
                },
            }
        )

    return {"items": items}


@router.get("/records/{record_id}")
def get_record(
    record_id: int,
    clinic=Depends(get_current_clinic),
    db: Session = Depends(get_db),
):
    r = (
        db.query(DiagnoseRecord)
        .filter(DiagnoseRecord.id == record_id)
        .filter(DiagnoseRecord.clinic_id == clinic["clinic_id"])
        .first()
    )

    if not r:
        raise HTTPException(status_code=404, detail="record not found")

    return {
        "id": r.id,
        "measured_at": _fmt_date(r.measured_at),
        "payload": r.payload or {},
        "result": r.result or {},
    }