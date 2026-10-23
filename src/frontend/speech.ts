export class SpeechCoordinator {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private rate: number = 1.0;
  private lang: string = 'id-ID';
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  public setRate(newRate: number) {
    this.rate = Math.max(0.5, Math.min(2.0, newRate));
  }

  public getRate(): number {
    return this.rate;
  }

  public setLanguage(lang: string) {
    this.lang = lang;
  }

  public getLanguage(): string {
    return this.lang;
  }

  private getBestVoice(): SpeechSynthesisVoice | null {
    if (!this.voices || this.voices.length === 0) {
      if (this.synth) {
        this.voices = this.synth.getVoices();
      }
    }
    if (!this.voices || this.voices.length === 0) return null;

    // 1. Try exact or prefix language match (e.g. id-ID or id)
    const exact = this.voices.find(
      (v) => v.lang.toLowerCase() === this.lang.toLowerCase() ||
             v.lang.toLowerCase().replace('_', '-').startsWith(this.lang.toLowerCase().substring(0, 2))
    );
    if (exact) return exact;

    // 2. If Indonesian requested but not found, try Malay (ms) which has nearly identical phonetics
    if (this.lang.startsWith('id')) {
      const ms = this.voices.find((v) => v.lang.toLowerCase().startsWith('ms'));
      if (ms) return ms;
    }

    // 3. Fallback to default system voice
    const def = this.voices.find((v) => v.default);
    if (def) return def;

    // 4. Fallback to first available voice
    return this.voices[0] || null;
  }

  public speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void
  ): boolean {
    this.stop();

    if (typeof document !== 'undefined') {
      const captionEl = document.getElementById('speech-caption-text');
      if (captionEl) {
        captionEl.textContent = text;
      }
    }

    if (!this.synth) {
      if (onStart) onStart();
      if (onEnd) onEnd();
      return false; // Fallback to visual caption
    }

    // Ensure synthesis is not in paused state
    try {
      if (this.synth.paused) {
        this.synth.resume();
      }
    } catch {
      // Ignore synthesis state errors
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.rate;
    utterance.lang = this.lang;

    const bestVoice = this.getBestVoice();
    if (bestVoice) {
      utterance.voice = bestVoice;
      utterance.lang = bestVoice.lang;
    }

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    this.currentUtterance = utterance;
    // Retain global reference to prevent garbage collection mid-speech bug in Chromium
    if (typeof window !== 'undefined') {
      (window as any).__lastSpeechUtterance = utterance;
    }

    try {
      this.synth.speak(utterance);
      // Secondary resume check for iOS/Android
      if (this.synth.paused) {
        this.synth.resume();
      }
      return true;
    } catch (err) {
      console.warn('Failed to invoke synth.speak:', err);
      if (onEnd) onEnd();
      return false;
    }
  }

  public stop() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {
        // Ignore cancel errors
      }
      this.currentUtterance = null;
    }
    if (typeof document !== 'undefined') {
      const captionEl = document.getElementById('speech-caption-text');
      if (captionEl) {
        captionEl.textContent = 'Pembacaan dihentikan.';
      }
    }
  }

  public isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }
}
