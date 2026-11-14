import { describe, expect, it } from 'vitest';
import { move, renderAscii } from './engine';
import { createInitialState, parseAsciiLevel } from './parser';
import { GameSession } from './session';
import level9Raw from '../levels/level9_tools.txt?raw';

describe('Tools: Pickaxe & Fire Item Mechanics (Phase 5.4)', () => {
  it('parses cracked walls, bushes, pickaxe and fire items from ASCII map', () => {
    const level = parseAsciiLevel(level9Raw);
    expect(level.width).toBe(9);
    expect(level.height).toBe(5);
    expect(level.playerStart).toEqual({ x: 1, y: 1 });
    expect(level.exitPos).toEqual({ x: 8, y: 1 });
    expect(level.grid[1][3]).toBe('cracked_wall');
    expect(level.grid[1][5]).toBe('bush');
    expect(level.grid[3][1]).toBe('pickaxe');
    expect(level.grid[3][4]).toBe('fire');
  });

  it('blocks player from walking into cracked walls without pickaxe', () => {
    const level = parseAsciiLevel(level9Raw);
    let state = createInitialState(level);

    expect(state.hasPickaxe).toBe(false);

    // Player moves to (2, 1) in front of cracked wall at (3, 1)
    state = move(state, 'right');
    expect(state.player).toEqual({ x: 2, y: 1 });

    // Attempts to move into cracked wall without pickaxe -> blocked!
    const blockedState = move(state, 'right');
    expect(blockedState).toBe(state);
    expect(blockedState.player).toEqual({ x: 2, y: 1 });
  });

  it('picks up pickaxe and breaks cracked wall into walkable floor', () => {
    const level = parseAsciiLevel(level9Raw);
    let state = createInitialState(level);

    // Move to pickaxe at (1, 3)
    state = move(state, 'down'); // (1, 2)
    state = move(state, 'down'); // (1, 3)
    expect(state.hasPickaxe).toBe(true);
    expect(state.grid[3][1]).toBe('floor');

    // Return to hallway and break cracked wall at (3, 1)
    state = move(state, 'up'); // (1, 2)
    state = move(state, 'up'); // (1, 1)
    state = move(state, 'right'); // (2, 1)
    state = move(state, 'right'); // (3, 1) - cracked wall breaks!
    expect(state.player).toEqual({ x: 3, y: 1 });
    expect(state.grid[1][3]).toBe('floor');
  });

  it('blocks player from walking into bushes without fire item', () => {
    const level = parseAsciiLevel(level9Raw);
    let state = createInitialState(level);

    // Get pickaxe and break wall to reach (4, 1) in front of bush at (5, 1)
    state = move(state, 'down');
    state = move(state, 'down');
    state = move(state, 'up');
    state = move(state, 'up');
    state = move(state, 'right');
    state = move(state, 'right'); // breaks wall, at (3, 1)
    state = move(state, 'right'); // at (4, 1)
    expect(state.player).toEqual({ x: 4, y: 1 });
    expect(state.hasFire).toBe(false);

    // Attempts to move into bush at (5, 1) without fire -> blocked!
    const blockedState = move(state, 'right');
    expect(blockedState).toBe(state);
    expect(blockedState.player).toEqual({ x: 4, y: 1 });
  });

  it('picks up fire item and burns bush into walkable floor', () => {
    const level = parseAsciiLevel(level9Raw);
    let state = createInitialState(level);

    // Get pickaxe and advance to chamber 2
    state = move(state, 'down');
    state = move(state, 'down');
    state = move(state, 'up');
    state = move(state, 'up');
    state = move(state, 'right');
    state = move(state, 'right');
    state = move(state, 'right'); // (4, 1)

    // Move down to grab fire item at (4, 3)
    state = move(state, 'down'); // (4, 2)
    state = move(state, 'down'); // (4, 3)
    expect(state.hasFire).toBe(true);
    expect(state.grid[3][4]).toBe('floor');

    // Move back up and burn bush at (5, 1)
    state = move(state, 'up'); // (4, 2)
    state = move(state, 'up'); // (4, 1)
    state = move(state, 'right'); // (5, 1) - bush burns!
    expect(state.player).toEqual({ x: 5, y: 1 });
    expect(state.grid[1][5]).toBe('floor');
  });

  it('completes the full teaching level level9_tools.txt', () => {
    const level = parseAsciiLevel(level9Raw);
    let state = createInitialState(level);

    const moves: ('up' | 'down' | 'left' | 'right')[] = [
      'down',  // (1, 2)
      'down',  // (1, 3) get pickaxe
      'up',    // (1, 2)
      'up',    // (1, 1)
      'right', // (2, 1)
      'right', // (3, 1) break cracked wall
      'right', // (4, 1) enter middle chamber
      'down',  // (4, 2)
      'down',  // (4, 3) get fire item
      'up',    // (4, 2)
      'up',    // (4, 1)
      'right', // (5, 1) burn bush
      'right', // (6, 1)
      'right', // (7, 1) collect diamond
      'right', // (8, 1) exit
    ];

    for (const dir of moves) {
      state = move(state, dir);
    }

    expect(state.collectedDiamonds).toBe(1);
    expect(state.hasPickaxe).toBe(true);
    expect(state.hasFire).toBe(true);
    expect(state.status).toBe('won');
  });

  it('pure session undo cleanly restores broken cracked walls and burned bushes', () => {
    const level = parseAsciiLevel(level9Raw);
    const session = new GameSession(level);

    // Get pickaxe
    session.move('down');
    session.move('down');
    expect(session.getState().hasPickaxe).toBe(true);

    // Move up and break wall
    session.move('up');
    session.move('up');
    session.move('right');
    session.move('right'); // breaks wall at (3, 1)
    expect(session.getState().grid[1][3]).toBe('floor');
    expect(session.getState().player).toEqual({ x: 3, y: 1 });

    // Undo breaking wall
    session.undo();
    expect(session.getState().grid[1][3]).toBe('cracked_wall');
    expect(session.getState().player).toEqual({ x: 2, y: 1 });

    // Undo back to start
    session.undo(); // (1, 1)
    session.undo(); // (1, 2)
    session.undo(); // (1, 3)
    session.undo(); // (1, 2)
    session.undo(); // (1, 1) initial
    expect(session.getState().hasPickaxe).toBe(false);
    expect(session.getState().grid[3][1]).toBe('pickaxe');
  });

  it('renders ASCII map with c, b, p, f symbols', () => {
    const level = parseAsciiLevel(level9Raw);
    const state = createInitialState(level);
    const ascii = renderAscii(state);
    expect(ascii).toContain('c');
    expect(ascii).toContain('b');
    expect(ascii).toContain('p');
    expect(ascii).toContain('f');
  });
});
