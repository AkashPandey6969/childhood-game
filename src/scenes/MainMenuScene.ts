import Phaser from 'phaser';
import { SaveService } from '../services/SaveService';
import { AudioService } from '../services/AudioService';
import { LEVELS_MANIFEST } from '../levels/manifest';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // Atmospheric background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0f1d, 0x0a0f1d, 0x020617, 0x020617, 1);
    bg.fillRect(0, 0, width, height);

    // Floating gem sparkle particles in background
    for (let i = 0; i < 16; i++) {
      const px = Phaser.Math.Between(30, width - 30);
      const py = Phaser.Math.Between(50, height - 100);
      const star = this.add.graphics();
      star.fillStyle(0x38bdf8, Phaser.Math.FloatBetween(0.2, 0.6));
      star.fillCircle(px, py, Phaser.Math.Between(1, 3));

      this.tweens.add({
        targets: star,
        alpha: 0.1,
        y: py - 20,
        duration: Phaser.Math.Between(2000, 4000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Main Diamond Emblem
    const emblemContainer = this.add.container(width / 2, 200);
    const glow = this.add.graphics();
    glow.fillStyle(0x38bdf8, 0.25);
    glow.fillCircle(0, 0, 56);
    glow.fillStyle(0xfbbf24, 0.15);
    glow.fillCircle(0, 0, 72);

    const diamondGfx = this.add.graphics();
    const dSize = 38;
    // Diamond facet rendering
    diamondGfx.fillStyle(0x38bdf8, 1);
    diamondGfx.fillTriangle(0, -dSize, dSize, 0, -dSize, 0);
    diamondGfx.fillStyle(0x0284c7, 1);
    diamondGfx.fillTriangle(0, dSize, dSize, 0, -dSize, 0);
    diamondGfx.fillStyle(0xbae6fd, 0.9);
    diamondGfx.fillTriangle(0, -dSize, dSize * 0.5, 0, 0, 0);

    emblemContainer.add([glow, diamondGfx]);

    this.tweens.add({
      targets: emblemContainer,
      y: 190,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Game Title
    this.add.text(width / 2 + 2, 302, 'GEM DELVER', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '36px',
      color: '#000000',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, 300, 'GEM DELVER', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '36px',
      color: '#fcd34d',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, 340, 'ANCIENT PUZZLE EXPEDITION', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#94a3b8',
      letterSpacing: 2,
    }).setOrigin(0.5);

    // Button Generator
    this.createMenuButton(width / 2, 440, '▶  PLAY', 0x2563eb, 0x1d4ed8, () => {
      // Find highest unlocked level
      let targetLevel = LEVELS_MANIFEST[0].id;
      for (const lvl of LEVELS_MANIFEST) {
        const prog = SaveService.getLevelProgress(lvl.id);
        if (prog.unlocked && !prog.completed) {
          targetLevel = lvl.id;
          break;
        }
      }
      this.scene.start('GameScene', { levelId: targetLevel });
    });

    this.createMenuButton(width / 2, 516, '☰  LEVEL SELECT', 0x1e293b, 0x334155, () => {
      this.scene.start('LevelSelectScene');
    });

    // Sound Toggle Button
    const soundBtn = this.createSmallButton(width / 2 - 80, 590, SaveService.isSoundEnabled() ? '🔊 Sound: ON' : '🔇 Sound: OFF', () => {
      const next = !SaveService.isSoundEnabled();
      SaveService.setSoundEnabled(next);
      SaveService.setMusicEnabled(next);
      AudioService.getInstance().updateMusicState();
      soundBtn.text.setText(next ? '🔊 Sound: ON' : '🔇 Sound: OFF');
    });

    // Reset Progress Button
    this.createSmallButton(width / 2 + 80, 590, '↻ Reset Data', () => {
      if (confirm('Reset all saved level progress and stars?')) {
        SaveService.resetProgress();
        this.scene.restart();
      }
    });

    // Footer info
    this.add.text(width / 2, height - 32, 'Phaser 3 • Pure Turn-Based Engine', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#475569',
    }).setOrigin(0.5);
  }

  private createMenuButton(
    x: number,
    y: number,
    label: string,
    color: number,
    hoverColor: number,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const w = 260;
    const h = 54;

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    bg.lineStyle(1.5, 0x60a5fa, 0.4);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);

    const text = this.add.text(0, 0, label, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(hoverColor, 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
      bg.lineStyle(2, 0x93c5fd, 0.8);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
      container.setScale(1.03);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
      bg.lineStyle(1.5, 0x60a5fa, 0.4);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
      container.setScale(1.0);
    });

    container.on('pointerdown', () => {
      container.setScale(0.97);
      this.time.delayedCall(80, onClick);
    });

    return container;
  }

  private createSmallButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void
  ): { container: Phaser.GameObjects.Container; text: Phaser.GameObjects.Text } {
    const container = this.add.container(x, y);
    const w = 140;
    const h = 36;

    const bg = this.add.graphics();
    bg.fillStyle(0x1e293b, 0.9);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    bg.lineStyle(1, 0x475569, 0.8);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);

    const text = this.add.text(0, 0, label, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '12px',
      color: '#cbd5e1',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      container.setScale(1.04);
    });
    container.on('pointerout', () => {
      container.setScale(1.0);
    });
    container.on('pointerdown', onClick);

    return { container, text };
  }
}
