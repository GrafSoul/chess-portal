/**
 * Interactive dice cup for rolling backgammon dice.
 *
 * The cup is a **kinematic** Rapier rigid body with compound colliders
 * (12 wall segments + floor disk). The visual mesh lives INSIDE the
 * kinematic body so Rapier auto-syncs its transform — no manual
 * position/rotation synchronisation.
 *
 * Two dynamic dice float inside with low gravity (0.15). They bounce
 * off the cup walls and each other via standard Rapier collisions.
 * No `setTranslation` is ever called on the dice while they are in
 * the cup — they are fully physics-driven.
 *
 * Phase machine:
 * ```
 * idle → held → flipping → spilled → reading → done
 * ```
 *
 * @example
 * ```tsx
 * <DiceCup
 *   isActive={gameStatus === 'rolling'}
 *   onDiceSettled={([d1, d2]) => store.onDiceSettled([d1, d2])}
 * />
 * ```
 */

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  memo,
  type MutableRefObject,
} from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  RigidBody,
  CuboidCollider,
} from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { Dice3D } from './Dice3D';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Internal phase of the cup animation. */
type CupPhase = 'idle' | 'held' | 'flipping' | 'spilled' | 'reading' | 'done';

/** Props for {@link DiceCup}. */
interface DiceCupProps {
  /** Show the cup only while `true` (i.e. `gameStatus === 'rolling'`). */
  isActive: boolean;
  /**
   * When `true`, the cup automatically flips after a short delay without
   * requiring a pointer click. Used for AI turns so the dice roll
   * autonomously.
   */
  autoRoll?: boolean;
  /**
   * Called once both dice have settled with their face-up values.
   *
   * @param values - Tuple of the two settled die values `[d1, d2]`.
   */
  onDiceSettled: (values: [number, number]) => void;
}

// ---------------------------------------------------------------------------
// Face normals — maps die-local axis to face value
// ---------------------------------------------------------------------------

/** Face normal directions mapped to standard die face values. */
const FACE_NORMALS: Array<{ normal: THREE.Vector3; value: number }> = [
  { normal: new THREE.Vector3(0, 1, 0), value: 1 },
  { normal: new THREE.Vector3(0, -1, 0), value: 6 },
  { normal: new THREE.Vector3(0, 0, 1), value: 2 },
  { normal: new THREE.Vector3(0, 0, -1), value: 5 },
  { normal: new THREE.Vector3(1, 0, 0), value: 3 },
  { normal: new THREE.Vector3(-1, 0, 0), value: 4 },
];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Horizontal plane at cup height for raycasting pointer → XZ position. */
const DRAG_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), -4.0);

/** Rest position of the cup — centre of board, elevated. */
const CUP_REST_POSITION = new THREE.Vector3(0, 5.2, 0);

/**
 * Dice initial Y offsets relative to cup centre, stacked vertically.
 * Bottom die = −0.5 (just above floor), top die = +0.25 (gap between dice).
 * Die half-size = 0.3, so die1 top = −0.2, die2 bottom = −0.05.
 * 0.15 gap prevents Rapier from ejecting dice on spawn.
 */
const DIE_CUP_Y: [number, number] = [-0.5, 0.25];

/** Maximum cup shake angle (radians, per axis). */
const SHAKE_MAX_ANGLE = 0.18;

/** Random rotation amplitude added each frame while held. */
const RATTLE_AMPLITUDE = 0.06;

/**
 * Kinematic body translation shake amplitude (world units).
 * Used as base for dice impulse strength during shake.
 */
const SHAKE_TRANSLATE_AMP = 0.04;

/**
 * Maximum linear speed (magnitude) for dice while inside the cup.
 * Prevents accumulated impulses from building enough speed to tunnel
 * through wall colliders, even with CCD enabled.
 */
const CUP_MAX_DIE_SPEED = 1.8;

