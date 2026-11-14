import Phaser from 'phaser';
import { GameSession, parseAsciiLevel, Direction, LevelData, isGateOpen, BoulderState } from '../core';
import level1Raw from '../levels/level1.txt?raw';
import level2Raw from '../levels/level2_block.txt?raw';
import level3Raw from '../levels/level3_key_door.txt?raw';
import level4Raw from '../levels/level4_switch_gate.txt?raw';
import level5Raw from '../levels/level5_hole.txt?raw';
import level6Raw from '../levels/level6_spikes.txt?raw';
import level7Raw from '../levels/level7_boulder.txt?raw';

interface LevelEntry {
  title: string;
  raw: string;
}

const LEVELS: LevelEntry[] = [
  { title: 'Level 1: The Descent', raw: level1Raw },
  { title: 'Level 2: Pushable Blocks', raw: level2Raw },
  { title: 'Level 3: Keys & Locked Doors', raw: level3Raw },
  { title: 'Level 4: Switches & Gates', raw: level4Raw },
  { title: 'Level 5: Chasms & Holes', raw: level5Raw },
  { title: 'Level 6: Deadly Spikes', raw: level6Raw },
  { title: 'Level 7: Rolling Boulders', raw: level7Raw },
];

export class GameScene extends Phaser.Scene {
  private currentLevelIndex: number = 0;
  private session!: GameSession;
  private currentLevelData!: LevelData;
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
  private blockObjects: Map<string, Phaser.GameObjects.Container> = new Map();
  private keyObjects: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private doorObjects: Map<string, Phaser.GameObjects.Container> = new Map();
  private switchObjects: Map<string, { padGfx: Phaser.GameObjects.Graphics; x: number; y: number }> = new Map();
  private gateObjects: Map<string, Phaser.GameObjects.Container> = new Map();
  private holeObjects: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private spikeBootsObjects: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private boulderObjects: Map<number, Phaser.GameObjects.Container> = new Map();
  private exitObject!: Phaser.GameObjects.Container;
  private exitGlow!: Phaser.GameObjects.Graphics;

