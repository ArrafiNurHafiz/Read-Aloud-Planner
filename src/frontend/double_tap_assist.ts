export function getAccessibleDescription(el: HTMLElement, lang: 'id' | 'en' = 'en'): string {
  const id = el.id || '';
  const text = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ');
  const ariaLabel = el.getAttribute('aria-label') || '';
  const tagName = el.tagName.toLowerCase();

  const isId = lang === 'id';

  // Known button mapping
  if (id === 'btn-voice-add') {
    return isId
      ? 'Tombol Tambah via Suara. Ketuk dua kali untuk mulai berbicara menambahkan jadwal.'
      : 'Voice Add Button. Double tap to start speaking your schedule.';
  }
  if (id === 'btn-read-all' || text.includes('Bacakan Jadwal') || text.includes('Read Schedule')) {
    return isId
      ? 'Tombol Bacakan Jadwal. Ketuk dua kali untuk mendengarkan seluruh jadwal hari ini secara berurutan.'
      : 'Read Schedule Button. Double tap to listen to your entire schedule.';
  }
  if (id === 'btn-stop-speech') {
    return isId
      ? 'Tombol Berhenti Membaca. Ketuk dua kali untuk menghentikan suara pembacaan.'
      : 'Stop Reading Button. Double tap to stop voice playback.';
  }
  if (id === 'btn-focus-mode') {
    return isId
      ? 'Tombol Mode Fokus. Ketuk dua kali untuk menampilkan satu kegiatan besar per layar.'
      : 'Focus Mode Button. Double tap to view one task per screen.';
  }
  if (id === 'btn-add-activity') {
    return isId
      ? 'Tombol Ketik Manual. Ketuk dua kali untuk membuka formulir penambahan kegiatan.'
      : 'Manual Input Button. Double tap to open manual schedule form.';
  }
  if (id === 'btn-test-audio') {
    return isId
      ? 'Tombol Tes Suara. Ketuk dua kali untuk memeriksa apakah audio dan suara berfungsi.'
      : 'Test Audio Button. Double tap to verify speech and audio output.';
  }
  if (id === 'btn-toggle-contrast') {
    return isId
      ? 'Tombol Kontras Tinggi. Ketuk dua kali untuk beralih antara tampilan standar dan kontras tinggi.'
      : 'High Contrast Button. Double tap to toggle high contrast mode.';
  }
  if (id === 'btn-font-size') {
    return isId
      ? 'Tombol Ukuran Huruf. Ketuk dua kali untuk mengubah ukuran huruf menjadi lebih besar.'
      : 'Font Size Button. Double tap to cycle font size.';
  }
  if (id === 'btn-toggle-double-tap') {
    return isId
      ? 'Tombol Bantuan Ketuk Ganda. Ketuk dua kali untuk beralih mode ketuk ganda.'
      : 'Double Tap Assist Button. Double tap to toggle double tap assist.';
  }
  if (id === 'btn-focus-prev') {
    return isId
      ? 'Tombol Kegiatan Sebelumnya. Ketuk dua kali untuk berpindah ke kegiatan sebelumnya.'
      : 'Previous Task Button. Double tap to move to previous task.';
  }
  if (id === 'btn-focus-next') {
    return isId
      ? 'Tombol Kegiatan Berikutnya. Ketuk dua kali untuk berpindah ke kegiatan berikutnya.'
      : 'Next Task Button. Double tap to move to next task.';
  }
  if (id === 'btn-focus-done') {
    return isId
      ? 'Tombol Tandai Selesai. Ketuk dua kali untuk menyelesaikan kegiatan ini.'
      : 'Mark Done Button. Double tap to complete this task.';
  }
  if (id === 'btn-focus-exit') {
    return isId
      ? 'Tombol Keluar Mode Fokus. Ketuk dua kali untuk kembali ke daftar jadwal utama.'
      : 'Exit Focus Mode Button. Double tap to return to the main schedule list.';
  }

  // Link mapping
  if (tagName === 'a') {
    if (el.getAttribute('href')?.includes('ReadAloudPlanner.apk')) {
      return isId
        ? 'Tautan Unduh APK Android. Ketuk dua kali untuk mengunduh aplikasi instalasi Android.'
        : 'Download Android APK Link. Double tap to download Android application.';
    }
    if (el.getAttribute('href')?.includes('ReadAloudPlanner_Demo_Video.mp4')) {
      return isId
        ? 'Tautan Video Demo Produk. Ketuk dua kali untuk memutar video demo resmi aplikasi.'
        : 'Demo Video Link. Double tap to watch the official product video demo.';
    }
    if (el.getAttribute('href')?.includes('help.html') || el.getAttribute('href') === '/') {
      return isId
        ? `Tautan ${text || ariaLabel}. Ketuk dua kali untuk membuka halaman.`
        : `Link ${text || ariaLabel}. Double tap to open page.`;
    }
    return isId
      ? `Tautan ${text || ariaLabel}. Ketuk dua kali untuk membuka.`
      : `Link ${text || ariaLabel}. Double tap to open.`;
  }

  // Item actions
  if (tagName === 'button') {
    if (text.includes('Tandai Selesai') || text.includes('Mark Done') || text.includes('Completed') || text.includes('Tandai Belum Selesai')) {
      return isId
        ? `Tombol ${text}. Ketuk dua kali untuk mengubah status kegiatan ini.`
        : `Button ${text}. Double tap to toggle status of this task.`;
    }
    if (text.includes('Bacakan') || text.includes('Speak')) {
      return isId
        ? 'Tombol Bacakan. Ketuk dua kali untuk mendengarkan kegiatan ini.'
        : 'Speak Button. Double tap to listen to this task.';
    }
    if (text.includes('Hapus') || text.includes('Delete')) {
      return isId
        ? 'Tombol Hapus. Ketuk dua kali untuk membuka konfirmasi hapus kegiatan.'
        : 'Delete Button. Double tap to open task delete confirmation.';
    }
    return isId
      ? `Tombol ${ariaLabel || text}. Ketuk dua kali untuk menggunakan.`
      : `Button ${ariaLabel || text}. Double tap to use.`;
  }

  // List item
  if (el.classList.contains('activity-linear-item') || tagName === 'li') {
    const cleanText = text.replace(/Tandai Selesai|Tandai Belum Selesai|Bacakan|Hapus|Mark Done|Mark Incomplete|Speak|Delete/gi, '').trim();
    return isId
      ? `Kegiatan: ${cleanText}. Ketuk dua kali untuk membuka opsi kegiatan.`
      : `Task: ${cleanText}. Double tap to manage this task.`;
  }

  // Form controls
  if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
    const label = el.getAttribute('aria-label') || el.getAttribute('placeholder') || id || (isId ? 'formulir' : 'field');
    return isId
      ? `Kolom input ${label}. Ketuk dua kali untuk mengubah nilai.`
      : `Input field ${label}. Double tap to edit.`;
  }

  return isId
    ? `${ariaLabel || text || 'Elemen interaktif'}. Ketuk dua kali untuk menggunakan.`
    : `${ariaLabel || text || 'Interactive element'}. Double tap to activate.`;
}

