/**
 * High-Performance, Mobile & PWA Compatible Sound Service
 * - Solves mobile/PWA autoplay audio restrictions via global gesture unlock
 * - Dual-engine chime: Web Audio API synthesis + Standalone Base64 WAV fallback
 * - Plays crisply on Desktop, iOS Safari, Android Chrome, and installed PWA
 */

// Self-contained, lightweight offline Base64 WAV chime (160ms, dual-tone 1760Hz -> 2637Hz)
const SCAN_CHIME_BASE64 =
  'data:audio/wav;base64,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';

class SoundService {
  private ctx: AudioContext | null = null;
  private fallbackAudio: HTMLAudioElement | null = null;
  private isUnlocked = false;

  constructor() {
    this.registerGlobalUnlocker();
  }

  /**
   * Automatically unlocks Web Audio context and HTML5 Audio upon the very first user interaction
   * Crucial for Mobile Safari, Chrome Android, and Installed PWA standalone mode.
   */
  private registerGlobalUnlocker() {
    if (typeof window === 'undefined') return;

    const unlockHandler = () => {
      this.unlock();
      window.removeEventListener('click', unlockHandler);
      window.removeEventListener('touchstart', unlockHandler);
      window.removeEventListener('touchend', unlockHandler);
      window.removeEventListener('pointerdown', unlockHandler);
      window.removeEventListener('keydown', unlockHandler);
    };

    window.addEventListener('click', unlockHandler, { passive: true, once: true });
    window.addEventListener('touchstart', unlockHandler, { passive: true, once: true });
    window.addEventListener('touchend', unlockHandler, { passive: true, once: true });
    window.addEventListener('pointerdown', unlockHandler, { passive: true, once: true });
    window.addEventListener('keydown', unlockHandler, { passive: true, once: true });
  }

  /**
   * Explicitly unlock audio context & prime HTML5 audio
   */
  public unlock() {
    if (typeof window === 'undefined' || this.isUnlocked) return;

    try {
      const ctx = this.getContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        // Play an imperceptible 1-sample silent buffer to awaken iOS Web Audio pipeline
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      }

      // Prime HTML5 fallback audio element
      if (!this.fallbackAudio) {
        this.fallbackAudio = new Audio(SCAN_CHIME_BASE64);
        this.fallbackAudio.volume = 0.01;
        this.fallbackAudio
          .play()
          .then(() => {
            if (this.fallbackAudio) {
              this.fallbackAudio.pause();
              this.fallbackAudio.currentTime = 0;
              this.fallbackAudio.volume = 1.0;
            }
          })
          .catch(() => {});
      }

      this.isUnlocked = true;
    } catch {
      // Ignored
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Ultra-HD Scan Success Confirmation Sound
   * - Synthesizes a crisp, pleasant 2-tone melodic chime (1760Hz -> 2637Hz)
   * - Seamlessly falls back to HTML5 Base64 audio if Web Audio is muted/suspended
   */
  public playScanSuccess() {
    let played = false;

    try {
      const ctx = this.getContext();
      if (ctx && ctx.state !== 'suspended') {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // 2-tone chime: High A (1760Hz) ramping to High E (2637Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1760, now);
        osc.frequency.setValueAtTime(2637, now + 0.05);

        // Smooth acoustic envelope
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.45, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.16);
        played = true;
      }
    } catch {
      played = false;
    }

    // Fallback: If Web Audio did not execute, trigger HTML5 Audio element
    if (!played) {
      try {
        if (!this.fallbackAudio) {
          this.fallbackAudio = new Audio(SCAN_CHIME_BASE64);
        }
        this.fallbackAudio.volume = 1.0;
        this.fallbackAudio.currentTime = 0;
        this.fallbackAudio.play().catch(() => {});
      } catch {
        // Audio playback restricted
      }
    }

    // Trigger complementary mobile haptic pulse
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([40, 20, 60]);
      } catch {
        // Vibration not supported
      }
    }
  }

  /**
   * Subtle Focus / Tap Tick
   */
  public playFocusClick() {
    try {
      const ctx = this.getContext();
      if (!ctx || ctx.state === 'suspended') return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(900, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Audio playback error
    }
  }
}

export const sound = new SoundService();
