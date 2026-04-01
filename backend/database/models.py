from sqlalchemy import Column, Integer, Float, DateTime, String
import datetime
from .database import Base

class AnomalyLog(Base):
    __tablename__ = "anomaly_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    score = Column(Float, index=True)
    camera_id = Column(String, default="camera_01")
    frame_ref = Column(String, nullable=True) # Optional path to saved frame image
