import { useEffect, useRef } from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

const ALERT_CLASSES = ['HIGH_RISK', 'FALL'];

/**
 * Full-width alert banner shown when the current prediction is HIGH_RISK
 * or FALL. Plays a short audio cue once per NEW alert state transition.
 */
function AlertBanner({ predictedClass }) {
  const lastAlertedClass = useRef(null);
  const audioCtxRef = useRef(null);

  const isAlert = ALERT_CLASSES.includes(predictedClass);

  useEffect(() => {
    if (isAlert && predictedClass !== lastAlertedClass.current) {
      lastAlertedClass.current = predictedClass;
      playBeep(predictedClass === 'FALL' ? 880 : 660);
    }
    if (!isAlert) {
      lastAlertedClass.current = null;
    }
  }, [predictedClass, isAlert]);

  function playBeep(frequency) {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn('Could not play alert sound:', e);
    }
  }

  if (!isAlert) return null;

  const isFall = predictedClass === 'FALL';

  return (
    <div
      style={{
        padding: '12px 18px',
        borderRadius: 6,
        background: isFall ? 'var(--fall-bg)' : 'var(--high-risk-bg)',
        border: '1px solid ' + (isFall ? 'var(--fall-border)' : 'var(--high-risk-border)'),
        color: isFall ? 'var(--fall)' : 'var(--high-risk)',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        animation: isFall ? 'pulse-red 1.2s infinite' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {isFall ? (
          <ShieldAlert size={22} style={{ animation: 'pulse 1s infinite' }} />
        ) : (
          <AlertTriangle size={20} />
        )}
        <div>
          <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {isFall ? 'Fall detected' : 'High fall risk'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AlertBanner;
