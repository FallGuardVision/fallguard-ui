import { useEffect, useRef, useState } from 'react';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

/**
 * Runs MediaPipe PoseLandmarker on a given <video> element, calling
 * onLandmarks(frame132, landmarks, poseDetected) on every processed frame.
 * If no person is detected, onLandmarks(null, null, false) is called to explicitly
 * signal person absence and clear stale state.
 */
function usePoseExtraction(videoElement, onLandmarks) {
  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const [modelReady, setModelReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        });
        if (!cancelled) {
          landmarkerRef.current = landmarker;
          setModelReady(true);
        }
      } catch (err) {
        setError(err.message);
      }
    }

    setup();

    return () => {
      cancelled = true;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!modelReady || !videoElement) return;

    let lastVideoTime = -1;

    function detectFrame() {
      if (
        landmarkerRef.current &&
        videoElement.readyState >= 2 &&
        videoElement.currentTime !== lastVideoTime
      ) {
        lastVideoTime = videoElement.currentTime;
        const result = landmarkerRef.current.detectForVideo(videoElement, performance.now());

        if (result.landmarks && result.landmarks.length > 0) {
          const landmarks = result.landmarks[0]; // first detected person, 33 points
          const frame132 = [];
          for (const lm of landmarks) {
            frame132.push(lm.x, lm.y, lm.z, lm.visibility ?? 0);
          }
          if (frame132.length === 132 && onLandmarks) {
            onLandmarks(frame132, landmarks, true);
          } else if (onLandmarks) {
            onLandmarks(null, null, false);
          }
        } else if (onLandmarks) {
          onLandmarks(null, null, false);
        }
      }
      rafRef.current = requestAnimationFrame(detectFrame);
    }

    detectFrame();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [modelReady, videoElement, onLandmarks]);

  return { modelReady, error };
}

export default usePoseExtraction;
