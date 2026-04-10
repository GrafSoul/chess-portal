import { useMemo } from 'react';
import { Text } from '@react-three/drei';

/** Files a–h */
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

/** Ranks 1–8 */
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

/** Label font size in 3D units */
const FONT_SIZE = 0.2;

/** Y position — sits on the board frame, above the frame surface */
const LABEL_Y = 0.001;

/** Distance from board center to label row (halfway between square edge and frame edge) */
const EDGE_OFFSET = 4.2;

/** Color for all labels */
const LABEL_COLOR = '#a09080';

interface LabelData {
  key: string;
  text: string;
  position: [number, number, number];
  rotation: [number, number, number];
}

/**
 * Coordinate labels around the chess board perimeter.
 *
 * Renders file letters (a–h) along the near and far edges, and rank numbers
 * (1–8) along the left and right edges. Labels are placed on the dark frame
 * surrounding the squares.
 */
export function BoardLabels() {
  const labels = useMemo<LabelData[]>(() => {
    const result: LabelData[] = [];

    // File labels (a–h) along the bottom (z = -EDGE_OFFSET) and top (z = +EDGE_OFFSET)
    for (let i = 0; i < 8; i++) {
      const x = i - 3.5;
      result.push({
        key: `file-bottom-${FILES[i]}`,
        text: FILES[i],
        position: [x, LABEL_Y, -EDGE_OFFSET],
        rotation: [-Math.PI / 2, 0, 0],
      });
      result.push({
        key: `file-top-${FILES[i]}`,
        text: FILES[i],
        position: [x, LABEL_Y, EDGE_OFFSET],
        rotation: [-Math.PI / 2, 0, 0],
      });
    }

    // Rank labels (1–8) along the left (x = -EDGE_OFFSET) and right (x = +EDGE_OFFSET)
    for (let i = 0; i < 8; i++) {
      const z = i - 3.5;
      result.push({
        key: `rank-left-${RANKS[i]}`,
        text: RANKS[i],
        position: [-EDGE_OFFSET, LABEL_Y, z],
        rotation: [-Math.PI / 2, 0, 0],
      });
      result.push({
        key: `rank-right-${RANKS[i]}`,
        text: RANKS[i],
        position: [EDGE_OFFSET, LABEL_Y, z],
        rotation: [-Math.PI / 2, 0, 0],
      });
    }

    return result;
  }, []);

  return (
    <group>
      {labels.map(({ key, text, position, rotation }) => (
        <Text
          key={key}
          position={position}
          rotation={rotation}
          fontSize={FONT_SIZE}
          color={LABEL_COLOR}
          anchorX="center"
          anchorY="middle"
          depthOffset={-1}
        >
          {text}
        </Text>
      ))}
    </group>
  );
}
