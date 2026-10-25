import { useState } from 'react';
import { Bell, User, Server, Cpu, Zap, RefreshCw, Settings, X, Globe, Laptop } from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl, DEFAULT_CLOUD_API, DEFAULT_LOCAL_API } from '../config/api';

function TopHeader({
  patient,
  onSwitchPatient,
  backendConnected,
  fps = 0,
  latency = 14,
  alertCount = 0,
}) {
  const [showConfig, setShowConfig] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(getApiBaseUrl());

  const handleSave = (urlToSet) => {
    setApiBaseUrl(urlToSet);
    setCurrentUrl(getApiBaseUrl());
    setShowConfig(false);
  };

  return (
    <header className="top-header">
      <div className="header-left">
        {patient && (
          <div className="patient-badge-trigger">
            <span style={{ color: 'var(--text-muted)' }}>Patient:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{patient.name}</strong>
            <button onClick={onSwitchPatient} title="Change active patient monitoring session">
              <RefreshCw size={11} style={{ display: 'inline', marginRight: 2 }} />
              Switch
            </button>
          </div>
        )}
      </div>

      <div className="header-telemetry">
        <div className="telemetry-chip" title="Edge AI Model Engine Status">
          <Cpu size={14} style={{ color: 'var(--stable)' }} />
          <span>Edge AI:</span>
          <strong style={{ color: 'var(--stable)' }}>ONLINE</strong>
        </div>

        {/* Backend Connection Chip & Config Trigger */}
        <div
          className="telemetry-chip"
          title="Click to configure Backend Server URL"
          onClick={() => {
            setCurrentUrl(getApiBaseUrl());
            setShowConfig(true);
          }}
          style={{ cursor: 'pointer', transition: 'background 0.2s' }}
        >
          <Server size={14} style={{ color: backendConnected ? 'var(--stable)' : 'var(--fall)' }} />
          <span>Backend:</span>
          <strong style={{ color: backendConnected ? 'var(--stable)' : 'var(--fall)' }}>
            {backendConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </strong>
          <Settings size={12} style={{ color: 'var(--text-muted)', marginLeft: 3 }} />
        </div>

        <div className="telemetry-chip" title="Frame Processing Rate">
          <Zap size={14} style={{ color: 'var(--cyan)' }} />
          <span>FPS:</span>
          <strong>{fps}</strong>
        </div>

        <div className="telemetry-chip" title="Model Inference Latency">
          <span>Latency:</span>
          <strong>{latency} ms</strong>
        </div>

        <button className="icon-button" title="System Notifications">
          <Bell size={16} />
          {alertCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--fall)',
              }}
            />
          )}
        </button>

        <div className="user-profile-tag">
          <User size={14} style={{ color: 'var(--accent)' }} />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Dr. S. Vance</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>(Shift Alpha)</span>
        </div>
      </div>

      {/* Backend Server Configuration Modal */}
      {showConfig && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => setShowConfig(false)}
        >
          <div
            style={{
              width: 440,
              background: 'var(--surface-card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 20,
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}>
                <Server size={16} style={{ color: 'var(--accent)' }} />
                <span>Backend Server Endpoint</span>
              </div>
              <button
                onClick={() => setShowConfig(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.4 }}>
              Switch between the live cloud server, local server, or a custom tunnel (ngrok / Cloudflare).
            </p>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                CURRENT TARGET URL
              </label>
              <input
                type="text"
                value={currentUrl}
                onChange={(e) => setCurrentUrl(e.target.value)}
                placeholder="https://fallguard-server.onrender.com"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  fontFamily: 'monospace',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
              <button
                type="button"
                onClick={() => {
                  setCurrentUrl(DEFAULT_CLOUD_API);
                  handleSave(DEFAULT_CLOUD_API);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Globe size={14} style={{ color: 'var(--cyan)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>Render Cloud Server</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{DEFAULT_CLOUD_API}</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentUrl(DEFAULT_LOCAL_API);
                  handleSave(DEFAULT_LOCAL_API);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Laptop size={14} style={{ color: 'var(--accent)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>Localhost (Development)</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{DEFAULT_LOCAL_API}</div>
                </div>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setShowConfig(false)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSave(currentUrl)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 4,
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default TopHeader;
