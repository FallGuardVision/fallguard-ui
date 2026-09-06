import { Activity, ShieldAlert, HeartPulse } from 'lucide-react';

const CLASS_TO_BADGE_STYLE = {
  STABLE: 'stable',
  HIGH_RISK: 'high-risk',
  FALL: 'fall',
  IMMOBILE: 'immobile',
};

const SEVERITY_BAR = {
  STABLE: { width: '25%', color: 'var(--stable)' },
  HIGH_RISK: { width: '75%', color: 'var(--high-risk)' },
  FALL: { width: '100%', color: 'var(--fall)' },
  IMMOBILE: { width: '50%', color: 'var(--immobile)' },
};

function PatientHeader({ patient, prediction }) {
  const currentClass = prediction?.predicted_class ?? 'STABLE';
  const confidence = prediction?.confidence ? (prediction.confidence * 100).toFixed(0) : '0';
  const badgeStyle = CLASS_TO_BADGE_STYLE[currentClass] ?? 'stable';
  const severity = SEVERITY_BAR[currentClass] ?? SEVERITY_BAR.STABLE;

  const initials = patient?.name
    ? patient.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'PT';

  return (
    <div className="patient-header-panel">
      <div className="patient-info-group">
        <div className="patient-avatar-box">{initials}</div>
        <div className="patient-name-id">
          <h2>
            {patient?.name || 'Unassigned Patient'}
            <span
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border)',
                fontWeight: 500,
                color: 'var(--text-secondary)',
              }}
            >
              ID: PAT-2026-00{patient?.id || '0'}
            </span>
          </h2>
          <div className="patient-meta-text">
            <span>
              <Activity size={12} style={{ display: 'inline', marginRight: 4, color: 'var(--accent)' }} />
              Status: <strong style={{ color: 'var(--text-primary)' }}>ACTIVE POSE MONITORING</strong>
            </span>
            <span>•</span>
            <span>Room 402 / Bed A</span>
            <span>•</span>
            <span>
              <HeartPulse size={12} style={{ display: 'inline', marginRight: 4, color: 'var(--cyan)' }} />
              HR: 72 bpm
            </span>
          </div>
        </div>
      </div>

      <div className="patient-status-group">
        <div style={{ width: 140 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 10,
              color: 'var(--text-muted)',
              marginBottom: 4,
              fontWeight: 600,
              textTransform: uppercase(currentClass),
            }}
          >
            <span>RISK SEVERITY</span>
            <span style={{ color: severity.color }}>{currentClass}</span>
          </div>
          <div
            style={{
              height: 6,
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: severity.width,
                background: severity.color,
                transition: 'width 0.3s ease, background 0.3s ease',
              }}
            />
          </div>
        </div>

        <div className="prediction-block">
          <div className="prediction-label">AI Prediction State</div>
          <span className={`status-badge ${badgeStyle}`}>
            <ShieldAlert size={12} />
            {currentClass} ({confidence}%)
          </span>
        </div>
      </div>
    </div>
  );
}

function uppercase(str) {
  return str ? str.toUpperCase() : '';
}

export default PatientHeader;
