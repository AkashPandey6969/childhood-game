import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { GameScene } from './scenes/GameScene';
import { PauseScene } from './scenes/PauseScene';

export class DiamondRushApp {
  private game: Phaser.Game | null = null;
  private containerId: string;

  constructor(containerId: string = 'game-canvas-area') {
    this.containerId = containerId;
    this.start();
  }

  private start(): void {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 480,
      height: 800,
      parent: this.containerId,
      backgroundColor: '#070b14',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [BootScene, MainMenuScene, LevelSelectScene, GameScene, PauseScene],
    };

    this.game = new Phaser.Game(config);
  }

  public destroy(): void {
    if (this.game) {
      try {
        this.game.destroy(true);
      } catch (err) {
        console.warn('Phaser cleanup notice:', err);
      }
      this.game = null;
    }
    const container = document.getElementById(this.containerId);
    if (container) {
      container.innerHTML = '';
    }
  }
}
