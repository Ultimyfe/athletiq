# from fastapi import APIRouter, HTTPException, Depends
# from pydantic import BaseModel, EmailStr
# from sqlalchemy.orm import Session
# from sqlalchemy import text
# from passlib.context import CryptContext

# from api.db.session import get_db

# router = APIRouter(prefix="/auth", tags=["auth"])

# # =========================
# # password hash 設定
# # =========================
# pwd_context = CryptContext(
#     schemes=["bcrypt"],
#     deprecated="auto"
# )


# def hash_password(password: str) -> str:
#     return pwd_context.hash(password)


# def verify_password(plain: str, hashed: str) -> bool:
#     return pwd_context.verify(plain, hashed)


# # =========================
# # Request Models
# # =========================
# class SignupRequest(BaseModel):
#     clinic_name: str
#     postal_code: str
#     address: str
#     owner_name: str
#     email: EmailStr
#     password: str


# class LoginRequest(BaseModel):
#     email: EmailStr
#     password: str


# # =========================
# # Signup
# # =========================
# @router.post("/signup")
# def signup(payload: SignupRequest, db: Session = Depends(get_db)):
#     # 1. email 重複チェック
#     exists = db.execute(
#         text("SELECT 1 FROM clinics WHERE email = :email"),
#         {"email": payload.email}
#     ).fetchone()

#     if exists:
#         raise HTTPException(
#             status_code=400,
#             detail="このメールアドレスは既に登録されています"
#         )

#     # 2. password hash
#     hashed_pw = hash_password(payload.password)

#     # 3. insert
#     db.execute(
#         text("""
#             INSERT INTO clinics (
#                 clinic_name,
#                 postal_code,
#                 address,
#                 owner_name,
#                 email,
#                 password,
#                 created_at,
#                 updated_at
#             )
#             VALUES (
#                 :clinic_name,
#                 :postal_code,
#                 :address,
#                 :owner_name,
#                 :email,
#                 :password,
#                 NOW(),
#                 NOW()
#             )
#         """),
#         {
#             "clinic_name": payload.clinic_name,
#             "postal_code": payload.postal_code,
#             "address": payload.address,
#             "owner_name": payload.owner_name,
#             "email": payload.email,
#             "password": hashed_pw,
#         }
#     )

#     db.commit()

#     return {"ok": True}


# # =========================
# # Login
# # =========================
# @router.post("/login")
# def login(req: LoginRequest, db: Session = Depends(get_db)):
#     row = db.execute(
#         text("""
#             SELECT id, clinic_name, password
#             FROM clinics
#             WHERE email = :email
#         """),
#         {"email": req.email}
#     ).fetchone()

#     if row is None:
#         raise HTTPException(status_code=401, detail="invalid login")

#     # パスワード検証
#     if not verify_password(req.password, row.password):
#         raise HTTPException(status_code=401, detail="invalid login")

#     return {
#         "clinic_id": row.id,
#         "clinic_name": row.clinic_name
#     }

# from fastapi import APIRouter, HTTPException, Depends
# from pydantic import BaseModel
# from sqlalchemy.orm import Session
# from sqlalchemy import text

# from passlib.context import CryptContext

# from api.db.session import get_db

# router = APIRouter(prefix="/auth", tags=["auth"])

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# class SignupRequest(BaseModel):
#     clinic_name: str
#     postal_code: str
#     address: str
#     owner_name: str
#     email: str
#     password: str


# class LoginRequest(BaseModel):
#     email: str
#     password: str


# @router.post("/signup")
# def signup(req: SignupRequest, db: Session = Depends(get_db)):
#     # 1) email 重複チェック
#     exists = db.execute(
#         text("SELECT 1 FROM clinics WHERE email = :email"),
#         {"email": req.email},
#     ).fetchone()
#     if exists is not None:
#         raise HTTPException(status_code=409, detail="email already exists")

#     # 2) password hash
#     hashed = pwd_context.hash(req.password)

#     # 3) clinics に insert（RETURNING で id を返す）
#     row = db.execute(
#         text("""
#             INSERT INTO clinics (clinic_name, postal_code, address, owner_name, email, password)
#             VALUES (:clinic_name, :postal_code, :address, :owner_name, :email, :password)
#             RETURNING id, clinic_name
#         """),
#         {
#             "clinic_name": req.clinic_name,
#             "postal_code": req.postal_code,
#             "address": req.address,
#             "owner_name": req.owner_name,
#             "email": req.email,
#             "password": hashed,
#         },
#     ).fetchone()

