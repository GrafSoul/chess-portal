/**
 * Root 3D scene for Long Backgammon.
 *
 * Composes lighting, the static board, 24 stone stacks, bear-off trays, and
 * the physics-based {@link DiceRoller} into a single R3F scene tree. All game
 * state is read from {@link useBackgammonStore} so child components receive
 * only the slices they need.
 *
 * Click routing (Sprint 3):
 * - During `'choosing'` with `selectedFrom === null`: clicking a point with
 *   own-color stones calls `selectFrom`.
 * - During `'choosing'` with a source selected: clicking a legal destination
 *   calls `executeSubMove` with the smallest available die. Clicking an
 *   invalid target deselects.
 * - During other statuses: clicks are silently ignored.
 *
 * @example
 * ```tsx
 * // Mount inside a React-Three-Fiber <Canvas>
 * <Canvas>
 *   <BackgammonScene />
 * </Canvas>
 * ```
 */

import { useMemo, useCallback } from 'react';
import { ContactShadows } from '@react-three/drei';
import { Vector3 } from 'three';
import { BackgammonBoard } from './BackgammonBoard';
import { StoneStack } from './StoneStack';
import { BearOffTray } from './BearOffTray';
import { DiceRoller } from './DiceRoller';
import { BackgammonTutorialOverlay } from './BackgammonTutorialOverlay';
import { useBackgammonStore } from '../../stores/useBackgammonStore';
import { useBackgammonDisplayedBoardState } from '../../hooks/useBackgammonDisplayedBoardState';
import { generateSubMoves } from '../../engine/moveGenerator';
import {
  ALL_POINTS,
  BEAR_OFF_X,
  BEAR_OFF_WHITE_Z,
  BEAR_OFF_BLACK_Z,
  BOARD_SURFACE_Y,
} from './boardLayout';
import type { PointIndex, PointState } from '../../engine/types';

/** World position of the white bear-off tray. */
const WHITE_TRAY_POSITION = new Vector3(BEAR_OFF_X, BOARD_SURFACE_Y, BEAR_OFF_WHITE_Z);

/** World position of the black bear-off tray. */
const BLACK_TRAY_POSITION = new Vector3(BEAR_OFF_X, BOARD_SURFACE_Y, BEAR_OFF_BLACK_Z);

/**
 * Root backgammon 3D scene — lighting, board, stones, trays, dice roller.
 *
 * @returns The full scene subtree to be rendered inside an R3F `<Canvas>`.
 */
