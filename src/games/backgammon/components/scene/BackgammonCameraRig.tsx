/**
 * Camera rig for the Backgammon 3D scene.
 *
 * Provides constrained orbit controls: pan is disabled so the board stays
 * centered, zoom is limited to a comfortable range for the rectangular board,
 * and polar angle is capped to prevent flipping beneath the board.
 *
 * Mirrors `GoCameraRig` — same `OrbitControls` pattern, adjusted distance
 * limits for the longer backgammon board.
 *
 * @example
 * ```tsx
 * <Canvas>
 *   <BackgammonCameraRig />
 *   <BackgammonScene />
 * </Canvas>
 * ```
 */

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

/**
 * Orbit controls configured for the backgammon scene.
 *
 * Overrides the SceneCanvas default camera position `[0, 8, 8]` with a
 * top-down angle that shows the full 14×10 board and the dice cup area.
 *
 * @returns An `OrbitControls` component registered as the default camera controller.
 */
export function BackgammonCameraRig() {
  const { camera } = useThree();

  // Set initial camera position once on mount — shows full board + cup area.
  useEffect(() => {
    camera.position.set(0, 24, 16);
    camera.lookAt(0, 0, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <OrbitControls
      makeDefault
      target={[0, 0, 0]}
      enablePan={false}
      enableRotate
      enableZoom
      minDistance={12}
      maxDistance={40}
      minPolarAngle={Math.PI / 10}
      maxPolarAngle={Math.PI / 2.4}
      enableDamping
      dampingFactor={0.08}
    />
  );
}
