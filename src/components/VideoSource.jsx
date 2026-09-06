import { useState } from 'react';
import { Camera, Upload, Video } from 'lucide-react';
import CameraFeed from './CameraFeed';
import VideoUpload from './VideoUpload';

/**
 * Switches between the live webcam (CameraFeed) and an uploaded video
 * file (VideoUpload), forwarding whichever <video> element is currently
 * active up to onVideoReady.
 */
function VideoSource({ onVideoReady }) {
  const [mode, setMode] = useState('live'); // 'live' | 'upload'

  const handleModeChange = (newMode) => {
    if (newMode === mode) return;
    onVideoReady(null); // clear immediately so stale frames don't keep flowing
    setMode(newMode);
  };

  return (
    <div className="clinical-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="clinical-card-header">
        <div className="section-title">
          <Video size={15} style={{ color: 'var(--accent)' }} />
          <span>Optical Telemetry Source</span>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => handleModeChange('live')}
            style={{
              padding: '4px 10px',
              borderRadius: 4,
              border: '1px solid ' + (mode === 'live' ? 'var(--accent)' : 'var(--border)'),
              background: mode === 'live' ? 'var(--accent-glow)' : 'rgba(255,255,255,0.02)',
              color: mode === 'live' ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
          >
            <Camera size={13} />
            Live Camera
          </button>

          <button
            onClick={() => handleModeChange('upload')}
            style={{
              padding: '4px 10px',
              borderRadius: 4,
              border: '1px solid ' + (mode === 'upload' ? 'var(--accent)' : 'var(--border)'),
              background: mode === 'upload' ? 'var(--accent-glow)' : 'rgba(255,255,255,0.02)',
              color: mode === 'upload' ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
          >
            <Upload size={13} />
            Upload Video
          </button>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {mode === 'live' ? (
          <CameraFeed onVideoReady={onVideoReady} />
        ) : (
          <VideoUpload onVideoReady={onVideoReady} />
        )}
      </div>
    </div>
  );
}

export default VideoSource;