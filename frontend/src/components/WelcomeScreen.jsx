import { useState, useEffect } from 'react';
import { ShieldCheck, Activity, Zap, Search, Image as ImageIcon, ArrowRight, Brain, Eye, Lock, ChevronRight } from 'lucide-react';

/* ── Animated counter hook ────────────────────────────────────────── */
function useCounter(target, duration = 1800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

/* ── Stat card with live counter ─────────────────────────────────── */
function StatCard({ value, suffix, label, color }) {
  const count = useCounter(value);
  return (
    <div className="ws-stat-card">
      <span className="ws-stat-number" style={{ color }}>
        {count}{suffix}
      </span>
      <span className="ws-stat-label">{label}</span>
    </div>
  );
}

/* ── Step in "How it works" strip ────────────────────────────────── */
function Step({ n, title, desc }) {
  return (
    <div className="ws-step">
      <div className="ws-step-num">{n}</div>
      <div>
        <div className="ws-step-title">{title}</div>
        <div className="ws-step-desc">{desc}</div>
      </div>
    </div>
  );
}

export default function WelcomeScreen({ onStart }) {
  const [hovered, setHovered] = useState(null);

  const features = [
    {
      icon: <Brain size={22} />,
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.12)',
      title: 'ConvLSTM Autoencoder',
      desc: 'Deep spatiotemporal model trained on the UCSD pedestrian dataset to learn normal crowd dynamics and surface deviations.',
    },
    {
      icon: <Zap size={22} />,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
      title: 'Sub-200ms Alerts',
      desc: 'Frame-level polling heartbeat delivers anomaly scores in real-time with multi-sensory feedback via device vibration.',
    },
    {
      icon: <Search size={22} />,
      color: '#10b981',
      bg: 'rgba(16,185,129,0.12)',
      title: 'Intelligent Indexing',
      desc: 'Every event is timestamped and scored. Powerful log search lets analysts find incidents in seconds.',
    },
    {
      icon: <ImageIcon size={22} />,
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.12)',
      title: 'Evidence Snapshots',
      desc: 'Automatic high-resolution frame capture at the moment of detection — stored for forensic review.',
    },
    {
      icon: <Eye size={22} />,
      color: '#f43f5e',
      bg: 'rgba(244,63,94,0.12)',
      title: 'Live Video Feed',
      desc: 'Continuous MJPEG stream from uploaded videos with real-time score overlays rendered directly on the frame.',
    },
    {
      icon: <Lock size={22} />,
      color: '#06b6d4',
      bg: 'rgba(6,182,212,0.12)',
      title: 'Secure & Local',
      desc: 'Fully on-premise deployment. No cloud dependency — your footage never leaves your network.',
    },
  ];

  return (
    <div className="ws-root fade-in">
      {/* ── Animated grid background ── */}
      <div className="ws-grid-bg" aria-hidden="true" />

      {/* ── Ambient glows ── */}
      <div className="ws-glow ws-glow-blue"  aria-hidden="true" />
      <div className="ws-glow ws-glow-purple" aria-hidden="true" />

      <div className="ws-content">

        {/* ────── HERO ────── */}
        <section className="ws-hero">
          <div className="ws-badge">
            <span className="ws-badge-dot" />
            AI Surveillance Platform · v1.0
          </div>

          <h1 className="ws-title">
            Detect Crowd Anomalies
            <br />
            <span className="ws-gradient-text">Before They Escalate</span>
          </h1>

          <p className="ws-subtitle">
            CrowdWatch AI uses a ConvLSTM autoencoder trained on real pedestrian data
            to silently monitor your feeds and alert you the instant something is wrong.
          </p>

          <div className="ws-cta-row">
            <button className="ws-btn-primary" onClick={onStart} id="launch-dashboard-btn">
              Launch Dashboard <ArrowRight size={17} />
            </button>
            <a
              className="ws-btn-ghost"
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
            >
              View Source
            </a>
          </div>
        </section>

        {/* ────── STATS STRIP ────── */}
        <div className="ws-stats-strip">
          <StatCard value={98}  suffix="%" label="Detection Accuracy" color="#3b82f6" />
          <div className="ws-stats-divider" />
          <StatCard value={30}  suffix=" FPS" label="Analysis Rate"    color="#10b981" />
          <div className="ws-stats-divider" />
          <StatCard value={200} suffix="ms"  label="Alert Latency"     color="#f59e0b" />
          <div className="ws-stats-divider" />
          <StatCard value={16} suffix=" frames" label="Sequence Window" color="#8b5cf6" />
        </div>

        {/* ────── FEATURE GRID ────── */}
        <section className="ws-features">
          <h2 className="ws-section-heading">Capabilities</h2>
          <div className="ws-feature-grid">
            {features.map((f, i) => (
              <div
                key={i}
                className={`ws-feature-card ${hovered === i ? 'ws-feature-card--hovered' : ''}`}
                style={{ animationDelay: `${i * 0.07}s`, '--accent': f.color }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="ws-feature-icon" style={{ background: f.bg, color: f.color }}>
                  {f.icon}
                </div>
                <div>
                  <h3 className="ws-feature-title">{f.title}</h3>
                  <p className="ws-feature-desc">{f.desc}</p>
                </div>
                <ChevronRight size={15} className="ws-feature-arrow" />
              </div>
            ))}
          </div>
        </section>

        {/* ────── HOW IT WORKS ────── */}
        <section className="ws-how">
          <h2 className="ws-section-heading">How It Works</h2>
          <div className="ws-steps">
            <Step n="01" title="Upload Video"       desc="Drop any MP4 footage into the dashboard." />
            <div className="ws-steps-connector" />
            <Step n="02" title="AI Inference"       desc="ConvLSTM analyses each 16-frame sequence for abnormal motion." />
            <div className="ws-steps-connector" />
            <Step n="03" title="Score & Alert"      desc="Scores above threshold trigger real-time alerts + snapshots." />
            <div className="ws-steps-connector" />
            <Step n="04" title="Review Logs"        desc="Search and replay every captured incident with full metadata." />
          </div>
        </section>

        {/* ────── FOOTER ────── */}
        <footer className="ws-footer">
          <ShieldCheck size={14} color="#3b82f6" />
          <span>© 2026 CrowdWatch AI — Built with React + FastAPI + TensorFlow</span>
        </footer>
      </div>
    </div>
  );
}
