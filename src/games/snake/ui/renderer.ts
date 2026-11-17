import { GRID_COLS, GRID_ROWS, LEVELS } from '../core/levels';
import { GameState, LevelConfig } from '../core/types';

export const CELL_SIZE = 24;
export const CANVAS_WIDTH = GRID_COLS * CELL_SIZE; // 480
export const CANVAS_HEIGHT = GRID_ROWS * CELL_SIZE; // 288

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context not supported');
    }
    this.ctx = context;
  }

  private getColors(): { bg: string; pixel: string; grid: string } {
    const style = getComputedStyle(document.documentElement);
    return {
      bg: style.getPropertyValue('--lcd-bg').trim() || '#9bbc0f',
      pixel: style.getPropertyValue('--lcd-pixel').trim() || '#0f380f',
      grid: style.getPropertyValue('--lcd-grid').trim() || 'rgba(15, 56, 15, 0.08)',
    };
  }

  public render(state: GameState, level: LevelConfig, isLevelSelectMode: boolean = false): void {
    const { bg, pixel, grid } = this.getColors();
    const ctx = this.ctx;

    // 1. Clear background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Draw subtle LCD pixel grid dots
    ctx.fillStyle = grid;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        ctx.fillRect(c * CELL_SIZE + 2, r * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      }
    }

    // 3. Draw Level Maze Walls
    ctx.fillStyle = pixel;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (level.maze[r][c] === '#') {
          this.drawWallCell(c, r, pixel, bg);
        }
      }
    }

    if (isLevelSelectMode) {
      this.drawLevelSelectOverlay(level, pixel, bg);
      return;
    }

    // 4. Draw Regular Food
    if (state.food) {
      this.drawFood(state.food.col, state.food.row, pixel);
    }

    // 5. Draw Bonus Bug
    if (state.bonusBug) {
      this.drawBonusBug(state.bonusBug.point.col, state.bonusBug.point.row, state.ticks, pixel);
    }

    // 6. Draw Snake Body & Head
    this.drawSnake(state, pixel, bg);

    // 7. Status Overlays (Ready / Paused / Dead)
    if (state.status === 'ready') {
      this.drawCenteredBanner('READY - PRESS START', pixel, bg);
    } else if (state.status === 'paused') {
      this.drawCenteredBanner('PAUSED', pixel, bg);
    } else if (state.status === 'dead') {
      this.drawGameOverOverlay(state, pixel, bg);
    }
  }

  private drawWallCell(col: number, row: number, pixel: string, bg: string): void {
    const x = col * CELL_SIZE;
    const y = row * CELL_SIZE;
    const ctx = this.ctx;

    ctx.fillStyle = pixel;
    ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

    // Classic Nokia grooved brick detail
    ctx.fillStyle = bg;
    ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
    ctx.fillStyle = pixel;
    ctx.fillRect(x + 4, y + 4, CELL_SIZE - 8, CELL_SIZE - 8);
  }

  private drawFood(col: number, row: number, pixel: string): void {
    const cx = col * CELL_SIZE + CELL_SIZE / 2;
    const cy = row * CELL_SIZE + CELL_SIZE / 2;
    const ctx = this.ctx;

    ctx.fillStyle = pixel;
    // Classic Apple / Egg pixel cluster
    ctx.beginPath();
    ctx.arc(cx, cy + 1, 7, 0, Math.PI * 2);
    ctx.fill();

    // Stem
    ctx.fillRect(cx - 1, cy - 8, 2, 4);
  }

  private drawBonusBug(col: number, row: number, ticks: number, pixel: string): void {
    const x = col * CELL_SIZE;
    const y = row * CELL_SIZE;
    const ctx = this.ctx;

    ctx.fillStyle = pixel;

    // Beetle body oval
    ctx.beginPath();
    ctx.ellipse(x + 12, y + 12, 6, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Antennae
    ctx.fillRect(x + 9, y + 3, 2, 3);
    ctx.fillRect(x + 13, y + 3, 2, 3);

    // 6 Scuttling legs (alternating based on ticks)
    const legOffset = (ticks % 2 === 0) ? 1 : -1;
    ctx.fillRect(x + 3, y + 8 + legOffset, 3, 2);
    ctx.fillRect(x + 18, y + 8 - legOffset, 3, 2);

    ctx.fillRect(x + 2, y + 12, 4, 2);
    ctx.fillRect(x + 18, y + 12, 4, 2);

    ctx.fillRect(x + 3, y + 16 - legOffset, 3, 2);
    ctx.fillRect(x + 18, y + 16 + legOffset, 3, 2);
  }

  private drawSnake(state: GameState, pixel: string, bg: string): void {
    const ctx = this.ctx;
    const snake = state.snake;
    if (snake.length === 0) return;

    // Body segments
    for (let i = snake.length - 1; i >= 1; i--) {
      const seg = snake[i];
      const x = seg.col * CELL_SIZE;
      const y = seg.row * CELL_SIZE;

      ctx.fillStyle = pixel;
      ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);

      // Hollow pixel center for authentic retro Nokia body look
      ctx.fillStyle = bg;
      ctx.fillRect(x + 4, y + 4, CELL_SIZE - 8, CELL_SIZE - 8);
    }

    // Head segment
    const head = snake[0];
    const hx = head.col * CELL_SIZE;
    const hy = head.row * CELL_SIZE;

    ctx.fillStyle = pixel;
    ctx.fillRect(hx + 1, hy + 1, CELL_SIZE - 2, CELL_SIZE - 2);

    // Eyes looking in direction of travel
    ctx.fillStyle = bg;
    const dir = state.direction;
    if (dir === 'right') {
      ctx.fillRect(hx + 15, hy + 5, 4, 4);
      ctx.fillRect(hx + 15, hy + 15, 4, 4);
    } else if (dir === 'left') {
      ctx.fillRect(hx + 5, hy + 5, 4, 4);
      ctx.fillRect(hx + 5, hy + 15, 4, 4);
    } else if (dir === 'up') {
      ctx.fillRect(hx + 5, hy + 5, 4, 4);
      ctx.fillRect(hx + 15, hy + 5, 4, 4);
    } else if (dir === 'down') {
      ctx.fillRect(hx + 5, hy + 15, 4, 4);
      ctx.fillRect(hx + 15, hy + 15, 4, 4);
    }
  }

  private drawCenteredBanner(text: string, pixel: string, bg: string): void {
    const ctx = this.ctx;
    const w = 300;
    const h = 44;
    const x = (CANVAS_WIDTH - w) / 2;
    const y = (CANVAS_HEIGHT - h) / 2;

    ctx.fillStyle = pixel;
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);

    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = pixel;
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }

  private drawGameOverOverlay(state: GameState, pixel: string, bg: string): void {
    const ctx = this.ctx;
    const w = 340;
    const h = 130;
    const x = (CANVAS_WIDTH - w) / 2;
    const y = (CANVAS_HEIGHT - h) / 2;

    ctx.fillStyle = pixel;
    ctx.fillRect(x - 3, y - 3, w + 6, h + 6);

    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = pixel;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 22px monospace';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, y + 32);

    const reason = state.deathReason === 'wall' ? 'CRASHED INTO WALL!' : 'BIT OWN TAIL!';
    ctx.font = '12px monospace';
    ctx.fillText(reason, CANVAS_WIDTH / 2, y + 58);

    ctx.font = 'bold 14px monospace';
    ctx.fillText(`FINAL SCORE: ${state.score}`, CANVAS_WIDTH / 2, y + 84);

    ctx.font = '11px monospace';
    ctx.fillText('PRESS [START] OR [ENTER] TO REPLAY', CANVAS_WIDTH / 2, y + 110);
  }

  private drawLevelSelectOverlay(level: LevelConfig, pixel: string, bg: string): void {
    const ctx = this.ctx;
    const w = 360;
    const h = 160;
    const x = (CANVAS_WIDTH - w) / 2;
    const y = (CANVAS_HEIGHT - h) / 2;

    ctx.fillStyle = pixel;
    ctx.fillRect(x - 3, y - 3, w + 6, h + 6);

    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = pixel;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 18px monospace';
    ctx.fillText(`LEVEL ${level.id}: ${level.name.toUpperCase()}`, CANVAS_WIDTH / 2, y + 32);

    ctx.font = '12px monospace';
    ctx.fillText(`Speed: ${level.tickMs}ms  |  Food: +${level.pointsPerFood} pts`, CANVAS_WIDTH / 2, y + 60);

    ctx.fillText(`Use ◄ / ► to change level (${level.id + 1} of ${LEVELS.length})`, CANVAS_WIDTH / 2, y + 88);

    ctx.font = 'bold 13px monospace';
    ctx.fillText('PRESS [START] OR [ENTER] TO PLAY', CANVAS_WIDTH / 2, y + 124);
  }
}
