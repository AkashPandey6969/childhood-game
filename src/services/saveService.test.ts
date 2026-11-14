import { describe, expect, it, beforeEach } from 'vitest';
import { LocalStorageSaveService, MemoryStorage } from './SaveService';

describe('SaveService (Phase 6)', () => {
  let memoryStorage: MemoryStorage;
  let service: LocalStorageSaveService;

  const thresholds = {
    threeStars: 10,
    twoStars: 15,
  };

  beforeEach(() => {
    memoryStorage = new MemoryStorage();
    service = new LocalStorageSaveService(memoryStorage);
  });

  it('fresh start has level 1 unlocked with 0 stars and level 2 locked', () => {
    const l1 = service.getLevelProgress('level1');
    expect(l1.unlocked).toBe(true);
    expect(l1.completed).toBe(false);
    expect(l1.stars).toBe(0);
    expect(l1.bestMoves).toBeNull();

    const l2 = service.getLevelProgress('level2');
    expect(l2.unlocked).toBe(false);
    expect(l2.completed).toBe(false);
  });

  it('completing level 1 with optimal moves awards 3 stars and unlocks level 2', () => {
    const result = service.recordLevelCompletion('level1', 9, thresholds, 'level2');
    expect(result.stars).toBe(3);
    expect(result.newBest).toBe(true);

    const l1 = service.getLevelProgress('level1');
    expect(l1.completed).toBe(true);
    expect(l1.stars).toBe(3);
    expect(l1.bestMoves).toBe(9);

    const l2 = service.getLevelProgress('level2');
    expect(l2.unlocked).toBe(true);
    expect(l2.completed).toBe(false);
  });

  it('awards 2 stars if within 2-star threshold', () => {
    const result = service.recordLevelCompletion('level1', 13, thresholds);
    expect(result.stars).toBe(2);

    const l1 = service.getLevelProgress('level1');
    expect(l1.stars).toBe(2);
    expect(l1.bestMoves).toBe(13);
  });

  it('awards 1 star if above 2-star threshold', () => {
    const result = service.recordLevelCompletion('level1', 25, thresholds);
    expect(result.stars).toBe(1);

    const l1 = service.getLevelProgress('level1');
    expect(l1.stars).toBe(1);
    expect(l1.bestMoves).toBe(25);
  });

  it('preserves highest star rating on subsequent replays', () => {
    // First run: 3 stars (9 moves)
    service.recordLevelCompletion('level1', 9, thresholds);
    expect(service.getLevelProgress('level1').stars).toBe(3);

    // Replay with more moves: 1 star (20 moves)
    const result = service.recordLevelCompletion('level1', 20, thresholds);
    expect(result.newBest).toBe(false);
    // Overall recorded stars remain 3
    expect(service.getLevelProgress('level1').stars).toBe(3);
    expect(service.getLevelProgress('level1').bestMoves).toBe(9);
  });

  it('persists progress across new service instances (page reload simulation)', () => {
    service.recordLevelCompletion('level1', 8, thresholds, 'level2');

    // Simulate reloading the page with the same storage
    const reloadedService = new LocalStorageSaveService(memoryStorage);
    const l1 = reloadedService.getLevelProgress('level1');
    expect(l1.completed).toBe(true);
    expect(l1.stars).toBe(3);
    expect(l1.bestMoves).toBe(8);

    const l2 = reloadedService.getLevelProgress('level2');
    expect(l2.unlocked).toBe(true);
  });

  it('persists sound and music settings', () => {
    expect(service.isSoundEnabled()).toBe(true);
    service.setSoundEnabled(false);
    expect(service.isSoundEnabled()).toBe(false);

    service.setMusicEnabled(false);
    expect(service.isMusicEnabled()).toBe(false);

    const reloaded = new LocalStorageSaveService(memoryStorage);
    expect(reloaded.isSoundEnabled()).toBe(false);
    expect(reloaded.isMusicEnabled()).toBe(false);
  });

  it('resets progress back to default state', () => {
    service.recordLevelCompletion('level1', 7, thresholds, 'level2');
    expect(service.getLevelProgress('level2').unlocked).toBe(true);

    service.resetProgress();
    expect(service.getLevelProgress('level1').completed).toBe(false);
    expect(service.getLevelProgress('level2').unlocked).toBe(false);
  });
});
