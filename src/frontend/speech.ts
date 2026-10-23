export class SpeechCoordinator {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private rate: number = 1.0;
  private lang: string = 'id-ID';

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
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

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.rate;
    utterance.lang = this.lang;

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
    return true;
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
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
