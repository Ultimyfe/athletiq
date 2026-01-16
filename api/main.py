# from fastapi import FastAPI, HTTPException, Body, Depends
# from sqlalchemy.orm import Session

# from db.session import get_db
# from services.scoring_service import diagnose, CalcError

# app = FastAPI()

# @app.get("/health")
# def health():
#     return {"ok": True}

# @app.post("/diagnose")
# def post_diagnose(payload: dict = Body(...), db: Session = Depends(get_db)):
#     """
#     受け取った入力を診断ロジックに渡して、UI向けに整形したJSONを返す
#     """
#     try:
#         return diagnose(db, payload)
#     except CalcError as e:
#         raise HTTPException(status_code=400, detail=str(e))
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"internal error: {e}")

# api/main.py
from fastapi import FastAPI, HTTPException, Body, Depends
from sqlalchemy.orm import Session

from db.session import get_db
from services.scoring_service import diagnose, CalcError

app = FastAPI()

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/diagnose")
def post_diagnose(payload: dict = Body(...), db: Session = Depends(get_db)):
    try:
        return diagnose(db, payload)
    except CalcError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))