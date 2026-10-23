import { announce } from './a11y.js';
import { SpeechCoordinator } from './speech.js';
import { LocalStorageRepository, type ActivityItem } from './storage.js';
import { VoiceInputController } from './voice_input.js';
import { DoubleTapManager } from './double_tap_assist.js';
import { DICTIONARY, type SupportedLang, type Translations } from './i18n.js';

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
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'warning') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(329.63, now);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'alert') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, now);
      gain.gain.setValueAtTime(0.18, now);
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

function unlockAudio() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      ctx.resume().catch(() => {});
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
  } catch {
    // Ignore
  }
}

// Global active language (default English)
let currentLang: SupportedLang = 'en';
if (typeof window !== 'undefined' && window.localStorage) {
  const saved = window.localStorage.getItem('readaloud_lang') as SupportedLang | null;
  if (saved === 'id' || saved === 'en') {
    currentLang = saved;
  }
}

const storageRepo = new LocalStorageRepository();
const speech = new SpeechCoordinator();
const voiceInput = new VoiceInputController();
const doubleTap = new DoubleTapManager(true, currentLang);

let currentActivities: ActivityItem[] = [];
let focusIndex = 0;
let isReadingAll = false;
let fontSizeStep = 0; // 0: standard (18px), 1: large (22px), 2: xlarge (26px)
let pendingDeleteId: string | null = null;

export function getT(): Translations {
  return DICTIONARY[currentLang];
}

