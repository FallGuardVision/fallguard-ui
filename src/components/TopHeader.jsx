import { Bell, User, Server, Cpu, Zap, RefreshCw } from 'lucide-react';

function TopHeader({
  patient,
  onSwitchPatient,
  backendConnected,
  fps = 0,
  latency = 14,
  alertCount = 0,
}) {
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

        <div className="telemetry-chip" title="Backend WebSocket Server Connection">
          <Server size={14} style={{ color: backendConnected ? 'var(--stable)' : 'var(--fall)' }} />
          <span>Backend:</span>
          <strong style={{ color: backendConnected ? 'var(--stable)' : 'var(--fall)' }}>
            {backendConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </strong>
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
    </header>
  );
}

export default TopHeader;
