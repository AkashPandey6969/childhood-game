import { describe, it, expect } from 'vitest';
import { parseAsciiLevel, createInitialState } from './parser';
import { move, renderAscii } from './engine';
import { GameSession } from './session';

describe('Holes (O)', () => {
  it('parses holes correctly from ASCII', () => {
    const level = parseAsciiLevel(`
######
#P.O.#
#...E#
######
`);
    expect(level.grid[1][3]).toBe('hole');
  });

  it('blocks player from walking into an unfilled hole', () => {
    const level = parseAsciiLevel(`
######
#P.O.#
#...E#
######
`);
    const state0 = createInitialState(level);
    const s1 = move(state0, 'right'); // (2,1)
    const tryHole = move(s1, 'right'); // attempts to step into O at (3,1)
    expect(tryHole).toBe(s1); // Blocked!
    expect(tryHole.player).toEqual({ x: 2, y: 1 });
  });

  it('fills hole when block is pushed into it and makes tile walkable floor', () => {
    const level = parseAsciiLevel(`
#######
#P.B.O.#
#....E.#
#######
`);
    const state0 = createInitialState(level);
    // P at (1,1), B at (3,1), O at (5,1)
    const s1 = move(state0, 'right'); // P at (2,1)
    const s2 = move(s1, 'right');     // P at (3,1), B pushed to (4,1)
    expect(s2.grid[1][4]).toBe('block');
    expect(s2.grid[1][5]).toBe('hole');

    // Push block into hole at (5,1)
    const s3 = move(s2, 'right');     // P at (4,1), B drops into hole!
    expect(s3.player).toEqual({ x: 4, y: 1 });
    expect(s3.grid[1][4]).toBe('floor');
    expect(s3.grid[1][5]).toBe('floor'); // Hole is filled and now floor!

    // Player can now walk across the filled hole
    const s4 = move(s3, 'right');     // P steps onto (5,1) (filled hole)
    expect(s4.player).toEqual({ x: 5, y: 1 });
    const s5 = move(s4, 'right');     // P steps onto (6,1)
    expect(s5.player).toEqual({ x: 6, y: 1 });
  });

  it('allows another block to be pushed across a filled hole', () => {
    const level = parseAsciiLevel(`
########
#P.B.O.#
#...B..#
#.....E#
########
`);
    let state = createInitialState(level);
    // 1. Push B1 at (3,1) into hole at (5,1)
    state = move(state, 'right'); // (2,1)
    state = move(state, 'right'); // (3,1), B1 to (4,1)
    state = move(state, 'right'); // (4,1), B1 fills hole at (5,1)
    expect(state.grid[1][5]).toBe('floor');

    // 2. Walk across filled hole
    state = move(state, 'right'); // P at (5,1)
    state = move(state, 'right'); // P at (6,1)
    expect(state.player).toEqual({ x: 6, y: 1 });
  });

  it('supports undoing a block pushed into a hole', () => {
    const level = parseAsciiLevel(`
#######
#P.B.O.#
#....E.#
#######
`);
    const session = new GameSession(level);
    session.move('right'); // (2,1)
    session.move('right'); // P pushes B to (4,1)
    session.move('right'); // P pushes B into hole at (5,1)

    expect(session.getState().player).toEqual({ x: 4, y: 1 });
    expect(session.getState().grid[1][5]).toBe('floor');

    // Undo push into hole
    expect(session.undo()).toBe(true);
    expect(session.getState().player).toEqual({ x: 3, y: 1 });
    expect(session.getState().grid[1][4]).toBe('block');
    expect(session.getState().grid[1][5]).toBe('hole');

    // Walking directly into hole is still blocked
    session.move('right'); // push into hole again
    expect(session.getState().grid[1][5]).toBe('floor');
  });

  it('renders ASCII map with holes correctly', () => {
    const level = parseAsciiLevel(`
#####
#P.O#
#..E#
#####
`);
    const state = createInitialState(level);
    expect(renderAscii(state)).toBe('#####\n#P.O#\n#..E#\n#####');
  });

  it('solves level5_hole teaching level completely', () => {
    const ascii = `
#########
#P.B.O.*#
#######.#
#...*...#
#####.###
#####E###
#########
`.trim();

    const level = parseAsciiLevel(ascii);
    const session = new GameSession(level);

    // 1. Move to (2,1) and push block at (3,1) to (4,1)
    session.move('right'); // (2,1)
    session.move('right'); // (3,1), B at (4,1)
    expect(session.getState().grid[1][4]).toBe('block');
    expect(session.getState().grid[1][5]).toBe('hole');

    // 2. Push block from (4,1) into hole at (5,1)
    session.move('right'); // (4,1), B fills hole at (5,1)!
    expect(session.getState().grid[1][5]).toBe('floor');

    // 3. Cross the filled hole to collect Diamond 1 at (7,1)
    session.move('right'); // (5,1) on filled hole!
    session.move('right'); // (6,1)
    session.move('right'); // (7,1) collects Diamond 1!
    expect(session.getState().collectedDiamonds).toBe(1);

    // 4. Walk down through right corridor
    session.move('down'); // (7,2)
    session.move('down'); // (7,3)

    // 5. Walk left to collect Diamond 2 at (4,3)
    session.move('left'); // (6,3)
    session.move('left'); // (5,3)
    session.move('left'); // (4,3) collects Diamond 2!
    expect(session.getState().collectedDiamonds).toBe(2);

    // 6. Walk to exit E at (5,5)
    session.move('right'); // (5,3)
    session.move('down');  // (5,4)
    session.move('down');  // (5,5) steps into Exit E!

    expect(session.getState().status).toBe('won');
  });
});