export function applyLanguage(lang: SupportedLang): void {
  currentLang = lang;
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('readaloud_lang', lang);
  }

  const t = DICTIONARY[lang];
  document.documentElement.lang = lang;
  document.title = t.docTitle;

  // Header and Navigation
  const skipLink = document.getElementById('skip-link');
  if (skipLink) skipLink.textContent = t.skipLink;

  const appHeading = document.getElementById('app-heading');
  if (appHeading) appHeading.textContent = t.appTitle;

  const btnContrast = document.getElementById('btn-toggle-contrast');
  if (btnContrast) {
    const isHC = document.body.classList.contains('high-contrast');
    btnContrast.textContent = isHC ? t.btnContrastActive : t.btnContrast;
  }

  const btnFont = document.getElementById('btn-font-size');
  if (btnFont) {
    if (fontSizeStep === 0) btnFont.textContent = t.btnFontMedium;
    else if (fontSizeStep === 1) btnFont.textContent = t.btnFontLarge;
    else btnFont.textContent = t.btnFontXLarge;
  }

  const selectLang = document.getElementById('select-speech-lang') as HTMLSelectElement | null;
  if (selectLang) {
    selectLang.value = lang === 'en' ? 'en-US' : 'id-ID';
  }

  const linkHelp = document.getElementById('link-help');
  if (linkHelp) linkHelp.textContent = t.navHelp;

  const linkApk = document.getElementById('link-apk');
  if (linkApk) linkApk.textContent = t.navApk;

  const linkDemo = document.getElementById('link-demo');
  if (linkDemo) linkDemo.textContent = t.navDemo;

  const btnDT = document.getElementById('btn-toggle-double-tap');
  if (btnDT) {
    btnDT.textContent = doubleTap.isEnabled() ? t.btnDoubleTapActive : t.btnDoubleTapInactive;
    btnDT.setAttribute('aria-label', doubleTap.isEnabled() ? `${t.btnDoubleTapActive}, click to toggle` : `${t.btnDoubleTapInactive}, click to toggle`);
  }

  const btnTestAudio = document.getElementById('btn-test-audio');
  if (btnTestAudio) btnTestAudio.textContent = t.btnTestAudio;

  // Planner Toolbar
  const plannerHeading = document.getElementById('planner-heading');
  if (plannerHeading) plannerHeading.textContent = t.plannerHeading;

  const lblDate = document.getElementById('label-date-select');
  if (lblDate) lblDate.textContent = t.dateLabel;

  const txtVoiceAdd = document.getElementById('text-voice-add');
  if (txtVoiceAdd) txtVoiceAdd.textContent = lang === 'en' ? 'Voice Add' : 'Tambah via Suara';

  const txtReadAll = document.getElementById('text-read-all');
  if (txtReadAll) txtReadAll.textContent = lang === 'en' ? 'Read Schedule' : 'Bacakan Jadwal';

  const btnStop = document.getElementById('btn-stop-speech');
  if (btnStop) btnStop.textContent = t.btnStopSpeech;

  const btnFocus = document.getElementById('btn-focus-mode');
  if (btnFocus) {
    const isFocusVisible = document.getElementById('focus-section')?.style.display !== 'none';
    btnFocus.textContent = isFocusVisible ? t.btnExitFocus : t.btnFocusMode;
  }

  const txtManualAdd = document.getElementById('text-manual-add');
  if (txtManualAdd) txtManualAdd.textContent = lang === 'en' ? 'Manual Input' : 'Ketik Manual';

  // Subtitle Box
  const captionEl = document.getElementById('speech-caption-text');
  if (captionEl && (captionEl.textContent?.includes('Ready') || captionEl.textContent?.includes('Siap'))) {
    captionEl.textContent = t.captionReady;
  }

  // Focus Mode Elements
  const focusTitle = document.getElementById('focus-title');
  if (focusTitle) focusTitle.textContent = t.focusTitle;

  const btnFocusPrev = document.getElementById('btn-focus-prev');
  if (btnFocusPrev) btnFocusPrev.textContent = t.btnPrev;

  const txtFocusDone = document.getElementById('text-focus-done');
  if (txtFocusDone) txtFocusDone.textContent = t.btnMarkDone;

  const btnFocusNext = document.getElementById('btn-focus-next');
  if (btnFocusNext) btnFocusNext.textContent = t.btnNext;

  const txtFocusExit = document.getElementById('text-focus-exit');
  if (txtFocusExit) txtFocusExit.textContent = lang === 'en' ? 'Exit' : 'Keluar';

  // Add Task Dialog Elements
  const dlgAddTitle = document.getElementById('dialog-add-title');
  if (dlgAddTitle) dlgAddTitle.textContent = t.dialogAddTitle;

  const lblActTitle = document.getElementById('lbl-act-title');
  if (lblActTitle) lblActTitle.textContent = t.labelTaskTitle;

  const lblActDate = document.getElementById('lbl-act-date');
  if (lblActDate) lblActDate.textContent = t.labelDate;

  const lblActTime = document.getElementById('lbl-act-time');
  if (lblActTime) lblActTime.textContent = t.labelStartTime;

  const lblActDur = document.getElementById('lbl-act-duration');
  if (lblActDur) lblActDur.textContent = t.labelDuration;

  const lblActLoc = document.getElementById('lbl-act-location');
  if (lblActLoc) lblActLoc.textContent = t.labelLocation;

  const lblActNotes = document.getElementById('lbl-act-notes');
  if (lblActNotes) lblActNotes.textContent = t.labelNotes;

  const btnSave = document.getElementById('btn-save-task');
  if (btnSave) btnSave.textContent = t.btnSaveTask;

  const txtCancelAdd = document.getElementById('text-cancel-add');
  if (txtCancelAdd) txtCancelAdd.textContent = lang === 'en' ? 'Cancel' : 'Batal';

  // Delete Dialog Elements
  const dlgDelTitle = document.getElementById('dialog-confirm-delete');
  if (dlgDelTitle) dlgDelTitle.textContent = t.dialogDeleteTitle;

  const dlgDelMsg = document.getElementById('dialog-confirm-msg');
  if (dlgDelMsg) dlgDelMsg.textContent = t.dialogDeleteMsg;

  const btnDelYes = document.getElementById('btn-confirm-delete-yes');
  if (btnDelYes) btnDelYes.textContent = t.btnDeleteYes;

  const txtCancelDel = document.getElementById('text-cancel-del');
  if (txtCancelDel) txtCancelDel.textContent = lang === 'en' ? 'Cancel' : 'Batal';

  // Sync Coordinators
  speech.setLanguage(lang === 'en' ? 'en-US' : 'id-ID');
  voiceInput.setLanguage(lang === 'en' ? 'en-US' : 'id-ID');
  doubleTap.setLanguage(lang);

  // Re-render activities with dynamic translated sentences
  loadActivities();
}

async function loadActivities(targetDate?: string): Promise<void> {
  const dateInput = document.getElementById('input-date') as HTMLInputElement | null;
  const todayStr = new Date().toISOString().split('T')[0];
  const date = targetDate || (dateInput && dateInput.value) || todayStr;

  if (dateInput) {
    dateInput.value = date;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);
    const res = await fetch(`/api/activities?date=${date}`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      currentActivities = data.activities || [];
    } else {
      currentActivities = storageRepo.getActivitiesByDate(date, currentLang);
    }
  } catch {
    currentActivities = storageRepo.getActivitiesByDate(date, currentLang);
  }

  renderActivities();
  const announceMsg = currentLang === 'en'
    ? `Schedule for ${date} loaded. There are ${currentActivities.length} tasks.`
    : `Jadwal tanggal ${date} dimuat. Terdapat ${currentActivities.length} kegiatan.`;
  announce(announceMsg);
}

