import { Environment } from '@react-three/drei';

/** Scene environment for checkers (HDRI + fog) */
export function CheckersEnvironment() {
  return (
    <>
      <Environment preset="night" background={false} />
      <fog attach="fog" args={['#09090b', 15, 40]} />
    </>
  );
}
