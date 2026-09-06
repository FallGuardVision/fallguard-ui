const SEVERITY_TEXT = {
  STABLE: { label: 'LOW RISK', color: 'var(--stable)' },
  HIGH_RISK: { label: 'ELEVATED', color: 'var(--high-risk)' },
  FALL: { label: 'CRITICAL', color: 'var(--fall)' },
  IMMOBILE: { label: 'MONITORING', color: 'var(--immobile)' },
};

function TelemetryBar({
  prediction,
  frameCount = 0,
  fps = 0,
  latency = 14,
  connected = false,
  modelReady = false,
  poseError = null,
}) {
  const currentClass = prediction?.predicted_class ?? 'STABLE';
  const confidence = prediction?.confidence ? `${(prediction.confidence * 100).toFixed(1)}%` : 'N/A';
  const severityInfo = SEVERITY_TEXT[currentClass] ?? SEVERITY_TEXT.STABLE;

  return (
    <div className="telemetry-grid">
      <div className="telemetry-card">
        <div className="label">Current Risk Level</div>
        <div className="value" style={{ color: severityInfo.color }}>
          {severityInfo.label}
        </div>
      </div>

      <div className="telemetry-card">
        <div className="label">Model Confidence</div>
        <div className="value">{confidence}</div>
      </div>

      <div className="telemetry-card">
        <div className="label">Frames Processed</div>
        <div className="value">{frameCount.toLocaleString()}</div>
      </div>

      <div className="telemetry-card">
        <div className="label">Frame Rate (FPS)</div>
        <div className="value" style={{ color: 'var(--cyan)' }}>
          {fps} <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>fps</span>
        </div>
      </div>

      <div className="telemetry-card">
        <div className="label">Inference Latency</div>
        <div className="value">
          {latency} <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>ms</span>
        </div>
      </div>

      <div className="telemetry-card">
        <div className="label">Backend Stream</div>
        <div className="value" style={{ color: connected ? 'var(--stable)' : 'var(--fall)' }}>
          {connected ? 'ACTIVE' : 'OFFLINE'}
        </div>
      </div>

      <div className="telemetry-card">
        <div className="label">Pose Engine</div>
        <div className="value" style={{ color: modelReady ? 'var(--stable)' : 'var(--high-risk)' }}>
          {poseError ? 'ERROR' : modelReady ? 'READY' : 'LOADING'}
        </div>
      </div>
    </div>
  );
}

export default TelemetryBar;
