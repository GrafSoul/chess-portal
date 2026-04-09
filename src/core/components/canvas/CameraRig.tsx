import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useChessStore } from '../../../games/chess/stores/useChessStore';
import { useChessSettingsStore } from '../../../games/chess/stores/useChessSettingsStore';
import { useCameraRotationStore } from '../../../games/chess/stores/useCameraRotationStore';
import { useTutorialStore } from '../../../games/chess/stores/useTutorialStore';
import type { PieceColor } from '../../../games/chess/engine/types';

/** Lerp factor per frame for smooth azimuth interpolation. */
const ROTATION_LERP = 0.08;

/**
 * Pause (ms) before a forced rotation animation begins, after a side change.
 * Must exceed the piece flight animation (~1.5s in Piece.tsx MOVE_DURATION)
 * plus a small visible gap, so the rotation clearly starts AFTER the piece
 * has landed — not concurrently with it.
 */
const PRE_ROTATION_PAUSE_MS = 1800;

/**
 * Target azimuthal angle (radians) for viewing the board from a side.
 *
 * Camera at azimuth 0 (camera on +Z) shows BLACK pieces at the bottom of
 * the screen because chess.js rank 8 maps to +Z. So:
 * - white player view → azimuth = π (camera on -Z, white at bottom)
 * - black player view → azimuth = 0
 */
function targetAzimuthForSide(side: PieceColor): number {
  return side === 'w' ? Math.PI : 0;
}

/** Wrap an angle into (-π, π] for shortest-path interpolation. */
function wrapAngle(angle: number): number {
  let a = angle % (Math.PI * 2);
  if (a > Math.PI) a -= Math.PI * 2;
  if (a <= -Math.PI) a += Math.PI * 2;
  return a;
}

/**
 * Camera orbit controls with side-aware board orientation.
 *
 * - On mount and on `playerColor` change → snap/animate camera to face that side.
 * - When `autoRotate` is enabled → animate camera to whichever side is to move.
 * - Manual mouse rotation/zoom remain fully usable between auto-rotations.
 *
 * Forced rotations are paced: a short pause precedes the animation, and the
 * `useCameraRotationStore.isRotating` flag stays true throughout the entire
 * pause+animation window so other systems (AI scheduler) can wait for it.
 */
export function CameraRig() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const targetAngleRef = useRef<number | null>(null);
  const animationStartTimerRef = useRef<number | null>(null);
  const hasSnappedRef = useRef(false);

  const playerColor = useChessSettingsStore((s) => s.playerColor);
  const autoRotate = useChessSettingsStore((s) => s.autoRotate);
  const turn = useChessStore((s) => s.turn);
  const tutorialActive = useTutorialStore((s) => s.isActive);

  // In tutorial mode, force a fixed white-side view and ignore autoRotate so
  // demonstrations are always shown from a stable, predictable angle.
  const desiredSide: PieceColor = tutorialActive
    ? 'w'
    : autoRotate
      ? turn
      : playerColor;

  // Set new target whenever desired side changes
  useEffect(() => {
    const controls = controlsRef.current;
    const target = targetAzimuthForSide(desiredSide);

    if (!controls) {
      // Controls not mounted yet — defer; useFrame will handle first snap
      targetAngleRef.current = target;
      return;
    }

    if (!hasSnappedRef.current) {
      controls.setAzimuthalAngle(target);
      controls.update();
      hasSnappedRef.current = true;
      targetAngleRef.current = null;
      return;
    }

    // Already at target? skip
    const current = controls.getAzimuthalAngle();
    if (Math.abs(wrapAngle(target - current)) < 0.005) {
      return;
    }

    // Mark rotating immediately so other systems wait through the pre-pause
    useCameraRotationStore.getState().setIsRotating(true);

    // Cancel any pending pre-rotation timer
    if (animationStartTimerRef.current !== null) {
      window.clearTimeout(animationStartTimerRef.current);
    }

    // After short pause → kick off animation by setting target
    animationStartTimerRef.current = window.setTimeout(() => {
      targetAngleRef.current = target;
      animationStartTimerRef.current = null;
    }, PRE_ROTATION_PAUSE_MS);

    return () => {
      if (animationStartTimerRef.current !== null) {
        window.clearTimeout(animationStartTimerRef.current);
        animationStartTimerRef.current = null;
      }
    };
  }, [desiredSide]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    // First frame after mount — snap immediately if effect ran before ref existed
    if (!hasSnappedRef.current) {
      const target = targetAzimuthForSide(desiredSide);
      controls.setAzimuthalAngle(target);
      controls.update();
      hasSnappedRef.current = true;
      targetAngleRef.current = null;
      return;
    }

    const target = targetAngleRef.current;
    if (target === null) return;

    const current = controls.getAzimuthalAngle();
    const delta = wrapAngle(target - current);
    if (Math.abs(delta) < 0.005) {
      controls.setAzimuthalAngle(target);
      controls.update();
      targetAngleRef.current = null;
      useCameraRotationStore.getState().setIsRotating(false);
      return;
    }

    controls.setAzimuthalAngle(current + delta * ROTATION_LERP);
    controls.update();
  });

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