/**
 * Maximum radius from cup centre a die can reach (XZ plane).
 * If exceeded, the die is teleported back inside. This is a safety
 * net for edge cases where CCD + velocity clamping still fail.
 * Slightly smaller than wall inner surface (0.82 − 0.10 = 0.72).
 */
const CUP_CONTAINMENT_RADIUS = 0.55;

/** Consecutive "nearly still" frames required before reading face values. */
const SETTLE_FRAME_COUNT = 12;

/** Die centre Y must be below this to be considered "on the board". */
const ON_BOARD_Y = 0.8;

/**
 * Emergency snap timeout in milliseconds — if dice haven't naturally
 * settled within this window, force-snap as a last resort.
 * Uses wall-clock time (not frame count) to be immune to tab throttling.
 */
const EMERGENCY_SNAP_MS = 3000;


/**
 * Gravity scale for dice while inside the cup.
 * 0.5 × world gravity (−20) = effective −10 — dice settle on the cup
 * floor in ~0.25 s which looks snappy. Do NOT use low values like 0.15
 * because dice visibly float for almost a second.
 */
const CUP_DICE_GRAVITY = 0.5;

// ---------------------------------------------------------------------------
// Cup collider geometry — 16 wall segments + floor disk
// ---------------------------------------------------------------------------

/**
 * Number of cuboid wall segments approximating the cup cylinder.
 * 16 segments (vs 12) minimise gaps between walls.
 */
const CUP_WALL_SEGMENTS = 16;

/**
 * Radius for wall collider placement (centre of each wall cuboid).
 *
 * Visual cup: rTop=0.92, rBot=0.78 (avg ≈ 0.85).
 * Wall half-thickness is 0.10, so inner surface = 0.82 − 0.10 = 0.72.
 * Die half-diagonal in XZ: 0.3×√2 ≈ 0.42 → fits comfortably.
 * Two dice stacked vertically both fit within r=0.72.
 */
const CUP_INNER_RADIUS = 0.82;

/** Half-height of each wall cuboid. */
const CUP_WALL_HALF_HEIGHT = 0.85;

/**
 * Half-thickness of each wall cuboid (radial direction).
 * 0.10 (total 0.20) — thick enough to prevent CCD tunneling,
 * thin enough to stay within the visual cylinder walls.
 * Outer edge: 0.82 + 0.10 = 0.92 (matches rTop of visual mesh).
 */
const CUP_WALL_THICKNESS = 0.10;

/**
 * Half-width of each wall segment (tangential direction).
 * Arc per segment = 2π×0.82/16 ≈ 0.322 → half ≈ 0.16.
 * Using 0.22 gives ~1.4× overlap — no gaps between segments.
 */
const CUP_WALL_HALF_WIDTH = 0.22;

/** Cup floor Y offset from body centre. */
const CUP_FLOOR_Y = -0.9;

/** Pre-computed wall collider local positions and rotations. */
const CUP_WALL_COLLIDERS: Array<{
  position: [number, number, number];
  rotation: [number, number, number];
}> = Array.from({ length: CUP_WALL_SEGMENTS }, (_, i) => {
  const angle = (i / CUP_WALL_SEGMENTS) * Math.PI * 2;
  return {
    position: [
      Math.cos(angle) * CUP_INNER_RADIUS,
      0,
      Math.sin(angle) * CUP_INNER_RADIUS,
    ] as [number, number, number],
    rotation: [0, -angle, 0] as [number, number, number],
  };
});

// ---------------------------------------------------------------------------
// Helper: read the face-up value from a rigid body quaternion
// ---------------------------------------------------------------------------

/**
 * Determines which die face points upward.
 *
 * @param body - Rapier rigid body to read.
 * @returns Face value 1–6 currently pointing up.
 */
function readFaceValue(body: RapierRigidBody): number {
  const rot = body.rotation();
  const quat = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w).invert();
  const worldUp = new THREE.Vector3(0, 1, 0).applyQuaternion(quat);

  let bestDot = -Infinity;
  let bestValue = 1;

  for (const { normal, value } of FACE_NORMALS) {
    const dot = worldUp.dot(normal);
    if (dot > bestDot) {
      bestDot = dot;
      bestValue = value;
    }
  }

  return bestValue;
}

