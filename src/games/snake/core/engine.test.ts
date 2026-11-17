import { describe, expect, it } from 'vitest';
import { SnakeEngine } from './engine';

describe('Snake Core Logic Engine (Nokia-style)', () => {
  it('initializes with length 3 at level start position', () => {
    // Level 0: start at (3,6) heading right
    const engine = new SnakeEngine(0);
    const state = engine.getState();

    expect(state.levelId).toBe(0);
    expect(state.status).toBe('ready');
    expect(state.score).toBe(0);
    expect(state.direction).toBe('right');
    expect(state.snake.length).toBe(3);
    // Head at (3,6), trailing body at (2,6) and (1,6)
    expect(state.snake[0]).toEqual({ col: 3, row: 6 });
    expect(state.snake[1]).toEqual({ col: 2, row: 6 });
    expect(state.snake[2]).toEqual({ col: 1, row: 6 });
    expect(state.food).not.toBeNull();
    expect(state.bonusBug).toBeNull();
  });

  it('moves one cell per tick in its direction', () => {
    const engine = new SnakeEngine(0);
    engine.start();

    // Ensure food is far away so it doesn't interfere
    const tickResult = engine.tick();
    expect(tickResult.died).toBe(false);

    const state = engine.getState();
    expect(state.snake[0]).toEqual({ col: 4, row: 6 });
    expect(state.snake[1]).toEqual({ col: 3, row: 6 });
    expect(state.snake[2]).toEqual({ col: 2, row: 6 });
    expect(state.ticks).toBe(1);
  });

  it('wraps around the grid edges on Level 0 (open field)', () => {
    const engine = new SnakeEngine(0);
    engine.start();

    // Snake starts at (3,6) heading right.
    // Move 16 times to reach col 19, then 1 more to wrap to col 0.
    for (let i = 0; i < 16; i++) {
      engine.tick();
    }
    expect(engine.getState().snake[0].col).toBe(19);

    const wrapResult = engine.tick();
    expect(wrapResult.wrapped).toBe(true);
    expect(wrapResult.died).toBe(false);
    expect(engine.getState().snake[0].col).toBe(0);
    expect(engine.getState().snake[0].row).toBe(6);
  });

  it('dies when hitting a wall on Level 1 (solid border)', () => {
    // Level 1: border wall at row 0, row 11, col 0, col 19. Start (3,6) heading right.
    const engine = new SnakeEngine(1);
    engine.start();

    // Turn up towards top border (row 0 is wall)
    engine.queueDirection('up');
    engine.tick(); // head at (3,5)
    engine.tick(); // head at (3,4)
    engine.tick(); // head at (3,3)
    engine.tick(); // head at (3,2)
    engine.tick(); // head at (3,1)
    expect(engine.getState().status).toBe('running');

    // Next tick moves head to (3,0) which is '#'
    const result = engine.tick();
    expect(result.died).toBe(true);
    expect(engine.getState().status).toBe('dead');
    expect(engine.getState().deathReason).toBe('wall');
  });

  it('ignores 180-degree reversal attempts', () => {
    const engine = new SnakeEngine(0);
    engine.start();

    expect(engine.getState().direction).toBe('right');
    // Immediate left should be rejected
    const queued = engine.queueDirection('left');
    expect(queued).toBe(false);

    engine.tick();
    expect(engine.getState().direction).toBe('right');
  });

  it('buffers up to 2 direction turns', () => {
    const engine = new SnakeEngine(0);
    engine.start(); // heading right

    expect(engine.queueDirection('up')).toBe(true);
    expect(engine.queueDirection('left')).toBe(true);
    // 3rd turn rejected
    expect(engine.queueDirection('down')).toBe(false);

    // 1st tick executes 'up'
    engine.tick();
    expect(engine.getState().direction).toBe('up');

    // 2nd tick executes 'left'
    engine.tick();
    expect(engine.getState().direction).toBe('left');
  });

  it('grows by 1 cell and increases score when eating food', () => {
    // Mock RNG to place food right in front of head at (4,6)
    const mockRng = () => 0; // deterministic index
    const engine = new SnakeEngine(0, mockRng);
    engine.start();

    // Manually force food location directly ahead
    (engine.getState() as any).food = { col: 4, row: 6 };

    const initialLength = engine.getState().snake.length;
    const initialScore = engine.getState().score;

    const result = engine.tick();
    expect(result.eatenFood).toBe(true);
    expect(engine.getState().snake.length).toBe(initialLength + 1);
    // Level 0 gives 10 points per food
    expect(engine.getState().score).toBe(initialScore + 10);
    expect(engine.getState().foodsEatenTotal).toBe(1);
  });

  it('spawns bonus bug after every 5 foods and counts down 40 ticks', () => {
    const engine = new SnakeEngine(0);
    engine.start();

    // Simulate eating 5 foods
    for (let f = 0; f < 5; f++) {
      const head = engine.getState().snake[0];
      const dir = engine.getState().direction;
      const dCol = dir === 'right' ? 1 : 0;
      const nextCol = (head.col + dCol + 20) % 20;

      // Place food directly ahead
      (engine.getState() as any).food = { col: nextCol, row: head.row };
      engine.tick();
    }

    const state = engine.getState();
    expect(state.foodsEatenTotal).toBe(5);
    expect(state.bonusBug).not.toBeNull();
    expect(state.bonusBug!.ticksRemaining).toBe(40);

    // Tick 39 times without eating bug
    for (let t = 0; t < 39; t++) {
      (engine.getState() as any).food = { col: 0, row: 0 }; // keep food away
      engine.tick();
    }
    expect(engine.getState().bonusBug).not.toBeNull();
    expect(engine.getState().bonusBug!.ticksRemaining).toBe(1);

    // 40th tick expires bug
    engine.tick();
    expect(engine.getState().bonusBug).toBeNull();
  });

  it('eating bonus bug awards 5x points without growing snake', () => {
    const engine = new SnakeEngine(0);
    engine.start();

    // Spawn bonus bug directly ahead
    const head = engine.getState().snake[0];
    const bugCol = (head.col + 1) % 20;
    (engine.getState() as any).bonusBug = {
      point: { col: bugCol, row: head.row },
      ticksRemaining: 40,
      initialTicks: 40,
    };
    (engine.getState() as any).food = { col: 0, row: 0 }; // food elsewhere

    const prevLength = engine.getState().snake.length;
    const prevScore = engine.getState().score;

    const result = engine.tick();
    expect(result.eatenBug).toBe(true);
    expect(engine.getState().snake.length).toBe(prevLength); // Does NOT grow
    // Level 0 gives 10 * 5 = 50 points
    expect(engine.getState().score).toBe(prevScore + 50);
    expect(engine.getState().bonusBug).toBeNull();
  });

  it('dies when colliding with its own body', () => {
    const engine = new SnakeEngine(0);
    engine.start();

    // Grow snake to length 5
    for (let i = 0; i < 2; i++) {
      const head = engine.getState().snake[0];
      (engine.getState() as any).food = { col: (head.col + 1) % 20, row: head.row };
      engine.tick();
    }
    expect(engine.getState().snake.length).toBe(5);

    // Perform U-turn: down, left, up (loop into body)
    engine.queueDirection('down');
    engine.tick();
    engine.queueDirection('left');
    engine.tick();
    engine.queueDirection('up');
    const result = engine.tick(); // Collides into original horizontal body segment

    expect(result.died).toBe(true);
    expect(engine.getState().status).toBe('dead');
    expect(engine.getState().deathReason).toBe('self');
  });

  it('pauses, resumes, and restarts correctly', () => {
    const engine = new SnakeEngine(2);
    expect(engine.getState().status).toBe('ready');

    engine.start();
    expect(engine.getState().status).toBe('running');

    engine.pause();
    expect(engine.getState().status).toBe('paused');

    // Ticks do nothing while paused
    const headBefore = engine.getState().snake[0];
    engine.tick();
    expect(engine.getState().snake[0]).toEqual(headBefore);

    engine.resume();
    expect(engine.getState().status).toBe('running');
    engine.tick();
    expect(engine.getState().snake[0]).not.toEqual(headBefore);

    engine.restart();
    expect(engine.getState().status).toBe('ready');
    expect(engine.getState().score).toBe(0);
    expect(engine.getState().snake.length).toBe(3);
  });
});
