import { describe, it, expect } from 'vitest';
import { formatLinearSentence, type ActivityData } from '../../src/services/formatter.js';

describe('formatLinearSentence', () => {
  it('formats an active activity in Indonesian correctly', () => {
    const act: ActivityData = {
      title: 'Kuliah Basis Data',
      date: '2026-10-26',
      start_time: '08:00',
      duration_min: 120,
      location: 'ruang 301',
      notes: 'Bawa laptop',
      done: false
    };

    const result = formatLinearSentence(act, 'id');
    expect(result).toBe('Senin, 08.00, Kuliah Basis Data, 2 jam, ruang 301.');
  });

  it('formats a completed activity with textual checkmark', () => {
    const act: ActivityData = {
      title: 'Konsultasi Dosen',
      date: '2026-10-27',
      start_time: '09:00',
      duration_min: 30,
      location: 'ruang 204',
      notes: '',
      done: true
    };

    const result = formatLinearSentence(act, 'id');
    expect(result).toBe('Selasa, 09.00, Konsultasi Dosen, 30 menit, ruang 204. Selesai.');
  });

  it('formats activity with hours and minutes duration without location', () => {
    const act: ActivityData = {
      title: 'Tugas Kelompok',
      date: '2026-10-26',
      start_time: '13:00',
      duration_min: 90,
      location: '',
      notes: '',
      done: false
    };

    const result = formatLinearSentence(act, 'id');
    expect(result).toBe('Senin, 13.00, Tugas Kelompok, 1 jam 30 menit.');
  });
});