/**
 * Snaps a die body rotation to the nearest axis-aligned orientation.
 * Finds which face normal is closest to world +Y, then builds
 * a quaternion that aligns that face exactly upward.
 *
 * @param body - Rapier rigid body to snap.
 */
function snapToNearestFace(body: RapierRigidBody): void {
  const rot = body.rotation();
  const q = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);
  const worldUp = new THREE.Vector3(0, 1, 0);

  // Find which face normal is most aligned with world up
  let bestDot = -Infinity;
  let bestNormal = FACE_NORMALS[0].normal;

  for (const { normal } of FACE_NORMALS) {
    const faceDir = normal.clone().applyQuaternion(q);
    const dot = faceDir.dot(worldUp);
    if (dot > bestDot) {
      bestDot = dot;
      bestNormal = normal;
    }
  }

  // Build a quaternion that rotates bestNormal to world up
  const currentFaceDir = bestNormal.clone().applyQuaternion(q);
  const correction = new THREE.Quaternion().setFromUnitVectors(currentFaceDir, worldUp);
  const snapped = correction.multiply(q);

  body.setRotation(
    { x: snapped.x, y: snapped.y, z: snapped.z, w: snapped.w },
    true,
  );
}

// ---------------------------------------------------------------------------
// Shared math objects (allocated once, reused every frame)
// ---------------------------------------------------------------------------

const _euler = new THREE.Euler();
const _quat = new THREE.Quaternion();

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Interactive dice cup with physics-driven dice containment.
 *
 * The visual mesh is a **child** of the kinematic RigidBody so Rapier
 * automatically syncs its world transform — no manual position or
 * rotation copying required.
 *
 * @param props - See {@link DiceCupProps}.
 * @returns Kinematic cup body (colliders + visual) + two dynamic Dice3D.
 */
