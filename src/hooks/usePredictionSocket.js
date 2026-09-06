import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Manages a WebSocket connection to the backend's /ws/session endpoint,
 * scoped to a specific patient (patientId is required in the URL so the
 * backend logs any alerts against the right patient record). The hook
 * won't connect until a valid patientId is provided.
 */
function usePredictionSocket(patientId) {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (patientId === undefined || patientId === null) return;

    const url = `ws://127.0.0.1:8000/ws/session?patient_id=${patientId}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setError('WebSocket error -- is the backend running on :8000?');

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          setError(data.error);
        } else if (data.predicted_class) {
          setPrediction(data);
          setError(null);
        }
      } catch (e) {
        setError('Failed to parse backend response');
      }
    };

    return () => {
      ws.close();
    };
  }, [patientId]);

  const sendFrame = useCallback((frame132) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ frame: frame132 }));
    }
  }, []);

  return { connected, prediction, error, sendFrame };
}

export default usePredictionSocket;
