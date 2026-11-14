export type TileType = 
  | 'wall'        // #
  | 'floor'       // .
  | 'exit'        // E
  | 'diamond'     // *
  | 'block'       // B
  | 'key'         // k
  | 'door'        // D
  | 'switch'      // s
  | 'gate'        // G
  | 'hole'        // O
  | 'spikes'      // ^
  | 'spike_boots' // I
  | 'boulder';    // R

export type Direction = 'up' | 'down' | 'left' | 'right';

export type GameStatus = 'playing' | 'won' | 'lost';

export interface Position {
  x: number;
  y: number;
}

export interface BoulderState {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly direction: Direction;
  readonly active: boolean;
  readonly submerged?: boolean;
}

export interface LevelData {
  width: number;
  height: number;
  playerStart: Position;
  exitPos: Position;
  totalDiamonds: number;
  grid: TileType[][];
  boulders: BoulderState[];
}

export interface GameState {
  readonly width: number;
  readonly height: number;
  readonly grid: readonly (readonly TileType[])[];
  readonly baseGrid: readonly (readonly TileType[])[];
  readonly player: Readonly<Position>;
  readonly boulders: readonly BoulderState[];
  readonly collectedDiamonds: number;
  readonly totalDiamonds: number;
  readonly keys: number;
  readonly hasSpikeBoots: boolean;
  readonly moveCount: number;
  readonly status: GameStatus;
}
