import { GameState, LevelData, Position, TileType } from './types';

export function parseAsciiLevel(ascii: string): LevelData {
  const lines = ascii
    .replace(/\r/g, '')
    .split('\n')
    .filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    throw new Error('Level data is empty');
  }

  const height = lines.length;
  const width = Math.max(...lines.map(l => l.length));

  let playerStart: Position | null = null;
  let exitPos: Position | null = null;
  let totalDiamonds = 0;

  const grid: TileType[][] = [];

  for (let y = 0; y < height; y++) {
    const row: TileType[] = [];
    const line = lines[y].padEnd(width, '#');

    for (let x = 0; x < width; x++) {
      const char = line[x];

      switch (char) {
        case '#':
          row.push('wall');
          break;
        case '.':
          row.push('floor');
          break;
        case 'P':
          if (playerStart) {
            throw new Error(`Multiple player starts detected: first at (${playerStart.x}, ${playerStart.y}), second at (${x}, ${y})`);
          }
          playerStart = { x, y };
          row.push('floor'); // Player stands on floor initially
          break;
        case 'E':
          exitPos = { x, y };
          row.push('exit');
          break;
        case '*':
          totalDiamonds++;
          row.push('diamond');
          break;
        case 'B':
          row.push('block');
          break;
        case 'k':
          row.push('key');
          break;
        case 'D':
          row.push('door');
          break;
        case 's':
          row.push('switch');
          break;
        case 'G':
          row.push('gate');
          break;
        default:
          throw new Error(`Unrecognized map character '${char}' at row ${y + 1}, column ${x + 1}`);
      }
    }
    grid.push(row);
  }

  if (!playerStart) {
    throw new Error('Level is missing a player start position (P)');
  }
  if (!exitPos) {
    throw new Error('Level is missing an exit (E)');
  }

  return {
    width,
    height,
    playerStart,
    exitPos,
    totalDiamonds,
    grid,
  };
}

export function createInitialState(level: LevelData): GameState {
  // Deep copy grid to ensure immutability
  const clonedGrid = level.grid.map(row => [...row]);

  // Construct base terrain grid: static elements (wall, switch, gate, exit, floor)
  const baseGrid = level.grid.map(row =>
    row.map(tile => {
      if (tile === 'wall' || tile === 'switch' || tile === 'gate' || tile === 'exit') {
        return tile;
      }
      return 'floor';
    })
  );

  return {
    width: level.width,
    height: level.height,
    grid: clonedGrid,
    baseGrid,
    player: { ...level.playerStart },
    collectedDiamonds: 0,
    totalDiamonds: level.totalDiamonds,
    keys: 0,
    moveCount: 0,
    status: 'playing',
  };
}
