import { describe, it, expect } from 'vitest';
import { parseAsciiLevel, createInitialState } from './parser';
import { move, renderAscii } from './engine';
import { GameSession } from './session';
import { Direction } from './types';

describe('Level Parser', () => {
  const sampleMap = `
#####
#P.*#
#..E#
#####
`;

  it('parses valid ascii level correctly', () => {
    const level = parseAsciiLevel(sampleMap);
    expect(level.width).toBe(5);
    expect(level.height).toBe(4);
    expect(level.playerStart).toEqual({ x: 1, y: 1 });
    expect(level.exitPos).toEqual({ x: 3, y: 2 });
    expect(level.totalDiamonds).toBe(1);
    expect(level.grid[1][1]).toBe('floor');
    expect(level.grid[1][3]).toBe('diamond');
    expect(level.grid[2][3]).toBe('exit');
  });

  it('throws error for empty level', () => {
    expect(() => parseAsciiLevel('')).toThrow('Level data is empty');
  });

  it('throws error if player start is missing', () => {
    const map = `
#####
#...#
#..E#
#####
`;
    expect(() => parseAsciiLevel(map)).toThrow('missing a player start');
  });

  it('throws error if multiple player starts exist', () => {
    const map = `
#####
#P.P#
#..E#
#####
`;
    expect(() => parseAsciiLevel(map)).toThrow('Multiple player starts');
  });

  it('throws error if exit is missing', () => {
    const map = `
#####
#P..#
#...#
#####
`;
    expect(() => parseAsciiLevel(map)).toThrow('missing an exit');
  });

  it('throws error for unrecognized characters', () => {
    const map = `
#####
#P?E#
#####
`;
    expect(() => parseAsciiLevel(map)).toThrow("Unrecognized map character '?'");
  });
});

describe('Pure Engine Movement', () => {
  const testLevel = parseAsciiLevel(`
#######
#P...*#
#..E..#
#######
`);

  it('moves player across floor and increments move count', () => {
    const state0 = createInitialState(testLevel);
    expect(state0.player).toEqual({ x: 1, y: 1 });
    expect(state0.moveCount).toBe(0);

    const state1 = move(state0, 'right');
    expect(state1.player).toEqual({ x: 2, y: 1 });
    expect(state1.moveCount).toBe(1);
    expect(state0.player).toEqual({ x: 1, y: 1 }); // Immutability
  });

  it('blocks movement into walls without changing state', () => {
    const state0 = createInitialState(testLevel);
    const stateBlocked = move(state0, 'up'); // Wall above
    expect(stateBlocked).toBe(state0); // Identical reference
    expect(stateBlocked.player).toEqual({ x: 1, y: 1 });
    expect(stateBlocked.moveCount).toBe(0);
  });

  it('collects diamonds and replaces them with floor', () => {
    const state0 = createInitialState(testLevel);
    // P at (1,1). Diamond at (5,1).
    let state = move(state0, 'right'); // (2,1)
    state = move(state, 'right');      // (3,1)
    state = move(state, 'right');      // (4,1)
    expect(state.collectedDiamonds).toBe(0);

    const diamondState = move(state, 'right'); // (5,1) - collected!
    expect(diamondState.player).toEqual({ x: 5, y: 1 });
    expect(diamondState.collectedDiamonds).toBe(1);
    expect(diamondState.grid[1][5]).toBe('floor');
    // Ensure original state grid still has diamond (immutability)
    expect(state.grid[1][5]).toBe('diamond');
  });

  it('blocks exit until all diamonds are collected', () => {
    const state0 = createInitialState(testLevel);
    // E is at (3,2).
    let state = move(state0, 'right'); // (2,1)
    state = move(state, 'right');      // (3,1)
    const tryExit = move(state, 'down'); // (3,2) E without diamond
    expect(tryExit).toBe(state); // Blocked
    expect(tryExit.status).toBe('playing');
  });

  it('wins when reaching exit with all diamonds', () => {
    const state0 = createInitialState(testLevel);
    let state = state0;
    // Walk to diamond at (5,1): 4 rights
    state = move(state, 'right');
    state = move(state, 'right');
    state = move(state, 'right');
    state = move(state, 'right');
    expect(state.collectedDiamonds).toBe(1);

    // Walk back towards exit at (3,2): left 2 times, down 1 time
    state = move(state, 'left');
    state = move(state, 'left');
    state = move(state, 'down');

    expect(state.player).toEqual({ x: 3, y: 2 });
    expect(state.status).toBe('won');
    expect(state.moveCount).toBe(7);

    // After winning, subsequent moves are no-ops
    const postWin = move(state, 'left');
    expect(postWin).toBe(state);
  });
});

describe('GameSession (Undo & Restart)', () => {
  const level = parseAsciiLevel(`
#####
#P.*#
#..E#
#####
`);

  it('supports undoing moves and restoring diamond state', () => {
    const session = new GameSession(level);
    expect(session.canUndo()).toBe(false);

    expect(session.move('right')).toBe(true); // (2,1)
    expect(session.move('right')).toBe(true); // (3,1) collects diamond
    expect(session.getState().collectedDiamonds).toBe(1);
    expect(session.getState().grid[1][3]).toBe('floor');

    // Undo diamond collection
    expect(session.undo()).toBe(true);
    expect(session.getState().player).toEqual({ x: 2, y: 1 });
    expect(session.getState().collectedDiamonds).toBe(0);
    expect(session.getState().grid[1][3]).toBe('diamond');

    // Undo step 1
    expect(session.undo()).toBe(true);
    expect(session.getState().player).toEqual({ x: 1, y: 1 });
    expect(session.canUndo()).toBe(false);
  });

  it('supports restarting the level completely', () => {
    const session = new GameSession(level);
    session.move('right');
    session.move('right');
    expect(session.getState().moveCount).toBe(2);

    session.restart();
    expect(session.getState().moveCount).toBe(0);
    expect(session.getState().player).toEqual({ x: 1, y: 1 });
    expect(session.getState().collectedDiamonds).toBe(0);
    expect(session.canUndo()).toBe(false);
  });
});

describe('Terminal Playthrough Simulation', () => {
  it('simulates and prints a complete playthrough of a puzzle level', () => {
    const asciiMap = `
#######
#P...*#
#.###.#
#...*.#
#####E#
`.trim();

    const level = parseAsciiLevel(asciiMap);
    const session = new GameSession(level);

    const moves: Direction[] = [
      'right', 'right', 'right', 'right', // (5,1) collect diamond 1
      'down', 'down',                      // (5,3)
      'left',                              // (4,3) collect diamond 2
      'right',                             // (5,3) back to path
      'down'                               // (5,4) exit E -> WIN!
    ];

    const logs: string[] = [];
    logs.push('\n=== INITIAL LEVEL MAP ===\n' + renderAscii(session.getState()));

    for (let i = 0; i < moves.length; i++) {
      const dir = moves[i];
      const success = session.move(dir);
      expect(success).toBe(true);
      logs.push(
        `\n[Move ${i + 1}: ${dir.toUpperCase()}] Diamonds: ${session.getState().collectedDiamonds}/${session.getState().totalDiamonds} Status: ${session.getState().status}\n` +
        renderAscii(session.getState())
      );
    }

    expect(session.getState().status).toBe('won');
    expect(session.getState().collectedDiamonds).toBe(2);

    // Print simulation trace to test output
    console.log(logs.join('\n'));
  });
});
