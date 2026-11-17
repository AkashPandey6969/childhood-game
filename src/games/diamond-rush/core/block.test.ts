import { describe, it, expect } from 'vitest';
import { parseAsciiLevel, createInitialState } from './parser';
import { move, renderAscii } from './engine';
import { GameSession } from './session';

describe('Pushable Blocks (B)', () => {
  it('parses blocks correctly from ASCII', () => {
    const level = parseAsciiLevel(`
######
#P.B.#
#...E#
######
`);
    expect(level.grid[1][3]).toBe('block');
  });

  it('pushes block into adjacent open floor', () => {
    const level = parseAsciiLevel(`
#######
#P.B..#
#...E.#
#######
`);
    const state0 = createInitialState(level);
    // P at (1,1), block at (3,1), empty floor at (4,1), (5,1)
    const state1 = move(state0, 'right'); // P at (2,1)
    expect(state1.player).toEqual({ x: 2, y: 1 });

    const state2 = move(state1, 'right'); // P pushes block at (3,1) into (4,1)
    expect(state2.player).toEqual({ x: 3, y: 1 });
    expect(state2.grid[1][3]).toBe('floor');
    expect(state2.grid[1][4]).toBe('block');
    expect(state2.moveCount).toBe(2);
  });

  it('blocks pushing a block into a wall', () => {
    const level = parseAsciiLevel(`
#####
#PB##
#..E#
#####
`);
    const state0 = createInitialState(level);
    // P at (1,1), block at (2,1), wall at (3,1)
    const state1 = move(state0, 'right');
    expect(state1).toBe(state0); // blocked!
    expect(state1.player).toEqual({ x: 1, y: 1 });
    expect(state1.grid[1][2]).toBe('block');
  });

  it('blocks pushing chained blocks (block behind block)', () => {
    const level = parseAsciiLevel(`
######
#PBB.#
#...E#
######
`);
    const state0 = createInitialState(level);
    // P at (1,1), block at (2,1), block at (3,1)
    const state1 = move(state0, 'right');
    expect(state1).toBe(state0); // blocked!
    expect(state1.player).toEqual({ x: 1, y: 1 });
    expect(state1.grid[1][2]).toBe('block');
    expect(state1.grid[1][3]).toBe('block');
  });

  it('pushes a block into a diamond (collecting the diamond) and blocks pushing into exit', () => {
    // Level with diamond behind block
    const levelDiamond = parseAsciiLevel(`
######
#PB*.#
#...E#
######
`);
    const stateDiamond = createInitialState(levelDiamond);
    // P at (1,1), pushes block at (2,1) into diamond at (3,1)
    const pushedDiamond = move(stateDiamond, 'right');
    expect(pushedDiamond).not.toBe(stateDiamond);
    expect(pushedDiamond.player).toEqual({ x: 2, y: 1 });
    expect(pushedDiamond.grid[1][3]).toBe('block');
    expect(pushedDiamond.collectedDiamonds).toBe(1);

    // Level with exit behind block
    const levelExit = parseAsciiLevel(`
######
#PBE.#
######
`);
    const stateExit = createInitialState(levelExit);
    // P at (1,1), tries to push block at (2,1) into exit at (3,1)
    const pushedExit = move(stateExit, 'right');
    expect(pushedExit).toBe(stateExit); // blocked by exit!
  });

  it('correctly undos a block push in GameSession', () => {
    const level = parseAsciiLevel(`
#######
#P.B..#
#...*E#
#######
`);
    const session = new GameSession(level);
    session.move('right'); // P to (2,1)
    session.move('right'); // P to (3,1), block to (4,1)

    expect(session.getState().player).toEqual({ x: 3, y: 1 });
    expect(session.getState().grid[1][3]).toBe('floor');
    expect(session.getState().grid[1][4]).toBe('block');

    // Undo push
    expect(session.undo()).toBe(true);
    expect(session.getState().player).toEqual({ x: 2, y: 1 });
    expect(session.getState().grid[1][3]).toBe('block');
    expect(session.getState().grid[1][4]).toBe('floor');

    // Undo first step
    expect(session.undo()).toBe(true);
    expect(session.getState().player).toEqual({ x: 1, y: 1 });
  });

  it('renders ASCII map with blocks correctly', () => {
    const level = parseAsciiLevel(`
#####
#P.B#
#..E#
#####
`);
    const state = createInitialState(level);
    expect(renderAscii(state)).toBe('#####\n#P.B#\n#..E#\n#####');
  });

  it('can solve the teaching level for pushable blocks and undo traps', () => {
    const level = parseAsciiLevel(`
#######
#P...*#
#.B...#
#..*..#
#..B..#
#.....#
###E###
`.trim());

    const session = new GameSession(level);
    // 1. Move right to collect diamond 1 at (5,1)
    session.move('right');
    session.move('right');
    session.move('right');
    session.move('right');
    expect(session.getState().collectedDiamonds).toBe(1);

    // 2. Move down to row 3 and left to collect diamond 2 at (3,3)
    session.move('down');
    session.move('down');
    session.move('left');
    session.move('left');
    expect(session.getState().collectedDiamonds).toBe(2);

    // 3. Player accidentally pushes block at (3,4) down to (3,5) directly above exit
    session.move('down');
    expect(session.getState().player).toEqual({ x: 3, y: 4 });
    expect(session.getState().grid[5][3]).toBe('block');

    // Trying to push block into exit E at (3,6) is blocked
    expect(session.move('down')).toBe(false);

    // 4. Player uses UNDO to restore the block position
    expect(session.undo()).toBe(true);
    expect(session.getState().player).toEqual({ x: 3, y: 3 });
    expect(session.getState().grid[4][3]).toBe('block');
    expect(session.getState().grid[5][3]).toBe('floor');

    // 5. Correct path: walk around the block through column 4
    session.move('right'); // (4,3)
    session.move('down');  // (4,4)
    session.move('down');  // (4,5)
    session.move('left');  // (3,5) - now on the floor right in front of exit
    session.move('down');  // (3,6) - Exit door!

    expect(session.getState().status).toBe('won');
  });

  it('crushes an enemy when a block is pushed into it', () => {
    const level = parseAsciiLevel(`
######
#PBS.#
#...E#
######
`);
    const state0 = createInitialState(level);
    expect(state0.enemies?.[0].alive).toBe(true);

    // Push block at (2,1) into enemy at (3,1)
    const state1 = move(state0, 'right');
    expect(state1.player).toEqual({ x: 2, y: 1 });
    expect(state1.grid[1][3]).toBe('block');
    expect(state1.enemies?.[0].alive).toBe(false);
  });

  it('pushes block over a switch and preserves switch when pushed off', () => {
    const level = parseAsciiLevel(`
#######
#PBs..#
#...EG#
#######
`);
    const session = new GameSession(level);
    // Push block onto switch at (3,1)
    session.move('right');
    expect(session.getState().player).toEqual({ x: 2, y: 1 });
    expect(session.getState().grid[1][3]).toBe('block');
    expect(session.getState().baseGrid[1][3]).toBe('switch');

    // Push block off switch onto (4,1)
    session.move('right');
    expect(session.getState().player).toEqual({ x: 3, y: 1 });
    expect(session.getState().grid[1][3]).toBe('switch'); // restored!
    expect(session.getState().grid[1][4]).toBe('block');
  });

  it('restores diamond when undoing a push into diamond', () => {
    const level = parseAsciiLevel(`
######
#PB*.#
#...E#
######
`);
    const session = new GameSession(level);
    expect(session.getState().collectedDiamonds).toBe(0);

    // Push block into diamond
    session.move('right');
    expect(session.getState().collectedDiamonds).toBe(1);
    expect(session.getState().grid[1][3]).toBe('block');

    // Undo push
    expect(session.undo()).toBe(true);
    expect(session.getState().collectedDiamonds).toBe(0);
    expect(session.getState().grid[1][2]).toBe('block');
    expect(session.getState().grid[1][3]).toBe('diamond');
  });
});
