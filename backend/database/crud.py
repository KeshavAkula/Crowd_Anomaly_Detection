from sqlalchemy.orm import Session
from . import models

def get_logs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.AnomalyLog).order_by(models.AnomalyLog.timestamp.desc()).offset(skip).limit(limit).all()

def create_log(db: Session, score: float, camera_id: str = "camera_01", frame_ref: str = None):
    db_log = models.AnomalyLog(score=score, camera_id=camera_id, frame_ref=frame_ref)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log
