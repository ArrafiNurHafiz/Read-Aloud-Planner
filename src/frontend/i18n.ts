export type SupportedLang = 'en' | 'id';

export interface Translations {
  docTitle: string;
  skipLink: string;
  appTitle: string;
  btnContrast: string;
  btnContrastActive: string;
  btnFontMedium: string;
  btnFontLarge: string;
  btnFontXLarge: string;
  btnDoubleTapActive: string;
  btnDoubleTapInactive: string;
  btnTestAudio: string;
  navHelp: string;
  navApk: string;
  navDemo: string;
  plannerHeading: string;
  dateLabel: string;
  btnVoiceAdd: string;
  btnReadAll: string;
  btnStopSpeech: string;
  btnFocusMode: string;
  btnExitFocus: string;
  btnAddActivity: string;
  captionReady: string;
  captionStopped: string;
  captionNoTasks: string;
  captionReadingComplete: string;
  emptyList: string;
  btnMarkDone: string;
  btnMarkIncomplete: string;
  btnSpeak: string;
  btnDelete: string;
  focusTitle: string;
  btnPrev: string;
  btnNext: string;
  dialogAddTitle: string;
  labelTaskTitle: string;
  labelDate: string;
  labelStartTime: string;
  labelDuration: string;
  labelLocation: string;
  labelNotes: string;
  btnSaveTask: string;
  btnCancel: string;
  dialogDeleteTitle: string;
  dialogDeleteMsg: string;
  btnDeleteYes: string;
  btnDeleteNo: string;
  testAudioMessage: string;
  voiceMicActive: string;
  voiceListeningPrompt: string;
  voiceNotSupported: string;
  voiceMicDenied: string;
  voiceNoSpeech: string;
  audioWorkingAnnounce: string;
  highContrastActiveAnnounce: string;
  highContrastNormalAnnounce: string;
  doubleTapActiveAnnounce: string;
  doubleTapNormalAnnounce: string;
  taskAddedVoiceAnnounce: string;
  taskAddedManualAnnounce: string;
  taskDeletedAnnounce: string;
}

