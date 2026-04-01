import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { ImageIcon, Search } from 'lucide-react';

export default function LogsTable({ apiBaseUrl, onUpdateTelemetry }) {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoverImage, setHoverImage] = useState(null);
  
  const lastIdRef = useRef(null);
  const lastUpdateRef = useRef(0);
  const onUpdateRef = useRef(onUpdateTelemetry);

  useEffect(() => {
    onUpdateRef.current = onUpdateTelemetry;
  }, [onUpdateTelemetry]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/api/logs`);
        const newLogs = response.data;
        const now = Date.now();
        
        if (newLogs.length > 0) {
          const latestLog = newLogs[0];
          
          if (lastIdRef.current !== null) {
            if (latestLog.id > lastIdRef.current) {
              // Activity detected: Send full log for charting
              onUpdateRef.current?.(latestLog);
              lastUpdateRef.current = now;
            } else {
              // No new logs: Check if silence exceeds 250ms (0.25s)
              if (now - lastUpdateRef.current > 250) {
                onUpdateRef.current?.(null); // Clear anomaly state
              }
            }
          }
          lastIdRef.current = latestLog.id;
        } else {
          onUpdateRef.current?.(null);
        }

        setLogs(newLogs);
      } catch (error) { }
    };

    const interval = setInterval(fetchLogs, 150); // High-res poll
    return () => clearInterval(interval);
  }, [apiBaseUrl]);

  const filteredLogs = logs.filter(log => {
      const timeStr = new Date(log.timestamp).toLocaleTimeString().toLowerCase();
      return timeStr.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="table-wrapper fade-in">
      <div className="search-bar">
        <Search size={16} color="var(--text-secondary)" />
        <input 
          type="text" 
          placeholder="Search by time (e.g. 11:42)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Camera ID</th>
            <th>Score</th>
            <th style={{textAlign: 'center'}}>Evidence</th>
          </tr>
        </thead>
        <tbody>
          {filteredLogs.map((log) => {
            const date = new Date(log.timestamp);
            const imageUrl = `${apiBaseUrl}/snapshots/${log.frame_ref}`;
            return (
              <tr key={log.id}>
                <td>{date.toLocaleTimeString()}</td>
                <td>{log.camera_id}</td>
                <td className="score-high">
                  {log.score.toFixed(3)}
                </td>
                <td style={{textAlign: 'center', position: 'relative'}}>
                  {log.frame_ref ? (
                    <div 
                      onMouseEnter={() => setHoverImage(imageUrl)}
                      onMouseLeave={() => setHoverImage(null)}
                      style={{display: 'inline-flex', alignItems: 'center'}}
                    >
                      <a href={imageUrl} target="_blank" rel="noreferrer" className="icon-btn" title="View Evidence Snapshot">
                         <ImageIcon size={18} color="#3b82f6" />
                      </a>
                      
                      {hoverImage === imageUrl && (
                        <div className="hover-preview fade-in">
                           <img src={imageUrl} alt="Evidence Snapshot" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{opacity: 0.3}}>-</span>
                  )}
                </td>
              </tr>
            );
          })}
          {filteredLogs.length === 0 && (
             <tr>
               <td colSpan="4" style={{textAlign: "center", color: "var(--text-secondary)", paddingTop: "2rem"}}>
                 {searchTerm ? "No matching incidents found." : "No anomalies recorded yet."}
               </td>
             </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
