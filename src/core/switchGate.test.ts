import { describe, it, expect } from 'vitest';
import { parseAsciiLevel, createInitialState } from './parser';
import { move, isGateOpen } from './engine';
import { GameSession } from './session';

describe('Switches and Gates (s and G)', () => {
  it('parses switches and gates from ASCII', () => {
    const level = parseAsciiLevel(`
######
#Ps.G#
#...E#
######
`);
    expect(level.grid[1][2]).toBe('switch');
    expect(level.grid[1][4]).toBe('gate');
  });

  it('keeps gate closed when no switch is pressed', () => {
    const level = parseAsciiLevel(`
######
#P..G#
#...E#
######
`);
    const state = createInitialState(level);
    expect(isGateOpen(state)).toBe(false);

    // Moving towards gate at (4,1)
    const s1 = move(state, 'right'); // (2,1)
    const s2 = move(s1, 'right');    // (3,1)
    const s3 = move(s2, 'right');    // tries to enter G at (4,1)
    expect(s3).toBe(s2); // Blocked by closed gate!
  });

  it('opens gate while player is standing on switch', () => {
    const level = parseAsciiLevel(`
#######
#P.s.G#
#....E#
#######
`);
    const state0 = createInitialState(level);
    expect(isGateOpen(state0)).toBe(false);

    const s1 = move(state0, 'right'); // (2,1)
    expect(isGateOpen(s1)).toBe(false);

    const s2 = move(s1, 'right'); // (3,1) on switch!
    expect(isGateOpen(s2)).toBe(true);

    const s3 = move(s2, 'right'); // (4,1) leaves switch
    expect(isGateOpen(s3)).toBe(false);
  });

  it('opens gate when block is pushed onto switch and keeps it open', () => {
    const level = parseAsciiLevel(`
########
#P.B.s.G#
#......E#
########
`);
    const state0 = createInitialState(level);
    expect(isGateOpen(state0)).toBe(false);

    // Push block at (3,1) towards switch at (5,1)
    const s1 = move(state0, 'right'); // P at (2,1)
    const s2 = move(s1, 'right');     // P pushes B to (4,1), P at (3,1)
    expect(isGateOpen(s2)).toBe(false);

    const s3 = move(s2, 'right');     // P pushes B to (5,1) onto switch! P at (4,1)
    expect(isGateOpen(s3)).toBe(true);

    // Player steps down away from the switch: gate remains open because block is holding switch down
    const s4 = move(s3, 'down');      // P at (4,2)
    expect(isGateOpen(s4)).toBe(true);
  });

  it('closes gate when block is pushed off switch', () => {
    const level = parseAsciiLevel(`
#########
#P.B.s..G#
#.......E#
#########
`);
    let state = createInitialState(level);
    // Push block onto switch at (5,1)
    state = move(state, 'right'); // (2,1)
    state = move(state, 'right'); // P pushes B to (4,1)
    state = move(state, 'right'); // P pushes B to (5,1) on switch
    expect(isGateOpen(state)).toBe(true);

    // Push block off switch to (6,1)
    state = move(state, 'right'); // P at (5,1) on switch, B at (6,1)
    expect(isGateOpen(state)).toBe(true); // Still open because P is on switch

    // Player moves down off switch: now neither P nor B is on switch
    state = move(state, 'down');
    expect(isGateOpen(state)).toBe(false); // Closed!
  });

  it('supports undoing switch and gate interactions', () => {
    const level = parseAsciiLevel(`
######
#Ps.G#
#...E#
######
`);
    const session = new GameSession(level);
    expect(isGateOpen(session.getState())).toBe(false);

    session.move('right'); // P on switch
    expect(isGateOpen(session.getState())).toBe(true);

    // Undo move
    expect(session.undo()).toBe(true);
    expect(isGateOpen(session.getState())).toBe(false);
    expect(session.getState().player).toEqual({ x: 1, y: 1 });
  });

  it('solves level4_switch_gate teaching level completely', () => {
    const ascii = `
#########
#P......#
#...B...#
#...s...#
###G#####
#...*..E#
#########
`.trim();

    const level = parseAsciiLevel(ascii);
    const session = new GameSession(level);

    // 1. Move to (4,1) right above block at (4,2)
    session.move('right'); // (2,1)
    session.move('right'); // (3,1)
    session.move('right'); // (4,1)

    // 2. Push block down onto switch at (4,3)
    expect(session.move('down')).toBe(true); // P at (4,2), block at (4,3) on switch!
    expect(isGateOpen(session.getState())).toBe(true);

    // 3. Move around towards gate at (3,4)
    session.move('left'); // (3,2)
    session.move('down'); // (3,3) directly in front of gate G
    expect(isGateOpen(session.getState())).toBe(true);

    // 4. Walk through open gate
    expect(session.move('down')).toBe(true); // P walks through gate G onto (3,4)!

    // 5. Walk to diamond at (4,5)
    session.move('down');  // (3,5)
    session.move('right'); // (4,5) collects diamond!
    expect(session.getState().collectedDiamonds).toBe(1);

    // 6. Walk to exit at (7,5)
    session.move('right'); // (5,5)
    session.move('right'); // (6,5)
    session.move('right'); // (7,5) steps into Exit E!

    expect(session.getState().status).toBe('won');
  });
});
