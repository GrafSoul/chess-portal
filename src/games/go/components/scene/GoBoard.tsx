import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import type { BoardSize, Point, Stone } from '../../engine/types';
import { BOARD_CONFIGS } from '../../config/boardSizes';
import {
  BOARD_PADDING,
  BOARD_SURFACE_Y,
  CELL_SIZE,
  boardWorldSize,
  pointToWorld,
} from './boardLayout';
import { GoIntersection } from './GoIntersection';

/**
 * Props for {@link GoBoard}.
 *
 * During the scoring phase `GoScene` passes `lastPoint = null` and
 * `koPoint = null` to suppress those overlays, and passes a populated
 * `territoryMap` to show ownership markers. Outside scoring, `territoryMap`
 * is omitted (defaults to `null`) and no territory markers are rendered.
 */
interface GoBoardProps {
  /** Board dimension. Determines grid size, star-point positions, and labels. */
  boardSize: BoardSize;
  /**
   * Last played point for a subtle indigo ring marker, or `null`.
   * Should be set to `null` during the scoring phase to avoid visual clutter.
   */
  lastPoint: Point | null;
  /**
   * Forbidden ko recapture point for the current turn, shown as a red square.
   * `null` when no ko is active, or during the scoring phase.
   */
  koPoint: Point | null;
  /** When `false`, intersection hit-targets are disabled and clicks are ignored. */
  interactive: boolean;
  /** Called with the grid point when the player clicks an intersection. */
  onIntersectionClick: (point: Point) => void;
  /**
   * Territory ownership map produced by `findTerritories`.
   * Keyed by `"x,y"` → `'b'`, `'w'`, or `'neutral'`. Only `'b'` and `'w'`
   * entries render a small filled square; `'neutral'` entries are skipped.
   * Defaults to `null` — no territory markers outside the scoring phase.
   */
  territoryMap?: Map<string, Stone | 'neutral'> | null;
}

/** Column labels a–t (skipping 'i' would be more traditional, but 'a'..'s' is fine for 19). */
const FILE_CHARS = 'abcdefghjklmnopqrst'; // 19 chars, skips 'i' (Go convention)

const BOARD_COLOR = '#d9a86b';
const BOARD_RIM_COLOR = '#7a4a1f';
const GRID_COLOR = '#1f140a';
const LABEL_COLOR = '#5a3a20';
const LAST_MOVE_COLOR = '#6366f1';
const STAR_COLOR = '#1f140a';
const KO_COLOR = '#f43f5e';

const GRID_THICKNESS = 0.015;
const GRID_LIFT = 0.002;
const LABEL_FONT_SIZE = 0.18;

/** Territory marker colors shown during the scoring phase. */
const TERRITORY_BLACK_COLOR = '#1a1a1a';
const TERRITORY_WHITE_COLOR = '#e8e8e8';
/** Size of the small square territory marker relative to the cell. */
const TERRITORY_MARKER_SIZE = CELL_SIZE * 0.22;

/**
 * The 3D wooden Go board.
 *
 * Renders the board surface, rim, grid lines, star points (hoshi), coordinate
 * labels (files a–t top/bottom, ranks 1–N left/right following Go convention
 * with 'i' skipped), invisible intersection hit-targets, and optional overlays:
 *
 * - **Last-move ring** — indigo ring above the most recently played stone.
 * - **Ko marker** — semi-transparent red square on the forbidden recapture point.
 * - **Territory markers** — small dark/light squares on empty intersections
 *   during the scoring phase, driven by `territoryMap`.
 *
 * The intersection hit-targets are always rendered but only respond to clicks
 * when `interactive` is `true`. This avoids unmounting/remounting the hit
 * geometry when interactivity changes (e.g. while the AI is thinking).
 *
 * @param props - Component props; see {@link GoBoardProps} for field details.
 *
 * @example
 * ```tsx
 * <GoBoard
 *   boardSize={19}
 *   lastPoint={null}
 *   koPoint={null}
 *   interactive={true}
 *   onIntersectionClick={(p) => store.playAt(p)}
 *   territoryMap={scoringPhase ? territoryMap : null}
 * />
 * ```
 */
