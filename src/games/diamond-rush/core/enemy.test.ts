import { describe, expect, it } from 'vitest';
import { move, renderAscii } from './engine';
import { createInitialState, parseAsciiLevel } from './parser';
import { GameSession } from './session';
import level8Raw from '../levels/level8_enemy.txt?raw';

describe('Patrolling Enemy Mechanics (Phase 5.3)', () => {
  it('parses enemy entities correctly from ASCII map', () => {
    const level = parseAsciiLevel(level8Raw);
    expect(level.width).toBe(11);
    expect(level.height).toBe(7);
    expect(level.playerStart).toEqual({ x: 1, y: 1 });
    expect(level.enemies.length).toBe(1);
    expect(level.enemies[0]).toEqual({
      id: 1,
      x: 4,
      y: 3,
      direction: 'left',
      alive: true,
    });
  });

  it('patrols 1 step along direction per player move and reverses at obstacles', () => {
    const level = parseAsciiLevel(level8Raw);
    let state = createInitialState(level);

    // Initial position
    expect(state.enemies[0].x).toBe(4);
    expect(state.enemies[0].direction).toBe('left');

    // Move 1: P (1, 1) -> (1, 2). Enemy moves left to (3, 3)
    state = move(state, 'down');
    expect(state.enemies[0].x).toBe(3);
    expect(state.enemies[0].direction).toBe('left');

    // Move 2: P (1, 2) -> (1, 3). Enemy moves left to (2, 3)
    state = move(state, 'down');
    expect(state.enemies[0].x).toBe(2);
    expect(state.enemies[0].direction).toBe('left');

    // Move 3: P (1, 3) -> (1, 4). Enemy moves left to (1, 3)
    state = move(state, 'down');
    expect(state.enemies[0].x).toBe(1);
    expect(state.enemies[0].direction).toBe('left');

    // Move 4: Enemy at (1, 3) hits wall at x=0, reverses right and steps to (2, 3)
    state = move(state, 'down');
    expect(state.enemies[0].x).toBe(2);
    expect(state.enemies[0].direction).toBe('right');
  });

  it('defeats player if enemy steps onto player tile', () => {
    const ambushMap = `
#####
#P.SE
#####
`;
    const level = parseAsciiLevel(ambushMap);
    let state = createInitialState(level);

    // Enemy starts at (3, 1) with direction 'left'
    // Move 1: Player moves right into (2, 1). Enemy simultaneously moves left into (2, 1)!
    state = move(state, 'right');
    expect(state.player).toEqual({ x: 2, y: 1 });
    expect(state.enemies[0].x).toBe(2);
    expect(state.enemies[0].y).toBe(1);
    expect(state.status).toBe('lost');
  });

  it('defeats player if player steps directly into an enemy', () => {
    const faceMap = `
#####
#PSE#
#####
`;
    const level = parseAsciiLevel(faceMap);
    let state = createInitialState(level);

    // Player at (1, 1), Enemy at (2, 1)
    // Player attempts to walk right directly into enemy
    state = move(state, 'right');
    expect(state.player).toEqual({ x: 2, y: 1 });
    expect(state.status).toBe('lost');
  });

  it('crushes enemy when rolling boulder rolls into it', () => {
    const crushMap = `
#####
#R.PE
#S..#
#####
`;
    const level = parseAsciiLevel(crushMap);
    let state = createInitialState(level);

    // Boulder at (1, 1) rolls down into (1, 2)
    // Enemy at (1, 2) is crushed by the rolling boulder
    state = move(state, 'left'); // P moves (3, 1) -> (2, 1)
    expect(state.boulders[0].x).toBe(1);
    expect(state.boulders[0].y).toBe(2);
    expect(state.enemies[0].alive).toBe(false);
  });

  it('completes the teaching level level8_enemy.txt by slipping behind enemy', () => {
    const level = parseAsciiLevel(level8Raw);
    let state = createInitialState(level);

    const moves: ('up' | 'down' | 'left' | 'right')[] = [
      'down',
      'down',
      'down',
      'down',
      'right',
      'right',
      'right',
      'right',
      'up',
      'up',
      'right',
      'right',
      'down',
      'right',
      'right',
      'down',
    ];

    for (const dir of moves) {
      state = move(state, dir);
      if (state.status !== 'won') {
        expect(state.status).toBe('playing');
      }
    }

    expect(state.collectedDiamonds).toBe(1);
    expect(state.status).toBe('won');
  });

  it('pure session undo reverses enemy patrol deterministically', () => {
    const level = parseAsciiLevel(level8Raw);
    const session = new GameSession(level);

    expect(session.getState().enemies[0].x).toBe(4);
    expect(session.getState().enemies[0].direction).toBe('left');

    session.move('down'); // P: (1, 2), E: (3, 3)
    expect(session.getState().enemies[0].x).toBe(3);

    session.move('down'); // P: (1, 3), E: (2, 3)
    expect(session.getState().enemies[0].x).toBe(2);

    session.undo();
    expect(session.getState().enemies[0].x).toBe(3);
    expect(session.getState().player).toEqual({ x: 1, y: 2 });

    session.undo();
    expect(session.getState().enemies[0].x).toBe(4);
    expect(session.getState().enemies[0].direction).toBe('left');
    expect(session.getState().player).toEqual({ x: 1, y: 1 });
  });

  it('renders ASCII map with S for enemy', () => {
    const level = parseAsciiLevel(level8Raw);
    const state = createInitialState(level);
    const ascii = renderAscii(state);
    expect(ascii).toContain('S');
  });
});
