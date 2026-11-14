import { Direction, GameState, Position } from './types';

export const DIRECTION_DELTAS: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/**
 * Checks whether any switch / pressure plate is currently held down by the player or a block.
 */
export function isGateOpen(state: GameState): boolean {
  for (let y = 0; y < state.height; y++) {
    for (let x = 0; x < state.width; x++) {
      if (state.baseGrid[y][x] === 'switch') {
        if (state.player.x === x && state.player.y === y) {
          return true;
        }
        if (state.grid[y][x] === 'block') {
          return true;
        }
      }
    }
  }
  return false;
}

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

  // Pushable Block behavior
  if (targetTile === 'block') {
    const beyondX = targetX + delta.x;
    const beyondY = targetY + delta.y;

    // Check bounds for space behind the block
    if (beyondX < 0 || beyondX >= state.width || beyondY < 0 || beyondY >= state.height) {
      return state;
    }

    const beyondTile = state.grid[beyondY][beyondX];
    const gateOpen = isGateOpen(state);

    // Block can be pushed into floor, switch, or open gate
    const canPushInto =
      beyondTile === 'floor' ||
      beyondTile === 'switch' ||
      (beyondTile === 'gate' && gateOpen);

    if (!canPushInto) {
      return state;
    }

    // Determine the underlying tile for the pushed block's previous spot
    const sourceBase = state.baseGrid[targetY][targetX] === 'switch' ? 'switch' : 'floor';

    const newGrid = state.grid.map((row, y) => {
      if (y === targetY && y === beyondY) {
        const newRow = [...row];
        newRow[targetX] = sourceBase;
        newRow[beyondX] = 'block';
        return newRow;
      }
      if (y === targetY) {
        const newRow = [...row];
        newRow[targetX] = sourceBase;
        return newRow;
      }
      if (y === beyondY) {
        const newRow = [...row];
        newRow[beyondX] = 'block';
        return newRow;
      }
      return row;
    });

    return {
      ...state,
      grid: newGrid,
      player: { x: targetX, y: targetY },
      moveCount: state.moveCount + 1,
      status: 'playing',
    };
  }

  // Key Pickup behavior
  if (targetTile === 'key') {
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
      keys: state.keys + 1,
      moveCount: state.moveCount + 1,
      status: 'playing',
    };
  }

  // Door Unlocking behavior
  if (targetTile === 'door') {
    if (state.keys <= 0) {
      // Locked door without key
      return state;
    }

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
      keys: state.keys - 1,
      moveCount: state.moveCount + 1,
      status: 'playing',
    };
  }

  // Switch / Pressure Plate movement
  if (targetTile === 'switch') {
    return {
      ...state,
      player: { x: targetX, y: targetY },
      moveCount: state.moveCount + 1,
      status: 'playing',
    };
  }

  // Gate movement
  if (targetTile === 'gate') {
    if (!isGateOpen(state)) {
      // Gate is closed, movement blocked
      return state;
    }

    return {
      ...state,
      player: { x: targetX, y: targetY },
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
          case 'block':
            rowStr += 'B';
            break;
          case 'key':
            rowStr += 'k';
            break;
          case 'door':
            rowStr += 'D';
            break;
          case 'switch':
            rowStr += 's';
            break;
          case 'gate':
            rowStr += 'G';
            break;
        }
      }
    }
    rows.push(rowStr);
  }

  return rows.join('\n');
}
