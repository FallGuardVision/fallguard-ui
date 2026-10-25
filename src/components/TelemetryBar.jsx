const SEVERITY_TEXT = {
  STABLE: { label: 'Stable', color: 'var(--stable)' },
  HIGH_RISK: { label: 'High risk', color: 'var(--high-risk)' },
  FALL: { label: 'Fall', color: 'var(--fall)' },
  IMMOBILE: { label: 'Immobile', color: 'var(--immobile)' },
};

function TelemetryBar({
  prediction,
  frameCount = 0,
  connected = false,
  modelReady = false,
  poseError = null,
}) {
  const currentClass = prediction?.predicted_class ?? 'STABLE';
  const confidence = prediction?.confidence ? `${(prediction.confidence * 100).toFixed(1)}%` : '—';
  const severityInfo = SEVERITY_TEXT[currentClass] ?? SEVERITY_TEXT.STABLE;

  return (
    <div className="telemetry-grid">
      <div className="telemetry-card">
        <div className="label">Risk</div>
        <div className="value" style={{ color: severityInfo.color }}>
          {severityInfo.label}
        </div>
      </div>

      <div className="telemetry-card">
        <div className="label">Confidence</div>
        <div className="value">{confidence}</div>
      </div>

      <div className="telemetry-card">
        <div className="label">Frames</div>
        <div className="value">{frameCount.toLocaleString()}</div>
      </div>

      <div className="telemetry-card">
        <div className="label">Server</div>
        <div className="value" style={{ color: connected ? 'var(--stable)' : 'var(--fall)' }}>
          {connected ? 'Live' : 'Offline'}
        </div>
      </div>

      <div className="telemetry-card">
        <div className="label">Pose</div>
        <div className="value" style={{ color: modelReady ? 'var(--stable)' : 'var(--high-risk)' }}>
          {poseError ? 'Error' : modelReady ? 'Ready' : 'Loading'}
        </div>
      </div>
    </div>
  );
}

export default TelemetryBar;
