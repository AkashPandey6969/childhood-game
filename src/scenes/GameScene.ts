import Phaser from 'phaser';
import { GameSession, parseAsciiLevel, Direction } from '../core';
import level1Raw from '../levels/level1.txt?raw';

export class GameScene extends Phaser.Scene {
  private session!: GameSession;
  private tileSize: number = 48;
  private offsetX: number = 0;
  private offsetY: number = 0;

  private isAnimating: boolean = false;
  private touchStartX: number = 0;
  private touchStartY: number = 0;

  // Visual game objects
  private tileContainer!: Phaser.GameObjects.Container;
  private playerObject!: Phaser.GameObjects.Container;
  private diamondObjects: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private exitObject!: Phaser.GameObjects.Container;
  private exitGlow!: Phaser.GameObjects.Graphics;

  // HUD elements
  private diamondsText!: Phaser.GameObjects.Text;
  private movesText!: Phaser.GameObjects.Text;
  private undoButtonText!: Phaser.GameObjects.Text;
  private winModalContainer?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Parse level and initialize pure core session
    const levelData = parseAsciiLevel(level1Raw);
    this.session = new GameSession(levelData);

    // Calculate layout & centering
    this.computeLayout();

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f172a, 0x0f172a, 0x070b14, 0x070b14, 1);
    bg.fillRect(0, 0, this.scale.width, this.scale.height);

    // Create containers
    this.tileContainer = this.add.container(0, 0);

    // Build the grid and level visuals
    this.renderInitialBoard();

    // Build the HUD at the top
    this.createHUD();

    // Register Input Handlers
    this.setupInputHandlers();

    // Update HUD initially
    this.updateHUD();
  }

  private computeLayout(): void {
    const state = this.session.getState();
    const availableWidth = this.scale.width - 32;
    const availableHeight = this.scale.height - 180; // reserve space for HUD and bottom margin

    this.tileSize = Math.floor(Math.min(availableWidth / state.width, availableHeight / state.height, 56));
    const gridPixelWidth = this.tileSize * state.width;
    const gridPixelHeight = this.tileSize * state.height;

    this.offsetX = Math.floor((this.scale.width - gridPixelWidth) / 2);
    this.offsetY = Math.floor(130 + (availableHeight - gridPixelHeight) / 2);
  }

  private tileToPixel(x: number, y: number): { x: number; y: number } {
    return {
      x: this.offsetX + x * this.tileSize + this.tileSize / 2,
      y: this.offsetY + y * this.tileSize + this.tileSize / 2,
    };
  }

  private renderInitialBoard(): void {
    this.tileContainer.removeAll(true);
    this.diamondObjects.clear();

    const state = this.session.getState();

    // Floor and Walls
    for (let y = 0; y < state.height; y++) {
      for (let x = 0; x < state.width; x++) {
        const tile = state.grid[y][x];
        const px = this.offsetX + x * this.tileSize;
        const py = this.offsetY + y * this.tileSize;

        const tileGfx = this.add.graphics();

        if (tile === 'wall') {
          // Beveled stone wall block
          tileGfx.fillStyle(0x334155, 1);
          tileGfx.fillRoundedRect(px + 1, py + 1, this.tileSize - 2, this.tileSize - 2, 4);
          tileGfx.lineStyle(2, 0x475569, 1);
          tileGfx.strokeRoundedRect(px + 2, py + 2, this.tileSize - 4, this.tileSize - 4, 3);

          // Inner bevel highlight
          tileGfx.fillStyle(0x1e293b, 0.6);
          tileGfx.fillRect(px + 4, py + this.tileSize - 6, this.tileSize - 8, 4);
        } else {
          // Walkable floor tile
          tileGfx.fillStyle(0x1e293b, 1);
          tileGfx.fillRect(px, py, this.tileSize, this.tileSize);
          tileGfx.lineStyle(1, 0x0f172a, 0.8);
          tileGfx.strokeRect(px, py, this.tileSize, this.tileSize);

          // Subtle stone floor dot
          tileGfx.fillStyle(0x334155, 0.4);
          tileGfx.fillCircle(px + this.tileSize / 2, py + this.tileSize / 2, 2);
        }

        this.tileContainer.add(tileGfx);

        // Diamonds
        if (tile === 'diamond') {
          const diamondGfx = this.renderDiamond(x, y);
          this.diamondObjects.set(`${x},${y}`, diamondGfx);
        }

        // Exit
        if (tile === 'exit') {
          this.renderExit(x, y);
        }
      }
    }

    // Player object
    this.renderPlayer(state.player.x, state.player.y);
  }

  private renderDiamond(x: number, y: number): Phaser.GameObjects.Graphics {
    const { x: px, y: py } = this.tileToPixel(x, y);
    const gfx = this.add.graphics();
    const size = this.tileSize * 0.32;

    // Diamond outer glow
    gfx.fillStyle(0x00f0ff, 0.3);
    gfx.fillCircle(px, py, size * 1.5);

    // Diamond polygon
    gfx.fillStyle(0x00f0ff, 1);
    gfx.beginPath();
    gfx.moveTo(px, py - size);
    gfx.lineTo(px + size, py);
    gfx.lineTo(px, py + size);
    gfx.lineTo(px - size, py);
    gfx.closePath();
    gfx.fillPath();

    // Diamond inner facet highlight
    gfx.fillStyle(0xffffff, 0.8);
    gfx.beginPath();
    gfx.moveTo(px, py - size * 0.75);
    gfx.lineTo(px + size * 0.4, py);
    gfx.lineTo(px, py - size * 0.1);
    gfx.lineTo(px - size * 0.4, py);
    gfx.closePath();
    gfx.fillPath();

    this.tileContainer.add(gfx);

    // Sparkle pulse tween
    this.tweens.add({
      targets: gfx,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    return gfx;
  }

  private renderExit(x: number, y: number): void {
    const { x: px, y: py } = this.tileToPixel(x, y);
    this.exitObject = this.add.container(px, py);

    this.exitGlow = this.add.graphics();
    this.exitObject.add(this.exitGlow);

    const door = this.add.graphics();
    const w = this.tileSize * 0.75;
    const h = this.tileSize * 0.85;

    door.fillStyle(0x374151, 1);
    door.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
    door.lineStyle(2, 0xd97706, 1);
    door.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);

    const doorText = this.add.text(0, 0, 'EXIT', {
      fontFamily: 'monospace',
      fontSize: `${Math.floor(this.tileSize * 0.22)}px`,
      color: '#fbbf24',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.exitObject.add([door, doorText]);
    this.tileContainer.add(this.exitObject);

    this.updateExitVisual();
  }

  private updateExitVisual(): void {
    if (!this.exitGlow) return;
    this.exitGlow.clear();

    const state = this.session.getState();
    const isUnlocked = state.collectedDiamonds === state.totalDiamonds;

    if (isUnlocked) {
      // Unlocked: radiant golden glow
      this.exitGlow.fillStyle(0x10b981, 0.4);
      this.exitGlow.fillCircle(0, 0, this.tileSize * 0.55);
      this.exitGlow.fillStyle(0xf59e0b, 0.3);
      this.exitGlow.fillCircle(0, 0, this.tileSize * 0.7);
    } else {
      // Locked: dim red/grey indicator
      this.exitGlow.fillStyle(0x991b1b, 0.2);
      this.exitGlow.fillCircle(0, 0, this.tileSize * 0.45);
    }
  }

  private renderPlayer(x: number, y: number): void {
    const { x: px, y: py } = this.tileToPixel(x, y);

    if (this.playerObject) {
      this.playerObject.setPosition(px, py);
      return;
    }

    this.playerObject = this.add.container(px, py);

    const body = this.add.graphics();
    const radius = this.tileSize * 0.36;

    // Outer glow
    body.fillStyle(0xf59e0b, 0.3);
    body.fillCircle(0, 0, radius + 4);

    // Adventurer token circle
    body.fillStyle(0xf59e0b, 1);
    body.fillCircle(0, 0, radius);

    // Explorer hat / visor
    body.fillStyle(0x78350f, 1);
    body.fillRoundedRect(-radius * 0.8, -radius * 0.8, radius * 1.6, radius * 0.7, 3);

    // Eyes
    body.fillStyle(0xffffff, 1);
    body.fillCircle(-radius * 0.3, -radius * 0.05, 3);
    body.fillCircle(radius * 0.3, -radius * 0.05, 3);
    body.fillStyle(0x000000, 1);
    body.fillCircle(-radius * 0.3, -radius * 0.05, 1.5);
    body.fillCircle(radius * 0.3, -radius * 0.05, 1.5);

    this.playerObject.add(body);
    this.add.existing(this.playerObject);
  }

  private createHUD(): void {
    const width = this.scale.width;

    // Top Header background panel
    const hudBg = this.add.graphics();
    hudBg.fillStyle(0x111827, 0.95);
    hudBg.fillRoundedRect(12, 12, width - 24, 76, 12);
    hudBg.lineStyle(1, 0x374151, 1);
    hudBg.strokeRoundedRect(12, 12, width - 24, 76, 12);

    // Diamonds count
    this.diamondsText = this.add.text(28, 28, '💎 0 / 0', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '20px',
      color: '#38bdf8',
      fontStyle: 'bold',
    });

    // Moves count
    this.movesText = this.add.text(28, 54, 'Moves: 0', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '15px',
      color: '#9ca3af',
    });

    // Undo Button
    const undoBtn = this.add.container(width - 165, 50);
    const undoBg = this.add.graphics();
    undoBg.fillStyle(0x374151, 1);
    undoBg.fillRoundedRect(-40, -18, 80, 36, 8);
    this.undoButtonText = this.add.text(0, 0, '↶ Undo', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '14px',
      color: '#e2e8f0',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    undoBtn.add([undoBg, this.undoButtonText]);
    undoBtn.setSize(80, 36);
    undoBtn.setInteractive({ useHandCursor: true });
    undoBtn.on('pointerdown', () => this.handleUndo());

    // Restart Button
    const restartBtn = this.add.container(width - 65, 50);
    const restartBg = this.add.graphics();
    restartBg.fillStyle(0x4b5563, 1);
    restartBg.fillRoundedRect(-40, -18, 80, 36, 8);
    const restartText = this.add.text(0, 0, '↻ Reset', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '14px',
      color: '#f87171',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    restartBtn.add([restartBg, restartText]);
    restartBtn.setSize(80, 36);
    restartBtn.setInteractive({ useHandCursor: true });
    restartBtn.on('pointerdown', () => this.handleRestart());
  }

  private updateHUD(): void {
    const state = this.session.getState();
    this.diamondsText.setText(`💎 ${state.collectedDiamonds} / ${state.totalDiamonds}`);
    this.movesText.setText(`Moves: ${state.moveCount}`);

    // Dim undo button if cannot undo
    const canUndo = this.session.canUndo();
    this.undoButtonText.setAlpha(canUndo ? 1.0 : 0.4);

    this.updateExitVisual();
  }

  private setupInputHandlers(): void {
    // Keyboard input
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
        const key = event.key.toLowerCase();
        if (key === 'arrowup' || key === 'w') {
          this.handleMove('up');
        } else if (key === 'arrowdown' || key === 's') {
          this.handleMove('down');
        } else if (key === 'arrowleft' || key === 'a') {
          this.handleMove('left');
        } else if (key === 'arrowright' || key === 'd') {
          this.handleMove('right');
        } else if (key === 'u' || key === 'z') {
          this.handleUndo();
        } else if (key === 'r') {
          this.handleRestart();
        }
      });
    }

    // Touch / Mouse Swipe detection
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.touchStartX = pointer.x;
      this.touchStartY = pointer.y;
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const dx = pointer.x - this.touchStartX;
      const dy = pointer.y - this.touchStartY;
      const dist = Math.hypot(dx, dy);

      if (dist >= 30) {
        if (Math.abs(dx) > Math.abs(dy)) {
          this.handleMove(dx > 0 ? 'right' : 'left');
        } else {
          this.handleMove(dy > 0 ? 'down' : 'up');
        }
      }
    });
  }

  private handleMove(direction: Direction): void {
    if (this.isAnimating) return;

    const prevState = this.session.getState();
    if (prevState.status !== 'playing') return;

    const moveSuccessful = this.session.move(direction);
    if (!moveSuccessful) {
      // Play a quick subtle bump bounce when blocked
      const delta = {
        up: { x: 0, y: -4 },
        down: { x: 0, y: 4 },
        left: { x: -4, y: 0 },
        right: { x: 4, y: 0 },
      }[direction];

      this.tweens.add({
        targets: this.playerObject,
        x: this.playerObject.x + delta.x,
        y: this.playerObject.y + delta.y,
        duration: 50,
        yoyo: true,
        ease: 'Quad.easeInOut',
      });
      return;
    }

    const nextState = this.session.getState();
    const targetPixel = this.tileToPixel(nextState.player.x, nextState.player.y);

    this.isAnimating = true;

    // Check if diamond was collected
    const diamondKey = `${nextState.player.x},${nextState.player.y}`;
    const collectedDiamondGfx = this.diamondObjects.get(diamondKey);

    if (collectedDiamondGfx) {
      // Pop and disappear animation
      this.tweens.add({
        targets: collectedDiamondGfx,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0,
        duration: 120,
        onComplete: () => {
          collectedDiamondGfx.destroy();
          this.diamondObjects.delete(diamondKey);
        },
      });
    }

    // Move player with smooth tween
    this.tweens.add({
      targets: this.playerObject,
      x: targetPixel.x,
      y: targetPixel.y,
      duration: 120,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.isAnimating = false;
        this.updateHUD();

        if (nextState.status === 'won') {
          this.showWinModal();
        }
      },
    });
  }

  private handleUndo(): void {
    if (this.isAnimating) return;
    if (!this.session.undo()) return;

    // Refresh board to restore collected diamond visuals
    this.renderInitialBoard();
    this.updateHUD();

    if (this.winModalContainer) {
      this.winModalContainer.destroy();
      this.winModalContainer = undefined;
    }
  }

  private handleRestart(): void {
    if (this.isAnimating) return;
    this.session.restart();
    this.renderInitialBoard();
    this.updateHUD();

    if (this.winModalContainer) {
      this.winModalContainer.destroy();
      this.winModalContainer = undefined;
    }
  }

  private showWinModal(): void {
    if (this.winModalContainer) return;

    const width = this.scale.width;
    const height = this.scale.height;
    const state = this.session.getState();

    this.winModalContainer = this.add.container(width / 2, height / 2);

    // Dim background overlay
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x000000, 0.75);
    backdrop.fillRect(-width / 2, -height / 2, width, height);

    // Dialog card
    const card = this.add.graphics();
    card.fillStyle(0x1e293b, 1);
    card.fillRoundedRect(-180, -140, 360, 280, 16);
    card.lineStyle(3, 0xf59e0b, 1);
    card.strokeRoundedRect(-180, -140, 360, 280, 16);

    // Trophy icon / title
    const titleText = this.add.text(0, -90, '🏆 LEVEL COMPLETE! 🏆', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '22px',
      color: '#fcd34d',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const diamondsInfo = this.add.text(0, -40, `All Diamonds Collected: 💎 ${state.collectedDiamonds} / ${state.totalDiamonds}`, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '16px',
      color: '#38bdf8',
    }).setOrigin(0.5);

    const movesInfo = this.add.text(0, -10, `Moves Taken: ${state.moveCount}`, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '16px',
      color: '#e2e8f0',
    }).setOrigin(0.5);

    // Play Again button
    const playAgainBtn = this.add.container(0, 60);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x10b981, 1);
    btnBg.fillRoundedRect(-90, -22, 180, 44, 10);
    btnBg.lineStyle(2, 0x34d399, 1);
    btnBg.strokeRoundedRect(-90, -22, 180, 44, 10);

    const btnText = this.add.text(0, 0, 'Play Again', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    playAgainBtn.add([btnBg, btnText]);
    playAgainBtn.setSize(180, 44);
    playAgainBtn.setInteractive({ useHandCursor: true });
    playAgainBtn.on('pointerdown', () => this.handleRestart());

    this.winModalContainer.add([backdrop, card, titleText, diamondsInfo, movesInfo, playAgainBtn]);

    // Animate modal pop in
    this.winModalContainer.setScale(0.8);
    this.winModalContainer.setAlpha(0);
    this.tweens.add({
      targets: this.winModalContainer,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 250,
      ease: 'Back.easeOut',
    });
  }
}
