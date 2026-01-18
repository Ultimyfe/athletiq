from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import auth, patients, records, clinics
from fastapi import Body, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
import json

from api.db.session import get_db
from api.services.scoring_service import diagnose, CalcError
from api.deps.auth import get_current_clinic

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(records.router)
app.include_router(clinics.router)


@app.get("/health")
def health():
    return {"ok": True}

@app.post("/diagnose")
def post_diagnose(
    payload: dict = Body(...),
    clinic: dict = Depends(get_current_clinic),
    db: Session = Depends(get_db),
):
    try:
        # ✅ JWTから clinic_id を確定（唯一の正）
        clinic_id = clinic["clinic_id"]

        # ✅ patient_id はリクエスト必須
        patient_id = payload.get("patient_id")
        if patient_id is None:
            raise HTTPException(status_code=400, detail="patient_id が必要です")

        # ✅ 既存ロジック互換のため clinic_id を注入
        payload_for_calc = dict(payload)
        payload_for_calc["clinic_id"] = clinic_id

        # ✅ 診断ロジック呼び出し（新シグネチャ）
        result = diagnose(db, clinic_id, payload_for_calc)

        measured_at = (result.get("meta") or {}).get("measured_at")  # "YYYY-MM-DD" or None

        # ✅ DB保存
        db.execute(
            text("""
                INSERT INTO diagnose_records (clinic_id, patient_id, measured_at, payload, result)
                VALUES (
                  :clinic_id,
                  :patient_id,
                  COALESCE(CAST(:measured_at AS date), CURRENT_DATE),
                  CAST(:payload AS jsonb),
                  CAST(:result AS jsonb)
                )
            """),
            {
                "clinic_id": int(clinic_id),
                "patient_id": int(patient_id),
                "measured_at": measured_at,  # None OK
                "payload": json.dumps(payload_for_calc, ensure_ascii=False),
                "result": json.dumps(result, ensure_ascii=False),
            },
        )
        db.commit()

        return result

    except HTTPException:
        raise
    except Exception as e:
        # 想定外は 500 に集約
        raise HTTPException(status_code=500, detail=str(e))