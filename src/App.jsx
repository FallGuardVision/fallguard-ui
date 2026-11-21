import { useState, useCallback, useRef, useEffect } from 'react';
import './index.css';
import './App.css';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import PatientHeader from './components/PatientHeader';
import TelemetryBar from './components/TelemetryBar';
import VideoSource from './components/VideoSource';
import DigitalTwin from './components/DigitalTwin';
import AlertBanner from './components/AlertBanner';
import EventHistory from './components/EventHistory';
import PatientSelector from './components/PatientSelector';
import usePoseExtraction from './hooks/usePoseExtraction';
import usePredictionSocket from './hooks/usePredictionSocket';
import { createLatch, stepLatch, acknowledgeLatch, isUpright, RECOVERY_HOLD_MS } from './utils/alertLatch';

const ALERT_CLASSES = ['HIGH_RISK', 'FALL', 'IMMOBILE'];

function App() {
  const [activeTab, setActiveTab] = useState('monitoring');
  const [patient, setPatient] = useState(null); // { id, name }
  const [videoElement, setVideoElement] = useState(null);
  const [frameCount, setFrameCount] = useState(0);
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(14);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  const latestLandmarksRef = useRef(null);
  const lastClassRef = useRef(null);
  const frameTimesRef = useRef([]);
  const lastFrameSendTimeRef = useRef(null);
  const frameCountRef = useRef(0);
  const uprightRef = useRef(null); // true / false / null (nobody in view)
  const latchRef = useRef(createLatch());
  const currentClassRef = useRef('STABLE');
  const [fallAlert, setFallAlert] = useState({ active: false, since: null });
  const [recovery, setRecovery] = useState('');

  const { connected, prediction, error: wsError, sendFrame } = usePredictionSocket(patient?.id);

  // Measure latency on prediction message receipt from WebSocket
  useEffect(() => {
    if (prediction && lastFrameSendTimeRef.current) {
      const now = performance.now();
      const measured = Math.round(now - lastFrameSendTimeRef.current);
      if (measured > 0 && measured < 500) {
        setLatency(measured);
      }
    }
  }, [prediction]);

  // Throttle FPS and Frame Count React state updates to 1000ms intervals
  // to avoid triggering 30 full React tree re-renders per second
  useEffect(() => {
    const interval = setInterval(() => {
      setFrameCount(frameCountRef.current);
      setFps(frameTimesRef.current.length);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVideoReady = useCallback((el) => {
    setVideoElement(el);
  }, []);

  const handleLandmarks = useCallback(
    (frame132, rawLandmarks, poseDetected) => {
      const now = performance.now();

      if (poseDetected && frame132 && rawLandmarks) {
        frameCountRef.current++;

        // Measure FPS rolling window in ref
        frameTimesRef.current.push(now);
        while (frameTimesRef.current.length > 0 && frameTimesRef.current[0] <= now - 1000) {
          frameTimesRef.current.shift();
        }

        uprightRef.current = isUpright(frame132);

        // Record send timestamp & transmit frame over WS silently
        lastFrameSendTimeRef.current = now;
        sendFrame(frame132);

        // Store latest raw landmarks in ref for Digital Twin 60 FPS loop
        latestLandmarksRef.current = rawLandmarks;
      } else {
        // Person absent: clear ref immediately so no stale pose persists
        uprightRef.current = null;
        latestLandmarksRef.current = null;
      }
    },
    [sendFrame]
  );

  const { modelReady, error: poseError } = usePoseExtraction(videoElement, handleLandmarks);

  const currentClass = prediction?.predicted_class ?? 'STABLE';
  currentClassRef.current = currentClass;

  // Latch FALL/IMMOBILE alerts until the patient is upright again (or staff acknowledge)
  useEffect(() => {
    const id = setInterval(() => {
      const next = stepLatch(latchRef.current, {
        cls: currentClassRef.current,
        upright: uprightRef.current,
        now: performance.now(),
      });
      const prev = latchRef.current;
      latchRef.current = next;
      if (next.active !== prev.active) {
        setFallAlert({ active: next.active, since: next.since });
      }
      if (next.active) {
        const u = uprightRef.current;
        const status = u === true ? 'upright' : u === false ? 'not upright' : 'person not in view';
        const held = next.uprightSince ? Math.min(RECOVERY_HOLD_MS, performance.now() - next.uprightSince) : 0;
        setRecovery(`${status}|${(held / 1000).toFixed(1)}`);
      }
    }, 250);
    return () => clearInterval(id);
  }, []);

  // New patient session -> start clean
  useEffect(() => {
    latchRef.current = createLatch();
    setFallAlert({ active: false, since: null });
  }, [patient?.id]);

  // Uploaded video looped/restarted (or scrubbed back) -> that's a new scene, so
  // end the old alert. "Dismissed" stops it re-latching from the last stale
  // FALL/IMMOBILE label while the buffer refills.
  useEffect(() => {
    if (!videoElement) return undefined;
    let lastTime = videoElement.currentTime || 0;
    const onTimeUpdate = () => {
      const t = videoElement.currentTime;
      if (t < lastTime - 0.5) {
        latchRef.current = acknowledgeLatch(latchRef.current);
        uprightRef.current = null;
        setFallAlert({ active: false, since: null });
      }
      lastTime = t;
    };
    videoElement.addEventListener('timeupdate', onTimeUpdate);
    videoElement.addEventListener('seeked', onTimeUpdate);
    return () => {
      videoElement.removeEventListener('timeupdate', onTimeUpdate);
      videoElement.removeEventListener('seeked', onTimeUpdate);
    };
  }, [videoElement]);

  const handleAcknowledge = useCallback(() => {
    latchRef.current = acknowledgeLatch(latchRef.current);
    setFallAlert({ active: false, since: null });
  }, []);

  useEffect(() => {
    if (ALERT_CLASSES.includes(currentClass) && currentClass !== lastClassRef.current) {
      setHistoryRefreshTrigger((t) => t + 1);
    }
    lastClassRef.current = currentClass;
  }, [currentClass]);

  return (
    <div className="app-layout">
      {/* 1. Left Sidebar Shell */}
      <Sidebar activeTab={activeTab} onTabSelect={setActiveTab} />

      {/* 2. Main Wrapper */}
      <div className="main-wrapper">
        {/* 3. Top Header Bar */}
        <TopHeader
          patient={patient}
          onSwitchPatient={() => setPatient(null)}
          backendConnected={connected}
          fps={fps}
          latency={latency}
          alertCount={fallAlert.active || currentClass === 'HIGH_RISK' ? 1 : 0}
        />

        {/* 4. Main Scrollable Content Area */}
        <main className="main-content">
          {!patient ? (
            <PatientSelector onSelect={(id, name) => setPatient({ id, name })} />
          ) : (
            <>
              {/* Clinical Patient Telemetry Header */}
              <PatientHeader patient={patient} prediction={prediction} />

              {/* Alert Banner for FALL / HIGH_RISK */}
              <AlertBanner
                predictedClass={currentClass}
                fallActive={fallAlert.active}
                fallSince={fallAlert.since}
                recovery={recovery}
                onAcknowledge={handleAcknowledge}
              />

              {wsError && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 4,
                    background: 'var(--fall-bg)',
                    border: '1px solid var(--fall-border)',
                    color: 'var(--fall)',
                    fontSize: 12,
                  }}
                >
                  WebSocket Telemetry Connection Error: {wsError}
                </div>
              )}

              {/* Main Monitoring Grid */}
              <div className="monitoring-grid">
                {/* Left Column: Video Feed (Webcam or Upload) */}
                <VideoSource onVideoReady={handleVideoReady} />

                {/* Right Column: 3D Digital Twin Skeleton Canvas */}
                <DigitalTwin landmarksRef={latestLandmarksRef} prediction={prediction} />
              </div>

              {/* Telemetry Metrics Panel */}
              <TelemetryBar
                prediction={prediction}
                frameCount={frameCount}
                fps={fps}
                latency={latency}
                connected={connected}
                modelReady={modelReady}
                poseError={poseError}
              />

              {/* Backend Logged Event History */}
              <EventHistory
                refreshTrigger={historyRefreshTrigger}
                patientId={patient.id}
                patientName={patient.name}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;