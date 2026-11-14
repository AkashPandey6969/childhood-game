import { describe, expect, it } from 'vitest';
import { isGateOpen, move } from './engine';
import { createInitialState, parseAsciiLevel } from './parser';
import { GameSession } from './session';
import level7Raw from '../levels/level7_boulder.txt?raw';

describe('Rolling Boulder Mechanics (Phase 5.2)', () => {
  it('parses boulder entities correctly from ASCII map', () => {
    const level = parseAsciiLevel(level7Raw);
    expect(level.width).toBe(7);
    expect(level.height).toBe(7);
    expect(level.playerStart).toEqual({ x: 3, y: 2 });
    expect(level.boulders.length).toBe(1);
    expect(level.boulders[0]).toEqual({
      id: 1,
      x: 3,
      y: 1,
      direction: 'down',
      active: true,
    });
  });

  it('rolls 1 tile down per valid player move', () => {
    const level = parseAsciiLevel(level7Raw);
    let state = createInitialState(level);

    expect(state.boulders[0].y).toBe(1);
    expect(state.boulders[0].active).toBe(true);

    // Move player down to (3, 3)
    state = move(state, 'down');
    expect(state.player).toEqual({ x: 3, y: 3 });
    expect(state.boulders[0].y).toBe(2);
    expect(state.boulders[0].active).toBe(true);

    // Move player left to (2, 3) - dodging the boulder
    state = move(state, 'left');
    expect(state.player).toEqual({ x: 2, y: 3 });
    expect(state.boulders[0].y).toBe(3);
    expect(state.boulders[0].active).toBe(true);
  });

  it('fills a hole when rolling into it, becoming submerged and making tile walkable floor', () => {
    const level = parseAsciiLevel(level7Raw);
    let state = createInitialState(level);

    state = move(state, 'down'); // P: (3, 3), R: (3, 2)
    state = move(state, 'left'); // P: (2, 3), R: (3, 3)
    state = move(state, 'left'); // P: (1, 3), R: rolls into hole at (3, 4)

    expect(state.boulders[0].x).toBe(3);
    expect(state.boulders[0].y).toBe(4);
    expect(state.boulders[0].active).toBe(false);
    expect(state.boulders[0].submerged).toBe(true);
    expect(state.grid[4][3]).toBe('floor');

    // Player walks onto the submerged boulder / filled hole
    state = move(state, 'right'); // P: (2, 3)
    state = move(state, 'right'); // P: (3, 3)
    state = move(state, 'down');  // P: (3, 4) - valid move on filled hole!
    expect(state.player).toEqual({ x: 3, y: 4 });
  });

  it('crushes player if boulder rolls onto the player', () => {
    const crushMap = `
#####
#.R.#
#...#
#.P.#
#..E#
#####
`;
    const level = parseAsciiLevel(crushMap);
    let state = createInitialState(level);

    // Player moves UP to (2, 2) while Boulder at (2, 1) rolls down to (2, 2)
    state = move(state, 'up');
    expect(state.player).toEqual({ x: 2, y: 2 });
    expect(state.boulders[0].x).toBe(2);
    expect(state.boulders[0].y).toBe(2);
    expect(state.status).toBe('lost');
  });

  it('prevents player from walking into a boulder', () => {
    const map = `
#####
#P.RE#
#####
`;
    const level = parseAsciiLevel(map);
    let state = createInitialState(level);

    // Boulder at (3, 1) rolls down into wall at (3, 2) or stays if wall blocks it
    // With direction 'down', at (3, 1), ny = 2 is wall, so active becomes false
    expect(state.boulders[0].x).toBe(3);
    expect(state.boulders[0].y).toBe(1);

    // Player at (1, 1) moves right to (2, 1)
    state = move(state, 'right');
    expect(state.player).toEqual({ x: 2, y: 1 });
    // Boulder hit wall at (3, 2) so stayed at (3, 1) with active: false
    expect(state.boulders[0].active).toBe(false);

    // Player tries to move right into boulder at (3, 1) -> blocked!
    const nextState = move(state, 'right');
    expect(nextState).toBe(state);
    expect(nextState.player).toEqual({ x: 2, y: 1 });
  });

  it('stops rolling upon hitting a wall', () => {
    const withPlayer = `
#####
#R.PE#
#...#
#####
`;
    const lvl = parseAsciiLevel(withPlayer);
    let state = createInitialState(lvl);

    expect(state.boulders[0].active).toBe(true);

    // Move 1: Boulder moves from (1, 1) to (1, 2)
    state = move(state, 'down');
    expect(state.boulders[0].y).toBe(2);
    expect(state.boulders[0].active).toBe(true);

    // Move 2: Boulder encounters wall at (1, 3), stops at (1, 2) with active: false
    state = move(state, 'up');
    expect(state.boulders[0].y).toBe(2);
    expect(state.boulders[0].active).toBe(false);
  });

  it('activates switches when rolling onto pressure plates', () => {
    const switchMap = `
#####
#R.P#
#s..#
#G..#
#*..#
#E..#
#####
`;
    const lvl = parseAsciiLevel(switchMap);
    let state = createInitialState(lvl);

    // Boulder at (1, 1), switch at (1, 2), gate at (1, 3)
    state = move(state, 'down'); // P moves (3, 1) -> (3, 2). Boulder rolls to (1, 2) onto switch!
    expect(state.boulders[0].x).toBe(1);
    expect(state.boulders[0].y).toBe(2);

    // Switch should be activated by boulder
    expect(isGateOpen(state)).toBe(true);
  });

  it('completes the full teaching level level7_boulder.txt', () => {
    const level = parseAsciiLevel(level7Raw);
    let state = createInitialState(level);

    const moves: ('up' | 'down' | 'left' | 'right')[] = [
      'down',  // P: (3, 3), R: (3, 2)
      'left',  // P: (2, 3), R: (3, 3)
      'left',  // P: (1, 3), R: (3, 4) in hole
      'right', // P: (2, 3)
      'right', // P: (3, 3)
      'down',  // P: (3, 4) on filled hole
      'down',  // P: (3, 5) collect diamond
      'right', // P: (4, 5) exit
    ];

    for (const dir of moves) {
      state = move(state, dir);
    }

    expect(state.collectedDiamonds).toBe(1);
    expect(state.status).toBe('won');
  });

  it('pure session undo cleanly reverses boulder state', () => {
    const level = parseAsciiLevel(level7Raw);
    const session = new GameSession(level);

    expect(session.getState().boulders[0].y).toBe(1);

    session.move('down');
    expect(session.getState().boulders[0].y).toBe(2);

    session.move('left');
    expect(session.getState().boulders[0].y).toBe(3);

    session.undo();
    expect(session.getState().boulders[0].y).toBe(2);
    expect(session.getState().player).toEqual({ x: 3, y: 3 });

    session.undo();
    expect(session.getState().boulders[0].y).toBe(1);
    expect(session.getState().player).toEqual({ x: 3, y: 2 });
  });
});
