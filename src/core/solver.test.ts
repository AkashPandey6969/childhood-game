import { describe, expect, it } from 'vitest';
import { solveLevel } from './solver';
import level1Raw from '../levels/level1.txt?raw';
import level2Raw from '../levels/level2_block.txt?raw';
import level3Raw from '../levels/level3_key_door.txt?raw';
import level4Raw from '../levels/level4_switch_gate.txt?raw';
import level5Raw from '../levels/level5_hole.txt?raw';
import level6Raw from '../levels/level6_spikes.txt?raw';
import level7Raw from '../levels/level7_boulder.txt?raw';
import level8Raw from '../levels/level8_enemy.txt?raw';
import level9Raw from '../levels/level9_tools.txt?raw';
import level10Raw from '../levels/level10_depths.txt?raw';
import level11Raw from '../levels/level11_molten.txt?raw';
import level12Raw from '../levels/level12_patrol.txt?raw';
import level13Raw from '../levels/level13_seismic.txt?raw';
import level14Raw from '../levels/level14_crucible.txt?raw';
import level15Raw from '../levels/level15_master.txt?raw';

describe('BFS Puzzle Solver (Phase 7)', () => {
  it('solves level 1 and reports exact shortest solution', () => {
    const result = solveLevel(level1Raw);
    expect(result.solved).toBe(true);
    expect(result.moves).toBe(24);
    expect(result.path.length).toBe(24);
  });

  it('solves level 2 (pushable block) optimally', () => {
    const result = solveLevel(level2Raw);
    expect(result.solved).toBe(true);
    expect(result.moves).toBe(13);
  });

  it('solves level 3 (keys and doors) optimally', () => {
    const result = solveLevel(level3Raw);
    expect(result.solved).toBe(true);
    expect(result.moves).toBe(17);
  });

  it('solves level 4 (switches and gates) optimally', () => {
    const result = solveLevel(level4Raw);
    expect(result.solved).toBe(true);
    expect(result.moves).toBe(12);
  });

  it('solves level 5 (holes and blocks) optimally', () => {
    const result = solveLevel(level5Raw);
    expect(result.solved).toBe(true);
    expect(result.moves).toBe(14);
  });

  it('solves level 6 (spikes and boots) optimally', () => {
    const result = solveLevel(level6Raw);
    expect(result.solved).toBe(true);
    expect(result.moves).toBe(12);
  });

  it('solves level 7 (boulder trap and hole fill) optimally', () => {
    const result = solveLevel(level7Raw);
    expect(result.solved).toBe(true);
    expect(result.moves).toBe(8);
  });

  it('solves level 8 (patrolling enemy) optimally', () => {
    const result = solveLevel(level8Raw);
    expect(result.solved).toBe(true);
    expect(result.moves).toBe(16);
  });

  it('solves level 9 (explorer tools) optimally', () => {
    const result = solveLevel(level9Raw);
    expect(result.solved).toBe(true);
    expect(result.moves).toBe(15);
  });

  it('solves level 10 (depths) optimally', () => {
    const result = solveLevel(level10Raw);
    expect(result.solved).toBe(true);
    expect(result.moves).toBe(24);
  });

  it('solves level 11 (molten) optimally', () => {
    const result = solveLevel(level11Raw);
    expect(result.solved).toBe(true);
    expect(result.moves).toBe(12);
  });

  it('solves level 12 (patrol) optimally', () => {
    const result = solveLevel(level12Raw);
    expect(result.solved).toBe(true);
    expect(result.moves).toBe(24);
  });

  it('solves level 13 (seismic) optimally', () => {
    const result = solveLevel(level13Raw);
    expect(result.solved).toBe(true);
    expect(result.moves).toBe(22);
  });

  it('solves level 14 (crucible) optimally', () => {
    const result = solveLevel(level14Raw);
    expect(result.solved).toBe(true);
    expect(result.moves).toBe(26);
  });

  it('solves level 15 (master) optimally', () => {
    const result = solveLevel(level15Raw);
    expect(result.solved).toBe(true);
    expect(result.moves).toBe(22);
  });

  it('rejects an impossible puzzle map and returns solved: false', () => {
    const impossibleMap = `
#####
#P#*E
#####
`;
    const result = solveLevel(impossibleMap);
    expect(result.solved).toBe(false);
    expect(result.moves).toBe(-1);
  });
});
