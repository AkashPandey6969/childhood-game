import { describe, it, expect } from 'vitest';
import { parseAsciiLevel, createInitialState } from './parser';
import { move, renderAscii } from './engine';
import { GameSession } from './session';

describe('Spikes (^) and Spike Boots (I)', () => {
  it('parses spikes and boots correctly from ASCII', () => {
    const level = parseAsciiLevel(`
######
#P^.I#
#...E#
######
`);
    expect(level.grid[1][2]).toBe('spikes');
    expect(level.grid[1][4]).toBe('spike_boots');
  });

  it('triggers defeat when player steps on spikes without boots', () => {
    const level = parseAsciiLevel(`
######
#P.^.#
#...E#
######
`);
    const state0 = createInitialState(level);
    const s1 = move(state0, 'right'); // (2,1)
    expect(s1.status).toBe('playing');

    const s2 = move(s1, 'right'); // (3,1) steps on spikes!
    expect(s2.status).toBe('lost');
    expect(s2.player).toEqual({ x: 3, y: 1 });

    // Subsequent moves are rejected while lost
    const s3 = move(s2, 'right');
    expect(s3).toBe(s2);
  });

  it('equips spike boots when collected', () => {
    const level = parseAsciiLevel(`
######
#P.I.#
#...E#
######
`);
    const state0 = createInitialState(level);
    expect(state0.hasSpikeBoots).toBe(false);

    const s1 = move(state0, 'right'); // (2,1)
    const s2 = move(s1, 'right'); // (3,1) collects boots!
    expect(s2.hasSpikeBoots).toBe(true);
    expect(s2.grid[1][3]).toBe('floor');
    expect(s2.status).toBe('playing');
  });

  it('allows safe passage over spikes when wearing spike boots', () => {
    const level = parseAsciiLevel(`
#######
#PI^..#
#....E#
#######
`);
    const state0 = createInitialState(level);
    const s1 = move(state0, 'right'); // (2,1) collects boots
    expect(s1.hasSpikeBoots).toBe(true);

    const s2 = move(s1, 'right'); // (3,1) safely walks on spikes!
    expect(s2.status).toBe('playing');
    expect(s2.player).toEqual({ x: 3, y: 1 });

    const s3 = move(s2, 'right'); // (4,1) walks past spikes
    expect(s3.status).toBe('playing');
    expect(s3.player).toEqual({ x: 4, y: 1 });
  });

  it('allows pushable blocks to be pushed onto spikes', () => {
    const level = parseAsciiLevel(`
#######
#P.B^.#
#....E#
#######
`);
    let state = createInitialState(level);
    state = move(state, 'right'); // P at (2,1)
    state = move(state, 'right'); // P pushes B at (3,1) onto spikes at (4,1)
    expect(state.player).toEqual({ x: 3, y: 1 });
    expect(state.grid[1][4]).toBe('block');

    // Push block off spikes to (5,1)
    state = move(state, 'right'); // P at (4,1), B at (5,1)
    // Underlying tile at (4,1) restored to spikes!
    expect(state.baseGrid[1][4]).toBe('spikes');
  });

  it('supports undoing a spike trap death in GameSession', () => {
    const level = parseAsciiLevel(`
######
#P.^.#
#...E#
######
`);
    const session = new GameSession(level);
    session.move('right'); // (2,1)
    session.move('right'); // (3,1) dies on spikes!
    expect(session.getState().status).toBe('lost');

    // Undo restores state to playing and previous position
    expect(session.undo()).toBe(true);
    expect(session.getState().status).toBe('playing');
    expect(session.getState().player).toEqual({ x: 2, y: 1 });
  });

  it('renders ASCII map with spikes and boots correctly', () => {
    const level = parseAsciiLevel(`
#####
#P^I#
#..E#
#####
`);
    const state = createInitialState(level);
    expect(renderAscii(state)).toBe('#####\n#P^I#\n#..E#\n#####');
  });

  it('solves level6_spikes teaching level completely', () => {
    const ascii = `
#########
#P..^.*.E
###.#####
#...I...#
#########
`.trim();

    const level = parseAsciiLevel(ascii);
    const session = new GameSession(level);

    // 1. Walk right towards spikes
    session.move('right'); // (2,1)
    session.move('right'); // (3,1)

    // 2. Recklessly step onto spikes without boots -> dies!
    session.move('right'); // (4,1)
    expect(session.getState().status).toBe('lost');

    // 3. Undo mistake!
    expect(session.undo()).toBe(true);
    expect(session.getState().status).toBe('playing');
    expect(session.getState().player).toEqual({ x: 3, y: 1 });

    // 4. Go down into lower chamber to retrieve Spike Boots
    session.move('down');  // (3,2)
    session.move('down');  // (3,3)
    session.move('right'); // (4,3) picks up Spike Boots!
    expect(session.getState().hasSpikeBoots).toBe(true);

    // 5. Return to hallway
    session.move('left'); // (3,3)
    session.move('up');   // (3,2)
    session.move('up');   // (3,1)

    // 6. Cross spikes safely!
    session.move('right'); // (4,1) on spikes with boots!
    expect(session.getState().status).toBe('playing');

    // 7. Collect diamond and exit
    session.move('right'); // (5,1)
    session.move('right'); // (6,1) collects diamond!
    expect(session.getState().collectedDiamonds).toBe(1);

    session.move('right'); // (7,1)
    session.move('right'); // (8,1) Exit door!

    expect(session.getState().status).toBe('won');
  });
});