  // HUD elements
  private levelTitleText!: Phaser.GameObjects.Text;
  private diamondsText!: Phaser.GameObjects.Text;
  private keysText!: Phaser.GameObjects.Text;
  private bootsText!: Phaser.GameObjects.Text;
  private movesText!: Phaser.GameObjects.Text;
  private undoButtonText!: Phaser.GameObjects.Text;
  private winModalContainer?: Phaser.GameObjects.Container;
  private loseModalContainer?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.loadLevel(this.currentLevelIndex);

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f172a, 0x0f172a, 0x070b14, 0x070b14, 1);
    bg.fillRect(0, 0, this.scale.width, this.scale.height);

    // Containers
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

  private loadLevel(index: number): void {
    this.currentLevelIndex = index;
    const entry = LEVELS[this.currentLevelIndex];
    this.currentLevelData = parseAsciiLevel(entry.raw);
    this.session = new GameSession(this.currentLevelData);
    this.computeLayout();
  }

  private computeLayout(): void {
    const state = this.session.getState();
    const availableWidth = this.scale.width - 32;
    const availableHeight = this.scale.height - 190;

    this.tileSize = Math.floor(Math.min(availableWidth / state.width, availableHeight / state.height, 56));
    const gridPixelWidth = this.tileSize * state.width;
    const gridPixelHeight = this.tileSize * state.height;

    this.offsetX = Math.floor((this.scale.width - gridPixelWidth) / 2);
    this.offsetY = Math.floor(140 + (availableHeight - gridPixelHeight) / 2);
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
    this.blockObjects.clear();
    this.keyObjects.clear();
    this.doorObjects.clear();
    this.switchObjects.clear();
    this.gateObjects.clear();
    this.holeObjects.clear();
    this.spikeBootsObjects.clear();
    this.boulderObjects.clear();

    const state = this.session.getState();

    // Floor and Walls
    for (let y = 0; y < state.height; y++) {
      for (let x = 0; x < state.width; x++) {
        const tile = state.grid[y][x];
        const baseTile = state.baseGrid[y][x];
        const px = this.offsetX + x * this.tileSize;
        const py = this.offsetY + y * this.tileSize;

        const tileGfx = this.add.graphics();

        if (tile === 'wall') {
          tileGfx.fillStyle(0x334155, 1);
          tileGfx.fillRoundedRect(px + 1, py + 1, this.tileSize - 2, this.tileSize - 2, 4);
          tileGfx.lineStyle(2, 0x475569, 1);
          tileGfx.strokeRoundedRect(px + 2, py + 2, this.tileSize - 4, this.tileSize - 4, 3);

          tileGfx.fillStyle(0x1e293b, 0.6);
          tileGfx.fillRect(px + 4, py + this.tileSize - 6, this.tileSize - 8, 4);
        } else {
          tileGfx.fillStyle(0x1e293b, 1);
          tileGfx.fillRect(px, py, this.tileSize, this.tileSize);
          tileGfx.lineStyle(1, 0x0f172a, 0.8);
          tileGfx.strokeRect(px, py, this.tileSize, this.tileSize);

          tileGfx.fillStyle(0x334155, 0.4);
          tileGfx.fillCircle(px + this.tileSize / 2, py + this.tileSize / 2, 2);
        }

        this.tileContainer.add(tileGfx);

        // Spikes (base or tile)
        if (baseTile === 'spikes' || tile === 'spikes') {
          this.renderSpikes(x, y);
        }

        // Holes
        if (tile === 'hole') {
          this.renderHole(x, y);
        }

        // Switches
        if (baseTile === 'switch' || tile === 'switch') {
          this.renderSwitch(x, y);
        }

        // Gates
        if (baseTile === 'gate' || tile === 'gate') {
          this.renderGate(x, y);
        }

        // Spike Boots item
        if (tile === 'spike_boots') {
          const bootsGfx = this.renderSpikeBoots(x, y);
          this.spikeBootsObjects.set(`${x},${y}`, bootsGfx);
        }

        // Diamonds
        if (tile === 'diamond') {
          const diamondGfx = this.renderDiamond(x, y);
          this.diamondObjects.set(`${x},${y}`, diamondGfx);
        }

        // Exit
        if (tile === 'exit') {
          this.renderExit(x, y);
        }

        // Pushable Blocks
        if (tile === 'block') {
          const blockObj = this.renderBlock(x, y);
          this.blockObjects.set(`${x},${y}`, blockObj);
        }

        // Keys
        if (tile === 'key') {
          const keyGfx = this.renderKey(x, y);
          this.keyObjects.set(`${x},${y}`, keyGfx);
        }

        // Doors
        if (tile === 'door') {
          const doorObj = this.renderDoor(x, y);
          this.doorObjects.set(`${x},${y}`, doorObj);
        }
      }
    }

    // Boulders
    if (state.boulders) {
      for (const b of state.boulders) {
        if (!b.submerged) {
          const boulderObj = this.renderBoulder(b);
          this.boulderObjects.set(b.id, boulderObj);
        }
      }
    }

    // Player object
    this.renderPlayer(state.player.x, state.player.y);

    this.updateSwitchesAndGates();
  }

  private renderBoulder(b: BoulderState): Phaser.GameObjects.Container {
    const { x: px, y: py } = this.tileToPixel(b.x, b.y);
    const container = this.add.container(px, py);
    const radius = this.tileSize * 0.42;

    const gfx = this.add.graphics();

    // Dark drop shadow
    gfx.fillStyle(0x0f172a, 0.6);
    gfx.fillCircle(2, 3, radius);

    // Stone sphere base
    gfx.fillStyle(0x64748b, 1);
    gfx.fillCircle(0, 0, radius);

    // Highlight crescent
    gfx.fillStyle(0x94a3b8, 0.7);
    gfx.fillCircle(-radius * 0.25, -radius * 0.25, radius * 0.55);

    // Stone rim outline
    gfx.lineStyle(2, 0x334155, 1);
    gfx.strokeCircle(0, 0, radius);

    // Cracks/chiseled lines
    gfx.lineStyle(1.5, 0x1e293b, 0.8);
    gfx.beginPath();
    gfx.moveTo(-radius * 0.5, -radius * 0.1);
    gfx.lineTo(-radius * 0.1, radius * 0.1);
    gfx.lineTo(radius * 0.4, -radius * 0.3);
    gfx.moveTo(-radius * 0.1, radius * 0.1);
    gfx.lineTo(radius * 0.2, radius * 0.5);
    gfx.strokePath();

    container.add(gfx);
    this.tileContainer.add(container);
    return container;
  }

  private renderSpikes(x: number, y: number): void {
    const { x: px, y: py } = this.tileToPixel(x, y);
    const gfx = this.add.graphics();
    const size = this.tileSize * 0.8;

    // Spike base plate
    gfx.fillStyle(0x334155, 1);
    gfx.fillRoundedRect(px - size / 2, py - size / 2, size, size, 2);

    // 4 Sharp Metal Spikes
    gfx.fillStyle(0xe2e8f0, 1);
    const spikeH = size * 0.36;
    const offsets = [
      { x: -size * 0.22, y: -size * 0.22 },
      { x: size * 0.22, y: -size * 0.22 },
      { x: -size * 0.22, y: size * 0.22 },
      { x: size * 0.22, y: size * 0.22 },
    ];

    for (const off of offsets) {
      gfx.beginPath();
      gfx.moveTo(px + off.x - 4, py + off.y + 4);
      gfx.lineTo(px + off.x, py + off.y - spikeH);
      gfx.lineTo(px + off.x + 4, py + off.y + 4);
      gfx.closePath();
      gfx.fillPath();

      // Red blood/danger tip
      gfx.fillStyle(0xef4444, 1);
      gfx.fillCircle(px + off.x, py + off.y - spikeH, 1.5);
      gfx.fillStyle(0xe2e8f0, 1);
    }

    this.tileContainer.add(gfx);
  }

  private renderSpikeBoots(x: number, y: number): Phaser.GameObjects.Graphics {
    const { x: px, y: py } = this.tileToPixel(x, y);
    const gfx = this.add.graphics();
    const size = this.tileSize * 0.4;

    // Glowing aura
    gfx.fillStyle(0x38bdf8, 0.3);
    gfx.fillCircle(px, py, size * 1.5);

    // Boot shape
    gfx.fillStyle(0x0284c7, 1);
    gfx.fillRoundedRect(px - size * 0.4, py - size * 0.5, size * 0.8, size * 0.6, 2);
    gfx.fillRoundedRect(px - size * 0.6, py - size * 0.1, size * 1.2, size * 0.5, 3);

    // Armored spikes on sole
    gfx.fillStyle(0xf1f5f9, 1);
    gfx.fillCircle(px - size * 0.4, py + size * 0.45, 2);
    gfx.fillCircle(px, py + size * 0.45, 2);
    gfx.fillCircle(px + size * 0.4, py + size * 0.45, 2);

    this.tileContainer.add(gfx);

    this.tweens.add({
      targets: gfx,
      y: py - 3,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    return gfx;
  }

  private renderHole(x: number, y: number): Phaser.GameObjects.Graphics {
    const { x: px, y: py } = this.tileToPixel(x, y);
    const gfx = this.add.graphics();
    const size = this.tileSize * 0.82;

    gfx.fillStyle(0x020617, 1);
    gfx.fillRoundedRect(px - size / 2, py - size / 2, size, size, 6);

    gfx.lineStyle(2, 0x0f172a, 1);
    gfx.strokeRoundedRect(px - size / 2, py - size / 2, size, size, 6);

    gfx.lineStyle(1.5, 0x475569, 0.8);
    gfx.beginPath();
    gfx.moveTo(px - size / 2 + 3, py - size / 2 + 3);
    gfx.lineTo(px - size / 2 + 8, py - size / 2 + 6);
    gfx.moveTo(px + size / 2 - 3, py + size / 2 - 3);
    gfx.lineTo(px + size / 2 - 8, py + size / 2 - 6);
    gfx.strokePath();

    this.tileContainer.add(gfx);
    this.holeObjects.set(`${x},${y}`, gfx);
    return gfx;
  }

  private renderSwitch(x: number, y: number): void {
    const { x: px, y: py } = this.tileToPixel(x, y);
    const size = this.tileSize * 0.75;

    const baseGfx = this.add.graphics();
    baseGfx.fillStyle(0x1e293b, 1);
    baseGfx.fillRoundedRect(px - size / 2, py - size / 2, size, size, 4);
    baseGfx.lineStyle(2, 0x64748b, 1);
    baseGfx.strokeRoundedRect(px - size / 2, py - size / 2, size, size, 4);
    this.tileContainer.add(baseGfx);

    const padGfx = this.add.graphics();
    this.tileContainer.add(padGfx);

    this.switchObjects.set(`${x},${y}`, { padGfx, x, y });
  }

  private renderGate(x: number, y: number): void {
    const { x: px, y: py } = this.tileToPixel(x, y);
    const container = this.add.container(px, py);
    const w = this.tileSize * 0.88;
    const h = this.tileSize * 0.88;

    const gateGfx = this.add.graphics();

    gateGfx.fillStyle(0x334155, 1);
    gateGfx.fillRect(-w / 2, -h / 2, 4, h);
    gateGfx.fillRect(w / 2 - 4, -h / 2, 4, h);
    gateGfx.fillRect(-w / 2, -h / 2, w, 5);

    gateGfx.fillStyle(0x94a3b8, 1);
    const bars = 4;
    for (let i = 0; i < bars; i++) {
      const barX = -w / 2 + 6 + (i * (w - 12)) / (bars - 1);
      gateGfx.fillRect(barX - 2, -h / 2 + 4, 4, h - 8);

      gateGfx.beginPath();
      gateGfx.moveTo(barX - 3, h / 2 - 4);
      gateGfx.lineTo(barX, h / 2 + 2);
      gateGfx.lineTo(barX + 3, h / 2 - 4);
      gateGfx.closePath();
      gateGfx.fillPath();
    }

    container.add(gateGfx);
    this.tileContainer.add(container);
    this.gateObjects.set(`${x},${y}`, container);
  }

  private updateSwitchesAndGates(): void {
    const state = this.session.getState();
    const open = isGateOpen(state);

    for (const [, switchInfo] of this.switchObjects) {
      const { padGfx, x, y } = switchInfo;
      const { x: px, y: py } = this.tileToPixel(x, y);
      const isPressed =
        (state.player.x === x && state.player.y === y) ||
        state.grid[y][x] === 'block' ||
        (state.boulders && state.boulders.some(b => !b.submerged && b.x === x && b.y === y));

      padGfx.clear();
      const padSize = this.tileSize * 0.45;

      if (isPressed) {
        padGfx.fillStyle(0x10b981, 0.4);
        padGfx.fillCircle(px, py, padSize * 0.8);
        padGfx.fillStyle(0x34d399, 1);
        padGfx.fillRoundedRect(px - padSize / 2, py - padSize / 2, padSize, padSize, 3);
      } else {
        padGfx.fillStyle(0xd97706, 0.8);
        padGfx.fillRoundedRect(px - padSize / 2, py - padSize / 2, padSize, padSize, 3);
      }
    }

    for (const [, gateContainer] of this.gateObjects) {
      if (open) {
        gateContainer.setAlpha(0.2);
      } else {
        gateContainer.setAlpha(1.0);
      }
    }
  }

  private renderDiamond(x: number, y: number): Phaser.GameObjects.Graphics {
    const { x: px, y: py } = this.tileToPixel(x, y);
    const gfx = this.add.graphics();
    const size = this.tileSize * 0.32;

    gfx.fillStyle(0x00f0ff, 0.3);
    gfx.fillCircle(px, py, size * 1.5);

    gfx.fillStyle(0x00f0ff, 1);
    gfx.beginPath();
    gfx.moveTo(px, py - size);
    gfx.lineTo(px + size, py);
    gfx.lineTo(px, py + size);
    gfx.lineTo(px - size, py);
    gfx.closePath();
    gfx.fillPath();

    gfx.fillStyle(0xffffff, 0.8);
    gfx.beginPath();
    gfx.moveTo(px, py - size * 0.75);
    gfx.lineTo(px + size * 0.4, py);
    gfx.lineTo(px, py - size * 0.1);
    gfx.lineTo(px - size * 0.4, py);
    gfx.closePath();
    gfx.fillPath();

    this.tileContainer.add(gfx);

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

  private renderKey(x: number, y: number): Phaser.GameObjects.Graphics {
    const { x: px, y: py } = this.tileToPixel(x, y);
    const gfx = this.add.graphics();
    const r = this.tileSize * 0.16;

    gfx.fillStyle(0xfbbf24, 0.3);
    gfx.fillCircle(px, py, r * 2.2);

    gfx.lineStyle(3, 0xf59e0b, 1);
    gfx.strokeCircle(px - r * 0.8, py, r);
    gfx.lineStyle(2, 0xfde047, 1);
    gfx.strokeCircle(px - r * 0.8, py, r);

    gfx.fillStyle(0xf59e0b, 1);
    gfx.fillRect(px, py - 2.5, r * 1.8, 5);

    gfx.fillRect(px + r * 1.1, py + 2.5, 4, r * 0.8);
    gfx.fillRect(px + r * 1.5, py + 2.5, 4, r * 0.6);

    this.tileContainer.add(gfx);

    this.tweens.add({
      targets: gfx,
      y: py - 3,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    return gfx;
  }

  private renderDoor(x: number, y: number): Phaser.GameObjects.Container {
    const { x: px, y: py } = this.tileToPixel(x, y);
    const container = this.add.container(px, py);
    const w = this.tileSize * 0.82;
    const h = this.tileSize * 0.88;

    const doorGfx = this.add.graphics();
    doorGfx.fillStyle(0x475569, 1);
    doorGfx.fillRoundedRect(-w / 2, -h / 2, w, h, 4);

    doorGfx.lineStyle(2, 0x1e293b, 1);
    doorGfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 4);

    doorGfx.fillStyle(0x334155, 1);
    doorGfx.fillRect(-w / 2, -h / 3, w, 5);
    doorGfx.fillRect(-w / 2, h / 3 - 5, w, 5);

    doorGfx.fillStyle(0xd97706, 1);
    doorGfx.fillCircle(0, 0, w * 0.2);
    doorGfx.lineStyle(1.5, 0xfde047, 1);
    doorGfx.strokeCircle(0, 0, w * 0.2);

    doorGfx.fillStyle(0x0f172a, 1);
    doorGfx.fillCircle(0, -2, 3);
    doorGfx.beginPath();
    doorGfx.moveTo(-2, -2);
    doorGfx.lineTo(2, -2);
    doorGfx.lineTo(3, 4);
    doorGfx.lineTo(-3, 4);
    doorGfx.closePath();
    doorGfx.fillPath();

    container.add(doorGfx);
    this.tileContainer.add(container);

    return container;
  }

  private renderBlock(x: number, y: number): Phaser.GameObjects.Container {
    const { x: px, y: py } = this.tileToPixel(x, y);
    const container = this.add.container(px, py);
    const size = this.tileSize * 0.85;

    const blockGfx = this.add.graphics();
    blockGfx.fillStyle(0xb45309, 1);
    blockGfx.fillRoundedRect(-size / 2, -size / 2, size, size, 4);

    blockGfx.lineStyle(2, 0x78350f, 1);
    blockGfx.strokeRoundedRect(-size / 2, -size / 2, size, size, 4);

    blockGfx.lineStyle(2, 0x92400e, 0.8);
    blockGfx.beginPath();
    blockGfx.moveTo(-size / 2 + 4, -size / 2 + 4);
    blockGfx.lineTo(size / 2 - 4, size / 2 - 4);
    blockGfx.moveTo(size / 2 - 4, -size / 2 + 4);
    blockGfx.lineTo(-size / 2 + 4, size / 2 - 4);
    blockGfx.strokePath();

    blockGfx.fillStyle(0xf59e0b, 1);
    const cornerSize = size * 0.2;
    blockGfx.fillRect(-size / 2, -size / 2, cornerSize, 3);
    blockGfx.fillRect(-size / 2, -size / 2, 3, cornerSize);
    blockGfx.fillRect(size / 2 - cornerSize, -size / 2, cornerSize, 3);
    blockGfx.fillRect(size / 2 - 3, -size / 2, 3, cornerSize);
    blockGfx.fillRect(-size / 2, size / 2 - 3, cornerSize, 3);
    blockGfx.fillRect(-size / 2, size / 2 - cornerSize, 3, cornerSize);
    blockGfx.fillRect(size / 2 - cornerSize, size / 2 - 3, cornerSize, 3);
    blockGfx.fillRect(size / 2 - 3, size / 2 - cornerSize, 3, cornerSize);

    blockGfx.fillStyle(0xfde047, 1);
    blockGfx.fillCircle(0, 0, size * 0.12);

    container.add(blockGfx);
    this.tileContainer.add(container);

    return container;
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
      this.exitGlow.fillStyle(0x10b981, 0.4);
      this.exitGlow.fillCircle(0, 0, this.tileSize * 0.55);
      this.exitGlow.fillStyle(0xf59e0b, 0.3);
      this.exitGlow.fillCircle(0, 0, this.tileSize * 0.7);
    } else {
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

    body.fillStyle(0xf59e0b, 0.3);
    body.fillCircle(0, 0, radius + 4);

    body.fillStyle(0xf59e0b, 1);
    body.fillCircle(0, 0, radius);

    body.fillStyle(0x78350f, 1);
    body.fillRoundedRect(-radius * 0.8, -radius * 0.8, radius * 1.6, radius * 0.7, 3);

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

    const hudBg = this.add.graphics();
    hudBg.fillStyle(0x111827, 0.95);
    hudBg.fillRoundedRect(12, 10, width - 24, 88, 12);
    hudBg.lineStyle(1, 0x374151, 1);
    hudBg.strokeRoundedRect(12, 10, width - 24, 88, 12);

    // Level Title
    this.levelTitleText = this.add.text(24, 20, LEVELS[this.currentLevelIndex].title, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '15px',
      color: '#fcd34d',
      fontStyle: 'bold',
    });

    // Diamonds count
    this.diamondsText = this.add.text(24, 42, '💎 0 / 0', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '16px',
      color: '#38bdf8',
      fontStyle: 'bold',
    });

    // Keys count
    this.keysText = this.add.text(110, 42, '🔑 0', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '16px',
      color: '#fbbf24',
      fontStyle: 'bold',
    });

    // Spike Boots status
    this.bootsText = this.add.text(165, 42, '🥾 Boots', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '14px',
      color: '#38bdf8',
      fontStyle: 'bold',
    });

    // Moves count
    this.movesText = this.add.text(24, 66, 'Moves: 0', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '14px',
      color: '#9ca3af',
    });

    // Level Switch Button
    const lvlBtn = this.add.container(width - 235, 54);
    const lvlBg = this.add.graphics();
    lvlBg.fillStyle(0x1f2937, 1);
    lvlBg.fillRoundedRect(-30, -16, 60, 32, 6);
    const lvlText = this.add.text(0, 0, 'Levels', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '12px',
      color: '#93c5fd',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    lvlBtn.add([lvlBg, lvlText]);
    lvlBtn.setSize(60, 32);
    lvlBtn.setInteractive({ useHandCursor: true });
    lvlBtn.on('pointerdown', () => this.cycleLevel());

    // Undo Button
    const undoBtn = this.add.container(width - 145, 54);
    const undoBg = this.add.graphics();
    undoBg.fillStyle(0x374151, 1);
    undoBg.fillRoundedRect(-38, -16, 76, 32, 6);
    this.undoButtonText = this.add.text(0, 0, '↶ Undo', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '13px',
      color: '#e2e8f0',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    undoBtn.add([undoBg, this.undoButtonText]);
    undoBtn.setSize(76, 32);
    undoBtn.setInteractive({ useHandCursor: true });
    undoBtn.on('pointerdown', () => this.handleUndo());

    // Restart Button
    const restartBtn = this.add.container(width - 60, 54);
    const restartBg = this.add.graphics();
    restartBg.fillStyle(0x4b5563, 1);
    restartBg.fillRoundedRect(-38, -16, 76, 32, 6);
    const restartText = this.add.text(0, 0, '↻ Reset', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '13px',
      color: '#f87171',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    restartBtn.add([restartBg, restartText]);
    restartBtn.setSize(76, 32);
    restartBtn.setInteractive({ useHandCursor: true });
    restartBtn.on('pointerdown', () => this.handleRestart());
  }

  private cycleLevel(): void {
    if (this.isAnimating) return;
    const nextIndex = (this.currentLevelIndex + 1) % LEVELS.length;
    this.switchLevel(nextIndex);
  }

  private switchLevel(index: number): void {
    if (this.winModalContainer) {
      this.winModalContainer.destroy();
      this.winModalContainer = undefined;
    }
    if (this.loseModalContainer) {
      this.loseModalContainer.destroy();
      this.loseModalContainer = undefined;
    }
    this.loadLevel(index);
    this.renderInitialBoard();
    this.updateHUD();
  }

  private updateHUD(): void {
    const state = this.session.getState();
    this.levelTitleText.setText(LEVELS[this.currentLevelIndex].title);
    this.diamondsText.setText(`💎 ${state.collectedDiamonds} / ${state.totalDiamonds}`);
    this.keysText.setText(`🔑 ${state.keys}`);
    this.bootsText.setAlpha(state.hasSpikeBoots ? 1.0 : 0.25);
    this.movesText.setText(`Moves: ${state.moveCount}`);

    const canUndo = this.session.canUndo();
    this.undoButtonText.setAlpha(canUndo ? 1.0 : 0.4);

    this.updateExitVisual();
    this.updateSwitchesAndGates();
  }

  private setupInputHandlers(): void {
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
        } else if (key === 'l' || key === 'n') {
          this.cycleLevel();
        }
      });
    }

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

    const delta = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    }[direction];

    const targetX = prevState.player.x + delta.x;
    const targetY = prevState.player.y + delta.y;
    const isPushedBlock =
      targetX >= 0 &&
      targetX < prevState.width &&
      targetY >= 0 &&
      targetY < prevState.height &&
      prevState.grid[targetY][targetX] === 'block';

    const moveSuccessful = this.session.move(direction);
    if (!moveSuccessful) {
      this.tweens.add({
        targets: this.playerObject,
        x: this.playerObject.x + delta.x * 4,
        y: this.playerObject.y + delta.y * 4,
        duration: 50,
        yoyo: true,
        ease: 'Quad.easeInOut',
      });
      return;
    }

    const nextState = this.session.getState();
    const targetPixel = this.tileToPixel(nextState.player.x, nextState.player.y);

    this.isAnimating = true;

    // Diamond collection animation
    const diamondKey = `${nextState.player.x},${nextState.player.y}`;
    const collectedDiamondGfx = this.diamondObjects.get(diamondKey);
    if (collectedDiamondGfx) {
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

    // Spike boots pickup animation
    const bootsKey = `${nextState.player.x},${nextState.player.y}`;
    const collectedBootsGfx = this.spikeBootsObjects.get(bootsKey);
    if (collectedBootsGfx) {
      this.tweens.add({
        targets: collectedBootsGfx,
        scaleX: 1.8,
        scaleY: 1.8,
        alpha: 0,
        duration: 140,
        onComplete: () => {
          collectedBootsGfx.destroy();
          this.spikeBootsObjects.delete(bootsKey);
        },
      });
    }

    // Key collection animation
    const keyKey = `${nextState.player.x},${nextState.player.y}`;
    const collectedKeyGfx = this.keyObjects.get(keyKey);
    if (collectedKeyGfx) {
      this.tweens.add({
        targets: collectedKeyGfx,
        scaleX: 1.6,
        scaleY: 1.6,
        alpha: 0,
        duration: 120,
        onComplete: () => {
          collectedKeyGfx.destroy();
          this.keyObjects.delete(keyKey);
        },
      });
    }

    // Door unlock animation
    const doorKey = `${nextState.player.x},${nextState.player.y}`;
    const unlockedDoorContainer = this.doorObjects.get(doorKey);
    if (unlockedDoorContainer) {
      this.tweens.add({
        targets: unlockedDoorContainer,
        scaleX: 0.1,
        scaleY: 0.1,
        alpha: 0,
        duration: 130,
        onComplete: () => {
          unlockedDoorContainer.destroy();
          this.doorObjects.delete(doorKey);
        },
      });
    }

    // Block push animation
    if (isPushedBlock) {
      const beyondX = targetX + delta.x;
      const beyondY = targetY + delta.y;
      const oldBlockKey = `${targetX},${targetY}`;
      const newBlockKey = `${beyondX},${beyondY}`;
      const blockContainer = this.blockObjects.get(oldBlockKey);
      const isDroppingIntoHole = prevState.grid[beyondY][beyondX] === 'hole';

      if (blockContainer) {
        this.blockObjects.delete(oldBlockKey);
        const beyondPixel = this.tileToPixel(beyondX, beyondY);

        if (isDroppingIntoHole) {
          this.tweens.add({
            targets: blockContainer,
            x: beyondPixel.x,
            y: beyondPixel.y,
            scaleX: 0.3,
            scaleY: 0.3,
            alpha: 0,
            duration: 160,
            ease: 'Quad.easeIn',
            onComplete: () => {
              blockContainer.destroy();
            },
          });

          const holeKey = `${beyondX},${beyondY}`;
          const holeGfx = this.holeObjects.get(holeKey);
          if (holeGfx) {
            holeGfx.clear();
            const fillSize = this.tileSize * 0.78;
            holeGfx.fillStyle(0x334155, 1);
            holeGfx.fillRoundedRect(beyondPixel.x - fillSize / 2, beyondPixel.y - fillSize / 2, fillSize, fillSize, 4);
            holeGfx.lineStyle(1.5, 0x64748b, 0.9);
            holeGfx.strokeRoundedRect(beyondPixel.x - fillSize / 2, beyondPixel.y - fillSize / 2, fillSize, fillSize, 4);
          }
        } else {
          this.blockObjects.set(newBlockKey, blockContainer);
          this.tweens.add({
            targets: blockContainer,
            x: beyondPixel.x,
            y: beyondPixel.y,
            duration: 120,
            ease: 'Cubic.easeOut',
          });
        }
      }
    }

    // Boulder animation
    if (nextState.boulders) {
      for (const b of nextState.boulders) {
        const boulderContainer = this.boulderObjects.get(b.id);
        if (boulderContainer) {
          const bPixel = this.tileToPixel(b.x, b.y);
          if (b.submerged) {
            this.tweens.add({
              targets: boulderContainer,
              x: bPixel.x,
              y: bPixel.y,
              scaleX: 0.3,
              scaleY: 0.3,
              alpha: 0,
              duration: 160,
              ease: 'Quad.easeIn',
              onComplete: () => {
                boulderContainer.destroy();
                this.boulderObjects.delete(b.id);
              },
            });

            // Update hole visual to filled
            const holeKey = `${b.x},${b.y}`;
            const holeGfx = this.holeObjects.get(holeKey);
            if (holeGfx) {
              holeGfx.clear();
              const fillSize = this.tileSize * 0.78;
              holeGfx.fillStyle(0x475569, 1);
              holeGfx.fillRoundedRect(bPixel.x - fillSize / 2, bPixel.y - fillSize / 2, fillSize, fillSize, 4);
              holeGfx.lineStyle(1.5, 0x64748b, 0.9);
              holeGfx.strokeRoundedRect(bPixel.x - fillSize / 2, bPixel.y - fillSize / 2, fillSize, fillSize, 4);
            }
          } else {
            this.tweens.add({
              targets: boulderContainer,
              x: bPixel.x,
              y: bPixel.y,
              rotation: boulderContainer.rotation + 1.2,
              duration: 120,
              ease: 'Cubic.easeOut',
            });
          }
        }
      }
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
        this.updateSwitchesAndGates();
        this.updateHUD();

        if (nextState.status === 'won') {
          this.showWinModal();
        } else if (nextState.status === 'lost') {
          this.showLoseModal();
        }
      },
    });
  }

  private handleUndo(): void {
    if (this.isAnimating) return;
    if (!this.session.undo()) return;

    this.renderInitialBoard();
    this.updateHUD();

    if (this.winModalContainer) {
      this.winModalContainer.destroy();
      this.winModalContainer = undefined;
    }
    if (this.loseModalContainer) {
      this.loseModalContainer.destroy();
      this.loseModalContainer = undefined;
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
    if (this.loseModalContainer) {
      this.loseModalContainer.destroy();
      this.loseModalContainer = undefined;
    }
  }

  private showWinModal(): void {
    if (this.winModalContainer) return;

    const width = this.scale.width;
    const height = this.scale.height;
    const state = this.session.getState();
    const hasNextLevel = this.currentLevelIndex + 1 < LEVELS.length;

    this.winModalContainer = this.add.container(width / 2, height / 2);

    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x000000, 0.75);
    backdrop.fillRect(-width / 2, -height / 2, width, height);

    const card = this.add.graphics();
    card.fillStyle(0x1e293b, 1);
    card.fillRoundedRect(-180, -150, 360, 300, 16);
    card.lineStyle(3, 0xf59e0b, 1);
    card.strokeRoundedRect(-180, -150, 360, 300, 16);

    const titleText = this.add.text(0, -105, '🏆 LEVEL COMPLETE! 🏆', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '22px',
      color: '#fcd34d',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const diamondsInfo = this.add.text(0, -60, `Diamonds: 💎 ${state.collectedDiamonds} / ${state.totalDiamonds}`, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '16px',
      color: '#38bdf8',
    }).setOrigin(0.5);

    const movesInfo = this.add.text(0, -30, `Moves Taken: ${state.moveCount}`, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '16px',
      color: '#e2e8f0',
    }).setOrigin(0.5);

    const actionBtn = this.add.container(0, 35);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x10b981, 1);
    btnBg.fillRoundedRect(-95, -22, 190, 44, 10);
    btnBg.lineStyle(2, 0x34d399, 1);
    btnBg.strokeRoundedRect(-95, -22, 190, 44, 10);

    const actionTextStr = hasNextLevel ? 'Next Level ➔' : 'Play Again';
    const btnText = this.add.text(0, 0, actionTextStr, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    actionBtn.add([btnBg, btnText]);
    actionBtn.setSize(190, 44);
    actionBtn.setInteractive({ useHandCursor: true });
    actionBtn.on('pointerdown', () => {
      if (hasNextLevel) {
        this.switchLevel(this.currentLevelIndex + 1);
      } else {
        this.handleRestart();
      }
    });

    const replayBtn = this.add.container(0, 95);
    const replayBg = this.add.graphics();
    replayBg.fillStyle(0x374151, 1);
    replayBg.fillRoundedRect(-70, -16, 140, 32, 8);
    const replayText = this.add.text(0, 0, 'Replay Level', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '14px',
      color: '#94a3b8',
    }).setOrigin(0.5);
    replayBtn.add([replayBg, replayText]);
    replayBtn.setSize(140, 32);
    replayBtn.setInteractive({ useHandCursor: true });
    replayBtn.on('pointerdown', () => this.handleRestart());

    this.winModalContainer.add([backdrop, card, titleText, diamondsInfo, movesInfo, actionBtn, replayBtn]);

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

  private showLoseModal(): void {
    if (this.loseModalContainer) return;

    const width = this.scale.width;
    const height = this.scale.height;

    this.loseModalContainer = this.add.container(width / 2, height / 2);

    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x450a0a, 0.85);
    backdrop.fillRect(-width / 2, -height / 2, width, height);

    const card = this.add.graphics();
    card.fillStyle(0x18181b, 1);
    card.fillRoundedRect(-170, -130, 340, 260, 16);
    card.lineStyle(3, 0xef4444, 1);
    card.strokeRoundedRect(-170, -130, 340, 260, 16);

    const titleText = this.add.text(0, -85, '☠ DEFEAT! ☠', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '24px',
      color: '#ef4444',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const reasonText = this.add.text(0, -45, 'Pierced by deadly spikes!\nFind spike boots or avoid them.', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '14px',
      color: '#fca5a5',
      align: 'center',
    }).setOrigin(0.5);

    // Undo Button
    const undoBtn = this.add.container(0, 20);
    const undoBg = this.add.graphics();
    undoBg.fillStyle(0x0284c7, 1);
    undoBg.fillRoundedRect(-85, -20, 170, 40, 10);
    undoBg.lineStyle(2, 0x38bdf8, 1);
    undoBg.strokeRoundedRect(-85, -20, 170, 40, 10);

    const undoText = this.add.text(0, 0, '↶ Undo Move', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    undoBtn.add([undoBg, undoText]);
    undoBtn.setSize(170, 40);
    undoBtn.setInteractive({ useHandCursor: true });
    undoBtn.on('pointerdown', () => this.handleUndo());

    // Restart Button
    const restartBtn = this.add.container(0, 75);
    const restartBg = this.add.graphics();
    restartBg.fillStyle(0x374151, 1);
    restartBg.fillRoundedRect(-70, -16, 140, 32, 8);
    const restartText = this.add.text(0, 0, '↻ Restart', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '14px',
      color: '#f87171',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    restartBtn.add([restartBg, restartText]);
    restartBtn.setSize(140, 32);
    restartBtn.setInteractive({ useHandCursor: true });
    restartBtn.on('pointerdown', () => this.handleRestart());

    this.loseModalContainer.add([backdrop, card, titleText, reasonText, undoBtn, restartBtn]);

    this.loseModalContainer.setScale(0.8);
    this.loseModalContainer.setAlpha(0);
    this.tweens.add({
      targets: this.loseModalContainer,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 250,
      ease: 'Back.easeOut',
    });
  }
}