function renderActivities(): void {
  const listEl = document.getElementById('activities-list');
  if (!listEl) return;
  listEl.innerHTML = '';
  const t = getT();

  if (currentActivities.length === 0) {
    const emptyLi = document.createElement('li');
    emptyLi.innerHTML = `<p>${t.emptyList}</p>`;
    listEl.appendChild(emptyLi);
    return;
  }

  currentActivities.forEach((act, idx) => {
    const li = document.createElement('li');
    li.className = `activity-linear-item ${act.done ? 'done-item' : ''}`;
    li.setAttribute('tabindex', '0');
    li.setAttribute('aria-label', `${currentLang === 'en' ? 'Task' : 'Kegiatan'} ${idx + 1}: ${act.linear_sentence}`);
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
    btnDone.textContent = act.done ? t.btnMarkIncomplete : t.btnMarkDone;
    btnDone.onclick = (e) => {
      e.stopPropagation();
      toggleDone(act.id, !act.done);
    };

    const btnSpeak = document.createElement('button');
    btnSpeak.type = 'button';
    btnSpeak.className = 'btn-secondary';
    btnSpeak.textContent = t.btnSpeak;
    btnSpeak.onclick = (e) => {
      e.stopPropagation();
      playEarcon('tap');
      speech.speak(act.linear_sentence);
    };

    const btnDel = document.createElement('button');
    btnDel.type = 'button';
    btnDel.className = 'btn-danger';
    btnDel.textContent = t.btnDelete;
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
  storageRepo.updateActivity(id, { done: newDone }, currentLang);
  fetch(`/api/activities/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ done: newDone })
  }).catch(() => {});

  playEarcon(newDone ? 'success' : 'tap');
  const msg = currentLang === 'en'
    ? (newDone ? 'Task marked as completed.' : 'Task marked as incomplete.')
    : (newDone ? 'Kegiatan ditandai selesai.' : 'Kegiatan ditandai belum selesai.');
  announce(msg);
  await loadActivities();
}

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
  const t = getT();
  if (currentActivities.length === 0) {
    playEarcon('tap');
    speech.speak(t.captionNoTasks);
    return;
  }

  isReadingAll = true;
  let index = 0;
  playEarcon('tap');

  const btnStop = document.getElementById('btn-stop-speech');
  if (btnStop) {
    btnStop.style.display = 'inline-block';
    btnStop.focus();
  }

  function speakNext(): void {
    if (!isReadingAll || index >= currentActivities.length) {
      isReadingAll = false;
      if (btnStop) btnStop.style.display = 'none';
      const btnReadAll = document.getElementById('btn-read-all');
      if (btnReadAll) btnReadAll.focus();
      playEarcon('success');
      announce(t.captionReadingComplete);
      return;
    }

    const act = currentActivities[index];
    index++;
    const readingAnnounce = currentLang === 'en'
      ? `Reading task ${index} of ${currentActivities.length}: ${act.linear_sentence}`
      : `Membacakan kegiatan ${index} dari ${currentActivities.length}: ${act.linear_sentence}`;
    announce(readingAnnounce);
    speech.speak(act.linear_sentence, undefined, () => {
      setTimeout(speakNext, 300);
    });
  }

  speakNext();
}

function stopAllSpeech(): void {
  const t = getT();
  isReadingAll = false;
  speech.stop();
  playEarcon('tap');
  const btnStop = document.getElementById('btn-stop-speech');
  if (btnStop) btnStop.style.display = 'none';
  const btnReadAll = document.getElementById('btn-read-all');
  if (btnReadAll) btnReadAll.focus();
  announce(t.captionStopped);
}

function openFocusMode(): void {
  const t = getT();
  if (currentActivities.length === 0) {
    playEarcon('alert');
    announce(t.captionNoTasks, 'assertive');
    return;
  }
  playEarcon('tap');
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
    speech.stop();
    playEarcon('tap');
    announce(currentLang === 'en' ? 'Exited focus mode.' : 'Keluar dari mode fokus.');
    const btnFocus = document.getElementById('btn-focus-mode');
    if (btnFocus) btnFocus.focus();
  }
}

function updateFocusDisplay(): void {
  const act = currentActivities[focusIndex];
  if (!act) return;

  const sentenceEl = document.getElementById('focus-sentence');
  if (sentenceEl) {
    sentenceEl.textContent = act.linear_sentence;
  }

  speech.speak(act.linear_sentence);
  const msg = currentLang === 'en'
    ? `Focus mode. Task ${focusIndex + 1} of ${currentActivities.length}: ${act.linear_sentence}`
    : `Mode fokus. Kegiatan ${focusIndex + 1} dari ${currentActivities.length}: ${act.linear_sentence}`;
  announce(msg);
}

// Global Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
  const activeEl = document.activeElement;
  const activeTag = (activeEl?.tagName || '').toLowerCase();
  if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

  if (e.key === 'v' || e.key === 'V') {
    e.preventDefault();
    document.getElementById('btn-voice-add')?.click();
  } else if (e.key === 's' || e.key === 'S') {
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

    const dialogAdd = document.getElementById('dialog-add-activity') as HTMLDialogElement | null;
    if (dialogAdd && dialogAdd.open) {
      dialogAdd.close();
      const btnAdd = document.getElementById('btn-add-activity');
      if (btnAdd) btnAdd.focus();
      return;
    }

    const dialogDel = document.getElementById('dialog-confirm-delete') as HTMLDialogElement | null;
    if (dialogDel && dialogDel.open) {
      dialogDel.close();
      pendingDeleteId = null;
      return;
    }
  }
});

// Setup Listeners
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', unlockAudio, { once: true });
  document.addEventListener('touchstart', unlockAudio, { once: true });

  // Apply default or stored language
  applyLanguage(currentLang);

  // Two-Click / Double-Tap Interceptor for Visually Impaired Assistance
  document.addEventListener('click', (e) => {
    unlockAudio();
    if (!doubleTap.isEnabled()) return;

    // Allow keyboard Enter/Space (e.detail === 0) to execute directly for keyboard users
    if (e.detail === 0) return;

    // Find closest interactive element
    const target = (e.target as HTMLElement).closest(
      'button, a, .activity-linear-item'
    ) as HTMLElement | null;

    if (!target) return;

    // Let the toggle button itself activate on 1 click
    if (target.id === 'btn-toggle-double-tap') return;

    const res = doubleTap.handleClick(target, () => {
      // Second tap proceeds with actual action
    });

    if (!res.shouldExecute) {
      e.preventDefault();
      e.stopPropagation();
      playEarcon('tap');
      speech.speak(res.announcement);
      const captionEl = document.getElementById('speech-caption-text');
      if (captionEl) {
        captionEl.textContent = res.announcement;
      }
      announce(res.announcement);
    }
  }, true);

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.debug('ServiceWorker error:', err);
      });
    });
  }

  // Language Dropdown Selector
  const selectLang = document.getElementById('select-speech-lang') as HTMLSelectElement | null;
  selectLang?.addEventListener('change', () => {
    const val = selectLang.value;
    const newLang: SupportedLang = val.startsWith('id') ? 'id' : 'en';
    applyLanguage(newLang);
    playEarcon('success');
    const msg = newLang === 'en' ? 'Language switched to English.' : 'Bahasa diubah ke Indonesia.';
    speech.speak(msg);
    announce(msg);
  });

  // Double-Tap Assist Toggle Button
  const btnToggleDT = document.getElementById('btn-toggle-double-tap');
  btnToggleDT?.addEventListener('click', () => {
    const newState = !doubleTap.isEnabled();
    doubleTap.setEnabled(newState);
    btnToggleDT.setAttribute('aria-pressed', String(newState));
    const t = getT();
    btnToggleDT.textContent = newState ? t.btnDoubleTapActive : t.btnDoubleTapInactive;
    btnToggleDT.setAttribute(
      'aria-label',
      newState ? `${t.btnDoubleTapActive}, click to toggle` : `${t.btnDoubleTapInactive}, click to toggle`
    );
    playEarcon(newState ? 'success' : 'tap');
    const msg = newState ? t.doubleTapActiveAnnounce : t.doubleTapNormalAnnounce;
    speech.speak(msg);
    announce(msg);
  });

  // Voice Add Button
  document.getElementById('btn-voice-add')?.addEventListener('click', () => {
    unlockAudio();
    voiceInput.startListening(
      storageRepo,
      speech,
      playEarcon,
      (newAct) => {
        loadActivities(newAct.date);
      },
      (err) => {
        announce(err, 'assertive');
      },
      currentLang
    );
  });

  // Audio Test Button
  document.getElementById('btn-test-audio')?.addEventListener('click', () => {
    const t = getT();
    unlockAudio();
    playEarcon('success');
    speech.speak(t.testAudioMessage);
    const captionEl = document.getElementById('speech-caption-text');
    if (captionEl) {
      captionEl.textContent = t.testAudioMessage;
    }
    announce(t.audioWorkingAnnounce);
  });

  // Date picker
  const inputDate = document.getElementById('input-date') as HTMLInputElement | null;
  inputDate?.addEventListener('change', () => {
    loadActivities(inputDate.value);
  });

  // Toolbar Actions
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
    const t = getT();
    const title = (document.getElementById('act-title') as HTMLInputElement).value;
    const date = (document.getElementById('act-date') as HTMLInputElement).value;
    const start_time = (document.getElementById('act-time') as HTMLInputElement).value;
    const duration_min = Number((document.getElementById('act-duration') as HTMLInputElement).value);
    const location = (document.getElementById('act-location') as HTMLInputElement).value;
    const notes = (document.getElementById('act-notes') as HTMLTextAreaElement).value;

    const newAct = storageRepo.addActivity({
      title,
      date,
      start_time,
      duration_min,
      location,
      notes
    }, currentLang);

    fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, date, start_time, duration_min, location, notes })
    }).catch(() => {});

    playEarcon('success');
    announce(t.taskAddedManualAnnounce);
    const confirmMsg = currentLang === 'en'
      ? `Task added successfully. ${newAct.linear_sentence}`
      : `Kegiatan berhasil ditambahkan. ${newAct.linear_sentence}`;
    speech.speak(confirmMsg);

    if (dialogAdd) dialogAdd.close();
    formAddActivity.reset();
    await loadActivities(date);
  });

  // High contrast mode toggle
  const btnContrast = document.getElementById('btn-toggle-contrast');
  btnContrast?.addEventListener('click', () => {
    const isHC = document.body.classList.toggle('high-contrast');
    btnContrast.setAttribute('aria-pressed', String(isHC));
    const t = getT();
    btnContrast.textContent = isHC ? t.btnContrastActive : t.btnContrast;
    announce(isHC ? t.highContrastActiveAnnounce : t.highContrastNormalAnnounce);
  });

  // Font size toggle
  const btnFontSize = document.getElementById('btn-font-size');
  btnFontSize?.addEventListener('click', () => {
    fontSizeStep = (fontSizeStep + 1) % 3;
    document.body.classList.remove('font-large', 'font-xlarge');
    const t = getT();

    if (fontSizeStep === 0) {
      btnFontSize.textContent = t.btnFontMedium;
      btnFontSize.setAttribute('aria-label', `${t.btnFontMedium}, click to toggle`);
      announce(currentLang === 'en' ? 'Font size changed to medium.' : 'Ukuran huruf diubah ke sedang.');
    } else if (fontSizeStep === 1) {
      document.body.classList.add('font-large');
      btnFontSize.textContent = t.btnFontLarge;
      btnFontSize.setAttribute('aria-label', `${t.btnFontLarge}, click to toggle`);
      announce(currentLang === 'en' ? 'Font size changed to large.' : 'Ukuran huruf diubah ke besar.');
    } else {
      document.body.classList.add('font-xlarge');
      btnFontSize.textContent = t.btnFontXLarge;
      btnFontSize.setAttribute('aria-label', `${t.btnFontXLarge}, click to toggle`);
      announce(currentLang === 'en' ? 'Font size changed to extra large.' : 'Ukuran huruf diubah ke sangat besar.');
    }
  });

  // Speech rate dropdown
  const selectRate = document.getElementById('select-speech-rate') as HTMLSelectElement | null;
  selectRate?.addEventListener('change', () => {
    const rate = parseFloat(selectRate.value);
    speech.setRate(rate);
    const msg = currentLang === 'en' ? `Speech speed set to ${rate}x.` : `Kecepatan pembacaan suara diubah ke ${rate} kali.`;
    announce(msg);
  });

  // Confirm delete dialog listeners
  document.getElementById('btn-confirm-delete-yes')?.addEventListener('click', async () => {
    const dialog = document.getElementById('dialog-confirm-delete') as HTMLDialogElement | null;
    if (dialog) dialog.close();
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    pendingDeleteId = null;

    storageRepo.deleteActivity(id);
    fetch(`/api/activities/${id}`, { method: 'DELETE' }).catch(() => {});

    playEarcon('success');
    const t = getT();
    announce(t.taskDeletedAnnounce);
    await loadActivities();
  });

  document.getElementById('btn-confirm-delete-no')?.addEventListener('click', () => {
    const dialog = document.getElementById('dialog-confirm-delete') as HTMLDialogElement | null;
    if (dialog) dialog.close();
    pendingDeleteId = null;
  });
});
