import {
  Activity,
  Box,
  TrendingUp,
  Users,
  AlertTriangle,
  Camera,
  ShieldCheck,
  Cpu,
  Settings,
  ShieldAlert,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'monitoring', label: 'Monitoring Overview', icon: Activity, active: true },
  { id: 'twin', label: 'Digital Twin 3D', icon: Box, active: false },
  { id: 'analytics', label: 'Fall Risk Analytics', icon: TrendingUp, active: false },
  { id: 'patients', label: 'Patient Roster', icon: Users, active: false },
  { id: 'alerts', label: 'Emergency Alerts', icon: AlertTriangle, active: false },
  { id: 'cameras', label: 'Camera Streams', icon: Camera, active: false },
  { id: 'privacy', label: 'Privacy Center', icon: ShieldCheck, active: false },
  { id: 'health', label: 'System Health', icon: Cpu, active: false },
  { id: 'settings', label: 'Settings', icon: Settings, active: false },
];

function Sidebar({ activeTab = 'monitoring', onTabSelect }) {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon-box">
          <ShieldAlert size={18} />
        </div>
        <div className="brand-text">
          <h1>FALLGUARD</h1>
          <span>Clinical AI</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeTab;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onTabSelect && onTabSelect(item.id)}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="system-status-box">
          <span className="live-dot"></span>
          <span>SYSTEM OPERATIONAL</span>
        </div>
        <div className="build-info">v2.4.0-clinical • Edge AI</div>
      </div>
    </aside>
  );
}

export default Sidebar;
