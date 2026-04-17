import { OrbitControls } from '@react-three/drei';

/**
 * Camera orbit controls for the Go scene.
 *
 * Uses the same OrbitControls setup as chess/checkers but widens the zoom
 * range to comfortably frame a 19×19 board. Auto-rotation by side (as in
 * checkers) is deferred to later sprints once the settings store exists.
 */
export function GoCameraRig() {
  return (
    <OrbitControls
      makeDefault
      enablePan={false}
      enableRotate
      enableZoom
      minDistance={7}
      maxDistance={22}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 2.2}
      enableDamping
      dampingFactor={0.08}
    />
  );
}
