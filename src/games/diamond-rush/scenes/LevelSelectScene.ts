import Phaser from 'phaser';
import { SaveService } from '../services/SaveService';
import { LEVELS_MANIFEST, ZONE_THEMES } from '../levels/manifest';

export class LevelSelectScene extends Phaser.Scene {
  private scrollContainer!: Phaser.GameObjects.Container;
  private currentZoneFilter: 'all' | 'temple' | 'cave' | 'volcano' = 'all';
  private filterButtons: Map<string, { bg: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text }> = new Map();
  private maxScrollY: number = 0;
  private minScrollY: number = 0;
  private isDragging: boolean = false;
  private startPointerY: number = 0;
  private startScrollY: number = 0;

  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0f1d, 0x0a0f1d, 0x030712, 0x030712, 1);
    bg.fillRect(0, 0, width, height);

    // Scrollable container for cards
    this.scrollContainer = this.add.container(0, 0);

    // Top Header Bar
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x0f172a, 0.95);
    headerBg.fillRect(0, 0, width, 110);
    headerBg.lineStyle(1, 0x1e293b, 1);
    headerBg.beginPath();
    headerBg.moveTo(0, 110);
    headerBg.lineTo(width, 110);
    headerBg.strokePath();

    // Back Button
    const backBtn = this.add.container(48, 35);
    const backBg = this.add.graphics();
    backBg.fillStyle(0x1e293b, 1);
    backBg.fillRoundedRect(-32, -16, 64, 32, 6);
    const backText = this.add.text(0, 0, '⬅ Back', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '12px',
      color: '#cbd5e1',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    backBtn.add([backBg, backText]);
    backBtn.setSize(64, 32);
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));

    // Title
    this.add.text(width / 2, 35, 'SELECT LEVEL', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '18px',
      color: '#f8fafc',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Total Stars Count
    let totalEarnedStars = 0;
    const maxPossibleStars = LEVELS_MANIFEST.length * 3;
    for (const lvl of LEVELS_MANIFEST) {
      totalEarnedStars += SaveService.getLevelProgress(lvl.id).stars;
    }

    const starPill = this.add.container(width - 55, 35);
    const starPillBg = this.add.graphics();
    starPillBg.fillStyle(0x1e293b, 1);
    starPillBg.fillRoundedRect(-40, -14, 80, 28, 14);
    starPillBg.lineStyle(1, 0xfbbf24, 0.6);
    starPillBg.strokeRoundedRect(-40, -14, 80, 28, 14);

    const starText = this.add.text(0, 0, `★ ${totalEarnedStars}/${maxPossibleStars}`, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '12px',
      color: '#fbbf24',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    starPill.add([starPillBg, starText]);

    // Zone Filter Bar
    this.createZoneFilterTabs(width);

    // Render Grid of Level Cards
    this.renderLevelGrid(width);

    // Setup Drag & Wheel Scroll
    this.setupScrolling();
  }

  private createZoneFilterTabs(width: number): void {
    const tabs: { id: 'all' | 'temple' | 'cave' | 'volcano'; label: string }[] = [
      { id: 'all', label: 'ALL (20)' },
      { id: 'temple', label: 'TEMPLE' },
      { id: 'cave', label: 'CAVERN' },
      { id: 'volcano', label: 'MAGMA' },
    ];

    const tabW = 100;
    const startX = width / 2 - (tabs.length * tabW) / 2 + tabW / 2;
    const tabY = 82;

    tabs.forEach((tab, idx) => {
      const x = startX + idx * tabW;
      const tabContainer = this.add.container(x, tabY);

      const tabBg = this.add.graphics();
      const tabText = this.add.text(0, 0, tab.label, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#94a3b8',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      tabContainer.add([tabBg, tabText]);
      tabContainer.setSize(tabW - 8, 26);
      tabContainer.setInteractive({ useHandCursor: true });

      this.filterButtons.set(tab.id, { bg: tabBg, text: tabText });

      tabContainer.on('pointerdown', () => {
        this.currentZoneFilter = tab.id;
        this.updateFilterButtons();
        this.scrollContainer.y = 0;
        this.renderLevelGrid(width);
      });
    });

    this.updateFilterButtons();
  }

  private updateFilterButtons(): void {
    this.filterButtons.forEach((btn, id) => {
      const active = id === this.currentZoneFilter;
      btn.bg.clear();
      if (active) {
        btn.bg.fillStyle(0x2563eb, 1);
        btn.bg.fillRoundedRect(-45, -13, 90, 26, 6);
        btn.text.setColor('#ffffff');
      } else {
        btn.bg.fillStyle(0x1e293b, 0.8);
        btn.bg.fillRoundedRect(-45, -13, 90, 26, 6);
        btn.text.setColor('#94a3b8');
      }
    });
  }

  private setupScrolling(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y >= 110) {
        this.isDragging = true;
        this.startPointerY = pointer.y;
        this.startScrollY = this.scrollContainer.y;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging && pointer.isDown) {
        const delta = pointer.y - this.startPointerY;
        this.scrollContainer.y = Phaser.Math.Clamp(
          this.startScrollY + delta,
          this.minScrollY,
          this.maxScrollY
        );
      }
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });

    this.input.on('wheel', (_pointer: any, _gameObjects: any, _deltaX: number, deltaY: number) => {
      this.scrollContainer.y = Phaser.Math.Clamp(
        this.scrollContainer.y - deltaY * 0.6,
        this.minScrollY,
        this.maxScrollY
      );
    });
  }

  private renderLevelGrid(width: number): void {
    this.scrollContainer.removeAll(true);

    const cols = 3;
    const cardWidth = 124;
    const cardHeight = 150;
    const startX = (width - (cols * cardWidth + (cols - 1) * 16)) / 2 + cardWidth / 2;
    const startY = 195;

    const filtered = LEVELS_MANIFEST.filter(l => {
      if (this.currentZoneFilter === 'all') return true;
      return l.zone === this.currentZoneFilter;
    });

    filtered.forEach((lvl, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * (cardWidth + 16);
      const y = startY + row * (cardHeight + 20);

      const progress = SaveService.getLevelProgress(lvl.id);
      const zoneTheme = ZONE_THEMES[lvl.zone];

      const card = this.createLevelCard(x, y, cardWidth, cardHeight, lvl, progress, zoneTheme);
      this.scrollContainer.add(card);
    });

    const totalRows = Math.ceil(filtered.length / cols);
    const totalContentHeight = startY + totalRows * (cardHeight + 20) + 40;
    const visibleAreaHeight = this.scale.height;

    this.minScrollY = totalContentHeight > visibleAreaHeight ? visibleAreaHeight - totalContentHeight : 0;
    this.maxScrollY = 0;
  }

  private createLevelCard(
    x: number,
    y: number,
    w: number,
    h: number,
    level: typeof LEVELS_MANIFEST[0],
    progress: ReturnType<typeof SaveService.getLevelProgress>,
    zone: typeof ZONE_THEMES[keyof typeof ZONE_THEMES]
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    if (progress.unlocked) {
      bg.fillStyle(0x1e293b, 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      bg.lineStyle(1.5, zone.wallBorder, 0.7);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    } else {
      bg.fillStyle(0x0f172a, 0.6);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      bg.lineStyle(1, 0x334155, 0.4);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    }
    container.add(bg);

    // Zone Badge Header
    const badge = this.add.graphics();
    badge.fillStyle(progress.unlocked ? zone.floorDot : 0x334155, 0.3);
    badge.fillRoundedRect(-w / 2 + 4, -h / 2 + 4, w - 8, 20, 6);
    container.add(badge);

    const zoneText = this.add.text(0, -h / 2 + 14, zone.name.toUpperCase(), {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: progress.unlocked ? zone.accentColor : '#64748b',
      fontStyle: 'bold',
      letterSpacing: 1,
    }).setOrigin(0.5);
    container.add(zoneText);

    if (progress.unlocked) {
      // Level Number
      const numText = this.add.text(0, -14, `${level.number < 10 ? '0' : ''}${level.number}`, {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '28px',
        color: '#f8fafc',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(numText);

      // Level Title
      const titleText = this.add.text(0, 16, level.title, {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '10px',
        color: '#94a3b8',
        align: 'center',
        wordWrap: { width: w - 12 },
      }).setOrigin(0.5);
      container.add(titleText);

      // 3 Stars Display
      const starsContainer = this.add.container(0, 42);
      for (let s = 1; s <= 3; s++) {
        const starChar = s <= progress.stars ? '★' : '☆';
        const starColor = s <= progress.stars ? '#fbbf24' : '#475569';
        const star = this.add.text((s - 2) * 18, 0, starChar, {
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '16px',
          color: starColor,
          fontStyle: 'bold',
        }).setOrigin(0.5);
        starsContainer.add(star);
      }
      container.add(starsContainer);

      // Best Moves / Completed label
      const movesLabel = progress.bestMoves !== null
        ? `${progress.bestMoves} moves`
        : 'Not played';
      const movesText = this.add.text(0, 60, movesLabel, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: progress.completed ? '#38bdf8' : '#64748b',
      }).setOrigin(0.5);
      container.add(movesText);

      // Interactivity
      container.setSize(w, h);
      container.setInteractive({ useHandCursor: true });

      container.on('pointerover', () => {
        container.setScale(1.05);
      });
      container.on('pointerout', () => {
        container.setScale(1.0);
      });
      container.on('pointerdown', () => {
        container.setScale(0.96);
        this.time.delayedCall(80, () => {
          this.scene.start('GameScene', { levelId: level.id });
        });
      });
    } else {
      // Locked state
      const lockIcon = this.add.text(0, -6, '🔒', {
        fontSize: '28px',
      }).setOrigin(0.5);
      container.add(lockIcon);

      const lockedText = this.add.text(0, 32, 'LOCKED', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#475569',
        fontStyle: 'bold',
        letterSpacing: 1,
      }).setOrigin(0.5);
      container.add(lockedText);
    }

    return container;
  }
}
