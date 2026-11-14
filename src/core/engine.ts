import { Direction, GameState, Position } from './types';

export const DIRECTION_DELTAS: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/**
 * Pure function: calculates the next game state given the current state and a movement direction.
 * Returns the exact same state object if the move is invalid or blocked.
 */
export function move(state: GameState, direction: Direction): GameState {
  if (state.status !== 'playing') {
    return state;
  }

  const delta = DIRECTION_DELTAS[direction];
  const targetX = state.player.x + delta.x;
  const targetY = state.player.y + delta.y;

  // Bounds check
  if (targetX < 0 || targetX >= state.width || targetY < 0 || targetY >= state.height) {
    return state;
  }

  const targetTile = state.grid[targetY][targetX];

  // Walls block movement
  if (targetTile === 'wall') {
    return state;
  }

  // Exit behavior: locked until all diamonds are collected
  if (targetTile === 'exit') {
    if (state.collectedDiamonds < state.totalDiamonds) {
      // Exit remains locked
      return state;
    }

    // Win condition met!
    return {
      ...state,
      player: { x: targetX, y: targetY },
      moveCount: state.moveCount + 1,
      status: 'won',
    };
  }

  // Diamond collection
  if (targetTile === 'diamond') {
    const newGrid = state.grid.map((row, y) => {
      if (y !== targetY) return row;
      const newRow = [...row];
      newRow[targetX] = 'floor';
      return newRow;
    });

    return {
      ...state,
      grid: newGrid,
      player: { x: targetX, y: targetY },
      collectedDiamonds: state.collectedDiamonds + 1,
      moveCount: state.moveCount + 1,
      status: 'playing',
    };
  }

  // Normal floor movement
  if (targetTile === 'floor') {
    return {
      ...state,
      player: { x: targetX, y: targetY },
      moveCount: state.moveCount + 1,
      status: 'playing',
    };
  }

  return state;
}

/**
 * ASCII renderer for debugging, terminal printing, and test assertions.
 */
export function renderAscii(state: GameState): string {
  const rows: string[] = [];

  for (let y = 0; y < state.height; y++) {
    let rowStr = '';
    for (let x = 0; x < state.width; x++) {
      if (state.player.x === x && state.player.y === y) {
        rowStr += 'P';
      } else {
        const tile = state.grid[y][x];
        switch (tile) {
          case 'wall':
            rowStr += '#';
            break;
          case 'floor':
            rowStr += '.';
            break;
          case 'exit':
            rowStr += 'E';
            break;
          case 'diamond':
            rowStr += '*';
            break;
        }
      }
    }
    rows.push(rowStr);
  }

  return rows.join('\n');
}
