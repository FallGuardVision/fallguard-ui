import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Box, RotateCcw, ShieldCheck, UserX, Eye, AlertCircle } from 'lucide-react';

// Anatomical Connection Graph for 33 MediaPipe Pose Landmarks
const SKELETON_CONNECTIONS = [
  // Facial Structure
  [0, 7], [0, 8], [7, 1], [1, 2], [2, 3], [8, 4], [4, 5], [5, 6],
  
  // Torso Structure
  [11, 12], [11, 23], [12, 24], [23, 24],
  
  // Left Upper Limb & Hand
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  
  // Right Upper Limb & Hand
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  
  // Left Lower Limb & Foot
  [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
  
  // Right Lower Limb & Foot
  [24, 26], [26, 28], [28, 30], [28, 32], [30, 32],
];

// Color palette and emissive themes per prediction state
const PREDICTION_THEMES = {
  STABLE: {
    color: 0x38bdf8, // Cyan 400
    emissive: 0x0284c7,
    glowHex: '#38bdf8',
    badgeBg: 'rgba(34, 197, 94, 0.15)',
    badgeColor: '#22c55e',
    border: 'rgba(34, 197, 94, 0.3)',
  },
  HIGH_RISK: {
    color: 0xf59e0b, // Amber 500
    emissive: 0xb45309,
    glowHex: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeColor: '#f59e0b',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  FALL: {
    color: 0xef4444, // Red 500
    emissive: 0x991b1b,
    glowHex: '#ef4444',
    badgeBg: 'rgba(239, 68, 68, 0.2)',
    badgeColor: '#ef4444',
    border: 'rgba(239, 68, 68, 0.4)',
  },
  IMMOBILE: {
    color: 0xa855f7, // Purple 500
    emissive: 0x6b21a8,
    glowHex: '#a855f7',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
    badgeColor: '#a855f7',
    border: 'rgba(168, 85, 247, 0.3)',
  },
};

/**
 * Body Detection Gate helper function.
 * Validates whether incoming landmarks represent a real, active person in the camera view.
 * Requires:
 * 1. landmarks array exists, non-null, and length === 33
 * 2. landmark frame is fresh (received < 350ms ago)
 * 3. At least 2 core torso landmarks (shoulders 11/12, hips 23/24) have visibility > 0.4 and finite coordinates.
 */
function isValidPersonPose(rawLandmarks, lastUpdateTime) {
  if (!rawLandmarks || rawLandmarks.length !== 33) return false;
  if (Date.now() - lastUpdateTime > 350) return false;

  let validTorsoCount = 0;
  const coreIndices = [11, 12, 23, 24];
  for (const idx of coreIndices) {
    const lm = rawLandmarks[idx];
    if (
      lm &&
      Number.isFinite(lm.x) &&
      Number.isFinite(lm.y) &&
      (lm.visibility ?? 1.0) > 0.4
    ) {
      validTorsoCount++;
    }
  }

  return validTorsoCount >= 2;
}

/**
 * Real-Time 3D Clinical Digital Twin Visualization
 * Driven strictly by real MediaPipe pose detection. Instantly hides skeleton and clears
 * meshes when no person is detected.
 */
function DigitalTwin({ landmarksRef, prediction }) {
  const mountRef = useRef(null);
  const controlsRef = useRef(null);
  const resetCameraRef = useRef(null);

  // Tracking state: 'no_person' | 'active' | 'lost'
  const [trackingState, setTrackingState] = useState('no_person');
  const lastLandmarkTimeRef = useRef(0);

  const currentClass = prediction?.predicted_class ?? 'STABLE';
  const confidence = prediction?.confidence ? (prediction.confidence * 100).toFixed(0) : '0';
  const theme = PREDICTION_THEMES[currentClass] ?? PREDICTION_THEMES.STABLE;

  const handleResetView = useCallback(() => {
    if (resetCameraRef.current) {
      resetCameraRef.current();
    }
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    let width = container.clientWidth || 500;
    let height = container.clientHeight || 460;

    // 1. Three.js Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070a12);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    const defaultCameraPos = new THREE.Vector3(0, 0.1, 3.0);
    camera.position.copy(defaultCameraPos);

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 5.5;
    controls.minDistance = 1.0;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    resetCameraRef.current = () => {
      camera.position.copy(defaultCameraPos);
      controls.target.set(0, 0, 0);
      controls.update();
    };

    // 5. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xe2e8f0, 0.7);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    rimLight.position.set(-3, -2, -3);
    scene.add(rimLight);

    // 6. Ground Grid Floor
    const gridHelper = new THREE.GridHelper(8, 16, 0x0ea5e9, 0x1e293b);
    gridHelper.position.y = -1.25;
    scene.add(gridHelper);

    // 7. Materials & Geometries for Skeleton (Joint Spheres & Bone Cylinders)
    const activeTheme = PREDICTION_THEMES[currentClass] ?? PREDICTION_THEMES.STABLE;

    const jointGeo = new THREE.SphereGeometry(0.018, 16, 16);
    const headJointGeo = new THREE.SphereGeometry(0.014, 12, 12);
    const jointMaterial = new THREE.MeshStandardMaterial({
      color: activeTheme.color,
      emissive: activeTheme.emissive,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.3,
    });

    const boneGeo = new THREE.CylinderGeometry(0.008, 0.008, 1, 12);
    const boneMaterial = new THREE.MeshStandardMaterial({
      color: activeTheme.color,
      emissive: activeTheme.emissive,
      emissiveIntensity: 0.35,
      roughness: 0.3,
    });

    // Ghosted Reference Mannequin Mesh (Torso & Head)
    const mannequinGroup = new THREE.Group();
    const torsoCapsuleGeo = new THREE.CylinderGeometry(0.18, 0.14, 0.65, 16);
    const headSphereGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const mannequinMat = new THREE.MeshPhysicalMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.07,
      roughness: 0.1,
      transmission: 0.9,
    });

    const torsoMesh = new THREE.Mesh(torsoCapsuleGeo, mannequinMat);
    torsoMesh.position.set(0, 0.05, -0.02);
    mannequinGroup.add(torsoMesh);

    const headMesh = new THREE.Mesh(headSphereGeo, mannequinMat);
    headMesh.position.set(0, 0.52, -0.02);
    mannequinGroup.add(headMesh);

    mannequinGroup.visible = false;
    scene.add(mannequinGroup);

    // Create 34 Joint Meshes (33 MediaPipe + 1 Neck Midpoint)
    const jointMeshes = [];
    for (let i = 0; i < 34; i++) {
      const isHead = i < 11;
      const mesh = new THREE.Mesh(isHead ? headJointGeo : jointGeo, jointMaterial);
      mesh.visible = false; // Initial state: hidden (zero default skeleton!)
      scene.add(mesh);
      jointMeshes.push(mesh);
    }

    // Include Neck Connection [0, 33] (Nose to Neck Midpoint)
    const allConnections = [...SKELETON_CONNECTIONS, [0, 33]];
    const boneMeshes = allConnections.map(() => {
      const mesh = new THREE.Mesh(boneGeo, boneMaterial);
      mesh.visible = false; // Initial state: hidden
      scene.add(mesh);
      return mesh;
    });

    // Interpolation Data Arrays
    const smoothedPositions = Array.from({ length: 34 }, () => new THREE.Vector3(0, 0, 0));
    const targetPositions = Array.from({ length: 34 }, () => new THREE.Vector3(0, 0, 0));
    const landmarkVisible = new Array(34).fill(false);

    const upVector = new THREE.Vector3(0, 1, 0);

    // Helper to hide all skeleton elements immediately
    function hideAllSkeletonElements() {
      for (let i = 0; i < 34; i++) {
        jointMeshes[i].visible = false;
        landmarkVisible[i] = false;
      }
      boneMeshes.forEach((mesh) => (mesh.visible = false));
      mannequinGroup.visible = false;
    }

    // 8. Animation & Render Loop
    let rafId;
    function animate() {
      const now = Date.now();
      const rawLandmarks = landmarksRef.current;

      // Update material color palette when prediction state changes
      const currentTheme = PREDICTION_THEMES[currentClass] ?? PREDICTION_THEMES.STABLE;
      if (jointMaterial.color.getHex() !== currentTheme.color) {
        jointMaterial.color.setHex(currentTheme.color);
        jointMaterial.emissive.setHex(currentTheme.emissive);
        boneMaterial.color.setHex(currentTheme.color);
        boneMaterial.emissive.setHex(currentTheme.emissive);
        mannequinMat.color.setHex(currentTheme.color);
      }

      // Check if new rawLandmarks arrived
      if (rawLandmarks && rawLandmarks.length === 33) {
        lastLandmarkTimeRef.current = now;
      }

      const personValid = isValidPersonPose(rawLandmarks, lastLandmarkTimeRef.current);

      if (personValid) {
        setTrackingState('active');

        // Step A: Calculate body center from core torso points
        let centerX = 0, centerY = 0, centerZ = 0;
        let validCenterCount = 0;

        const coreIndices = [11, 12, 23, 24];
        coreIndices.forEach((idx) => {
          const lm = rawLandmarks[idx];
          const vis = lm?.visibility ?? 1.0;
          if (lm && Number.isFinite(lm.x) && Number.isFinite(lm.y) && vis > 0.35) {
            centerX += lm.x;
            centerY += lm.y;
            centerZ += lm.z || 0;
            validCenterCount++;
          }
        });

        if (validCenterCount > 0) {
          centerX /= validCenterCount;
          centerY /= validCenterCount;
          centerZ /= validCenterCount;
        } else {
          centerX = 0.5;
          centerY = 0.5;
          centerZ = 0;
        }

        // Step B: Calculate bounding box over valid landmarks
        let minY = Infinity, maxY = -Infinity;
        let minX = Infinity, maxX = -Infinity;

        for (let i = 0; i < 33; i++) {
          const lm = rawLandmarks[i];
          const vis = lm?.visibility ?? 1.0;
          if (lm && Number.isFinite(lm.x) && Number.isFinite(lm.y) && vis > 0.35) {
            const relX = lm.x - centerX;
            const relY = centerY - lm.y;
            if (relY < minY) minY = relY;
            if (relY > maxY) maxY = relY;
            if (relX < minX) minX = relX;
            if (relX > maxX) maxX = relX;
          }
        }

        const heightSpan = Math.max(maxY - minY, 0.2);
        const widthSpan = Math.max(maxX - minX, 0.2);
        const maxDimension = Math.max(heightSpan, widthSpan * 0.75, 0.35);

        // Body scale factor (Target height ~1.65 units in 3D world space)
        const scaleFactor = 1.65 / maxDimension;

        // Step C: Set 3D target coordinates for MediaPipe landmarks
        for (let i = 0; i < 33; i++) {
          const lm = rawLandmarks[i];
          const vis = lm?.visibility ?? 1.0;
          landmarkVisible[i] = lm && Number.isFinite(lm.x) && Number.isFinite(lm.y) && vis > 0.35;

          if (landmarkVisible[i]) {
            const relX = lm.x - centerX;
            const relY = centerY - lm.y;
            const relZ = -((lm.z || 0) - centerZ);

            targetPositions[i].set(
              relX * scaleFactor,
              relY * scaleFactor,
              relZ * scaleFactor * 0.75
            );
          }
        }

        // Compute Virtual Neck Midpoint (Landmark 33)
        if (landmarkVisible[11] && landmarkVisible[12]) {
          targetPositions[33].addVectors(targetPositions[11], targetPositions[12]).multiplyScalar(0.5);
          landmarkVisible[33] = true;
        } else {
          landmarkVisible[33] = false;
        }

        // Step D: Interpolate (Lerp) smoothed positions towards target positions
        for (let i = 0; i < 34; i++) {
          if (landmarkVisible[i]) {
            smoothedPositions[i].lerp(targetPositions[i], 0.3);
            jointMeshes[i].position.copy(smoothedPositions[i]);
            jointMeshes[i].visible = true;
          } else {
            jointMeshes[i].visible = false;
          }
        }

        // Align Ghosted Reference Mannequin to Torso Center
        if (landmarkVisible[11] && landmarkVisible[12] && landmarkVisible[23] && landmarkVisible[24]) {
          const shoulderMid = new THREE.Vector3().addVectors(smoothedPositions[11], smoothedPositions[12]).multiplyScalar(0.5);
          const hipMid = new THREE.Vector3().addVectors(smoothedPositions[23], smoothedPositions[24]).multiplyScalar(0.5);
          const torsoMid = new THREE.Vector3().addVectors(shoulderMid, hipMid).multiplyScalar(0.5);
          mannequinGroup.position.copy(torsoMid);

          const torsoDir = new THREE.Vector3().subVectors(shoulderMid, hipMid).normalize();
          mannequinGroup.quaternion.setFromUnitVectors(upVector, torsoDir);
          mannequinGroup.visible = true;
        } else {
          mannequinGroup.visible = false;
        }

        // Step E: Update 3D Bone Cylinder Meshes
        allConnections.forEach(([a, b], idx) => {
          const boneMesh = boneMeshes[idx];
          if (landmarkVisible[a] && landmarkVisible[b]) {
            const posA = smoothedPositions[a];
            const posB = smoothedPositions[b];
            const length = posA.distanceTo(posB);

            if (length > 0.005) {
              const midpoint = new THREE.Vector3().addVectors(posA, posB).multiplyScalar(0.5);
              boneMesh.position.copy(midpoint);
              boneMesh.scale.set(1, length, 1);

              const direction = new THREE.Vector3().subVectors(posB, posA).normalize();
              boneMesh.quaternion.setFromUnitVectors(upVector, direction);
              boneMesh.visible = true;
            } else {
              boneMesh.visible = false;
            }
          } else {
            boneMesh.visible = false;
          }
        });
      } else {
        // Person NOT detected: Clear all 3D skeleton elements immediately!
        hideAllSkeletonElements();

        if (now - lastLandmarkTimeRef.current < 500 && lastLandmarkTimeRef.current > 0) {
          setTrackingState('lost');
        } else {
          setTrackingState('no_person');
        }
      }

      controls.update();
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    }

    animate();

    // 9. Resize Observer for Canvas Responsiveness
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        const newHeight = entry.contentRect.height;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      renderer.dispose();
      jointGeo.dispose();
      headJointGeo.dispose();
      jointMaterial.dispose();
      boneGeo.dispose();
      boneMaterial.dispose();
      torsoCapsuleGeo.dispose();
      headSphereGeo.dispose();
      mannequinMat.dispose();
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [landmarksRef, currentClass]);

  return (
    <div className="clinical-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Card Header */}
      <div className="clinical-card-header">
        <div className="section-title">
          <Box size={15} style={{ color: 'var(--accent)' }} />
          <span>3D skeleton</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {trackingState === 'active' ? (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 4,
                background: theme.badgeBg,
                color: theme.badgeColor,
                border: `1px solid ${theme.border}`,
                letterSpacing: '0.04em',
              }}
            >
              {currentClass} ({confidence}%)
            </span>
          ) : (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
              }}
            >
              NO PERSON
            </span>
          )}
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>33 pts</span>
        </div>
      </div>

      {/* 3D Canvas Viewport */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          borderRadius: 6,
          overflow: 'hidden',
          border: '1px solid var(--border)',
          minHeight: 440,
          background: '#070a12',
        }}
      >
        <div ref={mountRef} style={{ width: '100%', height: '100%', minHeight: 440 }} />

        {/* HUD Top-Left: Person Detection & Tracking Status */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(7, 10, 18, 0.85)',
            backdropFilter: 'blur(6px)',
            padding: '5px 10px',
            borderRadius: 4,
            border: '1px solid var(--border)',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {trackingState === 'active' && (
            <>
              <span className={`live-dot ${currentClass === 'FALL' ? 'alert' : ''}`} />
              <span style={{ color: 'var(--text-primary)' }}>Person detected</span>
            </>
          )}

          {trackingState === 'lost' && (
            <>
              <span style={{ color: 'var(--high-risk)' }}>◐ TRACKING LOST</span>
            </>
          )}

          {trackingState === 'no_person' && (
            <>
              <span style={{ color: 'var(--text-muted)' }}>○ NO PERSON DETECTED</span>
            </>
          )}
        </div>

        {/* HUD Bottom-Left: Privacy Mode Label */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(7, 10, 18, 0.85)',
            backdropFilter: 'blur(6px)',
            padding: '4px 10px',
            borderRadius: 4,
            border: '1px solid var(--border)',
            fontSize: 10,
            color: 'var(--text-secondary)',
          }}
        >
          <ShieldCheck size={13} style={{ color: 'var(--accent)' }} />
          <span>Skeleton only</span>
        </div>

        {/* HUD Bottom-Right: Interactive Controls & Reset View */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              background: 'rgba(7, 10, 18, 0.85)',
              backdropFilter: 'blur(6px)',
              padding: '4px 8px',
              borderRadius: 4,
              border: '1px solid var(--border)',
              fontSize: 10,
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span><Eye size={10} style={{ display: 'inline', marginRight: 2 }} /> Drag to rotate</span>
          </div>

          <button
            onClick={handleResetView}
            style={{
              padding: '5px 10px',
              borderRadius: 4,
              border: '1px solid var(--border)',
              background: 'rgba(7, 10, 18, 0.9)',
              color: 'var(--accent)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.15s ease',
            }}
            title="Reset 3D camera orientation"
          >
            <RotateCcw size={12} />
            Reset View
          </button>
        </div>

        {/* Overlay when No Person is Detected */}
        {trackingState === 'no_person' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              background: 'rgba(7, 10, 18, 0.85)',
              backdropFilter: 'blur(4px)',
              color: 'var(--text-secondary)',
            }}
          >
            <UserX size={32} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
            <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
              NO PERSON DETECTED
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Waiting for a person in view
            </p>
          </div>
        )}

        {/* Tracking Lost Overlay */}
        {trackingState === 'lost' && (
          <div
            style={{
              position: 'absolute',
              top: 48,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--high-risk-bg)',
              border: '1px solid var(--high-risk-border)',
              color: 'var(--high-risk)',
              padding: '6px 14px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backdropFilter: 'blur(4px)',
            }}
          >
            <AlertCircle size={14} />
            <span>Tracking lost</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default DigitalTwin;
