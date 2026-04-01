import React, { useState, useEffect } from 'react';
import { UploadCloud, AlertCircle } from 'lucide-react';

export default function VideoPlayer({ streamUrl, isStreaming }) {
  const [hasError, setHasError] = useState(false);

  // Reset error when the stream source or URL changes
  useEffect(() => {
    setHasError(false);
  }, [streamUrl, isStreaming]);

  return (
    <div className="video-wrapper fade-in">
      {!isStreaming || hasError ? (
        <div className="placeholder-view">
          {hasError ? (
            <AlertCircle size={48} className="placeholder-icon text-error" />
          ) : (
            <UploadCloud size={48} className="placeholder-icon" />
          )}
          <p>{hasError ? "Stream Connection Failed" : "No Video Feed Active"}</p>
          <p className="text-sm" style={{opacity: 0.5}}>
            {hasError ? "Check if backend is running correctly" : "Upload a video file to begin analysis"}
          </p>
          {hasError && (
             <button 
               onClick={() => setHasError(false)} 
               className="control-btn" 
               style={{marginTop: '1rem', background: 'rgba(255,255,255,0.1)'}}
             >
               Retry Feed
             </button>
          )}
        </div>
      ) : (
        <img 
          key={streamUrl}
          src={streamUrl} 
          alt="Live Video Stream" 
          className="video-stream"
          onError={() => {
            console.error("Video stream error event triggered on URL:", streamUrl);
            setHasError(true);
          }}
        />
      )}
    </div>
  );
}
