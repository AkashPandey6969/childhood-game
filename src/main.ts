import './style.css';
import { ArcadeHub } from './hub/ArcadeHub';
import { DiamondRushApp } from './games/diamond-rush/DiamondRushApp';
import { SnakeApp } from './games/snake/SnakeApp';

type GameMode = 'hub' | 'diamond-rush' | 'snake';

class AppOrchestrator {
  private currentMode: GameMode = 'hub';
  private hubInstance: ArcadeHub | null = null;
  private diamondRushInstance: DiamondRushApp | null = null;
  private snakeInstance: SnakeApp | null = null;

  private topNav!: HTMLElement;
  private gameTitleText!: HTMLElement;
  private returnBtn!: HTMLElement;

  constructor() {
    this.initDOM();
    this.setupEventListeners();
    this.switchTo('hub');
  }

  private initDOM(): void {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
      <!-- Universal Top Nav Bar (visible during games or hub) -->
      <header id="universalNav" class="universal-nav">
        <div class="nav-left">
          <span class="nav-arcade-logo">🕹️ RETRO VAULT</span>
          <span class="nav-divider">/</span>
          <span id="navGameTitle" class="nav-game-title">Cartridge Select</span>
        </div>
        <div class="nav-right">
          <button id="navReturnBtn" class="nav-hub-btn" style="display:none;" title="Return to Cartridge Select">
            ⌂ Back to Menu
          </button>
        </div>
      </header>

      <!-- Main Game Viewport -->
      <main id="game-canvas-area" class="main-viewport"></main>
    `;

    this.topNav = document.getElementById('universalNav')!;
    this.gameTitleText = document.getElementById('navGameTitle')!;
    this.returnBtn = document.getElementById('navReturnBtn')!;
  }

  private setupEventListeners(): void {
    // Return button in top navigation bar
    this.returnBtn.addEventListener('click', () => {
      this.switchTo('hub');
    });

    // Custom event dispatched from inside Phaser or Snake
    window.addEventListener('exit-to-hub', () => {
      this.switchTo('hub');
    });

    // Universal escape key shortcut when in a game to return or pause
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.currentMode !== 'hub') {
        // If Escape is pressed, we let the in-game pause menu open,
        // but if Shift+Escape is pressed, immediately exit to hub
        if (e.shiftKey) {
          e.preventDefault();
          this.switchTo('hub');
        }
      }
    });
  }

  public switchTo(mode: GameMode): void {
    // Teardown existing instance
    if (this.currentMode === 'hub' && this.hubInstance) {
      this.hubInstance.destroy();
      this.hubInstance = null;
    } else if (this.currentMode === 'diamond-rush' && this.diamondRushInstance) {
      this.diamondRushInstance.destroy();
      this.diamondRushInstance = null;
    } else if (this.currentMode === 'snake' && this.snakeInstance) {
      this.snakeInstance.destroy();
      this.snakeInstance = null;
    }

    this.currentMode = mode;
    const canvasArea = document.getElementById('game-canvas-area');
    if (canvasArea) {
      canvasArea.innerHTML = '';
      canvasArea.className = `main-viewport view-${mode}`;
    }

    if (mode === 'hub') {
      this.gameTitleText.textContent = 'Cartridge Select';
      this.returnBtn.style.display = 'none';
      this.topNav.classList.remove('in-game');
      this.hubInstance = new ArcadeHub('game-canvas-area', (selectedGame) => {
        this.switchTo(selectedGame);
      });
    } else if (mode === 'diamond-rush') {
      this.gameTitleText.textContent = 'Gem Delver';
      this.returnBtn.style.display = 'inline-flex';
      this.topNav.classList.add('in-game');
      this.diamondRushInstance = new DiamondRushApp('game-canvas-area');
    } else if (mode === 'snake') {
      this.gameTitleText.textContent = 'Nokia Snake';
      this.returnBtn.style.display = 'inline-flex';
      this.topNav.classList.add('in-game');
      this.snakeInstance = new SnakeApp('game-canvas-area');
    }
  }
}

// Start application
window.addEventListener('DOMContentLoaded', () => {
  new AppOrchestrator();
});
