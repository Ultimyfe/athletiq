# api/models/record.py
from sqlalchemy import Column, Integer, Date, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB

from api.db.session import Base  # ←ここが正解（api.db.base は存在しない）

class DiagnoseRecord(Base):
    __tablename__ = "diagnose_records"

    id = Column(Integer, primary_key=True, index=True)

    clinic_id = Column(Integer, nullable=False, index=True)
    patient_id = Column(Integer, nullable=False, index=True)

    measured_at = Column(Date, nullable=False)  # ← Date の import 必須
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    payload = Column(JSONB, nullable=True)
    result = Column(JSONB, nullable=True)