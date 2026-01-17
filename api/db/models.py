# api/db/models.py
from sqlalchemy import Column, Integer, Date, DateTime, func
from sqlalchemy.types import JSON
from .session import Base

class DiagnoseRecord(Base):
  __tablename__ = "diagnose_records"

  id = Column(Integer, primary_key=True, index=True)

  clinic_id = Column(Integer, nullable=True, index=True)
  patient_id = Column(Integer, nullable=False, index=True)

  measured_at = Column(Date, nullable=False, index=True)

  # 診断結果を丸ごと保存（JSON）
  result_json = Column(JSON, nullable=False)

  created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)