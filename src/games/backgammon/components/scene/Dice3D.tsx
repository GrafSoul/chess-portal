/**
 * A single physics-driven die rendered as a cube with pip markings.
 *
 * The die body is a Rapier `RigidBody` with a `cuboid` collider. Six
 * {@link DicePip} child groups are rotated to face each side. Face layout:
 * - +Y face = 1   | -Y face = 6
 * - +Z face = 2   | -Z face = 5
 * - +X face = 3   | -X face = 4
 *
 * Gravity scale is controlled externally via the `gravityScale` prop so the
 * cup can hold the dice suspended before releasing them.
 *
 * @example
 * ```tsx
 * const dieRef = useRef<RapierRigidBody>(null);
 * <Dice3D bodyRef={dieRef} gravityScale={0} />
 * ```
 */

import { memo } from 'react';
import { RigidBody } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import type { RefObject } from 'react';
import { DicePip } from './DicePip';

/** Half-size of the die box in world units. */
const HALF = 0.3;

/** Face configurations: [normal direction, pip offset axis direction, face value]. */
const FACES: Array<{
  face: number;
  position: [number, number, number];
  rotation: [number, number, number];
}> = [
  // +Y = 1
  { face: 1, position: [0, HALF + 0.001, 0], rotation: [-Math.PI / 2, 0, 0] },
  // -Y = 6
  { face: 6, position: [0, -(HALF + 0.001), 0], rotation: [Math.PI / 2, 0, 0] },
  // +Z = 2
  { face: 2, position: [0, 0, HALF + 0.001], rotation: [0, 0, 0] },
  // -Z = 5
  { face: 5, position: [0, 0, -(HALF + 0.001)], rotation: [0, Math.PI, 0] },
  // +X = 3
  { face: 3, position: [HALF + 0.001, 0, 0], rotation: [0, Math.PI / 2, 0] },
  // -X = 4
  { face: 4, position: [-(HALF + 0.001), 0, 0], rotation: [0, -Math.PI / 2, 0] },
];

/** Props for {@link Dice3D}. */
interface Dice3DProps {
  /** Ref to the underlying Rapier rigid body for physics queries. */
  bodyRef: RefObject<RapierRigidBody>;
  /**
   * Initial gravity scale passed to Rapier on body creation.
   * After creation gravity is controlled imperatively via `body.setGravityScale()`.
   * Keep this prop CONSTANT (never change it) — any change triggers Rapier's
   * `useUpdateRigidBodyOptions` effect which calls `setTranslation` and would
   * teleport the body back to its initial position, cancelling physics motion.
   */
  gravityScale?: number;
  /**
   * Initial world position — passed ONCE to Rapier on body creation.
   * Must be a STABLE array reference (use `useMemo`) to prevent Dice3D.memo
   * from detecting a change and causing a re-render that resets physics state.
   */
  position?: [number, number, number];
  /** Die body color (ivory by default). */
  color?: string;
}

/**
 * Physics-driven backgammon die with pip markings.
 *
 * Visibility is managed externally via a parent Three.js `<group visible={…}>`.
 * Do NOT add a `visible` prop here — toggling it would re-render this component,
 * triggering Rapier's reconciliation and resetting the body's world translation.
 *
 * @param props - See {@link Dice3DProps}.
 * @returns A Rapier RigidBody wrapping the die mesh and pip children.
 */
export const Dice3D = memo(function Dice3D({
  bodyRef,
  gravityScale = 1,
  position = [0, 2, 0],
  color = '#fffff0',
}: Dice3DProps) {
  return (
    <RigidBody
      ref={bodyRef}
      colliders="cuboid"
      gravityScale={gravityScale}
      position={position}
      restitution={0.05}
      friction={0.9}
      linearDamping={1.5}
      angularDamping={0.12}
      ccd
    >
      {/* Die cube body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial
          color={color}
          roughness={0.35}
          metalness={0.05}
        />
      </mesh>

      {/* Pip dots on each face */}
      {FACES.map(({ face, position: facePos, rotation }) => (
        <group key={face} position={facePos} rotation={rotation}>
          <DicePip face={face} position={[0, 0, 0]} />
        </group>
      ))}
    </RigidBody>
  );
});
