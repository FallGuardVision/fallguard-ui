import { useEffect, useRef, useState, useCallback } from 'react';
import { getWsBaseUrl } from '../config/api';

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
  const [apiTrigger, setApiTrigger] = useState(0);

  useEffect(() => {
    const handleApiChange = () => setApiTrigger((t) => t + 1);
    window.addEventListener('fallguard_api_changed', handleApiChange);
    return () => window.removeEventListener('fallguard_api_changed', handleApiChange);
  }, []);

  useEffect(() => {
    if (patientId === undefined || patientId === null) return;

    const wsBase = getWsBaseUrl();
    const url = `${wsBase}/ws/session?patient_id=${patientId}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setError(`WebSocket connection failed: ${url}`);

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
  }, [patientId, apiTrigger]);

  const sendFrame = useCallback((frame132) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ frame: frame132 }));
    }
  }, []);

  return { connected, prediction, error, sendFrame };
}

export default usePredictionSocket;
