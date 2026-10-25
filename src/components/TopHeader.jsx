import { Menu, Server, Zap, RefreshCw } from 'lucide-react';

function TopHeader({
  patient,
  onSwitchPatient,
  backendConnected,
  fps = 0,
  latency = 14,
  sidebarOpen,
  onToggleSidebar,
}) {
  return (
    <header className="top-header">
      <div className="header-left">
        <button
          className="icon-button"
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Open sidebar'}
          aria-expanded={sidebarOpen}
        >
          <Menu size={18} />
        </button>

        {patient && (
          <div className="patient-badge-trigger">
            <strong>{patient.name}</strong>
            <button type="button" onClick={onSwitchPatient}>
              <RefreshCw size={11} />
              Switch
            </button>
          </div>
        )}
      </div>

      <div className="header-telemetry">
        <div className="telemetry-chip">
          <Server size={14} style={{ color: backendConnected ? 'var(--stable)' : 'var(--fall)' }} />
          <strong style={{ color: backendConnected ? 'var(--stable)' : 'var(--fall)' }}>
            {backendConnected ? 'Online' : 'Offline'}
          </strong>
        </div>

        <div className="telemetry-chip">
          <Zap size={14} style={{ color: 'var(--cyan)' }} />
          <strong>{fps} fps</strong>
        </div>

        <div className="telemetry-chip">
          <strong>{latency} ms</strong>
        </div>
      </div>
    </header>
  );
}

export default TopHeader;