#     db.commit()

#     return {"ok": True, "clinic_id": row.id, "clinic_name": row.clinic_name}


# @router.post("/login")
# def login(req: LoginRequest, db: Session = Depends(get_db)):
#     row = db.execute(
#         text("""
#             SELECT id, clinic_name, password
#             FROM clinics
#             WHERE email = :email
#         """),
#         {"email": req.email},
#     ).fetchone()

#     if row is None:
#         raise HTTPException(status_code=401, detail="invalid login")

#     # パスワード検証
#     if not pwd_context.verify(req.password, row.password):
#         raise HTTPException(status_code=401, detail="invalid login")

#     return {"clinic_id": row.id, "clinic_name": row.clinic_name}


# from fastapi import APIRouter, HTTPException, Depends
# from pydantic import BaseModel, EmailStr
# from sqlalchemy.orm import Session
# from sqlalchemy import text
# from passlib.context import CryptContext

# from api.db.session import get_db


# import traceback
# from sqlalchemy.exc import IntegrityError


# router = APIRouter(prefix="/auth", tags=["auth"])

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# class SignupRequest(BaseModel):
#     clinic_name: str
#     postal_code: str
#     address: str
#     owner_name: str
#     email: EmailStr
#     password: str  # ← リクエストは平文で受ける（保存は hash）


# class LoginRequest(BaseModel):
#     email: EmailStr
#     password: str


# @router.post("/signup")
# def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    # print("### signup payload:", payload.dict())
    # # 1) email 重複チェック
    # exists = db.execute(
    #     text("SELECT 1 FROM clinics WHERE email = :email"),
    #     {"email": payload.email},
    # ).fetchone()
    # if exists:
    #     raise HTTPException(status_code=409, detail="email already exists")

    # # 2) password を hash
    # password_hash = pwd_context.hash(payload.password)

    # # 3) clinics に insert（password_hash カラムへ）
    # row = db.execute(
    #     text("""
    #         INSERT INTO clinics (clinic_name, postal_code, address, owner_name, email, password_hash)
    #         VALUES (:clinic_name, :postal_code, :address, :owner_name, :email, :password_hash)
    #         RETURNING id, clinic_name
    #     """),
    #     {
    #         "clinic_name": payload.clinic_name,
    #         "postal_code": payload.postal_code,
    #         "address": payload.address,
    #         "owner_name": payload.owner_name,
    #         "email": payload.email,
    #         "password_hash": password_hash,
    #     },
    # ).fetchone()

    # db.commit()

    # return {"ok": True, "clinic_id": row.id, "clinic_name": row.clinic_name}
#     @router.post("/signup")
#     def signup(payload: SignupRequest, db: Session = Depends(get_db)):
#         print("### signup payload:", payload.dict())

#         exists = db.execute(
#             text("SELECT 1 FROM clinics WHERE email = :email"),
#             {"email": str(payload.email)},
#         ).fetchone()
#         if exists:
#             raise HTTPException(status_code=409, detail="email already exists")

#         password_hash = pwd_context.hash(payload.password)

#         try:
#             row = db.execute(
#                 text("""
#                     INSERT INTO clinics
#                     (clinic_name, postal_code, address, owner_name, email, password_hash)
#                     VALUES
#                     (:clinic_name, :postal_code, :address, :owner_name, :email, :password_hash)
#                     RETURNING id, clinic_name
#                 """),
#                 {
#                     "clinic_name": payload.clinic_name,
#                     "postal_code": payload.postal_code,
#                     "address": payload.address,
#                     "owner_name": payload.owner_name,
#                     "email": str(payload.email),
#                     "password_hash": password_hash,
#                 },
#             ).fetchone()
#             db.commit()

#         except IntegrityError as e:
#             db.rollback()
#             print("### signup IntegrityError:", repr(e))
#             print(traceback.format_exc())
#             # UNIQUE制約 / NOT NULL制約など
#             raise HTTPException(status_code=400, detail="signup failed (integrity error)")

