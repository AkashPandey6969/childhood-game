import Phaser from 'phaser';
import { SaveService } from '../services/SaveService';
import { getLevelEntry } from '../levels/manifest';

export class PauseScene extends Phaser.Scene {
  private levelId: string = 'level1';

  constructor() {
    super({ key: 'PauseScene' });
  }

  init(data: { levelId?: string }): void {
    if (data && data.levelId) {
      this.levelId = data.levelId;
    }
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // Semi-transparent backdrop
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x020617, 0.82);
    backdrop.fillRect(0, 0, width, height);
    backdrop.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

    // Modal Card
    const cardW = 320;
    const cardH = 390;
    const card = this.add.container(width / 2, height / 2);

    const cardBg = this.add.graphics();
    cardBg.fillStyle(0x0f172a, 1);
    cardBg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);
    cardBg.lineStyle(2, 0x3b82f6, 0.8);
    cardBg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);
    card.add(cardBg);

    // Title
    const title = this.add.text(0, -cardH / 2 + 40, 'GAME PAUSED', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '22px',
      color: '#f8fafc',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    card.add(title);

    // Current Level Info
    const lvlEntry = getLevelEntry(this.levelId);
    if (lvlEntry) {
      const lvlText = this.add.text(0, -cardH / 2 + 72, `Level ${lvlEntry.number}: ${lvlEntry.title}`, {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '13px',
        color: '#94a3b8',
      }).setOrigin(0.5);
      card.add(lvlText);
    }

    // Buttons
    let btnY = -60;

    // Resume
    this.addModalButton(card, 0, btnY, '▶  Resume', 0x2563eb, () => {
      this.resumeGame();
    });
    btnY += 60;

    // Restart
    this.addModalButton(card, 0, btnY, '↻  Restart Level', 0x334155, () => {
      this.scene.stop();
      const gameScene = this.scene.get('GameScene') as any;
      if (gameScene && typeof gameScene.restartLevel === 'function') {
        gameScene.restartLevel();
      }
    });
    btnY += 60;

    // Level Select
    this.addModalButton(card, 0, btnY, '☰  Level Select', 0x1e293b, () => {
      this.scene.stop('GameScene');
      this.scene.stop();
      this.scene.start('LevelSelectScene');
    });
    btnY += 60;

    // Main Menu
    this.addModalButton(card, 0, btnY, '⌂  Main Menu', 0x1e293b, () => {
      this.scene.stop('GameScene');
      this.scene.stop();
      this.scene.start('MainMenuScene');
    });

    // Sound toggle at bottom
    const soundText = this.add.text(0, cardH / 2 - 25, SaveService.isSoundEnabled() ? '🔊 Sound: ON' : '🔇 Sound: OFF', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '12px',
      color: '#64748b',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    soundText.setInteractive({ useHandCursor: true });
    soundText.on('pointerdown', () => {
      const next = !SaveService.isSoundEnabled();
      SaveService.setSoundEnabled(next);
      soundText.setText(next ? '🔊 Sound: ON' : '🔇 Sound: OFF');
    });
    card.add(soundText);

    // Escape or P key resumes
    if (this.input.keyboard) {
      this.input.keyboard.once('keydown-ESC', () => this.resumeGame());
      this.input.keyboard.once('keydown-P', () => this.resumeGame());
    }
  }

  private resumeGame(): void {
    this.scene.stop();
    this.scene.resume('GameScene');
  }

  private addModalButton(
    parent: Phaser.GameObjects.Container,
    x: number,
    y: number,
    label: string,
    color: number,
    onClick: () => void
  ): void {
    const btn = this.add.container(x, y);
    const w = 240;
    const h = 46;

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    bg.lineStyle(1, 0x475569, 0.8);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);

    const text = this.add.text(0, 0, label, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '15px',
      color: '#f8fafc',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    btn.add([bg, text]);
    btn.setSize(w, h);
    btn.setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => {
      btn.setScale(1.03);
    });
    btn.on('pointerout', () => {
      btn.setScale(1.0);
    });
    btn.on('pointerdown', () => {
      btn.setScale(0.97);
      this.time.delayedCall(60, onClick);
    });

    parent.add(btn);
  }
}
