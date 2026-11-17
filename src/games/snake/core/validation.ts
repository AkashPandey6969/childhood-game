import { GRID_COLS, GRID_ROWS } from './levels';
import { Direction, LevelConfig, Point } from './types';

export function getInitialSnake(start: { col: number; row: number; dir: Direction }): Point[] {
  const dCol = { right: -1, left: 1, up: 0, down: 0 }[start.dir];
  const dRow = { right: 0, left: 0, up: 1, down: -1 }[start.dir];

  const head: Point = { col: start.col, row: start.row };
  const seg1: Point = {
    col: (start.col + dCol + GRID_COLS) % GRID_COLS,
    row: (start.row + dRow + GRID_ROWS) % GRID_ROWS,
  };
  const seg2: Point = {
    col: (start.col + dCol * 2 + GRID_COLS) % GRID_COLS,
    row: (start.row + dRow * 2 + GRID_ROWS) % GRID_ROWS,
  };

  return [head, seg1, seg2];
}

export function validateLevel(level: LevelConfig): {
  valid: boolean;
  totalOpenCells: number;
  reachableOpenCells: number;
  errors: string[];
} {
  const errors: string[] = [];

  // 1. Grid dimensions: exactly 20x12
  if (level.maze.length !== GRID_ROWS) {
    errors.push(`Level ${level.id} (${level.name}) has ${level.maze.length} rows; expected ${GRID_ROWS}.`);
  }
  for (let r = 0; r < level.maze.length; r++) {
    if (level.maze[r].length !== GRID_COLS) {
      errors.push(`Level ${level.id} row ${r} has length ${level.maze[r].length}; expected ${GRID_COLS}.`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, totalOpenCells: 0, reachableOpenCells: 0, errors };
  }

  // 2. Validate start cell & initial body positions are open cells
  const snake = getInitialSnake(level.start);
  for (let i = 0; i < snake.length; i++) {
    const part = snake[i];
    const char = level.maze[part.row][part.col];
    if (char !== '.') {
      errors.push(
        `Initial snake segment ${i} at (${part.col}, ${part.row}) is on '${char}', expected open '.'`
      );
    }
  }

  // 3. Count total open cells
  let totalOpenCells = 0;
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (level.maze[r][c] === '.') {
        totalOpenCells++;
      }
    }
  }

  // 4. Flood fill with wrap-around from start cell
  const visited = new Set<string>();
  const queue: Point[] = [{ col: level.start.col, row: level.start.row }];
  visited.add(`${level.start.col},${level.start.row}`);

  const dirs = [
    { dc: 1, dr: 0 },
    { dc: -1, dr: 0 },
    { dc: 0, dr: 1 },
    { dc: 0, dr: -1 },
  ];

  let headIdx = 0;
  while (headIdx < queue.length) {
    const cur = queue[headIdx++];

    for (const d of dirs) {
      const nextCol = (cur.col + d.dc + GRID_COLS) % GRID_COLS;
      const nextRow = (cur.row + d.dr + GRID_ROWS) % GRID_ROWS;
      const key = `${nextCol},${nextRow}`;

      if (level.maze[nextRow][nextCol] === '.' && !visited.has(key)) {
        visited.add(key);
        queue.push({ col: nextCol, row: nextRow });
      }
    }
  }

  const reachableOpenCells = visited.size;
  if (reachableOpenCells !== totalOpenCells) {
    errors.push(
      `Level ${level.id} (${level.name}) has disconnected regions: ${reachableOpenCells} reachable out of ${totalOpenCells} open cells.`
    );
  }

  return {
    valid: errors.length === 0,
    totalOpenCells,
    reachableOpenCells,
    errors,
  };
}