#         except Exception as e:
#             db.rollback()
#             print("### signup Exception:", repr(e))
#             print(traceback.format_exc())
#             raise HTTPException(status_code=500, detail="signup failed")

#         if row is None:
#             raise HTTPException(status_code=500, detail="signup failed")

#         return {"ok": True, "clinic_id": row.id, "clinic_name": row.clinic_name}

# @router.post("/login")
# def login(req: LoginRequest, db: Session = Depends(get_db)):
#     row = db.execute(
#         text("""
#             SELECT id, clinic_name, password_hash
#             FROM clinics
#             WHERE email = :email
#         """),
#         {"email": req.email},
#     ).fetchone()

#     if row is None:
#         raise HTTPException(status_code=401, detail="invalid login")

#     # パスワード検証
#     if not row.password_hash or not pwd_context.verify(req.password, row.password_hash):
#         raise HTTPException(status_code=401, detail="invalid login")

#     return {"clinic_id": row.id, "clinic_name": row.clinic_name}

# from fastapi import APIRouter, HTTPException, Depends
# from pydantic import BaseModel, EmailStr
# from sqlalchemy.orm import Session
# from sqlalchemy import text
# from passlib.context import CryptContext

# from api.db.session import get_db

# router = APIRouter(prefix="/auth", tags=["auth"])

# pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


# class SignupRequest(BaseModel):
#     clinic_name: str
#     postal_code: str
#     address: str
#     owner_name: str
#     email: EmailStr
#     password: str = Field(min_length=8, max_length=128)  # 平文で受ける（DBには hash）


# class LoginRequest(BaseModel):
#     email: EmailStr
#     password: str


# @router.post("/signup")
# def signup(payload: SignupRequest, db: Session = Depends(get_db)):
#     # 1. email 重複チェック
#     exists = db.execute(
#         text("SELECT 1 FROM clinics WHERE email = :email"),
#         {"email": str(payload.email)},
#     ).fetchone()

#     if exists:
#         raise HTTPException(status_code=409, detail="email already exists")

#     # 2. password を hash
#     password_hash = pwd_context.hash(payload.password)

#     # 3. clinics に insert
#     row = db.execute(
#         text("""
#             INSERT INTO clinics
#               (clinic_name, postal_code, address, owner_name, email, password_hash)
#             VALUES
#               (:clinic_name, :postal_code, :address, :owner_name, :email, :password_hash)
#             RETURNING id, clinic_name
#         """),
#         {
#             "clinic_name": payload.clinic_name,
#             "postal_code": payload.postal_code,
#             "address": payload.address,
#             "owner_name": payload.owner_name,
#             "email": str(payload.email),
#             "password_hash": password_hash,
#         },
#     ).fetchone()

#     db.commit()

#     return {
#         "ok": True,
#         "clinic_id": row.id,
#         "clinic_name": row.clinic_name,
#     }


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

#     if row is None:
#         raise HTTPException(status_code=401, detail="invalid login")

#     if not pwd_context.verify(req.password, row.password_hash):
#         raise HTTPException(status_code=401, detail="invalid login")

#     return {
#         "clinic_id": row.id,
#         "clinic_name": row.clinic_name,
#     }

# from fastapi import APIRouter, HTTPException, Depends
# from pydantic import BaseModel, EmailStr, Field
# from sqlalchemy.orm import Session
# from sqlalchemy import text
# from passlib.context import CryptContext

# from api.db.session import get_db

# router = APIRouter(prefix="/auth", tags=["auth"])

# # ✅ bcrypt事故回避：pbkdf2_sha256 を使う
# pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


# class SignupRequest(BaseModel):
#     clinic_name: str
#     postal_code: str
#     address: str
#     owner_name: str
#     email: EmailStr
#     password: str = Field(min_length=8, max_length=128)  # 平文で受ける（保存は hash）


# class LoginRequest(BaseModel):
#     email: EmailStr
#     password: str


# @router.post("/signup")
# def signup(payload: SignupRequest, db: Session = Depends(get_db)):
#     # 1) email 重複チェック
#     exists = db.execute(
#         text("SELECT 1 FROM clinics WHERE email = :email"),
#         {"email": str(payload.email)},
#     ).fetchone()
#     if exists:
#         raise HTTPException(status_code=409, detail="email already exists")

