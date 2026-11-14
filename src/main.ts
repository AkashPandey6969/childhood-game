import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';

export const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 480,
  height: 800,
  parent: 'game-container',
  backgroundColor: '#0f0f1a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene],
};

window.addEventListener('DOMContentLoaded', () => {
  new Phaser.Game(config);
});
