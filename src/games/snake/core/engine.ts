import { GRID_COLS, GRID_ROWS, getLevelConfig } from './levels';
import { getInitialSnake } from './validation';
import { Direction, GameState, LevelConfig, Point } from './types';

export const OPPOSITE_DIRECTIONS: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

export const DIRECTION_DELTAS: Record<Direction, { dCol: number; dRow: number }> = {
  up: { dCol: 0, dRow: -1 },
  down: { dCol: 0, dRow: 1 },
  left: { dCol: -1, dRow: 0 },
  right: { dCol: 1, dRow: 0 },
};

export type RandomGenerator = (maxExclusive: number) => number;

export class SnakeEngine {
  private level: LevelConfig;
  private state: GameState;
  private inputQueue: Direction[] = [];
  private foodsEatenSinceBug: number = 0;
  private rng: RandomGenerator;

  constructor(levelIdOrConfig: number | LevelConfig, rng?: RandomGenerator) {
    this.level = typeof levelIdOrConfig === 'number' ? getLevelConfig(levelIdOrConfig) : levelIdOrConfig;
    this.rng = rng || ((max: number) => Math.floor(Math.random() * max));

    const initialSnake = getInitialSnake(this.level.start);

    this.state = {
      levelId: this.level.id,
      status: 'ready',
      snake: initialSnake,
      direction: this.level.start.dir,
      food: null,
      bonusBug: null,
      score: 0,
      foodsEatenTotal: 0,
      ticks: 0,
      deathReason: null,
    };

    // Spawn initial food
    this.spawnFood();
  }

  public getState(): Readonly<GameState> {
    return this.state;
  }

  public getLevel(): Readonly<LevelConfig> {
    return this.level;
  }

  public start(): void {
    if (this.state.status === 'ready' || this.state.status === 'paused') {
      this.state.status = 'running';
    }
  }

  public pause(): void {
    if (this.state.status === 'running') {
      this.state.status = 'paused';
    }
  }

  public resume(): void {
    if (this.state.status === 'paused') {
      this.state.status = 'running';
    }
  }

  public restart(): void {
    const initialSnake = getInitialSnake(this.level.start);
    this.inputQueue = [];
    this.foodsEatenSinceBug = 0;

    this.state = {
      levelId: this.level.id,
      status: 'ready',
      snake: initialSnake,
      direction: this.level.start.dir,
      food: null,
      bonusBug: null,
      score: 0,
      foodsEatenTotal: 0,
      ticks: 0,
      deathReason: null,
    };

    this.spawnFood();
  }

  public changeLevel(levelId: number): void {
    this.level = getLevelConfig(levelId);
    this.restart();
  }

  /**
   * Enqueues a directional input.
   * Keeps at most 2 queued turns and ignores 180-degree reversals.
   */
  public queueDirection(dir: Direction): boolean {
    if (this.state.status === 'ready') {
      this.state.status = 'running';
    }

    if (this.state.status !== 'running') {
      return false;
    }

    const lastDir = this.inputQueue.length > 0
      ? this.inputQueue[this.inputQueue.length - 1]
      : this.state.direction;

    // Reject 180-degree reversals or redundant duplicate inputs
    if (dir === lastDir || dir === OPPOSITE_DIRECTIONS[lastDir]) {
      return false;
    }

    // Limit buffer to 2 queued turns
    if (this.inputQueue.length < 2) {
      this.inputQueue.push(dir);
      return true;
    }

    return false;
  }

