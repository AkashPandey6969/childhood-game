import { StarThresholds } from '../services/SaveService';
import level1Raw from './level1.txt?raw';
import level2Raw from './level2_block.txt?raw';
import level3Raw from './level3_key_door.txt?raw';
import level4Raw from './level4_switch_gate.txt?raw';
import level5Raw from './level5_hole.txt?raw';
import level6Raw from './level6_spikes.txt?raw';
import level7Raw from './level7_boulder.txt?raw';
import level8Raw from './level8_enemy.txt?raw';
import level9Raw from './level9_tools.txt?raw';
import level10Raw from './level10_depths.txt?raw';
import level11Raw from './level11_molten.txt?raw';
import level12Raw from './level12_patrol.txt?raw';
import level13Raw from './level13_seismic.txt?raw';
import level14Raw from './level14_crucible.txt?raw';
import level15Raw from './level15_master.txt?raw';
import level16Raw from './level16_labyrinth.txt?raw';
import level17Raw from './level17_gauntlet.txt?raw';
import level18Raw from './level18_magma_vault.txt?raw';
import level19Raw from './level19_inferno.txt?raw';
import level20Raw from './level20_apex.txt?raw';

export type ZoneThemeId = 'temple' | 'cave' | 'volcano';

export interface ZoneTheme {
  id: ZoneThemeId;
  name: string;
  bgGradientTop: number;
  bgGradientBottom: number;
  wallFill: number;
  wallBorder: number;
  floorFill: number;
  floorDot: number;
  accentColor: string;
}

export const ZONE_THEMES: Record<ZoneThemeId, ZoneTheme> = {
  temple: {
    id: 'temple',
    name: 'Ancient Temple',
    bgGradientTop: 0x0f172a,
    bgGradientBottom: 0x064e3b,
    wallFill: 0x1e293b,
    wallBorder: 0x10b981,
    floorFill: 0x0f172a,
    floorDot: 0x047857,
    accentColor: '#10b981',
  },
  cave: {
    id: 'cave',
    name: 'Crystal Cavern',
    bgGradientTop: 0x0f172a,
    bgGradientBottom: 0x082f49,
    wallFill: 0x1e293b,
    wallBorder: 0x0284c7,
    floorFill: 0x0b1329,
    floorDot: 0x38bdf8,
    accentColor: '#38bdf8',
  },
  volcano: {
    id: 'volcano',
    name: 'Magma Core',
    bgGradientTop: 0x18181b,
    bgGradientBottom: 0x450a0a,
    wallFill: 0x27272a,
    wallBorder: 0xd97706,
    floorFill: 0x18181b,
    floorDot: 0xef4444,
    accentColor: '#f97316',
  },
};

export interface LevelManifestEntry {
  id: string;
  number: number;
  title: string;
  zone: ZoneThemeId;
  raw: string;
  thresholds: StarThresholds;
}