export const DICTIONARY: Record<SupportedLang, Translations> = {
  en: {
    docTitle: 'Read Aloud Planner — Hear Your Schedule, Not Just See It',
    skipLink: 'Skip to main content',
    appTitle: 'Read Aloud Planner',
    btnContrast: 'High Contrast',
    btnContrastActive: 'High Contrast: Active',
    btnFontMedium: 'Font: Medium',
    btnFontLarge: 'Font: Large',
    btnFontXLarge: 'Font: Extra Large',
    btnDoubleTapActive: 'Double Tap: Active',
    btnDoubleTapInactive: 'Double Tap: Inactive',
    btnTestAudio: 'Test Audio',
    navHelp: 'Accessibility Guide',
    navApk: 'Download APK',
    navDemo: 'Demo Video',
    plannerHeading: "Today's Schedule",
    dateLabel: 'Select Date:',
    btnVoiceAdd: 'Voice Add (V)',
    btnReadAll: 'Read Schedule (S)',
    btnStopSpeech: 'Stop Reading',
    btnFocusMode: 'Focus Mode',
    btnExitFocus: 'Exit Focus Mode',
    btnAddActivity: 'Manual Input (N)',
    captionReady: 'Ready to read schedule.',
    captionStopped: 'Speech stopped.',
    captionNoTasks: 'No tasks to read for today.',
    captionReadingComplete: 'Finished reading all tasks for today.',
    emptyList: 'No tasks for today. Press "Voice Add" or "Manual Input".',
    btnMarkDone: 'Mark Done',
    btnMarkIncomplete: 'Mark Incomplete',
    btnSpeak: 'Speak',
    btnDelete: 'Delete',
    focusTitle: 'Focus Mode: One Task',
    btnPrev: 'Previous',
    btnNext: 'Next',
    dialogAddTitle: 'Add New Task',
    labelTaskTitle: 'Task Name',
    labelDate: 'Date',
    labelStartTime: 'Start Time',
    labelDuration: 'Duration (in minutes)',
    labelLocation: 'Location / Room (Optional)',
    labelNotes: 'Additional Notes (Optional)',
    btnSaveTask: 'Save Task',
    btnCancel: 'Cancel (Esc)',
    dialogDeleteTitle: 'Confirm Delete',
    dialogDeleteMsg: 'Delete this task from your schedule?',
    btnDeleteYes: 'Yes, Delete',
    btnDeleteNo: 'Cancel (Esc)',
    testAudioMessage: 'Audio and voice speech are functioning properly. Read Aloud Planner is ready.',
    voiceMicActive: 'Microphone active. Please speak your schedule naturally.',
    voiceListeningPrompt: 'Listening for speech... Please say your task (e.g., "Database lecture tomorrow at 9 AM for 2 hours in room 301").',
    voiceNotSupported: 'Speech recognition is not supported in this browser. Please use manual input form.',
    voiceMicDenied: 'Microphone permission was denied by the browser.',
    voiceNoSpeech: 'No speech was detected. Please try again.',
    audioWorkingAnnounce: 'Audio and speech synthesis are working normally.',
    highContrastActiveAnnounce: 'High contrast mode activated.',
    highContrastNormalAnnounce: 'Standard contrast mode activated.',
    doubleTapActiveAnnounce: 'Double tap assist enabled. Tap once to hear element function, double tap to execute.',
    doubleTapNormalAnnounce: 'Double tap assist disabled. Standard single tap active.',
    taskAddedVoiceAnnounce: 'Task added successfully via voice.',
    taskAddedManualAnnounce: 'Task added successfully.',
    taskDeletedAnnounce: 'Task deleted successfully.'
  },
  id: {
    docTitle: 'Read Aloud Planner — Jadwal yang Bisa Didengar',
    skipLink: 'Lewati ke konten utama',
    appTitle: 'Read Aloud Planner',
    btnContrast: 'Kontras Tinggi',
    btnContrastActive: 'Kontras Tinggi: Aktif',
    btnFontMedium: 'Huruf: Sedang',
    btnFontLarge: 'Huruf: Besar',
    btnFontXLarge: 'Huruf: Sangat Besar',
    btnDoubleTapActive: 'Ketuk Ganda: Aktif',
    btnDoubleTapInactive: 'Ketuk Ganda: Nonaktif',
    btnTestAudio: 'Tes Suara',
    navHelp: 'Panduan Aksesibilitas',
    navApk: 'Unduh APK',
    navDemo: 'Video Demo',
    plannerHeading: 'Jadwal Hari Ini',
    dateLabel: 'Pilih Tanggal:',
    btnVoiceAdd: 'Tambah via Suara (V)',
    btnReadAll: 'Bacakan Jadwal (S)',
    btnStopSpeech: 'Berhenti Membaca',
    btnFocusMode: 'Mode Fokus',
    btnExitFocus: 'Keluar Mode Fokus',
    btnAddActivity: 'Ketik Manual (N)',
    captionReady: 'Siap membacakan jadwal.',
    captionStopped: 'Pembacaan dihentikan.',
    captionNoTasks: 'Tidak ada kegiatan untuk dibacakan hari ini.',
    captionReadingComplete: 'Selesai membacakan seluruh kegiatan.',
    emptyList: 'Tidak ada kegiatan untuk hari ini. Gunakan "Tambah via Suara" atau "Ketik Manual".',
    btnMarkDone: 'Tandai Selesai',
    btnMarkIncomplete: 'Tandai Belum Selesai',
    btnSpeak: 'Bacakan',
    btnDelete: 'Hapus',
    focusTitle: 'Mode Fokus: Satu Kegiatan',
    btnPrev: 'Sebelumnya',
    btnNext: 'Berikutnya',
    dialogAddTitle: 'Tambah Kegiatan Baru',
    labelTaskTitle: 'Nama Kegiatan',
    labelDate: 'Tanggal',
    labelStartTime: 'Jam Mulai',
    labelDuration: 'Durasi (dalam menit)',
    labelLocation: 'Lokasi / Ruangan (Opsional)',
    labelNotes: 'Catatan Tambahan (Opsional)',
    btnSaveTask: 'Simpan Kegiatan',
    btnCancel: 'Batal (Esc)',
    dialogDeleteTitle: 'Konfirmasi Hapus',
    dialogDeleteMsg: 'Hapus kegiatan ini dari jadwal?',
    btnDeleteYes: 'Ya, Hapus',
    btnDeleteNo: 'Batal (Esc)',
    testAudioMessage: 'Audio dan suara berfungsi dengan baik. Read Aloud Planner siap membacakan jadwal Anda.',
    voiceMicActive: 'Mikrofon aktif. Silakan sebutkan jadwal kegiatan Anda.',
    voiceListeningPrompt: 'Mendengarkan suara... Silakan sebutkan kegiatan (contoh: "Kuliah Basis Data jam 8 pagi 2 jam di ruang 301").',
    voiceNotSupported: 'Fitur pengenalan suara tidak didukung di peramban ini. Silakan gunakan formulir tambah kegiatan.',
    voiceMicDenied: 'Izin mikrofon ditolak oleh peramban.',
    voiceNoSpeech: 'Suara tidak terdeteksi. Silakan coba lagi.',
    audioWorkingAnnounce: 'Audio dan suara berfungsi normal.',
    highContrastActiveAnnounce: 'Mode kontras tinggi aktif.',
    highContrastNormalAnnounce: 'Mode kontras standar aktif.',
    doubleTapActiveAnnounce: 'Bantuan ketuk ganda diaktifkan. Klik sekali untuk mendengar fungsi, klik dua kali untuk menjalankan.',
    doubleTapNormalAnnounce: 'Bantuan ketuk ganda dinonaktifkan. Mode satu klik aktif.',
    taskAddedVoiceAnnounce: 'Kegiatan berhasil ditambahkan melalui suara.',
    taskAddedManualAnnounce: 'Kegiatan berhasil ditambahkan.',
    taskDeletedAnnounce: 'Kegiatan berhasil dihapus.'
  }
};
