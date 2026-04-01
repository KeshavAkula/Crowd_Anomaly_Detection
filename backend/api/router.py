import os
import asyncio
from fastapi import APIRouter, Depends, UploadFile, File
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
from database import crud, database
from core.video_stream import VideoStreamer
from datetime import datetime


os.makedirs("snapshots", exist_ok=True)
router = APIRouter()

# Shared state
streamer = None
streamer_lock = asyncio.Lock()

def on_anomaly(score: float, frame_ref: str = None):
    # Keep this sync as it's called from a background thread
    db = database.SessionLocal()
    try:
        crud.create_log(db, score=score, camera_id="camera_01", frame_ref=frame_ref)
    finally:
        db.close()

async def restart_streamer_task(new_source):
    global streamer
    async with streamer_lock:
        if streamer is not None:
            print(f"Stopping existing streamer for source: {streamer.source}")
            streamer.stop()
            await asyncio.sleep(0.5)
        
        print(f"Starting new streamer for source: {new_source}")
        streamer = VideoStreamer(source=new_source, on_anomaly_callback=on_anomaly)
        streamer.start()

# Startup logic handled in main.py or via a dedicated initialization call
@router.on_event("startup")
async def startup_event():
    print("API startup: Ready (All cameras manual start).")


async def frame_generator():
    while True:
        global streamer
        if streamer is not None:
            # get_frame is now non-blocking
            frame = streamer.get_frame()
            if frame:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
            
            # Sleep roughly 33ms to match 30 FPS and yield to event loop
            await asyncio.sleep(0.033)
        else:
            await asyncio.sleep(0.5)

@router.get("/video_feed")
async def video_feed():
    return StreamingResponse(frame_generator(), media_type="multipart/x-mixed-replace; boundary=frame")

@router.get("/health")
async def health_check():
    global streamer
    return {
        "status": "healthy",
        "streamer_active": streamer is not None,
        "streamer_source": streamer.source if streamer else None,
        "timestamp": datetime.now().isoformat()
    }

@router.post("/set_source/toggle_pause")
async def toggle_pause_endpoint():
    global streamer
    if streamer is not None:
        is_paused = streamer.toggle_pause()
        return {"status": "success", "is_paused": is_paused}
    return JSONResponse({"status": "error", "message": "No active stream."}, status_code=400)

@router.post("/set_source/upload")
async def set_upload_source(file: UploadFile = File(...)):
    temp_path = "temp_uploaded_video.mp4"
    with open(temp_path, "wb") as buffer:
        import shutil
        shutil.copyfileobj(file.file, buffer)
    
    await restart_streamer_task(temp_path)
    return {"status": "success", "message": "Switched to uploaded video."}

class IPCameraRequest(BaseModel):
    url: str

@router.post("/set_source/ip_camera")
async def set_ip_camera_source(req: IPCameraRequest):
    await restart_streamer_task(req.url)
    return {"status": "success", "message": f"Connected to {req.url}"}

@router.post("/set_source/stop")
async def stop_stream_endpoint():
    global streamer
    async with streamer_lock:
        if streamer is not None:
            print(f"Stopping streamer for source: {streamer.source}")
            streamer.stop()
            streamer = None
            return {"status": "success", "message": "Stream stopped successfully."}
    return {"status": "success", "message": "No active stream to stop."}

    return {"status": "success", "message": "No active stream to stop."}


@router.delete("/logs")
async def clear_all_logs(db: Session = Depends(database.get_db)):
    from database import models
    db.query(models.AnomalyLog).delete()
    db.commit()
    return {"status": "success"}

class LogResponse(BaseModel):
    id: int
    timestamp: datetime
    score: float
    camera_id: str
    frame_ref: Optional[str] = None
    class Config:
        from_attributes = True

@router.get("/logs", response_model=List[LogResponse])
async def read_logs(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return crud.get_logs(db, skip=skip, limit=limit)

