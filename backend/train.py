import os
import glob
import cv2
import numpy as np
from core.preprocessor import Preprocessor
from core.model import build_convlstm_autoencoder

def load_video_frames(video_path, preprocessor, max_frames=200):
    cap = cv2.VideoCapture(video_path)
    seqs = []
    count = 0
    while count < max_frames:
        ret, frame = cap.read()
        if not ret: break
        seq = preprocessor.add_to_buffer(frame)
        if seq is not None:
            seqs.append(seq[0])
        count += 1
    cap.release()
    return seqs

def load_image_sequence(folder_path, preprocessor, max_frames=200):
    """Loads a sorted sequence of images (.tif, .jpg, .png) from a folder."""
    extensions = ['*.tif', '*.png', '*.jpg', '*.jpeg']
    image_files = []
    for ext in extensions:
        image_files.extend(glob.glob(os.path.join(folder_path, ext)))
        
    if not image_files:
        return []

    # Sort files strictly by name so 001.tif exactly precedes 002.tif
    image_files.sort()
    
    seqs = []
    count = 0
    
    # We must reset the buffer for each new video folder
    preprocessor.buffer = [] 
    
    for img_path in image_files:
        if count >= max_frames: break
        frame = cv2.imread(img_path)
        if frame is None: continue
        
        seq = preprocessor.add_to_buffer(frame)
        if seq is not None:
            seqs.append(seq[0])
        count += 1
        
    return seqs

def load_dataset(path, seq_len=10, max_frames_per_video=300):
    print(f"Loading frames from {path}...")
    preprocessor = Preprocessor(sequence_length=seq_len)
    training_sequences = []
    
    if os.path.isfile(path):
        training_sequences.extend(load_video_frames(path, preprocessor, max_frames_per_video))
    elif os.path.isdir(path):
        # 1. Grab all single video files directly in the root
        videos = glob.glob(os.path.join(path, '*.avi')) + glob.glob(os.path.join(path, '*.mp4'))
        for vid in videos:
            print(f"Processing dataset video: {vid}...")
            # buffer must be reset between distinct videos
            preprocessor.buffer = []
            training_sequences.extend(load_video_frames(vid, preprocessor, max_frames_per_video))
            
        # 2. Check for UCSD-style subdirectories full of individual .tif image frames
        subdirs = [os.path.join(path, d) for d in os.listdir(path) if os.path.isdir(os.path.join(path, d))]
        subdirs.sort() 
        for subdir in subdirs:
            print(f"Processing image sequence folder: {subdir}...")
            seqs = load_image_sequence(subdir, preprocessor, max_frames_per_video)
            training_sequences.extend(seqs)
            
    print(f"Extracted {len(training_sequences)} total sequences.")
    return np.array(training_sequences)

if __name__ == "__main__":
    # Ensure this matches exactly where you put the Training folder!
    PATH_TO_TRAIN = "./UCSDped1/Train/" 
    
    if not os.path.exists(PATH_TO_TRAIN):
        print(f"Error: {PATH_TO_TRAIN} not found. Did you move the folder into the backend directory?")
        exit(1)
        
    X_train = load_dataset(PATH_TO_TRAIN, max_frames_per_video=300)
    
    if len(X_train) == 0:
        print("Not enough frames to train. Make sure path contains .avi, .mp4 files, or folders of .tif images.")
        exit(1)
        
    model = build_convlstm_autoencoder()
    model.summary()
    
    print("Training model on UCSD dataset...")
    # Consider adjusting batch_size depending on your Mac's CPU/RAM capabilities
    model.fit(X_train, X_train, batch_size=2, epochs=5, validation_split=0.1)
    
    model.save('convlstm_autoencoder.h5')
    print("Model saved to convlstm_autoencoder.h5 successfully.")
