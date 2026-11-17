import { describe, it, expect } from 'vitest';
import { parseAsciiLevel, createInitialState } from './parser';
import { move } from './engine';
import { GameSession } from './session';

describe('Keys and Doors (k and D)', () => {
  it('parses keys and doors correctly from ASCII', () => {
    const level = parseAsciiLevel(`
######
#PkD*#
#...E#
######
`);
    expect(level.grid[1][2]).toBe('key');
    expect(level.grid[1][3]).toBe('door');
  });

  it('collects a key and updates inventory', () => {
    const level = parseAsciiLevel(`
######
#P.k.#
#...E#
######
`);
    const state0 = createInitialState(level);
    expect(state0.keys).toBe(0);

    const state1 = move(state0, 'right'); // (2,1)
    const state2 = move(state1, 'right'); // (3,1) collects key!
    expect(state2.player).toEqual({ x: 3, y: 1 });
    expect(state2.keys).toBe(1);
    expect(state2.grid[1][3]).toBe('floor');
    expect(state0.grid[1][3]).toBe('key'); // Immutability
  });

  it('blocks moving through door without a key', () => {
    const level = parseAsciiLevel(`
######
#P.D.#
#...E#
######
`);
    const state0 = createInitialState(level);
    const state1 = move(state0, 'right'); // (2,1)
    const tryDoor = move(state1, 'right'); // tries to enter D at (3,1)
    expect(tryDoor).toBe(state1); // Blocked!
    expect(tryDoor.player).toEqual({ x: 2, y: 1 });
    expect(tryDoor.grid[1][3]).toBe('door');
  });

  it('unlocks door and consumes key when player has a key', () => {
    const level = parseAsciiLevel(`
######
#PkD.#
#...E#
######
`);
    const state0 = createInitialState(level);
    const stateWithKey = move(state0, 'right'); // collects key at (2,1)
    expect(stateWithKey.keys).toBe(1);

    const stateUnlocked = move(stateWithKey, 'right'); // enters door at (3,1)
    expect(stateUnlocked.player).toEqual({ x: 3, y: 1 });
    expect(stateUnlocked.keys).toBe(0);
    expect(stateUnlocked.grid[1][3]).toBe('floor');
  });

  it('handles multiple keys and doors in sequence', () => {
    const level = parseAsciiLevel(`
########
#PkkDD.#
#.....E#
########
`);
    const state0 = createInitialState(level);
    const s1 = move(state0, 'right'); // k1 -> keys: 1
    const s2 = move(s1, 'right');     // k2 -> keys: 2
    expect(s2.keys).toBe(2);

    const s3 = move(s2, 'right');     // unlocks D1 -> keys: 1
    expect(s3.keys).toBe(1);

    const s4 = move(s3, 'right');     // unlocks D2 -> keys: 0
    expect(s4.keys).toBe(0);
    expect(s4.player).toEqual({ x: 5, y: 1 });
  });

  it('blocks pushing a block into a key or door', () => {
    // Pushing block into key
    const levelKey = parseAsciiLevel(`
######
#PBk.#
#...E#
######
`);
    const stateKey = createInitialState(levelKey);
    const pushKey = move(stateKey, 'right');
    expect(pushKey).toBe(stateKey); // blocked!

    // Pushing block into door
    const levelDoor = parseAsciiLevel(`
######
#PBD.#
#...E#
######
`);
    const stateDoor = createInitialState(levelDoor);
    const pushDoor = move(stateDoor, 'right');
    expect(pushDoor).toBe(stateDoor); // blocked!
  });

  it('supports undoing key pickup and door unlocking', () => {
    const level = parseAsciiLevel(`
######
#PkD.#
#...E#
######
`);
    const session = new GameSession(level);
    session.move('right'); // pick up key
    expect(session.getState().keys).toBe(1);
    expect(session.getState().grid[1][2]).toBe('floor');

    session.move('right'); // open door
    expect(session.getState().keys).toBe(0);
    expect(session.getState().grid[1][3]).toBe('floor');

    // Undo door unlocking
    expect(session.undo()).toBe(true);
    expect(session.getState().player).toEqual({ x: 2, y: 1 });
    expect(session.getState().keys).toBe(1);
    expect(session.getState().grid[1][3]).toBe('door');

    // Undo key pickup
    expect(session.undo()).toBe(true);
    expect(session.getState().player).toEqual({ x: 1, y: 1 });
    expect(session.getState().keys).toBe(0);
    expect(session.getState().grid[1][2]).toBe('key');
  });

  it('solves the teaching level level3_key_door start to finish', () => {
    const ascii = `
#########
#P..D.*.#
#.###.#.#
#k#...#.#
#.#.D.#.#
#k..#.*.E
#########
`.trim();

    const level = parseAsciiLevel(ascii);
    const session = new GameSession(level);

    // 1. Move down to pick up key 1 at (1,3)
    session.move('down'); // (1,2)
    session.move('down'); // (1,3) picks up key 1
    expect(session.getState().keys).toBe(1);

    // 2. Move down to pick up key 2 at (1,5)
    session.move('down'); // (1,4)
    session.move('down'); // (1,5) picks up key 2
    expect(session.getState().keys).toBe(2);

    // 3. Move along bottom hallway towards Door at (4,4)
    session.move('right'); // (2,5)
    session.move('right'); // (3,5)
    session.move('up');    // (3,4)
    session.move('right'); // (4,4) unlocks Door 2! keys becomes 1
    expect(session.getState().keys).toBe(1);
    expect(session.getState().grid[4][4]).toBe('floor');

    // 4. Move into right vertical corridor
    session.move('right'); // (5,4)
    session.move('up');    // (5,3)
    session.move('up');    // (5,2)
    session.move('up');    // (5,1)
    session.move('right'); // (6,1) collects Diamond 1!
    expect(session.getState().collectedDiamonds).toBe(1);

    // 5. Move along right corridor (column 7) to collect Diamond 2 at (6,5)
    session.move('right'); // (7,1)
    session.move('down');  // (7,2)
    session.move('down');  // (7,3)
    session.move('down');  // (7,4)
    session.move('down');  // (7,5)
    session.move('left');  // (6,5) collects Diamond 2!
    expect(session.getState().collectedDiamonds).toBe(2);

    // 6. Move right to exit E at (8,5)
    session.move('right'); // (7,5)
    session.move('right'); // (8,5) Exit door -> WIN!

    expect(session.getState().status).toBe('won');
  });
});
