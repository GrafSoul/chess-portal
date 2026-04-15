import { useMemo } from 'react';
import * as THREE from 'three';
import { useCheckersTutorialStore } from '../../stores/useCheckersTutorialStore';
import { squareTo3D } from '../../utils/boardCoords';
import type { Square } from '../../engine/types';
import type { CheckersTutorialArrow } from '../../stores/useCheckersTutorialStore';

/** Y offset just above the board surface — avoids z-fighting with squares. */
const HIGHLIGHT_Y = 0.02;

/** Y offset for arrows — slightly higher so they float above highlights. */
const ARROW_Y = 0.05;

/** Default arrow color if the chapter doesn't specify one. */
const DEFAULT_ARROW_COLOR = '#7c5cff';

/**
 * Tutorial overlay — renders chapter-specific visual hints on top of the 3D
 * checkers board while tutorial mode is active.
 *
 * Contains two layers:
 *  - Highlights: soft tinted square outlines for relevant squares.
 *  - Arrows: directional indicators for guiding attention.
 *
 * All overlays are world-space meshes rendered in the same R3F tree.
 */
export function CheckersTutorialOverlay() {
  const isActive = useCheckersTutorialStore((s) => s.isActive);
  const highlights = useCheckersTutorialStore((s) => s.highlights);
  const arrows = useCheckersTutorialStore((s) => s.arrows);

  if (!isActive) return null;

  return (
    <group>
      {highlights.map((sq) => (
        <HighlightSquare key={`hl-${sq}`} square={sq} />
      ))}
      {arrows.map((a, i) => (
        <ArrowMesh key={`arrow-${i}-${a.from}-${a.to}`} arrow={a} />
      ))}
    </group>
  );
}

interface HighlightSquareProps {
  /** Square to highlight */
  square: Square;
}

/**
 * Soft highlight for a single square — a semi-transparent glowing plane
 * laid flat on the board.
 */
function HighlightSquare({ square }: HighlightSquareProps) {
  const [x, , z] = squareTo3D(square);
  return (
    <mesh
      position={[x, HIGHLIGHT_Y, z]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[0.92, 0.92]} />
      <meshBasicMaterial
        color="#7c5cff"
        transparent
        opacity={0.35}
        depthWrite={false}
      />
    </mesh>
  );
}

interface ArrowMeshProps {
  /** Arrow definition */
  arrow: CheckersTutorialArrow;
}

/**
 * A simple directional arrow from one square to another — a flat ribbon
 * with an arrowhead cone at the destination end, laid on the board.
 */
function ArrowMesh({ arrow }: ArrowMeshProps) {
  const color = arrow.color ?? DEFAULT_ARROW_COLOR;

  const { shaftPosition, shaftLength, shaftRotation, headPosition, headQuaternion } =
    useMemo(() => {
      const [fx, , fz] = squareTo3D(arrow.from);
      const [tx, , tz] = squareTo3D(arrow.to);

      const dx = tx - fx;
      const dz = tz - fz;
      const distance = Math.hypot(dx, dz) || 1;
      const nx = dx / distance;
      const nz = dz / distance;

      // Leave a gap at the destination end for the arrowhead
      const headLength = 0.3;
      const length = Math.max(0.2, distance - headLength);

      // Midpoint of the shaft
      const midX = fx + nx * (length / 2);
      const midZ = fz + nz * (length / 2);

      // Arrowhead sits near the destination end of the shaft
      const headX = fx + nx * (distance - headLength / 2);
      const headZ = fz + nz * (distance - headLength / 2);

      // Shaft: a box whose long axis is its local Z. Rotate around Y so +Z
      // aligns with the (nx, 0, nz) direction.
      const shaftAngle = Math.atan2(nx, nz);

      // Head: a cone with apex at +Y. Build a quaternion that maps +Y to
      // the horizontal direction vector (nx, 0, nz).
      const headQ = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(nx, 0, nz),
      );

      return {
        shaftPosition: new THREE.Vector3(midX, ARROW_Y, midZ),
        shaftLength: length,
        shaftRotation: new THREE.Euler(0, shaftAngle, 0),
        headPosition: new THREE.Vector3(headX, ARROW_Y, headZ),
        headQuaternion: headQ,
      };
    }, [arrow.from, arrow.to]);

  return (
    <group>
      {/* Shaft — a flat thin box oriented along the arrow direction */}
      <mesh position={shaftPosition} rotation={shaftRotation}>
        <boxGeometry args={[0.12, 0.02, shaftLength]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} />
      </mesh>
      {/* Head — flattened cone oriented via quaternion to point at the target */}
      <mesh position={headPosition} quaternion={headQuaternion}>
        <coneGeometry args={[0.2, 0.3, 4]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}
