import cv2
import threading
import numpy as np
import time
import os
from .preprocessor import Preprocessor
from tensorflow.keras.models import load_model

class VideoStreamer:
    _model_instance = None
    _model_lock = threading.Lock()

    @classmethod
    def get_shared_model(cls, model_path='convlstm_autoencoder.h5'):
        with cls._model_lock:
            if cls._model_instance is None:
                if os.path.exists(model_path):
                    try:
                        print(f"Loading shared ConvLSTM model from {model_path}...")
                        cls._model_instance = load_model(model_path)
                        print("Shared model loaded successfully.")
                    except Exception as e:
                        print(f"WARNING: Error loading shared model: {e}")
                else:
                    print(f"WARNING: {model_path} not found! Running in mock mode.")
            return cls._model_instance

    def __init__(self, source=0, on_anomaly_callback=None):
        """source can be 0 for webcam or a string path to an mp4 file"""
        self.source = source
        self.on_anomaly_callback = on_anomaly_callback
        
        print(f"Initializing VideoStreamer with source: {self.source}")
        self.cap = cv2.VideoCapture(self.source)
        if not self.cap.isOpened():
            print(f"ERROR: Could not open video source: {self.source}")
        else:
            print(f"Successfully opened video source: {self.source}")
            
        self.preprocessor = Preprocessor()
        self.current_frame = None
        self.running = False
        self.paused = False
        self.lock = threading.Lock()
        
        # Snapshot state
        self.last_snapshot_time = 0
        os.makedirs("snapshots", exist_ok=True)
        
        # Load Shared Model
        self.model = self.get_shared_model()
        
    def start(self):
        if not self.cap.isOpened():
            print("Cannot start: VideoSource not opened.")
            return
            
        self.running = True
        threading.Thread(target=self.update, daemon=True).start()
        print("VideoStreamer thread started.")
        
    def update(self):
        while self.running:
            if self.paused:
                time.sleep(0.1)
                continue
                
            ret, frame = self.cap.read()
            if not ret:
                # Loop video
                if isinstance(self.source, str) and os.path.exists(self.source):
                    self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    time.sleep(0.01)
                    continue
                else:
                    print(f"Stream ended or failed for source: {self.source}")
                    self.running = False
                    break
            
            if not self.running:
                break

            sequence = self.preprocessor.add_to_buffer(frame)
            anomaly_score = 0.0
            
            if sequence is not None and self.running:
                if self.model is not None:
                    try:
                        reconstructed = self.model.predict(sequence, verbose=0)
                        mse = np.mean(np.square(sequence - reconstructed))
                        # Multiplier to scale MSE to anomaly score
                        anomaly_score = min(mse * 10000, 1.0) 
                    except Exception as e:
                        print(f"Inference error: {e}")
                        anomaly_score = 0.0
                else:
                    # Mock baseline
                    anomaly_score = 0.01
                
                # FINAL CHECK before logging anything
                if anomaly_score >= 0.1 and self.running:
                    current_time = time.time()
                    if current_time - self.last_snapshot_time > 0.1:
                        snapshot_filename = f"snapshots/incident_{int(current_time*1000)}.jpg"
                        cv2.imwrite(snapshot_filename, frame)
                        frame_ref_path = os.path.basename(snapshot_filename)
                        self.last_snapshot_time = current_time
                        
                        if self.on_anomaly_callback:
                            print(f"[THREAD] Anomaly logged: {anomaly_score:.3f}")
                            self.on_anomaly_callback(float(anomaly_score), frame_ref_path)
                
            color = (0, 255, 0) if anomaly_score < 0.1 else (0, 0, 255)
            text = f"Score: {anomaly_score:.3f}"
            cv2.putText(frame, text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
            if anomaly_score >= 0.1:
                 cv2.rectangle(frame, (5, 5), (frame.shape[1]-5, frame.shape[0]-5), color, 4)
            
            ret, buffer = cv2.imencode('.jpg', frame)
            if ret:
                with self.lock:
                    self.current_frame = buffer.tobytes()
                
            # roughly 30 FPS
            time.sleep(0.033)

    def get_frame(self):
        with self.lock:
            return self.current_frame

    def toggle_pause(self):
        self.paused = not self.paused
        return self.paused

    def stop(self):
        print("Stopping VideoStreamer...")
        self.running = False
        if self.cap.isOpened():
            self.cap.release()
        print("VideoStreamer stopped.")


