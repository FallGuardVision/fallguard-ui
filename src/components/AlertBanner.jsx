import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ShieldAlert, Volume2, VolumeX, CheckCircle } from 'lucide-react';

/**
 * Alert banner + sound.
 *  - HIGH_RISK : amber banner, one soft double-beep per new HIGH_RISK episode.
 *  - FALL / IMMOBILE (latched): red banner that STAYS until the patient is back
 *    on their feet or staff press Acknowledge; siren repeats while active
 *    (faster once the patient is IMMOBILE).
 */
function AlertBanner({ predictedClass, fallActive, fallSince, recovery, onAcknowledge }) {
  const audioCtxRef = useRef(null);
  const lastHighRiskRef = useRef(false);
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const isHighRisk = predictedClass === 'HIGH_RISK' && !fallActive;

  function tone(freq, startOffset, dur, volume) {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const t0 = ctx.currentTime + startOffset;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur);
    } catch (e) {
      console.warn('Could not play alert sound:', e);
    }
  }

  const playSiren = () => {
    tone(880, 0, 0.28, 0.22);
    tone(660, 0.3, 0.28, 0.22);
  };
  const playHighRisk = () => {
    tone(600, 0, 0.14, 0.12);
    tone(600, 0.2, 0.14, 0.12);
  };

  // HIGH_RISK: once per new episode
  useEffect(() => {
    if (isHighRisk && !lastHighRiskRef.current && !muted) playHighRisk();
    lastHighRiskRef.current = isHighRisk;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHighRisk]);

  // FALL / IMMOBILE: repeat until cleared
  const immobile = predictedClass === 'IMMOBILE';
  useEffect(() => {
    if (!fallActive || muted) return undefined;
    playSiren();
    const id = setInterval(playSiren, immobile ? 800 : 1200);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fallActive, muted, immobile]);

  // time since the fall
  useEffect(() => {
    if (!fallActive || !fallSince) {
      setElapsed(0);
      return undefined;
    }
    const tick = () => setElapsed(Math.floor((performance.now() - fallSince) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [fallActive, fallSince]);

  if (!fallActive && !isHighRisk) return null;

  if (isHighRisk) {
    return (
      <div
        style={{
          padding: '12px 18px',
          borderRadius: 6,
          background: 'var(--high-risk-bg)',
          border: '1px solid var(--high-risk-border)',
          color: 'var(--high-risk)',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <AlertTriangle size={20} />
        <div>
          <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            HIGH RISK — POSSIBLE FALL IN PROGRESS
          </div>
          <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.85, marginTop: 2 }}>
            Postural dynamics indicate instability or rapid equilibrium deviation.
          </div>
        </div>
      </div>
    );
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <div
      style={{
        padding: '12px 18px',
        borderRadius: 6,
        background: 'var(--fall-bg)',
        border: '1px solid var(--fall-border)',
        color: 'var(--fall)',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        animation: 'pulse-red 1.2s infinite',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ShieldAlert size={22} style={{ animation: 'pulse 1s infinite' }} />
        <div>
          <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {immobile
              ? 'PATIENT DOWN AND NOT MOVING — IMMEDIATE ATTENTION REQUIRED'
              : 'FALL DETECTED — IMMEDIATE PATIENT ATTENTION REQUIRED'}
          </div>
          <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.85, marginTop: 2 }}>
            Alert stays active until the patient is back on their feet or staff acknowledge it.
            Time since fall: {mm}:{ss}
          </div>
          {recovery && (
            <div style={{ fontSize: 11, fontWeight: 500, marginTop: 3, opacity: 0.9 }}>
              Recovery check: {recovery.split('|')[0]} — upright {recovery.split('|')[1]}s / 2.5s
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => setMuted((m) => !m)}
          title={muted ? 'Unmute alarm' : 'Mute alarm sound'}
          style={{
            background: 'transparent',
            border: '1px solid currentColor',
            color: 'inherit',
            borderRadius: 4,
            padding: '5px 8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
        <button
          onClick={onAcknowledge}
          title="Staff has attended the patient"
          style={{
            background: 'var(--fall)',
            border: 'none',
            color: '#fff',
            borderRadius: 4,
            padding: '6px 12px',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            whiteSpace: 'nowrap',
          }}
        >
          <CheckCircle size={13} />
          ACKNOWLEDGE
        </button>
      </div>
    </div>
  );
}

export default AlertBanner;
