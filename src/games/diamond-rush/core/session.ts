import { move } from './engine';
import { createInitialState } from './parser';
import { Direction, GameState, LevelData } from './types';

export class GameSession {
  private readonly initialState: GameState;
  private currentState: GameState;
  private history: GameState[] = [];

  constructor(level: LevelData) {
    this.initialState = createInitialState(level);
    this.currentState = this.initialState;
  }

  getState(): GameState {
    return this.currentState;
  }

  getHistory(): readonly GameState[] {
    return this.history;
  }

  canUndo(): boolean {
    return this.history.length > 0;
  }

  move(direction: Direction): boolean {
    const nextState = move(this.currentState, direction);

    // If state didn't change, the move was blocked
    if (nextState === this.currentState) {
      return false;
    }

    this.history.push(this.currentState);
    this.currentState = nextState;
    return true;
  }

  undo(): boolean {
    if (this.history.length === 0) {
      return false;
    }

    const previousState = this.history.pop()!;
    this.currentState = previousState;
    return true;
  }

  restart(): void {
    this.currentState = this.initialState;
    this.history = [];
  }
}
