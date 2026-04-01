# Crowd Anomaly Detection System (CrowdWatch AI)

A full-stack, real-time video surveillance and machine learning inference dashboard designed to detect crowd abnormalities using Spatiotemporal Convolutional Long Short-Term Memory (ConvLSTM) networks.

## Architecture

This project is built using a modern decoupled architecture:

*   **Machine Learning**: Pre-trained ConvLSTM Autoencoder (`keras/h5`) calculating internal Mean Squared Error (MSE) to flag spatial irregularities in frames.
*   **Backend**: Python FastAPI with OpenCV handling continuous multipart-replace streaming, background SQLite database logging, and thread-safe ML inference.
*   **Frontend**: React + Vite using an advanced functional component state to consume the live MJPEG stream and render telemetry across a 60-point sliding data window.

## Key Features

*   **Multi-Source Streaming**: Directly ingest uploaded `.mp4` files, local webcams (`cv2.VideoCapture(0)`), or external networked RTSP/HTTP IP Security Cameras.
*   **Real-time Analytics**: Sliding window chart visualization mapping inference bounds to active anomaly scores. 
*   **Incident Logging**: Triggers and drops `.jpg` incident snapshots locally when threshold bounds are exceeded, accompanied by SQLite history metadata.
*   **Haptic Alerts**: Frontend implements native browser `navigator.vibrate()` and visual shaking during high-confidence anomalies.

## Prerequisites

1. `Python 3.11+`
2. `Node.js` 18+ (for Vite)
3. You must ensure that your trained model (`convlstm_autoencoder.h5`) resides inside the `backend/` directory. Due to GitHub's file size limits, the 1.3GB model file is `.gitignore`'d and intentionally kept separate from version control.

## Running Locally

### 1. Start the FastAPI Backend
Open a terminal and establish the python environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # (or `venv\Scripts\activate` on Windows)
pip install -r requirements.txt

# Start the uvicorn server on port 8000
uvicorn main:app --reload
```

### 2. Start the React Frontend
Open a second, entirely separate terminal window:
```bash
cd frontend
npm install
npm run dev
```

Visit the Localhost URL provided by Vite in your browser to access the dashboard!