export interface DoubleTapResult {
  shouldExecute: boolean;
  announcement: string;
}

export class DoubleTapManager {
  private lastTarget: HTMLElement | null = null;
  private lastTimestamp: number = 0;
  private enabled: boolean = true;
  private lang: 'id' | 'en' = 'en';

  constructor(initialEnabled: boolean = true, initialLang: 'id' | 'en' = 'en') {
    this.enabled = initialEnabled;
    this.lang = initialLang;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (!val) {
      this.lastTarget = null;
    }
  }

  public setLanguage(lang: 'id' | 'en') {
    this.lang = lang;
  }

  public getLanguage(): 'id' | 'en' {
    return this.lang;
  }

  public handleClick(
    target: HTMLElement,
    actionCallback: () => void,
    thresholdMs: number = 800
  ): DoubleTapResult {
    if (!this.enabled) {
      actionCallback();
      return { shouldExecute: true, announcement: '' };
    }

    const now = Date.now();
    const isSameTarget = this.lastTarget === target || (this.lastTarget && target.contains(this.lastTarget)) || (this.lastTarget && this.lastTarget.contains(target));
    const isWithinDelay = (now - this.lastTimestamp) <= thresholdMs;

    if (isSameTarget && isWithinDelay) {
      // Second tap: execute action!
      this.lastTarget = null;
      this.lastTimestamp = 0;
      actionCallback();
      return {
        shouldExecute: true,
        announcement: this.lang === 'id' ? 'Mengaktifkan...' : 'Activating...'
      };
    } else {
      // First tap: announce description!
      this.lastTarget = target;
      this.lastTimestamp = now;
      const desc = getAccessibleDescription(target, this.lang);
      return {
        shouldExecute: false,
        announcement: desc
      };
    }
  }

  public reset() {
    this.lastTarget = null;
    this.lastTimestamp = 0;
  }
}
