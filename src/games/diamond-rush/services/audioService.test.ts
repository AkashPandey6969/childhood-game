import { describe, expect, it } from 'vitest';
import { AudioService } from './AudioService';
import { SaveService } from './SaveService';

describe('AudioService (Web Audio Sound & Music)', () => {
  it('instantiates AudioService as a singleton', () => {
    const a1 = AudioService.getInstance();
    const a2 = AudioService.getInstance();
    expect(a1).toBe(a2);
  });

  it('safely handles audio triggers when AudioContext is absent or in test environment', () => {
    const audio = AudioService.getInstance();

    // Calling SFX methods in test environment does not throw
    expect(() => {
      audio.playStep();
      audio.playDiamond();
      audio.playKey();
      audio.playDoor();
      audio.playSwitch();
      audio.playBlockPush();
      audio.playToolStrike();
      audio.playCrackedWallBreak();
      audio.playBushBurn();
      audio.playBoulderRoll();
      audio.playHazardHit();
      audio.playVictory();
      audio.playDefeat();
    }).not.toThrow();
  });

  it('safely handles zone BGM lifecycle without crashing in node', () => {
    const audio = AudioService.getInstance();
    expect(() => {
      audio.startZoneBGM('temple');
      audio.startZoneBGM('cave');
      audio.startZoneBGM('volcano');
      audio.updateMusicState();
      audio.stopZoneBGM();
    }).not.toThrow();
  });

  it('respects SaveService sound and music toggles', () => {
    SaveService.setSoundEnabled(false);
    expect(SaveService.isSoundEnabled()).toBe(false);

    SaveService.setSoundEnabled(true);
    expect(SaveService.isSoundEnabled()).toBe(true);

    SaveService.setMusicEnabled(false);
    expect(SaveService.isMusicEnabled()).toBe(false);

    SaveService.setMusicEnabled(true);
    expect(SaveService.isMusicEnabled()).toBe(true);
  });
});
