import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Background gradient or dark panel
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x0f0f1a, 0x0f0f1a, 1);
    bg.fillRect(0, 0, width, height);

    // Decorative diamond graphic
    const diamond = this.add.graphics();
    diamond.fillStyle(0x00f0ff, 1);
    diamond.beginPath();
    diamond.moveTo(width / 2, height / 2 - 120);
    diamond.lineTo(width / 2 + 50, height / 2 - 60);
    diamond.lineTo(width / 2, height / 2);
    diamond.lineTo(width / 2 - 50, height / 2 - 60);
    diamond.closePath();
    diamond.fillPath();

    // Inner diamond highlight
    diamond.fillStyle(0xffffff, 0.6);
    diamond.beginPath();
    diamond.moveTo(width / 2, height / 2 - 110);
    diamond.lineTo(width / 2 + 30, height / 2 - 65);
    diamond.lineTo(width / 2, height / 2 - 20);
    diamond.lineTo(width / 2 - 30, height / 2 - 65);
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
        fill: true
      }
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height / 2 + 100, 'Puzzle Adventure', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '20px',
      color: '#90caf9',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Version / Status
    this.add.text(width / 2, height - 50, 'v0.1.0 • Phase 1 Ready', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '14px',
      color: '#718096'
    }).setOrigin(0.5);
  }
}
