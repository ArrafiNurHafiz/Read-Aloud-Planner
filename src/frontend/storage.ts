import { formatLinearSentence } from '../services/formatter.js';

export interface ActivityItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  duration_min: number;
  location: string;
  notes: string;
  done: boolean;
  linear_sentence: string;
}

const STORAGE_KEY = 'readaloud_activities_v1';

export class LocalStorageRepository {
  private storage: Storage;

  constructor(customStorage?: Storage) {
    if (customStorage) {
      this.storage = customStorage;
    } else if (typeof window !== 'undefined' && window.localStorage) {
      this.storage = window.localStorage;
    } else {
      // Memory fallback for non-browser
      const mem: Record<string, string> = {};
      this.storage = {
        getItem: (k: string) => mem[k] || null,
        setItem: (k: string, v: string) => { mem[k] = v; },
        removeItem: (k: string) => { delete mem[k]; },
        clear: () => { for (const k in mem) delete mem[k]; },
        key: () => null,
        length: 0
      };
    }
    this.ensureSeedData();
  }

  private ensureSeedData() {
    const raw = this.storage.getItem(STORAGE_KEY);
    if (!raw) {
      const today = new Date().toISOString().split('T')[0];
      const seedActivities: ActivityItem[] = [
        {
          id: 'seed-1',
          title: 'Kuliah Basis Data',
          date: today,
          start_time: '08:00',
          duration_min: 120,
          location: 'ruang 301',
          notes: 'Membahas normalisasi basis data relasional.',
          done: false,
          linear_sentence: formatLinearSentence({
            title: 'Kuliah Basis Data',
            date: today,
            start_time: '08:00',
            duration_min: 120,
            location: 'ruang 301',
            notes: 'Membahas normalisasi basis data relasional.',
            done: false
          }, 'id')
        },
        {
          id: 'seed-2',
          title: 'Konsultasi Dosen Pembimbing',
          date: today,
          start_time: '13:00',
          duration_min: 30,
          location: 'ruang 204',
          notes: 'Diskusi rencana skripsi aksesibilitas.',
          done: false,
          linear_sentence: formatLinearSentence({
            title: 'Konsultasi Dosen Pembimbing',
            date: today,
            start_time: '13:00',
            duration_min: 30,
            location: 'ruang 204',
            notes: 'Diskusi rencana skripsi aksesibilitas.',
            done: false
          }, 'id')
        },
        {
          id: 'seed-3',
          title: 'Tugas Kelompok Jaringan',
          date: today,
          start_time: '16:00',
          duration_min: 90,
          location: 'Perpustakaan',
          notes: 'Simulasi konfigurasi routing IPv6.',
          done: true,
          linear_sentence: formatLinearSentence({
            title: 'Tugas Kelompok Jaringan',
            date: today,
            start_time: '16:00',
            duration_min: 90,
            location: 'Perpustakaan',
            notes: 'Simulasi konfigurasi routing IPv6.',
            done: true
          }, 'id')
        }
      ];
      this.storage.setItem(STORAGE_KEY, JSON.stringify(seedActivities));
    }
  }

  public getAll(): ActivityItem[] {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public getActivitiesByDate(date: string): ActivityItem[] {
    const all = this.getAll();
    return all
      .filter((a) => a.date === date)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }

  public addActivity(input: {
    title: string;
    date: string;
    start_time: string;
    duration_min: number;
    location?: string;
    notes?: string;
  }): ActivityItem {
    const all = this.getAll();
    const id = 'act-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const location = input.location || '';
    const notes = input.notes || '';
    const linear = formatLinearSentence({
      title: input.title,
      date: input.date,
      start_time: input.start_time,
      duration_min: input.duration_min,
      location,
      notes,
      done: false
    }, 'id');

    const newItem: ActivityItem = {
      id,
      title: input.title,
      date: input.date,
      start_time: input.start_time,
      duration_min: input.duration_min,
      location,
      notes,
      done: false,
      linear_sentence: linear
    };

    all.push(newItem);
    this.storage.setItem(STORAGE_KEY, JSON.stringify(all));
    return newItem;
  }

  public updateActivity(id: string, updates: Partial<ActivityItem>): ActivityItem | null {
    const all = this.getAll();
    const idx = all.findIndex((a) => a.id === id);
    if (idx === -1) return null;

    const current = all[idx];
    const updated: ActivityItem = {
      ...current,
      ...updates
    };

    updated.linear_sentence = formatLinearSentence({
      title: updated.title,
      date: updated.date,
      start_time: updated.start_time,
      duration_min: updated.duration_min,
      location: updated.location,
      notes: updated.notes,
      done: updated.done
    }, 'id');

    all[idx] = updated;
    this.storage.setItem(STORAGE_KEY, JSON.stringify(all));
    return updated;
  }

  public deleteActivity(id: string): boolean {
    const all = this.getAll();
    const filtered = all.filter((a) => a.id !== id);
    if (filtered.length === all.length) return false;
    this.storage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  }
}
