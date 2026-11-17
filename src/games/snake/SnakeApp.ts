import { SnakeEngine } from './core/engine';
import { getLevelConfig, LEVELS } from './core/levels';
import { GameRenderer } from './ui/renderer';
import { SoundService } from './audio/soundService';
import { ScoreService } from './storage/scoreService';
import { Direction } from './core/types';

export class SnakeApp {
  private container: HTMLElement;
  private engine: SnakeEngine;
  private renderer!: GameRenderer;
  private sound: SoundService;
  private selectedLevelId: number = 0;
  private isLevelSelectMode: boolean = false;

  private canvas!: HTMLCanvasElement;
  private levelText!: HTMLElement;
  private bugBar!: HTMLElement;
  private scoreText!: HTMLElement;
  private hiScoreText!: HTMLElement;
  private soundBtn!: HTMLElement;
  private themeBtn!: HTMLElement;

  private lastTickTime: number = 0;
  private animationFrameId: number | null = null;
  private touchStartX: number = 0;
  private touchStartY: number = 0;

  private themes: string[] = ['default', 'gameboy', 'amber', 'cyberpunk'];
  private currentThemeIndex: number = 0;

  private abortController: AbortController = new AbortController();

  constructor(containerId: string = 'game-canvas-area') {
    this.container = document.getElementById(containerId) || document.body;
    this.sound = SoundService.getInstance();
    this.selectedLevelId = parseInt(localStorage.getItem('nokia_snake_last_level') || '0', 10);
    if (isNaN(this.selectedLevelId) || this.selectedLevelId < 0 || this.selectedLevelId > 9) {
      this.selectedLevelId = 0;
    }

    this.engine = new SnakeEngine(this.selectedLevelId);

    this.renderDOM();
    this.initRenderer();
    this.setupInputs();
    this.updateHUD();

    // Start loop
    this.lastTickTime = performance.now();
    this.loop = this.loop.bind(this);
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  private renderDOM(): void {
    this.container.innerHTML = `
      <div class="snake-root-wrapper">
        <div class="nokia-device">
          <div class="speaker-grille"></div>
          <div class="brand-row">
            <span class="brand-label">NOKIA</span>
            <button class="hub-pill-mini" id="snakeHubExitBtn" title="Return to Cartridge Select">⌂ MENU</button>
          </div>

          <!-- LCD Screen Frame -->
          <div class="screen-frame" draggable="false">
            <div class="screen-header" draggable="false">
              <span id="hudLevel">LVL 0: OPEN FIELD</span>
              <span id="hudBug" style="display:none; color:var(--lcd-pixel);">BUG [||||]</span>
              <span>
                SCORE:<span id="hudScore">0</span> | HI:<span id="hudHi">0</span>
              </span>
            </div>

            <div class="canvas-container" draggable="false">
              <canvas id="gameCanvas" draggable="false"></canvas>
            </div>
          </div>

          <!-- Options Bar -->
          <div class="device-controls-bar">
            <button class="pill-btn" id="themeBtn">🎨 THEME: NOKIA</button>
            <button class="pill-btn" id="soundBtn">🔊 SOUND: ON</button>
          </div>

          <!-- Tactile Keypad -->
          <div class="keypad">
            <div class="action-row">
              <button class="action-btn" id="lvlSelectBtn">📋 SELECT LEVEL</button>
              <button class="action-btn" id="playBtn">▶ START</button>
              <button class="action-btn" id="resetBtn">↻ RESTART</button>
            </div>

            <div class="dpad-container">
              <div></div>
              <button class="keypad-btn" id="btnUp" aria-label="Up">▲</button>
              <div></div>

              <button class="keypad-btn" id="btnLeft" aria-label="Left">◀</button>
              <button class="keypad-btn action-center" id="btnOk">OK</button>
              <button class="keypad-btn" id="btnRight" aria-label="Right">▶</button>

              <div></div>
              <button class="keypad-btn" id="btnDown" aria-label="Down">▼</button>
              <div></div>
            </div>
          </div>

          <div class="instructions-footer">
            Controls: <kbd>▲</kbd><kbd>▼</kbd><kbd>◀</kbd><kbd>▶</kbd> or <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or swipe.<br>
            <kbd>Space</kbd> / <kbd>Enter</kbd> to Start/Pause.
          </div>
        </div>
      </div>
    `;

    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.levelText = document.getElementById('hudLevel')!;
    this.bugBar = document.getElementById('hudBug')!;
    this.scoreText = document.getElementById('hudScore')!;
    this.hiScoreText = document.getElementById('hudHi')!;
    this.soundBtn = document.getElementById('soundBtn')!;
    this.themeBtn = document.getElementById('themeBtn')!;
  }

  private initRenderer(): void {
    this.renderer = new GameRenderer(this.canvas);
  }

  private setupInputs(): void {
    const { signal } = this.abortController;

    // Return to Hub button
    document.getElementById('snakeHubExitBtn')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('exit-to-hub'));
    }, { signal });

    // Disable any drag-and-drop or selection to keep the single window completely fixed
    window.addEventListener('dragstart', (e) => e.preventDefault(), { signal });
    window.addEventListener('drop', (e) => e.preventDefault(), { signal });
    window.addEventListener('selectstart', (e) => e.preventDefault(), { signal });

    const gameKeys = new Set([
      'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
      'w', 'a', 's', 'd',
      ' ', 'spacebar', 'enter', 'escape', 'r', 'p'
    ]);

    // Keyboard handlers with browser scroll prevention
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (gameKeys.has(key)) {
        e.preventDefault();
      }

      this.sound.unlock();
      if (e.repeat) return;

      if (this.isLevelSelectMode) {
        if (key === 'arrowleft' || key === 'a') {
          this.cycleLevel(-1);
        } else if (key === 'arrowright' || key === 'd') {
          this.cycleLevel(1);
        } else if (key === 'enter' || key === ' ' || key === 'escape') {
          this.confirmLevelSelect();
        }
        return;
      }

      if (key === 'arrowup' || key === 'w') {
        this.engine.queueDirection('up');
      } else if (key === 'arrowdown' || key === 's') {
        this.engine.queueDirection('down');
      } else if (key === 'arrowleft' || key === 'a') {
        this.engine.queueDirection('left');
      } else if (key === 'arrowright' || key === 'd') {
        this.engine.queueDirection('right');
      } else if (key === ' ' || key === 'enter') {
        this.handlePlayAction();
      } else if (key === 'r') {
        this.handleRestart();
      } else if (key === 'p' || key === 'escape') {
        this.togglePause();
      }
    }, { signal });

    // Visibility and blur handling
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.engine.getState().status === 'running') {
          this.engine.pause();
          const playBtn = document.getElementById('playBtn');
          if (playBtn) playBtn.textContent = '▶ RESUME';
          this.updateHUD();
        }
      } else {
        this.lastTickTime = performance.now();
      }
    }, { signal });

    window.addEventListener('blur', () => {
      if (this.engine.getState().status === 'running') {
        this.engine.pause();
        const playBtn = document.getElementById('playBtn');
        if (playBtn) playBtn.textContent = '▶ RESUME';
        this.updateHUD();
      }
    }, { signal });

    // On-Screen Keypad Direction Buttons
    const bindDirectionBtn = (id: string, dir: Direction) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.sound.unlock();
        if (this.isLevelSelectMode) {
          if (dir === 'left') this.cycleLevel(-1);
          if (dir === 'right') this.cycleLevel(1);
          return;
        }
        this.engine.queueDirection(dir);
      }, { signal });
    };

    bindDirectionBtn('btnUp', 'up');
    bindDirectionBtn('btnDown', 'down');
    bindDirectionBtn('btnLeft', 'left');
    bindDirectionBtn('btnRight', 'right');

    // OK / Action Center Button
    document.getElementById('btnOk')?.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.sound.unlock();
      if (this.isLevelSelectMode) {
        this.confirmLevelSelect();
      } else {
        this.handlePlayAction();
      }
    }, { signal });

    // Level Select Button
    document.getElementById('lvlSelectBtn')?.addEventListener('click', () => {
      this.sound.unlock();
      this.toggleLevelSelect();
    }, { signal });

    // Play / Pause Button
    document.getElementById('playBtn')?.addEventListener('click', () => {
      this.sound.unlock();
      this.handlePlayAction();
    }, { signal });

    // Restart Button
    document.getElementById('resetBtn')?.addEventListener('click', () => {
      this.sound.unlock();
      this.handleRestart();
    }, { signal });

    // Canvas click to restart or start
    this.canvas.addEventListener('click', (e) => {
      e.preventDefault();
      this.sound.unlock();
      const status = this.engine.getState().status;
      if (this.isLevelSelectMode) {
        this.confirmLevelSelect();
      } else if (status === 'dead' || status === 'ready') {
        this.handlePlayAction();
      }
    }, { signal });

    // Sound Toggle Button
    this.soundBtn.addEventListener('click', () => {
      this.sound.unlock();
      const enabled = this.sound.toggleSound();
      this.soundBtn.textContent = enabled ? '🔊 SOUND: ON' : '🔇 SOUND: OFF';
    }, { signal });

    // Theme Toggle Button
    this.themeBtn.addEventListener('click', () => {
      this.currentThemeIndex = (this.currentThemeIndex + 1) % this.themes.length;
      const theme = this.themes[this.currentThemeIndex];
      if (theme === 'default') {
        document.documentElement.removeAttribute('data-theme');
        this.themeBtn.textContent = '🎨 THEME: NOKIA';
      } else {
        document.documentElement.setAttribute('data-theme', theme);
        this.themeBtn.textContent = `🎨 THEME: ${theme.toUpperCase()}`;
      }
    }, { signal });

    // Touch Swipe on Canvas
    this.canvas.addEventListener('touchstart', (e: TouchEvent) => {
      this.sound.unlock();
      if (e.touches.length > 0) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
      }
    }, { passive: true, signal });

    this.canvas.addEventListener('touchend', (e: TouchEvent) => {
      if (e.changedTouches.length === 0) return;
      const dx = e.changedTouches[0].clientX - this.touchStartX;
      const dy = e.changedTouches[0].clientY - this.touchStartY;
      const dist = Math.hypot(dx, dy);

      if (dist >= 20) {
        if (Math.abs(dx) > Math.abs(dy)) {
          if (this.isLevelSelectMode) {
            this.cycleLevel(dx > 0 ? 1 : -1);
          } else {
            this.engine.queueDirection(dx > 0 ? 'right' : 'left');
          }
        } else if (!this.isLevelSelectMode) {
          this.engine.queueDirection(dy > 0 ? 'down' : 'up');
        }
      } else {
        if (this.isLevelSelectMode) {
          this.confirmLevelSelect();
        } else {
          this.handlePlayAction();
        }
      }
    }, { signal });
  }

  private handlePlayAction(): void {
    const status = this.engine.getState().status;
    const playBtn = document.getElementById('playBtn');

    if (status === 'ready') {
      this.lastTickTime = performance.now();
      this.engine.start();
      if (playBtn) playBtn.textContent = '⏸ PAUSE';
    } else if (status === 'running') {
      this.engine.pause();
      if (playBtn) playBtn.textContent = '▶ RESUME';
    } else if (status === 'paused') {
      this.lastTickTime = performance.now();
      this.engine.resume();
      if (playBtn) playBtn.textContent = '⏸ PAUSE';
    } else if (status === 'dead') {
      this.handleRestart();
    }
  }

  private togglePause(): void {
    const status = this.engine.getState().status;
    if (status === 'running') {
      this.engine.pause();
    } else if (status === 'paused') {
      this.lastTickTime = performance.now();
      this.engine.resume();
    }
    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
      playBtn.textContent = this.engine.getState().status === 'running' ? '⏸ PAUSE' : '▶ RESUME';
    }
  }

  private handleRestart(): void {
    this.lastTickTime = performance.now();
    this.engine.restart();
    const playBtn = document.getElementById('playBtn');
    if (playBtn) playBtn.textContent = '▶ START';
    this.updateHUD();
  }

  private toggleLevelSelect(): void {
    this.isLevelSelectMode = !this.isLevelSelectMode;
    if (this.isLevelSelectMode) {
      this.engine.pause();
      const playBtn = document.getElementById('playBtn');
      if (playBtn) playBtn.textContent = '✔ CONFIRM';
    } else {
      this.confirmLevelSelect();
    }
    this.updateHUD();
  }

  private cycleLevel(delta: number): void {
    const total = LEVELS.length;
    this.selectedLevelId = (this.selectedLevelId + delta + total) % total;
    localStorage.setItem('nokia_snake_last_level', String(this.selectedLevelId));
    this.updateHUD();
  }

  private confirmLevelSelect(): void {
    this.isLevelSelectMode = false;
    this.engine.changeLevel(this.selectedLevelId);
    const playBtn = document.getElementById('playBtn');
    if (playBtn) playBtn.textContent = '▶ START';
    this.updateHUD();
  }

  private updateHUD(): void {
    const state = this.engine.getState();
    const level = this.isLevelSelectMode
      ? getLevelConfig(this.selectedLevelId)
      : this.engine.getLevel();

    this.levelText.textContent = `LVL ${level.id}: ${level.name.toUpperCase()}`;
    this.scoreText.textContent = String(state.score);

    const hi = ScoreService.getHighScore(level.id);
    this.hiScoreText.textContent = String(hi);

    if (state.bonusBug && !this.isLevelSelectMode) {
      this.bugBar.style.display = 'inline';
      const pct = Math.ceil((state.bonusBug.ticksRemaining / state.bonusBug.initialTicks) * 6);
      const bars = '█'.repeat(pct) + '░'.repeat(6 - pct);
      this.bugBar.textContent = `BUG [${bars}]`;
    } else {
      this.bugBar.style.display = 'none';
    }
  }

  private loop(now: number): void {
    const level = this.engine.getLevel();
    const tickInterval = level.tickMs;

    if (!this.isLevelSelectMode && this.engine.getState().status === 'running') {
      if (now - this.lastTickTime >= tickInterval) {
        this.lastTickTime = now;
        const tickResult = this.engine.tick();

        if (tickResult.eatenFood) {
          this.sound.playEat();
        }
        if (tickResult.eatenBug) {
          this.sound.playBugEat();
        }
        if (this.engine.getState().bonusBug?.ticksRemaining === 40) {
          this.sound.playBugSpawn();
        }
        if (tickResult.died) {
          this.sound.playDie();
          ScoreService.saveScore(level.id, this.engine.getState().score);
          const playBtn = document.getElementById('playBtn');
          if (playBtn) playBtn.textContent = '↻ REPLAY';
        }

        this.updateHUD();
      }
    }

    // Render Canvas Frame
    const currentLevelConfig = this.isLevelSelectMode
      ? getLevelConfig(this.selectedLevelId)
      : level;
    this.renderer.render(this.engine.getState(), currentLevelConfig, this.isLevelSelectMode);

    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  public destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.abortController.abort();
    document.documentElement.removeAttribute('data-theme');
    this.container.innerHTML = '';
  }
}
