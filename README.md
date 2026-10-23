# Read-Aloud-Planner

> *Jadwal yang bisa didengar, bukan hanya dilihat.*

**Read Aloud Planner** adalah aplikasi perencana harian produksi (PWA & Android Native APK) yang dirancang khusus untuk aksesibilitas penuh bagi pengguna *screen reader*, navigasi *keyboard-only*, dan penyandang disleksia berat.

---

## Fitur Utama

- 🎙️ **Kalimat Linear Alami:** Menggantikan kisi kalender visual rumit dengan format kalimat terstruktur yang bermakna saat dibacakan (contoh: *"Senin, 08.00, Kuliah Basis Data, 2 jam, ruang 301. Selesai."*).
- 🔊 **Web Speech API & Web Audio Earcons:** Pembacaan suara berurutan di sisi klien dengan kontrol kecepatan (0.5x–2.0x) serta umpan balik nada sintetis (*audio earcons*) tanpa dependensi eksternal.
- 🎯 **Mode Fokus (Satu Layar Satu Kegiatan):** Mengurangi *cognitive overload* dengan memfokuskan antarmuka pada satu kegiatan aktif beserta kontrol audio otomatis.
- ⌨️ **Navigasi 100% Bebas Tetikus (Keyboard-Only):**
  - `S` — Mulai / Hentikan pembacaan audio jadwal.
  - `D` — Tandai kegiatan selesai / belum selesai.
  - `N` — Buka dialog tambah kegiatan baru.
  - `Esc` — Tutup dialog atau keluar dari Mode Fokus.
  - `Tab` / `Shift + Tab` — Navigasi fokus logis dengan indikator cincin fokus solid 3px kontras tinggi.
- ♿ **Kepatuhan WCAG 2.2 Level AA:**
  - Lolos uji otomatis `@axe-core/playwright` dengan 0 pelanggaran kritis maupun serius.
  - Rasio kontras teks ≥ 4.5:1 dan kontrol UI ≥ 3:1 dengan dukungan tema Kontras Tinggi instan.
  - Tanpa *popup blocking* (`alert`/`confirm` native digantikan dengan HTML `<dialog>` aksesibel).
  - Daerah siar `aria-live="polite"` dan `aria-live="assertive"` untuk setiap pembaruan data.
- 📱 **Multiplatform (PWA & Android APK):**
  - Paket APK native mandiri (`ReadAloudPlanner.apk`) via Capacitor & Android SDK Build-Tools.
  - PWA installable dengan Service Worker offline-first untuk iPhone/iOS Safari & Android.
- 🔒 **Keamanan & Kedaulatan Data:**
  - Hashing kata sandi aman via bcrypt (12 putaran garam) dengan proteksi kata sandi bocor/umum.
  - Autentikasi sesi berbasis cookie `HttpOnly` & `SameSite` serta opsi login *magic link*.
  - Ekspor/Impor dua arah JSON & standar iCalendar RFC 5545 (`.ics`).
  - Hak penghapusan akun permanen (*Right to Erasure*) sesuai UU PDP / GDPR.

---

## Arsitektur Teknis

```
[Browser / PWA / Android APK]
         ↕ (HTTPS / JSON / Audio)
[Fastify Server (TypeScript)]
  ├── Security: Helmet, Rate-Limit, Cookie, CORS
  ├── Services: Formatter, Password Security, RFC 5545 iCalendar, Web Audio
  └── Storage: PostgreSQL 16
```

- **Frontend:** HTML5 Semantik Murni, TypeScript, CSS3 Fluida, Web Speech API, Web Audio API, Service Worker.
- **Backend:** Node.js, Fastify v4, TypeScript, PostgreSQL (`pg`).
- **Pengujian:** Vitest (21 unit & integration tests), Playwright + axe-core (5 E2E accessibility tests).

---

## Menjalankan Secara Lokal

### Prasyarat
- Node.js ≥ 20
- PostgreSQL (atau Podman / Docker)

### Instalasi & Migrasi

```bash
# Salin repositori
git clone https://github.com/ArrafiNurHafiz/Read-Aloud-Planner.git
cd Read-Aloud-Planner

# Pasang dependensi
npm install

# Konfigurasi basis data (.env)
cp .env.example .env

# Jalankan migrasi basis data
npm run db:migrate

# Jalankan server pengembangan
npm run dev:backend
```

Akses aplikasi di peramban: `http://localhost:3000`

---

## Menjalankan Pengujian

```bash
# Menjalankan pengujian unit & integrasi backend
npm test

# Menjalankan pengujian E2E dan audit aksesibilitas WCAG 2.2 AA
npm run test:e2e
```

---

## Unduh Aplikasi Android

Berkas installer APK siap pakai tersedia langsung dari server aplikasi atau direktori rilis:
- Path lokal/server: `/ReadAloudPlanner.apk`
- Paket: `com.readaloud.planner`

---

## Lisensi
MIT License. Dirancang untuk kebebasan dan kemandirian aksesibilitas.
