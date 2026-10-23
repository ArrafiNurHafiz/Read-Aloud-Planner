import { describe, it, expect } from 'vitest';
import { generateICS, parseICS, type CalendarEvent } from '../../src/services/ical.js';

describe('iCalendar Service', () => {
  const sampleEvents: CalendarEvent[] = [
    {
      id: 'act-1',
      title: 'Kuliah Basis Data',
      date: '2026-10-26',
      start_time: '08:00',
      duration_min: 120,
      location: 'ruang 301',
      notes: 'Bawa catatan'
    }
  ];

  it('generates valid RFC 5545 VCALENDAR stream', () => {
    const ics = generateICS(sampleEvents);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('SUMMARY:Kuliah Basis Data');
    expect(ics).toContain('DTSTART:20261026T080000');
    expect(ics).toContain('DTEND:20261026T100000');
    expect(ics).toContain('LOCATION:ruang 301');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('parses valid ICS stream back into events', () => {
    const ics = generateICS(sampleEvents);
    const parsed = parseICS(ics);
    expect(parsed.length).toBe(1);
    expect(parsed[0].title).toBe('Kuliah Basis Data');
    expect(parsed[0].date).toBe('2026-10-26');
    expect(parsed[0].start_time).toBe('08:00');
    expect(parsed[0].duration_min).toBe(120);
    expect(parsed[0].location).toBe('ruang 301');
  });
});
