import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useChessStore } from '../../../games/chess/stores/useChessStore';
import { useChessSettingsStore } from '../../../games/chess/stores/useChessSettingsStore';
import type { PieceColor } from '../../../games/chess/engine/types';

/**
 * Lerp factor per frame for smooth angle interpolation.
 * Higher = snappier rotation. 0.06 ≈ ~1s rotation half-life.
 */
const ROTATION_LERP = 0.06;

/**
 * Target azimuth angle (radians) for viewing the board from a given side.
 *
 * Empirically calibrated against the actual scene: a camera at +Z (azimuth 0)
 * shows BLACK pieces at the bottom of the screen, because chess.js board ranks
 * map to +Z (rank 8). So black-side view = 0, white-side view = π.
 */
function targetAzimuthForSide(side: PieceColor): number {
  return side === 'w' ? Math.PI : 0;
}

/** Wrap an angle into the range (-π, π] for shortest-path interpolation. */
function wrapAngle(angle: number): number {
  let a = angle % (Math.PI * 2);
  if (a > Math.PI) a -= Math.PI * 2;
  if (a <= -Math.PI) a += Math.PI * 2;
  return a;
}

/**
 * Camera orbit controls with chess-optimized constraints and side-aware rotation.
 *
 * Wraps Drei's OrbitControls with an additional `useFrame` that animates the
 * azimuthal angle toward the desired viewing side:
 * - autoRotate OFF → human's color (`playerColor`).
 * - autoRotate ON  → whichever side is currently to move.
 *
 * Manual mouse rotation is fully preserved — between auto-rotations the user
 * can spin the camera freely. The rig only takes over when:
 * 1. The component just mounted (first valid frame → snap to target).
 * 2. The desired side changes (e.g. player switches color, or turn flips
 *    while autoRotate is on).
 *
 * `useFrame` runs at priority 1, AFTER OrbitControls' built-in update (which
 * runs at priority 0), so our azimuth changes always win the frame.
 */
export function CameraRig() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const lastDesiredSideRef = useRef<PieceColor | null>(null);
  const animatingRef = useRef(false);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    // Read latest state directly from stores — bypasses effect/hydration races
    const { playerColor, autoRotate } = useChessSettingsStore.getState();
    const { turn } = useChessStore.getState();
    const desiredSide: PieceColor = autoRotate ? turn : playerColor;
    const target = targetAzimuthForSide(desiredSide);

    // Detect side change → kick off an animation
    if (lastDesiredSideRef.current !== desiredSide) {
      const isFirstMount = lastDesiredSideRef.current === null;
      lastDesiredSideRef.current = desiredSide;

      if (isFirstMount) {
        // First valid frame: snap silently so the board opens facing the player
        controls.setAzimuthalAngle(target);
        controls.update();
        return;
      }
      animatingRef.current = true;
    }

    if (!animatingRef.current) return;

    const current = controls.getAzimuthalAngle();
    const delta = wrapAngle(target - current);
    if (Math.abs(delta) < 0.005) {
      controls.setAzimuthalAngle(target);
      controls.update();
      animatingRef.current = false;
      return;
    }

    controls.setAzimuthalAngle(current + delta * ROTATION_LERP);
    controls.update();
  }, 1);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={false}
      enableRotate
      enableZoom
      minDistance={6}
      maxDistance={18}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 2.2}
      enableDamping
      dampingFactor={0.08}
    />
  );
}
