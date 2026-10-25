import { useEffect, useState, useCallback } from 'react';
import { History, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { getApiBaseUrl } from '../config/api';

const CLASS_BADGE_STYLE = {
  HIGH_RISK: 'high-risk',
  FALL: 'fall',
  IMMOBILE: 'immobile',
  STABLE: 'stable',
};

function formatTime(isoString) {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/**
 * Polls the backend's /events endpoint for a running log of past
 * FALL/HIGH_RISK/IMMOBILE alerts for the current patient.
 */
function EventHistory({ refreshTrigger, patientId, patientName }) {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const apiBase = getApiBaseUrl();
      const apiUrl = `${apiBase}/events`;
      const url = patientId ? `${apiUrl}?patient_id=${patientId}` : apiUrl;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEvents(data);
      setError(null);
      setLoading(false);
    } catch (e) {
      setError(`Could not reach backend events at ${getApiBaseUrl()}`);
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, refreshTrigger]);

  useEffect(() => {
    const handleApiChange = () => fetchEvents();
    window.addEventListener('fallguard_api_changed', handleApiChange);
    return () => window.removeEventListener('fallguard_api_changed', handleApiChange);
  }, [fetchEvents]);

  useEffect(() => {
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  return (
    <div className="clinical-card">
      <div className="clinical-card-header">
        <div className="section-title">
          <History size={15} style={{ color: 'var(--accent)' }} />
          <span>Clinical Event History Timeline — {patientName || 'Active Patient'}</span>
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {events.length} LOGGED EVENTS
        </div>
      </div>

      {error && (
        <div style={{ color: 'var(--fall)', fontSize: 12, padding: '8px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {loading && (
        <p style={{ color: 'var(--text-muted)', fontSize: 12, padding: '12px 0' }}>
          Loading telemetry event records...
        </p>
      )}

      {!loading && events.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
          <CheckCircle2 size={24} style={{ color: 'var(--stable)', marginBottom: 6 }} />
          <p>No critical fall or high-risk events logged for this patient session.</p>
        </div>
      )}

      {!loading && events.length > 0 && (
        <div style={{ maxHeight: 260, overflowY: 'auto', paddingRight: 4 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '8px 4px', fontWeight: 600 }}>EVENT TYPE</th>
                <th style={{ padding: '8px 4px', fontWeight: 600 }}>CONFIDENCE</th>
                <th style={{ padding: '8px 4px', fontWeight: 600 }}>TIMESTAMP</th>
                <th style={{ padding: '8px 4px', fontWeight: 600, textAlign: 'right' }}>SEVERITY</th>
              </tr>
            </thead>
            <tbody>
              {events.map((evt) => {
                const badgeClass = CLASS_BADGE_STYLE[evt.predicted_class] ?? 'stable';
                return (
                  <tr key={evt.id} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                    <td style={{ padding: '10px 4px' }}>
                      <span className={`status-badge ${badgeClass}`}>
                        {evt.predicted_class}
                      </span>
                    </td>
                    <td style={{ padding: '10px 4px', fontFamily: 'JetBrains Mono, monospace' }}>
                      {(evt.confidence * 100).toFixed(1)}%
                    </td>
                    <td style={{ padding: '10px 4px', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} />
                        {formatTime(evt.timestamp)}{' '}
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{formatDate(evt.timestamp)}</span>
                      </span>
                    </td>
                    <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 600 }}>
                      <span
                        style={{
                          fontSize: 10,
                          padding: '2px 6px',
                          borderRadius: 3,
                          background: evt.predicted_class === 'FALL' ? 'var(--fall-bg)' : 'var(--high-risk-bg)',
                          color: evt.predicted_class === 'FALL' ? 'var(--fall)' : 'var(--high-risk)',
                          border: '1px solid ' + (evt.predicted_class === 'FALL' ? 'var(--fall-border)' : 'var(--high-risk-border)'),
                        }}
                      >
                        {evt.predicted_class === 'FALL' ? 'HIGH PRIORITY' : 'WARNING'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default EventHistory;
