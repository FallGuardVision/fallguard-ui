import { useEffect, useRef, useState } from 'react';
import { UploadCloud, FileVideo, AlertTriangle, CheckCircle2, Play, Pause, RotateCcw } from 'lucide-react';

const ERROR_MESSAGES = {
  1: 'Loading was aborted.',
  2: 'A network error occurred while loading the video.',
  3: 'The video could not be decoded -- the file may be corrupt or in an unsupported codec.',
  4: 'This video format/codec is not supported by your browser (common for .avi files -- ' +
    'browsers generally only play .mp4 (H.264), .webm, or .ogg natively). Convert the file ' +
    'and try again, e.g.: ffmpeg -i input.avi -c:v libx264 -c:a aac output.mp4',
};

function VideoUpload({ onVideoReady }) {
  const videoRef = useRef(null);
  const objectUrlRef = useRef(null);
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [ready, setReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;

    setFileName(file.name);
    setVideoUrl(url);
    setReady(false);
    setLoadError(null);
    setIsPlaying(false);
    if (onVideoReady) onVideoReady(null);
  };

  const handleVideoError = () => {
    const code = videoRef.current?.error?.code;
    setLoadError(ERROR_MESSAGES[code] || 'This video could not be loaded.');
    setReady(false);
    setIsPlaying(false);
    if (onVideoReady) onVideoReady(null);
  };

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const handleLoadedMetadata = () => {
    setReady(true);
    if (onVideoReady && videoRef.current) {
      onVideoReady(videoRef.current);
    }
    // Automatically start playing video once metadata is ready
    if (videoRef.current) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Auto-play prevented by browser policy:', err);
          setIsPlaying(false);
        });
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const restartVideo = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play().then(() => setIsPlaying(true));
  };

  return (
    <div style={{ width: '100%' }}>
      <input
        type="file"
        ref={fileInputRef}
        accept="video/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {!videoUrl && (
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed var(--border)',
            borderRadius: 6,
            padding: '36px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: 'rgba(255, 255, 255, 0.01)',
            transition: 'all 0.15s ease',
          }}
        >
          <UploadCloud size={32} style={{ color: 'var(--accent)', marginBottom: 10 }} />
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            Choose a video
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            MP4, WebM, or OGG
          </p>
        </div>
      )}

      {/* Video element is always rendered when videoUrl is present with explicit src={videoUrl} */}
      <div style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', background: '#000', display: videoUrl ? 'block' : 'none' }}>
        <video
          ref={videoRef}
          src={videoUrl || undefined}
          controls
          muted
          playsInline
          loop
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleVideoError}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          style={{
            width: '100%',
            maxHeight: 440,
            objectFit: 'contain',
            display: 'block',
          }}
        />

        {videoUrl && (
          <div
            style={{
              padding: '8px 12px',
              background: 'var(--surface-card)',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
              <FileVideo size={14} style={{ color: 'var(--accent)' }} />
              <strong style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {fileName}
              </strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={togglePlayPause}
                style={{
                  padding: '4px 10px',
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                  background: isPlaying ? 'var(--accent-glow)' : 'rgba(255, 255, 255, 0.05)',
                  color: isPlaying ? 'var(--accent)' : 'var(--text-primary)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                {isPlaying ? 'Pause' : 'Play'}
              </button>

              <button
                onClick={restartVideo}
                style={{
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-secondary)',
                  fontSize: 11,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                title="Restart video"
              >
                <RotateCcw size={12} />
                Restart
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 600,
                  textDecoration: 'underline',
                  marginLeft: 4,
                }}
              >
                Change
              </button>
            </div>
          </div>
        )}
      </div>

      {videoUrl && loadError && (
        <div
          style={{
            marginTop: 10,
            padding: '10px 14px',
            borderRadius: 4,
            background: 'var(--fall-bg)',
            border: '1px solid var(--fall-border)',
            color: 'var(--fall)',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertTriangle size={16} />
          <span>{loadError}</span>
        </div>
      )}

      {videoUrl && ready && !loadError && (
        <div
          style={{
            marginTop: 10,
            padding: '8px 12px',
            borderRadius: 4,
            background: 'var(--stable-bg)',
            border: '1px solid var(--stable-border)',
            color: 'var(--stable)',
            fontSize: 11,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CheckCircle2 size={14} />
          <span>
            {isPlaying ? 'Detecting pose.' : 'Ready. Press play to start detection.'}
          </span>
        </div>
      )}
    </div>
  );
}

export default VideoUpload;