export function GoBoard({
  boardSize,
  lastPoint,
  koPoint,
  interactive,
  onIntersectionClick,
  territoryMap = null,
}: GoBoardProps) {
  const world = boardWorldSize(boardSize);
  const half = (boardSize - 1) / 2;
  const starPoints = BOARD_CONFIGS[boardSize].starPoints;

  const intersections = useMemo(() => {
    const list: { point: Point; x: number; z: number }[] = [];
    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        const [wx, wz] = pointToWorld({ x, y }, boardSize);
        list.push({ point: { x, y }, x: wx, z: wz });
      }
    }
    return list;
  }, [boardSize]);

  const lineExtent = (boardSize - 1) * CELL_SIZE;

  return (
    <group>
      {/* Wooden board surface */}
      <mesh
        position={[0, BOARD_SURFACE_Y - 0.05, 0]}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[world, 0.1, world]} />
        <meshStandardMaterial color={BOARD_COLOR} roughness={0.7} metalness={0.05} />
      </mesh>

      {/* Darker rim to frame the board */}
      <mesh position={[0, BOARD_SURFACE_Y - 0.1, 0]}>
        <boxGeometry args={[world + 0.15, 0.08, world + 0.15]} />
        <meshStandardMaterial
          color={BOARD_RIM_COLOR}
          roughness={0.85}
          metalness={0}
        />
      </mesh>

      {/* Grid lines — vertical (columns) */}
      {Array.from({ length: boardSize }, (_, i) => {
        const x = (i - half) * CELL_SIZE;
        return (
          <mesh
            key={`col-${i}`}
            position={[x, BOARD_SURFACE_Y + GRID_LIFT, 0]}
          >
            <boxGeometry args={[GRID_THICKNESS, 0.001, lineExtent]} />
            <meshBasicMaterial color={GRID_COLOR} />
          </mesh>
        );
      })}

      {/* Grid lines — horizontal (rows) */}
      {Array.from({ length: boardSize }, (_, i) => {
        const z = (i - half) * CELL_SIZE;
        return (
          <mesh
            key={`row-${i}`}
            position={[0, BOARD_SURFACE_Y + GRID_LIFT, z]}
          >
            <boxGeometry args={[lineExtent, 0.001, GRID_THICKNESS]} />
            <meshBasicMaterial color={GRID_COLOR} />
          </mesh>
        );
      })}

      {/* Star points (hoshi) */}
      {starPoints.map((p) => {
        const [wx, wz] = pointToWorld(p, boardSize);
        return (
          <mesh
            key={`hoshi-${p.x}-${p.y}`}
            position={[wx, BOARD_SURFACE_Y + GRID_LIFT + 0.001, wz]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[CELL_SIZE * 0.11, 16]} />
            <meshBasicMaterial color={STAR_COLOR} />
          </mesh>
        );
      })}

      {/* Coordinate labels (files on top & bottom, ranks on left & right) */}
      {Array.from({ length: boardSize }, (_, i) => {
        const x = (i - half) * CELL_SIZE;
        const file = FILE_CHARS[i] ?? '?';
        const edge = lineExtent / 2 + BOARD_PADDING * 0.55;
        return (
          <group key={`label-file-${i}`}>
            <Text
              position={[x, BOARD_SURFACE_Y + 0.005, -edge]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={LABEL_FONT_SIZE}
              color={LABEL_COLOR}
              anchorX="center"
              anchorY="middle"
            >
              {file}
            </Text>
            <Text
              position={[x, BOARD_SURFACE_Y + 0.005, edge]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={LABEL_FONT_SIZE}
              color={LABEL_COLOR}
              anchorX="center"
              anchorY="middle"
            >
              {file}
            </Text>
          </group>
        );
      })}
      {Array.from({ length: boardSize }, (_, i) => {
        const z = (i - half) * CELL_SIZE;
        const rank = String(boardSize - i);
        const edge = lineExtent / 2 + BOARD_PADDING * 0.55;
        return (
          <group key={`label-rank-${i}`}>
            <Text
              position={[-edge, BOARD_SURFACE_Y + 0.005, z]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={LABEL_FONT_SIZE}
              color={LABEL_COLOR}
              anchorX="center"
              anchorY="middle"
            >
              {rank}
            </Text>
            <Text
              position={[edge, BOARD_SURFACE_Y + 0.005, z]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={LABEL_FONT_SIZE}
              color={LABEL_COLOR}
              anchorX="center"
              anchorY="middle"
            >
              {rank}
            </Text>
          </group>
        );
      })}

      {/* Ko marker — small red square to warn about the forbidden recapture */}
      {koPoint &&
        (() => {
          const [wx, wz] = pointToWorld(koPoint, boardSize);
          return (
            <mesh
              position={[wx, BOARD_SURFACE_Y + 0.01, wz]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[CELL_SIZE * 0.42, CELL_SIZE * 0.42]} />
              <meshBasicMaterial
                color={KO_COLOR}
                transparent
                opacity={0.5}
                depthWrite={false}
              />
            </mesh>
          );
        })()}

      {/* Last-move marker — empty ring drawn above any stone surface */}
      {lastPoint &&
        (() => {
          const [wx, wz] = pointToWorld(lastPoint, boardSize);
          return (
            <mesh
              position={[wx, BOARD_SURFACE_Y + 0.14, wz]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <ringGeometry
                args={[CELL_SIZE * 0.18, CELL_SIZE * 0.26, 32]}
              />
              <meshBasicMaterial
                color={LAST_MOVE_COLOR}
                transparent
                opacity={0.85}
                depthTest={false}
              />
            </mesh>
          );
        })()}

      {/* Territory markers — small squares on empty intersections during scoring */}
      {territoryMap &&
        territoryMap.size > 0 &&
        Array.from(territoryMap.entries()).map(([key, owner]) => {
          if (owner === 'neutral') return null;
          const [sx, sy] = key.split(',').map(Number);
          const [wx, wz] = pointToWorld({ x: sx, y: sy }, boardSize);
          return (
            <mesh
              key={`terr-${key}`}
              position={[wx, BOARD_SURFACE_Y + GRID_LIFT + 0.002, wz]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[TERRITORY_MARKER_SIZE, TERRITORY_MARKER_SIZE]} />
              <meshBasicMaterial
                color={owner === 'b' ? TERRITORY_BLACK_COLOR : TERRITORY_WHITE_COLOR}
                transparent
                opacity={0.7}
                depthWrite={false}
              />
            </mesh>
          );
        })}

      {/* Invisible hit targets */}
      {intersections.map(({ point, x, z }) => (
        <GoIntersection
          key={`hit-${point.x}-${point.y}`}
          point={point}
          x={x}
          z={z}
          interactive={interactive}
          onClick={onIntersectionClick}
        />
      ))}

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.14, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#050505" roughness={1} />
      </mesh>
    </group>
  );
}
