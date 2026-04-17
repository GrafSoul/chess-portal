import { Environment } from '@react-three/drei';

/**
 * Scene environment for the Go 3D view.
 *
 * Matches the portal's house style (warm night HDRI + subtle fog) so the
 * Go board sits in the same ambient world as chess and checkers.
 */
export function GoEnvironment() {
  return (
    <>
      <Environment preset="night" background={false} />
      <fog attach="fog" args={['#09090b', 18, 48]} />
    </>
  );
}
