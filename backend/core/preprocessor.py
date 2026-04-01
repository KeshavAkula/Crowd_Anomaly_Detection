import cv2
import numpy as np

class Preprocessor:
    # Reduced size to 64x64 for much faster training on simple tests
    def __init__(self, target_size=(64, 64), sequence_length=10):
        self.target_size = target_size
        self.sequence_length = sequence_length
        self.buffer = []

    def process_frame(self, frame):
        """Resizes, grayscales, and normalizes a single frame."""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        resized = cv2.resize(gray, self.target_size)
        normalized = resized.astype(np.float32) / 255.0
        return np.expand_dims(normalized, axis=-1)

    def add_to_buffer(self, frame):
        """Adds frame to buffer and returns a sequence if buffer is full."""
        processed = self.process_frame(frame)
        self.buffer.append(processed)
        
        if len(self.buffer) == self.sequence_length:
            sequence = np.stack(self.buffer, axis=0)
            self.buffer.pop(0) 
            return np.expand_dims(sequence, axis=0)
        return None
