import { useEffect, useState, useCallback } from 'react';
import { UserPlus, UserCheck, ShieldAlert, Search, RefreshCw, Settings } from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl, DEFAULT_CLOUD_API, DEFAULT_LOCAL_API } from '../config/api';

/**
 * Patient intake portal shown before starting or switching monitoring sessions.
 * Interacts with backend API endpoints GET /patients and POST /patients.
 */
function PatientSelector({ onSelect }) {
  const [patients, setPatients] = useState([]);
  const [newName, setNewName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [customUrl, setCustomUrl] = useState(getApiBaseUrl());

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);
    const apiBase = getApiBaseUrl();
    const apiUrl = `${apiBase}/patients`;
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPatients(data);
      setError(null);
    } catch (err) {
      setError(`Could not reach backend API server at ${apiBase}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    const handleApiChange = () => {
      setCustomUrl(getApiBaseUrl());
      fetchPatients();
    };
    window.addEventListener('fallguard_api_changed', handleApiChange);
    return () => window.removeEventListener('fallguard_api_changed', handleApiChange);
  }, [fetchPatients]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const apiBase = getApiBaseUrl();
    const apiUrl = `${apiBase}/patients`;
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      onSelect(data.id, data.name);
    } catch (e) {
      setError(`Could not register new patient with ${apiBase}.`);
    }
  };

  const handleSaveUrl = (urlToSet) => {
    setApiBaseUrl(urlToSet);
    setShowConfig(false);
  };

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      style={{
        maxWidth: 580,
        margin: '60px auto',
        padding: '24px',
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 6,
              background: 'var(--accent-glow)',
              border: '1px solid var(--border-active)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
            }}
          >
            <ShieldAlert size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Patient Session Intake
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Select an active patient record to launch real-time AI optical monitoring.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowConfig(!showConfig)}
          title="Configure backend server URL"
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            borderRadius: 4,
            padding: '6px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11,
          }}
        >
          <Settings size={13} />
          Server
        </button>
      </div>

      {/* Backend Server Configuration Panel */}
      {showConfig && (
        <div
          style={{
            marginBottom: 20,
            padding: 14,
            background: 'rgba(0, 240, 255, 0.04)',
            border: '1px solid var(--cyan)',
            borderRadius: 6,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cyan)', marginBottom: 6 }}>
            Backend API Endpoint:
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://your-backend.onrender.com"
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: 4,
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text-primary)',
                fontSize: 12,
              }}
            />
            <button
              onClick={() => handleSaveUrl(customUrl)}
              style={{
                padding: '6px 12px',
                borderRadius: 4,
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Apply
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => {
                setCustomUrl(DEFAULT_CLOUD_API);
                handleSaveUrl(DEFAULT_CLOUD_API);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border)',
                borderRadius: 3,
                padding: '4px 8px',
                color: 'var(--text-secondary)',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              Use Render Cloud
            </button>
            <button
              onClick={() => {
                setCustomUrl(DEFAULT_LOCAL_API);
                handleSaveUrl(DEFAULT_LOCAL_API);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border)',
                borderRadius: 3,
                padding: '4px 8px',
                color: 'var(--text-secondary)',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              Use Localhost:8000
            </button>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 4,
            background: 'var(--fall-bg)',
            border: '1px solid var(--fall-border)',
            color: 'var(--fall)',
            fontSize: 12,
            marginBottom: 16,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Connection Error</div>
          <div>{error}</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={fetchPatients}
              style={{
                background: 'rgba(255, 59, 48, 0.15)',
                border: '1px solid var(--fall-border)',
                color: 'var(--fall)',
                padding: '4px 10px',
                borderRadius: 4,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
              }}
            >
              <RefreshCw size={11} />
              Retry Connection
            </button>
            <button
              onClick={() => setShowConfig(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              Change Backend URL
            </button>
          </div>
        </div>
      )}

      {/* New Patient Registration Block */}
      <div
        style={{
          marginBottom: 20,
          padding: 14,
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border)',
          borderRadius: 6,
        }}
      >
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>
          Register New Patient
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Enter full patient name (e.g., Margaret Vance)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 4,
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text-primary)',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            onClick={handleCreate}
            style={{
              padding: '8px 16px',
              borderRadius: 4,
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <UserPlus size={15} />
            Add & Start
          </button>
        </div>
      </div>

      {/* Existing Patients List */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Existing Patient Roster ({patients.length})
          </label>
          <div style={{ position: 'relative', width: 180 }}>
            <Search size={12} style={{ position: 'absolute', left: 8, top: 9, color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search roster..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '4px 8px 4px 26px',
                borderRadius: 4,
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text-primary)',
                fontSize: 11,
              }}
            />
          </div>
        </div>

        {loading && (
          <p style={{ color: 'var(--text-muted)', fontSize: 12, padding: '12px 0' }}>Loading patient roster...</p>
        )}

        {!loading && filteredPatients.length === 0 && !error && (
          <p style={{ color: 'var(--text-muted)', fontSize: 12, padding: '12px 0' }}>No matching patient records found.</p>
        )}

        <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filteredPatients.map((p) => (
            <div
              key={p.id}
              onClick={() => onSelect(p.id, p.name)}
              style={{
                padding: '10px 14px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-active)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 4,
                    background: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--cyan)',
                  }}
                >
                  {p.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>PAT-2026-00{p.id}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--accent)' }}>
                <UserCheck size={16} />
                <span>Select</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PatientSelector;
