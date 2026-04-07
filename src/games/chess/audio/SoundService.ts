/**
 * Lightweight WebAudio sound service for chess events.
 *
 * Synthesizes short tones programmatically — no audio file dependencies.
 * Each event uses a distinct frequency and envelope for clear feedback.
 */

/** Available sound event types */
export type ChessSound = 'move' | 'capture' | 'check' | 'gameOver' | 'select';

interface SoundConfig {
  /** Oscillator frequency in Hz */
  frequency: number;
  /** Total duration in seconds */
  duration: number;
  /** Oscillator wave shape */
  type: OscillatorType;
  /** Peak gain (0..1) */
  gain: number;
}

/** Sound configuration per event type */
const SOUND_CONFIGS: Record<ChessSound, SoundConfig> = {
  select: { frequency: 660, duration: 0.04, type: 'sine', gain: 0.08 },
  move: { frequency: 440, duration: 0.08, type: 'triangle', gain: 0.12 },
  capture: { frequency: 220, duration: 0.18, type: 'square', gain: 0.1 },
  check: { frequency: 880, duration: 0.22, type: 'sawtooth', gain: 0.1 },
  gameOver: { frequency: 196, duration: 0.6, type: 'sine', gain: 0.15 },
};

/**
 * Singleton WebAudio service that plays short synthesized tones for chess events.
 *
 * Uses a single shared AudioContext that lazily initializes on first user interaction
 * (browsers block AudioContext until a user gesture has occurred).
 */
class SoundServiceImpl {
  private ctx: AudioContext | null = null;

  /** Lazily get or create the AudioContext */
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

  /**
   * Play a short tone for the given chess event.
   *
   * Silently no-ops if WebAudio is unavailable or context creation fails.
   *
   * @param sound - Event type to play
   */
  play(sound: ChessSound): void {
    const ctx = this.getContext();
    if (!ctx) return;

    // Resume context if it was suspended (autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const cfg = SOUND_CONFIGS[sound];
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = cfg.type;
    osc.frequency.setValueAtTime(cfg.frequency, now);

    // Quick attack, exponential decay envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(cfg.gain, now + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + cfg.duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + cfg.duration);
  }
}

/** Shared singleton sound service instance */
export const SoundService = new SoundServiceImpl();
