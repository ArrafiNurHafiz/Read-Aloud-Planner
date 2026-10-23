import { announce } from './a11y.js';
import { parseVoiceSchedule } from './voice_parser.js';
import type { LocalStorageRepository, ActivityItem } from './storage.js';
import type { SpeechCoordinator } from './speech.js';

// Cross-browser SpeechRecognition typing
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export class VoiceInputController {
  private recognition: any = null;
  private isListening: boolean = false;
  private lang: string = 'id-ID';

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRec) {
        this.recognition = new SpeechRec();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = this.lang;
      }
    }
  }

  public isSupported(): boolean {
    return this.recognition !== null;
  }

  public setLanguage(lang: string) {
    this.lang = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public startListening(
    storageRepo: LocalStorageRepository,
    speechCoord: SpeechCoordinator,
    playEarconFn: (type: 'tap' | 'success' | 'warning' | 'alert') => void,
    onSuccess: (newActivity: ActivityItem) => void,
    onErrorStatus: (msg: string) => void
  ): void {
    if (!this.recognition) {
      onErrorStatus('Fitur pengenalan suara tidak didukung di peramban ini. Silakan gunakan formulir tambah kegiatan.');
      return;
    }

    if (this.isListening) {
      this.stop();
      return;
    }

    try {
      playEarconFn('tap');
      this.recognition.lang = this.lang;
      this.isListening = true;

      const captionEl = document.getElementById('speech-caption-text');
      if (captionEl) {
        captionEl.textContent = 'Mendengarkan suara... Silakan sebutkan kegiatan (contoh: "Kuliah Basis Data jam 8 pagi 2 jam di ruang 301").';
      }
      announce('Mikrofon aktif. Silakan sebutkan jadwal kegiatan Anda.', 'assertive');

      const btnVoice = document.getElementById('btn-voice-add');
      if (btnVoice) {
        btnVoice.classList.add('recording-active');
        btnVoice.setAttribute('aria-pressed', 'true');
      }

      this.recognition.onresult = (event: any) => {
        this.isListening = false;
        if (btnVoice) {
          btnVoice.classList.remove('recording-active');
          btnVoice.setAttribute('aria-pressed', 'false');
        }

        const transcript = event.results[0][0].transcript;
        if (captionEl) {
          captionEl.textContent = `Terdengar: "${transcript}". Memproses jadwal...`;
        }

        const parsed = parseVoiceSchedule(transcript);
        const newAct = storageRepo.addActivity({
          title: parsed.title,
          date: parsed.date,
          start_time: parsed.start_time,
          duration_min: parsed.duration_min,
          location: parsed.location
        });

        playEarconFn('success');
        announce(`Kegiatan ${newAct.title} berhasil ditambahkan melalui suara.`);

        // Speak confirmation
        speechCoord.speak(`Kegiatan berhasil ditambahkan. ${newAct.linear_sentence}`);
        onSuccess(newAct);
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        if (btnVoice) {
          btnVoice.classList.remove('recording-active');
          btnVoice.setAttribute('aria-pressed', 'false');
        }
        playEarconFn('alert');
        const err = event.error === 'not-allowed'
          ? 'Izin mikrofon ditolak oleh peramban.'
          : 'Suara tidak terdeteksi. Silakan coba lagi.';
        announce(err, 'assertive');
        onErrorStatus(err);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (btnVoice) {
          btnVoice.classList.remove('recording-active');
          btnVoice.setAttribute('aria-pressed', 'false');
        }
      };

      this.recognition.start();
    } catch (e) {
      this.isListening = false;
      playEarconFn('alert');
      onErrorStatus('Gagal memulai mikrofon.');
    }
  }

  public stop(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore stop error
      }
      this.isListening = false;
      const btnVoice = document.getElementById('btn-voice-add');
      if (btnVoice) {
        btnVoice.classList.remove('recording-active');
        btnVoice.setAttribute('aria-pressed', 'false');
      }
    }
  }
}
