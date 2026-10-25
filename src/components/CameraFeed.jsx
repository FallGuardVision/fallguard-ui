import { useEffect, useRef, useState } from 'react';
import { Camera, AlertCircle } from 'lucide-react';

function CameraFeed({ onVideoReady }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stream;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setReady(true);
            if (onVideoReady) onVideoReady(videoRef.current);
          };
        }
      } catch (err) {
        setError(err.message);
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onVideoReady]);

  if (error) {
    return (
      <div
        style={{
          padding: 20,
          textAlign: 'center',
          color: 'var(--fall)',
          background: 'var(--fall-bg)',
          borderRadius: 6,
          border: '1px solid var(--fall-border)',
          margin: '20px 0',
        }}
      >
        <AlertCircle size={24} style={{ marginBottom: 8 }} />
        <p style={{ fontWeight: 600 }}>Camera Access Required</p>
        <p style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: 6, overflow: 'hidden', background: '#000' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          maxHeight: 440,
          objectFit: 'cover',
          display: 'block',
        }}
      />

      {/* Clinical Overlay Viewfinder Elements */}
      {ready && (
        <>
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(7, 10, 18, 0.75)',
              backdropFilter: 'blur(4px)',
              padding: '4px 10px',
              borderRadius: 4,
              border: '1px solid var(--border)',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <span className="live-dot" />
            <span>LIVE</span>
          </div>

          <div
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'rgba(7, 10, 18, 0.75)',
              backdropFilter: 'blur(4px)',
              padding: '4px 8px',
              borderRadius: 4,
              border: '1px solid var(--border)',
              fontSize: 10,
              fontFamily: 'JetBrains Mono, monospace',
              color: 'var(--text-secondary)',
            }}
          >
            30 FPS
          </div>
        </>
      )}

      {!ready && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            background: 'rgba(11, 15, 25, 0.9)',
            color: 'var(--text-secondary)',
            minHeight: 280,
          }}
        >
          <Camera size={24} style={{ color: 'var(--accent)', animation: 'pulse 1.5s infinite' }} />
          <p style={{ fontSize: 13 }}>Starting camera...</p>
        </div>
      )}
    </div>
  );
}

export default CameraFeed;
