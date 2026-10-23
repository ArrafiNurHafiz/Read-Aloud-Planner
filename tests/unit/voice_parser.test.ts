import { describe, it, expect } from 'vitest';
import { parseVoiceSchedule } from '../../src/frontend/voice_parser.js';

describe('Voice Schedule Parser', () => {
  const baseDate = new Date('2026-10-26T00:00:00'); // Monday

  it('parses title, time, duration, and location from natural Indonesian speech', () => {
    const speech = 'Kuliah Basis Data jam 8 pagi selama 2 jam di ruang 301';
    const result = parseVoiceSchedule(speech, baseDate);

    expect(result.title).toBe('Kuliah Basis Data');
    expect(result.start_time).toBe('08:00');
    expect(result.duration_min).toBe(120);
    expect(result.location).toBe('ruang 301');
    expect(result.date).toBe('2026-10-26');
  });

  it('handles "besok" date modifier and 24-hour time format', () => {
    const speech = 'Rapat organisasi BEM besok jam 14.00 di aula lantai 2';
    const result = parseVoiceSchedule(speech, baseDate);

    expect(result.title).toBe('Rapat organisasi BEM');
    expect(result.date).toBe('2026-10-27');
    expect(result.start_time).toBe('14:00');
    expect(result.duration_min).toBe(60); // default 60 mins
    expect(result.location).toBe('aula lantai 2');
  });

  it('handles "jam 2 siang" and "30 menit" duration', () => {
    const speech = 'Konsultasi Dosen jam 2 siang selama 30 menit di zoom';
    const result = parseVoiceSchedule(speech, baseDate);

    expect(result.title).toBe('Konsultasi Dosen');
    expect(result.start_time).toBe('14:00');
    expect(result.duration_min).toBe(30);
    expect(result.location).toBe('zoom');
  });

  it('handles "jam 7 malam" and "pukul 19.30"', () => {
    const speech = 'Belajar mandiri jam 7 malam selama 1 jam 30 menit';
    const result = parseVoiceSchedule(speech, baseDate);

    expect(result.title).toBe('Belajar mandiri');
    expect(result.start_time).toBe('19:00');
    expect(result.duration_min).toBe(90);
    expect(result.location).toBe('');
  });

  it('handles minimal voice command with defaults', () => {
    const speech = 'Tugas Algoritma';
    const result = parseVoiceSchedule(speech, baseDate);

    expect(result.title).toBe('Tugas Algoritma');
    expect(result.date).toBe('2026-10-26');
    expect(result.duration_min).toBe(60);
    expect(result.location).toBe('');
  });

  it('parses English speech: title, tomorrow, time AM/PM, duration and location', () => {
    const speech = 'Database Lecture tomorrow at 9 AM for 2 hours in room 301';
    const result = parseVoiceSchedule(speech, baseDate, 'en');

    expect(result.title).toBe('Database Lecture');
    expect(result.date).toBe('2026-10-27');
    expect(result.start_time).toBe('09:00');
    expect(result.duration_min).toBe(120);
    expect(result.location).toBe('room 301');
  });

  it('parses English afternoon meeting with minutes duration', () => {
    const speech = 'Project review at 2 PM for 30 minutes in Zoom';
    const result = parseVoiceSchedule(speech, baseDate, 'en');

    expect(result.title).toBe('Project review');
    expect(result.date).toBe('2026-10-26');
    expect(result.start_time).toBe('14:00');
    expect(result.duration_min).toBe(30);
    expect(result.location).toBe('Zoom');
  });
});
