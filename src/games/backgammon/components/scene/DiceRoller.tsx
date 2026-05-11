/**
 * Orchestrates the Rapier physics world for backgammon dice rolling.
 *
 * Wraps `<Physics>` from `@react-three/rapier` and composes:
 * - A static board surface collider (matches the visual board dimensions).
 * - Four tray wall colliders forming a rolling area on the right side.
 * - The interactive `<DiceCup>` that holds and releases the two dice.
 *
 * Physics is only active (non-paused) when dice are spilling. Gravity
 * is set to -20 for snappy settle behavior.
 *
 * @example
 * ```tsx
 * // In BackgammonScene — visible while rolling or choosing
 * {(gameStatus === 'rolling' || gameStatus === 'choosing') && (
 *   <DiceRoller
 *     gameStatus={gameStatus}
 *     onDiceSettled={onDiceSettled}
 *   />
 * )}
 * ```
 */

import { memo } from 'react';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import { DiceCup } from './DiceCup';
import type { GameStatus } from '../../engine/types';

/** Props for {@link DiceRoller}. */
interface DiceRollerProps {
  /** Current game status — determines cup visibility and physics pause state. */
  gameStatus: GameStatus;
  /**
   * Forwarded to {@link DiceCup} once both dice have settled.
   *
   * @param values - The two settled die face values.
   */
  onDiceSettled: (values: [number, number]) => void;
}

/**
 * Board surface static collider — flat box matching the visual board.
 * Top face at Y ≈ 0.075 (BOARD_SURFACE_Y) so dice land on the visible surface.
 */
function BoardCollider() {
  return (
    <RigidBody type="fixed" position={[0, 0, 0]}>
      {/* 18×0.1×16 box covers board + tray area, top at Y=0.105 (visual field top) */}
      <CuboidCollider args={[9, 0.05, 8]} position={[0, 0.055, 0]} />
    </RigidBody>
  );
}

/**
 * Four invisible tray walls that contain rolling dice on the right side.
 * The tray is centered at approximately X=7, Z=0.
 */
function TrayWalls() {
  const cx = 0;   // centered on board
  const cz = 0;
  const hw = 4.5; // half-width — spans center area of board
  const hd = 5.0; // half-depth — matches BOARD_DEPTH/2 - margin
  const wallH = 1.5; // tall enough to catch dice falling from elevated cup
  const wallT = 0.08;

  return (
    <RigidBody type="fixed">
      {/* Far wall (−Z) */}
      <CuboidCollider
        args={[hw, wallH, wallT]}
        position={[cx, wallH, cz - hd]}
      />
      {/* Near wall (+Z) */}
      <CuboidCollider
        args={[hw, wallH, wallT]}
        position={[cx, wallH, cz + hd]}
      />
      {/* Left wall (−X) */}
      <CuboidCollider
        args={[wallT, wallH, hd]}
        position={[cx - hw, wallH, cz]}
      />
      {/* Right wall (+X) */}
      <CuboidCollider
        args={[wallT, wallH, hd]}
        position={[cx + hw, wallH, cz]}
      />
    </RigidBody>
  );
}

/**
 * Physics world + board collider + tray walls + interactive dice cup.
 *
 * @param props - See {@link DiceRollerProps}.
 * @returns The full physics subtree for dice rolling.
 */
export const DiceRoller = memo(function DiceRoller({
  gameStatus,
  onDiceSettled,
}: DiceRollerProps) {
  const isRolling = gameStatus === 'rolling';
  const isActive = gameStatus === 'rolling';

  return (
    <Physics gravity={[0, -20, 0]} paused={!isRolling}>
      <BoardCollider />
      <TrayWalls />
      <DiceCup isActive={isActive} onDiceSettled={onDiceSettled} />
    </Physics>
  );
});
