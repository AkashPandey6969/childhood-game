export class ScoreService {
  private static STORAGE_KEY = 'nokia_snake_highscores';

  public static getHighScore(levelId: number): number {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return 0;
      const parsed = JSON.parse(data);
      return typeof parsed[levelId] === 'number' ? parsed[levelId] : 0;
    } catch {
      return 0;
    }
  }

  public static saveScore(levelId: number, score: number): { isNewHighScore: boolean; highScore: number } {
    try {
      const current = this.getHighScore(levelId);
      if (score > current) {
        const data = localStorage.getItem(this.STORAGE_KEY);
        const parsed = data ? JSON.parse(data) : {};
        parsed[levelId] = score;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(parsed));
        return { isNewHighScore: true, highScore: score };
      }
      return { isNewHighScore: false, highScore: current };
    } catch {
      return { isNewHighScore: false, highScore: score };
    }
  }

  public static getAllHighScores(): Record<number, number> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }
}
