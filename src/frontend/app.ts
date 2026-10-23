import { announce } from './a11y.js';
import { SpeechCoordinator } from './speech.js';

export function playEarcon(type: 'tap' | 'success' | 'warning' | 'alert') {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'tap') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'warning') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(329.63, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'alert') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }

    if ('vibrate' in navigator) {
      if (type === 'tap') navigator.vibrate(20);
      else if (type === 'success') navigator.vibrate([30, 50, 40]);
      else if (type === 'warning' || type === 'alert') navigator.vibrate([60, 40, 60]);
    }
  } catch {
    // Ignore audio context autoplay restrictions
  }
}

interface Activity {
  id: string;
  title: string;
  date: string;
  start_time: string;
  duration_min: number;
  location: string;
  notes: string;
  done: boolean;
  linear_sentence: string;
}

const speech = new SpeechCoordinator();
let currentActivities: Activity[] = [];
let focusIndex = 0;
let isReadingAll = false;
let fontSizeStep = 0; // 0: standard (18px), 1: large (22px), 2: xlarge (26px)

async function checkSession(): Promise<void> {
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      showPlanner();
      loadActivities();
    } else {
      showAuth();
    }
  } catch {
    showAuth();
  }
}

function showAuth(): void {
  const authSection = document.getElementById('auth-section');
  const plannerSection = document.getElementById('planner-section');
  const btnLogout = document.getElementById('btn-logout');

  if (authSection) authSection.style.display = 'block';
  if (plannerSection) plannerSection.style.display = 'none';
  if (btnLogout) btnLogout.style.display = 'none';
}

function showPlanner(): void {
  const authSection = document.getElementById('auth-section');
  const plannerSection = document.getElementById('planner-section');
  const btnLogout = document.getElementById('btn-logout');

  if (authSection) authSection.style.display = 'none';
  if (plannerSection) plannerSection.style.display = 'block';
  if (btnLogout) btnLogout.style.display = 'inline-block';
}

async function loadActivities(targetDate?: string): Promise<void> {
  const dateInput = document.getElementById('input-date') as HTMLInputElement | null;
  const todayStr = new Date().toISOString().split('T')[0];
  const date = targetDate || (dateInput && dateInput.value) || todayStr;
  
  if (dateInput) {
    dateInput.value = date;
  }

  try {
    const res = await fetch(`/api/activities?date=${date}`);
    if (res.ok) {
      const data = await res.json();
      currentActivities = data.activities || [];
      renderActivities();
      announce(`Jadwal tanggal ${date} dimuat. Terdapat ${currentActivities.length} kegiatan.`);
    } else {
      announce('Gagal memuat kegiatan.', 'assertive');
    }
  } catch {
    announce('Kesalahan koneksi saat memuat kegiatan.', 'assertive');
  }
}

function renderActivities(): void {
  const listEl = document.getElementById('activities-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  if (currentActivities.length === 0) {
    const emptyLi = document.createElement('li');
    emptyLi.innerHTML = '<p>Tidak ada kegiatan untuk hari ini.</p>';
    listEl.appendChild(emptyLi);
    return;
  }

  currentActivities.forEach((act, idx) => {
    const li = document.createElement('li');
    li.className = `activity-linear-item ${act.done ? 'done-item' : ''}`;
    li.setAttribute('tabindex', '0');
    li.setAttribute('aria-label', `Kegiatan ${idx + 1}: ${act.linear_sentence}`);
    li.dataset.id = act.id;

    const sentence = document.createElement('p');
    sentence.className = 'sentence-text';
    sentence.textContent = act.linear_sentence;
    li.appendChild(sentence);

    const btnRow = document.createElement('div');
    btnRow.className = 'item-actions';

    const btnDone = document.createElement('button');
    btnDone.type = 'button';
    btnDone.className = 'btn-secondary';
    btnDone.textContent = act.done ? 'Tandai Belum Selesai' : 'Tandai Selesai';
    btnDone.onclick = (e) => {
      e.stopPropagation();
      toggleDone(act.id, !act.done);
    };

    const btnSpeak = document.createElement('button');
    btnSpeak.type = 'button';
    btnSpeak.className = 'btn-secondary';
    btnSpeak.textContent = 'Bacakan';
    btnSpeak.onclick = (e) => {
      e.stopPropagation();
      speech.speak(act.linear_sentence);
    };

    const btnDel = document.createElement('button');
    btnDel.type = 'button';
    btnDel.className = 'btn-danger';
    btnDel.textContent = 'Hapus';
    btnDel.onclick = (e) => {
      e.stopPropagation();
      deleteActivity(act.id);
    };

    btnRow.appendChild(btnDone);
    btnRow.appendChild(btnSpeak);
    btnRow.appendChild(btnDel);
    li.appendChild(btnRow);

    listEl.appendChild(li);
  });
}

