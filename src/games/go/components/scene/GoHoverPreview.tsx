import { memo } from 'react';
import type { Stone } from '../../engine/types';
import { CELL_SIZE } from './boardLayout';

/**
 * Props for {@link GoHoverPreview}.
 *
 * The component is always mounted inside the scene — visibility is controlled
 * by the `visible` flag instead of conditional rendering. This avoids the cost
 * of re-creating the geometry/material every time the user moves the mouse.
 */
interface GoHoverPreviewProps {
  /** World X position of the hovered intersection. */
  x: number;
  /** World Z position of the hovered intersection. */
  z: number;
  /** Color to preview — the stone of the player whose turn it is. */
  color: Stone;
  /** Whether the preview should be rendered this frame. */
  visible: boolean;
}

/** Matches the dimensions used by {@link GoStone}. */
const STONE_RADIUS = CELL_SIZE * 0.46;
const STONE_HEIGHT = CELL_SIZE * 0.32;

const WHITE_COLOR = '#f5f5f5';
const BLACK_COLOR = '#141414';

/** Opacity for the ghost stone — should read clearly without hiding the grid. */
const PREVIEW_OPACITY = 0.45;

/**
 * Semi-transparent "ghost" stone that follows the cursor to show where the
 * next stone will be placed.
 *
 * Rendered above the board surface at the given world coordinates. The
 * component is permanently mounted by {@link GoScene} and toggled via the
 * `visible` prop — `React.memo` would not help here because the props change
 * on every pointer-move event by design.
 *
 * @param props - Component props; see {@link GoHoverPreviewProps}.
 *
 * @example
 * ```tsx
 * <GoHoverPreview
 *   x={wx}
 *   z={wz}
 *   color={turn}
 *   visible={hoveredPoint !== null && interactive}
 * />
 * ```
 */
function GoHoverPreviewImpl({ x, z, color, visible }: GoHoverPreviewProps) {
  if (!visible) return null;
  const stoneColor = color === 'b' ? BLACK_COLOR : WHITE_COLOR;
  return (
    <group
      position={[x, STONE_HEIGHT * 0.5, z]}
      scale={[1, STONE_HEIGHT / (STONE_RADIUS * 2), 1]}
    >
      <mesh>
        <sphereGeometry args={[STONE_RADIUS, 20, 14]} />
        <meshStandardMaterial
          color={stoneColor}
          roughness={0.25}
          metalness={0.05}
          transparent
          opacity={PREVIEW_OPACITY}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/**
 * Memoised ghost stone — re-renders only when position, colour, or
 * visibility change. Since the parent passes fresh props on every pointer
 * move, the default shallow comparison produces the desired "render only
 * the preview, not the rest of the scene" behaviour.
 */
export const GoHoverPreview = memo(GoHoverPreviewImpl);
