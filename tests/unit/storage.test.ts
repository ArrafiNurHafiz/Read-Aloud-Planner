import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageRepository, type ActivityItem } from '../../src/frontend/storage.js';

describe('LocalStorageRepository', () => {
  let repo: LocalStorageRepository;
  const mockStorage: Record<string, string> = {};

  beforeEach(() => {
    // In-memory mock storage
    for (const key in mockStorage) delete mockStorage[key];
    const storageImpl = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, val: string) => { mockStorage[key] = val; },
      removeItem: (key: string) => { delete mockStorage[key]; }
    };
    repo = new LocalStorageRepository(storageImpl as any);
  });

  it('initializes with seed data if storage is empty', () => {
    const all = repo.getAll();
    expect(all.length).toBeGreaterThanOrEqual(1);
    expect(all[0].linear_sentence).toBeDefined();
  });

  it('adds an activity and persists it correctly', () => {
    const act = repo.addActivity({
      title: 'Workshop TypeScript',
      date: '2026-10-26',
      start_time: '10:00',
      duration_min: 90,
      location: 'Lab 1',
      notes: 'Bawa charger'
    });

    expect(act.id).toBeDefined();
    expect(act.title).toBe('Workshop TypeScript');
    expect(act.linear_sentence).toContain('Workshop TypeScript');

    const list = repo.getActivitiesByDate('2026-10-26');
    const found = list.find(a => a.id === act.id);
    expect(found).toBeDefined();
  });

  it('toggles done status and updates linear sentence', () => {
    const act = repo.addActivity({
      title: 'Konsultasi',
      date: '2026-10-26',
      start_time: '11:00',
      duration_min: 30,
      location: 'Ruang 10'
    });

    const updated = repo.updateActivity(act.id, { done: true }, 'id');
    expect(updated?.done).toBe(true);
    expect(updated?.linear_sentence).toContain('Selesai');
  });

  it('deletes an activity by id', () => {
    const act = repo.addActivity({
      title: 'Kegiatan Sementara',
      date: '2026-10-26',
      start_time: '15:00',
      duration_min: 30
    });

    const deleted = repo.deleteActivity(act.id);
    expect(deleted).toBe(true);
    const list = repo.getActivitiesByDate('2026-10-26');
    expect(list.find(a => a.id === act.id)).toBeUndefined();
  });
});
