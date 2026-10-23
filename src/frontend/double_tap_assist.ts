export function getAccessibleDescription(el: HTMLElement): string {
  const id = el.id || '';
  const text = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ');
  const ariaLabel = el.getAttribute('aria-label') || '';
  const tagName = el.tagName.toLowerCase();

  // Known button mapping
  if (id === 'btn-voice-add') {
    return 'Tombol Tambah via Suara. Ketuk dua kali untuk mulai berbicara menambahkan jadwal.';
  }
  if (id === 'btn-read-all' || text.includes('Bacakan Jadwal')) {
    return 'Tombol Bacakan Jadwal. Ketuk dua kali untuk mendengarkan seluruh jadwal hari ini secara berurutan.';
  }
  if (id === 'btn-stop-speech') {
    return 'Tombol Berhenti Membaca. Ketuk dua kali untuk menghentikan suara pembacaan.';
  }
  if (id === 'btn-focus-mode') {
    return 'Tombol Mode Fokus. Ketuk dua kali untuk menampilkan satu kegiatan besar per layar.';
  }
  if (id === 'btn-add-activity') {
    return 'Tombol Ketik Manual. Ketuk dua kali untuk membuka formulir penambahan kegiatan.';
  }
  if (id === 'btn-test-audio') {
    return 'Tombol Tes Suara. Ketuk dua kali untuk memeriksa apakah audio dan suara berfungsi.';
  }
  if (id === 'btn-toggle-contrast') {
    return 'Tombol Kontras Tinggi. Ketuk dua kali untuk beralih antara tampilan standar dan kontras tinggi.';
  }
  if (id === 'btn-font-size') {
    return 'Tombol Ukuran Huruf. Ketuk dua kali untuk mengubah ukuran huruf menjadi lebih besar.';
  }
  if (id === 'btn-toggle-double-tap') {
    return 'Tombol Bantuan Ketuk Ganda. Ketuk dua kali untuk beralih mode ketuk ganda.';
  }
  if (id === 'btn-focus-prev') {
    return 'Tombol Kegiatan Sebelumnya. Ketuk dua kali untuk berpindah ke kegiatan sebelumnya.';
  }
  if (id === 'btn-focus-next') {
    return 'Tombol Kegiatan Berikutnya. Ketuk dua kali untuk berpindah ke kegiatan berikutnya.';
  }
  if (id === 'btn-focus-done') {
    return 'Tombol Tandai Selesai. Ketuk dua kali untuk menyelesaikan kegiatan ini.';
  }
  if (id === 'btn-focus-exit') {
    return 'Tombol Keluar Mode Fokus. Ketuk dua kali untuk kembali ke daftar jadwal utama.';
  }

  // Link mapping
  if (tagName === 'a') {
    if (el.getAttribute('href')?.includes('ReadAloudPlanner.apk')) {
      return 'Tautan Unduh APK Android. Ketuk dua kali untuk mengunduh aplikasi instalasi Android.';
    }
    if (el.getAttribute('href')?.includes('ReadAloudPlanner_Demo_Video.mp4')) {
      return 'Tautan Video Demo Produk. Ketuk dua kali untuk memutar video demo resmi aplikasi.';
    }
    if (el.getAttribute('href')?.includes('help.html') || el.getAttribute('href') === '/') {
      return `Tautan ${text || ariaLabel}. Ketuk dua kali untuk membuka halaman.`;
    }
    return `Tautan ${text || ariaLabel}. Ketuk dua kali untuk membuka.`;
  }

  // Item actions
  if (tagName === 'button') {
    if (text.includes('Tandai Selesai') || text.includes('Tandai Belum Selesai')) {
      return `Tombol ${text}. Ketuk dua kali untuk mengubah status kegiatan ini.`;
    }
    if (text.includes('Bacakan')) {
      return 'Tombol Bacakan. Ketuk dua kali untuk mendengarkan kegiatan ini.';
    }
    if (text.includes('Hapus')) {
      return 'Tombol Hapus. Ketuk dua kali untuk membuka konfirmasi hapus kegiatan.';
    }
    return `Tombol ${ariaLabel || text}. Ketuk dua kali untuk menggunakan.`;
  }

  // List item
  if (el.classList.contains('activity-linear-item') || tagName === 'li') {
    const cleanText = text.replace(/Tandai Selesai|Tandai Belum Selesai|Bacakan|Hapus/g, '').trim();
    return `Kegiatan: ${cleanText}. Ketuk dua kali untuk membuka opsi kegiatan.`;
  }

  // Form controls
  if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
    const label = el.getAttribute('aria-label') || el.getAttribute('placeholder') || id || 'formulir';
    return `Kolom input ${label}. Ketuk dua kali untuk mengubah nilai.`;
  }

  return `${ariaLabel || text || 'Elemen interaktif'}. Ketuk dua kali untuk menggunakan.`;
}

export interface DoubleTapResult {
  shouldExecute: boolean;
  announcement: string;
}

export class DoubleTapManager {
  private lastTarget: HTMLElement | null = null;
  private lastTimestamp: number = 0;
  private enabled: boolean = true;

  constructor(initialEnabled: boolean = true) {
    this.enabled = initialEnabled;
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
        announcement: 'Mengaktifkan...'
      };
    } else {
      // First tap: announce description!
      this.lastTarget = target;
      this.lastTimestamp = now;
      const desc = getAccessibleDescription(target);
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
