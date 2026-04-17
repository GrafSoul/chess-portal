/**
 * Lightweight WebAudio sound service for Go events.
 *
 * Mirrors the checkers service — short programmatic tones, no file deps.
 * Distinct profiles for placement, capture, pass, rejection, and game end.
 */

/** Available Go sound events. */
export type GoSound = 'place' | 'capture' | 'pass' | 'reject' | 'gameOver';

interface SoundConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  gain: number;
}

/** Per-event oscillator configuration. */
const SOUND_CONFIGS: Record<GoSound, SoundConfig> = {
  place: { frequency: 540, duration: 0.07, type: 'triangle', gain: 0.12 },
  capture: { frequency: 220, duration: 0.16, type: 'square', gain: 0.12 },
  pass: { frequency: 360, duration: 0.1, type: 'sine', gain: 0.09 },
  reject: { frequency: 160, duration: 0.18, type: 'sawtooth', gain: 0.09 },
  gameOver: { frequency: 196, duration: 0.6, type: 'sine', gain: 0.15 },
};

class GoSoundServiceImpl {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    if (typeof window === 'undefined') return null;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AudioCtx();
      return this.ctx;
    } catch {
      return null;
    }
  }

  /** Play a short tone for the given Go event. */
  play(sound: GoSound): void {
    const ctx = this.getContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const cfg = SOUND_CONFIGS[sound];
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = cfg.type;
    osc.frequency.setValueAtTime(cfg.frequency, now);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(cfg.gain, now + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + cfg.duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + cfg.duration);
  }
}

/** Shared singleton for Go sound playback. */
export const GoSoundService = new GoSoundServiceImpl();
