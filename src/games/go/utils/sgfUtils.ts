/**
 * Minimal SGF (Smart Game Format) serialization and parsing for Go.
 *
 * This implementation covers the main line of a game record — enough to
 * export and re-import games played in this app. It is NOT a full SGF
 * parser (no variations, comments, or annotations).
 *
 * Coordinate encoding: SGF uses letters `a..s` for the 19 rows/cols of a
 * 19×19 board (0 → 'a', 18 → 's'); we use the same mapping for 9×9 (letters
 * `a..i`). Pass moves are encoded as `B[]` / `W[]` (modern convention).
 *
 * A written record looks like:
 * ```
 * (;FF[4]GM[1]SZ[9]KM[7.5]RU[Chinese];B[ee];W[dd];B[];W[])
 * ```
 */

import type { BoardSize, Move, Point, Stone } from '../engine/types';
import type { ScoringRules } from '../config/scoringRules';

/** SGF property-value pair, e.g. `SZ[19]`. */
interface SgfProperty {
  key: string;
  value: string;
}

/** Convert a 0-based coordinate to its SGF letter (0 → 'a', 1 → 'b', …). */
function coordToLetter(n: number): string {
  return String.fromCharCode(97 + n); // 'a'.charCodeAt(0) === 97
}

/** Convert a single SGF letter to a 0-based coordinate. */
function letterToCoord(letter: string): number {
  return letter.charCodeAt(0) - 97;
}

/**
 * Encode a single move as an SGF fragment (including the leading `;`).
 *
 * @param move - Move to encode.
 * @returns SGF node text like `;B[dd]` or `;W[]` for pass/resign.
 */
export function moveToSgf(move: Move): string {
  const colorTag = move.color === 'b' ? 'B' : 'W';
  if (move.kind === 'pass' || move.kind === 'resign') {
    return `;${colorTag}[]`;
  }
  const { x, y } = move.point;
  return `;${colorTag}[${coordToLetter(x)}${coordToLetter(y)}]`;
}

/**
 * Decode a single SGF move node back into a `Move`.
 *
 * Accepts both full node text (`;B[dd]`) and bare content (`B[dd]`).
 *
 * @param sgf - SGF fragment describing one move.
 * @returns A `Move` (kind `play` or `pass`) or `null` if malformed.
 */
export function sgfToMove(sgf: string): Move | null {
  const trimmed = sgf.trim().replace(/^;/, '');
  const match = trimmed.match(/^([BW])\[([a-s]{0,2})\]$/);
  if (!match) return null;
  const color: Stone = match[1] === 'B' ? 'b' : 'w';
  const coords = match[2];
  if (coords.length === 0) return { kind: 'pass', color };
  const x = letterToCoord(coords[0]);
  const y = letterToCoord(coords[1]);
  return { kind: 'play', point: { x, y }, color };
}

/**
 * Options describing the root properties of an SGF record.
 */
export interface SgfExportOptions {
  /** Board dimension. */
  boardSize: BoardSize;
  /** Komi value. */
  komi: number;
  /** Scoring ruleset. */
  scoringRules: ScoringRules;
  /** Optional handicap stones placed before the first move. */
  handicapStones?: Point[];
  /** Optional result string, e.g. `"B+R"` or `"W+3.5"`. */
  result?: string;
}

/**
 * Serialize a complete game record to SGF.
 *
 * @param moves - Ordered move history.
 * @param options - Root properties (board size, komi, rules, …).
 * @returns A single-line SGF string.
 */
export function movesToSgf(moves: Move[], options: SgfExportOptions): string {
  const rules = options.scoringRules === 'chinese' ? 'Chinese' : 'Japanese';
  const rootProps: string[] = [
    'FF[4]',
    'GM[1]',
    `SZ[${options.boardSize}]`,
    `KM[${options.komi}]`,
    `RU[${rules}]`,
  ];
  if (options.handicapStones && options.handicapStones.length > 0) {
    rootProps.push(`HA[${options.handicapStones.length}]`);
    const stones = options.handicapStones
      .map((p) => `[${coordToLetter(p.x)}${coordToLetter(p.y)}]`)
      .join('');
    rootProps.push(`AB${stones}`);
  }
  if (options.result) rootProps.push(`RE[${options.result}]`);

  const body = moves.map(moveToSgf).join('');
  return `(;${rootProps.join('')}${body})`;
}

/** Result of parsing an SGF string (main line only). */
export interface ParsedSgf {
  /** Board size (defaults to 19 if omitted in source). */
  boardSize: BoardSize;
  /** Komi (defaults to 6.5 if omitted). */
  komi: number;
  /** Scoring ruleset (defaults to `'japanese'` if omitted). */
  scoringRules: ScoringRules;
  /** Ordered move list extracted from the main line. */
  moves: Move[];
  /** Handicap stones (black pre-placements), if any. */
  handicapStones: Point[];
}