#     # 2) password hash
#     password_hash = pwd_context.hash(payload.password)

#     # 3) insert
#     try:
#         row = db.execute(
#             text("""
#                 INSERT INTO clinics
#                   (clinic_name, postal_code, address, owner_name, email, password_hash, created_at, updated_at)
#                 VALUES
#                   (:clinic_name, :postal_code, :address, :owner_name, :email, :password_hash, NOW(), NOW())
#                 RETURNING id, clinic_name
#             """),
#             {
#                 "clinic_name": payload.clinic_name,
#                 "postal_code": payload.postal_code,
#                 "address": payload.address,
#                 "owner_name": payload.owner_name,
#                 "email": str(payload.email),
#                 "password_hash": password_hash,
#             },
#         ).fetchone()
#         db.commit()
#     except Exception as e:
#         db.rollback()
#         raise HTTPException(status_code=500, detail=f"signup failed: {str(e)}")

#     return {"ok": True, "clinic_id": row.id, "clinic_name": row.clinic_name}


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

#     if row is None:
#         raise HTTPException(status_code=401, detail="invalid login")

#     if not row.password_hash or not pwd_context.verify(req.password, row.password_hash):
#         raise HTTPException(status_code=401, detail="invalid login")

#     return {"clinic_id": row.id, "clinic_name": row.clinic_name}

# api/routers/auth.py
# from datetime import datetime, timedelta
# from fastapi import APIRouter, HTTPException, Depends
# from pydantic import BaseModel, EmailStr
# from sqlalchemy.orm import Session
# from sqlalchemy import text
# from passlib.context import CryptContext
# import jwt

# from api.db.session import get_db

# router = APIRouter(prefix="/auth", tags=["auth"])

# SECRET_KEY = "CHANGE_ME_SECRET"
# ALGORITHM = "HS256"
# ACCESS_TOKEN_EXPIRE_HOURS = 24

# pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


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

#     if row is None or not pwd_context.verify(req.password, row.password_hash):
#         raise HTTPException(status_code=401, detail="invalid login")

#     payload = {
#         "clinic_id": row.id,
#         "clinic_name": row.clinic_name,
#         "exp": datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS),
#     }

#     token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

#     return {
#         "access_token": token,
#         "token_type": "bearer",
#     }


# # api/routers/auth.py
# import os
# from datetime import datetime, timedelta, timezone

# from fastapi import APIRouter, HTTPException, Depends
# from pydantic import BaseModel, EmailStr
# from sqlalchemy.orm import Session
# from sqlalchemy import text
# from passlib.context import CryptContext
# import jwt

# from api.db.session import get_db

# router = APIRouter(prefix="/auth", tags=["auth"])

# # ✅ 環境変数（秘密鍵はコードに直書きしない）
# SECRET_KEY = os.getenv("ATHLETIQ_JWT_SECRET")
# ALGORITHM = os.getenv("ATHLETIQ_JWT_ALGORITHM", "HS256")
# ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("ATHLETIQ_ACCESS_TOKEN_EXPIRE_HOURS", "24"))

# if not SECRET_KEY:
#     # 起動時に必ず気づけるようにする（本番で CHANGE_ME_SECRET 事故を防ぐ）
#     raise RuntimeError("ATHLETIQ_JWT_SECRET is not set")

# pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


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

#     # ✅ 認証失敗理由を出し分けない（列挙攻撃対策）
#     if row is None:
#         raise HTTPException(status_code=401, detail="invalid login")

#     stored_hash = row.password_hash or ""
#     if not stored_hash or not pwd_context.verify(req.password, stored_hash):
#         raise HTTPException(status_code=401, detail="invalid login")

#     now = datetime.now(timezone.utc)
#     payload = {
#         "sub": "clinic",
#         "clinic_id": int(row.id),
#         "iat": int(now.timestamp()),
#         "exp": int((now + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)).timestamp()),
#     }

#     token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

#     # clinic_name はフロント表示で欲しければ /clinics/me で取る（JWTに入れない）
#     return {
#         "access_token": token,
#         "token_type": "bearer",
#         "clinic_id": int(row.id),
#         "clinic_name": row.clinic_name,
#     }


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