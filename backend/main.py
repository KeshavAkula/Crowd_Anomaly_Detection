from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database.database import engine
from database import models
from api.router import router as api_router

# Auto-create the SQL tables if they don't exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Crowd Anomaly Detection Core",
    description="Backend API for anomaly detection and video streaming",
    version="1.0.0"
)

# Allow React frontend to access the API when running locally
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

# Serve snapshots at root /snapshots
app.mount("/snapshots", StaticFiles(directory="snapshots"), name="snapshots")

@app.get("/")
def read_root():
    return {"message": "API Running. Go to /docs for Swagger UI."}