async function toggleDone(id: string, newDone: boolean): Promise<void> {
  try {
    const res = await fetch(`/api/activities/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: newDone })
    });

    if (res.ok) {
      playEarcon(newDone ? 'success' : 'tap');
      announce(newDone ? 'Kegiatan ditandai selesai.' : 'Kegiatan ditandai belum selesai.');
      await loadActivities();
    } else {
      playEarcon('alert');
      announce('Gagal memperbarui status kegiatan.', 'assertive');
    }
  } catch {
    playEarcon('alert');
    announce('Kesalahan jaringan.', 'assertive');
  }
}

let pendingDeleteId: string | null = null;

function deleteActivity(id: string): void {
  pendingDeleteId = id;
  const dialog = document.getElementById('dialog-confirm-delete') as HTMLDialogElement | null;
  if (dialog) {
    playEarcon('warning');
    dialog.showModal();
    const btnCancel = document.getElementById('btn-confirm-delete-no');
    if (btnCancel) btnCancel.focus();
  }
}

function readAllActivities(): void {
  if (currentActivities.length === 0) {
    speech.speak('Tidak ada kegiatan untuk dibacakan hari ini.');
    return;
  }

  isReadingAll = true;
  let index = 0;
  const btnStop = document.getElementById('btn-stop-speech');
  if (btnStop) btnStop.style.display = 'inline-block';

  function speakNext(): void {
    if (!isReadingAll || index >= currentActivities.length) {
      isReadingAll = false;
      if (btnStop) btnStop.style.display = 'none';
      announce('Selesai membacakan seluruh jadwal.');
      return;
    }

    const act = currentActivities[index];
    index++;
    speech.speak(act.linear_sentence, undefined, () => {
      if (isReadingAll) {
        setTimeout(speakNext, 400);
      }
    });
  }

  speakNext();
}

function stopAllSpeech(): void {
  isReadingAll = false;
  speech.stop();
  const btnStop = document.getElementById('btn-stop-speech');
  if (btnStop) btnStop.style.display = 'none';
}

// Mode Fokus Logic
function openFocusMode(): void {
  if (currentActivities.length === 0) {
    announce('Tidak ada kegiatan untuk Mode Fokus.', 'assertive');
    return;
  }
  focusIndex = 0;
  const focusSection = document.getElementById('focus-section');
  if (focusSection) {
    focusSection.style.display = 'flex';
    updateFocusDisplay();
    const btnDone = document.getElementById('btn-focus-done');
    if (btnDone) btnDone.focus();
  }
}

function exitFocusMode(): void {
  const focusSection = document.getElementById('focus-section');
  if (focusSection) {
    focusSection.style.display = 'none';
  }
  speech.stop();
  const btnFocus = document.getElementById('btn-focus-mode');
  if (btnFocus) btnFocus.focus();
}

function updateFocusDisplay(): void {
  const act = currentActivities[focusIndex];
  if (!act) return;

  const sentenceEl = document.getElementById('focus-sentence');
  if (sentenceEl) {
    sentenceEl.textContent = act.linear_sentence;
  }

  speech.speak(act.linear_sentence);
  announce(`Mode fokus. Kegiatan ${focusIndex + 1} dari ${currentActivities.length}: ${act.linear_sentence}`);
}

// Setup Global Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
  const activeEl = document.activeElement;
  const activeTag = (activeEl?.tagName || '').toLowerCase();
  if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

  if (e.key === 's' || e.key === 'S') {
    e.preventDefault();
    if (speech.isSpeaking() || isReadingAll) {
      stopAllSpeech();
    } else {
      readAllActivities();
    }
  } else if (e.key === 'n' || e.key === 'N') {
    e.preventDefault();
    const dialog = document.getElementById('dialog-add-activity') as HTMLDialogElement | null;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  } else if (e.key === 'd' || e.key === 'D') {
    const focusSection = document.getElementById('focus-section');
    if (focusSection && focusSection.style.display !== 'none') {
      e.preventDefault();
      const act = currentActivities[focusIndex];
      if (act) {
        toggleDone(act.id, !act.done).then(() => {
          if (focusIndex < currentActivities.length - 1) {
            focusIndex++;
            updateFocusDisplay();
          }
        });
      }
    } else if (activeEl && activeEl.classList.contains('activity-linear-item')) {
      e.preventDefault();
      const id = (activeEl as HTMLElement).dataset.id;
      const act = currentActivities.find(a => a.id === id);
      if (act) {
        toggleDone(act.id, !act.done);
      }
    }
  } else if (e.key === 'Escape') {
    const focusSection = document.getElementById('focus-section');
    if (focusSection && focusSection.style.display !== 'none') {
      exitFocusMode();
      return;
    }

    const dialog = document.getElementById('dialog-add-activity') as HTMLDialogElement | null;
    if (dialog && dialog.open) {
      dialog.close();
      const btnAdd = document.getElementById('btn-add-activity');
      if (btnAdd) btnAdd.focus();
    }
  }
});

// DOMContentLoaded Event Binding
document.addEventListener('DOMContentLoaded', () => {
  checkSession();

  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.debug('ServiceWorker registration error:', err);
      });
    });
  }

  // Auth form handlers
  const formLogin = document.getElementById('form-login') as HTMLFormElement | null;
  formLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (document.getElementById('login-email') as HTMLInputElement).value;
    const password = (document.getElementById('login-password') as HTMLInputElement).value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        announce('Login berhasil.');
        showPlanner();
        loadActivities();
      } else {
        const data = await res.json();
        announce(data.error || 'Login gagal.', 'assertive');
      }
    } catch {
      announce('Kesalahan jaringan saat login.', 'assertive');
    }
  });

  const formRegister = document.getElementById('form-register') as HTMLFormElement | null;
  formRegister?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (document.getElementById('reg-email') as HTMLInputElement).value;
    const password = (document.getElementById('reg-password') as HTMLInputElement).value;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        announce('Registrasi berhasil. Silakan masuk.');
        if (formRegister) formRegister.style.display = 'none';
        if (formLogin) formLogin.style.display = 'block';
      } else {
        const data = await res.json();
        announce(data.error || 'Registrasi gagal.', 'assertive');
      }
    } catch {
      announce('Kesalahan jaringan saat registrasi.', 'assertive');
    }
  });

  document.getElementById('btn-show-register')?.addEventListener('click', () => {
    if (formLogin) formLogin.style.display = 'none';
    if (formRegister) formRegister.style.display = 'block';
    const regEmail = document.getElementById('reg-email');
    if (regEmail) regEmail.focus();
  });

  document.getElementById('btn-show-login')?.addEventListener('click', () => {
    if (formRegister) formRegister.style.display = 'none';
    if (formLogin) formLogin.style.display = 'block';
    const loginEmail = document.getElementById('login-email');
    if (loginEmail) loginEmail.focus();
  });

  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      announce('Anda telah keluar.');
      showAuth();
    } catch {
      showAuth();
    }
  });

  // Date selection
  const inputDate = document.getElementById('input-date') as HTMLInputElement | null;
  inputDate?.addEventListener('change', () => {
    loadActivities(inputDate.value);
  });

  // Buttons in planner toolbar
  document.getElementById('btn-read-all')?.addEventListener('click', readAllActivities);
  document.getElementById('btn-stop-speech')?.addEventListener('click', stopAllSpeech);
  document.getElementById('btn-focus-mode')?.addEventListener('click', openFocusMode);
  document.getElementById('btn-focus-exit')?.addEventListener('click', exitFocusMode);

  document.getElementById('btn-focus-next')?.addEventListener('click', () => {
    if (focusIndex < currentActivities.length - 1) {
      focusIndex++;
      updateFocusDisplay();
    }
  });

  document.getElementById('btn-focus-prev')?.addEventListener('click', () => {
    if (focusIndex > 0) {
      focusIndex--;
      updateFocusDisplay();
    }
  });

  document.getElementById('btn-focus-done')?.addEventListener('click', async () => {
    const act = currentActivities[focusIndex];
    if (act) {
      await toggleDone(act.id, !act.done);
      if (focusIndex < currentActivities.length - 1) {
        focusIndex++;
        updateFocusDisplay();
      }
    }
  });

  // Add Activity Dialog
  const dialogAdd = document.getElementById('dialog-add-activity') as HTMLDialogElement | null;
  document.getElementById('btn-add-activity')?.addEventListener('click', () => {
    if (dialogAdd) {
      const actDate = document.getElementById('act-date') as HTMLInputElement | null;
      if (actDate && inputDate) actDate.value = inputDate.value;
      dialogAdd.showModal();
    }
  });

  document.getElementById('btn-cancel-add')?.addEventListener('click', () => {
    if (dialogAdd) dialogAdd.close();
  });

  const formAddActivity = document.getElementById('form-add-activity') as HTMLFormElement | null;
  formAddActivity?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = (document.getElementById('act-title') as HTMLInputElement).value;
    const date = (document.getElementById('act-date') as HTMLInputElement).value;
    const start_time = (document.getElementById('act-time') as HTMLInputElement).value;
    const duration_min = Number((document.getElementById('act-duration') as HTMLInputElement).value);
    const location = (document.getElementById('act-location') as HTMLInputElement).value;
    const notes = (document.getElementById('act-notes') as HTMLTextAreaElement).value;

    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, date, start_time, duration_min, location, notes })
      });

      if (res.ok) {
        announce(`Kegiatan ${title} berhasil ditambahkan.`);
        if (dialogAdd) dialogAdd.close();
        formAddActivity.reset();
        await loadActivities(date);
      } else {
        const data = await res.json();
        announce(data.error || 'Gagal menambahkan kegiatan.', 'assertive');
      }
    } catch {
      announce('Kesalahan jaringan.', 'assertive');
    }
  });

  // High contrast mode toggle
  const btnContrast = document.getElementById('btn-toggle-contrast');
  btnContrast?.addEventListener('click', () => {
    const isHC = document.body.classList.toggle('high-contrast');
    btnContrast.setAttribute('aria-pressed', String(isHC));
    announce(isHC ? 'Mode kontras tinggi aktif.' : 'Mode kontras standar aktif.');
  });

  // Font size toggle
  const btnFontSize = document.getElementById('btn-font-size');
  btnFontSize?.addEventListener('click', () => {
    fontSizeStep = (fontSizeStep + 1) % 3;
    document.body.classList.remove('font-large', 'font-xlarge');

    if (fontSizeStep === 0) {
      btnFontSize.textContent = 'Huruf: Sedang';
      btnFontSize.setAttribute('aria-label', 'Huruf: Sedang, klik untuk ubah ukuran');
      announce('Ukuran huruf diubah ke sedang.');
    } else if (fontSizeStep === 1) {
      document.body.classList.add('font-large');
      btnFontSize.textContent = 'Huruf: Besar';
      btnFontSize.setAttribute('aria-label', 'Huruf: Besar, klik untuk ubah ukuran');
      announce('Ukuran huruf diubah ke besar.');
    } else {
      document.body.classList.add('font-xlarge');
      btnFontSize.textContent = 'Huruf: Sangat Besar';
      btnFontSize.setAttribute('aria-label', 'Huruf: Sangat Besar, klik untuk ubah ukuran');
      announce('Ukuran huruf diubah ke sangat besar.');
    }
  });

  // Speech rate dropdown
  const selectRate = document.getElementById('select-speech-rate') as HTMLSelectElement | null;
  selectRate?.addEventListener('change', () => {
    const rate = parseFloat(selectRate.value);
    speech.setRate(rate);
    announce(`Kecepatan pembacaan suara diubah ke ${rate} kali.`);
  });

  // Speech language dropdown
  const selectLang = document.getElementById('select-speech-lang') as HTMLSelectElement | null;
  selectLang?.addEventListener('change', () => {
    const lang = selectLang.value;
    speech.setLanguage(lang);
    announce(lang === 'id-ID' ? 'Bahasa pembacaan diubah ke Indonesia.' : 'Speech language set to English.');
  });

  // Confirm delete dialog listeners
  document.getElementById('btn-confirm-delete-yes')?.addEventListener('click', async () => {
    const dialog = document.getElementById('dialog-confirm-delete') as HTMLDialogElement | null;
    if (dialog) dialog.close();
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    pendingDeleteId = null;

    try {
      const res = await fetch(`/api/activities/${id}`, { method: 'DELETE' });
      if (res.ok) {
        playEarcon('success');
        announce('Kegiatan berhasil dihapus.');
        await loadActivities();
      } else {
        playEarcon('alert');
        announce('Gagal menghapus kegiatan.', 'assertive');
      }
    } catch {
      playEarcon('alert');
      announce('Kesalahan jaringan saat menghapus kegiatan.', 'assertive');
    }
  });

  document.getElementById('btn-confirm-delete-no')?.addEventListener('click', () => {
    const dialog = document.getElementById('dialog-confirm-delete') as HTMLDialogElement | null;
    if (dialog) dialog.close();
    pendingDeleteId = null;
  });
});
