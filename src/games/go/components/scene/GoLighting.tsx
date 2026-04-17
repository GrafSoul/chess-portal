import { ContactShadows } from '@react-three/drei';

/**
 * Scene lighting for the Go board.
 *
 * Uses the same warm three-point setup as chess/checkers for visual
 * consistency, with the shadow frustum widened to cover the larger
 * 19×19 board footprint.
 */
export function GoLighting() {
  return (
    <>
      <ambientLight intensity={0.35} />

      <directionalLight
        position={[6, 14, 6]}
        intensity={1.1}
        color="#fff5e6"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-near={1}
        shadow-camera-far={36}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        shadow-radius={4}
      />

      <directionalLight position={[-5, 9, -3]} intensity={0.35} color="#c4d4ff" />

      <pointLight position={[0, 9, -9]} intensity={0.25} color="#9090ff" />

      <ContactShadows
        position={[0, -0.01, 0]}
        opacity={0.4}
        scale={18}
        blur={3}
        far={6}
        resolution={512}
      />
    </>
  );
}
