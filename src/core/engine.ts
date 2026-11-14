import { BoulderState, Direction, EnemyState, GameState, Position } from './types';

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
        if (state.boulders && state.boulders.some(b => !b.submerged && b.x === x && b.y === y)) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Pure function: advances all rolling boulders by 1 tile in their direction.
 * If a boulder hits a player, the player is crushed (status: 'lost').
 * If a boulder hits a wall, block, or exit, it rests (active: false).
 * If a boulder hits a hole, it fills the hole and becomes submerged.
 */
export function updateBoulders(state: GameState): GameState {
  if (!state.boulders || state.boulders.length === 0) {
    return state;
  }

  let grid = state.grid;
  let status = state.status;
  let enemies = state.enemies;

  // Process boulders sorted by progression in direction so front boulders move first
  const sortedBoulders = [...state.boulders].sort((a, b) => {
    if (a.direction === 'down') return b.y - a.y;
    if (a.direction === 'up') return a.y - b.y;
    if (a.direction === 'right') return b.x - a.x;
    if (a.direction === 'left') return a.x - b.x;
    return a.id - b.id;
  });

  const nextBouldersMap = new Map<number, BoulderState>();

  for (const b of sortedBoulders) {
    if (!b.active || b.submerged) {
      nextBouldersMap.set(b.id, b);
      continue;
    }

    const delta = DIRECTION_DELTAS[b.direction];
    const nx = b.x + delta.x;
    const ny = b.y + delta.y;

    // Bounds check
    if (nx < 0 || nx >= state.width || ny < 0 || ny >= state.height) {
      nextBouldersMap.set(b.id, { ...b, active: false });
      continue;
    }

    // Check if boulder crushes the player
    if (nx === state.player.x && ny === state.player.y) {
      status = 'lost';
      nextBouldersMap.set(b.id, { ...b, x: nx, y: ny });
      continue;
    }

    // Check if boulder crushes an enemy
    if (enemies && enemies.some(e => (e.alive ?? true) && e.x === nx && e.y === ny)) {
      enemies = enemies.map(e => (e.x === nx && e.y === ny ? { ...e, alive: false } : e));
    }

    // Check if blocked by another non-submerged boulder
    let boulderBlocked = false;
    for (const other of state.boulders) {
      if (other.id === b.id) continue;
      const currentOther = nextBouldersMap.get(other.id) || other;
      if (!currentOther.submerged && currentOther.x === nx && currentOther.y === ny) {
        boulderBlocked = true;
        break;
      }
    }

    if (boulderBlocked) {
      nextBouldersMap.set(b.id, { ...b, active: false });
      continue;
    }

    const tile = grid[ny][nx];

    // Can roll onto floor, switch, or spikes
    if (tile === 'floor' || tile === 'switch' || tile === 'spikes') {
      nextBouldersMap.set(b.id, { ...b, x: nx, y: ny });
      continue;
    }

    // Hole: boulder fills hole and becomes submerged
    if (tile === 'hole') {
      grid = grid.map((row, y) => {
        if (y !== ny) return row;
        const newRow = [...row];
        newRow[nx] = 'floor';
        return newRow;
      });
      nextBouldersMap.set(b.id, { ...b, x: nx, y: ny, active: false, submerged: true });
      continue;
    }

    // Any other obstacle (wall, block, locked door, closed gate, exit, diamond): boulder stops rolling
    nextBouldersMap.set(b.id, { ...b, active: false });
  }

  // Preserve original boulder list order
  const updatedBoulders = state.boulders.map(b => nextBouldersMap.get(b.id)!);

  return {
    ...state,
    grid,
    boulders: updatedBoulders,
    enemies,
    status,
  };
}

/**
 * Pure function: advances all living enemies along their patrol path by 1 step.
 * If an enemy enters the player's tile, the player is defeated (status: 'lost').
 * If blocked by obstacles (wall, block, closed gate, hole, boulder, other enemy),
 * the enemy reverses its patrol direction.
 */
export function updateEnemies(state: GameState): GameState {
  if (!state.enemies || state.enemies.length === 0) {
    return state;
  }

  let status = state.status;
  const isGate = isGateOpen(state);

  const updatedEnemies: EnemyState[] = [];

  for (const e of state.enemies) {
    if (e.alive === false) {
      updatedEnemies.push(e);
      continue;
    }

    let dir = e.direction;
    let delta = DIRECTION_DELTAS[dir];
    let nx = e.x + delta.x;
    let ny = e.y + delta.y;

    const isPassable = (x: number, y: number): boolean => {
      if (x < 0 || x >= state.width || y < 0 || y >= state.height) return false;
      // Cannot walk into non-submerged boulder
      if (state.boulders && state.boulders.some(b => !b.submerged && b.x === x && b.y === y)) return false;
      // Cannot walk into another enemy
      if (updatedEnemies.some(other => (other.alive ?? true) && other.x === x && other.y === y)) return false;
      if (state.enemies.some(other => other.id !== e.id && (other.alive ?? true) && other.x === x && other.y === y)) return false;

      const tile = state.grid[y][x];
      if (tile === 'floor' || tile === 'switch' || tile === 'spikes' || tile === 'diamond') {
        return true;
      }
      if (tile === 'gate' && isGate) {
        return true;
      }
      return false;
    };

    if (!isPassable(nx, ny)) {
      // Reverse direction: 180 degrees
      dir = dir === 'left' ? 'right' : dir === 'right' ? 'left' : dir === 'up' ? 'down' : 'up';
      delta = DIRECTION_DELTAS[dir];
      nx = e.x + delta.x;
      ny = e.y + delta.y;
    }

    if (isPassable(nx, ny)) {
      if (nx === state.player.x && ny === state.player.y) {
        status = 'lost';
      }
      updatedEnemies.push({ ...e, x: nx, y: ny, direction: dir });
    } else {
      // Both ways blocked, stay in place with reversed direction
      updatedEnemies.push({ ...e, direction: dir });
    }
  }

  return {
    ...state,
    enemies: updatedEnemies,
    status,
  };
}