export const DiceCup = memo(function DiceCup({
  isActive,
  autoRoll = false,
  onDiceSettled,
}: DiceCupProps) {
  const { camera, gl, controls } = useThree();

  /** Current phase of the cup animation state machine. */
  const [phase, setPhase] = useState<CupPhase>('idle');

  /**
   * Ref mirror of `phase` — always up to date, immune to stale closures.
   * `useFrame` reads this instead of the state variable to avoid missing
   * transitions when React batches setState calls across frames.
   */
  const phaseRef = useRef<CupPhase>('idle');

  /**
   * Updates both the React state and the ref mirror atomically.
   * Call this instead of `setPhase` directly so `useFrame` always
   * reads the latest phase from `phaseRef`.
   */
  const updatePhase = useCallback((next: CupPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  /**
   * Whether the cup visual mesh should be hidden (after dice spill out).
   * Separate from phase so the cup can remain mounted for physics cleanup.
   */
  const [cupHidden, setCupHidden] = useState(false);

  // Kinematic cup body ref — colliders + visual mesh are children
  const cupBodyRef = useRef<RapierRigidBody>(null!);

  // Visual-only group inside the kinematic body for cosmetic tilt during shake.
  // Rotating this group does NOT move colliders — purely visual effect.
  const cupVisualRef = useRef<THREE.Group>(null);

  // Dynamic dice body refs
  const die1Ref = useRef<RapierRigidBody>(null!);
  const die2Ref = useRef<RapierRigidBody>(null!);

  // Pointer / animation state
  const isDragging = useRef(false);
  const prevPointerXZ = useRef(new THREE.Vector2());
  const lastVelocity = useRef(new THREE.Vector2());
  const settledFrames = useRef(0);
  const diceReadValues = useRef<[number, number] | null>(null);
  /** Wall-clock timestamp when spilled phase began — for emergency snap. */
  const spillStartTime = useRef(0);

  /** Target cup position from pointer — kinematic body lerps toward this. */
  const cupTargetPos = useRef(new THREE.Vector3().copy(CUP_REST_POSITION));

  /** Actual smoothed cup body position — lerps toward cupTargetPos. */
  const cupBodyPos = useRef(new THREE.Vector3().copy(CUP_REST_POSITION));

  const flipProgress = useRef(0);
  const shakeRot = useRef({ x: 0, z: 0 });
  const hasLaunched = useRef(false);

  /** Emergency timer ID — scheduled at spill, fires reading if still stuck. */
  const emergencyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Frame counter for dice impulses — apply every N frames, not every frame. */
  const shakeFrame = useRef(0);

  /** Reset internal refs on mount. */
  useEffect(() => {
    settledFrames.current = 0;
    spillStartTime.current = 0;
    diceReadValues.current = null;
    flipProgress.current = 0;
    hasLaunched.current = false;
    shakeRot.current = { x: 0, z: 0 };

    return () => {
      if (emergencyTimerRef.current) {
        clearTimeout(emergencyTimerRef.current);
        emergencyTimerRef.current = null;
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Auto-roll for AI turns — skip pointer interaction, go straight to flip
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!isActive || !autoRoll) return;
    if (phaseRef.current !== 'idle') return;

    // Short delay so the cup is visible before it flips
    const timer = window.setTimeout(() => {
      if (phaseRef.current === 'idle') {
        updatePhase('flipping');
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [isActive, autoRoll, updatePhase]);

  // ---------------------------------------------------------------------------
  // Pointer handlers
  // ---------------------------------------------------------------------------

  /** Raycast pointer position onto the horizontal drag plane. */
  const getPointerXZ = useCallback(
    (event: PointerEvent): THREE.Vector3 | null => {
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const target = new THREE.Vector3();
      const hit = raycaster.ray.intersectPlane(DRAG_PLANE, target);
      return hit ? target : null;
    },
    [camera, gl],
  );

  /**
   * Pointer-move: update tracked cup position.
   * The kinematic body follows in useFrame; dice react via wall collisions.
   */
  const stableOnMove = useCallback(
    (event: PointerEvent) => {
      if (!isDragging.current) return;
      const pos = getPointerXZ(event);
      if (!pos) return;

      const targetXZ = new THREE.Vector2(pos.x, pos.z);
      const velocity = targetXZ.clone().sub(prevPointerXZ.current);
      lastVelocity.current.copy(velocity);
      prevPointerXZ.current.copy(targetXZ);

      cupTargetPos.current.set(pos.x, CUP_REST_POSITION.y, pos.z);
    },
    [getPointerXZ],
  );

  /** Pointer-up ref to avoid circular dependency with stableOnMove. */
  const stableOnUpRef: MutableRefObject<() => void> = useRef(() => {});

  /** Pointer-up: stop dragging, begin flip. */
  const stableOnUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    document.removeEventListener('pointermove', stableOnMove);
    document.removeEventListener('pointerup', stableOnUpRef.current);
    shakeRot.current = { x: 0, z: 0 };

    // Re-enable orbit controls after cup interaction
    if (controls) (controls as unknown as { enabled: boolean }).enabled = true;

    updatePhase('flipping');
  }, [stableOnMove, controls, updatePhase]);

  useEffect(() => {
    stableOnUpRef.current = stableOnUp;
  }, [stableOnUp]);

  /** Pointer-down on cup mesh — start dragging. */
  const handleCupPointerDown = useCallback(
    (event: { stopPropagation: () => void; nativeEvent: PointerEvent }) => {
      if (!isActive || phaseRef.current !== 'idle') return;
      // R3F-level stopPropagation — prevents OrbitControls from capturing this drag.
      event.stopPropagation();

      // Also disable orbit controls programmatically as a safety net
      if (controls) (controls as unknown as { enabled: boolean }).enabled = false;

      isDragging.current = true;
      updatePhase('held');

      const pos = getPointerXZ(event.nativeEvent);
      if (pos) {
        prevPointerXZ.current.set(pos.x, pos.z);
      }

      document.addEventListener('pointermove', stableOnMove);
      document.addEventListener('pointerup', stableOnUp);
    },
    [isActive, getPointerXZ, stableOnMove, stableOnUp, controls, updatePhase],
  );

  // ---------------------------------------------------------------------------
  // useFrame — kinematic cup movement, shake, flip, settle
  // ---------------------------------------------------------------------------

  useFrame((_state, delta) => {
    if (!isActive) return;

    // Read phase from ref — immune to React batching / stale closures.
    const p = phaseRef.current;


    // ── Idle / Held ──────────────────────────────────────────────────────
    if (p === 'idle' || p === 'held') {
      const target = cupTargetPos.current;
      const smoothed = cupBodyPos.current;
      const lerpFactor = p === 'held' ? 0.12 : 1;
      smoothed.x = THREE.MathUtils.lerp(smoothed.x, target.x, lerpFactor);
      smoothed.z = THREE.MathUtils.lerp(smoothed.z, target.z, lerpFactor);
      smoothed.y = target.y;

      if (cupBodyRef.current) {
        cupBodyRef.current.setNextKinematicTranslation({
          x: smoothed.x, y: smoothed.y, z: smoothed.z,
        });
      }

      if (p === 'held') {
        shakeRot.current.x += (Math.random() - 0.5) * RATTLE_AMPLITUDE;
        shakeRot.current.z += (Math.random() - 0.5) * RATTLE_AMPLITUDE;
        shakeRot.current.x *= 0.82;
        shakeRot.current.z *= 0.82;
        shakeRot.current.x = THREE.MathUtils.clamp(
          shakeRot.current.x, -SHAKE_MAX_ANGLE, SHAKE_MAX_ANGLE,
        );
        shakeRot.current.z = THREE.MathUtils.clamp(
          shakeRot.current.z, -SHAKE_MAX_ANGLE, SHAKE_MAX_ANGLE,
        );
        if (cupVisualRef.current) {
          cupVisualRef.current.rotation.x = shakeRot.current.x;
          cupVisualRef.current.rotation.z = shakeRot.current.z;
        }

        shakeFrame.current++;
        if (shakeFrame.current % 4 === 0) {
          const imp = SHAKE_TRANSLATE_AMP * 2.0;
          for (const die of [die1Ref.current, die2Ref.current]) {
            if (die) {
              die.applyImpulse(
                {
                  x: (Math.random() - 0.5) * imp,
                  y: (Math.random()) * imp * 0.5,
                  z: (Math.random() - 0.5) * imp,
                },
                true,
              );
            }
          }
        }
      }

      const cupPos = cupBodyPos.current;
      for (const die of [die1Ref.current, die2Ref.current]) {
        if (!die) continue;
        const lin = die.linvel();
        const speed = Math.sqrt(lin.x ** 2 + lin.y ** 2 + lin.z ** 2);
        if (speed > CUP_MAX_DIE_SPEED) {
          const scale = CUP_MAX_DIE_SPEED / speed;
          die.setLinvel(
            { x: lin.x * scale, y: lin.y * scale, z: lin.z * scale },
            true,
          );
        }
        const diePos = die.translation();
        const dx = diePos.x - cupPos.x;
        const dz = diePos.z - cupPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > CUP_CONTAINMENT_RADIUS) {
          const pushScale = CUP_CONTAINMENT_RADIUS / dist;
          die.setTranslation(
            {
              x: cupPos.x + dx * pushScale,
              y: diePos.y,
              z: cupPos.z + dz * pushScale,
            },
            true,
          );
          die.setLinvel({ x: 0, y: lin.y, z: 0 }, true);
        }
      }

      die1Ref.current?.setGravityScale(CUP_DICE_GRAVITY, false);
      die2Ref.current?.setGravityScale(CUP_DICE_GRAVITY, false);
    }

    // ── Flip animation ───────────────────────────────────────────────────
    if (p === 'flipping' && cupVisualRef.current) {
      cupVisualRef.current.rotation.x = 0;
      cupVisualRef.current.rotation.z = 0;
    }
    if (p === 'flipping') {
      flipProgress.current += delta * 3.5;
      const t = Math.min(flipProgress.current, 1);
      const cup = cupBodyPos.current;

      if (cupBodyRef.current) {
        _euler.set(0, 0, t * Math.PI);
        _quat.setFromEuler(_euler);
        cupBodyRef.current.setNextKinematicTranslation({
          x: cup.x, y: cup.y, z: cup.z,
        });
        cupBodyRef.current.setNextKinematicRotation({
          x: _quat.x, y: _quat.y, z: _quat.z, w: _quat.w,
        });
      }

      // Cup fully flipped → spill dice
      if (t >= 1 && !hasLaunched.current) {
        hasLaunched.current = true;
        setCupHidden(true);
        updatePhase('spilled');

        // Schedule emergency settle via direct setTimeout — fires even if
        // requestAnimationFrame is throttled (background tab, automation).
        emergencyTimerRef.current = setTimeout(() => {
          if (phaseRef.current === 'spilled' || phaseRef.current === 'reading') {
            // Force-read dice values directly, bypassing useFrame + React state
            const d1 = die1Ref.current;
            const d2 = die2Ref.current;
            if (d1 && d2 && diceReadValues.current === null) {
              const v1 = readFaceValue(d1);
              const v2 = readFaceValue(d2);
              diceReadValues.current = [v1, v2];

              for (const body of [d1, d2]) {
                body.setLinvel({ x: 0, y: 0, z: 0 }, true);
                body.setAngvel({ x: 0, y: 0, z: 0 }, true);
                snapToNearestFace(body);
                const pos = body.translation();
                body.setTranslation({ x: pos.x, y: 0.405, z: pos.z }, true);
                body.setGravityScale(0, true);
                body.sleep();
              }

              phaseRef.current = 'done';
              setPhase('done');
              onDiceSettled([v1, v2]);
            }
          }
        }, EMERGENCY_SNAP_MS);

        const launch = (body: RapierRigidBody) => {
          body.setGravityScale(1, true);
          const dragX = THREE.MathUtils.clamp(lastVelocity.current.x * 0.08, -0.2, 0.2);
          const dragZ = THREE.MathUtils.clamp(lastVelocity.current.y * 0.08, -0.2, 0.2);
          body.applyImpulse(
            {
              x: (Math.random() - 0.5) * 0.35 + dragX,
              y: -0.2,
              z: (Math.random() - 0.5) * 0.35 + dragZ,
            },
            true,
          );
          body.applyTorqueImpulse(
            {
              x: (Math.random() - 0.5) * 0.35,
              y: (Math.random() - 0.5) * 0.35,
              z: (Math.random() - 0.5) * 0.35,
            },
            true,
          );
        };

        if (die1Ref.current) launch(die1Ref.current);
        if (die2Ref.current) launch(die2Ref.current);
      }
    }

    // ── Spilled — natural physics settle ─────────────────────────────────
    if (p === 'spilled') {
      die1Ref.current?.setGravityScale(1.5, false);
      die2Ref.current?.setGravityScale(1.5, false);

      // Record wall-clock start time on first spilled frame
      if (spillStartTime.current === 0) {
        spillStartTime.current = performance.now();
      }

      const isFlatOnFace = (body: RapierRigidBody): boolean => {
        const rot = body.rotation();
        const q = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);
        const worldUp = new THREE.Vector3(0, 1, 0);
        let bestDot = -Infinity;
        for (const { normal } of FACE_NORMALS) {
          const faceDir = normal.clone().applyQuaternion(q);
          const dot = Math.abs(faceDir.dot(worldUp));
          if (dot > bestDot) bestDot = dot;
        }
        return bestDot > 0.97;
      };

      const isNaturallySettled = (body: RapierRigidBody): boolean => {
        const pos = body.translation();
        if (pos.y > ON_BOARD_Y) return false;
        const lin = body.linvel();
        const ang = body.angvel();
        const linMag = Math.sqrt(lin.x ** 2 + lin.y ** 2 + lin.z ** 2);
        const angMag = Math.sqrt(ang.x ** 2 + ang.y ** 2 + ang.z ** 2);
        return linMag < 0.12 && angMag < 0.12 && isFlatOnFace(body);
      };

      const bothSettled =
        die1Ref.current && die2Ref.current &&
        isNaturallySettled(die1Ref.current) && isNaturallySettled(die2Ref.current);

      if (bothSettled) {
        settledFrames.current++;
      } else {
        settledFrames.current = 0;
      }

      if (settledFrames.current > SETTLE_FRAME_COUNT) {
        updatePhase('reading');
      }

      if (performance.now() - spillStartTime.current > EMERGENCY_SNAP_MS) {
        updatePhase('reading');
      }
    }

    // ── Read face values + freeze ────────────────────────────────────────
    if (p === 'reading' && diceReadValues.current === null) {
      if (die1Ref.current && die2Ref.current) {
        const v1 = readFaceValue(die1Ref.current);
        const v2 = readFaceValue(die2Ref.current);
        diceReadValues.current = [v1, v2];

        const isEmergency = performance.now() - spillStartTime.current > EMERGENCY_SNAP_MS;

        for (const body of [die1Ref.current, die2Ref.current]) {
          body.setLinvel({ x: 0, y: 0, z: 0 }, true);
          body.setAngvel({ x: 0, y: 0, z: 0 }, true);

          if (isEmergency) {
            snapToNearestFace(body);
            const pos = body.translation();
            body.setTranslation({ x: pos.x, y: 0.405, z: pos.z }, true);
          }

          body.setGravityScale(0, true);
          body.sleep();
        }

        updatePhase('done');
        onDiceSettled([v1, v2]);
      }
    }
  });

  // ---------------------------------------------------------------------------
  // Emergency setTimeout — fires even if the render loop is throttled
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (phase !== 'spilled') return;

    const timer = window.setTimeout(() => {
      // Only force-snap if still spilled (natural settle didn't happen)
      if (phaseRef.current === 'spilled') {
        updatePhase('reading');
      }
    }, EMERGENCY_SNAP_MS);

    return () => window.clearTimeout(timer);
  }, [phase, updatePhase]);

  // ---------------------------------------------------------------------------
  // Force-read on entering reading phase (even without useFrame ticking)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (phase !== 'reading') return;
    if (diceReadValues.current !== null) return;

    const d1 = die1Ref.current;
    const d2 = die2Ref.current;
    if (!d1 || !d2) return;

    const v1 = readFaceValue(d1);
    const v2 = readFaceValue(d2);
    diceReadValues.current = [v1, v2];

    // Freeze dice
    for (const body of [d1, d2]) {
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      snapToNearestFace(body);
      const pos = body.translation();
      body.setTranslation({ x: pos.x, y: 0.405, z: pos.z }, true);
      body.setGravityScale(0, true);
      body.sleep();
    }

    updatePhase('done');
    onDiceSettled([v1, v2]);
  }, [phase, updatePhase, onDiceSettled]);

  // ---------------------------------------------------------------------------
  // Cleanup pointer listeners on unmount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      document.removeEventListener('pointermove', stableOnMove);
      document.removeEventListener('pointerup', stableOnUp);
      // Safety: re-enable orbit controls on unmount
      if (controls) (controls as unknown as { enabled: boolean }).enabled = true;
    };
  }, [stableOnMove, stableOnUp, controls]);

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  /** Cup visible until dice land on the board. */
  const showCup = isActive && !cupHidden;

  /** Hint visible only during idle phase. */
  const showHint = isActive && phase === 'idle';

  // Stable position tuples — identity never changes so Dice3D.memo skips re-renders
  const die1Position = useMemo<[number, number, number]>(
    () => [CUP_REST_POSITION.x, CUP_REST_POSITION.y + DIE_CUP_Y[0], CUP_REST_POSITION.z],
    [],
  );
  const die2Position = useMemo<[number, number, number]>(
    () => [CUP_REST_POSITION.x, CUP_REST_POSITION.y + DIE_CUP_Y[1], CUP_REST_POSITION.z],
    [],
  );
  const cupBodyPosition = useMemo<[number, number, number]>(
    () => CUP_REST_POSITION.toArray() as [number, number, number],
    [],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      {/* ── Kinematic cup: colliders + visual mesh in ONE body ──────── */}
      {/* Visual is a CHILD of the RigidBody → Rapier auto-syncs its    */}
      {/* world transform. No manual position/rotation copying needed.  */}
      {showCup && (
        <RigidBody
          ref={cupBodyRef}
          type="kinematicPosition"
          position={cupBodyPosition}
          colliders={false}
        >
          {/* 16 wall cuboids approximating the cup cylinder */}
          {CUP_WALL_COLLIDERS.map(({ position: pos, rotation: rot }, i) => (
            <CuboidCollider
              key={`wall-${i}`}
              args={[CUP_WALL_HALF_WIDTH, CUP_WALL_HALF_HEIGHT, CUP_WALL_THICKNESS]}
              position={pos}
              rotation={rot}
            />
          ))}

          {/* Floor collider — matches cup bottom visual radius (0.78) */}
          <CuboidCollider
            args={[0.78, 0.08, 0.78]}
            position={[0, CUP_FLOOR_Y, 0]}
          />

          {/* ── Visual mesh group ────────────────────────────────────── */}
          {/* Wrapped in a group for cosmetic shake tilt. This rotation  */}
          {/* does NOT affect colliders — purely visual eye candy.       */}
          <group ref={cupVisualRef}>
            {/* Outer cylinder (open-ended, DoubleSide for interior view) */}
            <mesh castShadow onPointerDown={handleCupPointerDown}>
              <cylinderGeometry args={[0.92, 0.78, 1.8, 20, 1, true]} />
              <meshStandardMaterial
                color="#3d2b1f"
                roughness={0.85}
                metalness={0.0}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Bottom disk (visible when looking into the cup) */}
            <mesh position={[0, -0.9, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <circleGeometry args={[0.78, 20]} />
              <meshStandardMaterial
                color="#4a3526"
                roughness={0.9}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Rim highlight ring */}
            <mesh position={[0, 0.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.76, 0.96, 20]} />
              <meshStandardMaterial color="#5c3d22" roughness={0.7} />
            </mesh>
          </group>
        </RigidBody>
      )}

      {/* "Click to roll" hint — idle phase only */}
      {showHint && (
        <Html
          position={[CUP_REST_POSITION.x, CUP_REST_POSITION.y + 1.4, CUP_REST_POSITION.z]}
          center
          distanceFactor={12}
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            background: 'rgba(124,92,255,0.88)',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '6px',
            whiteSpace: 'nowrap',
            letterSpacing: '0.03em',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}>
            🎲 Click to roll
          </div>
        </Html>
      )}

      {/*
       * Dynamic dice — ALWAYS rendered, ALWAYS visible.
       * During idle/held they float freely inside the kinematic cup
       * (gravity 0.15), bouncing off walls and each other.
       * No setTranslation per frame — pure physics.
       *
       * gravityScale prop is 0 (constant, never changes) to prevent
       * Rapier prop reconciliation from teleporting the body.
       * Actual gravity is set imperatively in useFrame.
       */}
      <Dice3D bodyRef={die1Ref} gravityScale={0} position={die1Position} />
      <Dice3D bodyRef={die2Ref} gravityScale={0} position={die2Position} />
    </>
  );
});