export const LEVELS_MANIFEST: LevelManifestEntry[] = [
  {
    id: 'level1',
    number: 1,
    title: 'The Descent',
    zone: 'temple',
    raw: level1Raw,
    thresholds: { threeStars: 24, twoStars: 28 },
  },
  {
    id: 'level2',
    number: 2,
    title: 'Pushable Blocks',
    zone: 'temple',
    raw: level2Raw,
    thresholds: { threeStars: 13, twoStars: 17 },
  },
  {
    id: 'level3',
    number: 3,
    title: 'Keys & Locked Doors',
    zone: 'temple',
    raw: level3Raw,
    thresholds: { threeStars: 17, twoStars: 21 },
  },
  {
    id: 'level4',
    number: 4,
    title: 'Switches & Gates',
    zone: 'temple',
    raw: level4Raw,
    thresholds: { threeStars: 12, twoStars: 16 },
  },
  {
    id: 'level5',
    number: 5,
    title: 'Chasms & Holes',
    zone: 'temple',
    raw: level5Raw,
    thresholds: { threeStars: 14, twoStars: 18 },
  },
  {
    id: 'level6',
    number: 6,
    title: 'Deadly Spikes',
    zone: 'cave',
    raw: level6Raw,
    thresholds: { threeStars: 12, twoStars: 16 },
  },
  {
    id: 'level7',
    number: 7,
    title: 'Rolling Boulders',
    zone: 'cave',
    raw: level7Raw,
    thresholds: { threeStars: 8, twoStars: 12 },
  },
  {
    id: 'level8',
    number: 8,
    title: 'Patrolling Beasts',
    zone: 'cave',
    raw: level8Raw,
    thresholds: { threeStars: 16, twoStars: 20 },
  },
  {
    id: 'level9',
    number: 9,
    title: "Explorer's Tools",
    zone: 'cave',
    raw: level9Raw,
    thresholds: { threeStars: 15, twoStars: 19 },
  },
  {
    id: 'level10',
    number: 10,
    title: 'Echoing Depths',
    zone: 'cave',
    raw: level10Raw,
    thresholds: { threeStars: 24, twoStars: 28 },
  },
  {
    id: 'level11',
    number: 11,
    title: 'Molten Chamber',
    zone: 'volcano',
    raw: level11Raw,
    thresholds: { threeStars: 12, twoStars: 16 },
  },
  {
    id: 'level12',
    number: 12,
    title: 'Lava Patrol',
    zone: 'volcano',
    raw: level12Raw,
    thresholds: { threeStars: 24, twoStars: 28 },
  },
  {
    id: 'level13',
    number: 13,
    title: 'Seismic Puzzle',
    zone: 'volcano',
    raw: level13Raw,
    thresholds: { threeStars: 22, twoStars: 26 },
  },
  {
    id: 'level14',
    number: 14,
    title: 'The Crucible',
    zone: 'volcano',
    raw: level14Raw,
    thresholds: { threeStars: 26, twoStars: 30 },
  },
  {
    id: 'level15',
    number: 15,
    title: 'Heart of the Core',
    zone: 'volcano',
    raw: level15Raw,
    thresholds: { threeStars: 22, twoStars: 26 },
  },
  {
    id: 'level16',
    number: 16,
    title: 'Crystal Labyrinth',
    zone: 'cave',
    raw: level16Raw,
    thresholds: { threeStars: 30, twoStars: 34 },
  },
  {
    id: 'level17',
    number: 17,
    title: 'The Spiked Gauntlet',
    zone: 'cave',
    raw: level17Raw,
    thresholds: { threeStars: 26, twoStars: 30 },
  },
  {
    id: 'level18',
    number: 18,
    title: 'Magma Vault',
    zone: 'volcano',
    raw: level18Raw,
    thresholds: { threeStars: 22, twoStars: 26 },
  },
  {
    id: 'level19',
    number: 19,
    title: 'Infernal Clockwork',
    zone: 'volcano',
    raw: level19Raw,
    thresholds: { threeStars: 25, twoStars: 29 },
  },
  {
    id: 'level20',
    number: 20,
    title: 'The Obsidian Citadel',
    zone: 'volcano',
    raw: level20Raw,
    thresholds: { threeStars: 24, twoStars: 28 },
  },
];

export function getLevelEntry(idOrIndex: string | number): LevelManifestEntry | undefined {
  if (typeof idOrIndex === 'number') {
    return LEVELS_MANIFEST[idOrIndex];
  }
  return LEVELS_MANIFEST.find(l => l.id === idOrIndex);
}

export function getNextLevelEntry(currentId: string): LevelManifestEntry | undefined {
  const currentIndex = LEVELS_MANIFEST.findIndex(l => l.id === currentId);
  if (currentIndex >= 0 && currentIndex < LEVELS_MANIFEST.length - 1) {
    return LEVELS_MANIFEST[currentIndex + 1];
  }
  return undefined;
}