/**
 * Parse a minimal SGF string (main line only, no variations).
 *
 * Tolerates whitespace and newlines, ignores unknown properties, and does
 * not error on malformed input — unrecognized tokens are skipped. The goal
 * is faithful round-tripping for records produced by `movesToSgf`.
 *
 * @param sgf - Source SGF text.
 * @returns A `ParsedSgf` with board config and move list.
 */
export function parseSgf(sgf: string): ParsedSgf {
  const result: ParsedSgf = {
    boardSize: 19,
    komi: 6.5,
    scoringRules: 'japanese',
    moves: [],
    handicapStones: [],
  };

  // Strip outer parens and whitespace.
  const clean = sgf.replace(/\s+/g, '');

  // Split into nodes on ';' outside of brackets.
  const nodes = splitNodes(clean);

  for (const node of nodes) {
    const props = parseNodeProperties(node);
    for (const prop of props) {
      switch (prop.key) {
        case 'SZ': {
          const n = Number(prop.value);
          if (n === 9 || n === 19) result.boardSize = n;
          break;
        }
        case 'KM': {
          const n = Number(prop.value);
          if (Number.isFinite(n)) result.komi = n;
          break;
        }
        case 'RU': {
          if (/^chinese$/i.test(prop.value)) result.scoringRules = 'chinese';
          else if (/^japanese$/i.test(prop.value)) result.scoringRules = 'japanese';
          break;
        }
        case 'AB': {
          for (const coords of splitMultiValue(prop.value)) {
            const p = coordsToPoint(coords);
            if (p) result.handicapStones.push(p);
          }
          break;
        }
        case 'B':
        case 'W': {
          const color: Stone = prop.key === 'B' ? 'b' : 'w';
          if (prop.value.length === 0) {
            result.moves.push({ kind: 'pass', color });
          } else {
            const p = coordsToPoint(prop.value);
            if (p) result.moves.push({ kind: 'play', point: p, color });
          }
          break;
        }
        default:
          // Unknown property — skip silently.
          break;
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Low-level SGF parsing helpers
// ---------------------------------------------------------------------------

/** Split a full SGF string into top-level nodes (ignoring bracket contents). */
function splitNodes(sgf: string): string[] {
  const nodes: string[] = [];
  let current = '';
  let depth = 0;
  for (const ch of sgf) {
    if (ch === '[') depth++;
    else if (ch === ']') depth--;
    if (ch === ';' && depth === 0) {
      if (current.length > 0) nodes.push(current);
      current = '';
      continue;
    }
    // Discard stray parentheses at the top level.
    if ((ch === '(' || ch === ')') && depth === 0) continue;
    current += ch;
  }
  if (current.length > 0) nodes.push(current);
  return nodes;
}

/**
 * Parse one node's properties (`KEY[val1][val2]KEY2[val]`).
 * Returns one entry per value — multi-value properties produce multiple entries
 * with the same key.
 */
function parseNodeProperties(node: string): SgfProperty[] {
  const props: SgfProperty[] = [];
  let i = 0;
  while (i < node.length) {
    // Read property key (uppercase letters).
    let key = '';
    while (i < node.length && /[A-Z]/.test(node[i])) {
      key += node[i++];
    }
    if (!key) {
      // Skip unrecognized character.
      i++;
      continue;
    }
    // Read one or more `[...]` values.
    while (i < node.length && node[i] === '[') {
      i++; // skip '['
      let value = '';
      while (i < node.length && node[i] !== ']') value += node[i++];
      i++; // skip ']'
      props.push({ key, value });
    }
  }
  return props;
}

/** Split a multi-value string at `][` boundaries after the first bracket is removed. */
function splitMultiValue(raw: string): string[] {
  // `raw` comes already unwrapped (no outer brackets for the first value,
  // but additional values in the original text were captured separately by
  // `parseNodeProperties`). However, in practice AB properties can be
  // written with internal `][` — safeguard by splitting here too.
  if (!raw.includes('][')) return [raw];
  return raw.split('][');
}

/** Decode two-letter SGF coordinates into a `Point`, or `null` if malformed. */
function coordsToPoint(coords: string): Point | null {
  if (coords.length !== 2) return null;
  const x = letterToCoord(coords[0]);
  const y = letterToCoord(coords[1]);
  if (Number.isNaN(x) || Number.isNaN(y)) return null;
  return { x, y };
}
