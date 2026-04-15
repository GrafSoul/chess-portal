import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useCheckersStore } from '../../stores/useCheckersStore';
import { useCheckersSettingsStore } from '../../stores/useCheckersSettingsStore';
import type { PieceColor } from '../../engine/types';

const ROTATION_LERP = 0.08;
const PRE_ROTATION_PAUSE_MS = 1400;

/** Target azimuth: white at bottom → π, black at bottom → 0 */
function targetAzimuthForSide(side: PieceColor): number {
  return side === 'w' ? Math.PI : 0;
}

/** Wrap angle to (-π, π] */
function wrapAngle(angle: number): number {
  let a = angle % (Math.PI * 2);
  if (a > Math.PI) a -= Math.PI * 2;
  if (a <= -Math.PI) a += Math.PI * 2;
  return a;
}

/** Camera orbit controls for the checkers scene */
export function CheckersCameraRig() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const targetAngleRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const hasSnappedRef = useRef(false);

  const playerColor = useCheckersSettingsStore((s) => s.playerColor);
  const autoRotate = useCheckersSettingsStore((s) => s.autoRotate);
  const turn = useCheckersStore((s) => s.turn);

  const desiredSide: PieceColor = autoRotate ? turn : playerColor;

  useEffect(() => {
    const controls = controlsRef.current;
    const target = targetAzimuthForSide(desiredSide);

    if (!controls) {
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

    const current = controls.getAzimuthalAngle();
    if (Math.abs(wrapAngle(target - current)) < 0.005) return;

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      targetAngleRef.current = target;
      timerRef.current = null;
    }, PRE_ROTATION_PAUSE_MS);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [desiredSide]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

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
