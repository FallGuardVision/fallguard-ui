import { useEffect, useState } from 'react';
import { History, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { apiUrl } from '../config';

const API_URL = apiUrl('/events');

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

  const fetchEvents = async () => {
    try {
      const url = patientId ? `${API_URL}?patient_id=${patientId}` : API_URL;
      const res = await fetch(url);
      const data = await res.json();
      setEvents(data);
      setError(null);
      setLoading(false);
    } catch (e) {
      setError('Could not load events.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, [refreshTrigger, patientId]);

  return (
    <div className="clinical-card">
      <div className="clinical-card-header">
        <div className="section-title">
          <History size={15} style={{ color: 'var(--accent)' }} />
          <span>Events — {patientName || 'Patient'}</span>
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {events.length}
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
          Loading events...
        </p>
      )}

      {!loading && events.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
          <CheckCircle2 size={24} style={{ color: 'var(--stable)', marginBottom: 6 }} />
          <p>No alerts yet.</p>
        </div>
      )}

      {!loading && events.length > 0 && (
        <div style={{ maxHeight: 260, overflowY: 'auto', paddingRight: 4 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '8px 4px', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '8px 4px', fontWeight: 600 }}>Confidence</th>
                <th style={{ padding: '8px 4px', fontWeight: 600 }}>Time</th>
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