/**
 * Calculates player-only movement before hazards update.
 */
function calculatePlayerMove(state: GameState, direction: Direction): GameState {
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

  // Boulders block direct player movement
  if (state.boulders && state.boulders.some(b => !b.submerged && b.x === targetX && b.y === targetY)) {
    return state;
  }

  // Enemies: stepping into an enemy is lethal
  if (state.enemies && state.enemies.some(e => (e.alive ?? true) && e.x === targetX && e.y === targetY)) {
    return {
      ...state,
      player: { x: targetX, y: targetY },
      moveCount: state.moveCount + 1,
      status: 'lost',
    };
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

    // Cannot push block into a boulder
    if (state.boulders && state.boulders.some(b => !b.submerged && b.x === beyondX && b.y === beyondY)) {
      return state;
    }

    // Block can be pushed into floor, switch, open gate, hole, or spikes
    const isHole = beyondTile === 'hole';
    const canPushInto =
      beyondTile === 'floor' ||
      beyondTile === 'switch' ||
      (beyondTile === 'gate' && gateOpen) ||
      beyondTile === 'spikes' ||
      isHole;

    if (!canPushInto) {
      return state;
    }

    // Determine the underlying tile for the pushed block's previous spot
    const sourceBase =
      state.baseGrid[targetY][targetX] === 'switch'
        ? 'switch'
        : state.baseGrid[targetY][targetX] === 'spikes'
        ? 'spikes'
        : 'floor';
    const destinationTile = isHole ? 'floor' : 'block';

    const newGrid = state.grid.map((row, y) => {
      if (y === targetY && y === beyondY) {
        const newRow = [...row];
        newRow[targetX] = sourceBase;
        newRow[beyondX] = destinationTile;
        return newRow;
      }
      if (y === targetY) {
        const newRow = [...row];
        newRow[targetX] = sourceBase;
        return newRow;
      }
      if (y === beyondY) {
        const newRow = [...row];
        newRow[beyondX] = destinationTile;
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

  // Hole blocks direct player movement
  if (targetTile === 'hole') {
    return state;
  }

  // Spike Boots Pickup behavior
  if (targetTile === 'spike_boots') {
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
      hasSpikeBoots: true,
      moveCount: state.moveCount + 1,
      status: 'playing',
    };
  }

  // Pickaxe Tool Pickup
  if (targetTile === 'pickaxe') {
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
      hasPickaxe: true,
      moveCount: state.moveCount + 1,
      status: 'playing',
    };
  }

  // Fire Tool Pickup
  if (targetTile === 'fire') {
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
      hasFire: true,
      moveCount: state.moveCount + 1,
      status: 'playing',
    };
  }

  // Cracked Wall: breakable with pickaxe
  if (targetTile === 'cracked_wall') {
    if (!state.hasPickaxe) {
      // Cannot break without pickaxe
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
      moveCount: state.moveCount + 1,
      status: 'playing',
    };
  }

  // Bush: burnable with fire
  if (targetTile === 'bush') {
    if (!state.hasFire) {
      // Cannot burn without fire
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
      moveCount: state.moveCount + 1,
      status: 'playing',
    };
  }

  // Spikes Hazard behavior
  if (targetTile === 'spikes') {
    if (state.hasSpikeBoots) {
      // Safe to walk on with boots
      return {
        ...state,
        player: { x: targetX, y: targetY },
        moveCount: state.moveCount + 1,
        status: 'playing',
      };
    } else {
      // Lethal! Player stepped on spikes without boots
      return {
        ...state,
        player: { x: targetX, y: targetY },
        moveCount: state.moveCount + 1,
        status: 'lost',
      };
    }
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
 * Pure function: calculates the next game state given the current state and a movement direction.
 * Moves player first, and if valid, triggers turn-based hazard updates (e.g. rolling boulders).
 */
export function move(state: GameState, direction: Direction): GameState {
  const nextPlayerState = calculatePlayerMove(state, direction);

  // If move was blocked or invalid, state reference is unchanged
  if (nextPlayerState === state) {
    return state;
  }

  // If player already won or died from a tile hazard, return immediately
  if (nextPlayerState.status !== 'playing') {
    return nextPlayerState;
  }

  // Update dynamic hazards in deterministic turn order:
  // 1. Rolling boulders
  const afterBoulders = updateBoulders(nextPlayerState);
  if (afterBoulders.status !== 'playing') {
    return afterBoulders;
  }

  // 2. Patrolling enemies
  return updateEnemies(afterBoulders);
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
      } else if (state.boulders && state.boulders.some(b => !b.submerged && b.x === x && b.y === y)) {
        rowStr += 'R';
      } else if (state.enemies && state.enemies.some(e => (e.alive ?? true) && e.x === x && e.y === y)) {
        rowStr += 'S';
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
          case 'hole':
            rowStr += 'O';
            break;
          case 'spikes':
            rowStr += '^';
            break;
          case 'spike_boots':
            rowStr += 'I';
            break;
          case 'cracked_wall':
            rowStr += 'c';
            break;
          case 'bush':
            rowStr += 'b';
            break;
          case 'pickaxe':
            rowStr += 'p';
            break;
          case 'fire':
            rowStr += 'f';
            break;
        }
      }
    }
    rows.push(rowStr);
  }

  return rows.join('\n');
}
