import { describe, expect, it } from 'vitest';
import { LEVELS, getLevelConfig } from './levels';
import { validateLevel } from './validation';

describe('Snake Level Layouts & Validation (Levels 0 to 9)', () => {
  it('has exactly 10 levels', () => {
    expect(LEVELS.length).toBe(10);
  });

  LEVELS.forEach(level => {
    it(`validates Level ${level.id} (${level.name}) satisfies all design rules`, () => {
      const result = validateLevel(level);
      if (!result.valid) {
        console.error(`Validation failed for level ${level.id}:`, result.errors);
      }
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.reachableOpenCells).toBe(result.totalOpenCells);
      expect(result.totalOpenCells).toBeGreaterThan(50);
    });
  });

  it('correctly retrieves level configs by id', () => {
    const l0 = getLevelConfig(0);
    expect(l0.name).toBe('Open Field');
    expect(l0.tickMs).toBe(200);
    expect(l0.pointsPerFood).toBe(10);

    const l9 = getLevelConfig(9);
    expect(l9.name).toBe('Fortress');
    expect(l9.tickMs).toBe(74);
    expect(l9.pointsPerFood).toBe(28);
  });
});
