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
  private lang: string = 'en-US';

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
    onErrorStatus: (msg: string) => void,
    langCode: 'en' | 'id' = 'en'
  ): void {
    const isEn = langCode === 'en';

    if (!this.recognition) {
      const notSupportedMsg = isEn
        ? 'Speech recognition is not supported in this browser. Please use manual input form.'
        : 'Fitur pengenalan suara tidak didukung di peramban ini. Silakan gunakan formulir tambah kegiatan.';
      onErrorStatus(notSupportedMsg);
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
        captionEl.textContent = isEn
          ? 'Listening for speech... Please say your task (e.g., "Database lecture tomorrow at 9 AM for 2 hours in room 301").'
          : 'Mendengarkan suara... Silakan sebutkan kegiatan (contoh: "Kuliah Basis Data jam 8 pagi 2 jam di ruang 301").';
      }
      announce(isEn ? 'Microphone active. Please speak your schedule naturally.' : 'Mikrofon aktif. Silakan sebutkan jadwal kegiatan Anda.', 'assertive');

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
          captionEl.textContent = isEn
            ? `Heard: "${transcript}". Processing schedule...`
            : `Terdengar: "${transcript}". Memproses jadwal...`;
        }

        const parsed = parseVoiceSchedule(transcript, new Date(), langCode);
        const newAct = storageRepo.addActivity({
          title: parsed.title,
          date: parsed.date,
          start_time: parsed.start_time,
          duration_min: parsed.duration_min,
          location: parsed.location
        }, langCode);

        playEarconFn('success');
        announce(isEn ? `Task ${newAct.title} added successfully via voice.` : `Kegiatan ${newAct.title} berhasil ditambahkan melalui suara.`);

        // Speak audio confirmation
        speechCoord.speak(isEn ? `Task added successfully. ${newAct.linear_sentence}` : `Kegiatan berhasil ditambahkan. ${newAct.linear_sentence}`);
        onSuccess(newAct);
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        if (btnVoice) {
          btnVoice.classList.remove('recording-active');
          btnVoice.setAttribute('aria-pressed', 'false');
        }
        playEarconFn('alert');
        let err = isEn ? 'No speech was detected. Please try again.' : 'Suara tidak terdeteksi. Silakan coba lagi.';
        if (event.error === 'not-allowed') {
          err = isEn ? 'Microphone permission was denied by browser.' : 'Izin mikrofon ditolak oleh peramban.';
        }
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
    } catch {
      this.isListening = false;
      playEarconFn('alert');
      onErrorStatus(isEn ? 'Failed to start microphone.' : 'Gagal memulai mikrofon.');
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
