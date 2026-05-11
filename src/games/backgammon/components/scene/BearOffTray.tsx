/**
 * Bear-off tray — a vertical strip on the right side of the board that holds
 * borne-off stones for one color.
 *
 * Renders:
 * - A thin rectangular tray body (the slot).
 * - Up to 15 flat "puck" cylinders stacked vertically.
 * - An HTML count badge when any stones have been borne off.
 *
 * Memoized — re-renders only when `count` changes.
 *
 * @example
 * ```tsx
 * <BearOffTray color="w" count={3} position={new Vector3(8, 0, 2)} />
 * ```
 */

import { memo, useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Vector3 } from 'three';
import {
  BEAR_OFF_STONE_RADIUS,
  BEAR_OFF_STONE_HEIGHT,
  BOARD_SURFACE_Y,
} from './boardLayout';
import type { StoneColor } from '../../engine/types';

/** Props for `BearOffTray`. */
interface BearOffTrayProps {
  /** Color of the borne-off stones in this tray. */
  color: StoneColor;
  /** Number of stones borne off so far (0..15). */
  count: number;
  /** World position of the tray center. */
  position: Vector3;
}

/** Tray slab dimensions. */
const TRAY_WIDTH = 0.75;
const TRAY_DEPTH = 3.5;
const TRAY_HEIGHT = 0.1;

/** Vertical spacing between borne-off pucks. */
const PUCK_SPACING = BEAR_OFF_STONE_HEIGHT + 0.02;

/** Maximum stones in one tray (full game). */
const MAX_STONES = 15;

/** White tray color. */
const WHITE_COLOR = '#F0EAD6';

/** Black tray color. */
const BLACK_COLOR = '#2A2A2E';

/** Tray wood color. */
const TRAY_COLOR = '#5A3A1A';

/**
 * Bear-off tray showing borne-off stones for one color.
 *
 * @param props - See {@link BearOffTrayProps}.
 * @returns A group containing the tray slab and stacked puck meshes.
 */
export const BearOffTray = memo(
  function BearOffTray({ color, count, position }: BearOffTrayProps) {
    const trayGeometry = useMemo(
      () => new THREE.BoxGeometry(TRAY_WIDTH, TRAY_HEIGHT, TRAY_DEPTH),
      [],
    );

    const trayMaterial = useMemo(
      () =>
        new THREE.MeshStandardMaterial({
          color: TRAY_COLOR,
          roughness: 0.8,
          metalness: 0.0,
        }),
      [],
    );

    const puckGeometry = useMemo(
      () =>
        new THREE.CylinderGeometry(
          BEAR_OFF_STONE_RADIUS,
          BEAR_OFF_STONE_RADIUS,
          BEAR_OFF_STONE_HEIGHT,
          20,
        ),
      [],
    );

    const puckMaterial = useMemo(
      () =>
        new THREE.MeshStandardMaterial({
          color: color === 'w' ? WHITE_COLOR : BLACK_COLOR,
          roughness: color === 'w' ? 0.4 : 0.5,
          metalness: 0.0,
        }),
      [color],
    );

    // Clamp rendered count to the maximum.
    const renderCount = Math.min(count, MAX_STONES);

    // Pucks are stacked from the bottom of the tray upward.
    const puckBaseY = BOARD_SURFACE_Y + TRAY_HEIGHT / 2 + BEAR_OFF_STONE_HEIGHT / 2 + 0.01;

    // Label sits above the tray.
    const labelY = puckBaseY + renderCount * PUCK_SPACING + 0.2;

    return (
      <group position={position}>
        {/* Tray slab */}
        <mesh
          geometry={trayGeometry}
          material={trayMaterial}
          position={[0, BOARD_SURFACE_Y + TRAY_HEIGHT / 2, 0]}
          receiveShadow
        />

        {/* Stacked pucks */}
        {Array.from({ length: renderCount }, (_, i) => (
          <mesh
            key={i}
            geometry={puckGeometry}
            material={puckMaterial}
            position={[0, puckBaseY + i * PUCK_SPACING, 0]}
            castShadow
          />
        ))}

        {/* Count badge */}
        {count > 0 && (
          <Html
            position={[0, labelY, 0]}
            center
            distanceFactor={10}
            style={{ pointerEvents: 'none' }}
          >
            <div
              style={{
                background: color === 'w' ? WHITE_COLOR : BLACK_COLOR,
                color: color === 'w' ? '#3A2E00' : '#F0EAD6',
                fontSize: '10px',
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: '4px',
                lineHeight: 1.3,
                userSelect: 'none',
              }}
            >
              {count}
            </div>
          </Html>
        )}
      </group>
    );
  },
  (prev, next) =>
    prev.color === next.color &&
    prev.count === next.count &&
    prev.position.equals(next.position),
);
