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
import { apiUrl } from './config';

const ALERT_CLASSES = ['HIGH_RISK', 'FALL', 'IMMOBILE'];

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window === 'undefined' ? true : window.innerWidth > 768
  );
  const [patient, setPatient] = useState(null);
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

  const { connected, prediction, error: wsError, sendFrame } = usePredictionSocket(patient?.id);
  const [serverOk, setServerOk] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = () => {
      fetch(apiUrl('/'))
        .then((res) => {
          if (!cancelled) setServerOk(res.ok);
        })
        .catch(() => {
          if (!cancelled) setServerOk(false);
        });
    };
    check();
    const interval = setInterval(check, 20000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (prediction && lastFrameSendTimeRef.current) {
      const now = performance.now();
      const measured = Math.round(now - lastFrameSendTimeRef.current);
      if (measured > 0 && measured < 500) {
        setLatency(measured);
      }
    }
  }, [prediction]);

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
        frameTimesRef.current.push(now);
        while (frameTimesRef.current.length > 0 && frameTimesRef.current[0] <= now - 1000) {
          frameTimesRef.current.shift();
        }
        lastFrameSendTimeRef.current = now;
        sendFrame(frame132);
        latestLandmarksRef.current = rawLandmarks;
      } else {
        latestLandmarksRef.current = null;
      }
    },
    [sendFrame]
  );

  const { modelReady, error: poseError } = usePoseExtraction(videoElement, handleLandmarks);

  const currentClass = prediction?.predicted_class ?? 'STABLE';

  useEffect(() => {
    if (ALERT_CLASSES.includes(currentClass) && currentClass !== lastClassRef.current) {
      setHistoryRefreshTrigger((t) => t + 1);
    }
    lastClassRef.current = currentClass;
  }, [currentClass]);

  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} />
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="main-wrapper">
        <TopHeader
          patient={patient}
          onSwitchPatient={() => setPatient(null)}
          backendConnected={connected || serverOk}
          fps={fps}
          latency={latency}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
        />

        <main className="main-content">
          {!patient ? (
            <PatientSelector onSelect={(id, name) => setPatient({ id, name })} />
          ) : (
            <>
              <PatientHeader patient={patient} prediction={prediction} />
              <AlertBanner predictedClass={currentClass} />

              {wsError && <div className="ws-error">{wsError}</div>}

              <div className="monitoring-grid">
                <VideoSource onVideoReady={handleVideoReady} />
                <DigitalTwin landmarksRef={latestLandmarksRef} prediction={prediction} />
              </div>

              <TelemetryBar
                prediction={prediction}
                frameCount={frameCount}
                fps={fps}
                latency={latency}
                connected={connected}
                modelReady={modelReady}
                poseError={poseError}
              />

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