  /**
   * Executes a single game tick.
   * Advances snake, checks wrap-around, wall collisions, self collisions, food, and bonus bug.
   */
  public tick(): {
    eatenFood: boolean;
    eatenBug: boolean;
    died: boolean;
    wrapped: boolean;
  } {
    const result = {
      eatenFood: false,
      eatenBug: false,
      died: false,
      wrapped: false,
    };

    if (this.state.status !== 'running') {
      return result;
    }

    this.state.ticks++;

    // 1. Consume queued turn if available
    if (this.inputQueue.length > 0) {
      this.state.direction = this.inputQueue.shift()!;
    }

    // 2. Compute next head position with wrap-around
    const delta = DIRECTION_DELTAS[this.state.direction];
    const rawCol = this.state.snake[0].col + delta.dCol;
    const rawRow = this.state.snake[0].row + delta.dRow;

    const nextCol = (rawCol + GRID_COLS) % GRID_COLS;
    const nextRow = (rawRow + GRID_ROWS) % GRID_ROWS;

    if (rawCol < 0 || rawCol >= GRID_COLS || rawRow < 0 || rawRow >= GRID_ROWS) {
      result.wrapped = true;
    }

    const nextHead: Point = { col: nextCol, row: nextRow };

    // 3. Check for wall collision
    if (this.level.maze[nextRow][nextCol] === '#') {
      this.state.status = 'dead';
      this.state.deathReason = 'wall';
      result.died = true;
      return result;
    }

    // 4. Check if eating regular food
    const isEatingFood = this.state.food !== null &&
      nextHead.col === this.state.food.col &&
      nextHead.row === this.state.food.row;

    // 5. Check for self collision
    // If not eating, tail will vacate this tick, so collision check ignores tail segment.
    const bodyToCheck = isEatingFood
      ? this.state.snake
      : this.state.snake.slice(0, -1);

    for (const segment of bodyToCheck) {
      if (segment.col === nextHead.col && segment.row === nextHead.row) {
        this.state.status = 'dead';
        this.state.deathReason = 'self';
        result.died = true;
        return result;
      }
    }

    // 6. Check if eating bonus bug
    const isEatingBug = this.state.bonusBug !== null &&
      nextHead.col === this.state.bonusBug.point.col &&
      nextHead.row === this.state.bonusBug.point.row;

    // 7. Advance snake body
    this.state.snake.unshift(nextHead);
    if (!isEatingFood) {
      this.state.snake.pop();
    }

    let justSpawnedBug = false;

    // 8. Handle food consumption
    if (isEatingFood) {
      result.eatenFood = true;
      this.state.score += this.level.pointsPerFood;
      this.state.foodsEatenTotal++;
      this.foodsEatenSinceBug++;

      this.spawnFood();

      // Check if bonus bug should appear (every 5 foods)
      if (this.foodsEatenSinceBug >= 5 && this.state.bonusBug === null) {
        this.spawnBonusBug();
        this.foodsEatenSinceBug = 0;
        justSpawnedBug = true;
      }
    }

    // 9. Handle bonus bug consumption or tick countdown
    if (isEatingBug) {
      result.eatenBug = true;
      this.state.score += this.level.pointsPerFood * 5;
      this.state.bonusBug = null;
    } else if (this.state.bonusBug !== null && !justSpawnedBug) {
      this.state.bonusBug.ticksRemaining--;
      if (this.state.bonusBug.ticksRemaining <= 0) {
        this.state.bonusBug = null;
      }
    }

    return result;
  }

  /**
   * Spawns a food item on a random open cell that is not on the snake.
   */
  public spawnFood(): boolean {
    const candidates = this.getAvailableCells();
    if (candidates.length === 0) {
      this.state.food = null;
      return false; // Victory or full board!
    }

    const index = this.rng(candidates.length);
    this.state.food = candidates[index];
    return true;
  }

  /**
   * Spawns a bonus bug on an open cell not on the snake and not on current food.
   */
  public spawnBonusBug(): boolean {
    const candidates = this.getAvailableCells().filter(
      cell => !(this.state.food && cell.col === this.state.food.col && cell.row === this.state.food.row)
    );

    if (candidates.length === 0) {
      this.state.bonusBug = null;
      return false;
    }

    const index = this.rng(candidates.length);
    this.state.bonusBug = {
      point: candidates[index],
      ticksRemaining: 40,
      initialTicks: 40,
    };
    return true;
  }

  /**
   * Returns all open cells not occupied by the snake.
   */
  public getAvailableCells(): Point[] {
    const snakeSet = new Set<string>();
    for (const seg of this.state.snake) {
      snakeSet.add(`${seg.col},${seg.row}`);
    }

    const openCells: Point[] = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (this.level.maze[r][c] === '.' && !snakeSet.has(`${c},${r}`)) {
          openCells.push({ col: c, row: r });
        }
      }
    }

    return openCells;
  }
}
