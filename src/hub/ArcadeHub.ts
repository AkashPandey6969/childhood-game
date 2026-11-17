import { SaveService } from '../games/diamond-rush/services/SaveService';
import { ScoreService } from '../games/snake/storage/scoreService';

export class ArcadeHub {
  private container: HTMLElement;
  private onSelectGame: (gameId: 'diamond-rush' | 'snake') => void;
  private abortController: AbortController = new AbortController();

  constructor(
    containerId: string = 'game-canvas-area',
    onSelectGame: (gameId: 'diamond-rush' | 'snake') => void
  ) {
    this.container = document.getElementById(containerId) || document.body;
    this.onSelectGame = onSelectGame;
    this.render();
  }

  public render(): void {
    const progress = SaveService.getAllProgress();
    let totalStars = 0;
    let completedLevels = 0;
    for (const p of Object.values(progress)) {
      totalStars += p.stars || 0;
      if (p.completed) completedLevels++;
    }

    const highScores = ScoreService.getAllHighScores();
    const snakeScores = Object.values(highScores);
    const maxSnakeScore = snakeScores.length > 0 ? Math.max(0, ...snakeScores) : 0;

    this.container.innerHTML = `
      <div class="arcade-shell">
        <!-- Arcade Marquee Header -->
        <header class="marquee-header">
          <div class="marquee-topline">
            <span class="arcade-tag">POCKET RETRO ARCADE</span>
            <span class="freeplay-badge"><span class="blink-led"></span> FREE PLAY</span>
          </div>
          <h1 class="marquee-title">SELECT A GAME</h1>
          <p class="marquee-sub">Pick a cartridge to start playing</p>
        </header>

        <!-- Cartridges Rack -->
        <main class="cartridge-rack">
          <!-- Cartridge 1: Gem Delver -->
          <article class="cartridge-box cart-diamond" id="cartDiamond" tabindex="0" role="button" aria-label="Play Gem Delver">
            <div class="cart-grip">
              <span class="grip-line"></span>
              <span class="grip-line"></span>
              <span class="grip-line"></span>
            </div>

            <div class="cart-label">
              <div class="label-artwork art-diamond">
                <div class="pixel-gem">
                  <svg viewBox="0 0 64 64" class="gem-vector" aria-hidden="true">
                    <polygon points="32,4 58,22 46,58 18,58 6,22" fill="#0284c7" stroke="#38bdf8" stroke-width="2.5"/>
                    <polygon points="32,4 58,22 32,32" fill="#38bdf8"/>
                    <polygon points="32,4 6,22 32,32" fill="#bae6fd"/>
                    <polygon points="6,22 18,58 32,32" fill="#0369a1"/>
                    <polygon points="58,22 46,58 32,32" fill="#0284c7"/>
                    <polygon points="18,58 46,58 32,32" fill="#075985"/>
                    <!-- Sparkle -->
                    <circle cx="20" cy="16" r="3" fill="#ffffff"/>
                    <circle cx="44" cy="42" r="2" fill="#ffffff" opacity="0.8"/>
                  </svg>
                </div>
                <div class="cart-num-badge">1</div>
              </div>

              <div class="label-info">
                <div class="label-meta">
                  <span class="genre-pill">PUZZLE ADVENTURE</span>
                  <span class="stars-counter">★ ${totalStars}/60</span>
                </div>
                <h2 class="game-name">GEM DELVER</h2>
                <p class="game-tagline">
                  Explore ancient temple ruins, push boulders onto switches, and pocket sparkling diamonds.
                </p>

                <div class="game-stats-box">
                  <div class="stat-col">
                    <span class="stat-label">LEVELS</span>
                    <span class="stat-val">20 Stages</span>
                  </div>
                  <div class="stat-col">
                    <span class="stat-label">CLEARED</span>
                    <span class="stat-val">${completedLevels} / 20</span>
                  </div>
                  <div class="stat-col">
                    <span class="stat-label">INPUT</span>
                    <span class="stat-val">Arrow / Touch</span>
                  </div>
                </div>

                <button class="cart-play-btn btn-blue" id="btnPlayDiamond" tabindex="-1">
                  INSERT & PLAY <span>[1]</span>
                </button>
              </div>
            </div>
          </article>

          <!-- Cartridge 2: Nokia Snake -->
          <article class="cartridge-box cart-snake" id="cartSnake" tabindex="0" role="button" aria-label="Play Nokia Snake">
            <div class="cart-grip">
              <span class="grip-line"></span>
              <span class="grip-line"></span>
              <span class="grip-line"></span>
            </div>

            <div class="cart-label">
              <div class="label-artwork art-snake">
                <!-- Retro LCD Mini Screen -->
                <div class="lcd-mockup">
                  <div class="lcd-mock-header">LVL 00 • 3310</div>
                  <div class="lcd-mock-grid">
                    <span class="pixel-block s-head"></span>
                    <span class="pixel-block s-body"></span>
                    <span class="pixel-block s-body"></span>
                    <span class="pixel-block s-food"></span>
                    <span class="pixel-block s-bug"></span>
                  </div>
                </div>
                <div class="cart-num-badge">2</div>
              </div>

              <div class="label-info">
                <div class="label-meta">
                  <span class="genre-pill pill-green">NOKIA CLASSIC</span>
                  <span class="score-badge">BEST: ${maxSnakeScore}</span>
                </div>
                <h2 class="game-name">NOKIA SNAKE</h2>
                <p class="game-tagline">
                  The original 90s monochrome snake. Munch pellets, chase timed bonus bugs, and avoid your tail.
                </p>

                <div class="game-stats-box">
                  <div class="stat-col">
                    <span class="stat-label">MAZES</span>
                    <span class="stat-val">Levels 0–9</span>
                  </div>
                  <div class="stat-col">
                    <span class="stat-label">THEMES</span>
                    <span class="stat-val">4 Palettes</span>
                  </div>
                  <div class="stat-col">
                    <span class="stat-label">AUDIO</span>
                    <span class="stat-val">Buzzer SFX</span>
                  </div>
                </div>

                <button class="cart-play-btn btn-green" id="btnPlaySnake" tabindex="-1">
                  INSERT & PLAY <span>[2]</span>
                </button>
              </div>
            </div>
          </article>
        </main>

        <!-- Arcade Floor Prompts -->
        <footer class="arcade-bottom-bar">
          <div class="shortcut-hints">
            <span class="key-pill"><kbd>1</kbd> Gem Delver</span>
            <span class="key-pill"><kbd>2</kbd> Snake</span>
            <span class="key-pill"><kbd>←</kbd><kbd>→</kbd> Select</span>
            <span class="key-pill"><kbd>ENTER</kbd> Play</span>
          </div>
          <div class="footer-sign">Made for retro fans • 100% playable offline</div>
        </footer>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const { signal } = this.abortController;

    const launchDiamond = () => this.onSelectGame('diamond-rush');
    const launchSnake = () => this.onSelectGame('snake');

    // Button clicks
    document.getElementById('btnPlayDiamond')?.addEventListener('click', (e) => {
      e.stopPropagation();
      launchDiamond();
    }, { signal });

    document.getElementById('cartDiamond')?.addEventListener('click', () => {
      launchDiamond();
    }, { signal });

    document.getElementById('btnPlaySnake')?.addEventListener('click', (e) => {
      e.stopPropagation();
      launchSnake();
    }, { signal });

    document.getElementById('cartSnake')?.addEventListener('click', () => {
      launchSnake();
    }, { signal });

    // Keyboard navigation (1, 2, arrows, enter)
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === '1') {
        launchDiamond();
      } else if (e.key === '2') {
        launchSnake();
      } else if (e.key === 'ArrowLeft') {
        document.getElementById('cartDiamond')?.focus();
      } else if (e.key === 'ArrowRight') {
        document.getElementById('cartSnake')?.focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (document.activeElement?.id === 'cartSnake') {
          e.preventDefault();
          launchSnake();
        } else if (document.activeElement?.id === 'cartDiamond') {
          e.preventDefault();
          launchDiamond();
        }
      }
    }, { signal });
  }

  public destroy(): void {
    this.abortController.abort();
    this.container.innerHTML = '';
  }
}
