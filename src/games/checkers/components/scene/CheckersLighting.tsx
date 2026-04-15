import { ContactShadows } from '@react-three/drei';

/** Scene lighting for checkers — warm, same setup as chess */
export function CheckersLighting() {
  return (
    <>
      <ambientLight intensity={0.35} />

      <directionalLight
        position={[5, 12, 5]}
        intensity={1.1}
        color="#fff5e6"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-camera-near={1}
        shadow-camera-far={30}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        shadow-radius={4}
      />

      <directionalLight
        position={[-4, 8, -2]}
        intensity={0.35}
        color="#c4d4ff"
      />

      <pointLight
        position={[0, 8, -8]}
        intensity={0.25}
        color="#9090ff"
      />

      <ContactShadows
        position={[0, -0.01, 0]}
        opacity={0.4}
        scale={14}
        blur={3}
        far={5}
        resolution={512}
      />
    </>
  );
}
