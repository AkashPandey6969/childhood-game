export interface LevelProgress {
  unlocked: boolean;
  stars: number; // 0 (unplayed), 1, 2, or 3
  bestMoves: number | null;
  completed: boolean;
}

export interface StarThresholds {
  threeStars: number;
  twoStars: number;
}

export interface GameSaveData {
  levels: Record<string, LevelProgress>;
  soundEnabled: boolean;
  musicEnabled: boolean;
}

export interface ISaveService {
  getLevelProgress(levelId: string): LevelProgress;
  recordLevelCompletion(
    levelId: string,
    moves: number,
    thresholds: StarThresholds,
    nextLevelId?: string
  ): { stars: number; newBest: boolean };
  isSoundEnabled(): boolean;
  setSoundEnabled(enabled: boolean): void;
  isMusicEnabled(): boolean;
  setMusicEnabled(enabled: boolean): void;
  resetProgress(): void;
  getAllProgress(): Record<string, LevelProgress>;
}

export class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] || null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

const STORAGE_KEY = 'gem_delver_save_v1';

export class LocalStorageSaveService implements ISaveService {
  private storage: Storage;
  private cache: GameSaveData;

  constructor(customStorage?: Storage) {
    if (customStorage) {
      this.storage = customStorage;
    } else if (typeof window !== 'undefined' && window.localStorage) {
      try {
        // Test storage availability (handles private browsing / blocked cookies)
        const testKey = '__storage_test__';
        window.localStorage.setItem(testKey, testKey);
        window.localStorage.removeItem(testKey);
        this.storage = window.localStorage;
      } catch {
        this.storage = new MemoryStorage();
      }
    } else {
      this.storage = new MemoryStorage();
    }

    this.cache = this.loadFromStorage();
  }

  private loadFromStorage(): GameSaveData {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.levels === 'object') {
          return {
            levels: parsed.levels || {},
            soundEnabled: parsed.soundEnabled ?? true,
            musicEnabled: parsed.musicEnabled ?? true,
          };
        }
      }
    } catch {
      // Fallback on corrupt JSON
    }

    return this.getDefaultSaveData();
  }

  private getDefaultSaveData(): GameSaveData {
    return {
      levels: {
        level1: {
          unlocked: true,
          stars: 0,
          bestMoves: null,
          completed: false,
        },
      },
      soundEnabled: true,
      musicEnabled: true,
    };
  }

  private persist(): void {
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(this.cache));
    } catch (e) {
      console.warn('Failed to persist game save to storage', e);
    }
  }

  getLevelProgress(levelId: string): LevelProgress {
    if (this.cache.levels[levelId]) {
      return { ...this.cache.levels[levelId] };
    }

    // Level 1 is always unlocked by default
    const isLevel1 = levelId === 'level1';
    return {
      unlocked: isLevel1,
      stars: 0,
      bestMoves: null,
      completed: false,
    };
  }

  recordLevelCompletion(
    levelId: string,
    moves: number,
    thresholds: StarThresholds,
    nextLevelId?: string
  ): { stars: number; newBest: boolean } {
    let earnedStars = 1;
    if (moves <= thresholds.threeStars) {
      earnedStars = 3;
    } else if (moves <= thresholds.twoStars) {
      earnedStars = 2;
    }

    const current = this.getLevelProgress(levelId);
    const newBest = current.bestMoves === null || moves < current.bestMoves;
    const bestMoves = current.bestMoves === null ? moves : Math.min(current.bestMoves, moves);
    const stars = Math.max(current.stars, earnedStars);

    this.cache.levels[levelId] = {
      unlocked: true,
      completed: true,
      stars,
      bestMoves,
    };

    // Unlock next level if specified
    if (nextLevelId) {
      const nextProgress = this.getLevelProgress(nextLevelId);
      this.cache.levels[nextLevelId] = {
        ...nextProgress,
        unlocked: true,
      };
    }

    this.persist();
    return { stars: earnedStars, newBest };
  }

  isSoundEnabled(): boolean {
    return this.cache.soundEnabled;
  }

  setSoundEnabled(enabled: boolean): void {
    this.cache.soundEnabled = enabled;
    this.persist();
  }

  isMusicEnabled(): boolean {
    return this.cache.musicEnabled;
  }

  setMusicEnabled(enabled: boolean): void {
    this.cache.musicEnabled = enabled;
    this.persist();
  }

  resetProgress(): void {
    this.cache = this.getDefaultSaveData();
    this.persist();
  }

  getAllProgress(): Record<string, LevelProgress> {
    const result: Record<string, LevelProgress> = {};
    for (const [key, value] of Object.entries(this.cache.levels)) {
      result[key] = { ...value };
    }
    return result;
  }
}

// Global singleton instance for easy scene sharing
export const SaveService = new LocalStorageSaveService();
