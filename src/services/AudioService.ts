import { SaveService } from './SaveService';

export type ZoneId = 'temple' | 'cave' | 'volcano';

export class AudioService {
  private static instance: AudioService;
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private bgmOscillators: OscillatorNode[] = [];
  private bgmTimer: number | null = null;
  private currentBgmZone: ZoneId | null = null;
  private unlocked: boolean = false;

  private constructor() {
    this.initContext();
  }

  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  private initContext(): void {
    if (typeof window !== 'undefined' && (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      try {
        this.ctx = new AudioCtx();
      } catch {
        this.ctx = null;
      }
    }
  }

  public unlock(): void {
    if (this.unlocked || !this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.unlocked = true;
      }).catch(() => {});
    } else {
      this.unlocked = true;
    }
  }

  private canPlaySFX(): boolean {
    if (!SaveService.isSoundEnabled()) return false;
    if (!this.ctx) return false;
    return true;
  }

  private canPlayMusic(): boolean {
    if (!SaveService.isMusicEnabled()) return false;
    if (!this.ctx) return false;
    return true;
  }

  // --- SOUND EFFECTS ---

  public playStep(): void {
    if (!this.canPlaySFX() || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.05);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playDiamond(): void {
    if (!this.canPlaySFX() || !this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [1046.5, 1318.5, 1567.98, 2093.0]; // C6, E6, G6, C7 arpeggio

    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const t = now + i * 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.22);
    });
  }

  public playKey(): void {
    if (!this.canPlaySFX() || !this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [1760, 2637];

    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = now + idx * 0.04;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.12);
    });
  }

  public playDoor(): void {
    if (!this.canPlaySFX() || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.25);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playSwitch(): void {
    if (!this.canPlaySFX() || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1320, now + 0.03);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playBlockPush(): void {
    if (!this.canPlaySFX() || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playToolStrike(): void {
    if (!this.canPlaySFX() || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playCrackedWallBreak(): void {
    if (!this.canPlaySFX() || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playBushBurn(): void {
    if (!this.canPlaySFX() || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.linearRampToValueAtTime(150, now + 0.25);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playBoulderRoll(): void {
    if (!this.canPlaySFX() || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(75, now);
    osc.frequency.linearRampToValueAtTime(55, now + 0.15);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playHazardHit(): void {
    if (!this.canPlaySFX() || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Dissonant low crunch
    [130, 138, 70].forEach(freq => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    });
  }

  public playVictory(): void {
    if (!this.canPlaySFX() || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Fanfare: C5 (523), G5 (784), C6 (1046.5), E6 (1318.5)
    const notes = [
      { f: 523.25, d: 0.1, delay: 0.0 },
      { f: 659.25, d: 0.1, delay: 0.1 },
      { f: 783.99, d: 0.1, delay: 0.2 },
      { f: 1046.5, d: 0.4, delay: 0.3 },
    ];

    notes.forEach(note => {
      if (!this.ctx) return;
      const t = now + note.delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + note.d);
    });
  }

  public playDefeat(): void {
    if (!this.canPlaySFX() || !this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [
      { f: 392.0, d: 0.15, delay: 0.0 },
      { f: 349.23, d: 0.15, delay: 0.15 },
      { f: 311.13, d: 0.15, delay: 0.3 },
      { f: 261.63, d: 0.35, delay: 0.45 },
    ];

    notes.forEach(note => {
      if (!this.ctx) return;
      const t = now + note.delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + note.d);
    });
  }

  // --- GENERATIVE BACKGROUND MUSIC PER ZONE ---

  public startZoneBGM(zone: ZoneId): void {
    if (this.currentBgmZone === zone && this.bgmOscillators.length > 0) {
      return;
    }

    this.stopZoneBGM();
    this.currentBgmZone = zone;

    if (!this.canPlayMusic() || !this.ctx) {
      return;
    }

    const now = this.ctx.currentTime;
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.setValueAtTime(0.03, now);
    this.bgmGain.connect(this.ctx.destination);

    // Zone chord drones:
    // Temple: peaceful ethereal pentatonic pad (A minor / C major: A2 110Hz, E3 164.8Hz, C4 261.6Hz)
    // Cave: subterranean crystalline hum (D2 73.4Hz, A2 110Hz, F3 174.6Hz)
    // Volcano: warm deep magma pulse (F1 43.6Hz, C2 65.4Hz, G#2 103.8Hz)
    const chords: Record<ZoneId, number[]> = {
      temple: [110, 164.81, 261.63],
      cave: [73.42, 110.0, 174.61],
      volcano: [43.65, 65.41, 103.83],
    };

    const freqs = chords[zone] || chords.temple;

    this.bgmOscillators = freqs.map((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.connect(this.bgmGain!);
      osc.start(now);
      return osc;
    });
  }

  public stopZoneBGM(): void {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }

    if (this.bgmOscillators.length > 0) {
      for (const osc of this.bgmOscillators) {
        try {
          osc.stop();
          osc.disconnect();
        } catch {}
      }
      this.bgmOscillators = [];
    }

    if (this.bgmGain) {
      try {
        this.bgmGain.disconnect();
      } catch {}
      this.bgmGain = null;
    }

    this.currentBgmZone = null;
  }

  public updateMusicState(): void {
    if (SaveService.isMusicEnabled()) {
      if (this.currentBgmZone) {
        const zone = this.currentBgmZone;
        this.stopZoneBGM();
        this.startZoneBGM(zone);
      }
    } else {
      this.stopZoneBGM();
    }
  }
}
