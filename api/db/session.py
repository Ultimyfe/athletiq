# import os
# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker
# from sqlalchemy import text

# DATABASE_URL = os.getenv("DATABASE_URL")
# if not DATABASE_URL:
#     raise RuntimeError("DATABASE_URL is not set")

# INSTANCE_CONNECTION_NAME = os.getenv("INSTANCE_CONNECTION_NAME")
# if not INSTANCE_CONNECTION_NAME:
#     raise RuntimeError("INSTANCE_CONNECTION_NAME is not set")

# socket_dir = f"/cloudsql/{INSTANCE_CONNECTION_NAME}"
# print(f"[DB] using DATABASE_URL={DATABASE_URL}", flush=True)
# print(f"[DB] using socket_dir={socket_dir}", flush=True)

# engine = create_engine(
#     DATABASE_URL,
#     pool_pre_ping=True,
#     connect_args={"host": socket_dir},  # ここが重要
# )

# try:
#     with engine.connect() as conn:
#         conn.execute(text("select 1"))
#     print("[DB] connection test OK", flush=True)
# except Exception as e:
#     print(f"[DB] connection test FAILED: {e!r}", flush=True)
#     raise

# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# api/db/session.py
from __future__ import annotations

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# DATABASE_URL 例:
# postgresql+psycopg2://app_user:NextShinkyuu2026!@127.0.0.1:5432/athletiq
DATABASE_URL = os.getenv("DATABASE_URL")
print("DATABASE_URL =", DATABASE_URL)

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

engine = engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args={
        "host": f"/cloudsql/{os.environ['INSTANCE_CONNECTION_NAME']}"
    },
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()