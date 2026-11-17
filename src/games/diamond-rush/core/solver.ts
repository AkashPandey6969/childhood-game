import { move } from './engine';
import { createInitialState, parseAsciiLevel } from './parser';
import { Direction, GameState, LevelData } from './types';

export interface SolverResult {
  solved: boolean;
  moves: number;
  path: Direction[];
  statesExplored: number;
}

const DIRECTIONS: Direction[] = ['up', 'right', 'down', 'left'];

/**
 * Serializes dynamic game state into a compact string hash for BFS visited set.
 */
export function serializeState(state: GameState): string {
  let key = `P:${state.player.x},${state.player.y}|D:${state.collectedDiamonds}|K:${state.keys}|I:${state.hasSpikeBoots ? 1 : 0}|p:${state.hasPickaxe ? 1 : 0}|f:${state.hasFire ? 1 : 0}`;

  if (state.boulders && state.boulders.length > 0) {
    key += '|B:';
    for (const b of state.boulders) {
      key += `${b.x},${b.y},${b.active ? 1 : 0},${b.submerged ? 1 : 0};`;
    }
  }

  if (state.enemies && state.enemies.length > 0) {
    key += '|E:';
    for (const e of state.enemies) {
      key += `${e.x},${e.y},${e.direction},${e.alive ? 1 : 0};`;
    }
  }

  // Record positions of mutable interactive tiles
  key += '|G:';
  for (let y = 0; y < state.height; y++) {
    for (let x = 0; x < state.width; x++) {
      const tile = state.grid[y][x];
      if (
        tile === 'block' ||
        tile === 'door' ||
        tile === 'cracked_wall' ||
        tile === 'bush' ||
        tile === 'diamond' ||
        tile === 'hole'
      ) {
        key += `${x},${y}:${tile};`;
      }
    }
  }

  return key;
}

/**
 * Pure BFS solver: searches for the shortest path to win the puzzle level.
 * Guarantees optimal (shortest) move count if solvable.
 */
export function solveLevel(
  levelOrAscii: LevelData | string,
  maxStates: number = 60000
): SolverResult {
  const level = typeof levelOrAscii === 'string' ? parseAsciiLevel(levelOrAscii) : levelOrAscii;
  const initialState = createInitialState(level);

  if (initialState.status === 'won') {
    return { solved: true, moves: 0, path: [], statesExplored: 1 };
  }

  const queue: { state: GameState; path: Direction[] }[] = [{ state: initialState, path: [] }];
  const visited = new Set<string>();
  visited.add(serializeState(initialState));

  let head = 0;

  while (head < queue.length) {
    if (head > maxStates) {
      return { solved: false, moves: -1, path: [], statesExplored: head };
    }

    const current = queue[head++];
    const { state, path } = current;

    for (const dir of DIRECTIONS) {
      const nextState = move(state, dir);

      // Blocked / invalid move: state reference is identical
      if (nextState === state) {
        continue;
      }

      // Lethal hazard / defeat: dead end branch
      if (nextState.status === 'lost') {
        continue;
      }

      const nextPath = [...path, dir];

      // Win condition reached! Shortest path found by BFS property
      if (nextState.status === 'won') {
        return {
          solved: true,
          moves: nextPath.length,
          path: nextPath,
          statesExplored: head,
        };
      }

      const key = serializeState(nextState);
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ state: nextState, path: nextPath });
      }
    }
  }

  return { solved: false, moves: -1, path: [], statesExplored: head };
}
