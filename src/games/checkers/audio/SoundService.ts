/**
 * Lightweight WebAudio sound service for checkers events.
 *
 * Synthesizes short tones programmatically — no audio file dependencies.
 * Distinct tones for move, capture, chain-continue, crown, and game-over.
 */

/** Available sound event types */
export type CheckersSound = 'move' | 'capture' | 'chain' | 'crown' | 'gameOver' | 'select';

interface SoundConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  gain: number;
}

const SOUND_CONFIGS: Record<CheckersSound, SoundConfig> = {
  select: { frequency: 660, duration: 0.04, type: 'sine', gain: 0.08 },
  move: { frequency: 440, duration: 0.08, type: 'triangle', gain: 0.12 },
  capture: { frequency: 260, duration: 0.15, type: 'square', gain: 0.1 },
  chain: { frequency: 520, duration: 0.1, type: 'triangle', gain: 0.1 },
  crown: { frequency: 880, duration: 0.25, type: 'sine', gain: 0.12 },
  gameOver: { frequency: 196, duration: 0.6, type: 'sine', gain: 0.15 },
};

class CheckersSoundServiceImpl {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    if (typeof window === 'undefined') return null;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      return this.ctx;
    } catch {
      return null;
    }
  }

  /** Play a short tone for the given checkers event */
  play(sound: CheckersSound): void {
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

/** Shared singleton sound service for checkers */
export const CheckersSoundService = new CheckersSoundServiceImpl();
