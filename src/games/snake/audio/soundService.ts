export class SoundService {
  private static instance: SoundService;
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private unlocked: boolean = false;

  private constructor() {
    this.soundEnabled = localStorage.getItem('nokia_snake_sound') !== 'false';
  }

  public static getInstance(): SoundService {
    if (!SoundService.instance) {
      SoundService.instance = new SoundService();
    }
    return SoundService.instance;
  }

  public unlock(): void {
    if (this.unlocked) return;
    if (typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!this.ctx) {
          try {
            this.ctx = new AudioCtx();
          } catch {}
        }
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().then(() => {
            this.unlocked = true;
          }).catch(() => {});
        } else if (this.ctx) {
          this.unlocked = true;
        }
      }
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('nokia_snake_sound', String(this.soundEnabled));
    return this.soundEnabled;
  }

  private canPlay(): boolean {
    return this.soundEnabled && this.ctx !== null && this.unlocked;
  }

  public playEat(): void {
    if (!this.canPlay() || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.04); // E6

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playBugSpawn(): void {
    if (!this.canPlay() || !this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [659.25, 880, 1046.5]; // E5, A5, C6

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = now + idx * 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.08);
    });
  }

  public playBugEat(): void {
    if (!this.canPlay() || !this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [1046.5, 1318.5, 1567.98, 2093]; // C6, E6, G6, C7 arpeggio

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = now + idx * 0.04;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.1);
    });
  }

  public playDie(): void {
    if (!this.canPlay() || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(45, now + 0.35);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }
}
