export type TileType = 
  | 'wall'     // #
  | 'floor'    // .
  | 'exit'     // E
  | 'diamond'  // *
  | 'block';   // B

export type Direction = 'up' | 'down' | 'left' | 'right';

export type GameStatus = 'playing' | 'won' | 'lost';

export interface Position {
  x: number;
  y: number;
}

export interface LevelData {
  width: number;
  height: number;
  playerStart: Position;
  exitPos: Position;
  totalDiamonds: number;
  grid: TileType[][];
}

export interface GameState {
  readonly width: number;
  readonly height: number;
  readonly grid: readonly (readonly TileType[])[];
  readonly player: Readonly<Position>;
  readonly collectedDiamonds: number;
  readonly totalDiamonds: number;
  readonly moveCount: number;
  readonly status: GameStatus;
}