export function BackgammonScene() {
  // ── Display-layer data (tutorial or live game) ─────────────────────────
  const { board, bornOff, selectedFrom, isInteractive, tutorialActive } =
    useBackgammonDisplayedBoardState();

  // ── Live game mechanics (always from the real store) ───────────────────
  const gameStatus = useBackgammonStore((s) => s.gameStatus);
  const dice = useBackgammonStore((s) => s.dice);
  const onDiceSettled = useBackgammonStore((s) => s.onDiceSettled);

  /**
   * Compute the set of legal destination point indices for the current
   * selection + remaining dice. Used to determine if a click is a valid move.
   */
  const legalDestinations = useMemo<Set<PointIndex>>(() => {
    if (gameStatus !== 'choosing' || selectedFrom === null || !dice) {
      return new Set();
    }

    const state = useBackgammonStore.getState();
    const dests = new Set<PointIndex>();

    for (const die of new Set(dice.remaining)) {
      const moves = generateSubMoves(state, die, state.board as PointState[], state.headTakenThisTurn);
      for (const move of moves) {
        if (move.from === selectedFrom && move.to !== 'off') {
          dests.add(move.to as PointIndex);
        }
      }
    }

    return dests;
  }, [gameStatus, selectedFrom, dice]);

  /**
   * Handle a point click from any StoneStack.
   *
   * Reads ALL game state from the Zustand store at click time via
   * `getState()` so the callback reference is stable and never suffers
   * from stale-closure issues (StoneStack is memoized and may skip
   * re-renders when only `onPointClick` changes).
   *
   * Sprint 3 logic:
   * - Only acts during `'choosing'` status.
   * - If no source selected and clicked point has own stones → select it.
   * - If source selected and clicked point is a legal dest → execute sub-move
   *   using the smallest available die.
   * - If source selected and clicked point is not legal → re-select or deselect.
   */
  const handlePointClick = useCallback(
    (pointIndex: PointIndex) => {
      // Tutorial mode — ignore all clicks
      if (tutorialActive) return;

      // Read fresh state at click time — avoids stale closure
      const store = useBackgammonStore.getState();
      const {
        gameStatus: status,
        turn: currentTurn,
        selectedFrom: currentSelected,
        dice: currentDice,
        board: currentBoard,
        isAIThinking,
        headTakenThisTurn,
      } = store;

      // Only act during choosing phase and not during AI turn
      if (isAIThinking || status !== 'choosing') return;

      // ── No source selected → try to select this point ─────────────
      if (currentSelected === null) {
        const pt = currentBoard[pointIndex];
        if (pt && pt.color === currentTurn && pt.count > 0) {
          store.selectFrom(pointIndex);
        }
        return;
      }

      // ── Re-click the same point → deselect ────────────────────────
      if (pointIndex === currentSelected) {
        store.selectFrom(null);
        return;
      }

      // ── Check if this point is a legal destination ─────────────────
      if (currentDice) {
        for (const die of [...new Set(currentDice.remaining)].sort((a, b) => a - b)) {
          const moves = generateSubMoves(
            store, die, currentBoard as PointState[], headTakenThisTurn,
          );
          const isLegal = moves.some(
            (m) => m.from === currentSelected && m.to === pointIndex,
          );
          if (isLegal) {
            store.executeSubMove(pointIndex, die);
            return;
          }
        }
      }

      // ── Not a legal dest → re-select own stone or deselect ────────
      const pt = currentBoard[pointIndex];
      if (pt && pt.color === currentTurn && pt.count > 0) {
        store.selectFrom(pointIndex);
      } else {
        store.selectFrom(null);
      }
    },
    [tutorialActive],
  );

  return (
    <>
      {/* Lighting — mirrors GoLighting warm three-point setup */}
      <ambientLight intensity={0.35} />

      <directionalLight
        position={[6, 14, 6]}
        intensity={1.1}
        color="#fff5e6"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        shadow-radius={4}
      />

      <directionalLight position={[-5, 9, -3]} intensity={0.35} color="#c4d4ff" />
      <pointLight position={[0, 9, -9]} intensity={0.25} color="#9090ff" />

      <ContactShadows
        position={[0, -0.01, 0]}
        opacity={0.35}
        scale={20}
        blur={3}
        far={6}
        resolution={512}
      />

      {/* Static board geometry */}
      <BackgammonBoard />

      {/* 24 stone stacks — one per board point */}
      {ALL_POINTS.map((pointIndex) => (
        <StoneStack
          key={pointIndex}
          pointIndex={pointIndex}
          state={board[pointIndex]}
          selectedFrom={selectedFrom}
          isLegalDest={legalDestinations.has(pointIndex)}
          onPointClick={handlePointClick}
        />
      ))}

      {/* Bear-off trays */}
      <BearOffTray color="w" count={bornOff.w} position={WHITE_TRAY_POSITION} />
      <BearOffTray color="b" count={bornOff.b} position={BLACK_TRAY_POSITION} />

      {/* Tutorial overlay — highlight rings and arrows; no-op when inactive */}
      <BackgammonTutorialOverlay />

      {/* Physics dice roller — suppressed during tutorial to keep scene clean */}
      {!tutorialActive && (gameStatus === 'rolling' || gameStatus === 'choosing') && (
        <DiceRoller gameStatus={gameStatus} onDiceSettled={onDiceSettled} />
      )}
    </>
  );
}
