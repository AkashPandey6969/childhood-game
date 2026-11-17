import { describe, it, expect } from 'vitest';
import { parseAsciiLevel } from './parser';
import { GameSession } from './session';
import level1Raw from '../levels/level1.txt?raw';

describe('Level 1 File Validation', () => {
  it('loads and parses level1.txt without errors', () => {
    const level = parseAsciiLevel(level1Raw);

    expect(level.width).toBe(9);
    expect(level.height).toBe(7);
    expect(level.totalDiamonds).toBe(3);
    expect(level.playerStart).toEqual({ x: 1, y: 1 });
    expect(level.exitPos).toEqual({ x: 7, y: 5 });

    const session = new GameSession(level);
    expect(session.getState().status).toBe('playing');
  });
});
