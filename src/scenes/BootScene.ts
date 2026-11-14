import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x0f0f1a, 0x0f0f1a, 1);
    bg.fillRect(0, 0, width, height);

    // Decorative diamond graphic
    const diamond = this.add.graphics();
    diamond.fillStyle(0x00f0ff, 1);
    diamond.beginPath();
    diamond.moveTo(width / 2, height / 2 - 130);
    diamond.lineTo(width / 2 + 55, height / 2 - 65);
    diamond.lineTo(width / 2, height / 2);
    diamond.lineTo(width / 2 - 55, height / 2 - 65);
    diamond.closePath();
    diamond.fillPath();

    // Inner diamond highlight
    diamond.fillStyle(0xffffff, 0.6);
    diamond.beginPath();
    diamond.moveTo(width / 2, height / 2 - 120);
    diamond.lineTo(width / 2 + 35, height / 2 - 70);
    diamond.lineTo(width / 2, height / 2 - 20);
    diamond.lineTo(width / 2 - 35, height / 2 - 70);
    diamond.closePath();
    diamond.fillPath();

    // Title text
    this.add.text(width / 2, height / 2 + 40, 'GEM DELVER', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '44px',
      color: '#ffd700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
      shadow: {
        offsetX: 2,
        offsetY: 4,
        color: '#000000',
        blur: 4,
        stroke: true,
        fill: true,
      },
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height / 2 + 95, 'Puzzle Adventure', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '20px',
      color: '#90caf9',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Start Button
    const startBtn = this.add.container(width / 2, height / 2 + 180);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x0284c7, 1);
    btnBg.fillRoundedRect(-110, -25, 220, 50, 12);
    btnBg.lineStyle(2, 0x38bdf8, 1);
    btnBg.strokeRoundedRect(-110, -25, 220, 50, 12);

    const btnText = this.add.text(0, 0, 'START GAME', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#0369a1',
      strokeThickness: 2,
    }).setOrigin(0.5);

    startBtn.add([btnBg, btnText]);
    startBtn.setSize(220, 50);
    startBtn.setInteractive({ useHandCursor: true });

    const startGame = () => {
      this.scene.start('MainMenuScene');
    };

    startBtn.on('pointerdown', startGame);

    // Also support any keypress or screen tap
    this.input.keyboard?.on('keydown', startGame);
    this.input.on('pointerdown', (_pointer: Phaser.Input.Pointer, currentlyOver: unknown[]) => {
      if (Array.isArray(currentlyOver) && currentlyOver.length === 0) {
        startGame();
      }
    });

    // Pulse animation for start button
    this.tweens.add({
      targets: startBtn,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Version / Status
    this.add.text(width / 2, height - 40, 'v0.3.0 • Phase 3', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '14px',
      color: '#64748b',
    }).setOrigin(0.5);
  }
}
