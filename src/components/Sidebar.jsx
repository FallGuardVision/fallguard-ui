import { Activity, ShieldAlert } from 'lucide-react';

function Sidebar({ open }) {
  return (
    <aside className={`app-sidebar ${open ? '' : 'collapsed'}`} aria-hidden={!open}>
      <div className="sidebar-brand">
        <div className="brand-icon-box">
          <ShieldAlert size={18} />
        </div>
        <div className="brand-text">
          <h1>FALLGUARD</h1>
          <span>Fall detection</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <button className="nav-item active" type="button">
          <Activity size={16} />
          <span>Monitor</span>
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;
