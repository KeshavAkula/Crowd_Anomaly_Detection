import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ShieldCheck, Activity, CloudUpload, Trash2, Pause, Play, Square, Video } from 'lucide-react';
import axios from 'axios';
import VideoPlayer from './components/VideoPlayer.jsx';
import LogsTable from './components/LogsTable.jsx';
import WelcomeScreen from './components/WelcomeScreen.jsx';
import AnalyticsChart from './components/AnalyticsChart.jsx';
import './App.css';

// For local dev, assuming FastAPI is running on 8000
const API_BASE_URL = 'http://localhost:8000'; 
const STREAM_URL = `${API_BASE_URL}/api/video_feed`;

function App() {
  const [showDashboard, setShowDashboard] = useState(false);
  const [isAlert, setIsAlert] = useState(false); 
  const [activeMode, setActiveMode] = useState('FILE_UPLOAD');
  const [isPaused, setIsPaused] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamUrl, setCurrentStreamUrl] = useState(`${STREAM_URL}?t=${Date.now()}`);
  const [chartData, setChartData] = useState(new Array(60).fill({ score: 0 }));

  const fileInputRef = useRef(null);
  const alertTimerRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${API_BASE_URL}/api/set_source/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setActiveMode('UPLOADED');
      setIsPaused(false);
      setIsStreaming(true);
      setCurrentStreamUrl(`${STREAM_URL}?t=${Date.now()}`);
      setShowDashboard(true);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload the video.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleIPCameraConnection = async () => {
    const url = prompt("Enter IP Camera RTSP/HTTP URL:", "rtsp://");
    if (!url) return;

    try {
      await axios.post(`${API_BASE_URL}/api/set_source/ip_camera`, { url });
      setActiveMode('IP_CAMERA');
      setIsPaused(false);
      setIsStreaming(true);
      setCurrentStreamUrl(`${STREAM_URL}?t=${Date.now()}`);
      setShowDashboard(true);
    } catch (err) {
      console.error("IP Camera connection error:", err);
      alert("Failed to connect to IP Camera stream.");
    }
  };

  const handleStopStream = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/set_source/stop`);
      setIsStreaming(false);
      setIsPaused(false);
      setActiveMode('STOPPED');
    } catch (err) { console.error(err); }
  };

  const handleClearLogs = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/logs`);
    } catch (err) { console.error(err); }
  };

  const handleTogglePause = async () => {
    try {
      const resp = await axios.post(`${API_BASE_URL}/api/set_source/toggle_pause`);
      setIsPaused(resp.data.is_paused);
    } catch (err) { console.error(err); }
  };


  const handleUpdateTelemetry = useCallback((log) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });
    
    // 1. Update Alert State
    setIsAlert(!!log);

    // 2. Update Chart Data (Sliding Window)
    setChartData(prev => {
      const newData = [...prev, { name: timeStr, score: log ? log.score : 0 }];
      if (newData.length > 60) newData.shift();
      return newData;
    });

    // 3. Vibration Loop
    if (log) {
      if (!alertTimerRef.current) {
        const triggerAlert = () => {
           if ("vibrate" in navigator) navigator.vibrate(200);
        };
        triggerAlert();
        alertTimerRef.current = setInterval(triggerAlert, 800);
      }
    } else {
      if (alertTimerRef.current) {
        clearInterval(alertTimerRef.current);
        alertTimerRef.current = null;
      }
    }
  }, []);

  if (!showDashboard) {
    return <WelcomeScreen onStart={() => setShowDashboard(true)} />;
  }

  return (
    <div className="dashboard-container">
      <header className="navbar fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <h1 style={{ cursor: 'pointer' }} onClick={() => setShowDashboard(false)} title="Go to Intro">
            <ShieldCheck color="#3b82f6" size={28} />
            CrowdWatch AI
          </h1>
          <div className="controls-group">
            <button 
              className={`control-btn ${activeMode === 'IP_CAMERA' ? 'active' : ''}`}
              onClick={handleIPCameraConnection}
            >
              <Video size={16} /> IP Camera
            </button>
            <button 
              className={`control-btn ${activeMode === 'UPLOADED' || activeMode === 'FILE_UPLOAD' ? 'active' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <CloudUpload size={16} /> Upload Video
            </button>
            <button 
              className={`control-btn ${isPaused ? 'active' : ''}`}
              onClick={handleTogglePause}
              disabled={!isStreaming}
              style={{ 
                color: isPaused ? 'var(--alert-color)' : 'var(--text-secondary)',
                opacity: isStreaming ? 1 : 0.5 
              }}
            >
              {isPaused ? <Play size={16} /> : <Pause size={16} />} 
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button 
              className="control-btn"
              onClick={handleStopStream}
              disabled={!isStreaming}
              style={{ color: 'var(--alert-color)', opacity: isStreaming ? 1 : 0.5 }}
            >
              <Square size={16} /> Stop
            </button>


            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="video/mp4,video/x-m4v,video/*,video/avi"
              onChange={handleFileUpload}
            />
          </div>
        </div>
        <div className={`status-badge ${isAlert ? 'alert shake' : ''}`}>
          <div className="status-dot"></div>
          {isAlert ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Anomaly Detected <span className="vibrate-tag">VIBRATING</span>
            </span>
          ) : 'System Secure'}
        </div>
      </header>

      <main className="grid-layout">
        {/* Left Column: Video */}
        <section className="glass-panel fade-in">
          <div className="panel-header">
            <Activity size={18} color="#8b949e" />
            <h2>Video Analysis <span style={{opacity: 0.5, fontSize: "0.8em"}}>({activeMode})</span></h2>
          </div>
          <section className="video-section">
            <VideoPlayer 
              streamUrl={currentStreamUrl} 
              isStreaming={isStreaming} 
            />
          </section>
        </section>

        {/* Right Column: Logs */}
        <section className="glass-panel fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="panel-header" style={{ justifyContent: 'space-between' }}>
            <h2>Incident Logs</h2>
            <button onClick={handleClearLogs} className="icon-btn" title="Clear All Logs">
              <Trash2 size={16} color="var(--text-secondary)" />
            </button>
          </div>
          <div className="panel-content p-0">
             <LogsTable apiBaseUrl={API_BASE_URL} onUpdateTelemetry={handleUpdateTelemetry} />
          </div>
        </section>
      </main>

      {/* Analytics Row */}
      <section className="glass-panel fade-in analytics-section" style={{ marginTop: '1.5rem', animationDelay: "0.2s" }}>
        <div className="panel-header">
          <Activity size={18} color="#3b82f6" />
          <h2>Real-Time Anomaly Analytics <span style={{opacity: 0.5, fontSize: "0.8em"}}>(60-point sliding window)</span></h2>
        </div>
        <div className="panel-content">
          <AnalyticsChart data={chartData} />
        </div>
      </section>
    </div>
  );
}

export default App;
