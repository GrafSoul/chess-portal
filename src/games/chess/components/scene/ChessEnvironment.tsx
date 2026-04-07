import { Environment } from '@react-three/drei';

/** Scene environment (HDRI + fog) */
export function ChessEnvironment() {
  return (
    <>
      <Environment preset="night" background={false} />
      <fog attach="fog" args={['#09090b', 15, 40]} />
    </>
  );
}
