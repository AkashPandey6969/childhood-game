export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Point {
  col: number;
  row: number;
}

export type CellType = 'wall' | 'open';

export type GameStatus = 'ready' | 'running' | 'paused' | 'dead';

export interface LevelConfig {
  id: number;
  name: string;
  maze: string[]; // 12 strings of 20 characters
  start: {
    col: number;
    row: number;
    dir: Direction;
  };
  tickMs: number;
  pointsPerFood: number;
}

export interface BonusBug {
  point: Point;
  ticksRemaining: number;
  initialTicks: number;
}

export interface GameState {
  levelId: number;
  status: GameStatus;
  snake: Point[]; // head is at index 0, tail at end
  direction: Direction;
  food: Point | null;
  bonusBug: BonusBug | null;
  score: number;
  foodsEatenTotal: number;
  ticks: number;
  deathReason: 'wall' | 'self' | null;
}
